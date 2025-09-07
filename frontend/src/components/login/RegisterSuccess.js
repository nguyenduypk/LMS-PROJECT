import React from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

function RegisterSuccess({ userData }) {
  return (
    <div className="signup-wrapper">
      <div className="success-container">
        <div className="success-icon">✅</div>
        <h2 className="success-title">Đăng ký thành công!</h2>
        
        <div className="success-details">
          <p><strong>Họ tên:</strong> {userData.full_name}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Vai trò:</strong> {userData.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</p>
        </div>

        <div className="success-message">
          <p>Tài khoản của bạn đã được tạo thành công!</p>
          <p>Bạn có thể sử dụng email hoặc username để đăng nhập.</p>
        </div>

        <div className="success-actions">
          <Link to="/login" className="btn-primary">
            Đăng nhập ngay
          </Link>
          <Link to="/" className="btn-secondary">
            Về trang chủ
          </Link>
        </div>

        <div className="success-note">
          <p><strong>Lưu ý:</strong> Vui lòng ghi nhớ thông tin đăng nhập của bạn.</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterSuccess; 