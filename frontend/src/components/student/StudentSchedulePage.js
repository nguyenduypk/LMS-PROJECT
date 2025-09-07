import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import '../../styles/ClassSchedulePage.css';
import { 
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '../../utils/api';

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

// Removed mock data - using API data instead

// Helpers for real-time status and monthly occurrences
const toTimeOnDate = (dayDate, timeStr) => {
  if (!timeStr) return new Date(dayDate);
  const [h, m] = String(timeStr).split(':').map(v => parseInt(v, 10));
  const d = new Date(dayDate);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const getStatusForSchedule = (dayDate, schedule) => {
  const now = new Date();
  const day = new Date(dayDate);
  day.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
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
    case 'Đang diễn ra': return 'dang-dien-ra';
    case 'Đã kết thúc': return 'da-ket-thuc';
    default: return 'chua-bat-dau';
  }
};

const weekdayIndexMap = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
};

const getOccurrencesInMonth = (baseDate, dayOfWeekStr) => {
  if (!dayOfWeekStr) return [];
  const target = weekdayIndexMap[String(dayOfWeekStr).toLowerCase()];
  if (target === undefined) return [];
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const d = new Date(start);
  while (d.getDay() !== target) d.setDate(d.getDate() + 1);
  const arr = [];
  for (; d <= end; d.setDate(d.getDate() + 7)) arr.push(new Date(d));
  return arr;
};


export default function StudentSchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('week');
  
  // State for schedules
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const { weekRange, weekDays } = getWeekDates(currentDate);
  const { monthRange, monthDays } = getMonthDates(currentDate);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({ display: 'none' });
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
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

  // Helper: deep-scan object to find a valid meeting link anywhere (priority by likely key names)
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
      // bare domain mention (rare)
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
      // Priority: keys suggesting link/url first
      const keys = Object.keys(node);
      const priorityKeys = keys.filter(k => /(link|url|meet|zoom|teams|webex|skype|room|join|invite|meeting)/i.test(k));
      for (const key of priorityKeys) {
        const v = node[key];
        if (typeof v === 'string') {
          if (isValid(v)) return v.trim();
          const ext = extractFromString(v);
          if (ext) return ext;
        }
      }
      // Fallback generic deep scan
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

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Load student schedules
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading student schedules...');
        console.log('Current user token:', sessionStorage.getItem('token'));
        
        const response = await api.schedules.getStudentSchedule();
        console.log('Student schedules response:', response);
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
        console.error('Error loading schedules:', err);
        setError('Không thể tải lịch học');
        setSchedules([]);
      } finally {
        setLoading(false);
        console.log('Loading finished. Final schedules state:', schedules);
      }
    };

    loadSchedules();
  }, []);

  // Add refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing student schedules...');
      
      const response = await api.schedules.getStudentSchedule();
      console.log('Refresh response:', response);
      
      if (response.schedules) {
        setSchedules(response.schedules);
        console.log('Schedules refreshed:', response.schedules);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('Error refreshing schedules:', err);
      setError('Không thể tải lịch học');
    } finally {
      setLoading(false);
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

  const handleEventHover = (event, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 400; // smaller tooltip width
    const overlap = 12; // overlap tooltip over card
    let left, top;
    // Tooltip overlaps the card by 12px
    left = rect.right - overlap;
    // If overflow right, shift left
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }
    // If overflow left, shift right
    if (left < 8) {
      left = 8;
    }
    top = rect.top;
    // Debug: verify online link presence on hovered event
    try { console.log('[StudentSchedulePage] hover event:', { online_link: event?.online_link, onlineLink: event?.onlineLink, meeting_link: event?.meeting_link }); } catch {}
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
    
    // Position popup to the right of the button
    left = rect.right + 8;
    // If overflow right, position to the left
    if (left + popupWidth > window.innerWidth - 8) {
      left = rect.left - popupWidth - 8;
    }
    // If overflow left, position to the right
    if (left < 8) {
      left = 8;
    }
    
    top = rect.top;
    // If overflow bottom, position above
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

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedEvent && !event.target.closest('.action-popup')) {
        handleClosePopup();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedEvent]);



  const renderWeekView = () => (
    <div className="student-schedule-week-view">
      <div className="student-schedule-grid">
        {weekDays.map((day, index) => {
          const daySchedule = getScheduleForDate(day.fullDate);
          console.log('Day:', day.label, 'Date:', day.fullDate, 'Schedule count:', daySchedule.length);
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
                {daySchedule.length > 0 ? (
                  daySchedule.map((schedule, eventIndex) => {
                    console.log('Rendering student schedule:', schedule);
                    const derivedType = (schedule.online_link || schedule.type === 'online') ? 'online' : schedule.type;
                    const roomIcon = getRoomIcon(derivedType, schedule.room);
                    const status = getStatusForSchedule(day.fullDate, schedule);
                    const eventWithDayKey = { 
                      ...schedule, 
                      dayKey: day.date.replace(/\//g, '-'),
                      className: schedule.class_name,
                      startTime: schedule.start_time
                    };
                    const attendanceStatus = getActualAttendanceStatus(day.date.replace(/\//g, '-'));
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
                          <span className={`student-status-badge ${getStatusBadgeClass(status)}`}>{status}</span>
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
            {schedules.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '50px', color: '#666'}}>
                  Không có lịch học nào
                </td>
              </tr>
            ) : (
              // Expand each weekly schedule into all occurrences within the current month
              schedules.flatMap((schedule, index) => {
                console.log('Rendering student month schedule:', schedule);
                const derivedType = (schedule.online_link || schedule.type === 'online') ? 'online' : schedule.type;
                const roomIcon = getRoomIconSmall(derivedType, schedule.room);
                const occurDates = getOccurrencesInMonth(currentDate, schedule.day_of_week);
                return occurDates.map((occDate) => {
                  const status = getStatusForSchedule(occDate, schedule);
                  const occDayName = format(occDate, 'EEEE', { locale: vi });
                  const key = `${index}-${occDate.toISOString()}`;
                  const eventWithDayKey = {
                    ...schedule,
                    dayKey: `${schedule.day_of_week}-${occDate.getDate()}`,
                    className: schedule.class_name,
                    startTime: schedule.start_time
                  };
                  return (
                    <tr key={key} className="student-schedule-row">
                      <td className="student-class-name">{schedule.class_name}</td>
                      <td className="student-room-name">{schedule.room}</td>
                      <td className="student-room-type">
                        <div className="student-room-type-content">
                          <img src={roomIcon.src} alt={roomIcon.alt} />
                          <span>{derivedType}</span>
                        </div>
                      </td>
                      <td className="student-start-time">
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <div dangerouslySetInnerHTML={{ __html: getTimeIconNew().svg }} />
                          <span>{occDayName} {schedule.start_time}</span>
                        </div>
                      </td>
                      <td className="student-status">
                        <span className={`student-status-badge ${getStatusBadgeClass(status)}`}>{status}</span>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const getEventStatus = (event) => {
    // Logic to determine event status based on current time and event time
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
    // Logic to determine attendance status
    const status = getEventStatus(event);
    if (status === 'Đã kết thúc') return 'Đã điểm danh';
    if (status === 'Đang diễn ra') return 'Chưa điểm danh';
    return 'Chưa điểm danh';
  };

  // Override status and attendance for specific events to match image
  const getEventStatusOverride = (dayKey, eventIndex) => {
    const statusMap = {
      '14-7': 'Đang diễn ra',
      '15-7': 'Đang diễn ra', 
      '16-7': 'Đã kết thúc',
      '17-7': 'Đang diễn ra',
      '18-7': 'Đang diễn ra',
      '19-7': 'Chưa bắt đầu',
      '20-7': 'Chưa bắt đầu'
    };
    return statusMap[dayKey] || 'Chưa bắt đầu';
  };

  const getAttendanceStatusOverride = (dayKey, eventIndex) => {
    const attendanceMap = {
      '14-7': 'Chưa điểm danh',
      '15-7': 'Đã điểm danh',
      '16-7': 'Đã điểm danh', 
      '17-7': 'Chưa điểm danh',
      '18-7': 'Chưa điểm danh',
      '19-7': 'Chưa điểm danh',
      '20-7': 'Chưa điểm danh'
    };
    return attendanceMap[dayKey] || 'Chưa điểm danh';
  };

  const getActualAttendanceStatus = (dayKey) => {
    const attendanceMap = {
      '14-7': 'Chưa điểm danh',
      '15-7': 'Đã điểm danh',
      '16-7': 'Đã điểm danh', 
      '17-7': 'Chưa điểm danh',
      '18-7': 'Chưa điểm danh',
      '19-7': 'Chưa điểm danh',
      '20-7': 'Chưa điểm danh'
    };
    return attendanceMap[dayKey] || 'Chưa điểm danh';
  };

  const getRoomIcon = (roomType, roomName) => {
    // Check for specific room types based on name and type
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
    
    // For all offline rooms, use the same classroom icon
    return {
      src: "https://img.icons8.com/color/24/000000/classroom.png",
      alt: "Offline"
    };
  };

  const getRoomIconSmall = (roomType, roomName) => {
    const icon = getRoomIcon(roomType, roomName);
    return {
      ...icon,
      src: icon.src.replace('/24/', '/16/') // Use smaller version
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

  const renderHoveredTooltip = (event) => {
    const derivedType = (event.online_link || event.type === 'online') ? 'online' : event.type;
    const roomIcon = getRoomIcon(derivedType, event.room);
    return (
      <div 
        className="student-schedule-tooltip"
        style={tooltipStyle}
        onMouseEnter={() => setIsTooltipHovered(true)}
        onMouseLeave={() => setIsTooltipHovered(false)}
      >
        <div className="tooltip-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',flex:1,marginLeft:'12px'}}>
            <button className="main-action-btn join-room-btn" style={{background:'#1976d2',color:'#fff',fontWeight:600,padding:'6px 12px',borderRadius:6,border:'none',fontSize:13,cursor:'pointer'}} onClick={() => {
              const link = getJoinLink(event);
              if (!link) { try { window?.alert?.('Chưa có link họp'); } catch(_) {}; return; }
              const openLink = normalizeMeetingLink(link);
              window.open(openLink, '_blank');
            }}>Vào phòng</button>
          </div>
          <div className="tooltip-actions" style={{display:'flex',alignItems:'center',gap:8}}>
            <button className="tooltip-action" title="Đóng" onClick={handleEventLeave} style={{background:'white',border:'none',cursor:'pointer',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',transition:'all 0.2s ease'}} onMouseEnter={(e) => e.target.style.background = '#f3f4f6'} onMouseLeave={(e) => e.target.style.background = 'white'}>
              <X size={14} strokeWidth="2" color="#6b7280" />
            </button>
          </div>
        </div>
        <div className="tooltip-content" style={{marginLeft:'12px'}}>
          <div style={{fontWeight:'bold',fontSize:15,marginBottom:10,color:'#111827'}}>Lớp {event.className}</div>
          <div style={{display:'flex',alignItems:'center',marginBottom:8,gap:8}}>
            <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block'}}></span>
            <span style={{fontSize:13,color:'#374151'}}>Tên phòng: {event.room}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
            <img src={roomIcon.src.replace('/24/', '/18/')} alt={roomIcon.alt} style={{marginRight:10}} />
            <span style={{fontSize:13,color:'#374151'}}>Loại phòng: {derivedType}</span>
          </div>
          {event.startTime && (
            <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
              <div dangerouslySetInnerHTML={{ __html: getTimeIconNew().svg }} style={{marginRight:10}} />
              <span style={{fontSize:13,color:'#374151'}}>Bắt đầu: {event.startTime}</span>
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
            <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew(getActualAttendanceStatus(event.dayKey)).svg }} style={{marginRight:10}} />
            <span style={{fontSize:13,color:'#374151'}}>{getActualAttendanceStatus(event.dayKey)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSelectedPopup = (event) => {
    const derivedType = (event.online_link || event.type === 'online') ? 'online' : event.type;
    const roomIcon = getRoomIcon(derivedType, event.room);
    return (
      <div 
        className="student-action-popup" 
        style={popupStyle}
        onMouseEnter={() => setIsEventHovered(true)}
        onMouseLeave={() => setIsEventHovered(false)}
      >
        <div className="popup-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',flex:1,marginLeft:'12px'}}>
            <button className="main-action-btn join-room-btn" style={{background:'#1976d2',color:'#fff',fontWeight:600,padding:'6px 12px',borderRadius:6,border:'none',fontSize:13,cursor:'pointer',marginRight:12}} onClick={() => {
              const link = getJoinLink(event);
              if (!link) { try { window?.alert?.('Chưa có link họp'); } catch(_) {}; return; }
              const openLink = normalizeMeetingLink(link);
              window.open(openLink, '_blank');
            }}>Vào phòng</button>
            <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block',marginRight:10}}></span>
            <span style={{fontSize:15,fontWeight:700,color:'#111827'}}>Lớp {event.className}</span>
          </div>
          <div className="popup-actions" style={{display:'flex',alignItems:'center',gap:8}}>
            <button className="popup-action" title="Đóng" onClick={handleClosePopup} style={{background:'white',border:'none',cursor:'pointer',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',transition:'all 0.2s ease'}} onMouseEnter={(e) => e.target.style.background = '#f3f4f6'} onMouseLeave={(e) => e.target.style.background = 'white'}>
              <X size={14} strokeWidth="2" color="#6b7280" />
            </button>
          </div>
        </div>
        <div className="popup-content" style={{marginLeft:'12px'}}>
          <div style={{fontWeight:'bold',fontSize:15,marginBottom:10,color:'#111827'}}>Thông tin lớp</div>
          <div style={{display:'flex',alignItems:'center',marginBottom:8,gap:8}}>
            <span style={{width:14,height:14,background:'#1976d2',borderRadius:2,display:'inline-block'}}></span>
            <span style={{fontSize:13,color:'#374151'}}>Tên phòng: {event.room}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
            <img src={roomIcon.src.replace('/24/', '/18/')} alt={roomIcon.alt} style={{marginRight:10}} />
            <span style={{fontSize:13,color:'#374151'}}>Loại phòng: {derivedType}</span>
          </div>
          {event.startTime && (
            <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
              <div dangerouslySetInnerHTML={{ __html: getTimeIconNew().svg }} style={{marginRight:10}} />
              <span style={{fontSize:13,color:'#374151'}}>Bắt đầu: {event.startTime}</span>
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
            <div dangerouslySetInnerHTML={{ __html: getAttendanceIconNew(getActualAttendanceStatus(event.dayKey)).svg }} style={{marginRight:10}} />
            <span style={{fontSize:13,color:'#374151'}}>{getActualAttendanceStatus(event.dayKey)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="student-schedule-container" onClick={(e) => console.log('Container clicked:', e.target)}>
      <DashboardHeader />
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
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

      {hoveredEvent && (isEventHovered || isTooltipHovered) && renderHoveredTooltip(hoveredEvent)}
      {selectedEvent && renderSelectedPopup(selectedEvent)}
    </div>
  );
}