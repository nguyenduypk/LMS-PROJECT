import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdLock, MdLocationOn, MdSchool, MdCalendarToday, MdSecurity, MdEdit, MdCameraAlt, MdClose, MdSave } from 'react-icons/md';
import { useUser } from '../../contexts/UserContext';
// Reuse teacher profile styles for consistent look & feel
import '../teacher/ProfilePage.css';

export default function AdminProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, setUser } = useUser();

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [notif, setNotif] = useState({ open: false, message: '' });
  const [pwdModal, setPwdModal] = useState({ open: false, current: '', next: '', loading: false });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[AdminProfilePage] render at', window.location.pathname);
  }, []);

  // Derived user data similar to teacher/student
  const profile = user ? {
    username: user.username || '',
    email: user.email || '',
    full_name: user.fullName || user.full_name || '',
    date_of_birth: user.date_of_birth || '',
    province: user.province || '',
    school: user.school || '',
    role: user.role || 'admin'
  } : {};

  const openNotif = (message) => setNotif({ open: true, message });
  const closeNotif = () => setNotif({ open: false, message: '' });

  const handleBack = () => navigate(-1);

  // Helpers
  const getFieldLabel = (field) => ({
    username: 'Tên đăng nhập',
    email: 'Email',
    password: 'Mật khẩu',
    full_name: 'Họ tên',
    date_of_birth: 'Ngày sinh',
    province: 'Tỉnh',
    school: 'Trường'
  }[field] || field);

  const getFieldType = (field) => ({
    email: 'email',
    password: 'password',
    date_of_birth: 'date',
    phone: 'tel',
    full_name: 'text',
    province: 'text',
    school: 'text',
    username: 'text'
  }[field] || 'text');

  const getFieldPlaceholder = (field) => ({
    full_name: 'Nhập họ tên đầy đủ',
    email: 'Nhập email',
    password: 'Nhập mật khẩu mới',
    province: 'Nhập tỉnh/thành phố',
    school: 'Nhập tên trường',
    username: 'Nhập tên đăng nhập'
  }[field] || `Nhập ${getFieldLabel(field).toLowerCase()}`);

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Avatar handlers (local only)
  const handleUploadAvatar = () => fileInputRef.current?.click();
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      openNotif('Vui lòng chọn file ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      openNotif('File ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
      return;
    }
    setAvatar(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Edit handlers (local only)
  const handleEdit = (field) => {
    if (field === 'password') {
      setPwdModal((s) => ({ ...s, open: true }));
      return;
    }
    setEditingField(field);
    setEditValue(profile[field] || '');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;
    if (!editValue.trim()) {
      openNotif('Vui lòng nhập giá trị!');
      return;
    }
    setIsSaving(true);
    try {
      // Local update only
      const updated = { ...user };
      if (editingField === 'full_name') {
        updated.fullName = editValue; // maintain both keys for compatibility
        updated.full_name = editValue;
      } else {
        updated[editingField] = editValue;
      }
      setUser(updated);
      openNotif('Đã lưu thay đổi (cục bộ)');
      setEditingField(null);
      setEditValue('');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      openNotif('Không thể lưu thay đổi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Password change (mock)
  const submitPasswordChange = async () => {
    if (!pwdModal.current || !pwdModal.next || pwdModal.next.length < 6) {
      openNotif('Vui lòng nhập đầy đủ và đúng định dạng mật khẩu.');
      return;
    }
    setPwdModal((s) => ({ ...s, loading: true }));
    setTimeout(() => {
      openNotif('Đổi mật khẩu thành công (mô phỏng)');
      setPwdModal({ open: false, current: '', next: '', loading: false });
    }, 600);
  };

  return (
    <div className="teacher-profile-page">
      <div className="teacher-profile-header">
        <button className="teacher-back-button" onClick={handleBack}>← Quay lại</button>
        <h1 className="teacher-profile-title">Hồ sơ quản trị viên</h1>
        <div className="teacher-security-status">
          <MdSecurity className="teacher-security-icon" />
          <span>Tài khoản an toàn</span>
        </div>
      </div>

      <div className="teacher-profile-content-wrapper">
        {/* Avatar */}
        <div className="teacher-avatar-section">
          <div className="teacher-main-avatar">
            <div className="teacher-avatar-placeholder">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="teacher-avatar-image" />
              ) : (
                getInitials(profile.full_name)
              )}
            </div>
            <button className="teacher-camera-button" onClick={handleUploadAvatar}>
              <MdCameraAlt />
            </button>
            {avatar && (
              <button className="teacher-save-avatar-button" onClick={() => openNotif('Đã lưu avatar (mô phỏng)')}>
                <MdSave style={{ marginRight: 6 }} /> Lưu
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
        </div>

        {/* Details */}
        <div className="teacher-profile-content">
          {/* Tài khoản */}
          <div className="teacher-profile-section">
            <h2 className="teacher-section-title">Thông tin tài khoản</h2>

            <div className="teacher-info-item">
              <div className="teacher-info-icon"><MdPerson /></div>
              <div className="teacher-info-content">
                <div className="teacher-info-label">Tên đăng nhập</div>
                <div className="teacher-info-value">{profile.username}</div>
              </div>
              <button className="teacher-edit-button" onClick={() => openNotif('Hiện chưa hỗ trợ đổi tên đăng nhập')}><MdEdit />Chỉnh sửa</button>
            </div>

            <div className="teacher-info-item">
              <div className="teacher-info-icon teacher-email-icon"><MdEmail /></div>
              <div className="teacher-info-content">
                <div className="teacher-info-label">Email</div>
                <div className="teacher-info-value">{profile.email}</div>
              </div>
              <button className="teacher-edit-button" onClick={() => handleEdit('email')}><MdEdit />Chỉnh sửa</button>
            </div>

            <div className="teacher-info-item">
              <div className="teacher-info-icon teacher-password-icon"><MdLock /></div>
              <div className="teacher-info-content">
                <div className="teacher-info-label">Mật khẩu</div>
                <div className="teacher-info-value">********</div>
              </div>
              <button className="teacher-edit-button" onClick={() => handleEdit('password')}><MdEdit />Chỉnh sửa</button>
            </div>
          </div>

          {/* Cá nhân */}
          <div className="teacher-profile-section">
            <h2 className="teacher-section-title">Thông tin cá nhân</h2>
            <div className="teacher-section-intro">Cập nhật thông tin cá nhân quản trị viên.</div>

            <div className="teacher-info-item">
              <div className="teacher-info-icon teacher-name-icon"><MdPerson /></div>
              <div className="teacher-info-content">
                <div className="teacher-info-label">Họ tên</div>
                <div className="teacher-info-value">{profile.full_name}</div>
              </div>
              <button className="teacher-edit-button" onClick={() => handleEdit('full_name')}><MdEdit />Chỉnh sửa</button>
            </div>

            <div className="teacher-info-item">
              <div className="teacher-info-icon teacher-birth-icon"><MdCalendarToday /></div>
              <div className="teacher-info-content">
                <div className="teacher-info-label">Ngày sinh</div>
                <div className="teacher-info-value">{profile.date_of_birth}</div>
              </div>
              <button className="teacher-edit-button" onClick={() => handleEdit('date_of_birth')}><MdEdit />Chỉnh sửa</button>
            </div>

            <div className="teacher-info-item">
              <div className="teacher-info-icon teacher-location-icon"><MdLocationOn /></div>
              <div className="teacher-info-content">
                <div className="teacher-info-label">Tỉnh</div>
                <div className="teacher-info-value">{profile.province}</div>
              </div>
              <button className="teacher-edit-button" onClick={() => handleEdit('province')}><MdEdit />Chỉnh sửa</button>
            </div>

            <div className="teacher-info-item">
              <div className="teacher-info-icon teacher-school-icon"><MdSchool /></div>
              <div className="teacher-info-content">
                <div className="teacher-info-label">Trường</div>
                <div className="teacher-info-value">{profile.school}</div>
              </div>
              <button className="teacher-edit-button" onClick={() => handleEdit('school')}><MdEdit />Chỉnh sửa</button>
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
              <button className="teacher-profile-close-button" onClick={handleCancelEdit}><MdClose /></button>
            </div>
            <div className="teacher-profile-edit-modal-body">
              <label className="teacher-profile-edit-label">{getFieldLabel(editingField)}:</label>
              <input type={getFieldType(editingField)} value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder={getFieldPlaceholder(editingField)} className="teacher-profile-edit-input" autoFocus />
            </div>
            <div className="teacher-profile-edit-modal-footer">
              <button className="teacher-profile-cancel-button" onClick={handleCancelEdit} disabled={isSaving}>Hủy</button>
              <button className="teacher-profile-save-button" onClick={handleSaveEdit} disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu'}</button>
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
              <button className="teacher-profile-close-button" onClick={closeNotif} style={{border:'none',background:'transparent',cursor:'pointer'}}><MdClose /></button>
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
              <button className="teacher-profile-close-button" onClick={() => setPwdModal({ open: false, current: '', next: '', loading: false })} style={{border:'none',background:'transparent',cursor:'pointer'}}><MdClose /></button>
            </div>
            <div className="teacher-profile-edit-modal-body" style={{padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
              <label className="teacher-profile-edit-label">Mật khẩu hiện tại</label>
              <input type="password" value={pwdModal.current} onChange={(e)=>setPwdModal((s)=>({...s,current:e.target.value}))} className="teacher-profile-edit-input" placeholder="Nhập mật khẩu hiện tại" />
              <label className="teacher-profile-edit-label">Mật khẩu mới</label>
              <input type="password" value={pwdModal.next} onChange={(e)=>setPwdModal((s)=>({...s,next:e.target.value}))} className="teacher-profile-edit-input" placeholder="Nhập mật khẩu mới (>= 6 ký tự)" />
            </div>
            <div className="teacher-profile-edit-modal-footer" style={{padding:'12px 16px',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="teacher-profile-cancel-button" onClick={() => setPwdModal({ open: false, current: '', next: '', loading: false })} disabled={pwdModal.loading}>Hủy</button>
              <button className="teacher-profile-save-button" onClick={submitPasswordChange} disabled={pwdModal.loading}>{pwdModal.loading ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
