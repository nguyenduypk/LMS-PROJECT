import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import './CommentSection.css';

function CommentSection({ classId, announcementId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // Load comments
  const loadComments = async () => {
    if (!classId || !announcementId) return;
    
    try {
      setLoading(true);
      const response = await api.classes.getComments(classId, announcementId);
      if (response.comments) {
        setComments(response.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.classes.createComment(classId, announcementId, newComment.trim());
      
      if (response.comment) {
        setComments(prev => [...prev, response.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Có lỗi xảy ra khi tạo bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      const response = await api.classes.deleteComment(classId, announcementId, commentId);
      if (response.message) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Có lỗi xảy ra khi xóa bình luận');
    }
  };

  // Check if user can delete comment
  const canDeleteComment = (comment) => {
    if (!currentUser) return false;
    return currentUser.id === comment.user_id || currentUser.role === 'teacher';
  };

  useEffect(() => {
    loadComments();
  }, [classId, announcementId]);

  return (
    <div className="comment-section">
      <h3 className="comment-section__title">
        Bình luận ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận của bạn..."
          className="comment-form__textarea"
          disabled={submitting}
        />
        <button 
          type="submit" 
          className="comment-form__submit"
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
        </button>
      </form>

      {/* Comments list */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">Đang tải bình luận...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <span className="comment-author__name">{comment.user_name}</span>
                  <span className={`comment-author__role comment-author__role--${comment.user_role}`}>
                    {comment.user_role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                  </span>
                </div>
                <div className="comment-meta">
                  <span className="comment-time">{formatTime(comment.created_at)}</span>
                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="comment-delete"
                      title="Xóa bình luận"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="comment-content">
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentSection; 