import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Monitor, Video, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import './ClassSchedule.css';

// Custom SVG Icons for platforms
const ZoomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.46 7.57L12.357 2.115c-.223-.12-.49-.12-.713 0L1.543 7.57c-.364.197-.5.652-.303 1.017.135.25.394.393.66.393.12 0 .243-.03.356-.09l.815-.44L4.7 19.963c.214 1.215 1.308 2.062 2.658 2.062h9.282c1.352 0 2.445-.848 2.663-2.087l1.626-11.49.818.442c.364.193.82.06 1.017-.304.196-.363.06-.818-.304-1.016zm-4.638 12.133c-.107.606-.703.822-1.18.822H7.36c-.48 0-1.075-.216-1.178-.798L4.48 7.69 12 3.628l7.522 4.06-1.7 12.015z"/>
    <path d="M12 13.628l-3.196-3.196c-.39-.39-1.024-.39-1.414 0-.39.39-.39 1.024 0 1.414L12 16.456l4.61-4.61c.39-.39.39-1.024 0-1.414-.39-.39-1.024-.39-1.414 0L12 13.628z"/>
  </svg>
);

const GoogleMeetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.5 8.5c0-.828.672-1.5 1.5-1.5h8c.828 0 1.5.672 1.5 1.5v7c0 .828-.672 1.5-1.5 1.5H8c-.828 0-1.5-.672-1.5-1.5v-7z"/>
    <path d="M12 6l-2 2h4l-2-2z" fill="#fff"/>
    <path d="M12 18l-2-2h4l-2 2z" fill="#fff"/>
    <path d="M6 12l2-2v4l-2-2z" fill="#fff"/>
    <path d="M18 12l-2-2v4l2-2z" fill="#fff"/>
  </svg>
);

const TeamsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const platforms = [
  { id: 'offline', icon: <BookOpen size={20} />, name: 'Offline' },
  { id: 'zoom_shub', icon: <ZoomIcon />, name: 'Zoom trên SHub' },
  { id: 'meet', icon: <GoogleMeetIcon />, name: 'Google Meet' },
  { id: 'teams', icon: <TeamsIcon />, name: 'Microsoft Teams' },
  { id: 'facebook', icon: <FacebookIcon />, name: 'Facebook Live' },
];

const repeatOptions = [
  { value: 'none', label: 'Không lặp lại' },
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' }
];

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState('offline');
  const [className, setClassName] = useState('');
  const [classLink, setClassLink] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classTime, setClassTime] = useState('07:00');
  const [repeatOption, setRepeatOption] = useState('none');
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const isOnline = !['offline'].includes(activePlatform);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý tạo phòng học ở đây
    navigate('/teacher/schedule');
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <form className="modern-modal" style={{ width: 700, maxWidth: '95vw', background: '#fff', padding: '24px 32px', borderRadius: 12, boxShadow: '0 12px 48px rgba(37,99,235,0.13)', display: 'flex', flexDirection: 'column', gap: 0 }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, margin: 0, color: '#222', fontWeight: 600 }}>Tạo phòng học</h2>
            <h2 style={{ fontSize: 22, margin: 0, color: '#365f7e', fontWeight: 600, marginLeft: 4 }}>{platforms.find(p => p.id === activePlatform)?.name}</h2>
          </div>
          <div className="modern-tabs" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid #e5e7eb' }}>
            {platforms.map(platform => (
              <button
                key={platform.id}
                type="button"
                className={`modern-tab${activePlatform === platform.id ? ' active' : ''}`}
                style={{ 
                  fontSize: 12, 
                  padding: '12px 8px', 
                  borderRadius: 0, 
                  flex: 1,
                  minWidth: 'auto',
                  boxShadow: 'none',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 4, 
                  background: 'transparent', 
                  color: activePlatform === platform.id ? '#365f7e' : '#666', 
                  border: 'none',
                  borderBottom: activePlatform === platform.id ? '2px solid #365f7e' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActivePlatform(platform.id)}
              >
                {React.cloneElement(platform.icon, { 
                  color: activePlatform === platform.id ? '#365f7e' : '#666'
                })}
              </button>
            ))}
          </div>
          <div className="modern-form" style={{ gap: 12, width: '100%' }}>
            <div className="form-group" style={{ width: '100%' }}>
              <label className="form-label" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'block' }}>Tên buổi học</label>
              <input
                type="text"
                className="form-input modern-input"
                placeholder="Nhập tên buổi học"
                value={className}
                onChange={e => setClassName(e.target.value)}
                required
                style={{ fontSize: 16, height: 44, width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ width: '100%' }}>
              <label className="form-label" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                {isOnline ? 'Link phòng học' : 'Địa điểm học'}
              </label>
              <input
                type="text"
                className="form-input modern-input"
                placeholder={isOnline ? "Dán link phòng học..." : "Nhập địa điểm học..."}
                value={classLink}
                onChange={e => setClassLink(e.target.value)}
                required
                style={{ fontSize: 16, height: 44, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'block' }}>Ngày</label>
                <div className="input-icon-group">
                  <span className="input-icon"><Calendar size={18} /></span>
                  <input
                    type="date"
                    className="form-input modern-input"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={e => setSelectedDate(new Date(e.target.value))}
                    required
                    style={{ fontSize: 16, height: 44, width: '100%' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'block' }}>Giờ bắt đầu</label>
                <div className="input-icon-group">
                  <span className="input-icon" style={{ color: '#1e88e5', fontWeight: 700 }}><Clock size={20} strokeWidth={2.5} /></span>
                  <input
                    type="time"
                    className="form-input modern-input"
                    value={classTime}
                    onChange={e => setClassTime(e.target.value)}
                    required
                    style={{ fontSize: 16, height: 44, width: '100%' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'block' }}>Lặp lại</label>
                <div className="select-container" style={{ position: 'relative' }}>
                  <div 
                    className="form-select modern-input"
                    style={{ fontSize: 16, height: 44, width: '100%', color: '#222', borderColor: '#e5e7eb', borderRadius: 10, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}
                    onClick={() => setIsRepeatDropdownOpen(!isRepeatDropdownOpen)}
                  >
                    <span>{repeatOptions.find(option => option.value === repeatOption)?.label}</span>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className={`repeat-dropdown-arrow ${isRepeatDropdownOpen ? 'rotated' : ''}`}
                      style={{ position: 'absolute', right: '12px', color: '#222', pointerEvents: 'none', transition: 'transform 0.2s ease' }}
                    >
                      <path d="m7 10 5 5 5-5z" fill="currentColor"/>
                    </svg>
                  </div>
                  {isRepeatDropdownOpen && (
                    <div className="repeat-dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e0e7ef', borderRadius: 8, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', zIndex: 10000, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                      {repeatOptions.map(option => (
                        <div 
                          key={option.value}
                          className={`repeat-dropdown-item ${repeatOption === option.value ? 'selected' : ''}`}
                          style={{ padding: '10px 16px', fontSize: 15, color: '#333', cursor: 'pointer', transition: 'background-color 0.2s ease', fontFamily: 'inherit' }}
                          onClick={() => {
                            setRepeatOption(option.value);
                            setIsRepeatDropdownOpen(false);
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modern-actions" style={{ marginTop: 16, justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" className="cancel-button outlined modern-btn" style={{ fontSize: 15, padding: '10px 24px', color: '#1e88e5', borderColor: '#1e88e5', background: '#fff', borderRadius: 6 }} onClick={() => navigate('/teacher/schedule')}>Quay lại</button>
              <button type="submit" className="next-button contained modern-btn" style={{ fontSize: 15, padding: '10px 24px', background: '#1e88e5', color: '#fff', border: 'none', borderRadius: 6 }}>Xác nhận</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
} 
