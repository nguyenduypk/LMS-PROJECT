import React, { useState, useEffect } from 'react';
import { FaBullhorn } from 'react-icons/fa';

// Modal tạo thông báo cho Admin (giống phong cách các form khác)
// Props:
// - classesOptions: [{ value, label }]
// - onSave(payload)
// - onCancel()
// - onPublish?(payload)
const CreateAnnouncementModal = ({ classesOptions = [], onSave, onCancel, onPublish }) => {
  const [formData, setFormData] = useState({
    content: '',
    audience: 'all', // all | teacher | student
    tone: 'info' // info | warning | danger | success
  });

  // No class/type selection needed; backend hiện không hỗ trợ theo lớp

  const buildPayload = (statusOverride) => {
    const { content, audience, tone } = formData;
    return {
      content,
      status: statusOverride || 'draft',
      audience,
      tone
    };
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    await onSave(buildPayload('draft'));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const payload = buildPayload('published');
    if (onPublish) await onPublish(payload); else await onSave(payload);
  };

  return (
    <form onSubmit={handleSaveDraft} className="create-assignment-form">
      <div className="form-header">
        <div className="form-icon"><FaBullhorn /></div>
        <div>
          <h3>Tạo thông báo</h3>
          <p>Gửi thông báo hệ thống hoặc theo lớp</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group full-width">
          <label>Nội dung thông báo</label>
          <textarea
            rows={5}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Nhập nội dung thông báo..."
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Loại thông báo</label>
          <div className="select-with-arrow">
            <select
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className="form-input"
            >
              <option value="info">Thông tin</option>
              <option value="warning">Cảnh báo</option>
              <option value="danger">Khẩn cấp</option>
              <option value="success">Thành công</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>

        <div className="form-group">
          <label>Đối tượng</label>
          <div className="select-with-arrow">
            <select
              value={formData.audience}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              className="form-input"
            >
              <option value="all">Tất cả</option>
              <option value="teacher">Giáo viên</option>
              <option value="student">Học sinh</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>

        
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Hủy</button>
        <button
          type="submit"
          className="btn btn-secondary"
          onClick={handleSaveDraft}
        >Lưu nháp</button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePublish}
        >Phát hành</button>
      </div>
    </form>
  );
};

export default CreateAnnouncementModal;
