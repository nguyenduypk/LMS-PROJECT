import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClassSchedule.css';
import Header from './Header';
import { 
  CalendarDays, 
  Plus, 
  X,
  Monitor,
  Video,
  Users,
  ChevronDown,
  Calendar,
  Clock,
  Link2
  
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '../../utils/api';

export default function ClassSchedule() {
  // State management
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [activePlatform, setActivePlatform] = useState('zoom');
  const [repeatOption, setRepeatOption] = useState('none');
  const [classTime, setClassTime] = useState('07:00');
  const [className, setClassName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkedClasses, setCheckedClasses] = useState([]);
  const [classLink, setClassLink] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load teacher's overall schedules
  useEffect(() => {
    const loadTeacherSchedules = async () => {
      try {
        setLoading(true);
        console.log('Loading teacher schedules...');
        console.log('Current user token:', sessionStorage.getItem('token'));
        
        const response = await api.schedules.getTeacherSchedule();
        console.log('Teacher schedules response:', response);
        console.log('Response type:', typeof response);
        console.log('Response.schedules:', response.schedules);
        console.log('Schedules length:', response.schedules ? response.schedules.length : 'undefined');
        
        if (response.schedules) {
          setSchedules(response.schedules);
          console.log('Schedules state set to:', response.schedules);
        } else {
          console.log('No schedules in response');
          setSchedules([]);
        }
      } catch (err) {
        console.error('Error loading teacher schedules:', err);
        setSchedules([]);
      } finally {
        setLoading(false);
        console.log('Loading finished. Final schedules state:', schedules);
      }
    };

    loadTeacherSchedules();
  }, []);

  // Add refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true);
      console.log('Refreshing teacher schedules...');
      
      const response = await api.schedules.getTeacherSchedule();
      console.log('Refresh response:', response);
      
      if (response.schedules) {
        setSchedules(response.schedules);
        console.log('Schedules refreshed:', response.schedules);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('Error refreshing schedules:', err);
    } finally {
      setLoading(false);
    }
  };
  // Platform options
  const platforms = [
    { id: 'zoom', icon: <Video size={20} />, name: 'Zoom' },
    { id: 'meet', icon: <Monitor size={20} />, name: 'Google Meet' },
    { id: 'teams', icon: <Users size={20} />, name: 'Teams' },
  ];

  // Repeat options
  const repeatOptions = [
    { value: 'none', label: 'Không lặp lại' },
    { value: 'daily', label: 'Hàng ngày' },
    { value: 'weekly', label: 'Hàng tuần' },
    { value: 'monthly', label: 'Hàng tháng' }
  ];

  // Helper: find a valid online meeting link inside a schedule object
  const getValidOnlineLink = (obj) => {
    const seen = new Set();
    const isValid = (s) => {
      if (typeof s !== 'string') return false;
      const val = s.trim();
      if (!val) return false;
      const lower = val.toLowerCase();
      if (lower === 'null' || lower === 'undefined') return false;
      return /^https?:\/\//i.test(val) || /(meet\.google\.com|zoom\.us|teams\.microsoft\.com|skype\.com)/i.test(lower);
    };
    const dfs = (node, depth = 0) => {
      if (!node || depth > 5) return '';
      if (typeof node === 'string' && isValid(node)) return node.trim();
      if (typeof node !== 'object') return '';
      if (seen.has(node)) return '';
      try { seen.add(node); } catch {}
      for (const key of Object.keys(node)) {
        const v = node[key];
        if (typeof v === 'string' && isValid(v)) return v.trim();
        const found = dfs(v, depth + 1);
        if (found) return found;
      }
      return '';
    };
    return dfs(obj) || '';
  };

  // Handle checkbox selection
  const handleCheckClass = (classId) => {
    setCheckedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  // Navigation between modals
  const handleNext = () => {
    setShowCreateModal(false);
    setShowOfflineModal(true);
  };

  // Form submission
  const handleConfirm = () => {
    setShowOfflineModal(false);
  };

  // Format date in Vietnamese
  const formattedDate = format(selectedDate, 'd MMMM', { locale: vi });
  const isOnline = activePlatform === 'zoom' || activePlatform === 'meet' || activePlatform === 'teams';

  // Normalize various weekday formats to JS getDay() index (0=Sun..6=Sat)
  const weekdayToIndex = (s) => {
    if (!s) return -1;
    const t = String(s).trim().toLowerCase();
    const map = {
      'chủ nhật': 0, 'chu nhat': 0, 'cn': 0, 'sunday': 0,
      'thứ 2': 1, 'thu 2': 1, 'thứ hai': 1, 'thu hai': 1, 'monday': 1, 't2': 1,
      'thứ 3': 2, 'thu 3': 2, 'thứ ba': 2, 'thu ba': 2, 'tuesday': 2, 't3': 2,
      'thứ 4': 3, 'thu 4': 3, 'thứ tư': 3, 'thu tu': 3, 'wednesday': 3, 't4': 3,
      'thứ 5': 4, 'thu 5': 4, 'thứ năm': 4, 'thu nam': 4, 'thursday': 4, 't5': 4,
      'thứ 6': 5, 'thu 6': 5, 'thứ sáu': 5, 'thu sau': 5, 'friday': 5, 't6': 5,
      'thứ 7': 6, 'thu 7': 6, 'thứ bảy': 6, 'thu bay': 6, 'saturday': 6, 't7': 6,
      '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 0
    };
    if (t in map) return map[t];
    // Try to extract number
    const m = t.match(/(ch[uư]|thu|thứ)\s*(\d)/);
    if (m) {
      const n = parseInt(m[2], 10);
      if (n >= 2 && n <= 7) return n - 1;
      if (n === 8) return 0;
    }
    return -1;
  };

  const todayIdx = new Date().getDay();
  const todaySchedules = (schedules || []).filter(s => weekdayToIndex(s?.day_of_week) === todayIdx);

  return (
    <div className="class-schedule">
      <Header teacherName="Nguyễn Duy" />

      {/* Main Content */}
      <div className="top-section">
        <h1 className="schedule-title">Tạo phòng dạy theo lịch nhanh chóng</h1>
        <p className="schedule-sub">Hỗ trợ tạo phòng Google Meet, Zoom Pro, Teams, Zavi,... mọi lúc mọi nơi</p>
        <div className="schedule-actions">
          <button 
            className="create-button" 
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Tạo phòng mới
          </button>
          <button className="manage-button"
          onClick={() => navigate('/teacher/manageschedule')}
          >
            <CalendarDays size={18} />
            Quản lý lịch
          </button>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Phòng dạy hôm nay</span>
        <button 
          onClick={handleRefresh}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Làm mới
        </button>
      </div>

      <div className="today-classes-list">
        {loading ? (
          <div className="empty-state">Đang tải lịch học...</div>
        ) : todaySchedules.length > 0 ? (
          todaySchedules.map((schedule, index) => {
            console.log('Rendering schedule:', schedule);
            const link = getValidOnlineLink(schedule);
            return (
              <div className="today-class-card" key={index}>
                <span className="class-time">{schedule.start_time}</span>
                <span className="class-name">{schedule.subject || schedule.class_name}</span>
                <span className="class-status">Chưa bắt đầu</span>
                {/* Join button removed per request */}
              </div>
            );
          })
        ) : (
          <div className="empty-state">Không có buổi học nào diễn ra hôm nay</div>
        )}
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="room-modal">
            <div className="modal-header">
              <h2>Tạo phòng học</h2>
              <button 
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="room-list">
              {loading ? (
                <div className="empty-state">Đang tải danh sách lớp...</div>
              ) : schedules.length > 0 ? (
                schedules.map((schedule, index) => (
                  <div key={index} className="room-item">
                    <div className="room-thumbnail">
                      <div className="room-thumbnail-letter">
                        {schedule.class_name ? schedule.class_name.charAt(0).toUpperCase() : 'L'}
                      </div>
                    </div>
                    <div className="room-info">
                      <div className="room-name">{schedule.subject || schedule.class_name}</div>
                      <div className="room-code">{schedule.day_of_week} lúc {schedule.start_time}</div>
                    </div>
                    <div className="room-checkbox">
                      <input 
                        type="checkbox" 
                        checked={checkedClasses.includes(index)}
                        onChange={() => handleCheckClass(index)}
                        className="class-checkbox"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Không có lịch học nào</div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button 
                className="next-button" 
                onClick={() => {
                  setShowCreateModal(false);
                  navigate('/teacher/schedule/create');
                }}
                disabled={checkedClasses.length === 0}
              >
                Tiếp theo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Classroom Modal */}
      {showOfflineModal && (
        <div className="modal-overlay">
          <div className="room-modal offline-modal modern-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                Tạo phòng học <span className="class-type">{activePlatform === 'offline' ? 'Offline' : platforms.find(p => p.id === activePlatform)?.name}</span>
              </h2>
              <button className="close-button" onClick={() => setShowOfflineModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="platform-tabs-container">
              <div className="platform-tabs modern-tabs">
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    className={`platform-tab modern-tab ${activePlatform === platform.id ? 'active' : ''}`}
                    onClick={() => setActivePlatform(platform.id)}
                  >
                    <div className="platform-icon">{platform.icon}</div>
                    <span className="platform-name">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modern-form">
              <div className="form-group">
                <label className="form-label">Tên buổi học</label>
                <input
                  type="text"
                  className="form-input modern-input"
                  placeholder="Nhập tên buổi học"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                />
              </div>
              {isOnline && (
                <div className="form-group">
                  <label className="form-label">Link phòng học</label>
                  <div className="input-icon-group">
                    <span className="input-icon"><Link2 size={18} /></span>
                    <input
                      type="text"
                      className="form-input modern-input"
                      placeholder="Dán link phòng học..."
                      value={classLink}
                      onChange={e => setClassLink(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Ngày</label>
                <div className="input-icon-group">
                  <span className="input-icon"><Calendar size={18} /></span>
                  <input
                    type="date"
                    className="form-input modern-input"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={e => setSelectedDate(new Date(e.target.value))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Giờ bắt đầu</label>
                <div className="input-icon-group">
                  <span className="input-icon"><Clock size={18} /></span>
                  <input
                    type="time"
                    className="form-input modern-input"
                    value={classTime}
                    onChange={e => setClassTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lặp lại</label>
                <div className="select-container">
                  <select
                    className="form-select modern-input"
                    value={repeatOption}
                    onChange={e => setRepeatOption(e.target.value)}
                  >
                    {repeatOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="select-arrow" />
                </div>
              </div>
              <div className="modal-actions modern-actions">
                <button className="cancel-button outlined modern-btn" onClick={() => { setShowOfflineModal(false); setShowCreateModal(true); }}>Quay lại</button>
                <button className="next-button contained modern-btn" onClick={handleConfirm}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}