import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader';
import ClassSidebar from './ClassSidebar';
import '../../../styles/ClassSchedulePage.css';
import { 
  CalendarDays, 
  X,
  CircleDot
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '../../../utils/api';
import AuthStorage from '../../../utils/authStorage';

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

export default function StudentSchedulePage() {
  const navigate = useNavigate();
  const { classCode } = useParams();
  const [activeTab, setActiveTab] = useState('week');
  
  // State for real data
  const [classInfo, setClassInfo] = useState({
    name: 'Đang tải...',
    code: classCode || 'CLASS001',
    teacher: 'Đang tải...'
  });
  const [schedules, setSchedules] = useState([]);
  const [classOnlineLink, setClassOnlineLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const { weekRange, weekDays } = getWeekDates(currentDate);
  const { monthRange, monthDays } = getMonthDates(currentDate);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({ display: 'none' });
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  // Helper: deep-scan to find a valid meeting link anywhere in object
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

  // Helper: prefer schedule-level link; fallback to class-level default link
  const getJoinLink = (obj) => {
    const scheduleLink = getValidOnlineLink(obj);
    if (scheduleLink) return scheduleLink;
    if (classOnlineLink) {
      const fallback = getValidOnlineLink({ online_link: classOnlineLink });
      if (fallback) return fallback;
    }
    return '';
  };

  const getEventType = (obj) => {
    const link = getValidOnlineLink(obj);
    if (link.toLowerCase().includes('meet')) return 'Google Meet';
    if (link.toLowerCase().includes('zoom')) return 'Zoom';
    if (link.toLowerCase().includes('teams') || link.toLowerCase().includes('microsoft')) return 'Teams';
    if (link.toLowerCase().includes('skype')) return 'Skype';
    return 'Offline';
  };

  const [isEventHovered, setIsEventHovered] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupStyle, setPopupStyle] = useState({ display: 'none' });

  // Load class data and schedules
  useEffect(() => {
    const hydrateFromCache = () => {
      try {
        const cached = AuthStorage.getClassInfo();
        if (cached && cached.code) {
          setClassInfo({
            name: cached.name || 'Lớp học',
            code: cached.code,
            teacher: cached.teacher || 'Giáo viên'
          });
          return true;
        }
      } catch (_) {}
      return false;
    };

    const loadClassData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!classCode) {
          // No classCode in route: hydrate name/code from cache for header and stop
          const ok = hydrateFromCache();
          if (!ok) {
            setError('Không có thông tin lớp để hiển thị');
          }
          return;
        }
        
        // Get class info by code
        const classResponse = await api.classes.getByCode(classCode);
        console.log('Class response:', classResponse);
        
        if (classResponse && classResponse.class) {
          const info = {
            name: classResponse.class.name,
            code: classResponse.class.class_code,
            teacher: classResponse.class.teacher_name || 'Không xác định'
          };
          setClassInfo(info);
          setClassOnlineLink(classResponse.class.online_link || '');
          // Also persist basic info for other pages (like schedule outside of class route)
          try { AuthStorage.setClassInfo({ ...(AuthStorage.getClassInfo() || {}), ...info }); } catch (_) {}
          
          // Get schedules for this class
          const scheduleResponse = await api.schedules.getByClass(classResponse.class.id);
          console.log('Schedule response:', scheduleResponse);
          
          if (scheduleResponse && scheduleResponse.schedules) {
            setSchedules(scheduleResponse.schedules);
          } else {
            setSchedules([]);
          }
        } else {
          setError('Không tìm thấy lớp học');
        }
      } catch (err) {
        console.error('Error loading class data:', err);
        // Do not block header info if we can hydrate from cache
        const ok = hydrateFromCache();
        if (!ok) setError('Không thể tải dữ liệu lớp học');
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [classCode]);

  // Add refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!classCode) {
        // No route param: just refresh header from cache
        const cached = AuthStorage.getClassInfo();
        if (cached) setClassInfo({ name: cached.name || 'Lớp học', code: cached.code, teacher: cached.teacher || 'Giáo viên' });
        setLoading(false);
        return;
      }

      // Get class info by code
      const classResponse = await api.classes.getByCode(classCode);
      console.log('Refresh - Class response:', classResponse);
      
      if (classResponse.class) {
        setClassInfo({
          name: classResponse.class.name,
          code: classResponse.class.class_code,
          teacher: classResponse.class.teacher_name || 'Không xác định'
        });
        setClassOnlineLink(classResponse.class.online_link || '');
        
        // Get schedules for this class
        const scheduleResponse = await api.schedules.getByClass(classResponse.class.id);
        console.log('Refresh - Schedule response:', scheduleResponse);
        
        if (scheduleResponse.schedules) {
          setSchedules(scheduleResponse.schedules);
        } else {
          setSchedules([]);
        }
      } else {
        setError('Không tìm thấy lớp học');
      }
    } catch (err) {
      console.error('Error refreshing class data:', err);
      setError('Không thể tải dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };

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
      if (selectedEvent && !event.target.closest('.student-action-popup')) {
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
    
    console.log('getScheduleForDate called with date:', date);
    console.log('date.getDay():', date.getDay());
    console.log('dayOfWeek:', dayOfWeek);
    console.log('Available schedules:', schedules);
    console.log('Schedules with day_of_week:', schedules.map(s => s.day_of_week));
    
    // Filter schedules for this day
    const filteredSchedules = schedules.filter(schedule => schedule.day_of_week === dayOfWeek);
    console.log('Filtered schedules for', dayOfWeek, ':', filteredSchedules);
    
    return filteredSchedules;
  };

  const renderWeekView = () => (
    <div className="student-schedule-week-view">
      <div className="student-schedule-grid">
        {weekDays.map((day, index) => {
          const dayKey = day.date.replace(/\//g, '-');
          const daySchedule = getScheduleForDate(day.fullDate);
          return (
            <div className={`student-day-column ${day.isToday ? 'today' : ''}`} key={index}>
              <div className="student-day-header">
                <div className="student-day-title">
                  <div className="student-day-name">
                    {day.label}{day.isToday ? ' - Hôm nay' : ''}
                  </div>
                  <div className="student-day-date">{day.date}</div>
                </div>
              </div>

              <div className="student-day-divider"></div>

              <div className="student-events-list">
                {loading ? (
                  <div className="student-empty-schedule">
                    Đang tải lịch học...
                  </div>
                ) : daySchedule.length > 0 ? (
                  daySchedule.map((schedule, eventIndex) => {
                    console.log('Rendering student week schedule:', schedule);
                    const roomIcon = getRoomIcon(schedule.type, schedule.room);
                    const eventWithDayKey = { 
                      ...schedule, 
                      dayKey: dayKey,
                      className: schedule.class_name,
                      startTime: schedule.start_time
                    };
                    const attendanceStatus = getActualAttendanceStatus(dayKey);
                    const joinLink = getJoinLink(schedule);
                    const status = getStatusForSchedule(day.fullDate, schedule);
                    return (
                      <div 
                        className="student-event-card"
                        key={eventIndex}
                        onMouseEnter={(e) => { handleEventHover(eventWithDayKey, e); setIsEventHovered(true); }}
                        onMouseLeave={() => setIsEventHovered(false)}
                      >
                        <div className="student-event-card-header">
                          <span className="student-event-icon">
                            <img src={roomIcon.src} alt={roomIcon.alt} />
                          </span>
                          <span className={`student-event-status ${getStatusBadgeClass(status)}`}>{status}</span>
                        </div>
                        <div className="student-event-class">{schedule.class_name}</div>
                        <div className="student-event-room">{schedule.room}</div>
                        <div className="student-event-attendance">
                          <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew(attendanceStatus).svg }} style={{display:'inline-block', marginRight:8}} />
                          {attendanceStatus}
                        </div>
                        {/* Join button removed for student view */}
                      </div>
                    );
                  })
                ) : (
                  <div className="student-empty-schedule">
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

  const renderMonthView = () => (
    <div className="student-schedule-month-view">
      <div className="student-schedule-table-container">
        <table className="student-schedule-table">
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
              schedules.map((schedule, index) => {
                console.log('Rendering student month schedule:', schedule);
                const roomIcon = getRoomIconSmall(schedule.type, schedule.room);
                const eventWithDayKey = { 
                  ...schedule, 
                  dayKey: `${schedule.day_of_week}-${index}`,
                  className: schedule.class_name,
                  startTime: schedule.start_time
                };
                
                const status = getStatusForSchedule(new Date(), schedule);
                return (() => {
                  // Expand weekly schedule into all occurrences within the current month
                  const occurrences = [];
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
                  const target = dayMap[String(schedule.day_of_week || '').toLowerCase()];
                  if (target === undefined) return null;
                  let d = new Date(firstDay);
                  while (d.getDay() !== target) d.setDate(d.getDate() + 1);
                  for (let cur = new Date(d); cur <= lastDay; cur.setDate(cur.getDate() + 7)) {
                    occurrences.push(new Date(cur));
                  }
                  return occurrences.map((occurDate, occIdx) => {
                    const occStatus = getStatusForSchedule(occurDate, schedule);
                    return (
                      <tr key={`schedule-${index}-${occurDate.toISOString()}`} className="student-schedule-row">
                        <td className="student-class-name">{schedule.class_name}</td>
                        <td className="student-room-name">{schedule.room}</td>
                        <td className="student-room-type">
                          <div className="student-room-type-content">
                            <img src={roomIcon.src} alt={roomIcon.alt} />
                            <span>{schedule.type}</span>
                          </div>
                        </td>
                        <td className="student-start-time">
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <div dangerouslySetInnerHTML={{ __html: getTimeIconNew().svg }} />
                            <span>{schedule.day_of_week} lúc {schedule.start_time}</span>
                          </div>
                        </td>
                        <td className="student-status">
                          <span className={`student-status-badge ${getStatusBadgeClass(occStatus)}`}>
                            {occStatus}
                          </span>
                        </td>
                        <td className="student-attendance">
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew('Chưa điểm danh').svg }} />
                            <span>Chưa điểm danh</span>
                          </div>
                        </td>
                        <td className="student-actions">
                          <button className="student-action-menu-btn" onClick={(e) => handleActionMenuClick(eventWithDayKey, e)}>
                            <span>⋮</span>
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })();
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

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
    <div className="student-schedule-container" onClick={(e) => console.log('Container clicked:', e.target)}>
      <DashboardHeader />
      <div className="student-schedule-content">
        <ClassSidebar classInfo={classInfo} />
        <div className="student-schedule-main">
          <div className="student-schedule-toolbar">
            <div className="student-tab-group">
              <button
                className={`student-tab-button ${activeTab === 'week' ? 'active' : ''}`}
                onClick={() => setActiveTab('week')}
              >
                Tuần
              </button>
              <button
                className={`student-tab-button ${activeTab === 'month' ? 'active' : ''}`}
                onClick={() => setActiveTab('month')}
              >
                Tháng
              </button>
            </div>

            <div className="student-week-navigator">
              <button 
                className="student-nav-button" 
                onClick={activeTab === 'week' ? handlePrevWeek : handlePrevMonth}
              >
                <i className="student-arrow left">&lt;</i>
              </button>
              <span
                className="student-week-display"
                onClick={handleToday}
                title="Nhấn để về tuần hiện tại"
              >
                {activeTab === 'week' ? weekRange : monthRange}
              </span>
              <button 
                className="student-nav-button" 
                onClick={activeTab === 'week' ? handleNextWeek : handleNextMonth}
              >
                <i className="student-arrow right">&gt;</i>
              </button>
            </div>

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

          <main className="student-schedule-main-content">
            {activeTab === 'week' ? renderWeekView() : renderMonthView()}
          </main>

          {hoveredEvent && (isEventHovered || isTooltipHovered) && (
            <div 
              className="student-schedule-tooltip"
              style={tooltipStyle}
              onMouseEnter={() => setIsTooltipHovered(true)}
              onMouseLeave={() => setIsTooltipHovered(false)}
            >
              <div className="student-tooltip-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                {(() => { try { console.log('[ClassSchedulePage] tooltip hoveredEvent', { online_link: hoveredEvent?.online_link, onlineLink: hoveredEvent?.onlineLink, meeting_link: hoveredEvent?.meeting_link }); } catch(e){} return null; })()}
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',flex:1,marginLeft:'12px'}}>
                  {(() => !!getJoinLink(hoveredEvent))() && (
                    <button className="student-main-action-btn student-join-room-btn" style={{background:'#1976d2',color:'#fff',fontWeight:700,padding:'10px 20px',borderRadius:6,border:'none',fontSize:14,cursor:'pointer'}} onClick={() => {
                      let link = getJoinLink(hoveredEvent);
                      if (!/^https?:\/\//i.test(link)) {
                        link = `https://${link}`;
                      }
                      window.open(link, '_blank');
                    }}>Vào phòng</button>
                  )}
                </div>
                <div className="student-tooltip-actions" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button className="student-tooltip-action" title="Đóng" onClick={handleEventLeave} style={{background:'white',border:'none',cursor:'pointer',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',transition:'all 0.2s ease'}} onMouseEnter={(e) => e.target.style.background = '#f3f4f6'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                    <X size={14} strokeWidth="2" color="#6b7280" />
                  </button>
                </div>
              </div>
              <div className="student-tooltip-content" style={{marginLeft:'12px'}}>
                <div style={{fontWeight:'bold',fontSize:15,marginBottom:10,color:'#111827'}}>Lớp {hoveredEvent.className}</div>
                <div style={{display:'flex',alignItems:'center',marginBottom:8,gap:8}}>
                  <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block'}}></span>
                  <span style={{fontSize:13,color:'#374151'}}>Tên phòng: {hoveredEvent.room}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                  {(() => {
                    const roomIcon = getRoomIcon(getEventType(hoveredEvent), hoveredEvent.room);
                    return (
                      <img src={roomIcon.src.replace('/24/', '/18/')} alt={roomIcon.alt} style={{marginRight:10}} />
                    );
                  })()}
                  <span style={{fontSize:13,color:'#374151'}}>Loại phòng: {getEventType(hoveredEvent)}</span>
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
              </div>
            </div>
          )}

          {selectedEvent && (
            <div 
              className="student-action-popup" 
              style={popupStyle}
              onMouseEnter={() => setIsEventHovered(true)}
              onMouseLeave={() => setIsEventHovered(false)}
            >
              <div className="student-popup-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                {(() => { try { console.log('[ClassSchedulePage] popup selectedEvent', { online_link: selectedEvent?.online_link, onlineLink: selectedEvent?.onlineLink, meeting_link: selectedEvent?.meeting_link }); } catch(e){} return null; })()}
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',flex:1,marginLeft:'12px'}}>
                  {(() => !!getValidOnlineLink(selectedEvent))() && (
                    <button className="student-main-action-btn student-join-room-btn" style={{background:'#1976d2',color:'#fff',fontWeight:700,padding:'10px 20px',borderRadius:6,border:'none',fontSize:14,cursor:'pointer',marginRight:12}} onClick={() => {
                      let link = getValidOnlineLink(selectedEvent);
                      if (!/^https?:\/\//i.test(link)) {
                        link = `https://${link}`;
                      }
                      window.open(link, '_blank');
                    }}>Vào phòng</button>
                  )}
                  <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block',marginRight:10}}></span>
                  <span style={{fontSize:15,fontWeight:700,color:'#111827'}}>Lớp {selectedEvent.className}</span>
                </div>
                <div className="student-popup-actions" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button className="student-popup-action" title="Đóng" onClick={handleClosePopup} style={{background:'white',border:'none',cursor:'pointer',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',transition:'all 0.2s ease'}} onMouseEnter={(e) => e.target.style.background = '#f3f4f6'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                    <X size={14} strokeWidth="2" color="#6b7280" />
                  </button>
                </div>
              </div>
              <div className="student-popup-content" style={{marginLeft:'12px'}}>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
