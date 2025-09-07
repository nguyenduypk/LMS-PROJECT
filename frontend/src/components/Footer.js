import React from 'react';
import '../styles/LandingPage.css';

function Footer() {
  return (
    <footer className="modern-footer v2">
      <div className="footer-v2-main">
        {/* Left: Logo & Company */}
        <div className="footer-v2-col footer-v2-logo">
          <div className="footer-v2-company">
            <strong>SHub</strong>
          </div>
          <div className="footer-v2-copyright">
            ©Copyright 2022 SHub Classroom. All Rights Reserved
          </div>
        </div>
        {/* Center: Contact Info */}
        <div className="footer-v2-col footer-v2-contact">
          <div><strong>Số điện thoại</strong></div>
          <div>0938 620 043</div>
          <div style={{ marginTop: 12 }}><strong>Email</strong></div>
          <div>support@shub.edu.vn</div>
          <div style={{ marginTop: 12 }}><strong>Địa chỉ</strong></div>
          <div>Khu Công nghệ Phần mềm, ĐHQG-HCM Kp6, P. Linh Trung, Tp. Thủ Đức, Tp. Hồ Chí Minh</div>
        </div>
        {/* Right: Policy & Social */}
        <div className="footer-v2-col footer-v2-info">
          <div><strong>Thông tin</strong></div>
          <div><a href="#">Chính sách bảo mật</a></div>
          <div><a href="#">Chính sách hoàn trả</a></div>
          <div><a href="#">Điều khoản sử dụng</a></div>
          <div style={{ marginTop: 16 }}><strong>Kết nối với chúng tôi</strong></div>
          <div className="footer-v2-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="24" height="24" fill="#1976d2" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.406.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
            </a>
            <a href="https://m.me/shub.edu.vn" target="_blank" rel="noopener noreferrer" aria-label="Messenger">
              <svg width="24" height="24" fill="#1976d2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#f5f5f5"/><text x="50%" y="55%" textAnchor="middle" fontSize="16" fill="#1976d2" fontWeight="bold">M</text></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 