import React, { useState } from 'react';

// Modal nội dung tạo bài tập giống giáo viên
// Props:
// - classesOptions: [{ value, label }]
// - onSave(payload)
// - onCancel()
// - onPublish?(payload) nếu muốn tách nút Lưu nháp/Phát hành
const CreateAssignmentModal = ({ classesOptions = [], onSave, onCancel, onPublish }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: classesOptions[0]?.value || '',
    dueAt: '',
    totalPoints: 100,
    status: 'draft'
  });

  const buildPayload = (statusOverride) => {
    const { title, description, classId, dueAt, totalPoints } = formData;
    return {
      title,
      description,
      classId,
      dueDate: dueAt || '',
      totalPoints: Number(totalPoints) || 0,
      status: statusOverride || formData.status
    };
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    const payload = buildPayload('draft');
    await onSave(payload);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const payload = buildPayload('published');
    if (onPublish) {
      await onPublish(payload);
    } else {
      await onSave(payload);
    }
  };

  return (
    <form onSubmit={handleSaveDraft} className="create-assignment-form">
      <div className="form-header">
        <div>
          <h3>Tạo bài tập</h3>
          <p>Thiết lập thông tin bài tập và giao cho lớp</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Tiêu đề</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="VD: Bài tập Toán - Hàm số bậc hai"
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Mô tả</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả ngắn về bài tập"
          />
        </div>

        <div className="form-group">
          <label>Lớp</label>
          <div className="select-with-arrow">
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            >
              {classesOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>

        <div className="form-group">
          <label>Hạn nộp</label>
          <input
            type="datetime-local"
            value={formData.dueAt}
            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Tổng điểm</label>
          <input
            type="number"
            min={1}
            value={formData.totalPoints}
            onChange={(e) => setFormData({ ...formData, totalPoints: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Trạng thái</label>
          <div className="select-with-arrow">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đã phát hành</option>
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
        <button type="submit" className="btn btn-secondary" onClick={handleSaveDraft}>Lưu nháp</button>
        <button type="button" className="btn btn-primary" onClick={handlePublish}>Phát hành</button>
      </div>
    </form>
  );
};

export default CreateAssignmentModal;
