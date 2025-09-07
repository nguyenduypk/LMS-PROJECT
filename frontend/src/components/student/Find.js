import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const Find = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [showClassInfo, setShowClassInfo] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Xử lý nhập ký tự
  const handleChange = (e) => {
    let val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (val.length > 5) val = val.slice(0, 5);
    setCode(val);
  };

  // Xử lý backspace
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && code.length > 0) {
      setCode(code.slice(0, -1));
      e.preventDefault();
    }
  };

  // Khi click vào khung, focus input ẩn
  const handleBoxClick = () => {
    inputRef.current?.focus();
  };

  // Xử lý tìm lớp học
  const handleFindClass = async () => {
    if (code.length !== 5) {
      setError('Vui lòng nhập đủ 5 ký tự mã lớp');
      return;
    }

    // Debug: Kiểm tra user hiện tại
            const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const token = sessionStorage.getItem('token');

    setIsLoading(true);
    setError('');
    setSuccess('');
    setClassInfo(null);
    setShowClassInfo(false);

    try {
      const response = await api.classes.getByCode(code);
      
      if (response.class) {
        setClassInfo(response.class);
        setShowClassInfo(true);
      } else {
        setError(response.message || 'Không tìm thấy lớp học');
      }
    } catch (error) {
      console.error('Lỗi tìm lớp:', error);
      setError('Có lỗi xảy ra khi tìm lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý tham gia lớp học
  const handleJoinClass = async () => {
    if (!classInfo) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.classes.joinByCode(code);
      
      if (response.message) {
        // Kiểm tra nếu là yêu cầu lại (reactivated)
        if (response.message.includes('gửi lại')) {
          setSuccess('Yêu cầu tham gia lớp học đã được gửi lại và đang chờ giáo viên duyệt!');
        } else {
          setSuccess('Yêu cầu tham gia lớp học đã được gửi và đang chờ giáo viên duyệt!');
        }
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 3000);
      } else {
        setError(response.message || 'Tham gia lớp học thất bại');
      }
    } catch (error) {
      console.error('Lỗi tham gia lớp:', error);
      setError('Có lỗi xảy ra khi tham gia lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý quay lại danh sách lớp
  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <div style={{
      background: '#f4f6f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 4px 32px rgba(25, 118, 210, 0.13)',
        padding: '40px 48px 32px 48px',
        minWidth: 420,
        maxWidth: '90vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <img src="/logo192.png" alt="EduHub Classroom" style={{ width: 48, height: 48 }} />
          <span style={{ fontWeight: 700, fontSize: 28, color: '#2196f3', letterSpacing: 1 }}>EduHub Classroom</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, textAlign: 'center' }}>
          Tham gia lớp bằng mã lớp
        </div>
                 <div style={{ color: '#666', fontSize: 16, marginBottom: 32, textAlign: 'center' }}>
           Mã lớp gồm 5 ký tự, được giáo viên lớp đó cung cấp
         </div>
        
        {/* Error message */}
        {error && (
          <div style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            border: '1px solid #ffcdd2',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            borderRadius: '8px',
            border: '1px solid #c8e6c9',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}
        <div
          style={{ display: 'flex', gap: 16, marginBottom: 32, position: 'relative', justifyContent: 'center', cursor: 'pointer' }}
          onClick={handleBoxClick}
        >
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={5}
            autoFocus
            style={{
              position: 'absolute',
              opacity: 0,
              zIndex: 10,
              width: 220,
              height: 54,
              left: 0,
              top: 0,
              caretColor: 'transparent',
            }}
            autoComplete="one-time-code"
          />
          {[0,1,2,3,4].map(i => (
            <div
              key={i}
              style={{
                borderBottom: '2px solid #1e88e5',
                padding: '7.5px 8px',
                height: 52,
                width: 40,
                margin: '0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                borderRadius: 0,
              }}
            >
              <h4 style={{
                color: '#1e88e5',
                fontWeight: 700,
                fontSize: 32,
                margin: 0,
                letterSpacing: 2,
                textAlign: 'center',
                width: 32,
                height: 40,
                lineHeight: '40px',
              }}>{code[i] || ''}</h4>
            </div>
          ))}
        </div>
        <button 
          onClick={handleFindClass}
          disabled={isLoading || code.length !== 5}
          style={{
            width: '100%',
            background: code.length === 5 && !isLoading ? '#1e88e5' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '16px 0',
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(30, 136, 229, 0.10)',
            cursor: code.length === 6 && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
                     onMouseOver={e => {
             if (code.length === 5 && !isLoading) {
               e.currentTarget.style.background = '#1565c0';
             }
           }}
           onMouseOut={e => {
             if (code.length === 5 && !isLoading) {
               e.currentTarget.style.background = '#1e88e5';
             }
           }}
        >
          {isLoading ? 'Đang tìm...' : 'Tìm lớp'}
        </button>
        
        {/* Hiển thị thông tin lớp học */}
        {showClassInfo && classInfo && (
          <div style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #e3f2fd',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1976d2', fontSize: '18px' }}>
              Thông tin lớp học
            </h3>
            <div style={{ marginBottom: '8px' }}>
              <strong>Tên lớp:</strong> {classInfo.name}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Môn học:</strong> {classInfo.subject}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Giáo viên:</strong> {classInfo.teacher_name}
            </div>
            {classInfo.description && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Mô tả:</strong> {classInfo.description}
              </div>
            )}
            {classInfo.is_already_joined ? (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff3cd',
                color: '#856404',
                borderRadius: '8px',
                border: '1px solid #ffeaa7',
                fontSize: '14px'
              }}>
                Bạn đã tham gia lớp học này rồi
              </div>
            ) : (
              <button
                onClick={handleJoinClass}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: isLoading ? '#ccc' : '#4caf50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => {
                  if (!isLoading) e.currentTarget.style.background = '#45a049';
                }}
                onMouseOut={e => {
                  if (!isLoading) e.currentTarget.style.background = '#4caf50';
                }}
              >
                {isLoading ? 'Đang tham gia...' : 'Tham gia lớp học'}
              </button>
            )}
          </div>
        )}
        
        <button
          onClick={handleBack}
          style={{
            width: '100%',
            background: '#fff',
            border: 'none',
            color: '#222',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            marginTop: 8,
            padding: 16,
            borderRadius: 10,
            boxShadow: 'none',
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#f4f6f8';
            e.currentTarget.style.color = '#1e88e5';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(30, 136, 229, 0.10)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#222';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: 20 }}>←</span> Quay lại danh sách lớp
        </button>
      </div>
    </div>
  );
};

export default Find; 