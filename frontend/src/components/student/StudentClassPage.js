import React, { useState, useRef, useEffect } from 'react';
import DashboardHeader from './DashboardHeader';
import '../../styles/ClassPage.css';
import { useNavigate } from 'react-router-dom';
import Find from './Find';
import { api } from '../../utils/api';
import ScrollingNotice from '../common/ScrollingNotice';



// Đã xóa toàn bộ biến, hằng số, key, hàm, comment liên quan đến teacher. Chỉ giữ lại logic và UI cho student.

function ConfirmTrashModal({ open, onClose, className, onConfirm }) {
  if (!open) return null;
  return (
    <div className="trash-modal-overlay">
      <div className="trash-modal">
        <div className="trash-modal-icon">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none"><ellipse cx="48" cy="80" rx="32" ry="8" fill="#e3eafc"/><rect x="28" y="36" width="40" height="36" rx="8" fill="#e3eafc"/><rect x="36" y="24" width="24" height="12" rx="4" fill="#90caf9"/><rect x="40" y="12" width="16" height="12" rx="4" fill="#b0bec5"/><rect x="32" y="36" width="32" height="36" rx="8" fill="#90caf9"/><rect x="40" y="44" width="4" height="20" rx="2" fill="#e3eafc"/><rect x="52" y="44" width="4" height="20" rx="2" fill="#e3eafc"/></svg>
        </div>
        <div className="trash-modal-title">Chuyển vào thùng rác</div>
        <div className="trash-modal-desc">
          Lớp học <b>{className}</b> sẽ được lưu trữ trong thùng rác 7 ngày. Sau 7 ngày, lớp sẽ tự động bị xóa vĩnh viễn. Bạn có chắc chắn muốn xóa?
        </div>
        <div className="trash-modal-actions">
          <button className="trash-modal-btn trash-modal-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="trash-modal-btn trash-modal-btn-danger" onClick={onConfirm}>Chuyển vào thùng rác</button>
        </div>
      </div>
    </div>
  );
}

function StudentClassPage() {
  const [viewMode, setViewMode] = useState('list');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  const [activeTab, setActiveTab] = useState('your-classes');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Lấy dữ liệu từ backend API
  const [visibleClasses, setVisibleClasses] = useState([]);
  const [pendingClasses] = useState([]);
  const [hiddenClasses, setHiddenClasses] = useState([]);
  const [trashedClasses, setTrashedClasses] = useState([]);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashClassName, setTrashClassName] = useState('');
  const [trashClassId, setTrashClassId] = useState(null);
  const [trashFrom, setTrashFrom] = useState('visible');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarClass, setSnackbarClass] = useState(null);
  const snackbarTimeoutRef = useRef();
  const [sortBy, setSortBy] = useState('oldest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  // Thông báo hệ thống đang hiệu lực cho học sinh
  const [activeNotice, setActiveNotice] = useState(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setIsSortDropdownOpen(false);
  };
  const handleSortClick = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Đảm bảo activeTab luôn hợp lệ khi các tab bị ẩn
  useEffect(() => {
    const availableTabs = ['your-classes'];
    if (pendingClasses.length > 0) availableTabs.push('pending-classes');
    if (hiddenClasses.length > 0) availableTabs.push('hidden-classes');
    
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('your-classes');
    }
  }, [pendingClasses.length, hiddenClasses.length, activeTab]);

  // Load student classes from backend
  useEffect(() => {
    const loadStudentClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Kiểm tra user role
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        
        if (!currentUser.id || !currentUser.role) {
          console.error('❌ Không có thông tin user hoặc role');
          setError('Vui lòng đăng nhập lại');
          setVisibleClasses([]);
          return;
        }
        
        if (currentUser.role === 'teacher') {
          // Giáo viên: sử dụng route /teacher
          const response = await api.classes.getTeacherClasses();
          if (response.classes) {
            const transformedClasses = response.classes.map(cls => ({
              id: cls.id,
              name: cls.name,
              code: cls.class_code,
              image: cls.image || 'https://i.imgur.com/1bX5QH6.jpg',
              students: cls.student_count || 0,
              lectures: cls.lecture_count || 0,
              homeworks: cls.homework_count || 0,
              materials: cls.material_count || 0,
              subject: cls.subject,
              description: cls.description,
              teacher_name: cls.teacher_name
            }));
            setVisibleClasses(transformedClasses);
          }
        } else if (currentUser.role === 'student') {
          // Học sinh: sử dụng route /student
          const response = await api.classes.getStudentClasses();
          
          if (response.classes) {
            // Transform backend data to match frontend format
            const transformedClasses = response.classes.map(cls => ({
              id: cls.id,
              name: cls.name,
              code: cls.class_code,
              image: cls.image || 'https://i.imgur.com/1bX5QH6.jpg', // Default image
              students: cls.student_count || 0,
              lectures: cls.lecture_count || 0,
              homeworks: cls.homework_count || 0,
              materials: cls.material_count || 0,
              subject: cls.subject,
              description: cls.description,
              teacher_name: cls.teacher_name
            }));
            
            setVisibleClasses(transformedClasses);
          } else {
            setVisibleClasses([]);
          }
        } else {
          console.error('❌ Role không hợp lệ:', currentUser.role);
          setError('Role không hợp lệ');
          setVisibleClasses([]);
        }
      } catch (err) {
        console.error('❌ Error loading student classes:', err);
        setError('Không thể tải danh sách lớp học');
        setVisibleClasses([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudentClasses();
  }, []);

  // Refresh classes when window gains focus (e.g., after joining a class)
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        const loadStudentClasses = async () => {
          try {
            const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
            
            if (currentUser.role === 'teacher') {
              const response = await api.classes.getTeacherClasses();
              if (response.classes) {
                const transformedClasses = response.classes.map(cls => ({
                  id: cls.id,
                  name: cls.name,
                  code: cls.class_code,
                  image: cls.image || 'https://i.imgur.com/1bX5QH6.jpg',
                  students: cls.student_count || 0,
                  lectures: cls.lecture_count || 0,
                  homeworks: cls.homework_count || 0,
                  materials: cls.material_count || 0,
                  subject: cls.subject,
                  description: cls.description,
                  teacher_name: cls.teacher_name
                }));
                setVisibleClasses(transformedClasses);
              }
            } else if (currentUser.role === 'student') {
              const response = await api.classes.getStudentClasses();
              if (response.classes) {
                const transformedClasses = response.classes.map(cls => ({
                  id: cls.id,
                  name: cls.name,
                  code: cls.class_code,
                  image: cls.image || 'https://i.imgur.com/1bX5QH6.jpg',
                  students: cls.student_count || 0,
                  lectures: cls.lecture_count || 0,
                  homeworks: cls.homework_count || 0,
                  materials: cls.material_count || 0,
                  subject: cls.subject,
                  description: cls.description,
                  teacher_name: cls.teacher_name
                }));
                setVisibleClasses(transformedClasses);
              }
            }
          } catch (err) {
            console.error('Error refreshing student classes:', err);
          }
        };
        loadStudentClasses();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loading]);

  // Load thông báo hệ thống cho role student
  useEffect(() => {
    let mounted = true;
    const loadActiveNotice = async () => {
      try {
        setNoticeLoading(true);
        const res = await api.notices.getActive('student');
        if (!mounted) return;
        setActiveNotice(res && res.notice ? res.notice : null);
      } catch (e) {
        console.error('❌ Lỗi tải thông báo hệ thống:', e);
        if (mounted) setActiveNotice(null);
      } finally {
        if (mounted) setNoticeLoading(false);
      }
    };
    loadActiveNotice();
    return () => { mounted = false; };
  }, []);

  const handleMenuClick = (id, e) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
    }
  };

  const handleMenuAction = (action, id) => {
    setOpenMenuId(null);
    if (action === 'join') {
      const cls = visibleClasses.find(cls => cls.id === id);
      if (cls) {
        navigate(`/student/class/${cls.code}/announcement`);
      }
      return;
    }
    if (action === 'hide') {
      const classToHide = visibleClasses.find(cls => cls.id === id);
      if (classToHide) {
        setVisibleClasses(visibleClasses.filter(cls => cls.id !== id));
        setHiddenClasses([classToHide, ...hiddenClasses]);
      }
      return;
    }
    if (action === 'unhide') {
      const classToUnhide = hiddenClasses.find(cls => cls.id === id);
      if (classToUnhide) {
        setHiddenClasses(hiddenClasses.filter(cls => cls.id !== id));
        setVisibleClasses([classToUnhide, ...visibleClasses]);
      }
      return;
    }
    if (action === 'delete') {
      let cls = visibleClasses.find(cls => cls.id === id);
      let from = 'visible';
      if (!cls) {
        cls = hiddenClasses.find(cls => cls.id === id);
        from = 'hidden';
      }
      setTrashClassName(cls ? cls.name : '');
      setTrashClassId(id);
      setTrashModalOpen(true);
      setTrashFrom(from);
      return;
    }
    if (action === 'edit') {
      const cls = visibleClasses.find(cls => cls.id === id);
      if (cls) {
        navigate(`/student/class/${cls.code}/announcement`);
      }
      return;
    }
    if (action === 'duplicate') {
      const classToDuplicate = visibleClasses.find(cls => cls.id === id);
      if (classToDuplicate) {
        const newClass = { ...classToDuplicate, id: Date.now() };
        setVisibleClasses([newClass, ...visibleClasses]);
      }
      return;
    }
  };

  const handleTrashConfirm = () => {
    let cls = null;
    let newVisible = visibleClasses;
    let newHidden = hiddenClasses;
    let newTrashed = trashedClasses;
    if (trashFrom === 'visible') {
      cls = visibleClasses.find(c => c.id === trashClassId);
      if (cls) {
        newVisible = visibleClasses.filter(c => c.id !== trashClassId);
      }
    } else {
      cls = hiddenClasses.find(c => c.id === trashClassId);
      if (cls) {
        newHidden = hiddenClasses.filter(c => c.id !== trashClassId);
      }
    }
    if (cls) {
      const trashedClass = { ...cls, deletedAt: Date.now() };
      newTrashed = [trashedClass, ...trashedClasses];
              sessionStorage.setItem('student_visible_classes', JSON.stringify(newVisible));
        sessionStorage.setItem('student_hidden_classes', JSON.stringify(newHidden));
        sessionStorage.setItem('student_trashed_classes', JSON.stringify(newTrashed));
      setVisibleClasses(newVisible);
      setHiddenClasses(newHidden);
      setTrashedClasses(newTrashed);
      setSnackbarClass(trashedClass);
      setSnackbarOpen(true);
      if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);
      snackbarTimeoutRef.current = setTimeout(() => setSnackbarOpen(false), 4000);
    }
    setTrashModalOpen(false);
  };
  const handleUndoTrash = () => {
    if (!snackbarClass) return;
    const newTrashed = trashedClasses.filter(c => c.id !== snackbarClass.id);
    const newVisible = [snackbarClass, ...visibleClasses];
    setTrashedClasses(newTrashed);
    setVisibleClasses(newVisible);
            sessionStorage.setItem('student_trashed_classes', JSON.stringify(newTrashed));
        sessionStorage.setItem('student_visible_classes', JSON.stringify(newVisible));
    setSnackbarOpen(false);
  };

  const handleClassClick = (cls) => {
    navigate(`/student/class/${cls.code}/announcement`);
  };

  // Tab data - chỉ hiển thị tab khi có dữ liệu
  const tabData = [
    { 
      key: 'your-classes', 
      label: `Lớp của bạn (${visibleClasses.length})`,
      alwaysShow: true // Luôn hiển thị tab "Lớp của bạn"
    },
    ...(pendingClasses.length > 0 ? [{
      key: 'pending-classes', 
      label: `Lớp đang chờ (${pendingClasses.length})`
    }] : []),
    ...(hiddenClasses.length > 0 ? [{
      key: 'hidden-classes', 
      label: `Lớp đã ẩn (${hiddenClasses.length})`
    }] : [])
  ];

  return (
    <div className="student-classpage-container">
      <DashboardHeader />
      {activeTab === 'your-classes' && activeNotice && (
        <ScrollingNotice
          message={activeNotice.message}
          tone={activeNotice.tone || 'info'}
        />
      )}
      <div className="student-classpage-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 32px 8px 32px' }}>
        <div className="student-classpage-tabs compact">
          {tabData.map(tab => (
            <button
              key={tab.key}
              className={`student-classpage-tab compact${activeTab === tab.key ? ' student-classpage-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          className="student-class-gridtoggle"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          aria-label={viewMode === 'grid' ? 'Chuyển sang dạng danh sách' : 'Chuyển sang dạng lưới'}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginLeft: 8,
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 6,
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f4f6f8'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
        >
          {viewMode === 'grid' ? (
            // List icon
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="6" width="16" height="2" rx="1" fill="#888" />
              <rect x="4" y="11" width="16" height="2" rx="1" fill="#888" />
              <rect x="4" y="16" width="16" height="2" rx="1" fill="#888" />
            </svg>
          ) : (
            // Grid icon
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="6" height="6" rx="1" fill="#888" />
              <rect x="14" y="4" width="6" height="6" rx="1" fill="#888" />
              <rect x="4" y="14" width="6" height="6" rx="1" fill="#888" />
              <rect x="14" y="14" width="6" height="6" rx="1" fill="#888" />
            </svg>
          )}
        </button>
      </div>
      <div className="student-class-toolbar compact" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 32px 16px 32px' }}>
        <input className="student-class-search compact" type="text" placeholder="Tìm kiếm..." />
        <div className="student-class-sort-container" style={{ position: 'relative' }}>
          <div 
            className="student-class-sort-button"
            onClick={handleSortClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: '#fff',
              cursor: 'pointer',
              minWidth: '120px',
              position: 'relative'
            }}
          >
            <span>{sortBy === 'oldest' ? 'Cũ nhất' : sortBy === 'name' ? 'Tên lớp' : 'Mã lớp'}</span>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className={`student-class-sort-arrow ${isSortDropdownOpen ? 'rotated' : ''}`}
              style={{
                position: 'absolute',
                right: '8px',
                color: '#222',
                pointerEvents: 'none',
                transition: 'transform 0.2s ease',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              <path d="m7 10 5 5 5-5z" fill="currentColor"/>
            </svg>
          </div>
          {isSortDropdownOpen && (
            <div className="student-class-sort-dropdown" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 10,
              marginTop: '4px'
            }}>
              <button 
                className="student-class-sort-option"
                onClick={() => handleSortChange({ target: { value: 'oldest' } })}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                Cũ nhất
              </button>
              <button 
                className="student-class-sort-option"
                onClick={() => handleSortChange({ target: { value: 'name' } })}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                Tên lớp
              </button>
              <button 
                className="student-class-sort-option"
                onClick={() => handleSortChange({ target: { value: 'code' } })}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                Mã lớp
              </button>
            </div>
          )}
        </div>
        <button className="student-class-create primary" onClick={() => navigate('/student/find')}>+ Tìm lớp học</button>
      </div>
      <div className="student-class-list">
        {activeTab === 'your-classes' ? (
          loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              fontSize: '16px',
              color: '#666'
            }}>
              Đang tải danh sách lớp học...
            </div>
          ) : error ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              fontSize: '16px',
              color: '#d32f2f'
            }}>
              {error}
            </div>
          ) : visibleClasses.length === 0 ? (
            <table className="student-class-table compact">
              <thead>
                <tr>
                  <th className="student-class-table__name">Tên lớp</th>
                  <th>Học sinh</th>
                  <th>Bài giảng</th>
                  <th>Bài tập</th>
                  <th>Tài liệu</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6">
                    <div className="student-classpage-empty-state">
                      <img
                        src="https://cdn.dribbble.com/users/1615584/screenshots/4182141/media/2b7e1e2e2e2e2e2e2e2e2e2e2e2e2e2e.png"
                        alt="No classes"
                        className="student-classpage-empty-img"
                      />
                      <div className="student-classpage-empty-title">Không tìm thấy lớp học nào</div>
                      <div className="student-classpage-empty-desc">
                        Hãy kiểm tra trong danh sách lớp học khác, hoặc khởi tạo lớp học của bạn
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            viewMode === 'grid' ? (
              <div className="student-class-grid">
                {visibleClasses.map(cls => (
                  <div
                    className="student-class-card"
                    key={cls.id}
                    style={{
                      position: 'relative',
                      borderRadius: 16,
                      boxShadow: '0 2px 8px rgba(30,136,229,0.08)',
                      background: '#fff',
                      margin: 12,
                      padding: 0,
                      overflow: 'hidden',
                      minWidth: 220,
                      maxWidth: 320,
                      flex: '1 1 220px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onClick={() => handleClassClick(cls)}
                  >
                    <div style={{ width: '100%', height: 140, overflow: 'hidden' }}>
                      <div className="class-image-placeholder" style={{
                        width: '100%',
                        height: 140,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px 16px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}>
                        {cls.name && cls.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    {/* Đặt nút menu ở phía dưới, cùng hàng với tên lớp và mã lớp */}
                    <div className="student-class-card__info" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div className="student-class-card__name" style={{ fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</div>
                        <div className="student-class-card__code" style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{cls.code}</div>
                      </div>
                      <button
                        className="student-class-card-menu-btn"
                        onClick={e => { e.stopPropagation(); setOpenMenuId(cls.id); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          borderRadius: '50%',
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          marginLeft: 8,
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f4f6f8'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#888"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                      </button>
                    </div>
                    {openMenuId === cls.id && (
                      <div className="student-class-card-menu-popup" style={{
                        position: 'absolute',
                        top: 56,
                        right: 16,
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 4px 24px rgba(25, 118, 210, 0.13), 0 1.5px 8px rgba(0,0,0,0.10)',
                        minWidth: 180,
                        zIndex: 10,
                        padding: '8px 0',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        <button className="student-class-card-menu-item" onClick={() => handleMenuAction('join', cls.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                          <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                            <svg width="22" height="22" fill="#555" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                          </span> Vào lớp
                        </button>
                        <button className="student-class-card-menu-item" onClick={() => handleMenuAction('hide', cls.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                          <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                            <svg width="22" height="22" fill="#555" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.71 3.3-4.88 6-6.32M1 1l22 22" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="12" cy="12" r="3.5" stroke="#555" strokeWidth="2" fill="none"/></svg>
                          </span> Ẩn lớp
                        </button>
                        <button className="student-class-card-menu-item" onClick={() => handleMenuAction('delete', cls.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                          <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                            <svg width="22" height="22" fill="#555" viewBox="0 0 24 24">
                              <path d="M16 17l5-5-5-5" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              <path d="M21 12H9" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              <path d="M12 19v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                          </span> Rời lớp
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <table className="student-class-table compact">
                <thead>
                  <tr>
                    <th className="student-class-table__name">Tên lớp</th>
                    <th>Học sinh</th>
                    <th>Bài giảng</th>
                    <th>Bài tập</th>
                    <th>Tài liệu</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClasses.map(cls => (
                    <tr key={cls.id} onClick={() => handleClassClick(cls)} style={{cursor:'pointer'}}>
                      <td className="student-class-table__name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            width: 140, 
                            height: 60, 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold'
                          }}>
                            {cls.name && cls.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{cls.name}</div>
                            <div style={{ fontSize: 13, color: '#666' }}>Mã lớp • {cls.code}</div>
                          </div>
                        </div>
                      </td>
                      <td>{cls.students}</td>
                      <td>{cls.lectures}</td>
                      <td>{cls.homeworks}</td>
                      <td>{cls.materials}</td>
                      <td style={{ position: 'relative' }}>
                        <button
                          className="student-list-menu-btn"
                          onClick={(e) => handleMenuClick(cls.id, e)}
                        >
                          ⋮
                        </button>
                        {openMenuId === cls.id && (
                          <div className="student-list-menu-popup" ref={menuRef}>
                            <button className="student-list-menu-item" onClick={() => handleMenuAction('join', cls.id)}>
                              <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M9 6l6 6-6 6"/>
                                  <path d="M15 12H3"/>
                                </svg>
                              </span> Vào lớp
                            </button>
                            <button className="student-list-menu-item" onClick={() => handleMenuAction('hide', cls.id)}>
                              <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.71 3.3-4.88 6-6.32"/>
                                  <path d="M1 1l22 22"/>
                                  <circle cx="12" cy="12" r="3.5"/>
                                </svg>
                              </span> Ẩn lớp
                            </button>
                           
                            <button className="student-list-menu-item" onClick={() => handleMenuAction('delete', cls.id)}>
                              <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M9 16l-5-4 5-4"/>
                                  <path d="M4 12h12"/>
                                  <path d="M20 19V5a2 2 0 0 0-2-2h-7"/>
                                </svg>
                              </span> Rời lớp
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )
        ) : activeTab === 'pending-classes' ? (
          pendingClasses.length === 0 ? (
            <table className="student-class-table compact">
              <thead>
                <tr>
                  <th className="student-class-table__name">Tên lớp</th>
                  <th>Học sinh</th>
                  <th>Bài giảng</th>
                  <th>Bài tập</th>
                  <th>Tài liệu</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6">
                    <div className="student-classpage-empty-state">
                      <img
                        src="https://cdn.dribbble.com/users/1615584/screenshots/4182141/media/2b7e1e2e2e2e2e2e2e2e2e2e2e2e2e2e.png"
                        alt="No pending classes"
                        className="student-classpage-empty-img"
                      />
                      <div className="student-classpage-empty-title">Không có lớp đang chờ</div>
                      <div className="student-classpage-empty-desc">
                        Các lớp bạn đang chờ sẽ xuất hiện ở đây.
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="student-class-table compact">
              <thead>
                <tr>
                  <th className="student-class-table__name">Tên lớp</th>
                  <th>Học sinh</th>
                  <th>Bài giảng</th>
                  <th>Bài tập</th>
                  <th>Tài liệu</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingClasses.map(cls => (
                  <tr key={cls.id} style={{cursor:'pointer'}}>
                    <td className="student-class-table__name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={cls.image} alt="Class" style={{ width: 140, height: 60, objectFit: 'cover', borderRadius: 0 }} />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{cls.name}</div>
                          <div style={{ fontSize: 13, color: '#666' }}>Mã lớp • {cls.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>{cls.students}</td>
                    <td>{cls.lectures}</td>
                    <td>{cls.homeworks}</td>
                    <td>{cls.materials}</td>
                    <td style={{ position: 'relative' }}>
                      <button
                        className="student-list-menu-btn"
                        onClick={(e) => handleMenuClick(cls.id, e)}
                      >
                        ⋮
                      </button>
                      {openMenuId === cls.id && (
                        <div className="student-list-menu-popup" ref={menuRef}>
                          <button className="student-list-menu-item" onClick={() => handleMenuAction('join', cls.id)}>
                            <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M9 6l6 6-6 6"/>
                                <path d="M15 12H3"/>
                              </svg>
                            </span> Vào lớp
                          </button>
                          <button className="student-list-menu-item" onClick={() => handleMenuAction('hide', cls.id)}>
                            <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.71 3.3-4.88 6-6.32M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.98 0 1.87-.36 2.56-.95"/><path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.98 0-1.87.36-2.56.95"/></svg>
                            </span> Ẩn lớp
                          </button>
                          <button className="student-list-menu-item" onClick={() => handleMenuAction('delete', cls.id)}>
                            <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M9 16l-5-4 5-4"/>
                                  <path d="M4 12h12"/>
                                  <path d="M20 19V5a2 2 0 0 0-2-2h-7"/>
                                </svg>
                            </span> Rời lớp
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <table className="student-class-table compact">
            <thead>
              <tr>
                <th className="student-class-table__name">Tên lớp</th>
                <th>Học sinh</th>
                <th>Bài giảng</th>
                <th>Bài tập</th>
                <th>Tài liệu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {hiddenClasses.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="student-classpage-empty-state">
                      <img
                        src="https://cdn.dribbble.com/users/1615584/screenshots/4182141/media/2b7e1e2e2e2e2e2e2e2e2e2e2e2e2e2e.png"
                        alt="No hidden classes"
                        className="student-classpage-empty-img"
                      />
                      <div className="student-classpage-empty-title">Không có lớp đã ẩn</div>
                      <div className="student-classpage-empty-desc">
                        Các lớp bạn ẩn sẽ xuất hiện ở đây.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                hiddenClasses.map(cls => (
                  <tr key={cls.id}>
                    <td className="student-class-table__name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={cls.image} alt="Class" style={{ width: 140, height: 60, objectFit: 'cover', borderRadius: 0 }} />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{cls.name}</div>
                          <div style={{ fontSize: 13, color: '#666' }}>Mã lớp • {cls.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>{cls.students}</td>
                    <td>{cls.lectures}</td>
                    <td>{cls.homeworks}</td>
                    <td>{cls.materials}</td>
                    <td style={{ position: 'relative' }}>
                      <button
                        className="student-list-menu-btn"
                        onClick={(e) => handleMenuClick(cls.id, e)}
                      >
                        ⋮
                      </button>
                      {openMenuId === cls.id && (
                        <div className="student-list-menu-popup" ref={menuRef}>
                          <button className="student-list-menu-item" onClick={() => handleMenuAction('unhide', cls.id)}>
                            <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center',width:22,height:22}}>
                              <svg width="22" height="22" fill="#555" viewBox="0 0 24 24">
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="#555" strokeWidth="2" fill="none"/>
                                <circle cx="12" cy="12" r="3.5" stroke="#555" strokeWidth="2" fill="none"/>
                              </svg>
                            </span> Hiện lớp
                          </button>
                          <button className="student-list-menu-item" onClick={() => handleMenuAction('delete', cls.id)}>
                            <span className="student-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M3 6h18"/>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <rect x="5" y="6" width="14" height="13" rx="2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </span> Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <ConfirmTrashModal open={trashModalOpen} onClose={() => setTrashModalOpen(false)} className={trashClassName} onConfirm={handleTrashConfirm} />
      {snackbarOpen && snackbarClass && (
        <div className="student-snackbar">
          <div className="student-snackbar-content">
            <span>Đã xóa lớp {snackbarClass.name}</span>
            <button onClick={handleUndoTrash} className="student-snackbar-undo-btn">Hoàn tác</button>
          </div>
        </div>
      )}
      </div>
  );
}

export default StudentClassPage; 