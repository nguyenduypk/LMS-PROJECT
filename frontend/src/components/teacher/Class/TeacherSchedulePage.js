import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../Header';
import TeacherSidebar from './TeacherSidebar';
import CreateScheduleModal from './CreateScheduleModal';
import './TeacherSchedulePage.css';
import { 
  CalendarDays, 
  X,
  CircleDot,
  Plus,
  Pencil,
  Trash2,
  Video,
  BookOpen,
  Users,
  ExternalLink,
  Link2,
  MapPin,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '../../../utils/api';

// Debug logging toggle
const DEBUG = true;
const debugLog = (...args) => { if (DEBUG) console.log(...args); };

const getWeekDates = (date = new Date()) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const startDate = new Date(date.setDate(diff));
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    startDate,
    endDate,
    weekRange: `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}, ${endDate.getFullYear()}`,
    weekDays: Array.from({ length: 7 }).map((_, i) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      const isToday = new Date().toDateString() === dayDate.toDateString();
      return {
        label: i === 6 ? 'Chủ nhật' : `Thứ ${i + 2}`,
        date: `${dayDate.getDate()}/${dayDate.getMonth() + 1}`,
        isToday,
        fullDate: dayDate
      };
    })
  };
};

const getMonthDates = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Get first day of month
  const firstDay = new Date(year, month, 1);
  // Get last day of month
  const lastDay = new Date(year, month + 1, 0);
  
  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDay.getDay();
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  // Calculate start date (previous month days to fill first week)
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - adjustedFirstDay);
  
  // Calculate end date (next month days to fill last week)
  const endDate = new Date(lastDay);
  const daysToAdd = 42 - (lastDay.getDate() + adjustedFirstDay); // 6 weeks * 7 days
  endDate.setDate(lastDay.getDate() + daysToAdd);
  
  const monthRange = `${format(firstDay, 'MMMM yyyy', { locale: vi })}`;
  
  const monthDays = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const isToday = new Date().toDateString() === currentDate.toDateString();
    const isCurrentMonth = currentDate.getMonth() === month;
    const isCurrentYear = currentDate.getFullYear() === year;
    
    monthDays.push({
      date: currentDate.getDate(),
      fullDate: new Date(currentDate),
      isToday,
      isCurrentMonth: isCurrentMonth && isCurrentYear,
      dayOfWeek: currentDate.getDay(),
      dayName: format(currentDate, 'EEEE', { locale: vi })
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    monthRange,
    monthDays,
    firstDay,
    lastDay
  };
};

const WEEKLY_SCHEDULE = {
  '7-7': [
    {
      className: '1234Absdth',
      room: 'coi anh 7 đá',
      attendance: '0/2',
      type: 'Offline',
      startTime: '7:00',
      teacher: 'Nguyễn Văn A'
    }
  ],
  '8-7': [
    {
      className: '1234Absdth',
      room: 'Google Meet Room',
      attendance: '1/2',
      type: 'Google Meet',
      startTime: '7:00',
      teacher: 'Trần Thị B'
    }
  ],
  '11-7': [
    {
      className: '1234Absdth',
      room: 'Phòng thực hành Lab',
      attendance: '2/2',
      type: 'Offline',
      startTime: '7:00',
      teacher: 'Lê Văn C'
    }
  ], 
  '13-7': [
    {
      className: '1234Absdth',
      room: 'Zoom Meeting',
      attendance: '0/2',
      type: 'Zoom',
      startTime: '7:00',
      teacher: 'Lê Văn C'
    }
  ],
  '15-7': [
    {
      className: '1234Absdth',
      room: 'CNTT Lab',
      attendance: '2/2',
      type: 'Offline',
      startTime: '9:00',
      teacher: 'Phạm Thị D'
    }
  ],
  '18-7': [
    {
      className: '1234Absdth',
      room: 'Microsoft Teams',
      attendance: '1/2',
      type: 'Teams',
      startTime: '7:00',
      teacher: 'Hoàng Văn E'
    }
  ],
  '20-7': [
    {
      className: '1234Absdth',
      room: 'CNTT',
      attendance: '0/2',
      type: 'Offline',
      startTime: '7:00',
      teacher: 'Lý Thị F'
    }
  ],
  '25-7': [
    {
      className: '1234Absdth',
      room: 'Phòng 301',
      attendance: '0/2',
      type: 'Offline',
      startTime: '7:00',
      teacher: 'Vũ Văn G'
    }
  ],
  '28-7': [
    {
      className: '1234Absdth',
      room: 'Skype Call',
      attendance: '1/2',
      type: 'Skype',
      startTime: '8:00',
      teacher: 'Đỗ Thị H'
    }
  ]
};

export default function TeacherSchedulePage() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [activeTab, setActiveTab] = useState('week');
  
  // State for class information and schedules
  const [classInfo, setClassInfo] = useState({
    id: classId ? parseInt(classId) : null,
    name: 'Lớp học mẫu',
    code: 'CLASS001',
    teacher: 'Nguyễn Văn A'
  });
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  // Central confirm modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, event: null });

  const openConfirm = (action, event) => setConfirmModal({ open: true, action, event });
  const closeConfirm = () => setConfirmModal({ open: false, action: null, event: null });
  const handleConfirm = () => {
    try { debugLog('[TeacherSchedulePage] confirm-modal action:', confirmModal); } catch(e){}
    const ev = confirmModal.event;
    if (!ev) { closeConfirm(); return; }
    if (confirmModal.action === 'end') {
      try { console.log('[TeacherSchedulePage] end-meeting (modal):', ev); } catch(e){}
      alert('Đã kết thúc phòng học (demo)');
    } else if (confirmModal.action === 'delete') {
      handleDeleteSchedule(ev.id);
    }
    // Cleanup UI states
    try { setHoveredEvent(null); setTooltipStyle({ display: 'none' }); } catch(e){}
    try { handleClosePopup && handleClosePopup(); } catch(e){}
    closeConfirm();
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const { weekRange, weekDays } = getWeekDates(currentDate);
  const { monthRange, monthDays } = getMonthDates(currentDate);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({ display: 'none' });
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  // Helper: deep-scan object to find a valid meeting link anywhere
  const getValidOnlineLink = (obj) => {
    const seen = new Set();
    const meetCodeRegex = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
    const urlRegex = /https?:\/\/[^\s"'>)]+/i;
    const domainHintRegex = /(meet\.google\.com|zoom\.us|teams\.microsoft\.com|skype\.com|webex\.com|zavi\.vn|zalo\.me|classroom\.google\.com)/i;
    const extractFromString = (s) => {
      if (typeof s !== 'string') return '';
      const val = s.trim();
      if (!val) return '';
      const m = val.match(urlRegex);
      if (m) return m[0];
      const lower = val.toLowerCase();
      if (meetCodeRegex.test(lower)) return `https://meet.google.com/${lower}`;
      // Try to detect Zoom numeric meeting IDs that may appear with spaces or punctuation
      const zoomDigits = val.replace(/[^0-9]/g, '');
      if (/^\d{9,11}$/.test(zoomDigits)) return `https://zoom.us/j/${zoomDigits}`;
      if (domainHintRegex.test(lower)) return `https://${val.replace(/^\W+|\W+$/g,'')}`;
      return '';
    };
    const isValid = (s) => {
      if (typeof s !== 'string') return false;
      const val = s.trim();
      if (!val) return false;
      const lower = val.toLowerCase();
      if (lower === 'null' || lower === 'undefined') return false;
      // Accept http(s) or common meeting domains
      if (/^https?:\/\//i.test(val)) return true;
      if (domainHintRegex.test(lower)) return true;
      // Accept bare Google Meet codes like abc-defg-hij
      if (meetCodeRegex.test(lower)) return true;
      // Accept Zoom numeric ID like "853 123 4567" without domain
      const zoomDigits = val.replace(/[^0-9]/g, '');
      if (/^\d{9,11}$/.test(zoomDigits)) return true;
      return false;
    };
    const dfs = (node, depth = 0) => {
      if (!node || depth > 5) return '';
      if (typeof node === 'string') {
        if (isValid(node)) return node.trim();
        const ext = extractFromString(node);
        if (ext) return ext;
        return '';
      }
      if (typeof node !== 'object') return '';
      if (seen.has(node)) return '';
      try { seen.add(node); } catch {}
      const keys = Object.keys(node);
      const priorityKeys = keys.filter(k => /(link|url|meet|googlemeet|meet_code|meetcode|zoom|teams|webex|skype|room|join|invite|invitation|meeting|meeting_url|join_url|joinurl|description|noi_dung|notes|ghi_chu|ghichu|note)/i.test(k));
      for (const key of priorityKeys) {
        const v = node[key];
        if (typeof v === 'string') {
          if (isValid(v)) return v.trim();
          const ext = extractFromString(v);
          if (ext) return ext;
        }
      }
      // Fallback: generic deep scan
      for (const key of keys) {
        const v = node[key];
        if (typeof v === 'string') {
          if (isValid(v)) return v.trim();
          const ext = extractFromString(v);
          if (ext) return ext;
        }
        const found = dfs(v, depth + 1);
        if (found) return found;
      }
      return '';
    };
    return dfs(obj) || '';
  };

  // Normalize different link formats to a full URL we can open
  const normalizeMeetingLink = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    let v = raw.trim().replace(/^"|"$/g, '');
    const lower = v.toLowerCase();
    const meetCodeRegex = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
    if (/^https?:\/\//i.test(v)) return v;
    if (meetCodeRegex.test(lower)) return `https://meet.google.com/${lower}`;
    // Zoom numeric meeting id
    const zoomDigits = v.replace(/[^0-9]/g, '');
    if (/^\d{9,11}$/.test(zoomDigits)) return `https://zoom.us/j/${zoomDigits}`;
    // Bare domain/path -> prepend https
    return `https://${v}`;
  };

  // Helper: prefer schedule-level link; fallback to class-level link if available on the event
  const getJoinLink = (event) => {
    if (!event) return '';
    // Try direct fields in event first
    const direct = getValidOnlineLink(event);
    if (direct) return direct;
    // Try common class-scoped fields if present in event payload
    const candidates = [
      event.class_online_link,
      event.class_link,
      event?.class?.online_link,
      event?.class?.meeting_link
    ].filter(Boolean);
    for (const c of candidates) {
      const found = getValidOnlineLink({ online_link: c });
      if (found) return found;
    }
    return '';
  };

  // Determine if an event should be treated as online even when link is missing
  const isOnlineEvent = (event) => {
    const t = (event?.type || '').toString().toLowerCase();
    const room = (event?.room || '').toString().toLowerCase();
    if (t === 'online') return true;
    if (/meet|google|zoom|teams|microsoft|skype|webex|zavi/.test(room)) return true;
    return false;
  };

  const [isEventHovered, setIsEventHovered] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupStyle, setPopupStyle] = useState({ display: 'none' });

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Load class information and schedules
  useEffect(() => {
    const loadClassData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        debugLog('Loading class data for ID:', classId);
        
        if (!classId) {
          setError('Không có ID lớp học');
          setLoading(false);
          return;
        }
        
        // Load class information by ID
        const classResponse = await api.classes.getById(classId);
        debugLog('Class response:', classResponse);
        
        if (classResponse.class) {
          setClassInfo(classResponse.class);
          debugLog('Class info set:', classResponse.class);
          
          // Load schedules for this class
          const scheduleResponse = await api.schedules.getByClass(classResponse.class.id);
          debugLog('Schedule response:', scheduleResponse);
          
          if (scheduleResponse.schedules) {
            setSchedules(scheduleResponse.schedules);
          }
        } else {
          setError('Không tìm thấy thông tin lớp học');
        }
      } catch (err) {
        console.error('Error loading class data:', err);
        setError('Không thể tải dữ liệu lớp học');
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      loadClassData();
    }
  }, [classId]);

  // Handle create schedule
  const handleCreateSchedule = async (scheduleData) => {
    try {
      // Đảm bảo có classInfo.id trước khi tạo
      if (!classInfo.id) {
        throw new Error('Chưa có thông tin lớp học');
      }
      
      debugLog('Creating schedule with data:', scheduleData);
      debugLog('ClassInfo.id:', classInfo.id);
      
      const response = await api.schedules.create(scheduleData);
      debugLog('Create schedule response:', response);
      
      if (response.schedule) {
        debugLog('Schedule created successfully:', response.schedule);
        setSchedules(prev => {
          const newSchedules = [...prev, response.schedule];
          debugLog('Updated schedules:', newSchedules);
          return newSchedules;
        });
        setIsCreateModalOpen(false);
        
        // Reload schedules to ensure data consistency
        const scheduleResponse = await api.schedules.getByClass(classInfo.id);
        if (scheduleResponse.schedules) {
          debugLog('Reloaded schedules:', scheduleResponse.schedules);
          setSchedules(scheduleResponse.schedules);
        }
      } else if (response.errors) {
        // Hiển thị lỗi validation
        const errorMessage = response.errors.map(err => err.msg).join(', ');
        alert('Lỗi: ' + errorMessage);
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      alert('Lỗi tạo lịch học: ' + errorMessage);
      throw err;
    }
  };

  // Handle update schedule
  const handleUpdateSchedule = async (scheduleData) => {
    try {
      const response = await api.schedules.update(editingSchedule.id, scheduleData);
      if (response.schedule) {
        setSchedules(prev => 
          prev.map(schedule => 
            schedule.id === editingSchedule.id ? response.schedule : schedule
          )
        );
        setEditingSchedule(null);
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      throw err;
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.schedules.delete(scheduleId);
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  // Open edit modal
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setIsCreateModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingSchedule(null);
  };

  const handleEventHover = (event, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 400;
    const overlap = 12;
    let left, top;
    left = rect.right - overlap;
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    top = rect.top;
    setHoveredEvent(event);
    setTooltipStyle({
      display: 'block',
      left: `${left}px`,
      top: `${top}px`
    });
  };

  const handleEventLeave = () => {
    setHoveredEvent(null);
    setTooltipStyle({ display: 'none' });
  };

  const handleActionMenuClick = (event, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const popupWidth = 400;
    let left, top;
    
    left = rect.right + 8;
    if (left + popupWidth > window.innerWidth - 8) {
      left = rect.left - popupWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    
    top = rect.top;
    if (top + 200 > window.innerHeight - 8) {
      top = rect.bottom - 200;
    }
    
    setSelectedEvent(event);
    setPopupStyle({
      display: 'block',
      left: `${left}px`,
      top: `${top}px`
    });
  };

  const handleClosePopup = () => {
    setSelectedEvent(null);
    setPopupStyle({ display: 'none' });
  };

  useEffect(() => {
    if (!isEventHovered && !isTooltipHovered) {
      setHoveredEvent(null);
      setTooltipStyle({ display: 'none' });
    }
  }, [isEventHovered, isTooltipHovered]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedEvent && !event.target.closest('.teacher-action-popup')) {
        handleClosePopup();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedEvent]);

  // Helpers: parse HH:mm or HH:mm:ss to Date using provided base date
  const toTimeOnDate = (baseDate, timeStr) => {
    try {
      const [hh = '00', mm = '00'] = String(timeStr || '').split(':');
      const d = new Date(baseDate);
      d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
      return d;
    } catch {
      const d = new Date(baseDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  };

  // Compute status for a schedule on a specific calendar date
  const getStatusForSchedule = (dayDate, schedule) => {
    const now = new Date();
    const day = new Date(dayDate);
    day.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = toTimeOnDate(dayDate, schedule.start_time);
    const end = toTimeOnDate(dayDate, schedule.end_time);

    if (day < today) return 'Đã kết thúc';
    if (day > today) return 'Chưa bắt đầu';
    if (now < start) return 'Chưa bắt đầu';
    if (now > end) return 'Đã kết thúc';
    return 'Đang diễn ra';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Đang diễn ra':
        return 'dang-dien-ra';
      case 'Đã kết thúc':
        return 'da-ket-thuc';
      default:
        return 'chua-bat-dau';
    }
  };

  const getScheduleForDate = (date) => {
    // Convert date to day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[date.getDay()];
    
    debugLog('Getting schedule for date:', date, 'Day of week:', dayOfWeek);
    debugLog('Available schedules:', schedules);
    
    // Filter schedules for this day
    const filteredSchedules = schedules.filter(schedule => {
      debugLog('Checking schedule:', schedule.day_of_week, 'against:', dayOfWeek);
      return schedule.day_of_week === dayOfWeek;
    });
    
    debugLog('Filtered schedules for', dayOfWeek, ':', filteredSchedules);
    return filteredSchedules;
  };

  const renderWeekView = () => {
    debugLog('Rendering week view with schedules:', schedules);
    return (
      <div className="teacher-schedule-week-view">
        <div className="teacher-schedule-grid">
          {weekDays.map((day, index) => {
            const daySchedule = getScheduleForDate(day.fullDate);
            debugLog('Day schedule for', day.label, ':', daySchedule);
            return (
            <div className={`teacher-day-column ${day.isToday ? 'today' : ''}`} key={index}>
              <div className="teacher-day-header">
                <div className="teacher-day-title">
                  <div className="teacher-day-name">
                    {day.label}{day.isToday ? ' - Hôm nay' : ''}
                  </div>
                  <div className="teacher-day-date">{day.date}</div>
                </div>
              </div>

              <div className="teacher-day-divider"></div>

              <div className="teacher-events-list">
                {daySchedule.length > 0 ? (
                  daySchedule.map((schedule, eventIndex) => {
                    const roomIcon = getRoomIcon(schedule.type, schedule.room);
                    const eventWithDayKey = { 
                      ...schedule, 
                      dayKey: day.date.replace(/\//g, '-'),
                      className: schedule.class_name,
                      startTime: schedule.start_time
                    };
                    const attendanceStatus = getActualAttendanceStatus(day.date.replace(/\//g, '-'));
                    const status = getStatusForSchedule(day.fullDate, schedule);
                    return (
                      <div 
                        className="teacher-event-card"
                        key={eventIndex}
                        onMouseEnter={(e) => { handleEventHover(eventWithDayKey, e); setIsEventHovered(true); }}
                        onMouseLeave={() => setIsEventHovered(false)}
                      >
                        <div className="teacher-event-card-header">
                          <span className="teacher-event-icon">
                            <img src={roomIcon.src} alt={roomIcon.alt} />
                          </span>
                          <span className={`teacher-event-status ${getStatusBadgeClass(status)}`}>{status}</span>
                        </div>
                        <div className="teacher-event-class">{schedule.subject || schedule.class_name}</div>
                        <div className="teacher-event-room">{schedule.room}</div>
                        <div className="teacher-event-attendance">
                          <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew(attendanceStatus).svg }} style={{display:'inline-block', marginRight:8}} />
                          {attendanceStatus}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="teacher-empty-schedule">
                    Không có lịch học
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    );
  };

  const renderMonthView = () => {
    debugLog('Rendering month view with schedules:', schedules);
    return (
      <div className="teacher-schedule-month-view">
        <div className="teacher-schedule-table-container">
          <table className="teacher-schedule-table">
            <thead>
              <tr>
                <th>Tên lớp</th>
                <th>Tên phòng</th>
                <th>Loại phòng</th>
                <th>Bắt đầu</th>
                <th>Trạng thái</th>
                <th>Điểm danh</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '50px', color: '#666'}}>
                    Đang tải lịch học...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '50px', color: '#666'}}>
                    Không có lịch học nào
                  </td>
                </tr>
              ) : (
                (() => {
                  // Expand each weekly schedule into all occurrences within the current month
                  const occurrences = [];
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
                  schedules.forEach((schedule) => {
                    const target = dayMap[String(schedule.day_of_week || '').toLowerCase()];
                    if (target === undefined) return;
                    let d = new Date(firstDay);
                    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
                    for (let cur = new Date(d); cur <= lastDay; cur.setDate(cur.getDate() + 7)) {
                      occurrences.push({ schedule, occurDate: new Date(cur) });
                    }
                  });
                  return occurrences.map((item, index) => {
                    const { schedule, occurDate } = item;
                    const roomIcon = getRoomIconSmall(schedule.type, schedule.room);
                    const eventWithDayKey = { 
                      ...schedule,
                      dayKey: `${schedule.day_of_week}-${occurDate.getDate()}`,
                      className: schedule.class_name,
                      startTime: schedule.start_time
                    };
                    const status = getStatusForSchedule(occurDate, schedule);
                    return (
                      <tr key={`schedule-${index}-${occurDate.toISOString()}`} className="teacher-schedule-row">
                        <td className="teacher-class-name">{schedule.class_name}</td>
                        <td className="teacher-room-name">{schedule.room}</td>
                        <td className="teacher-room-type">
                          <div className="teacher-room-type-content">
                            <img src={roomIcon.src} alt={roomIcon.alt} />
                            <span>{schedule.type}</span>
                          </div>
                        </td>
                        <td className="teacher-start-time">
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <div dangerouslySetInnerHTML={{ __html: getTimeIconNew().svg }} />
                            <span>{schedule.day_of_week} lúc {schedule.start_time}</span>
                          </div>
                        </td>
                        <td className="teacher-status">
                          <span className={`teacher-status-badge ${getStatusBadgeClass(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="teacher-attendance">
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew('Chưa điểm danh').svg }} />
                            <span>Chưa điểm danh</span>
                          </div>
                        </td>
                        <td className="teacher-actions">
                          <button className="teacher-action-menu-btn" onClick={(e) => handleActionMenuClick(eventWithDayKey, e)}>
                            <span>⋮</span>
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date();
    const [day, month] = event.startTime.split(':');
    eventDate.setDate(parseInt(day));
    eventDate.setMonth(parseInt(month) - 1);
    eventDate.setHours(parseInt(day), parseInt(month), 0);
    
    const timeDiff = eventDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < -2) return 'Đã kết thúc';
    if (hoursDiff < 0 && hoursDiff > -2) return 'Đang diễn ra';
    return 'Chưa bắt đầu';
  };

  const getAttendanceStatus = (event) => {
    const status = getEventStatus(event);
    if (status === 'Đã kết thúc') return 'Đã điểm danh';
    if (status === 'Đang diễn ra') return 'Chưa điểm danh';
    return 'Chưa điểm danh';
  };

  const getEventStatusOverride = (dayKey, eventIndex) => {
    const statusMap = {
      '7-7': 'Đang diễn ra',
      '8-7': 'Đang diễn ra', 
      '11-7': 'Đã kết thúc',
      '18-7': 'Đang diễn ra',
      '20-7': 'Chưa bắt đầu',
      '25-7': 'Chưa bắt đầu'
    };
    return statusMap[dayKey] || 'Chưa bắt đầu';
  };

  const getAttendanceStatusOverride = (dayKey, eventIndex) => {
    const attendanceMap = {
      '7-7': 'Chưa điểm danh',
      '8-7': 'Đã điểm danh',
      '11-7': 'Đã điểm danh', 
      '18-7': 'Chưa điểm danh',
      '20-7': 'Chưa điểm danh',
      '25-7': 'Chưa điểm danh'
    };
    return attendanceMap[dayKey] || 'Chưa điểm danh';
  };

  const getActualAttendanceStatus = (dayKey) => {
    const attendanceMap = {
      '7-7': 'Chưa điểm danh',
      '8-7': 'Đã điểm danh',
      '11-7': 'Đã điểm danh', 
      '18-7': 'Chưa điểm danh',
      '20-7': 'Chưa điểm danh',
      '25-7': 'Chưa điểm danh'
    };
    return attendanceMap[dayKey] || 'Chưa điểm danh';
  };

  const getRoomIcon = (roomType, roomName) => {
    if (roomType === 'Google Meet' || roomName.toLowerCase().includes('meet') || roomName.toLowerCase().includes('google')) {
      return {
        src: "https://img.icons8.com/color/24/000000/google-meet--v2.png",
        alt: "Google Meet"
      };
    }
    
    if (roomType === 'Zoom' || roomName.toLowerCase().includes('zoom')) {
      return {
        src: "https://img.icons8.com/color/24/000000/zoom.png",
        alt: "Zoom"
      };
    }
    
    if (roomType === 'Teams' || roomName.toLowerCase().includes('teams') || roomName.toLowerCase().includes('microsoft')) {
      return {
        src: "https://img.icons8.com/color/24/000000/microsoft-teams.png",
        alt: "Microsoft Teams"
      };
    }
    
    if (roomType === 'Skype' || roomName.toLowerCase().includes('skype')) {
      return {
        src: "https://img.icons8.com/color/24/000000/skype.png",
        alt: "Skype"
      };
    }
    
    return {
      src: "https://img.icons8.com/color/24/000000/classroom.png",
      alt: "Offline"
    };
  };

  const getRoomIconSmall = (roomType, roomName) => {
    const icon = getRoomIcon(roomType, roomName);
    return {
      ...icon,
      src: icon.src.replace('/24/', '/16/')
    };
  };

  const getAttendanceIconNew = (attendanceStatus) => {
    if (attendanceStatus === 'Đã điểm danh') {
      return {
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="5" r="2.5" stroke="#374151" stroke-width="1.5" fill="none"/>
          <path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#374151" stroke-width="1.5" fill="none"/>
          <path d="M11 4l2 2-2 2" stroke="#374151" stroke-width="1.5" fill="none"/>
        </svg>`,
        alt: "Đã điểm danh"
      };
    } else {
      return {
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="5" r="2.5" stroke="#374151" stroke-width="1.5" fill="none"/>
          <path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#374151" stroke-width="1.5" fill="none"/>
        </svg>`,
        alt: "Chưa điểm danh"
      };
    }
  };

  const getTimeIconNew = () => {
    return {
      svg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="#374151" stroke-width="1.5" fill="none"/>
        <path d="M8 3v5l3.5 3.5" stroke="#374151" stroke-width="1.5" fill="none"/>
      </svg>`,
      alt: "Thời gian"
    };
  };

  return (
    <div className="teacher-schedule-container" onClick={(e) => debugLog('Container clicked:', e.target)}>
      <Header />
      <div className="teacher-schedule-content">
        <TeacherSidebar classInfo={classInfo} />
        <div className="teacher-schedule-main">
          <div className="teacher-schedule-toolbar">
            <div className="teacher-tab-group">
              <button
                className={`teacher-tab-button ${activeTab === 'week' ? 'active' : ''}`}
                onClick={() => setActiveTab('week')}
              >
                Tuần
              </button>
              <button
                className={`teacher-tab-button ${activeTab === 'month' ? 'active' : ''}`}
                onClick={() => setActiveTab('month')}
              >
                Tháng
              </button>
            </div>

            <div className="teacher-schedule-actions">
              <button 
                className="teacher-create-schedule-btn"
                onClick={() => {
                  debugLog('Button clicked! Loading:', loading, 'ClassInfo:', classInfo);
                  if (!classInfo.id) {
                    alert('Đang tải thông tin lớp học, vui lòng đợi...');
                    return;
                  }
                  debugLog('Setting modal to open');
                  setIsCreateModalOpen(true);
                }}
                disabled={loading || !classInfo.id}
                title={!classInfo.id ? 'Đang tải thông tin lớp học...' : 'Tạo lịch học mới'}
                style={{
                  position: 'relative',
                  zIndex: 1000,
                  backgroundColor: classInfo.id ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  cursor: classInfo.id ? 'pointer' : 'not-allowed'
                }}
              >
                <Plus size={16} />
                Tạo lịch học
              </button>
              <div className="teacher-week-navigator">
                <button 
                  className="teacher-nav-button" 
                  onClick={activeTab === 'week' ? handlePrevWeek : handlePrevMonth}
                >
                  <i className="teacher-arrow left">&lt;</i>
                </button>
                <span
                  className="teacher-week-display"
                  onClick={handleToday}
                  title="Nhấn để về tuần hiện tại"
                >
                  {activeTab === 'week' ? weekRange : monthRange}
                </span>
                <button 
                  className="teacher-nav-button" 
                  onClick={activeTab === 'week' ? handleNextWeek : handleNextMonth}
                >
                  <i className="teacher-arrow right">&gt;</i>
                </button>
              </div>
            </div>
          </div>

          <main className="teacher-schedule-main-content">
            {activeTab === 'week' ? renderWeekView() : renderMonthView()}
          </main>

          {hoveredEvent && (isEventHovered || isTooltipHovered) && (
            <div 
              className="teacher-schedule-tooltip"
              style={tooltipStyle}
              onMouseEnter={() => setIsTooltipHovered(true)}
              onMouseLeave={() => setIsTooltipHovered(false)}
            >
              <div className="teacher-tooltip-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                {(() => { try { debugLog('[TeacherSchedulePage] tooltip hoveredEvent', { online_link: hoveredEvent?.online_link, onlineLink: hoveredEvent?.onlineLink, meeting_link: hoveredEvent?.meeting_link, detected: getJoinLink(hoveredEvent) }); } catch(e){} return null; })()}
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',flex:1,marginLeft:'12px'}}>
                  <button
                    className="teacher-main-action-btn teacher-join-room-btn"
                    title={'Vào phòng học'}
                    style={{
                      background:'#1976d2', color:'#fff', fontWeight:600, padding:'6px 12px', borderRadius:6, border:'none', fontSize:13, cursor:'pointer'
                    }}
                    onClick={() => {
                      try { debugLog('[TeacherSchedulePage] join-click (tooltip) raw event:', hoveredEvent); } catch(e){}
                      const link = getJoinLink(hoveredEvent);
                      if (!link) {
                        try { debugLog('[TeacherSchedulePage] join-click (tooltip) no link detected -> open edit modal'); } catch(e){}
                        handleEditSchedule(hoveredEvent);
                        return;
                      }
                      const openLink = normalizeMeetingLink(link);
                      try { debugLog('[TeacherSchedulePage] join-click (tooltip) opening link:', { raw: link, normalized: openLink }); } catch(e){}
                      window.open(openLink, '_blank');
                    }}
                  >Vào phòng</button>
                </div>
                <div className="teacher-tooltip-actions" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button
                    className="teacher-icon-btn"
                    title={'Kết thúc phòng học'}
                    aria-label="Kết thúc phòng học"
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'opacity 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    onClick={() => openConfirm('end', hoveredEvent)}
                  >
                    <CircleDot size={16} color="#ef4444" />
                  </button>
                  <button 
                    className="teacher-icon-btn"
                    title="Chỉnh sửa"
                    onClick={() => { 
                      handleEditSchedule(hoveredEvent);
                      setHoveredEvent(null);
                      setTooltipStyle({ display: 'none' });
                    }} 
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'opacity 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Pencil size={16} color="#374151" />
                  </button>
                  <button 
                    className="teacher-icon-btn"
                    title="Xóa"
                    onClick={() => openConfirm('delete', hoveredEvent)} 
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'opacity 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Trash2 size={16} color="#374151" />
                  </button>
                  <button className="teacher-tooltip-action" title="Đóng" onClick={handleEventLeave} style={{background:'white',border:'none',cursor:'pointer',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',transition:'all 0.2s ease'}} onMouseEnter={(e) => e.target.style.background = '#f3f4f6'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                    <X size={14} strokeWidth="2" color="#6b7280" />
                  </button>
                </div>
              </div>
              <div className="teacher-tooltip-content" style={{marginLeft:'12px'}}>
                <div style={{fontWeight:'bold',fontSize:15,marginBottom:10,color:'#111827'}}>Lớp {hoveredEvent.className}</div>
                <div style={{display:'flex',alignItems:'center',marginBottom:8,gap:8}}>
                  <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block'}}></span>
                  <span style={{fontSize:13,color:'#374151'}}>Tên phòng: {hoveredEvent.room}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                  {(() => {
                    const roomIcon = getRoomIcon(hoveredEvent.type, hoveredEvent.room);
                    return (
                      <img src={roomIcon.src.replace('/24/', '/18/')} alt={roomIcon.alt} style={{marginRight:10}} />
                    );
                  })()}
                  <span style={{fontSize:13,color:'#374151'}}>Loại phòng: {hoveredEvent.type}</span>
                </div>
                {hoveredEvent.startTime && (
                  <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                    <div dangerouslySetInnerHTML={{ __html: getTimeIconNew().svg }} style={{marginRight:10}} />
                    <span style={{fontSize:13,color:'#374151'}}>Bắt đầu: {hoveredEvent.startTime}</span>
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                  <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew(getActualAttendanceStatus(hoveredEvent.dayKey)).svg }} style={{marginRight:10}} />
                  <span style={{fontSize:13,color:'#374151'}}>{getActualAttendanceStatus(hoveredEvent.dayKey)}</span>
                </div>

                {/* Hover Action buttons moved to header */}
              </div>
            </div>
          )}

          {selectedEvent && (
            <div 
              className="teacher-action-popup" 
              style={popupStyle}
              onMouseEnter={() => setIsEventHovered(true)}
              onMouseLeave={() => setIsEventHovered(false)}
            >
              <div className="teacher-popup-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                {(() => { try { debugLog('[TeacherSchedulePage] popup selectedEvent', { online_link: selectedEvent?.online_link, onlineLink: selectedEvent?.onlineLink, meeting_link: selectedEvent?.meeting_link, detected: getJoinLink(selectedEvent) }); } catch(e){} return null; })()}
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',flex:1,marginLeft:'12px'}}>
                  {false && (
                    <button className="teacher-main-action-btn teacher-join-room-btn" style={{background:'#1976d2',color:'#fff',fontWeight:700,padding:'10px 20px',borderRadius:6,border:'none',fontSize:14,cursor:'pointer',marginRight:12}}>Vào phòng</button>
                  )}
                  <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block',marginRight:10}}></span>
                  <span style={{fontSize:15,fontWeight:700,color:'#111827'}}>Lớp {selectedEvent.className}</span>
                </div>
                <div className="teacher-popup-actions" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button
                    className="teacher-main-action-btn teacher-join-room-btn"
                    title={'Vào phòng học'}
                    style={{
                      background:'#1976d2', color:'#fff', fontWeight:600, padding:'6px 12px', borderRadius:6, border:'none', fontSize:13, cursor:'pointer'
                    }}
                    onClick={() => {
                      try { debugLog('[TeacherSchedulePage] join-click (popup) raw event:', selectedEvent); } catch(e){}
                      const link = getJoinLink(selectedEvent);
                      if (!link) {
                        try { debugLog('[TeacherSchedulePage] join-click (popup) no link detected -> open edit modal'); } catch(e){}
                        handleEditSchedule(selectedEvent);
                        return;
                      }
                      const openLink = normalizeMeetingLink(link);
                      try { debugLog('[TeacherSchedulePage] join-click (popup) opening link:', { raw: link, normalized: openLink }); } catch(e){}
                      window.open(openLink, '_blank');
                    }}
                  >Vào phòng</button>
                  <button
                    className="teacher-icon-btn"
                    title={'Kết thúc phòng học'}
                    aria-label="Kết thúc phòng học"
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'opacity 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    onClick={() => openConfirm('end', selectedEvent)}
                  >
                    <CircleDot size={16} color="#ef4444" />
                  </button>
                  <button 
                    className="teacher-icon-btn"
                    title="Chỉnh sửa"
                    onClick={() => { handleEditSchedule(selectedEvent); handleClosePopup(); }}
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'opacity 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Pencil size={16} color="#374151" />
                  </button>
                  <button 
                    className="teacher-icon-btn"
                    title="Xóa"
                    onClick={() => openConfirm('delete', selectedEvent)}
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, transition:'opacity 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Trash2 size={16} color="#374151" />
                  </button>
                  <button className="teacher-popup-action" title="Đóng" onClick={handleClosePopup} style={{background:'white',border:'none',cursor:'pointer',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',transition:'all 0.2s ease'}} onMouseEnter={(e) => e.target.style.background = '#f3f4f6'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                    <X size={14} strokeWidth="2" color="#6b7280" />
                  </button>
                </div>
              </div>
              <div className="teacher-popup-content" style={{marginLeft:'12px'}}>
                <div style={{fontWeight:'bold',fontSize:15,marginBottom:10,color:'#111827'}}>Thông tin lớp</div>
                <div style={{display:'flex',alignItems:'center',marginBottom:8,gap:8}}>
                  <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block'}}></span>
                  <span style={{fontSize:13,color:'#374151'}}>Tên phòng: {selectedEvent.room}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                  {(() => {
                    const roomIcon = getRoomIcon(selectedEvent.type, selectedEvent.room);
                    return (
                      <img src={roomIcon.src.replace('/24/', '/18/')} alt={roomIcon.alt} style={{marginRight:10}} />
                    );
                  })()}
                  <span style={{fontSize:13,color:'#374151'}}>Loại phòng: {selectedEvent.type}</span>
                </div>
                {selectedEvent.startTime && (
                  <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                    <div dangerouslySetInnerHTML={{ __html: getTimeIconNew().svg }} style={{marginRight:10}} />
                    <span style={{fontSize:13,color:'#374151'}}>Bắt đầu: {selectedEvent.startTime}</span>
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                  <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew(getActualAttendanceStatus(selectedEvent.dayKey)).svg }} style={{marginRight:10}} />
                  <span style={{fontSize:13,color:'#374151'}}>{getActualAttendanceStatus(selectedEvent.dayKey)}</span>
                </div>
                
                {/* Action buttons moved to header */}
              </div>
            </div>
          )}

          {confirmModal.open && (
            <div
              className="teacher-confirm-overlay"
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
              onClick={closeConfirm}
            >
              <div
                className="teacher-confirm-modal"
                style={{ background:'#fff', borderRadius:12, width:'min(92vw, 420px)', boxShadow:'0 10px 30px rgba(0,0,0,0.2)', padding:20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
                  <div style={{fontWeight:700, fontSize:16, color:'#111827'}}>
                    {confirmModal.action === 'end' ? 'Kết thúc phòng học' : confirmModal.action === 'delete' ? 'Xóa lịch học' : 'Xác nhận'}
                  </div>
                  <button title="Đóng" onClick={closeConfirm} style={{background:'transparent', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <X size={18} color="#6b7280" />
                  </button>
                </div>
                <div style={{fontSize:14, color:'#374151', marginBottom:16}}>
                  {confirmModal.action === 'end' ? 'Bạn có chắc chắn muốn kết thúc phòng học này?' : 'Bạn có chắc chắn muốn xóa lịch học này?'}
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                  <button onClick={closeConfirm} style={{background:'#f3f4f6', color:'#111827', fontWeight:600, padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', cursor:'pointer'}}>Hủy</button>
                  <button onClick={handleConfirm} style={{background: confirmModal.action === 'delete' ? '#ef4444' : '#1976d2', color:'#fff', fontWeight:700, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer'}}>Xác nhận</button>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit Schedule Modal */}
          <CreateScheduleModal
            isOpen={isCreateModalOpen}
            onClose={handleCloseModal}
            onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
            classId={classInfo.id}
            schedule={editingSchedule}
            isEditing={!!editingSchedule}
          />
        </div>
      </div>
    </div>
  );
}