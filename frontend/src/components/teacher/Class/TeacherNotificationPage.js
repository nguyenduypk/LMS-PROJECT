import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../utils/api';
import Header from '../Header';
import TeacherSidebar from './TeacherSidebar';
import CommentSection from '../../common/CommentSection';
import './TeacherNotificationPage.css';

function TeacherNotificationPage() {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMenu, setShowMenu] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  // Fetch class information and announcements
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 TeacherNotificationPage: Fetching class info for classId:', classId);
        
        const data = await api.classes.getById(classId);
        console.log('🔍 TeacherNotificationPage: API response data:', data);
        
        if (data.class) {
          const transformedClassInfo = {
            id: data.class.id,
            name: data.class.name,
            code: data.class.class_code,
            teacher: data.class.teacher_name || 'Giáo viên',
            image: 'https://i.imgur.com/0y8Ftya.jpg',
            students: data.class.student_count || 0,
            lectures: 0,
            homeworks: data.class.assignment_count || 0,
            materials: data.class.material_count || 0,
          };
          setClassInfo(transformedClassInfo);
          
          // Fetch announcements
          const announcementsData = await api.classes.getAnnouncements(classId);
          if (announcementsData.announcements) {
            setAnnouncements(announcementsData.announcements);
          }
        } else {
          throw new Error('Invalid response format');
        }

        // Get current user info
        const userData = await api.auth.getCurrentUser();
        if (userData.user) {
          setCurrentUser(userData.user);
        }
      } catch (error) {
        console.error('🔍 TeacherNotificationPage: Error fetching data:', error);
        setClassInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [classId]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    try {
      const response = await api.classes.createAnnouncement(classId, input.trim());
      if (response.announcement) {
        // Reload announcements
        const announcementsData = await api.classes.getAnnouncements(classId);
        if (announcementsData.announcements) {
          setAnnouncements(announcementsData.announcements);
        }
        setInput('');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Có lỗi xảy ra khi tạo thông báo');
    }
  };

  const handleEdit = (id) => {
    const announcement = announcements.find(a => a.id === id);
    setEditingId(id);
    setEditContent(announcement.content);
    setShowMenu(null);
  };

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await api.classes.updateAnnouncement(classId, id, editContent.trim());
      if (response.message) {
        // Reload announcements
        const announcementsData = await api.classes.getAnnouncements(classId);
        if (announcementsData.announcements) {
          setAnnouncements(announcementsData.announcements);
        }
        setEditingId(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Có lỗi xảy ra khi cập nhật thông báo');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.classes.deleteAnnouncement(classId, id);
      if (response.message) {
        // Reload announcements
        const announcementsData = await api.classes.getAnnouncements(classId);
        if (announcementsData.announcements) {
          setAnnouncements(announcementsData.announcements);
        }
        setShowMenu(null);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Có lỗi xảy ra khi xóa thông báo');
    }
  };

  const toggleMenu = (id) => {
    setShowMenu(showMenu === id ? null : id);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải thông tin lớp học...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>Lỗi tải thông tin lớp học</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Vui lòng kiểm tra lại kết nối hoặc thử lại sau</div>
      </div>
    );
  }

  return (
    <div className="teacher-notify-page">
      <Header />
      <div className="teacher-notify-content">
        <TeacherSidebar classInfo={classInfo} />
        <div className="teacher-notify-header">
          <h1 className="teacher-notify-title">Bảng tin</h1>
        </div>
        <div className="teacher-notify-list">
          <form className="teacher-notify-form" onSubmit={handlePost}>
            <div className="teacher-notify-input-container">
              <div className="teacher-notify-avatar">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                </svg>
              </div>
              <div className="teacher-notify-textarea-container">
                <textarea
                  className="teacher-notify-textarea"
                  placeholder="Nhập nội dung thảo luận với lớp học..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                />
              </div>
            </div>
            <div className="teacher-notify-actions">
              <button
                type="submit"
                className={`teacher-notify-post-btn ${!input.trim() ? 'disabled' : ''}`}
                disabled={!input.trim()}
              >
                Đăng tin
              </button>
            </div>
          </form>
          {announcements.map(a => (
            <div className="teacher-notify-card" key={a.id}>
              <div className="teacher-notify-card-header">
                <div className="teacher-notify-card-user-info">
                  <div className="teacher-notify-card-avatar">
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                    </svg>
                  </div>
                  <div className="teacher-notify-card-user-details">
                    <p className="teacher-notify-card-name">{a.teacher_name}</p>
                    <span className="teacher-notify-card-time">{formatTime(a.created_at)}</span>
                  </div>
                </div>
                <div className="teacher-notify-card-more-container">
                  <svg 
                    className="teacher-notify-card-more" 
                    viewBox="0 0 24 24" 
                    focusable="false" 
                    aria-hidden="true"
                    onClick={() => toggleMenu(a.id)}
                  >
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                  </svg>
                  {showMenu === a.id && (
                    <div className="teacher-notify-card-menu">
                      <button onClick={() => handleEdit(a.id)}>Chỉnh sửa</button>
                      <button onClick={() => handleDelete(a.id)}>Xóa</button>
                    </div>
                  )}
                </div>
              </div>
              {editingId === a.id ? (
                <div className="teacher-notify-card-edit">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="teacher-notify-card-edit-textarea"
                  />
                  <div className="teacher-notify-card-edit-actions">
                    <button onClick={() => handleSaveEdit(a.id)}>Lưu</button>
                    <button onClick={handleCancelEdit}>Hủy</button>
                  </div>
                </div>
              ) : (
                <p className="teacher-notify-card-content">{a.content}</p>
              )}
              <CommentSection 
                classId={classId} 
                announcementId={a.id} 
                currentUser={currentUser}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeacherNotificationPage; 