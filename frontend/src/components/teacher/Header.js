import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

function getInitials(name) {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

const TABS = [
  { label: 'Tổng quan', path: '/teacher/dashboard' },
  { label: 'Học liệu', path: '/teacher/resources' },
  { label: 'Lịch học', path: '/teacher/schedule' },
];

export default function Header({
  teacherName: propTeacherName,
  teacherEmail: propTeacherEmail,
  teacherPhone: propTeacherPhone,
  onLogout,
  onProfile,
  onSwitchRole
}) {
  const [dropdown, setDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy thông tin người dùng từ sessionStorage
    const userInfo = sessionStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const handleLogout = () => {
    setDropdown(false);
    // Xóa thông tin đăng nhập khỏi sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const handleProfile = () => {
    setDropdown(false);
    if (onProfile) {
      onProfile();
    } else {
      navigate('/teacher/profile');
    }
  };

  const handleSwitchRole = () => {
    setDropdown(false);
    if (onSwitchRole) {
      onSwitchRole();
    } else {
      navigate('/switch-role');
    }
  };

  // Sử dụng user từ prop nếu có, nếu không thì dùng từ sessionStorage
  const currentUser = user || { full_name: 'Nguyễn Duy', email: 'nguyenkhanhduongduy@gmail.com', phone: '0353111322' };
  const teacherName = propTeacherName || currentUser.full_name || currentUser.name;
  const teacherEmail = propTeacherEmail || currentUser.email;
  const teacherPhone = propTeacherPhone || currentUser.phone;

  return (
    <header className="teacher-header">
      <div className="header-left">
        <div className="logo">EduHub Classroom</div>
        <nav className="nav-tabs">
          {TABS.map(tab => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                className={`nav-tab${isActive ? ' active' : ''}`}
                type="button"
                tabIndex={0}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="header-right">
        <div className="dropdown-container">
          <button
            className="dropdown-trigger user-dropdown-trigger"
            onClick={() => setDropdown(!dropdown)}
            tabIndex={0}
            aria-label="Mở menu tài khoản"
            aria-expanded={dropdown}
          >
            <div className="user-info">
              <div className="user-avatar">{getInitials(teacherName)}</div>
              <div className="user-details">
                <div className="user-name">{teacherName}</div>
                <div className="user-role">Giáo viên</div>
              </div>
            </div>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className={`dropdown-arrow ${dropdown ? 'rotated' : ''}`}
            >
              <path d="m7 10 5 5 5-5z" fill="currentColor"/>
            </svg>
          </button>
          {dropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="student-count">Học sinh 2/100</div>
                <div className="teacher-name">{teacherName}</div>
                <div className="teacher-role">Giáo viên</div>
                <div className="teacher-contact">
                  <div>{teacherEmail}</div>
                  <div>{teacherPhone}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="student-limit">Giới hạn học sinh: 2/100</div>
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item" onClick={handleProfile}>
                Thông tin cá nhân
              </button>
              <button className="dropdown-item" onClick={handleSwitchRole}>
                Đổi vai trò
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}