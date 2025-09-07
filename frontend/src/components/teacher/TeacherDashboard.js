import React, { useState, useRef, useEffect } from 'react';
import Header from '../teacher/Header';
import '../../styles/TeacherDashboard.css';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import ScrollingNotice from '../common/ScrollingNotice';

function ConfirmTrashModal({ open, onClose, className, onConfirm }) {
  if (!open) return null;
  return (
    <div className="trash-modal-overlay">
      <div className="trash-modal">
        <div className="trash-modal-icon">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none"><ellipse cx="48" cy="80" rx="32" ry="8" fill="#e3eafc"/><rect x="28" y="36" width="40" height="36" rx="8" fill="#e3eafc"/><rect x="36" y="24" width="24" height="12" rx="4" fill="#90caf9"/><rect x="40" y="12" width="16" height="12" rx="4" fill="#b0bec5"/><rect x="32" y="36" width="32" height="36" rx="8" fill="#90caf9"/><rect x="40" y="44" width="4" height="20" rx="2" fill="#e3eafc"/><rect x="52" y="44" width="4" height="20" rx="2" fill="#e3eafc"/></svg>
        </div>
        <div className="trash-modal-title">Xóa lớp học</div>
        <div className="trash-modal-desc">
          Lớp học <b>{className}</b> sẽ được chuyển vào thùng rác và lưu trữ trong 7 ngày. Sau 7 ngày, lớp sẽ tự động bị xóa vĩnh viễn. Bạn có chắc chắn muốn xóa?
        </div>
        <div className="trash-modal-actions">
          <button className="trash-modal-btn trash-modal-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="trash-modal-btn trash-modal-btn-danger" onClick={onConfirm}>Xóa</button>
        </div>
      </div>
    </div>
  );
}

// Component hiển thị danh sách lớp học
function ClassList({ 
  classes, 
  viewMode, 
  activeTab, 
  openMenuId, 
  menuRef, 
  onMenuClick, 
  onMenuAction, 
  emptyMessage, 
  emptyDescription 
}) {
  if (classes.length === 0) {
    return (
      <table className="teacher-class-table compact">
        <thead>
          <tr>
            <th className="teacher-class-table__name">Tên lớp</th>
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
              <div className="teacher-classpage-empty-state">
                <img
                  src="https://cdn.dribbble.com/users/1615584/screenshots/4182141/media/2b7e1e2e2e2e2e2e2e2e2e2e2e2e2e2e.png"
                  alt="No classes"
                  className="teacher-classpage-empty-img"
                />
                <div className="teacher-classpage-empty-title">{emptyMessage}</div>
                <div className="teacher-classpage-empty-desc">{emptyDescription}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="teacher-class-grid">
        {classes.map(cls => (
          <div
            className="teacher-class-card"
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
              cursor: activeTab !== 'deleted-classes' ? 'pointer' : 'default',
            }}
            onClick={() => { if (activeTab !== 'deleted-classes') onMenuAction('join', cls.id); }}
          >
            <div style={{ width: '100%', height: 140, overflow: 'hidden' }}>
              <div className="class-image-placeholder" style={{ 
                width: '100%', 
                height: 140, 
                background: activeTab === 'deleted-classes' 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                borderRadius: '16px 16px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {cls.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="teacher-class-card__info" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <div className="teacher-class-card__name" style={{ 
                  fontWeight: 600, 
                  fontSize: 16, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  color: activeTab === 'deleted-classes' ? '#666' : '#222'
                }}>
                  {cls.name}
                </div>
                <div className="teacher-class-card__code" style={{ 
                  fontSize: 14, 
                  color: activeTab === 'deleted-classes' ? '#999' : '#888', 
                  marginTop: 4 
                }}>
                  {activeTab === 'deleted-classes' ? 'Đã xóa • ' : 'Mã lớp • '}{cls.code || cls.class_code || 'N/A'}
                </div>
              </div>
              <button
                className="teacher-class-card-menu-btn"
                onClick={e => { e.stopPropagation(); onMenuClick(cls.id, e); }}
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
              <div className="teacher-class-card-menu-popup" style={{
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
                {activeTab === 'your-classes' && (
                  <>
                    <button className="teacher-class-card-menu-item" onClick={() => onMenuAction('join', cls.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                        <svg width="22" height="22" fill="#555" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                      </span> Vào lớp
                    </button>
                    <button className="teacher-class-card-menu-item" onClick={() => onMenuAction('hide', cls.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                        <svg width="22" height="22" fill="#555" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.71 3.3-4.88 6-6.32M1 1l22 22" stroke="#555" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3.5" stroke="#555" strokeWidth="2" fill="none"/></svg>
                      </span> Ẩn lớp
                    </button>
                  </>
                )}
                {activeTab === 'hidden-classes' && (
                  <button className="teacher-class-card-menu-item" onClick={() => onMenuAction('unhide', cls.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                      <svg width="22" height="22" fill="#555" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="#555" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3.5" stroke="#555" strokeWidth="2" fill="none"/></svg>
                    </span> Hiện lớp
                  </button>
                )}
                {activeTab === 'deleted-classes' && (
                  <button className="teacher-class-card-menu-item" onClick={() => onMenuAction('restore', cls.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                      <svg width="22" height="22" fill="#555" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="#555" strokeWidth="2" fill="none"/><path d="M21 3v5h-5" stroke="#555" strokeWidth="2" fill="none"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="#555" strokeWidth="2" fill="none"/><path d="M3 21v-5h5" stroke="#555" strokeWidth="2" fill="none"/></svg>
                    </span> Khôi phục
                  </button>
                )}
                <button className="teacher-class-card-menu-item" onClick={() => onMenuAction('delete', cls.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: '#222', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.18s', width: '100%', textAlign: 'left',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f3f4f8'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center', width:22, height:22}}>
                    <svg width="22" height="22" fill="#555" viewBox="0 0 24 24">
                      <path d="M3 6h18" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <rect x="5" y="6" width="14" height="13" rx="2" stroke="#555" strokeWidth="2" fill="none"/>
                      <line x1="10" y1="11" x2="10" y2="17" stroke="#555" strokeWidth="2"/>
                      <line x1="14" y1="11" x2="14" y2="17" stroke="#555" strokeWidth="2"/>
                    </svg>
                  </span> Xóa
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className="teacher-class-table compact">
      <thead>
        <tr>
          <th className="teacher-class-table__name">Tên lớp</th>
          <th>Học sinh</th>
          <th>Bài giảng</th>
          <th>Bài tập</th>
          <th>Tài liệu</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {classes.map(cls => (
          <tr key={cls.id} style={{cursor: activeTab !== 'deleted-classes' ? 'pointer' : 'default'}} onClick={() => { if (activeTab !== 'deleted-classes') onMenuAction('join', cls.id); }}>
            <td className="teacher-class-table__name">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 140, 
                  height: 60, 
                  background: activeTab === 'deleted-classes' 
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  borderRadius: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {cls.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: activeTab === 'deleted-classes' ? '#666' : '#222'
                  }}>
                    {cls.name}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: activeTab === 'deleted-classes' ? '#999' : '#666' 
                  }}>
                    {activeTab === 'deleted-classes' ? 'Đã xóa • ' : 'Mã lớp • '}{cls.code || cls.class_code || 'N/A'}
                  </div>
                </div>
              </div>
            </td>
            <td>{cls.student_count || 0}</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td style={{ position: 'relative' }}>
              <button
                className="teacher-list-menu-btn"
                onClick={(e) => { e.stopPropagation(); onMenuClick(cls.id, e); }}
              >
                ⋮
              </button>
              {openMenuId === cls.id && (
                <div className="teacher-list-menu-popup" ref={menuRef}>
                  {activeTab === 'your-classes' && (
                    <>
                      <button className="teacher-list-menu-item" onClick={() => onMenuAction('join', cls.id)}>
                        <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 6l6 6-6 6"/>
                            <path d="M15 12H3"/>
                          </svg>
                        </span> Vào lớp
                      </button>
                      <button className="teacher-list-menu-item" onClick={() => onMenuAction('hide', cls.id)}>
                        <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.71 3.3-4.88 6-6.32"/>
                            <path d="M1 1l22 22"/>
                            <circle cx="12" cy="12" r="3.5"/>
                          </svg>
                        </span> Ẩn lớp
                      </button>
                    </>
                  )}
                  {activeTab === 'hidden-classes' && (
                    <button className="teacher-list-menu-item" onClick={() => onMenuAction('unhide', cls.id)}>
                      <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center',width:22,height:22}}>
                        <svg width="22" height="22" fill="#555" viewBox="0 0 24 24">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="#555" strokeWidth="2" fill="none"/>
                          <circle cx="12" cy="12" r="3.5" stroke="#555" strokeWidth="2" fill="none"/>
                        </svg>
                      </span> Hiện lớp
                    </button>
                  )}
                  {activeTab === 'deleted-classes' && (
                    <button className="teacher-list-menu-item" onClick={() => onMenuAction('restore', cls.id)}>
                      <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center',width:22,height:22}}>
                        <svg width="22" height="22" fill="#555" viewBox="0 0 24 24">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="#555" strokeWidth="2" fill="none"/>
                          <path d="M21 3v5h-5" stroke="#555" strokeWidth="2" fill="none"/>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="#555" strokeWidth="2" fill="none"/>
                          <path d="M3 21v-5h5" stroke="#555" strokeWidth="2" fill="none"/>
                        </svg>
                      </span> Khôi phục
                    </button>
                  )}
                  <button className="teacher-list-menu-item" onClick={() => onMenuAction('delete', cls.id)}>
                    <span className="teacher-list-menu-icon" style={{display:'inline-flex',alignItems:'center'}}>
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
        ))}
      </tbody>
    </table>
  );
}

function TeacherDashboard() {
  const [viewMode, setViewMode] = useState('list');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  const [activeTab, setActiveTab] = useState('your-classes');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State cho dữ liệu từ API
  const [visibleClasses, setVisibleClasses] = useState([]);
  const [hiddenClasses, setHiddenClasses] = useState([]);
  const [deletedClasses, setDeletedClasses] = useState([]);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashClassName, setTrashClassName] = useState('');
  const [trashClassId, setTrashClassId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarClass, setSnackbarClass] = useState(null);
  const snackbarTimeoutRef = useRef();
  const [sortBy, setSortBy] = useState('oldest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  // Thông báo hệ thống đang hiệu lực cho giáo viên
  const [activeNotice, setActiveNotice] = useState(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  const handleSortClick = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  // Load thông báo hệ thống cho role teacher
  useEffect(() => {
    let mounted = true;
    const loadActiveNotice = async () => {
      try {
        setNoticeLoading(true);
        const res = await api.notices.getActive('teacher');
        if (!mounted) return;
        const notice = res && res.notice ? res.notice : null;
        setActiveNotice(notice);
      } catch (e) {
        console.error('❌ Lỗi tải thông báo hệ thống (teacher):', e);
        if (mounted) setActiveNotice(null);
      } finally {
        if (mounted) setNoticeLoading(false);
      }
    };
    loadActiveNotice();
    return () => { mounted = false; };
  }, []);

  // Load dữ liệu từ API khi component mount
  useEffect(() => {
    console.log('🚀 Component mounted, loading classes...');
    loadClasses();
  }, []);

  // Reload data when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Page focused, reloading classes...');
      loadClasses();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('Visible classes:', visibleClasses.length);
    console.log('Hidden classes:', hiddenClasses.length);
    console.log('Deleted classes:', deletedClasses.length);
  }, [visibleClasses, hiddenClasses, deletedClasses]);

  // Đảm bảo activeTab luôn hợp lệ khi các tab bị ẩn
  useEffect(() => {
    const availableTabs = ['your-classes'];
    if (hiddenClasses.length > 0) availableTabs.push('hidden-classes');
    if (deletedClasses.length > 0) availableTabs.push('deleted-classes');
    
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('your-classes');
    }
  }, [hiddenClasses.length, deletedClasses.length, activeTab]);

  // Reload data when component becomes visible (when navigating back) - đã loại bỏ để tránh load lại không cần thiết

  // Force reload data periodically to ensure sync - đã loại bỏ để tránh load lại không cần thiết

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
      // Close sort dropdown when clicking outside
      if (isSortDropdownOpen && !event.target.closest('.teacher-class-sort-container')) {
        setIsSortDropdownOpen(false);
      }
    }
    if (openMenuId !== null || isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId, isSortDropdownOpen]);

  // Sync data with server after state changes - đã loại bỏ vì không cần thiết

  // Load dữ liệu lớp học từ API
  const loadClasses = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('🔄 Loading classes from API...');
      
      // Load lớp học hiện tại (không ẩn)
      const visibleResponse = await api.classes.getTeacherClasses(false);
      console.log('📋 Visible classes response:', visibleResponse);
      if (visibleResponse.classes) {
        setVisibleClasses(visibleResponse.classes);
        console.log('✅ Set visible classes:', visibleResponse.classes.length);
      } else {
        setVisibleClasses([]);
        console.log('⚠️ No visible classes found');
      }

      // Load lớp học đã ẩn
      const hiddenResponse = await api.classes.getTeacherClasses(true);
      console.log('👻 Hidden classes response:', hiddenResponse);
      if (hiddenResponse.classes) {
        setHiddenClasses(hiddenResponse.classes);
        console.log('✅ Set hidden classes:', hiddenResponse.classes.length);
      } else {
        setHiddenClasses([]);
        console.log('⚠️ No hidden classes found');
      }

      // Load lớp học đã xóa
      const deletedResponse = await api.classes.getDeletedClasses();
      console.log('🗑️ Deleted classes response:', deletedResponse);
      if (deletedResponse.classes) {
        setDeletedClasses(deletedResponse.classes);
        console.log('✅ Set deleted classes:', deletedResponse.classes.length);
      } else {
        setDeletedClasses([]);
        console.log('⚠️ No deleted classes found');
      }
    } catch (error) {
      console.error('❌ Error loading classes:', error);
      setError('Không thể tải danh sách lớp học');
      // Reset state khi có lỗi
      setVisibleClasses([]);
      setHiddenClasses([]);
      setDeletedClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuClick = (id, e) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
    }
  };

  const handleMenuAction = async (action, id) => {
    setOpenMenuId(null);
    setIsLoading(true);
    setError('');

    try {
      if (action === 'join') {
        const cls = visibleClasses.find(cls => cls.id === id);
        if (cls) {
          navigate(`/teacher/class/${cls.id}/announcement`);
        }
        return;
      }

      if (action === 'hide') {
        console.log('🙈 Hiding class with ID:', id);
        const response = await api.classes.toggleVisibility(id);
        console.log('🙈 Hide response:', response);
        if (response.message) {
          // Tìm lớp học cần ẩn
          const classToHide = visibleClasses.find(cls => cls.id === id);
          if (classToHide) {
            console.log('🙈 Found class to hide:', classToHide.name);
            // Cập nhật state ngay lập tức - không cần load lại từ server
            setVisibleClasses(prev => prev.filter(cls => cls.id !== id));
            setHiddenClasses(prev => [classToHide, ...prev]);
            console.log('✅ Class hidden successfully');
          } else {
            // Nếu không tìm thấy trong state, hiển thị lỗi
            console.error('❌ Class not found in visible classes');
            setError('Không tìm thấy lớp học trong danh sách hiện tại');
          }
        } else {
          console.error('❌ Failed to hide class');
          setError('Không thể ẩn lớp học');
        }
        return;
      }

      if (action === 'unhide') {
        console.log('👁️ Unhiding class with ID:', id);
        const response = await api.classes.toggleVisibility(id);
        console.log('👁️ Unhide response:', response);
        if (response.message) {
          // Tìm lớp học cần hiện
          const classToUnhide = hiddenClasses.find(cls => cls.id === id);
          if (classToUnhide) {
            console.log('👁️ Found class to unhide:', classToUnhide.name);
            // Cập nhật state ngay lập tức - không cần load lại từ server
            setHiddenClasses(prev => prev.filter(cls => cls.id !== id));
            setVisibleClasses(prev => [classToUnhide, ...prev]);
            console.log('✅ Class unhidden successfully');
          } else {
            // Nếu không tìm thấy trong state, hiển thị lỗi
            console.error('❌ Class not found in hidden classes');
            setError('Không tìm thấy lớp học trong danh sách hiện tại');
          }
        } else {
          console.error('❌ Failed to unhide class');
          setError('Không thể hiện lớp học');
        }
        return;
      }

      if (action === 'delete') {
        console.log('🗑️ Delete action for class ID:', id);
        let cls = visibleClasses.find(cls => cls.id === id);
        if (!cls) {
          cls = hiddenClasses.find(cls => cls.id === id);
        }
        console.log('🗑️ Class to delete:', cls ? cls.name : 'Not found');
        setTrashClassName(cls ? cls.name : '');
        setTrashClassId(id);
        setTrashModalOpen(true);
        return;
      }

      if (action === 'edit') {
        const cls = visibleClasses.find(cls => cls.id === id);
        if (cls) {
          navigate(`/teacher/class/${cls.id}/announcement`);
        }
        return;
      }

      if (action === 'restore') {
        const response = await api.classes.restore(id);
        if (response.message) {
          // Tìm lớp học cần khôi phục
          const classToRestore = deletedClasses.find(cls => cls.id === id);
          if (classToRestore) {
            // Cập nhật state ngay lập tức - không cần load lại từ server
            setDeletedClasses(prev => prev.filter(cls => cls.id !== id));
            setVisibleClasses(prev => [classToRestore, ...prev]);
          } else {
            // Nếu không tìm thấy trong state, hiển thị lỗi
            setError('Không tìm thấy lớp học trong danh sách hiện tại');
          }
        } else {
          setError('Không thể khôi phục lớp học');
        }
        return;
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi thực hiện thao tác');
      console.error('Menu action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrashConfirm = async () => {
    console.log('🗑️ Confirming delete for class ID:', trashClassId);
    setIsLoading(true);
    setError('');

    try {
      const response = await api.classes.delete(trashClassId);
      console.log('🗑️ Delete response:', response);
      if (response.message) {
        // Tìm lớp học cần xóa từ cả visible và hidden
        let classToDelete = visibleClasses.find(cls => cls.id === trashClassId);
        if (!classToDelete) {
          classToDelete = hiddenClasses.find(cls => cls.id === trashClassId);
        }
        
        if (classToDelete) {
          console.log('🗑️ Found class to delete:', classToDelete.name);
          // Cập nhật state ngay lập tức - không cần load lại từ server
          setVisibleClasses(prev => prev.filter(cls => cls.id !== trashClassId));
          setHiddenClasses(prev => prev.filter(cls => cls.id !== trashClassId));
          setDeletedClasses(prev => [classToDelete, ...prev]);
          console.log('✅ Class deleted successfully');
        } else {
          console.error('❌ Class not found for deletion');
        }
        
        setSnackbarClass({ id: trashClassId, name: trashClassName });
        setSnackbarOpen(true);
        if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);
        snackbarTimeoutRef.current = setTimeout(() => setSnackbarOpen(false), 4000);
        
        // Không cần sync vì đã cập nhật state trực tiếp
      } else {
        console.error('❌ Failed to delete class');
        setError('Không thể xóa lớp học');
      }
    } catch (error) {
      console.error('❌ Delete class error:', error);
      setError('Có lỗi xảy ra khi xóa lớp học');
    } finally {
      setIsLoading(false);
      setTrashModalOpen(false);
    }
  };

  const handleUndoTrash = async () => {
    if (!snackbarClass) return;
    
    console.log('🔄 Undoing delete for class ID:', snackbarClass.id);
    setIsLoading(true);
    setError('');

    try {
      const response = await api.classes.restore(snackbarClass.id);
      console.log('🔄 Restore response:', response);
      if (response.message) {
        // Tìm lớp học cần khôi phục từ deleted
        const classToRestore = deletedClasses.find(cls => cls.id === snackbarClass.id);
        if (classToRestore) {
          console.log('🔄 Found class to restore:', classToRestore.name);
          // Cập nhật state ngay lập tức - không cần load lại từ server
          setDeletedClasses(prev => prev.filter(cls => cls.id !== snackbarClass.id));
          setVisibleClasses(prev => [classToRestore, ...prev]);
          console.log('✅ Class restored successfully');
        } else {
          console.error('❌ Class not found for restoration');
        }
        setSnackbarOpen(false);
        
        // Không cần sync vì đã cập nhật state trực tiếp
      } else {
        console.error('❌ Failed to restore class');
        setError('Không thể khôi phục lớp học');
      }
    } catch (error) {
      console.error('❌ Restore class error:', error);
      setError('Có lỗi xảy ra khi khôi phục lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab data với dữ liệu từ backend - chỉ hiển thị tab khi có dữ liệu
  const tabData = [
    { 
      key: 'your-classes', 
      label: `Lớp của bạn (${visibleClasses.length})`,
      data: visibleClasses,
      emptyMessage: 'Không tìm thấy lớp học nào',
      emptyDescription: 'Hãy kiểm tra trong danh sách lớp học khác, hoặc khởi tạo lớp học của bạn',
      alwaysShow: true // Luôn hiển thị tab "Lớp của bạn"
    },
    ...(hiddenClasses.length > 0 ? [{
      key: 'hidden-classes', 
      label: `Lớp đã ẩn (${hiddenClasses.length})`,
      data: hiddenClasses,
      emptyMessage: 'Không có lớp đã ẩn',
      emptyDescription: 'Các lớp bạn ẩn sẽ xuất hiện ở đây.'
    }] : []),
    ...(deletedClasses.length > 0 ? [{
      key: 'deleted-classes', 
      label: `Thùng rác (${deletedClasses.length})`,
      data: deletedClasses,
      emptyMessage: 'Thùng rác trống',
      emptyDescription: 'Các lớp bạn xóa sẽ xuất hiện ở đây trong 7 ngày.'
    }] : [])
  ];


  return (
    <div className="teacher-dashboard-container">
      <Header />
      {activeTab === 'your-classes' && activeNotice && (
        <ScrollingNotice
          message={activeNotice.message}
          tone={activeNotice.tone || 'info'}
        />
      )}
      
      
      {/* Error message */}
      {error && (
        <div style={{
          margin: '16px 32px',
          padding: '12px 16px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}

      <div className="teacher-classpage-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 32px 8px 32px' }}>
        <div className="teacher-classpage-tabs compact">
          {tabData.map(tab => (
            <button
              key={tab.key}
              className={`teacher-classpage-tab compact${activeTab === tab.key ? ' teacher-classpage-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          className="teacher-class-gridtoggle"
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
      <div className="teacher-class-toolbar compact" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 32px 16px 32px' }}>
        <input className="teacher-class-search compact" type="text" placeholder="Tìm kiếm..." />
        <div className="teacher-class-sort-container" style={{ position: 'relative' }}>
          <div 
            className="teacher-class-sort-button"
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
              className={`teacher-class-sort-arrow ${isSortDropdownOpen ? 'rotated' : ''}`}
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
            <div className="teacher-class-sort-dropdown" style={{
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
                className="teacher-class-sort-option"
                onClick={() => { setSortBy('oldest'); setIsSortDropdownOpen(false); }}
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
                className="teacher-class-sort-option"
                onClick={() => { setSortBy('newest'); setIsSortDropdownOpen(false); }}
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
                Mới nhất
              </button>
              <button 
                className="teacher-class-sort-option"
                onClick={() => { setSortBy('name'); setIsSortDropdownOpen(false); }}
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
                Theo tên
              </button>
            </div>
          )}
        </div>
        <button className="teacher-class-create primary" onClick={() => navigate('/teacher/createclass')} disabled={isLoading}>+ Tạo lớp học</button>
      </div>

             <div className="teacher-class-list">
         {(() => {
           const currentTab = tabData.find(tab => tab.key === activeTab);
           if (!currentTab) {
             // Nếu không tìm thấy tab hiện tại, hiển thị tab "Lớp của bạn"
             const yourClassesTab = tabData.find(tab => tab.key === 'your-classes');
             if (yourClassesTab) {
               return (
                 <ClassList
                   classes={yourClassesTab.data}
                   viewMode={viewMode}
                   activeTab="your-classes"
                   openMenuId={openMenuId}
                   menuRef={menuRef}
                   onMenuClick={handleMenuClick}
                   onMenuAction={handleMenuAction}
                   emptyMessage={yourClassesTab.emptyMessage}
                   emptyDescription={yourClassesTab.emptyDescription}
                 />
               );
             }
             return null;
           }
           
           return (
             <ClassList
               classes={currentTab.data}
               viewMode={viewMode}
               activeTab={activeTab}
               openMenuId={openMenuId}
               menuRef={menuRef}
               onMenuClick={handleMenuClick}
               onMenuAction={handleMenuAction}
               emptyMessage={currentTab.emptyMessage}
               emptyDescription={currentTab.emptyDescription}
             />
           );
         })()}
       </div>

      <ConfirmTrashModal open={trashModalOpen} onClose={() => setTrashModalOpen(false)} className={trashClassName} onConfirm={handleTrashConfirm} />
      {snackbarOpen && snackbarClass && (
        <div className="teacher-snackbar">
          <div className="teacher-snackbar-content">
            <span>Đã xóa lớp {snackbarClass.name}</span>
            <button onClick={handleUndoTrash} className="teacher-snackbar-undo-btn">Hoàn tác</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard; 