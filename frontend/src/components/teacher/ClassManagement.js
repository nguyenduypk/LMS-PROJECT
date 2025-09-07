import React, { useState, useEffect } from 'react';
import { api, auth } from '../../utils/api';
import './ClassManagement.css';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [deletedClasses, setDeletedClasses] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    room: '',
    schedule: ''
  });

  useEffect(() => {
    loadClasses();
  }, [showHidden]);

  const loadClasses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.classes.getTeacherClasses(showHidden);
      if (response.classes) {
        setClasses(response.classes);
      }
    } catch (error) {
      setError('Không thể tải danh sách lớp học');
      console.error('Load classes error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeletedClasses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.classes.getDeletedClasses();
      if (response.classes) {
        setDeletedClasses(response.classes);
      }
    } catch (error) {
      setError('Không thể tải danh sách lớp học đã xóa');
      console.error('Load deleted classes error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.classes.create(formData);
      if (response.message) {
        setSuccess(response.message);
        setShowCreateForm(false);
        resetForm();
        loadClasses();
      } else {
        setError(response.message || 'Tạo lớp học thất bại');
      }
    } catch (error) {
      setError('Tạo lớp học thất bại');
      console.error('Create class error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.classes.update(editingClass.id, formData);
      if (response.message) {
        setSuccess(response.message);
        setShowEditForm(false);
        setEditingClass(null);
        resetForm();
        loadClasses();
      } else {
        setError(response.message || 'Cập nhật lớp học thất bại');
      }
    } catch (error) {
      setError('Cập nhật lớp học thất bại');
      console.error('Update class error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.classes.delete(classId);
      if (response.message) {
        setSuccess(response.message);
        loadClasses();
      } else {
        setError(response.message || 'Xóa lớp học thất bại');
      }
    } catch (error) {
      setError('Xóa lớp học thất bại');
      console.error('Delete class error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (classId) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.classes.toggleVisibility(classId);
      if (response.message) {
        setSuccess(response.message);
        loadClasses();
      } else {
        setError(response.message || 'Thay đổi trạng thái thất bại');
      }
    } catch (error) {
      setError('Thay đổi trạng thái thất bại');
      console.error('Toggle visibility error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreClass = async (classId) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.classes.restore(classId);
      if (response.message) {
        setSuccess(response.message);
        loadDeletedClasses();
        loadClasses();
      } else {
        setError(response.message || 'Khôi phục lớp học thất bại');
      }
    } catch (error) {
      setError('Khôi phục lớp học thất bại');
      console.error('Restore class error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      room: '',
      schedule: ''
    });
  };

  const openEditForm = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name || '',
      description: classItem.description || '',
      subject: classItem.subject || '',
      room: classItem.room || '',
      schedule: classItem.schedule || ''
    });
    setShowEditForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="class-management">
      <div className="class-management-header">
        <h2>Quản lý lớp học</h2>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
            disabled={isLoading}
          >
            + Tạo lớp học mới
          </button>
          <button 
            className={`btn ${showHidden ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setShowHidden(!showHidden)}
            disabled={isLoading}
          >
            {showHidden ? 'Ẩn lớp ẩn' : 'Hiện lớp ẩn'}
          </button>
          <button 
            className={`btn ${showDeleted ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => {
              setShowDeleted(!showDeleted);
              if (!showDeleted) {
                loadDeletedClasses();
              }
            }}
            disabled={isLoading}
          >
            {showDeleted ? 'Ẩn lớp đã xóa' : 'Hiện lớp đã xóa'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create Class Form */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Tạo lớp học mới</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="class-form">
              <div className="form-group">
                <label>Tên lớp học *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tên lớp học"
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả lớp học"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Môn học</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Toán, Văn, Anh..."
                  />
                </div>
                <div className="form-group">
                  <label>Phòng học</label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: A101, B205..."
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Lịch học</label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Thứ 2, 4, 6 - 8:00-9:30"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Hủy
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang tạo...' : 'Tạo lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Form */}
      {showEditForm && editingClass && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Chỉnh sửa lớp học</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingClass(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateClass} className="class-form">
              <div className="form-group">
                <label>Tên lớp học *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tên lớp học"
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả lớp học"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Môn học</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Toán, Văn, Anh..."
                  />
                </div>
                <div className="form-group">
                  <label>Phòng học</label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: A101, B205..."
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Lịch học</label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Thứ 2, 4, 6 - 8:00-9:30"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditForm(false)}>
                  Hủy
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="classes-container">
        {isLoading ? (
          <div className="loading">Đang tải...</div>
        ) : showDeleted ? (
          <div className="deleted-classes">
            <h3>Lớp học đã xóa</h3>
            {deletedClasses.length === 0 ? (
              <p>Không có lớp học nào đã xóa</p>
            ) : (
              <div className="classes-grid">
                {deletedClasses.map(classItem => (
                  <div key={classItem.id} className="class-card deleted">
                    <div className="class-header">
                      <h4>{classItem.name}</h4>
                      <span className="status deleted">Đã xóa</span>
                    </div>
                    <div className="class-info">
                      <p><strong>Môn học:</strong> {classItem.subject || 'Chưa cập nhật'}</p>
                      <p><strong>Phòng:</strong> {classItem.room || 'Chưa cập nhật'}</p>
                      <p><strong>Học sinh:</strong> {classItem.student_count || 0}</p>
                      <p><strong>Ngày xóa:</strong> {formatDate(classItem.deleted_at)}</p>
                    </div>
                    <div className="class-actions">
                      <button 
                        className="btn btn-success"
                        onClick={() => handleRestoreClass(classItem.id)}
                        disabled={isLoading}
                      >
                        Khôi phục
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="active-classes">
            <h3>Lớp học hiện tại</h3>
            {classes.length === 0 ? (
              <p>Chưa có lớp học nào</p>
            ) : (
              <div className="classes-grid">
                {classes.map(classItem => (
                  <div key={classItem.id} className={`class-card ${classItem.is_hidden ? 'hidden' : ''}`}>
                    <div className="class-header">
                      <h4>{classItem.name}</h4>
                      <div className="status-group">
                        {classItem.is_hidden && <span className="status hidden">Đã ẩn</span>}
                        <span className="status active">Hoạt động</span>
                      </div>
                    </div>
                    <div className="class-info">
                      <p><strong>Môn học:</strong> {classItem.subject || 'Chưa cập nhật'}</p>
                      <p><strong>Phòng:</strong> {classItem.room || 'Chưa cập nhật'}</p>
                      <p><strong>Lịch học:</strong> {classItem.schedule || 'Chưa cập nhật'}</p>
                      <p><strong>Học sinh:</strong> {classItem.student_count || 0}</p>
                      <p><strong>Ngày tạo:</strong> {formatDate(classItem.created_at)}</p>
                    </div>
                    {classItem.description && (
                      <div className="class-description">
                        <p>{classItem.description}</p>
                      </div>
                    )}
                    <div className="class-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => openEditForm(classItem)}
                        disabled={isLoading}
                      >
                        Chỉnh sửa
                      </button>
                      <button 
                        className={`btn ${classItem.is_hidden ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => handleToggleVisibility(classItem.id)}
                        disabled={isLoading}
                      >
                        {classItem.is_hidden ? 'Hiện' : 'Ẩn'}
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteClass(classItem.id)}
                        disabled={isLoading}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManagement; 