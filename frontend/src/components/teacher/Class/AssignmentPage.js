import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import Header from '../Header';
import CreateAssignmentModal from './CreateAssignmentModal';
import './AssignmentPage.css';
import { 
  MdFolder, 
  MdAdd, 
  MdSearch, 
  MdVisibility,
  MdEdit,
  MdDelete
} from 'react-icons/md';
import TeacherSidebar from './TeacherSidebar';

function AssignmentPage({ classInfo }) {
  // Toggle để bật/tắt các hành động phụ thuộc backend (chi tiết/chỉnh sửa/xóa)
  const BACKEND_READY = true;
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('newest');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [activeAction, setActiveAction] = useState('details'); // 'details', 'edit', 'delete'
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const { classId } = useParams();
  const navigate = useNavigate();

  // Action handlers
  const handleViewDetails = () => {
    setActiveAction('details');
    if (!BACKEND_READY) {
      setSuccessModal({ open: true, message: 'Chức năng Chi tiết đang phát triển (chưa có backend).'});
      return;
    }
    // Navigate to assignment detail page
    navigate(`/teacher/class/${classId}/assignment/${selectedAssignmentData.id}`);
  };

  const handleEditAssignment = () => {
    setActiveAction('edit');
    if (!BACKEND_READY) {
      setSuccessModal({ open: true, message: 'Chức năng Chỉnh sửa đang phát triển (chưa có backend).'});
      return;
    }
    if (!selectedAssignmentData) return;
    // Điều hướng tới trang chỉnh sửa bài tập (sẽ được triển khai UI sau)
    navigate(`/teacher/class/${classId}/assignment/${selectedAssignmentData.id}/edit`);
  };

  // Delete a list of assignment IDs
  const deleteAssignmentsByIds = async (ids) => {
    if (!ids || ids.length === 0) return;

    const token = sessionStorage.getItem('token');
    if (!token) {
      console.warn('Không tìm thấy token. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      // Thực hiện xóa tuần tự để đơn giản hóa xử lý lỗi
      for (const id of ids) {
        await api.quiz.delete(id);
      }

      // Update UI state
      setAssignments(prev => prev.filter(a => !ids.includes(a.id)));
      setSelectedItems(prev => prev.filter(id => !ids.includes(id)));

      // If the selected assignment was deleted, pick another
      if (selectedAssignmentData && ids.includes(selectedAssignmentData.id)) {
        const remaining = assignments.filter(a => !ids.includes(a.id));
        setSelectedAssignment(remaining[0]?.title || null);
      }

      setSuccessModal({ open: true, message: ids.length > 1 ? `Đã xóa ${ids.length} bài tập thành công.` : 'Đã xóa bài tập thành công.' });
    } catch (err) {
      console.error('Lỗi khi xóa bài tập:', err);
      // Silent handling
    }
  };

  const handleDeleteAssignment = async () => {
    setActiveAction('delete');
    if (!selectedAssignmentData) return;
    if (!BACKEND_READY) {
      setSuccessModal({ open: true, message: 'Chức năng Xóa đang phát triển (chưa có backend).'});
      return;
    }

    await deleteAssignmentsByIds([selectedAssignmentData.id]);
  };

  // Load assignments từ API
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading assignments for classId:', classId);
        
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('Không tìm thấy token xác thực');
        }
        
        const data = await api.quiz.listByClass(classId);
        console.log('✅ Assignments loaded:', data);
        
        // Transform data để phù hợp với UI
        const transformedAssignments = data.map(quiz => {
          const done = Number(quiz.done_students || 0);
          const totalStudents = Number(quiz.total_students || 0);
          return {
            id: quiz.id,
            title: quiz.title,
            type: 'Trắc nghiệm',
            progress: `${done}/${totalStudents} HS đã làm`,
            completed: quiz.question_count ? Math.min(done, quiz.question_count) : done,
            total: quiz.question_count || 0,
            icon: quiz.title.charAt(0).toUpperCase(),
            attempts: quiz.attempt_count || 0,
            scoreType: quiz.score_setting || 'Lấy điểm lần làm bài đầu tiên',
            creationDate: new Date(quiz.created_at).toLocaleDateString('vi-VN'),
            startTime: quiz.start_time ? new Date(quiz.start_time).toLocaleString('vi-VN') : 'Không',
            duration: quiz.time_limit ? `${quiz.time_limit} phút` : 'Không',
            completedBy: done,
            totalStudents,
            allowedActions: quiz.student_permission || 'Chỉ xem điểm',
            deadline: quiz.deadline ? new Date(quiz.deadline).toLocaleString('vi-VN') : 'Không',
            shareUrl: `${window.location.origin}/student/quiz/${quiz.id}`,
            status: quiz.status,
            description: quiz.description
          };
        });
        
        setAssignments(transformedAssignments);
        
        // Set first assignment as selected if none selected
        if (transformedAssignments.length > 0 && !selectedAssignment) {
          setSelectedAssignment(transformedAssignments[0].title);
        }
        
      } catch (error) {
        console.error('❌ Error loading assignments:', error);
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
            attempts: 0,
            scoreType: 'N/A',
            creationDate: 'N/A',
            startTime: 'N/A',
            duration: 'N/A',
            completedBy: 0,
            allowedActions: 'N/A',
            deadline: 'N/A',
            shareUrl: '#'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (classId) {
      loadAssignments();
    }
  }, [classId, selectedAssignment]);

  const selectedAssignmentData = assignments.find(a => a.title === selectedAssignment);

  return (
    <div className="teacher-assignment-page">
      <Header />
      <div className="teacher-assignment-page__content">
        <TeacherSidebar classInfo={classInfo} />
        
        {/* Header "Bài tập" */}
        <div className="teacher-assignment-page__header">
          <h1 className="teacher-assignment-page__title">Bài tập</h1>
        </div>

        {/* Main Content Area */}
        <div className="teacher-assignment-page__main">
          {/* Main Content - Toolbar + Assignment List */}
          <div className="teacher-assignment-page__main-content">
            {/* Toolbar */}
            <div className="teacher-assignment-page__toolbar">
              <div className="teacher-assignment-toolbar__view-toggle">
                <button 
                  className={`teacher-assignment-view-toggle__btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode('list');
                    setIsSelectionMode(false);
                    setSelectedItems([]);
                  }}
                >
                  ☰
                </button>
                <button 
                  className={`teacher-assignment-view-toggle__btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode('grid');
                    setIsSelectionMode(true);
                  }}
                >
                  ☰✓
                </button>
              </div>

              <div className="teacher-assignment-toolbar__search">
                <MdSearch size={20} />
                <input type="text" placeholder="Tìm kiếm..." />
              </div>
              
              <div className="teacher-assignment-toolbar__sort-container">
                <div 
                  className="teacher-assignment-toolbar__sort-button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                >
                  <span>{sortBy === 'newest' ? 'Mới nhất' : sortBy === 'oldest' ? 'Cũ nhất' : 'Tên'}</span>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className={`teacher-assignment-toolbar__sort-arrow ${isSortDropdownOpen ? 'rotated' : ''}`}
                  >
                    <path d="m7 10 5 5 5-5z" fill="currentColor"/>
                  </svg>
                </div>
                {isSortDropdownOpen && (
                  <div className="teacher-assignment-toolbar__sort-menu">
                    <div 
                      className={`teacher-assignment-toolbar__sort-item ${sortBy === 'newest' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('newest');
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Mới nhất
                    </div>
                    <div 
                      className={`teacher-assignment-toolbar__sort-item ${sortBy === 'oldest' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('oldest');
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Cũ nhất
                    </div>
                    <div 
                      className={`teacher-assignment-toolbar__sort-item ${sortBy === 'name' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('name');
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Tên
                    </div>
                  </div>
                )}
              </div>
              
              <button className="teacher-assignment-toolbar__create-btn" onClick={() => setIsCreateModalOpen(true)}>
                <MdAdd size={20} />
                Tạo bài tập
              </button>
            </div>

            {/* Selection Bar */}
            {isSelectionMode && (
              <div className="teacher-assignment-page__selection-bar">
                <div className="teacher-assignment-selection-bar__left">
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
                    Đang chọn <span className="teacher-assignment-selection-count">{selectedItems.length} bài tập</span>
                  </span>
                </div>
                <div className="teacher-assignment-selection-bar__right">
                  <button className="teacher-assignment-selection-action-btn">
                    <MdFolder size={16} />
                    Di chuyển
                  </button>
                  <button
                    className="teacher-assignment-selection-action-btn"
                    onClick={async () => {
                      if (selectedItems.length === 0) return;
                      await deleteAssignmentsByIds(selectedItems);
                    }}
                  >
                    <MdDelete size={16} />
                    Xoá
                  </button>
                </div>
              </div>
            )}

            {/* Assignment List */}
            <div className="teacher-assignment-page__list-container">
              {loading ? (
                <div className="teacher-assignment-loading">
                  <div className="teacher-assignment-loading__spinner">⏳</div>
                  <p>Đang tải danh sách bài tập...</p>
                </div>
              ) : error ? (
                <div className="teacher-assignment-error">
                  <div className="teacher-assignment-error__icon">❌</div>
                  <p>Lỗi tải bài tập: {error}</p>
                  <button 
                    className="teacher-assignment-error__retry"
                    onClick={() => window.location.reload()}
                  >
                    Thử lại
                  </button>
                </div>
              ) : assignments.length === 0 ? (
                <div
                  className="teacher-assignment-empty"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: '220px',
                    padding: '12px 8px'
                  }}
                >
                  <h3 style={{margin:0, fontSize:'16px', fontWeight:600}}>Chưa có bài tập nào</h3>
                </div>
              ) : (
                <div className="teacher-assignment-list">
                  {assignments.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className={`teacher-assignment-item ${selectedAssignment === assignment.title ? 'selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
                    onClick={() => {
                      if (isSelectionMode) {
                        if (selectedItems.includes(assignment.id)) {
                          setSelectedItems(selectedItems.filter(id => id !== assignment.id));
                        } else {
                          setSelectedItems([...selectedItems, assignment.id]);
                        }
                      } else {
                        setSelectedAssignment(assignment.title);
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
                        className="teacher-assignment-checkbox"
                      />
                    )}
                    <div className="teacher-assignment-item__icon">
                      {assignment.icon}
                    </div>
                    <div className="teacher-assignment-item__content">
                      <div className="teacher-assignment-item__title">{assignment.title}</div>
                      <div className="teacher-assignment-item__type">{assignment.type}</div>
                      <div className="teacher-assignment-item__progress">
                        <div className="teacher-assignment-progress-bar">
                          <div 
                            className="teacher-assignment-progress-bar__fill" 
                            style={{width: `${(assignment.completed / assignment.total) * 100}%`}}
                          ></div>
                        </div>
                        <span className="teacher-assignment-progress-text">{assignment.progress}</span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Assignment Details */}
          {selectedAssignmentData && (
            <div className="teacher-assignment-page__details-sidebar">
              {/* File Name Section */}
              <div className="teacher-assignment-details__header">
                <h2 className="teacher-assignment-details__title">{selectedAssignmentData.title}</h2>
              </div>

              {/* Combined Scrollable Content */}
              <div className="teacher-assignment-details__scrollable-content">
                {/* Sharing Section */}
                <div className="teacher-assignment-details__sharing">
                  <div className="teacher-assignment-sharing__header">
                    <h3 className="teacher-assignment-sharing__title">Chia sẻ bài tập</h3>
                    <div className="teacher-assignment-sharing__badge">
                      <span className="teacher-assignment-sharing__badge-text">Mới</span>
                      <span className="teacher-assignment-sharing__badge-sparkle">✨</span>
                      <span className="teacher-assignment-sharing__badge-sparkle">✨</span>
                    </div>
                  </div>

                  <div className="teacher-assignment-sharing__platforms">
                    <span className="teacher-assignment-sharing__label">Chia sẻ lên</span>
                                          <div className="teacher-assignment-sharing__icons">
                        <button className="teacher-assignment-sharing__icon teacher-assignment-sharing__icon--facebook" title="Chia sẻ lên Facebook">
                          <img src="/img/facebook.webp" style={{width: '20px', height: '20px'}} alt="Facebook" />
                        </button>
                        <button className="teacher-assignment-sharing__icon teacher-assignment-sharing__icon--messenger" title="Chia sẻ lên Messenger">
                          <img src="/img/mes.webp" style={{width: '20px', height: '20px'}} alt="Messenger" />
                        </button>
                        <button className="teacher-assignment-sharing__icon teacher-assignment-sharing__icon--zalo" title="Chia sẻ lên Zalo">
                          <img src="/img/zalo.webp" style={{width: '20px', height: '20px'}} alt="Zalo" />
                        </button>
                      </div>
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="teacher-assignment-details__info">
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Số lần làm bài</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.attempts}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Lấy điểm</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.scoreType}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Loại</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.type}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Ngày tạo</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.creationDate}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Bắt đầu</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.startTime}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Thời lượng</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.duration}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Đã làm</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.completedBy}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Cho phép</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.allowedActions}</span>
                  </div>
                  <div className="teacher-assignment-info__item">
                    <span className="teacher-assignment-info__label">Hạn chót</span>
                    <span className="teacher-assignment-info__value">{selectedAssignmentData.deadline}</span>
                  </div>
                </div>
              </div>

              {/* Action Menu */}
              <div className="teacher-assignment-details__actions">
                <button 
                  className={`teacher-assignment-action__item ${activeAction === 'details' ? 'teacher-assignment-action__item--active' : ''}`}
                  onClick={handleViewDetails}
                  disabled={!BACKEND_READY}
                  title={!BACKEND_READY ? 'Chức năng đang phát triển' : ''}
                >
                  <span>Chi tiết</span>
                  <MdVisibility size={16} />
                </button>
                <button 
                  className={`teacher-assignment-action__item teacher-assignment-action__item--edit ${activeAction === 'edit' ? 'teacher-assignment-action__item--active' : ''}`}
                  onClick={handleEditAssignment}
                  disabled={!BACKEND_READY}
                  title={!BACKEND_READY ? 'Chức năng đang phát triển' : ''}
                >
                  <span>Chỉnh sửa</span>
                  <MdEdit size={16} />
                </button>
                <button 
                  className={`teacher-assignment-action__item teacher-assignment-action__item--delete ${activeAction === 'delete' ? 'teacher-assignment-action__item--active' : ''}`}
                  onClick={handleDeleteAssignment}
                  disabled={!BACKEND_READY}
                  title={!BACKEND_READY ? 'Chức năng đang phát triển' : ''}
                >
                  <span>Xóa</span>
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success Modal */}
        {successModal.open && (
          <div className="modal-backdrop" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
            <div className="modal-card" style={{background:'#fff',borderRadius:8,padding:'20px 24px',minWidth:320,boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
              <h3 style={{margin:'0 0 8px'}}>Thành công</h3>
              <p style={{margin:'0 0 16px'}}>{successModal.message}</p>
              <div style={{textAlign:'right'}}>
                <button className="btn" onClick={() => setSuccessModal({ open:false, message:'' })} style={{padding:'8px 14px',border:'none',background:'#1976d2',color:'#fff',borderRadius:6,cursor:'pointer'}}>OK</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Assignment Modal */}
        <CreateAssignmentModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          classId={classId}
        />
      </div>
    </div>
  );
}

export default AssignmentPage;
