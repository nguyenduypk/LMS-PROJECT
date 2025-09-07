import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentViewer from './DocumentViewer';
import '../../../styles/StudentQuizResultPage.css';

function StudentQuizResultPage({ classInfo }) {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  
  // State for quiz result data
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [tab, setTab] = useState('result');
  const [attemptsList, setAttemptsList] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptSelectFocused, setAttemptSelectFocused] = useState(false);
  const [scoreSetting, setScoreSetting] = useState('');
  const [gradeAttemptId, setGradeAttemptId] = useState(null);
  // History states
  const [historyEvents, setHistoryEvents] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);
  
  // Load quiz result data when component mounts
  useEffect(() => {
    loadQuizResult();
  }, [attemptId]);

  // Load attempts list for dropdown
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!quizId) return;
      try {
        setLoadingAttempts(true);
        const resp = await fetch(`/api/assignments/quiz/${quizId}/attempts/mine`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await resp.json();
        console.log('📥 attempts/mine response:', { ok: resp.ok, data });
        if (resp.ok && Array.isArray(data.attempts) && data.attempts.length > 0) {
          setAttemptsList(data.attempts);
          setScoreSetting(data.scoreSetting || '');
          const graded = data.attempts.find(a => !!a.take_for_grade);
          setGradeAttemptId(graded ? graded.id : null);
        } else {
          // Fallback: ít nhất hiển thị attempt hiện tại
          setAttemptsList([{ id: Number(attemptId), order: 1, take_for_grade: false }]);
          setScoreSetting('');
          setGradeAttemptId(null);
        }
      } catch (e) {
        console.error('Load attempts list error:', e);
        // Fallback khi lỗi
        setAttemptsList([{ id: Number(attemptId), order: 1, take_for_grade: false }]);
        setScoreSetting('');
        setGradeAttemptId(null);
      } finally {
        setLoadingAttempts(false);
      }
    };
    fetchAttempts();
  }, [quizId]);

  // Load attempt history when switching to History tab or attemptId changes
  useEffect(() => {
    const shouldLoad = tab === 'history' && attemptId;
    if (!shouldLoad) return;
    let cancelled = false;
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
setErrorHistory(null);
        const resp = await fetch(`/api/assignments/quiz/attempt/${attemptId}/history`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await resp.json();
        if (!cancelled) {
          if (resp.ok && Array.isArray(data.events)) {
            setHistoryEvents(data.events);
          } else {
            setHistoryEvents([]);
            setErrorHistory(data?.message || 'Không tải được lịch sử');
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Load attempt history error:', e);
          setErrorHistory('Không thể tải lịch sử làm bài');
          setHistoryEvents([]);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [tab, attemptId]);

  // Load quiz result from backend
  const loadQuizResult = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/quiz/attempt/${attemptId}/result`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('📥 quiz attempt result payload:', data);
        console.log('📥 quiz settings:', {
          quizTitle: data.quiz?.title,
          quizMaxScore: data.quiz?.maxScore,
          quizTotalQuestions: data.quiz?.totalQuestions,
          attemptMaxScore: data.attempt?.maxPossibleScore,
          attemptTotalScore: data.attempt?.totalScore,
          scorePerQuestion: data.attempt?.maxPossibleScore / (data.answers?.length || 1)
        });
        try { window.__lastQuizPayload = data; } catch (_) {}
        setQuizResult(data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Load quiz result error:', error);
      setError('Không thể tải kết quả bài tập');
    } finally {
      setLoading(false);
    }
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

  // No result data
  if (!quizResult) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Không tìm thấy kết quả bài tập</div>
      </div>
    );
  }

  // Calculate statistics from backend attempt/answers payload (will be overridden by client computation later)
const attempt = quizResult.attempt || {};
  const answersArr = Array.isArray(quizResult.answers) ? quizResult.answers : [];
  const totalQuestions = answersArr.length;
  // Robust correctness check (supports boolean or numeric 0/1)
  const isCorrectFlag = (v) => v === true || v === 1;
  const hasSelection = (v) => v !== null && v !== undefined;
  const correctAnswers = answersArr.filter(a => isCorrectFlag(a.is_correct)).length;
  const wrongAnswers = answersArr.filter(a => hasSelection(a.selected_option_id) && !isCorrectFlag(a.is_correct)).length;
  const notAnswered = Math.max(0, totalQuestions - correctAnswers - wrongAnswers);
  const answeredCount = answersArr.filter(a => (a.selected_option_id != null) || (a.selected_option_order != null)).length;
  const score = Number(attempt.totalScore ?? 0);
  const maxScore = Number(attempt.maxPossibleScore ?? totalQuestions);
  const timeSpent = Number(attempt.timeSpent ?? 0);
  const submitTime = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('vi-VN') : '-';
  
  // Format answers for display
  // Format answers for display based on enriched answers array from backend
  const canViewAnswers = !!quizResult.canViewAnswers;
  
  // Debug log để kiểm tra quyền xem đáp án
  console.log('🔍 canViewAnswers:', canViewAnswers);
  console.log('🔍 quizResult.canViewAnswers:', quizResult.canViewAnswers);
  const letterToIndex = (val) => {
    if (!val) return -1;
    const s = String(val).trim().toUpperCase();
    const letters = ['A','B','C','D','E','F','G','H'];
    const pos = letters.indexOf(s);
    return pos >= 0 ? pos : -1;
  };

  // debug one sample row once
  try {
    if (answersArr && answersArr.length > 0) {
      const sample = answersArr[0];
      // Only minimal log to inspect field names
      // eslint-disable-next-line no-console
      console.log('🧪 Sample answer row keys:', Object.keys(sample || {}));
      if (Array.isArray(sample.options) && sample.options.length > 0) {
        // eslint-disable-next-line no-console
        console.log('🧪 Sample option keys:', Object.keys(sample.options[0] || {}), ' first option payload:', sample.options[0]);
        // eslint-disable-next-line no-console
        console.log('🧪 Options snapshot (order/isCorrect):', sample.options.map(o => ({ order: o.order, isCorrect: o.isCorrect, text: o.text })));
      }
    }
  } catch (_) {}

  // Debug toàn bộ dữ liệu trước khi xử lý
  console.log('🔍 FULL ANSWERS DATA:', answersArr);
  console.log('🔍 CAN VIEW ANSWERS:', canViewAnswers);

  const answers = answersArr.map((row, idx) => {
    const opts = Array.isArray(row.options) ? row.options : [];
    
    // Debug để kiểm tra dữ liệu
    console.log(`🔍 Question ${idx + 1}:`, {
      question_order: row.question_order,
      selected_option_id: row.selected_option_id,
      options: opts.map(o => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
order: o.order,
        option_order: o.option_order
      }))
    });
    
    // Tìm option đã chọn để debug
    if (row.selected_option_id) {
      const selectedOpt = opts.find(o => Number(o.id) === Number(row.selected_option_id));
      console.log(`🔍 Question ${idx + 1} SELECTED:`, selectedOpt);
    }
    
    // Tìm đáp án đã chọn - thử nhiều cách
    let chosenDisplay = '-';
    let chosenOptionId = row.selected_option_id;
    
    if (chosenOptionId && opts.length > 0) {
      const chosenOption = opts.find(opt => Number(opt.id) === Number(chosenOptionId));
      if (chosenOption) {
        // Cách 1: Sử dụng option_order
        let optionOrder = chosenOption.option_order;
        
        // Cách 2: Nếu không có option_order, thử order
        if (optionOrder === undefined || optionOrder === null) {
          optionOrder = chosenOption.order;
        }
        
        // Cách 3: Nếu vẫn không có, dùng vị trí trong mảng
        if (optionOrder === undefined || optionOrder === null) {
          optionOrder = opts.findIndex(opt => Number(opt.id) === Number(chosenOptionId));
        }
        
        if (optionOrder !== undefined && optionOrder !== null && optionOrder >= 0) {
          chosenDisplay = String.fromCharCode(65 + optionOrder); // 0=A, 1=B, 2=C, 3=D
        }
        
        console.log(`🔍 Question ${idx + 1} chosen logic:`, {
          selected_option_id: chosenOptionId,
          chosenOption: {
            id: chosenOption.id,
            text: chosenOption.text?.substring(0, 20) + '...',
            option_order: chosenOption.option_order,
            order: chosenOption.order
          },
          finalOptionOrder: optionOrder,
          chosenDisplay
        });
      }
    }
    
    // Tìm đáp án đúng - đọc text content của option có isCorrect = 1
    let correctDisplay = '-';
    if (canViewAnswers && opts.length > 0) {
      // Tìm option có isCorrect = 1
      const correctOption = opts.find(opt => {
        const isCorrect = opt.isCorrect;
        return isCorrect === true || isCorrect === 1 || isCorrect === "1" || isCorrect === "true";
      });
      
      if (correctOption && correctOption.text) {
        // Đọc text content của đáp án đúng
        const text = correctOption.text.trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(text)) {
          correctDisplay = text;
        }
      }
      
      console.log(`🔍 Question ${idx + 1} correct answer:`, {
        correctOption: correctOption ? {
          text: correctOption.text,
          isCorrect: correctOption.isCorrect
        } : null,
        correctDisplay
      });
    }
    
    // Tính điểm - so sánh text content của đáp án chọn và đáp án đúng
    const isCorrect = chosenDisplay !== '-' && chosenDisplay === correctDisplay;

    return {
      num: Number(row.question_order ?? idx + 1),
      chosen: chosenDisplay,
      correct: correctDisplay,
score: isCorrect ? 1 : 0,
      isCorrect: isCorrect,
      // Thêm thông tin debug
      _debug: {
        opts: opts.map(o => ({
          id: o.id,
          text: o.text.substring(0, 20) + '...',
          order: o.order,
          isCorrect: o.isCorrect,
          selected: o.selected
        })),
        chosenOptionId,
        correctOption: opts.find(opt => opt.isCorrect === true)
      }
    };
  });

  // Client summary numbers derived from computed answers
  const clientCorrectAnswers = Array.isArray(answers)
    ? answers.filter(a => a.isCorrect === true).length
    : 0;
  const clientWrongAnswers = Array.isArray(answers)
    ? answers.filter(a => a.chosen !== '-' && a.isCorrect === false).length
    : 0;
  const clientNotAnswered = Array.isArray(answers)
    ? answers.filter(a => a.chosen === '-').length
    : 0;

  // helpers for history
  const formatTs = (ts) => {
    try { return ts ? new Date(ts).toLocaleString('vi-VN') : '-'; } catch { return String(ts || '-'); }
  };
  const colorFor = (type) => {
    switch (type) {
      case 'leave': return '#d32f2f';
      case 'submit': return '#1976d2';
      case 'edit': return '#388e3c';
      default: return '#616161';
    }
  };
  const labelFor = (type) => {
    switch (type) {
      case 'leave': return 'Rời khỏi trang';
      case 'submit': return 'Nộp bài';
      case 'edit': return 'Chỉnh sửa câu trả lời';
      default: return type || 'Sự kiện';
    }
  };
  // Support both camelCase and snake_case just in case of older payloads
  const leaveCount = Number(
    (attempt.leaveCount != null ? attempt.leaveCount : attempt.leave_count) || 0
  );
  const editCount = Number(
    (attempt.editCount != null ? attempt.editCount : attempt.edit_count) || 0
  );
  // Prefer counts from history events when available
  const leaveCountFromEvents = Array.isArray(historyEvents)
    ? historyEvents.filter(ev => ev.type === 'leave').length
    : 0;
  const editCountFromEvents = Array.isArray(historyEvents)
    ? historyEvents.filter(ev => ev.type === 'edit').length
    : 0;
  const leaveCountDisplay = (Array.isArray(historyEvents) && historyEvents.length > 0)
    ? leaveCountFromEvents
    : leaveCount;
  const editCountDisplay = (Array.isArray(historyEvents) && historyEvents.length > 0)
    ? editCountFromEvents
    : editCount;

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

  return (
    <div className="quiz-result-root student-quiz-layout" style={{ gap: 0 }}>
      {/* Bên trái: Viewer tài liệu */}
<div className="student-quiz-left" style={{ height: '100vh', width: '100%', padding: 0, margin: 0, display: 'flex', alignItems: 'stretch', justifyContent: 'stretch' }}>
        {quizResult.quiz?.file_url ? (
          <DocumentViewer
            src={quizResult.quiz.file_url}
            title={quizResult.quiz.title}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#f5f5f5' }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <h3>Không có tài liệu đính kèm</h3>
              <p>Bài tập này không có tài liệu đính kèm</p>
            </div>
          </div>
        )}
      </div>
      {/* Bên phải: Kết quả */}
      <div className="student-quiz-right-placeholder student-quiz-right">
        {/* Breadcrumb */}
        {(() => {
          const classCode = classInfo?.code || classInfo?.classCode || '';
          const homeworkPath = classCode ? `/student/class/${classCode}/homework` : '/student/class';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 8 }}>
              <button
                onClick={() => navigate(homeworkPath)}
                title="Về trang Bài tập"
                style={{ background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontSize: 14 }}
              >
                Trở về trang bài tập
              </button>
            </div>
          );
        })()}
        
        {/* Dropdown chọn lần làm bài (custom arrow like admin) */}
        <div style={{ display: 'block', width: '100%', marginTop: 16, marginBottom: 12 }}>
          <div className="attempt-select-wrap" style={{ width: '100%' }}>
            <select
              value={String(attemptId)}
              onChange={(e) => {
                const newAttemptId = e.target.value;
                navigate(`/student/class/${classInfo?.code || classInfo?.classCode}/quiz/${quizId}/result/${newAttemptId}`);
              }}
              className="attempt-select"
            >
              {attemptsList.map((att, idx) => (
                <option key={att.id} value={att.id}>
                  {`Lần làm bài ${att.order || idx + 1}`}
                  {att.take_for_grade ? ' - Lấy điểm' : ''}
                </option>
              ))}
            </select>
            <span className="attempt-select-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>
        <div className="quiz-result-tabs">
          <button
            className={`quiz-result-tab${tab === 'result' ? ' active' : ''}`}
            onClick={() => setTab('result')}
          >
Kết quả
          </button>
          <button
            className={`quiz-result-tab${tab === 'history' ? ' active' : ''}`}
            onClick={() => setTab('history')}
          >
            Lịch sử
          </button>
        </div>
        {tab === 'result' && (
          <>
            {(() => {
              // Điểm hiển thị theo lần làm bài hiện tại, trừ khi giáo viên set quyền lấy điểm
              let displayScore = score; // Điểm của lần làm bài hiện tại
              let displayMax = maxScore;
              let isGradedAttempt = false;
              
              // Chỉ thay đổi điểm nếu giáo viên đã set quyền lấy điểm và đang xem lần lấy điểm
              if (Array.isArray(attemptsList) && gradeAttemptId != null) {
                const currentAttempt = attemptsList.find(a => Number(a.id) === Number(attemptId));
                const gradedAttempt = attemptsList.find(a => Number(a.id) === Number(gradeAttemptId));
                
                // Nếu đang xem lần lấy điểm, hiển thị điểm lấy điểm
                if (currentAttempt && currentAttempt.take_for_grade && gradedAttempt) {
                  displayScore = Number(gradedAttempt.total_score ?? displayScore);
                  displayMax = Number(gradedAttempt.max_possible_score ?? displayMax);
                  isGradedAttempt = true;
                }
              }
              
              // Debug thông tin điểm
              console.log('🔍 Score display logic:', {
                currentAttemptId: attemptId,
                currentAttemptScore: score,
                maxScore,
                gradeAttemptId,
                displayScore,
                isGradedAttempt,
                scoreSetting,
                frontendCorrectCount: clientCorrectAnswers,
                totalQuestions: answersArr.length,
                scorePerQuestion: maxScore / answersArr.length
              });
              
              // Nếu backend trả về điểm sai, tính lại dựa trên frontend
              let correctedScore = displayScore;
              const expectedMaxScore = answersArr.length; // 1 điểm/câu
              
              console.log('🔧 Score correction check:', {
                displayScore,
                maxScore,
                expectedMaxScore,
                clientCorrectAnswers,
                shouldCorrect: displayScore < clientCorrectAnswers
              });
              
              // Nếu điểm hiển thị < số câu đúng, có vấn đề cần sửa
              if (displayScore < clientCorrectAnswers) {
                // Tính lại điểm dựa trên số câu đúng (1 điểm/câu)
                correctedScore = clientCorrectAnswers;
                console.log('🔧 Score correction applied:', {
                  originalScore: displayScore,
                  correctedScore,
                  reason: 'Backend score lower than correct answers'
                });
}
              
              return (
                <div className="quiz-result-score-box">
                  {correctedScore} ĐIỂM
                </div>
              );
            })()}
            <div className="quiz-result-info-block">
              <div className="quiz-result-info-row">
                <span className="quiz-result-info-label">Thời gian</span>
                <span className="quiz-result-info-value">{formatTime(timeSpent)}</span>
              </div>
              <div className="quiz-result-info-row">
                <span className="quiz-result-info-label">Nộp lúc</span>
                <span className="quiz-result-info-value">{submitTime}</span>
              </div>
              <div className="quiz-result-info-row">
                <span className="quiz-result-info-label">Lấy điểm</span>
                <span className="quiz-result-info-value">
                  {scoreSetting ? scoreSetting : 'Lấy điểm lần làm bài đầu tiên'}
                </span>
              </div>
              <div className="quiz-result-info-row">
                <span className="quiz-result-info-label-group">
                  <span className="quiz-result-dot green"></span>
                  <span className="quiz-result-info-label">Số câu đúng</span>
                </span>
                <span className="quiz-result-info-value">{clientCorrectAnswers}</span>
              </div>
              <div className="quiz-result-info-row">
                <span className="quiz-result-info-label-group">
                  <span className="quiz-result-dot red"></span>
                  <span className="quiz-result-info-label">Số câu sai</span>
                </span>
                <span className="quiz-result-info-value">{clientWrongAnswers}</span>
              </div>
              <div className="quiz-result-info-row not-done">
                <span className="quiz-result-info-label-group">
                  <span className="quiz-result-dot gray"></span>
                  <span className="quiz-result-info-label">Chưa làm</span>
                </span>
                <span className="quiz-result-info-value">{clientNotAnswered}</span>
              </div>
            </div>
            <div className="quiz-result-table-container">
              <div className="quiz-result-table-title">Phiếu bài làm</div>
              <table className="quiz-result-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Câu</th>
                    <th>Chọn</th>
                    <th>Đáp án đúng</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map(a => (
<tr key={a.num}>
                      <td>
                        <span className={`quiz-result-dot ${
                          a.chosen === '-' ? 'gray' : 
                          a.isCorrect ? 'green' : 'red'
                        }`}></span>
                      </td>
                      <td>{a.num}</td>
                      <td style={{ 
                        color: a.chosen === '-' ? '#898ea0' : 
                               (a.isCorrect === true ? '#4CAF50' : (a.isCorrect === false ? '#f44336' : '#2f6fed'))
                      }}>{a.chosen}</td>
                      <td style={{ color: '#4CAF50' }}>{a.correct}</td>
                      <td>({a.isCorrect ? a.score : 0})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === 'history' && (
          <>
            <div className="history-summary-box" style={{border: '1px solid #e3eafc', borderRadius: 12, padding: 16, marginBottom: 16}}>
              <div style={{fontWeight: 600, marginBottom: 8}}>Tổng quan quá trình làm bài</div>
              <div>Số lần rời khỏi làm bài: {leaveCountDisplay}</div>
              <div>Số lần chỉnh sửa: {editCountDisplay}</div>
            </div>
            <div className="history-detail-box">
              <div style={{fontWeight: 600, color: '#d32f2f', marginBottom: 8}}>
                <span style={{display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#d32f2f', marginRight: 8}}></span>
                Lịch sử làm bài
              </div>
              {loadingHistory && (
                <div style={{color: '#757575'}}>Đang tải lịch sử...</div>
              )}
              {!loadingHistory && errorHistory && (
                <div style={{color: '#d32f2f'}}>{errorHistory}</div>
              )}
              {!loadingHistory && !errorHistory && (
                historyEvents.length === 0 ? (
                  <div style={{color: '#757575'}}>Không có dữ liệu để hiển thị. Học sinh có thể đã hoàn thành bài tập trước khi tính năng ra mắt.</div>
                ) : (
                  <ul style={{paddingLeft: 0, listStyle: 'none'}}>
                    {historyEvents.map((ev) => (
                      <li key={ev.id} style={{marginBottom: 10, display: 'flex', alignItems: 'center'}}>
                        <span style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: colorFor(ev.type),
                          marginRight: 8
                        }}></span>
                        <span>
                          {labelFor(ev.type)}: <b>{formatTs(ev.createdAt)}</b>
                          {ev.note ? <span style={{color: '#616161'}}> — {ev.note}</span> : null}
</span>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StudentQuizResultPage;