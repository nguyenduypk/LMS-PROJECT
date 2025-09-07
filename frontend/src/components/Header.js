import React from 'react';
import '../styles/LandingPage.css';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo">
        <div className="logo-container">
          <img src="/img/logo.png" alt="EduHub Classroom Logo" className="logo-image" />
          <div className="logo-text">
            <span className="logo-brand">EduHub</span>
            <span className="logo-subtitle">Classroom</span>
          </div>
        </div>
      </Link>
      <nav className="header__nav">
        <a href="#banner">Giới thiệu</a>
        <a href="#features">Tính năng</a>
        <a href="#partners">Đối tác</a>
        <a href="#school-logos">Liên hệ</a>
      </nav>
      <div className="header__actions">
        <Link to="/login" className="btn btn-outline">Đăng nhập</Link>
        <Link to="/register" className="btn btn-primary">Đăng ký</Link>
      </div>
    </header>
  );
}

export default Header; 