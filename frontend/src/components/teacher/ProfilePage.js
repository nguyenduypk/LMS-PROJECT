import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdPerson, 
  MdPhone, 
  MdEmail, 
  MdLock, 
  MdLocationOn, 
  MdSchool, 
  MdCalendarToday,
  MdSecurity,
  MdEdit,
  MdCameraAlt,
  MdClose,
  MdSave
} from "react-icons/md";

import Header from './Header';
import './ProfilePage.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Modal thông báo đơn giản
  const [notif, setNotif] = useState({ open: false, message: '' });
  const openNotif = (message) => setNotif({ open: true, message });
  const closeNotif = () => setNotif({ open: false, message: '' });

  // Modal đổi mật khẩu
  const [pwdModal, setPwdModal] = useState({ open: false, current: '', next: '', loading: false });
  const openPwdModal = () => setPwdModal((s) => ({ ...s, open: true }));
  const closePwdModal = () => setPwdModal({ open: false, current: '', next: '', loading: false });

  useEffect(() => {
    // Lấy thông tin người dùng từ sessionStorage
    const userInfo = sessionStorage.getItem('user');
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      setUser(userData);
    }
  }, []);

  // Đã bỏ chức năng sao chép để đồng bộ bố cục với phần bên dưới

  const handleEdit = (field) => {
    // Chặn đổi username (chưa hỗ trợ backend)
    if (field === 'username') {
      openNotif('Hiện tại chưa hỗ trợ đổi tên đăng nhập.');
      return;
    }
    // Đổi mật khẩu → mở modal mật khẩu
    if (field === 'password') {
      openPwdModal();
      return;
    }
    setEditingField(field);
    // Lấy giá trị hiện tại để hiển thị trong modal
    const currentValue = user ? user[field] || '' : '';
    setEditValue(currentValue);
  };

  const handleSaveEdit = async () => {
    // Nếu vô tình gọi với password, chuyển sang modal
    if (editingField === 'password') {
      openPwdModal();
      return;
    }
    if (!editValue.trim()) {
      openNotif('Vui lòng nhập giá trị!');
      return;
    }

    setIsLoading(true);
    try {
      // Validate dữ liệu
      if (editingField === 'email' && !isValidEmail(editValue)) {
        openNotif('Email không hợp lệ!');
        return;
      }
      if (editingField === 'phone' && !isValidPhone(editValue)) {
        openNotif('Số điện thoại không hợp lệ!');
        return;
      }

      // Gửi request cập nhật đến server
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [editingField]: editValue
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Cập nhật state local với dữ liệu mới từ server
        const updatedUser = { ...user, ...result.user };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        
        openNotif('Cập nhật thành công!');
        setEditingField(null);
        setEditValue('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      openNotif('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  const getFieldLabel = (field) => {
    const labels = {
      username: 'Tên đăng nhập',
      phone: 'Số điện thoại',
      email: 'Email',
      password: 'Mật khẩu',
      full_name: 'Họ tên',
      date_of_birth: 'Ngày sinh',
      province: 'Tỉnh',
      school: 'Trường'
    };
    return labels[field] || field;
  };

  const getFieldType = (field) => {
    const types = {
      email: 'email',
      password: 'password',
      date_of_birth: 'date',
      phone: 'tel',
      full_name: 'text',
      province: 'text',
      school: 'text',
      username: 'text'
    };
    return types[field] || 'text';
  };

  const getFieldPlaceholder = (field) => {
    const placeholders = {
      full_name: 'Nhập họ tên đầy đủ',
      email: 'Nhập email',
      phone: 'Nhập số điện thoại',
      password: 'Nhập mật khẩu mới',
      province: 'Nhập tỉnh/thành phố',
      school: 'Nhập tên trường',
      username: 'Nhập tên đăng nhập'
    };
    return placeholders[field] || `Nhập ${getFieldLabel(field).toLowerCase()}`;
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Hàm tạo initials từ tên
  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  };

  const handleUploadAvatar = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        openNotif('Vui lòng chọn file ảnh!');
        return;
      }

      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        openNotif('File ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
        return;
      }

      setAvatar(file);
      
      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatar) return;

    try {
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('avatar', avatar);

      // Gửi request đến server
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Avatar uploaded successfully:', result);
        // Có thể lưu URL avatar vào sessionStorage hoặc state
        openNotif('Cập nhật avatar thành công!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      openNotif('Có lỗi xảy ra khi upload avatar. Vui lòng thử lại!');
    }
  };

  // Gửi đổi mật khẩu từ modal
  const submitPasswordChange = async () => {
    if (!pwdModal.current || !pwdModal.next || pwdModal.next.length < 6) {
      openNotif('Vui lòng nhập đầy đủ và đúng định dạng mật khẩu.');
      return;
    }
    setPwdModal((s) => ({ ...s, loading: true }));
    try {
      const token = sessionStorage.getItem('token');
      const resp = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwdModal.current, newPassword: pwdModal.next })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Đổi mật khẩu thất bại');
      }
      openNotif('Đổi mật khẩu thành công!');
      closePwdModal();
    } catch (e) {
      console.error(e);
      openNotif(e.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setPwdModal((s) => ({ ...s, loading: false }));
    }
  };

  // Map user data to display fields
  const userData = user ? {
    username: user.username || '',
    email: user.email || '',
    full_name: user.full_name || '',
    date_of_birth: user.date_of_birth || '',
    province: user.province || '',
    school: user.school || '',
    role: user.role || ''
  } : {};

  return (
    <>
      <Header />
      <div className="teacher-profile-page">
        <div className="teacher-profile-header">
          <button className="teacher-back-button" onClick={handleBack}>
            ← Quay lại
          </button>
          <h1 className="teacher-profile-title">Hồ sơ của tôi</h1>
          <div className="teacher-security-status">
            <MdSecurity className="teacher-security-icon" />
            <span>Tài khoản an toàn</span>
          </div>
        </div>

        {/* Content Container - Có thể cuộn */}
        <div className="teacher-profile-content-wrapper">
          {/* Avatar Section */}
          <div className="teacher-avatar-section">
            <div className="teacher-main-avatar">
              <div className="teacher-avatar-placeholder">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="teacher-avatar-image"
                  />
                ) : (
                  getInitials(userData.full_name)
                )}
              </div>
              <button className="teacher-camera-button" onClick={handleUploadAvatar}>
                <MdCameraAlt />
              </button>
              {avatar && (
                <button className="teacher-save-avatar-button" onClick={handleSaveAvatar}>
                  Lưu
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div className="teacher-profile-content">
            {/* Thông tin tài khoản */}
            <div className="teacher-profile-section">
              <h2 className="teacher-section-title">Thông tin tài khoản</h2>
              
              <div className="teacher-info-item">
                <div className="teacher-info-icon">
                  <MdPerson />
                </div>
                <div className="teacher-info-content">
                  <div className="teacher-info-label">Tên đăng nhập</div>
                  <div className="teacher-info-value">{userData.username}</div>
                </div>
                <button 
                  className="teacher-edit-button"
                  onClick={() => handleEdit('username')}
                >
                  <MdEdit />
                  Chỉnh sửa
                </button>
              </div>

              <div className="teacher-info-item">
                <div className="teacher-info-icon teacher-email-icon">
                  <MdEmail />
                </div>
                <div className="teacher-info-content">
                  <div className="teacher-info-label">Email</div>
                  <div className="teacher-info-value">{userData.email}</div>
                </div>
                <button 
                  className="teacher-edit-button"
                  onClick={() => handleEdit('email')}
                >
                  <MdEdit />
                  Chỉnh sửa
                </button>
              </div>

              <div className="teacher-info-item">
                <div className="teacher-info-icon teacher-password-icon">
                  <MdLock />
                </div>
                <div className="teacher-info-content">
                  <div className="teacher-info-label">Mật khẩu</div>
                  <div className="teacher-info-value">********</div>
                </div>
                <button 
                  className="teacher-edit-button"
                  onClick={() => handleEdit('password')}
                >
                  <MdEdit />
                  Chỉnh sửa
                </button>
              </div>

              
            </div>

            {/* Thông tin cá nhân */}
            <div className="teacher-profile-section">
              <h2 className="teacher-section-title">Thông tin cá nhân</h2>
              <div className="teacher-section-intro">
                Cung cấp đúng thông tin cá nhân của bạn để không bị nhầm lẫn khi tham gia lớp học hoặc bài kiểm tra.
              </div>
              
              <div className="teacher-info-item">
                <div className="teacher-info-icon teacher-name-icon">
                  <MdPerson />
                </div>
                <div className="teacher-info-content">
                  <div className="teacher-info-label">Tên</div>
                  <div className="teacher-info-value">{userData.full_name}</div>
                </div>
                <button 
                  className="teacher-edit-button"
                  onClick={() => handleEdit('full_name')}
                >
                  <MdEdit />
                  Chỉnh sửa
                </button>
              </div>

              <div className="teacher-info-item">
                <div className="teacher-info-icon teacher-birth-icon">
                  <MdCalendarToday />
                </div>
                <div className="teacher-info-content">
                  <div className="teacher-info-label">Ngày sinh</div>
                  <div className="teacher-info-value">{userData.date_of_birth}</div>
                </div>
                <button 
                  className="teacher-edit-button"
                  onClick={() => handleEdit('date_of_birth')}
                >
                  <MdEdit />
                  Chỉnh sửa
                </button>
              </div>

              <div className="teacher-info-item">
                <div className="teacher-info-icon teacher-location-icon">
                  <MdLocationOn />
                </div>
                <div className="teacher-info-content">
                  <div className="teacher-info-label">Tỉnh</div>
                  <div className="teacher-info-value">{userData.province}</div>
                </div>
                <button 
                  className="teacher-edit-button"
                  onClick={() => handleEdit('province')}
                >
                  <MdEdit />
                  Chỉnh sửa
                </button>
              </div>

              <div className="teacher-info-item">
                <div className="teacher-info-icon teacher-school-icon">
                  <MdSchool />
                </div>
                <div className="teacher-info-content">
                  <div className="teacher-info-label">Trường</div>
                  <div className="teacher-info-value">{userData.school}</div>
                </div>
                <button 
                  className="teacher-edit-button"
                  onClick={() => handleEdit('school')}
                >
                  <MdEdit />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingField && (
          <div className="teacher-profile-edit-modal-overlay">
            <div className="teacher-profile-edit-modal">
              <div className="teacher-profile-edit-modal-header">
                <h3>Chỉnh sửa {getFieldLabel(editingField)}</h3>
                <button className="teacher-profile-close-button" onClick={handleCancelEdit}>
                  <MdClose />
                </button>
              </div>
              <div className="teacher-profile-edit-modal-body">
                <label className="teacher-profile-edit-label">
                  {getFieldLabel(editingField)}:
                </label>
                <input
                  type={getFieldType(editingField)}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={getFieldPlaceholder(editingField)}
                  className="teacher-profile-edit-input"
                  autoFocus
                />
              </div>
              <div className="teacher-profile-edit-modal-footer">
                <button 
                  className="teacher-profile-cancel-button" 
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button 
                  className="teacher-profile-save-button" 
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notif.open && (
          <div className="teacher-profile-edit-modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
            <div className="teacher-profile-edit-modal" style={{minWidth:320,background:'#fff',borderRadius:8,boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
              <div className="teacher-profile-edit-modal-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #eee'}}>
                <h3 style={{margin:0}}>Thông báo</h3>
                <button className="teacher-profile-close-button" onClick={closeNotif} style={{border:'none',background:'transparent',cursor:'pointer'}}>
                  <MdClose />
                </button>
              </div>
              <div className="teacher-profile-edit-modal-body" style={{padding:'16px'}}>
                <div>{notif.message}</div>
              </div>
              <div className="teacher-profile-edit-modal-footer" style={{padding:'12px 16px',display:'flex',justifyContent:'flex-end',gap:8}}>
                <button className="teacher-profile-save-button" onClick={closeNotif}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {pwdModal.open && (
          <div className="teacher-profile-edit-modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
            <div className="teacher-profile-edit-modal" style={{minWidth:380,background:'#fff',borderRadius:8,boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
              <div className="teacher-profile-edit-modal-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #eee'}}>
                <h3 style={{margin:0}}>Đổi mật khẩu</h3>
                <button className="teacher-profile-close-button" onClick={closePwdModal} style={{border:'none',background:'transparent',cursor:'pointer'}}>
                  <MdClose />
                </button>
              </div>
              <div className="teacher-profile-edit-modal-body" style={{padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
                <label className="teacher-profile-edit-label">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={pwdModal.current}
                  onChange={(e)=>setPwdModal((s)=>({...s,current:e.target.value}))}
                  className="teacher-profile-edit-input"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <label className="teacher-profile-edit-label">Mật khẩu mới</label>
                <input
                  type="password"
                  value={pwdModal.next}
                  onChange={(e)=>setPwdModal((s)=>({...s,next:e.target.value}))}
                  className="teacher-profile-edit-input"
                  placeholder="Nhập mật khẩu mới (>= 6 ký tự)"
                />
              </div>
              <div className="teacher-profile-edit-modal-footer" style={{padding:'12px 16px',display:'flex',justifyContent:'flex-end',gap:8}}>
                <button className="teacher-profile-cancel-button" onClick={closePwdModal} disabled={pwdModal.loading}>Hủy</button>
                <button className="teacher-profile-save-button" onClick={submitPasswordChange} disabled={pwdModal.loading}>
                  {pwdModal.loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ProfilePage; 