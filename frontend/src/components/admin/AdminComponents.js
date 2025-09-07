import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaChartBar, 
  FaSearch, 
  FaSave, 
  FaClipboardList, 
  FaTrash, 
  FaBullhorn, 
  FaFileAlt,
  FaEye,
  FaClock,
  FaChalkboardTeacher
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Classes Management Component
export const ClassesView = ({ classes, users, onToggleStatus, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getTeacherName = (teacherId) => {
    const teacher = users.find(u => u._id === teacherId);
    return teacher ? teacher.fullName : 'Chưa có giáo viên';
  };

  return (
    <div className="classes-view">
      <div className="view-header">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên lớp hoặc môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="archived">Lưu trữ</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </div>
        <button className="btn btn-primary">
          <FaPlus /> Tạo lớp học mới
        </button>
      </div>

      <div className="classes-grid">
        {filteredClasses.map(classItem => (
          <div key={classItem._id} className="class-card">
            <div className="class-header">
              <h3>{classItem.name}</h3>
              <span className={`status-badge ${classItem.status}`}>
                {classItem.status === 'active' ? 'Hoạt động' : 
                 classItem.status === 'archived' ? 'Lưu trữ' : 'Đã xóa'}
              </span>
            </div>
            
            <div className="class-info">
              <div className="info-row">
                <span className="info-label">Môn học:</span>
                <span>{classItem.subject}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Lớp:</span>
                <span>{classItem.grade}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Năm học:</span>
                <span>{classItem.academicYear}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Mã lớp:</span>
                <span className="class-code">{classItem.classCode}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Giáo viên:</span>
                <span>{getTeacherName(classItem.teacher)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Học sinh:</span>
                <span>{classItem.stats?.totalStudents || 0}/{classItem.settings?.maxStudents || 50}</span>
              </div>
            </div>
            
            <div className="class-actions">
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => onEdit(classItem)}
              >
                <FaEdit /> Sửa
              </button>
              <button 
                className={`btn btn-sm ${classItem.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                onClick={() => onToggleStatus(classItem._id, classItem.status)}
              >
                {classItem.status === 'active' ? '📦 Lưu trữ' : '🔄 Kích hoạt'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Assignments Management Component
export const AssignmentsView = ({ assignments, classes, users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getClassName = (classId) => {
    const classItem = classes.find(c => c._id === classId);
    return classItem ? classItem.name : 'Không xác định';
  };

  const getTeacherName = (teacherId) => {
    const teacher = users.find(u => u._id === teacherId);
    return teacher ? teacher.fullName : 'Không xác định';
  };

  return (
    <div className="assignments-view">
      <div className="view-header">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="published">Đã xuất bản</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>
      </div>

      <div className="assignments-table">
        <table>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Lớp học</th>
              <th>Giáo viên</th>
              <th>Hạn nộp</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map(assignment => (
              <tr key={assignment._id}>
                <td>
                  <div className="assignment-title">
                    <strong>{assignment.title}</strong>
                    {assignment.description && (
                      <small className="assignment-desc">
                        {assignment.description.substring(0, 50)}...
                      </small>
                    )}
                  </div>
                </td>
                <td>{getClassName(assignment.classId)}</td>
                <td>{getTeacherName(assignment.teacherId)}</td>
                <td>{new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</td>
                <td>{assignment.totalPoints}</td>
                <td>
                  <span className={`status-badge ${assignment.status}`}>
                    {assignment.status === 'draft' ? 'Bản nháp' :
                     assignment.status === 'published' ? 'Đã xuất bản' : 'Đã đóng'}
                  </span>
                </td>
                <td>{new Date(assignment.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-outline"><FaEye /></button>
                    <button className="btn btn-sm btn-outline"><FaEdit /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Announcements Management Component
export const AnnouncementsView = ({ announcements, classes, users, onCreateAnnouncement }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnnouncements = announcements.filter(announcement => 
    announcement.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassName = (classId) => {
    const classItem = classes.find(c => c._id === classId);
    return classItem ? classItem.name : 'Tất cả lớp';
  };

  const getAuthorName = (authorId) => {
    const author = users.find(u => u._id === authorId);
    return author ? author.fullName : 'Hệ thống';
  };

  return (
    <div className="announcements-view">
      <div className="view-header">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn btn-primary" onClick={onCreateAnnouncement}>
          <FaPlus /> Tạo thông báo
        </button>
      </div>

      <div className="announcements-list">
        {filteredAnnouncements.map(announcement => (
          <div key={announcement._id} className="announcement-card">
            <div className="announcement-header">
              <div className="announcement-meta">
                <span className={`announcement-type type-${announcement.type}`}>
                  {announcement.type === 'announcement' ? <><FaBullhorn /> Thông báo</> :
                   announcement.type === 'event' ? <><FaClipboardList /> Sự kiện</> :
                   announcement.type === 'assignment' ? <><FaFileAlt /> Bài tập</> : <><FaClipboardList /> Chung</>}
                </span>
                <span className="announcement-date">
                  {new Date(announcement.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="announcement-actions">
                <button className="btn btn-sm btn-outline"><FaEdit /></button>
                <button className="btn btn-sm btn-danger"><FaTrash /></button>
              </div>
            </div>
            
            <div className="announcement-content">
              <p>{announcement.content}</p>
            </div>
            
            <div className="announcement-footer">
              <span>Lớp: {getClassName(announcement.class)}</span>
              <span>Tác giả: {getAuthorName(announcement.author)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Reports Component
export const ReportsView = ({ stats }) => {
  const [reportType, setReportType] = useState('overview');

  return (
    <div className="reports-view">
      <div className="reports-header">
        <div className="report-tabs">
          <button 
            className={`report-tab ${reportType === 'overview' ? 'active' : ''}`}
            onClick={() => setReportType('overview')}
          >
            <FaChartBar /> Tổng quan
          </button>
          <button 
            className={`report-tab ${reportType === 'users' ? 'active' : ''}`}
            onClick={() => setReportType('users')}
          >
            👥 Người dùng
          </button>
          <button 
            className={`report-tab ${reportType === 'classes' ? 'active' : ''}`}
            onClick={() => setReportType('classes')}
          >
            <FaChalkboardTeacher /> Lớp học
          </button>
          <button 
            className={`report-tab ${reportType === 'performance' ? 'active' : ''}`}
            onClick={() => setReportType('performance')}
          >
            📈 Hiệu suất
          </button>
        </div>
      </div>

      <div className="reports-content">
        {reportType === 'overview' && (
          <div className="report-overview">
            <div className="report-cards">
              <div className="report-card">
                <h4>Tổng quan hệ thống</h4>
                <div className="report-stats">
                  <div className="report-stat">
                    <span className="stat-label">Tổng người dùng:</span>
                    <span className="stat-value">{stats.totalUsers}</span>
                  </div>
                  <div className="report-stat">
                    <span className="stat-label">Tổng lớp học:</span>
                    <span className="stat-value">{stats.totalClasses}</span>
                  </div>
                  <div className="report-stat">
                    <span className="stat-label">Tổng bài tập:</span>
                    <span className="stat-value">{stats.totalAssignments}</span>
                  </div>
                </div>
              </div>

              <div className="report-card">
                <h4>Hoạt động trong tuần</h4>
                <div className="activity-chart">
                  <div className="chart-placeholder">
                    <FaChartBar /> Biểu đồ hoạt động sẽ được hiển thị ở đây
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'users' && (
          <div className="user-reports">
            <div className="report-summary">
              <h4>Thống kê người dùng</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-number">{stats.activeStudents}</span>
                  <span className="summary-label">Học sinh hoạt động</span>
                </div>
                <div className="summary-item">
                  <span className="summary-number">{stats.activeTeachers}</span>
                  <span className="summary-label">Giáo viên hoạt động</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Component
export const SettingsView = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState({
    siteName: 'LanLMS',
    maintenanceMode: false,
    allowRegistration: true,
    maxClassSize: 50,
    emailNotifications: true,
    autoApproveClasses: false,
    ...settings
  });

  const handleSave = () => {
    onUpdateSettings(formData);
  };

  return (
    <div className="settings-view">
      <div className="settings-sections">
        <div className="settings-section">
          <h3>🏷️ Cài đặt chung</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Tên trang web:</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({...formData, siteName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Số lượng học sinh tối đa mỗi lớp:</label>
              <input
                type="number"
                value={formData.maxClassSize}
                onChange={(e) => setFormData({...formData, maxClassSize: parseInt(e.target.value)})}
                min="1"
                max="200"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>🔧 Cài đặt hệ thống</h3>
          <div className="settings-form">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.maintenanceMode}
                  onChange={(e) => setFormData({...formData, maintenanceMode: e.target.checked})}
                />
                Chế độ bảo trì
              </label>
              <small>Tạm thời tắt hệ thống để bảo trì</small>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.allowRegistration}
                  onChange={(e) => setFormData({...formData, allowRegistration: e.target.checked})}
                />
                Cho phép đăng ký mới
              </label>
              <small>Người dùng có thể tự đăng ký tài khoản</small>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.autoApproveClasses}
                  onChange={(e) => setFormData({...formData, autoApproveClasses: e.target.checked})}
                />
                Tự động phê duyệt lớp học
              </label>
              <small>Lớp học mới sẽ được phê duyệt tự động</small>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>📧 Cài đặt thông báo</h3>
          <div className="settings-form">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({...formData, emailNotifications: e.target.checked})}
                />
                Gửi thông báo qua email
              </label>
              <small>Gửi email thông báo cho các sự kiện quan trọng</small>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          <FaSave /> Lưu cài đặt
        </button>
      </div>
    </div>
  );
};

// Create Announcement Form
export const CreateAnnouncementForm = ({ classes, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    content: '',
    type: 'announcement',
    class: '',
    targetAll: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="create-announcement-form">
      <h3>Tạo thông báo mới</h3>
      
      <div className="form-group">
        <label>Loại thông báo:</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
        >
          <option value="announcement"><FaBullhorn /> Thông báo</option>
          <option value="reminder"><FaClock /> Nhắc nhở</option>
          <option value="assignment"><FaFileAlt /> Bài tập</option>
          <option value="general"><FaClipboardList /> Chung</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Nội dung thông báo:</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          rows="5"
          placeholder="Nhập nội dung thông báo..."
          required
        />
      </div>
      
      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={formData.targetAll}
            onChange={(e) => setFormData({...formData, targetAll: e.target.checked})}
          />
          Gửi đến tất cả lớp học
        </label>
      </div>
      
      {!formData.targetAll && (
        <div className="form-group">
          <label>Chọn lớp học:</label>
          <select
            value={formData.class}
            onChange={(e) => setFormData({...formData, class: e.target.value})}
            required={!formData.targetAll}
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map(classItem => (
              <option key={classItem._id} value={classItem._id}>
                {classItem.name} - {classItem.subject}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          <FaPlus /> Tạo thông báo
        </button>
      </div>
    </form>
  );
};

// Edit Class Form
export const EditClassForm = ({ classData, users, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: classData.name || '',
    description: classData.description || '',
    subject: classData.subject || '',
    grade: classData.grade || '',
    academicYear: classData.academicYear || '',
    teacher: classData.teacher || '',
    maxStudents: classData.settings?.maxStudents || 50,
    isPublic: classData.settings?.isPublic || false,
    allowStudentJoin: classData.settings?.allowStudentJoin || true,
    requireApproval: classData.settings?.requireApproval || true
  });

  const teachers = users.filter(u => u.role === 'teacher');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-class-form">
      <h3>Chỉnh sửa lớp học</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label>Tên lớp:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Môn học:</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Lớp:</label>
          <input
            type="text"
            value={formData.grade}
            onChange={(e) => setFormData({...formData, grade: e.target.value})}
            placeholder="VD: 12A1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Năm học:</label>
          <input
            type="text"
            value={formData.academicYear}
            onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
            placeholder="VD: 2024-2025"
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>Mô tả:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows="3"
          placeholder="Mô tả về lớp học..."
        />
      </div>
      
      <div className="form-group">
        <label>Giáo viên:</label>
        <select
          value={formData.teacher}
          onChange={(e) => setFormData({...formData, teacher: e.target.value})}
          required
        >
          <option value="">-- Chọn giáo viên --</option>
          {teachers.map(teacher => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.fullName} ({teacher.email})
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>Số học sinh tối đa:</label>
        <input
          type="number"
          value={formData.maxStudents}
          onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
          min="1"
          max="200"
        />
      </div>
      
      <div className="settings-checkboxes">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
            />
            Lớp công khai
          </label>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.allowStudentJoin}
              onChange={(e) => setFormData({...formData, allowStudentJoin: e.target.checked})}
            />
            Cho phép học sinh tự tham gia
          </label>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.requireApproval}
              onChange={(e) => setFormData({...formData, requireApproval: e.target.checked})}
            />
            Yêu cầu phê duyệt khi tham gia
          </label>
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          <FaSave /> Lưu thay đổi
        </button>
      </div>
    </form>
  );
};
