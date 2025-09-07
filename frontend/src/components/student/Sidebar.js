import React from 'react';
import '../../styles/StudentDashboard.css';

function Sidebar({ 
  activeSection = 'today-class', 
  onSectionChange, 
  todayClassCount = 1, 
  homeworkCount = 1, 
  unreadDocs = 1, 
  unseenLectures = 0 
}) {
  const menuItems = [
    {
      id: 'today-class',
      label: 'Phòng học hôm nay',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      count: todayClassCount,
      showBadge: todayClassCount > 0
    },
    {
      id: 'homework',
      label: 'Bài tập chưa làm',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      count: homeworkCount,
      showBadge: homeworkCount > 0
    },
    {
      id: 'documents',
      label: 'Tài liệu chưa đọc',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      count: unreadDocs,
      showBadge: unreadDocs > 0
    },
    {
      id: 'lectures',
      label: 'Bài giảng chưa xem',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      count: unseenLectures,
      showBadge: unseenLectures > 0
    },
    {
      id: 'achievements',
      label: 'Thành tích',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      count: 0,
      showBadge: false
    }
  ];

  return (
    <aside className="sd-sidebar">
      <ul className="sd-sidebar-menu">
        {menuItems.map((item) => (
          <li 
            key={item.id}
            className={`sd-sidebar-item ${activeSection === item.id ? 'sd-sidebar-item-active' : ''}`}
            onClick={() => onSectionChange && onSectionChange(item.id)}
          >
            <div className="sd-sidebar-icon">
              {item.icon}
            </div>
            <span>{item.label}</span>
            {item.showBadge && (
              <span className="sd-sidebar-badge">{item.count}</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;