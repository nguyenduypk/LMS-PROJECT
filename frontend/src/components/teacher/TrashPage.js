import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/TeacherDashboard.css';
import Header from './Header';
import './TrashPage.css';

function TrashPage() {
  const navigate = useNavigate();
  
  return (
    <div className="trash-page-root">
      <Header />
      <div className="trash-page-container">
        {/* Breadcrumb */}
        <div className="trash-breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/teacher/dashboard')}>Danh sách lớp</span>
          <span className="breadcrumb-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 7l5 5-5 5z" fill="currentColor"/>
            </svg>
          </span>
          <span className="breadcrumb-item active">Thùng rác của tôi</span>
        </div>

        {/* Information Banner */}
        <div className="trash-info-banner">
          Các mục trong thùng rác sẽ tự động bị xóa vĩnh viễn sau 7 ngày. Bạn có thể khôi phục các mục này trước thời hạn 7 ngày.
        </div>

        {/* Search Bar */}
        <div className="trash-search-container">
          <div className="trash-search-box">
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="trash-search-input"
            />
            <div className="trash-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="trash-empty-state">
          <div className="trash-empty-icon">
            <div className="trash-can">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="trash-paper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="trash-empty-text">
            <div className="trash-empty-title">Không có mục nào trong thùng rác</div>
            <div className="trash-empty-subtitle">Các mục bị xóa sẽ xuất hiện ở đây.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrashPage; 