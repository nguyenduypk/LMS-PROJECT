import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader';
import ClassSidebar from './ClassSidebar';
import '../../../styles/ClassHomeworkPage.css';
import { 
  MdFolder, 
  MdAdd, 
  MdViewList, 
  MdViewModule, 
  MdSearch, 
  MdContentCopy,
  MdVisibility,
  MdEdit,
  MdMoreVert,
  MdComputer,
  MdShare,
  MdExpandMore,
  MdDownload,
  MdDelete
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

function AssignmentPage({ classInfo }) {
  const { classCode } = useParams();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('newest');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Khôi phục/persist classInfo để tránh mất dữ liệu khi quay lại từ trang quiz
  const storageKey = classCode ? `classInfo:${classCode}` : null;
  const [cachedClassInfo, setCachedClassInfo] = useState(() => {
    try {
      if (!storageKey) return null;
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  });

  // Sync: nếu prop classInfo có thì cache lại
  useEffect(() => {
    try {
      if (storageKey && classInfo && typeof classInfo.id !== 'undefined') {
        sessionStorage.setItem(storageKey, JSON.stringify(classInfo));
        setCachedClassInfo(classInfo);
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classInfo, storageKey]);

  // Loader tách riêng để có thể gọi lại theo sự kiện focus/visibility
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Student loading assignments for classCode:', classCode);
      
      // Lấy classId: ưu tiên id số từ classInfo hoặc cache; không dùng classCode nếu không phải số
      const numericId = (classInfo && Number(classInfo.id)) || (cachedClassInfo && Number(cachedClassInfo.id));
      const classId = Number.isFinite(numericId) && numericId > 0
        ? numericId
        : (Number.isFinite(Number(classCode)) ? Number(classCode) : null);
      if (!classId) {
        console.warn('⚠️ Không xác định được classId (cần id số). Chờ classInfo/cachedClassInfo...');
        setAssignments([]);
        setLoading(false);
        return;
      }
      console.log('🔍 Using classId:', classId);
      
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }
      
      const response = await fetch(`/api/assignments/quiz/class/${classId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Student assignments loaded:', data);
      
      // Transform data cho student view
      const transformedAssignments = data.map(quiz => {
        const attemptsDone = Number(quiz.submitted_attempts_count || 0);
        const inProgressAttemptId = quiz.in_progress_attempt_id || null;
        const maxAttempts = Number(quiz.max_attempts || 1);
        const remainingAttempts = Math.max(0, maxAttempts - attemptsDone);
        const deadlinePassed = !!quiz.deadline_passed;
        return {
          id: quiz.id,
          title: quiz.title,
          type: 'Trắc nghiệm',
          progress: inProgressAttemptId
            ? 'Đang làm dở'
            : (quiz.status === 'published' ? 'Có thể làm bài' : 'Chưa mở'),
          completed: attemptsDone,
          total: quiz.question_count || 0,
          icon: quiz.title?.charAt(0)?.toUpperCase() || 'Q',
          status: quiz.status,
          deadline: quiz.deadline ? new Date(quiz.deadline).toLocaleString('vi-VN') : null,
          timeLimit: quiz.time_limit ? `${quiz.time_limit} phút` : 'Không giới hạn',
          maxAttempts,
          remainingAttempts,
          inProgressAttemptId,
          deadlinePassed,
          description: quiz.description,
          createdAt: quiz.created_at,
          // Thêm các trường quyền hiển thị kết quả từ backend
          student_permission: quiz.student_permission || quiz.studentPermission || null,
          show_answers: quiz.show_answers ?? quiz.showAnswers ?? undefined,
          // Sẽ được cập nhật sau khi prefetch attempts
          latestAttemptId: null
        };
      });
      
      setAssignments(transformedAssignments);
      // Set first assignment as selected if none selected
      if (transformedAssignments.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(transformedAssignments[0].id);
      }

      // Prefetch graded/submittedCount for all assignments (không chặn UI)
      try {
        const token = sessionStorage.getItem('token');
        const fetchOne = async (quizId) => {
          try {
            const resp = await fetch(`/api/assignments/quiz/${quizId}/attempts/mine`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await resp.json();
            if (!resp.ok) return;
            const attempts = Array.isArray(json.attempts) ? json.attempts : [];
            const graded = attempts.find(a => !!a.take_for_grade) || null;
            const gradedScore = Number(graded?.total_score ?? 0);
            const gradedMax = Number(graded?.max_possible_score ?? 0);
            const submitted = attempts.filter(a => a.status === 'submitted');
            const submittedCount = submitted.length;
            // latestAttemptId: ưu tiên attempt nộp gần nhất theo createdAt/id
            let latestAttemptId = null;
            if (submitted.length > 0) {
              latestAttemptId = submitted
                .slice()
                .sort((a, b) => {
                  const ta = new Date(a.createdAt || a.submittedAt || 0).getTime();
                  const tb = new Date(b.createdAt || b.submittedAt || 0).getTime();
                  if (tb !== ta) return tb - ta;
                  return Number(b.id) - Number(a.id);
                })[0].id;
            }
            console.log('📥 Prefetch attempts', { quizId, submittedCount, gradedScore, scoreSetting: json.scoreSetting });
            setAssignments(prev => prev.map(a => (
              Number(a.id) === Number(quizId)
                ? {
                    ...a,
                    gradedScore,
                    gradedMax,
                    scoreType: json.scoreSetting || a.scoreType,
                    submittedCount,
                    nextAttemptIndex: submittedCount + 1,
                    remainingAttempts: Math.max(0, (a.maxAttempts ?? 0) - submittedCount),
                    latestAttemptId: latestAttemptId
                  }
                : a
            )));
          } catch (_) {}
        };
        // chạy song song có kiểm soát
        transformedAssignments.forEach(it => fetchOne(it.id));
      } catch (_) {}
      
    } catch (error) {
      console.error('❌ Error loading student assignments:', error);
      setError(error.message);
      
      // Fallback data nếu API fail
      setAssignments([
        {
          id: 'fallback-1',
          title: 'Không thể tải bài tập',
          type: 'Lỗi',
          progress: 'Vui lòng thử lại',
          completed: 0,
          total: 0,
          icon: '!',
          status: 'error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [classCode, classInfo, selectedAssignmentId]);

  // Load lần đầu và khi class thay đổi
  useEffect(() => {
    if (classCode || classInfo) {
      loadAssignments();
    }
  }, [classCode, classInfo, loadAssignments]);

  // Khi chọn một bài, tải điểm được lấy theo chính sách giáo viên
  useEffect(() => {
    const loadGradedFor = async (quizId) => {
      try {
        const token = sessionStorage.getItem('token');
        const resp = await fetch(`/api/assignments/quiz/${quizId}/attempts/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!resp.ok) return;
        const attempts = Array.isArray(data.attempts) ? data.attempts : [];
        const graded = attempts.find(a => !!a.take_for_grade) || null;
        const gradedScore = Number(graded?.total_score ?? 0);
        const gradedMax = Number(graded?.max_possible_score ?? 0);
        const submittedCount = attempts.filter(a => a.status === 'submitted').length;
        setAssignments(prev => prev.map(a => (
          Number(a.id) === Number(quizId)
            ? { 
                ...a, 
                gradedScore, 
                gradedMax, 
                scoreType: data.scoreSetting || a.scoreType,
                submittedCount,
                nextAttemptIndex: submittedCount + 1,
                remainingAttempts: Math.max(0, (a.maxAttempts ?? 0) - submittedCount)
              }
            : a
        )));
      } catch (e) {
        // ignore lỗi, không chặn UI
        console.warn('Load graded score failed:', e?.message || e);
      }
    };
    if (selectedAssignmentId) {
      loadGradedFor(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  // Tự reload khi quay lại tab hoặc trở lại trang (focus/visibility)
  useEffect(() => {
    const onFocus = () => {
      console.log('🔄 Window focus: reload assignments');
      loadAssignments();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Visibility visible: reload assignments');
        loadAssignments();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadAssignments]);

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignmentId);
  const navigate = useNavigate();

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setIsSortDropdownOpen(false);
  };

  const handleSortClick = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  return (
    <div className="assignment-page">
      <DashboardHeader />
      <div className="assignment-page__content">
        <ClassSidebar classInfo={classInfo} />
        
        {/* Header "Bài tập" */}
        <div className="assignment-page__header">
          <h1 className="assignment-page__title">Bài tập</h1>
        </div>

        {/* Main Content Area */}
        <div className="assignment-page__main">
          {/* Main Content - Toolbar + Assignment List */}
          <div className="assignment-page__main-content">
            {/* Toolbar */}
            <div className="assignment-page__toolbar">
              <div className="toolbar__search">
                <MdSearch size={20} />
                <input type="text" placeholder="Tìm kiếm..." />
              </div>
              
              <select 
                className={`toolbar__sort ${isSortDropdownOpen ? 'toolbar__sort--open' : ''}`}
                value={sortBy}
                onChange={handleSortChange}
                onMouseDown={handleSortClick}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name">Tên</option>
              </select>
            </div>

            {/* Selection Bar */}
            {isSelectionMode && (
              <div className="assignment-page__selection-bar">
                <div className="selection-bar__left">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.length === assignments.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(assignments.map(a => a.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                  <span>
                    Đang chọn <span className="selection-count">{selectedItems.length} bài tập</span>
                  </span>
                </div>
                <div className="selection-bar__right">
                  <button className="selection-action-btn">
                    <MdFolder size={16} />
                    Di chuyển
                  </button>
                  <button className="selection-action-btn">
                    <MdDelete size={16} />
                    Xoá
                  </button>
                </div>
              </div>
            )}

            {/* Assignment List */}
            <div className="assignment-page__list-container">
              {loading ? (
                <div className="assignment-loading">
                  <div className="assignment-loading__spinner">⏳</div>
                  <p>Đang tải danh sách bài tập...</p>
                </div>
              ) : error ? (
                <div className="assignment-error">
                  <div className="assignment-error__icon">❌</div>
                  <p>Lỗi tải bài tập: {error}</p>
                  <button 
                    className="assignment-error__retry"
                    onClick={() => window.location.reload()}
                  >
                    Thử lại
                  </button>
                </div>
              ) : assignments.length === 0 ? (
                <div className="assignment-empty">
                  <div className="assignment-empty__icon">📝</div>
                  <h3>Chưa có bài tập nào</h3>
                  <p>Giáo viên chưa tạo bài tập cho lớp học này.</p>
                </div>
              ) : (
                <div className="assignment-list">
                  {assignments.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className={`assignment-item ${selectedAssignmentId === assignment.id ? 'selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
                    onClick={() => {
                      if (isSelectionMode) {
                        if (selectedItems.includes(assignment.id)) {
                          setSelectedItems(selectedItems.filter(id => id !== assignment.id));
                        } else {
                          setSelectedItems([...selectedItems, assignment.id]);
                        }
                      } else {
                        // Reset trạng thái điểm/lượt làm để tránh hiển thị số cũ trong lúc tải
                        setAssignments(prev => prev.map(a => (
                          a.id === assignment.id 
                            ? { ...a, gradedScore: null, gradedMax: null, submittedCount: null, nextAttemptIndex: null }
                            : a
                        )));
                        setSelectedAssignmentId(assignment.id);
                      }
                    }}
                    onDoubleClick={() => {
                      // Cho phép vào nếu đang làm dở dù deadline đã qua
                      if (assignment.inProgressAttemptId || assignment.status === 'published') {
                        navigate(`/student/class/${classCode}/quiz/${assignment.id}`);
                      }
                    }}
                  >
                    {isSelectionMode && (
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(assignment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, assignment.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== assignment.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="assignment-checkbox"
                      />
                    )}
                    <div className="assignment-item__icon">
                      {assignment.icon}
                    </div>
                    <div className="assignment-item__content">
                      <div className="assignment-item__title">{assignment.title}</div>
                      <div className="assignment-item__type">{assignment.type}</div>
                      <div className="assignment-item__progress">
                        {(() => {
                          const hasGraded = Number.isFinite(assignment.gradedScore) && Number.isFinite(assignment.gradedMax) && assignment.gradedMax > 0;
                          const score10 = hasGraded ? Math.max(0, Math.min(10, (assignment.gradedScore / assignment.gradedMax) * 10)) : null;
                          const fillPct = hasGraded ? (score10 / 10) * 100 : 0;
                          return (
                            <>
                              <div className="progress-bar">
                                <div
                                  className="progress-bar__fill"
                                  style={{ width: `${fillPct}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">
                                {hasGraded
                                  ? `${score10.toFixed(1)}/10 điểm`
                                  : (assignment.submittedCount > 0 ? '.../10 điểm' : 'Chưa làm')}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>

          {/* Assignment Details Section */}
          {selectedAssignmentData && (
            <div className="assignment-page__details-section">
              <div className="assignment-details">
                {/* Header with Status */}
                <div className="assignment-details__header">
                  <span className="assignment-status">
                    {selectedAssignmentData.gradedScore != null ? `${selectedAssignmentData.gradedScore} điểm` : '...'}
                  </span>
                </div>
                
                {/* Assignment Information */}
                <div className="assignment-details__section">
                  <h3 className="assignment-details__title">{selectedAssignmentData.title}</h3>
                  <div className="assignment-info">
                    <div className="info-item">
                      <span className="info-label">Số lần làm bài</span>
                      <span className="info-value">{selectedAssignmentData.maxAttempts}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Đã làm</span>
                      <span className="info-value">
                        {selectedAssignmentData.submittedCount != null 
                          ? `${selectedAssignmentData.submittedCount} / ${selectedAssignmentData.maxAttempts}`
                          : `... / ${selectedAssignmentData.maxAttempts}`}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Lấy điểm</span>
                      <span className="info-value">{selectedAssignmentData.scoreType || 'Lấy điểm lần làm bài đầu tiên'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Loại</span>
                      <span className="info-value">{selectedAssignmentData.type}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Ngày tạo</span>
                      <span className="info-value">{selectedAssignmentData.creationDate || new Date(selectedAssignmentData.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Bắt đầu</span>
                      <span className="info-value">{selectedAssignmentData.startTime || 'Không'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Thời lượng</span>
                      <span className="info-value">{selectedAssignmentData.timeLimit || 'Không giới hạn'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Cho phép</span>
                      <span className="info-value">{selectedAssignmentData.allowedActions || 'Chỉ xem điểm'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Hạn chót</span>
                      <span className="info-value">{selectedAssignmentData.deadline || 'Không'}</span>
                    </div>
                    {selectedAssignmentData.description && (
                      <div className="info-item">
                        <span className="info-label">Mô tả</span>
                        <span className="info-value">{selectedAssignmentData.description}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Số câu hỏi</span>
                      <span className="info-value">{selectedAssignmentData.total} câu</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Trạng thái</span>
                      <span className="info-value">
                        {selectedAssignmentData.status === 'published' ? 
                          <span style={{color: 'green'}}>Có thể làm bài</span> : 
                          <span style={{color: 'orange'}}>Chưa mở</span>
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="assignment-details__actions-container">
                  <div className="assignment-details__actions">
                    {selectedAssignmentData.status === 'published' ? (
                      <>
                        {selectedAssignmentData.inProgressAttemptId ? (
                          <button className="assignment-action-btn assignment-action-btn--primary"
                            onClick={() => navigate(`/student/class/${classCode}/quiz/${selectedAssignmentData.id}`)}
                          >
                            <span>Tiếp tục làm</span>
                            <span>→</span>
                          </button>
                        ) : selectedAssignmentData.status === 'published' && selectedAssignmentData.remainingAttempts > 0 ? (
                          <button className="assignment-action-btn assignment-action-btn--primary"
                            onClick={() => navigate(`/student/class/${classCode}/quiz/${selectedAssignmentData.id}`)}
                          >
                            <span>
                              {selectedAssignmentData.submittedCount > 0 
                                ? `Làm lại lần ${selectedAssignmentData.nextAttemptIndex || (selectedAssignmentData.submittedCount + 1)}`
                                : 'Làm bài'}
                            </span>
                            <span>→</span>
                          </button>
                        ) : (
                          <button className="assignment-action-btn assignment-action-btn--disabled" disabled>
                            <span>Đã hết lượt làm bài</span>
                            <span>→</span>
                          </button>
                        )}
                        
                        {(selectedAssignmentData.submittedCount ?? selectedAssignmentData.completed) > 0 && 
                         selectedAssignmentData.student_permission && 
                         selectedAssignmentData.student_permission !== 'Không cho phép xem' && (
                          <button className="assignment-action-btn assignment-action-btn--secondary"
                            onClick={() => {
                              // Điều hướng đến trang kết quả với attempt ID mới nhất
                              const latestAttemptId = selectedAssignmentData.latestAttemptId || 'latest';
                              navigate(`/student/class/${classCode}/quiz/${selectedAssignmentData.id}/result/${latestAttemptId}`);
                            }}
                          >
                            <span>Kết quả</span>
                            <span>→</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button className="assignment-action-btn assignment-action-btn--disabled" disabled>
                        <span>Bài tập chưa mở</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentPage;
