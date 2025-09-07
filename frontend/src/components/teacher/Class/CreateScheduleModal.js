import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, BookOpen, FileText, Monitor } from 'lucide-react';
import './CreateScheduleModal.css';

const CreateScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  classId, 
  schedule = null, 
  isEditing = false 
}) => {
  console.log('CreateScheduleModal props:', { isOpen, classId, isEditing });
  const toHHMM = (t) => {
    if (!t) return '';
    // Accept formats like HH:MM or HH:MM:SS, return HH:MM
    const m = String(t).match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
    if (m) return `${m[1]}:${m[2]}`;
    try {
      // Fallback: new Date parsing (rare)
      const d = new Date(`2000-01-01T${t}`);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return t;
    }
  };
  const [formData, setFormData] = useState({
    class_id: classId,
    day_of_week: 'monday',
    start_time: '08:00',
    end_time: '09:00',
    room: '',
    subject: '',
    description: '',
    type: 'offline',
    online_link: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schedule && isEditing) {
      setFormData({
        class_id: classId,
        day_of_week: schedule.day_of_week,
        start_time: toHHMM(schedule.start_time),
        end_time: toHHMM(schedule.end_time),
        room: schedule.room || '',
        subject: schedule.subject || '',
        description: schedule.description || '',
        type: (schedule.type && schedule.type !== 'offline') ? 'online' : 'offline',
        online_link: schedule.online_link || ''
      });
    } else {
      setFormData({
        class_id: classId,
        day_of_week: 'monday',
        start_time: '08:00',
        end_time: '09:00',
        room: '',
        subject: '',
        description: '',
        type: 'offline',
        online_link: ''
      });
    }

    setErrors({});
  }, [schedule, isEditing, classId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.start_time) {
      newErrors.start_time = 'Thời gian bắt đầu là bắt buộc';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'Thời gian kết thúc là bắt buộc';
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      
      if (start >= end) {
        newErrors.end_time = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }

    // Validate by type
    if (formData.type === 'offline') {
      if (!formData.room.trim()) {
        newErrors.room = 'Phòng học là bắt buộc';
      }
    }

    if (formData.type === 'online') {
      if (!formData.online_link.trim()) {
        newErrors.online_link = 'Link phòng học trực tuyến là bắt buộc';
      } else {
        try {
          // basic URL validation
          // allow without protocol by prepending https:// for test
          const url = formData.online_link.match(/^https?:\/\//i) ? formData.online_link : `https://${formData.online_link}`;
          // eslint-disable-next-line no-new
          new URL(url);
        } catch (e) {
          newErrors.online_link = 'Link không hợp lệ (vd: https://meet.google.com/xxx)';
        }
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Môn học là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Đảm bảo luôn truyền đúng class_id từ prop
      const data = {
        ...formData,
        class_id: classId,
        start_time: toHHMM(formData.start_time),
        end_time: toHHMM(formData.end_time),
      };
      console.log('Data gửi lên:', data);
      console.log('classId prop:', classId);
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  console.log('Modal render check - isOpen:', isOpen);
  if (!isOpen) return null;

  return (
    <div className="create-schedule-modal-overlay">
      <div className="create-schedule-modal">
        <div className="create-schedule-modal-header">
          <h2>
            {isEditing ? 'Chỉnh sửa lịch học' : 'Tạo lịch học mới'}
          </h2>
          <button 
            className="create-schedule-modal-close" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-schedule-modal-form">
          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} />
              Ngày trong tuần
            </label>
            <select
              name="day_of_week"
              value={formData.day_of_week}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="monday">Thứ 2</option>
              <option value="tuesday">Thứ 3</option>
              <option value="wednesday">Thứ 4</option>
              <option value="thursday">Thứ 5</option>
              <option value="friday">Thứ 6</option>
              <option value="saturday">Thứ 7</option>
              <option value="sunday">Chủ nhật</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                Thời gian bắt đầu
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className={`form-input ${errors.start_time ? 'error' : ''}`}
              />
              {errors.start_time && (
                <span className="error-message">{errors.start_time}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                Thời gian kết thúc
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className={`form-input ${errors.end_time ? 'error' : ''}`}
              />
              {errors.end_time && (
                <span className="error-message">{errors.end_time}</span>
              )}
            </div>
          </div>

          {formData.type === 'offline' && (
            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Phòng học (trực tiếp)
              </label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                placeholder="VD: Phòng 101, Lab CNTT"
                className={`form-input ${errors.room ? 'error' : ''}`}
              />
              {errors.room && (
                <span className="error-message">{errors.room}</span>
              )}
            </div>
          )}

          {formData.type === 'online' && (
            <div className="form-group">
              <label className="form-label">
                <Monitor size={16} />
                Link phòng học trực tuyến
              </label>
              <input
                type="url"
                name="online_link"
                value={formData.online_link}
                onChange={handleInputChange}
                placeholder="VD: https://meet.google.com/abc-defg-hij"
                className={`form-input ${errors.online_link ? 'error' : ''}`}
              />
              {errors.online_link && (
                <span className="error-message">{errors.online_link}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <BookOpen size={16} />
              Môn học
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="VD: Toán học, Vật lý"
              className={`form-input ${errors.subject ? 'error' : ''}`}
            />
            {errors.subject && (
              <span className="error-message">{errors.subject}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              Mô tả (tùy chọn)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả chi tiết về buổi học..."
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Monitor size={16} />
              Hình thức học
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="offline">Trực tiếp</option>
              <option value="online">Trực tuyến</option>
            </select>
          </div>

          <div className="create-schedule-modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo lịch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateScheduleModal; 