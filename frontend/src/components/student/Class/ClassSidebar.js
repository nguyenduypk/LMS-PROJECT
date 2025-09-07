import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../../../styles/ClassSidebar.css';
import AuthStorage from '../../../utils/authStorage';

function ClassSidebar({ classInfo: propClassInfo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { classCode } = useParams();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [classInfo, setClassInfo] = useState(null);

  // Khôi phục classInfo từ props, sessionStorage, hoặc URL
  useEffect(() => {
    let currentClassInfo = propClassInfo;
    
    // Nếu không có props, thử lấy từ sessionStorage
    if (!currentClassInfo) {
      currentClassInfo = AuthStorage.getClassInfo();
    }
    
    // Nếu vẫn không có, thử extract từ URL và tạo fallback
    if (!currentClassInfo && classCode && classCode !== 'N/A') {
      console.log('🔧 Creating fallback classInfo from URL classCode:', classCode);
      currentClassInfo = {
        id: 1,
        name: 'Lớp học',
        code: classCode,
        teacher: 'Giáo viên',
        image: 'https://i.imgur.com/0y8Ftya.jpg',
        students: 0,
        lectures: 0,
        homeworks: 0,
        materials: 0,
      };
    }
    
    if (currentClassInfo) {
      setClassInfo(currentClassInfo);
      // Lưu vào sessionStorage để tránh mất dữ liệu
      AuthStorage.setClassInfo(currentClassInfo);
      console.log('✅ ClassInfo set in sidebar:', currentClassInfo);
    } else {
      console.warn('⚠️ No classInfo available in ClassSidebar');
    }
  }, [propClassInfo, classCode]);

  // Xác định tab hiện tại từ URL
  const getCurrentTab = () => {
    const pathname = location.pathname;
    if (pathname.includes('/announcement')) return 'announcement';
    if (pathname.includes('/schedule')) return 'schedule';
    if (pathname.includes('/members')) return 'members';
    if (pathname.includes('/homework') || pathname.includes('/quiz')) return 'homework';
    if (pathname.includes('/materials') || pathname.includes('/documents/')) return 'materials';
    return 'announcement';
  };

  const selected = getCurrentTab();

  // Hàm xử lý rời lớp (bạn có thể thay đổi theo logic thực tế)
  const handleLeaveClass = () => {
    setShowLeaveModal(false);
    // TODO: Thực hiện hành động rời lớp ở đây (gọi API, chuyển trang, ...)
  };

  return (
    <>
      <aside className="class-sidebar">
        <div className="class-sidebar-header">
          <div className="class-sidebar-title">{classInfo?.name || 'Đang tải...'}</div>
          <div className="class-sidebar-code">Mã lớp: {(classInfo?.code || 'N/A').toUpperCase()}</div>
          <div className="class-sidebar-teacher">GV: {classInfo?.teacher || 'Đang tải...'}</div>
        </div>
        <nav className="class-sidebar-nav">
                     <button className={selected === 'announcement' ? 'active' : ''} onClick={() => navigate(`/student/class/${classCode || classInfo?.code || '2WVEE'}/announcement`)}>
             <div className="class-sidebar-icon">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: selected === 'announcement' ? '#1e88e5' : '#555' }}>
                 <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M7 14L10 11L13 14L17 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             Thông báo
           </button>
           <button className={selected === 'schedule' ? 'active' : ''} onClick={() => navigate(`/student/class/${classCode || classInfo?.code || '2WVEE'}/schedule`)}>
             <div className="class-sidebar-icon">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: selected === 'schedule' ? '#1e88e5' : '#555' }}>
                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <rect x="3" y="14" width="18" height="8" rx="1" ry="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             Lịch học
           </button>
           <button className={selected === 'members' ? 'active' : ''} onClick={() => navigate(`/student/class/${classCode || classInfo?.code || '2WVEE'}/members`)}>
             <div className="class-sidebar-icon">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: selected === 'members' ? '#1e88e5' : '#555' }}>
                 <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             Thành viên
           </button>
           <button className={selected === 'homework' ? 'active' : ''} onClick={() => navigate(`/student/class/${classCode || classInfo?.code || '2WVEE'}/homework`)}>
             <div className="class-sidebar-icon">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: selected === 'homework' ? '#1e88e5' : '#555' }}>
                 <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             Bài tập
           </button>
           <button className={selected === 'materials' ? 'active' : ''} onClick={() => navigate(`/student/class/${classCode || classInfo?.code || '2WVEE'}/materials`)}>
             <div className="class-sidebar-icon">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: selected === 'materials' ? '#1e88e5' : '#555' }}>
                 <path d="M3 7V5A2 2 0 0 1 5 3H11L13 5H19A2 2 0 0 1 21 7V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V7Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             Tài liệu & bài giảng
           </button>
        </nav>
        <div className="class-sidebar-divider"></div>
        <button className="class-sidebar-leave" onClick={() => setShowLeaveModal(true)}>
          <div className="class-sidebar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#555' }}>
              <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 3V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9L18 12L15 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Rời khỏi lớp này
        </button>
      </aside>

      {/* Modal xác nhận rời lớp */}
      {showLeaveModal && (
        <div className="modal-leave-overlay">
          <div className="modal-leave">
            <div className="modal-leave-title">Rời lớp</div>
            <div className="modal-leave-content">
              Điểm số các bài kiểm tra sẽ bị xóa và sẽ được phục hồi khi tham gia lại lớp!<br />
              Bạn có chắc chắn muốn rời khỏi lớp học này?
            </div>
            <div className="modal-leave-actions">
              <button className="modal-leave-cancel" onClick={() => setShowLeaveModal(false)}>
                Thoát
              </button>
              <button className="modal-leave-confirm" onClick={handleLeaveClass}>
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ClassSidebar; 