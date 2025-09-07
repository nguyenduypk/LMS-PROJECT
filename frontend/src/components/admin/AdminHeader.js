import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaUsers, FaChartBar, FaCog } from 'react-icons/fa';
import { MdDashboard, MdClass, MdAssignment, MdAnnouncement } from 'react-icons/md';
import { useUser } from '../../contexts/UserContext';
// Use the same style as teacher & student headers for consistent look
import '../teacher/Header.css';

function getInitials(name) {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

// Đã loại bỏ menu thông báo để làm gọn header Admin

function AccountMenu({ open, onClose, user }) {
  const ref = useRef();
  const navigate = useNavigate();
  const { logout } = useUser();
  
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  if (!open) return null;

  return (
    <div ref={ref} className="dropdown-menu">
      <div className="dropdown-header">
        <div className="user-info">
          <div className="user-avatar">{getInitials(user?.fullName)}</div>
          <div className="user-details">
            <div className="teacher-name">{user?.fullName}</div>
            <div className="teacher-role">Quản trị viên</div>
            <div className="teacher-contact">
              <div>{user?.email}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="dropdown-divider"></div>
      <button className="dropdown-item" onClick={() => navigate('/admin/settings')}>Cài đặt hệ thống</button>
      <div className="dropdown-divider"></div>
      <button className="dropdown-item" onClick={handleLogout} style={{ color: '#e53935' }}>Đăng xuất</button>
    </div>
  );
}

const ADMIN_TABS = [
  { label: 'Tổng quan', key: 'dashboard', icon: MdDashboard },
  { label: 'Người dùng', key: 'users', icon: FaUsers },
  { label: 'Lớp học', key: 'classes', icon: MdClass },
  { label: 'Bài tập', key: 'assignments', icon: MdAssignment },
  { label: 'Thông báo', key: 'announcements', icon: MdAnnouncement },
  { label: 'Báo cáo', key: 'reports', icon: FaChartBar },
];

function AdminHeader({ activeTab, setActiveTab }) {
  const [dropdown, setDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Fallback display name for header (mirrors teacher)
  const displayName = (user?.fullName || user?.full_name || user?.name || 'Admin');

  return (
    <header className="teacher-header">
      <div className="header-left">
        <div className="logo" onClick={() => navigate('/admin/dashboard')}>EduHub Classroom</div>
      </div>

      {/* Centered tabs like teacher/student */}
      <nav className="nav-tabs">
        {ADMIN_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`nav-tab${isActive ? ' active' : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                const path = tab.key === 'dashboard' ? '/admin/dashboard' : `/admin/${tab.key}`;
                navigate(path);
              }}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right section: chỉ giữ menu tài khoản, đồng bộ với yêu cầu thiết kế */}
      <div className="header-right">
        <div className="dropdown-container">
          <button
            className="dropdown-trigger user-dropdown-trigger"
            onClick={() => setDropdown(!dropdown)}
            aria-label="Mở menu tài khoản"
            aria-expanded={dropdown}
            type="button"
          >
            <div className="user-info">
              <div className="user-avatar">{getInitials(displayName)}</div>
              <div className="user-details">
                <div className="user-name">{displayName}</div>
                <div className="user-role">Admin</div>
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
            <AccountMenu open={dropdown} onClose={() => setDropdown(false)} user={user} />
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
