import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../../styles/StudentDashboard.css';
import '../../../styles/StudentQuizPage.css';
import '../../../styles/DocumentViewerPage.css';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentViewer from './DocumentViewer';
import useDocOptions from './useDocOptions';
import { API_BASE_URL } from '../../../utils/api';

function StudentQuizPage({ classInfo }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  // Quiz data states
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState(1);
  const [timer, setTimer] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMuiModal, setShowMuiModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, message: '', goTo: '' });
  const sessionKey = `quizState:${quizId}`;

  // Hook parser phải được gọi trước mọi early return
  const BACKEND_ORIGIN_PARSER = (() => {
    try { return new URL(API_BASE_URL).origin; } catch (_) { return ''; }
  })();
  const descForParser = (typeof (/* may be null initially */ (typeof quiz === 'object' && quiz) ? quiz.description : '') === 'string')
    ? (quiz && quiz.description) : '';
  let docUrlForParser = '';
  try {
    if (descForParser) {
      const mAbs = descForParser.match(/https?:\/\/[^\s)]+/i);
      if (mAbs && mAbs[0]) {
        docUrlForParser = mAbs[0];
      } else {
        const mRel = descForParser.match(/(?:^|\s)(\/uploads\/[\w\-./%]+\.(?:docx?))(?:\s|$)/i);
        if (mRel && mRel[1]) {
          const path = mRel[1].startsWith('/') ? mRel[1] : `/${mRel[1]}`;
          if (BACKEND_ORIGIN_PARSER) docUrlForParser = `${BACKEND_ORIGIN_PARSER}${path}`;
        }
      }
    }
  } catch (_) {}
  const docOptionsMap = useDocOptions(docUrlForParser);

  // Load quiz data from backend
  const loadQuizData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/quiz/${quizId}/take`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setTimeLimit(data.quiz.time_limit);
        // Initialize answers object
        const initialAnswers = {};
        data.questions.forEach(q => {
          initialAnswers[q.id] = null;
        });
        setAnswers(initialAnswers);
      } else {
setError(data.message);
      }
    } catch (error) {
      console.error('Load quiz error:', error);
      setError('Không thể tải bài tập');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  // Load quiz data when component mounts
  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  // Restore UI state (selectedQuestion) from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.selectedQuestion === 'number') {
          setSelectedQuestion(parsed.selectedQuestion);
        }
      }
    } catch (_) {}
  }, [sessionKey]);

  // Auto-start attempt immediately after quiz loads
  useEffect(() => {
    const autoStart = async () => {
      if (!loading && quiz && !attemptId && !isStarting) {
        try {
          setIsStarting(true);
          const id = await startQuizAttempt();
          if (!id) {
            // If cannot start, keep error handled in startQuizAttempt
          }
        } finally {
          setIsStarting(false);
        }
      }
    };
    autoStart();
  }, [loading, quiz, attemptId]);

  // Fetch saved answers for an attempt and merge into local state
  const loadSavedAnswers = useCallback(async (attemptIdToUse) => {
    const effAttempt = attemptIdToUse || attemptId;
    if (!effAttempt) return;
    try {
      const r = await fetch(`/api/assignments/quiz/attempt/${effAttempt}/answers`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (!r.ok) return;
      const j = await r.json();
      if (!j || !Array.isArray(j.answers)) return;
      setAnswers(prev => {
        const merged = { ...(prev || {}) };
        j.answers.forEach(a => {
          if (a && a.question_id != null) {
            merged[a.question_id] = a.selected_option_id != null ? a.selected_option_id : null;
          }
        });
        return merged;
      });
    } catch (e) {
      console.warn('Load saved answers failed:', e);
    }
  }, [attemptId]);

  // Report leaving the quiz page (blur/hidden) to backend
  const leaveThrottleRef = useRef(0);
  const reportLeaveOnce = useCallback(async () => {
    if (!attemptId) return;
    const now = Date.now();
    // throttle: at most once per 3 seconds (temp for debugging)
    if (now - (leaveThrottleRef.current || 0) < 3000) return;
    leaveThrottleRef.current = now;
    try {
      console.log('[LEAVE] reporting leave for attempt', attemptId, 'at', new Date().toISOString());
      await fetch(`/api/assignments/quiz/attempt/${attemptId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      console.log('[LEAVE] reported successfully');
    } catch (e) {
      console.warn('[LEAVE] report failed', e);
    }
  }, [attemptId]);

  // keepalive variant for beforeunload
const reportLeaveKeepalive = useCallback(() => {
    try {
      if (!attemptId) return;
      const token = sessionStorage.getItem('token');
      // Best-effort: browsers may drop headers in keepalive in some cases; still try.
      fetch(`/api/assignments/quiz/attempt/${attemptId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }, [attemptId]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        reportLeaveOnce();
      }
    };
    const onBlur = () => reportLeaveOnce();
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reportLeaveOnce]);

  // Submit quiz (placed before timer effect to avoid TDZ)
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1) Flush all selected answers to backend to avoid missing saves
      const entries = Object.entries(answers || {});
      const toSave = entries.filter(([qid, optId]) => optId != null);
      if (toSave.length > 0) {
        await Promise.all(
          toSave.map(([qid, optId]) =>
            saveAnswer(attemptId, Number(qid), optId)
          )
        );
      }

      // 2) Submit attempt
      const response = await fetch(`/api/assignments/quiz/attempt/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const code = (classInfo && (classInfo.classCode || classInfo.code)) || 'GKMCO';
        const target = `/student/class/${code}/quiz/${quizId}/result/${attemptId}`;
        if (!isAutoSubmit) {
          setSuccessModal({ open: true, message: 'Nộp bài thành công!', goTo: target });
        } else {
          navigate(target);
        }
      } else {
        console.warn('Submit failed:', data.message);
      }
    } catch (error) {
      console.error('Submit quiz error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, isSubmitting, navigate, classInfo, quizId, answers]);

  // Timer effect
  useEffect(() => {
    if (attemptId && timeLimit > 0) {
      const interval = setInterval(() => {
        setTimer(t => {
          const newTime = t + 1;
          // Auto submit when time limit reached
          if (newTime >= timeLimit * 60) {
            handleSubmit(true); // Auto submit
            return newTime;
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
}, [attemptId, timeLimit, handleSubmit]);

  // Persist lightweight UI state while working
  useEffect(() => {
    try {
      const snapshot = {
        attemptId,
        selectedQuestion,
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(snapshot));
    } catch (_) {}
  }, [attemptId, selectedQuestion, sessionKey]);

  // Warn before leaving the page when attempt is in progress
  useEffect(() => {
    if (!attemptId) return;
    const handleBeforeUnload = (e) => {
      // Best-effort record leave
      reportLeaveKeepalive();
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attemptId, reportLeaveKeepalive]);

  // Block browser back/forward while attempt is in progress (in-app navigation via history)
  useEffect(() => {
    if (!attemptId) return;
    const handlePopState = (e) => {
      const ok = window.confirm('Bạn đang làm bài. Rời khỏi trang có thể mất tiến trình. Bạn có chắc muốn rời?');
      if (!ok) {
        // Push state again to stay on the page
        window.history.pushState(null, '', window.location.href);
      }
    };
    // Push a new state so that the first Back triggers popstate here
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [attemptId]);

  

  // Start quiz attempt
  const startQuizAttempt = async () => {
    try {
      const response = await fetch(`/api/assignments/quiz/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setAttemptId(data.attemptId);
        // Cập nhật timeLimit nếu backend trả về
        if (typeof data.timeLimit === 'number') {
          setTimeLimit(data.timeLimit);
        }
        // Tính thời gian đã trôi qua từ startedAt để timer không bị reset khi reload
        const startedAtIso = data.startedAt;
        if (startedAtIso) {
          const startedMs = new Date(startedAtIso).getTime();
          const nowMs = Date.now();
          const elapsed = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
          setTimer(elapsed);
          // Nếu đã hết giờ khi quay lại, tự động nộp bài
          const limitSec = (typeof data.timeLimit === 'number' ? data.timeLimit : timeLimit) * 60;
          if (limitSec > 0 && elapsed >= limitSec) {
            // đảm bảo thực hiện sau khi state attemptId cập nhật
            setTimeout(() => handleSubmit(true), 0);
          }
        } else {
          // Không có startedAt (vừa tạo), coi như bắt đầu từ bây giờ
          setTimer(0);
        }
// Restore saved answers (covers both resumed and new attempts where some answers already saved)
        loadSavedAnswers(data.attemptId);
        return data.attemptId;
      } else {
        console.warn('Không thể bắt đầu làm bài:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Start quiz error:', error);
      return null;
    }
  };

  // Save answer to backend
  const saveAnswer = async (attemptIdToUse, questionId, selectedOptionId) => {
    const effectiveAttemptId = attemptIdToUse || attemptId;
    if (!effectiveAttemptId) return false;

    try {
      const resp = await fetch(`/api/assignments/quiz/attempt/${effectiveAttemptId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ questionId, selectedOptionId })
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        console.warn('Save answer failed:', resp.status, j);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Save answer error:', error);
      return false;
    }
  };

  

  // Hàm format thời gian linh hoạt
  function formatTime(sec) {
    if (sec < 60) return `${sec} giây`;
    if (sec < 3600) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m} phút${s > 0 ? ` ${s} giây` : ''}`;
    }
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h} giờ${m > 0 ? ` ${m} phút` : ''}`;
  }

  // Handle option selection
  const handleOptionClick = async (optionId) => {
    let curAttemptId = attemptId;
    if (!curAttemptId) {
      // Auto-start attempt on first choice
      curAttemptId = await startQuizAttempt();
      if (!curAttemptId) return;
      // Just in case, ensure saved answers are loaded (startQuizAttempt already calls, this is idempotent)
      loadSavedAnswers(curAttemptId);
    }

    const currentQuestion = questions[selectedQuestion - 1];
    if (!currentQuestion) return;

    // Update local state immediately for UI responsiveness
    const newAnswers = { ...answers };
    newAnswers[currentQuestion.id] = optionId;
    setAnswers(newAnswers);

    // Persist to backend with the effective attempt id
    await saveAnswer(curAttemptId, currentQuestion.id, optionId);
  };

  // Handle question navigation
  const handleQuestionSelect = (questionIndex) => {
    setSelectedQuestion(questionIndex + 1);
  };

  // Get current question
  const getCurrentQuestion = () => {
    return questions[selectedQuestion - 1] || null;
  };

  // Get selected option for current question
  const getSelectedOption = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    return answers[currentQuestion.id] || null;
  };
// Get selected option letter for a question (A/B/C/D)
  const getSelectedLetterForQuestion = (question) => {
    const selectedId = answers[question.id];
    if (!selectedId) return null;
    const idx = (question.options || []).findIndex(o => o.id === selectedId);
    if (idx < 0) return null;
    return String.fromCharCode(65 + idx);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>
          <h3>Lỗi</h3>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Quay lại</button>
        </div>
      </div>
    );
  }

  // No quiz data
  if (!quiz || questions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Không tìm thấy bài tập</div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const selectedOptionId = getSelectedOption();
  const remainingTime = Math.max(0, (timeLimit * 60) - timer);
  // Trong lúc làm bài, luôn ẩn nội dung phương án để tránh lộ đáp án. Trước khi bắt đầu thì hiển thị đầy đủ.
  const shouldMaskOptions = !!attemptId;


  // Helper: extract URLs from a text (support absolute http(s) and root-relative "/path")
  const extractUrls = (text) => {
    if (!text || typeof text !== 'string') return [];
    const result = [];
    // 1) absolute http(s)
    const reAbs = /https?:\/\/[^^\s)]+/gi;
    let m1;
    while ((m1 = reAbs.exec(text)) !== null) {
      result.push(m1[0]);
    }
    // 2) root-relative paths like /uploads/file.pdf
    const reRel = /(?:^|\s)(\/[\w\-./%]+\.(?:pdf|docx?|pptx?|xlsx?))(?:\s|$)/gi;
    let m2;
    while ((m2 = reRel.exec(text)) !== null) {
      const p = (m2[1] || '').trim();
      if (p) result.push(p);
    }
    return result;
  };

  // Helper: build Google Form embed url
  const toGoogleFormEmbed = (url) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (!u.hostname.includes('docs.google.com') || !u.pathname.includes('/forms')) return '';
      // Normalize to viewform
      let path = u.pathname;
      path = path.replace(/\/edit$/, '/viewform');
      if (!/\/viewform($|\?)/.test(path)) {
        // If not viewform, try appending
        if (path.endsWith('/')) path += 'viewform'; else path += '/viewform';
      }
      u.pathname = path;
      // Ensure embedded=true
      const params = u.searchParams;
      if (!params.has('embedded')) params.set('embedded', 'true');
      u.search = params.toString();
      return u.toString();
    } catch (_) {
      return '';
    }
  };

  const urlsInDesc = extractUrls(quiz.description || '');
const BACKEND_ORIGIN = (() => {
    try { return new URL(API_BASE_URL).origin; } catch (_) { return ''; }
  })();
  const toAbsolute = (u) => {
    if (!u) return '';
    try {
      if (/^https?:\/\//i.test(u)) {
        // Nếu là URL tuyệt đối nhưng trỏ về frontend origin và path là /uploads, chuyển sang backend origin
        try {
          const parsed = new URL(u);
          const isUploads = parsed.pathname.startsWith('/uploads');
          const frontHosts = ['localhost:3000', '127.0.0.1:3000'];
          const isFront = frontHosts.includes(parsed.host);
          if (isUploads && isFront && BACKEND_ORIGIN) {
            return `${BACKEND_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
          }
        } catch (_) {}
        return u;
      }
      const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
      // Nếu là file tĩnh do backend phục vụ (uploads), trỏ về backend origin
      const isUploads = u.startsWith('/uploads');
      const targetOrigin = isUploads && BACKEND_ORIGIN ? BACKEND_ORIGIN : origin;
      if (!targetOrigin) return u;
      const path = u.startsWith('/') ? u : `/${u}`;
      return `${targetOrigin}${path}`;
    } catch (_) { return u; }
  };
  const googleFormUrl = (urlsInDesc || []).find(u => /docs\.google\.com\/forms/i.test(u)) || '';
  const googleFormEmbedUrl = toGoogleFormEmbed(googleFormUrl);
  const firstUrlInDesc = urlsInDesc[0] ? toAbsolute(urlsInDesc[0]) : '';
  console.log('[StudentQuiz] urlsInDesc=', urlsInDesc, 'googleFormEmbedUrl=', googleFormEmbedUrl);

  return (
    <div className="quiz-page-container">
      <div className="student-quiz-layout" style={{ gap: 0 }}>
        {/* Bên trái: Google Form (nếu có) hoặc Document Viewer */}
        <div className="student-quiz-left" style={{ position: 'relative', height: '100vh', width: '100%', padding: 0, margin: 0, display: 'flex', alignItems: 'stretch', justifyContent: 'stretch' }}>
          {googleFormEmbedUrl ? (
            <>
              <iframe
                title="Google Form"
                src={googleFormEmbedUrl}
                style={{ width: '100%', height: '100%', border: '0' }}
                allow="clipboard-write; autoplay; fullscreen"
              />
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <a href={googleFormEmbedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1976d2' }}>Mở form trong tab mới</a>
              </div>
            </>
          ) : (
            firstUrlInDesc ? (
              <DocumentViewer
                src={firstUrlInDesc}
                title={quiz.title || 'Document'}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#607d8b' }}>
                Không có tài liệu/Google Form trong mô tả bài.
</div>
            )
          )}
        </div>
        <div className="student-quiz-right-placeholder student-quiz-right">
          {/* Header thời gian + tên học sinh */}
          <div className="quiz-header-time" style={{ textAlign: 'center' }}>
            {timeLimit > 0 ? (
              <>
                Thời gian còn lại<br />
                <span className={`quiz-timer-value ${remainingTime < 300 ? 'warning' : ''}`}>
                  {formatTime(remainingTime)}
                </span>
              </>
            ) : (
              <>
                Thời gian làm bài<br />
                <span className="quiz-timer-value">{formatTime(timer)}</span>
              </>
            )}
          </div>
          
          <div className="quiz-student-box">
            <span className="quiz-student-avatar">{JSON.parse(sessionStorage.getItem('user') || '{}')?.username?.charAt(0).toUpperCase() || 'S'}</span>
            <span className="quiz-student-name">{JSON.parse(sessionStorage.getItem('user') || '{}')?.full_name || 'Học sinh'}</span>
          </div>
          
          {!attemptId ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h3>{quiz.title}</h3>
              <p>{quiz.description}</p>
              <p>Số câu hỏi: {questions.length}</p>
              <p>Thời gian: {quiz.time_limit} phút</p>
              <div style={{ marginTop: '16px', opacity: 0.8 }}>Đang bắt đầu bài làm...</div>
            </div>
          ) : (
            <>
              <div className="quiz-question-title">
                Câu {selectedQuestion}: {currentQuestion?.question_text}
              </div>
              
              <div className="quiz-answer-sheet-label">Phiếu trả lời</div>
              <div className="quiz-answer-sheet">
                {questions.map((question, index) => {
                  const questionNumber = index + 1;
                  const hasAnswer = answers[question.id] !== null;
                  const selectedLetter = getSelectedLetterForQuestion(question);
                  return (
                    <button
                      key={question.id}
                      className={`quiz-answer-cell${
                        selectedQuestion === questionNumber ? ' selected' : ''
                      }${hasAnswer ? ' answered' : ''}`}
                      onClick={() => handleQuestionSelect(index)}
                    >
                      <span className="quiz-answer-cell-number">{questionNumber}</span>
                      {selectedLetter && (
                        <span className="quiz-answer-cell-letter">{selectedLetter}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {currentQuestion && (
                <div className="quiz-options-section">
                  <div className="quiz-question-options">
{(currentQuestion.options || []).map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                      const isSelected = selectedOptionId === option.id;
                      const parsedForQuestion = docOptionsMap?.[selectedQuestion] || null;
                      const parsedText = parsedForQuestion ? parsedForQuestion[optionLetter] : null;
                      return (
                        <button
                          key={option.id}
                          className={`quiz-option-full ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleOptionClick(option.id)}
                        >
                          <span className="option-letter">{optionLetter}.</span>
                          {(!shouldMaskOptions) ? (
                            <span className="option-text">{option.text}</span>
                          ) : parsedText ? (
                            <span className="option-text">{parsedText}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="quiz-sticky-footer">
                <div className="quiz-options-row">
                  {currentQuestion && (currentQuestion.options || []).map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isSelected = selectedOptionId === option.id;
                    return (
                      <button 
                        key={option.id}
                        className={`quiz-option-btn ${isSelected ? 'selected' : ''}`} 
                        onClick={() => handleOptionClick(option.id)}
                      >
                        {optionLetter}
                      </button>
                    );
                  })}
                </div>
                <div className="quiz-actions">
                  <button className="quiz-btn leave" onClick={() => setShowMuiModal(true)}>Rời khỏi</button>
                  <button 
                    className="quiz-btn submit" 
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Nộp bài...' : 'Nộp bài'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {showMuiModal && (
        <div className="mui-modal-overlay">
          <div className="mui-modal-content">
            <div className="mui-modal-title">Lưu ý</div>
            <hr className="mui-modal-divider" style={{ marginBottom: 8 }} />
            <div className="mui-modal-body">
              Rời khỏi sẽ tính vào số lần rời màn hình làm bài. Bạn có muốn thoát khỏi trang làm bài hiện tại ?
            </div>
<hr className="mui-modal-divider" style={{ margin: '8px 0' }} />
            <div className="mui-modal-actions">
              <button className="mui-btn mui-btn-cancel" onClick={() => setShowMuiModal(false)}>Thoát</button>
              <button
                className="mui-btn mui-btn-confirm"
                onClick={async () => {
                  try {
                    setShowMuiModal(false);
                    await reportLeaveOnce();
                  } finally {
                    navigate('/student/class/OURLC/homework');
                  }
                }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
      {successModal.open && (
        <div className="mui-modal-overlay">
          <div className="mui-modal-content">
            <div className="mui-modal-title">Thành công</div>
            <hr className="mui-modal-divider" style={{ marginBottom: 8 }} />
            <div className="mui-modal-body">
              {successModal.message}
            </div>
            <hr className="mui-modal-divider" style={{ margin: '8px 0' }} />
            <div className="mui-modal-actions">
              <button className="mui-btn mui-btn-confirm" onClick={() => { const to = successModal.goTo; setSuccessModal({ open:false, message:'', goTo:'' }); if (to) navigate(to); }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentQuizPage;