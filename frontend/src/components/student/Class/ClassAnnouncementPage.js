import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader';
import ClassSidebar from './ClassSidebar';
import CommentSection from '../../common/CommentSection';
import '../../../styles/ClassAnnouncementPage.css';
import { api } from '../../../utils/api';

function ClassAnnouncementPage({ classInfo }) {
  const { classCode } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Hàm format thời gian
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Vừa xong';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return time.toLocaleDateString('vi-VN');
  };

  // Fetch announcements and user info
  useEffect(() => {
    const fetchData = async () => {
      if (!classInfo || !classInfo.id) return;
      
      try {
        setLoading(true);
        const response = await api.classes.getAnnouncements(classInfo.id);
        if (response.announcements) {
          setAnnouncements(response.announcements);
        }

        // Get current user info
        const userData = await api.auth.getCurrentUser();
        if (userData.user) {
          setCurrentUser(userData.user);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classInfo]);

  return (
    <div className="class-announcement-page">
      <DashboardHeader />
      <div className="class-announcement-page__header">
        <h1 className="class-announcement-page__title">Bảng tin</h1>
      </div>

      <div className="class-announcement-page__content" style={{ paddingTop: 88, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ClassSidebar classInfo={classInfo} />
        {/* Danh sách thông báo */}
        <div className="announcement-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Đang tải thông báo...
            </div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Chưa có thông báo nào.</p>
            </div>
          ) : (
            announcements.map(a => (
              <div className="announcement-card" key={a.id}>
                <div className="announcement-header">
                  <div className="announcement-avatar" />
                  <div>
                    <div className="announcement-name">{a.teacher_name}</div>
                    <div className="announcement-time">{formatTime(a.created_at)}</div>
                  </div>
                </div>
                <div className="announcement-content">{a.content}</div>
                <CommentSection 
                  classId={classInfo.id} 
                  announcementId={a.id} 
                  currentUser={currentUser}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassAnnouncementPage; 