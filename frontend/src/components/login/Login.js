import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, auth } from '../../utils/api';
import './Login.css';
import '../../styles/LandingPage.css';

function Login() {
  const [step, setStep] = useState(1); // 1: Chọn vai trò, 2: Đăng nhập
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await api.auth.login({
        username: email, // Có thể đăng nhập bằng username hoặc email
        password: password
      });

      // Kiểm tra nếu có lỗi từ backend
      if (data.message && data.message !== 'Đăng nhập thành công') {
        throw new Error(data.message);
      }

      // Kiểm tra nếu không có token hoặc user data
      if (!data.token || !data.user) {
        throw new Error('Dữ liệu đăng nhập không hợp lệ');
      }

      // Lưu token và user data vào sessionStorage
      auth.setAuth(data.token, data.user);
      
      // Chuyển hướng theo vai trò
      if (data.user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (data.user.role === 'student') {
        navigate('/student/dashboard');
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="global-logo-row">
        <span className="logo-icon">🎓</span>
        <div className="brand-text">
          <span className="brand-name">EduHub</span>
          <span className="brand-sub">Classroom</span>
        </div>
      </div>
      <div className="global-header-buttons">
        <Link to="/" className="home-link">Trang chủ</Link>
        <Link to="/register" className="btn btn-primary">Đăng ký</Link>
      </div>
      <div className="login-split-layout">
        {/* Left: Form */}
        <div className="login-left">
          
          <h1 className="login-title">CHÀO MỪNG BẠN ĐẾN VỚI EDUHUB CLASSROOM</h1>
          <p className="role-prompt">Chọn vai trò của bạn</p>
          
          <div className="role-dropdown">
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="role-select"
            >
              <option value="">Chọn vai trò</option>
              <option value="teacher">Tôi là giáo viên</option>
              <option value="student">Tôi là học sinh</option>
            </select>
          </div>
          
          {role && (
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Số điện thoại hoặc email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Đang đăng nhập...' : 'Tiếp tục'}
              </button>
            </form>
          )}
        </div>
        
        {/* Right: Illustration */}
        <div className="login-right">
          <img src="/img/teacher.svg" alt="Login Illustration" className="login-illustration" />
        </div>
      </div>
    </>
  );
}

export default Login;