import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaDownload, FaPrint, FaUsers, FaChalkboardTeacher, FaBan, FaCheck, FaChartLine, FaUserGraduate, FaBook, FaCalendarAlt, FaClock, FaToggleOn, FaToggleOff, FaClipboardList } from 'react-icons/fa';
import { MdClass, MdAssignment, MdAnnouncement, MdSettings, MdBarChart, MdDashboard, MdSchool, MdNotifications, MdEvent, MdSystem } from 'react-icons/md';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

// ==================== USER MANAGEMENT ====================
// Minimal inline SVG icons for UsersView (flat, currentColor)
const UIconUsers = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 7a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" stroke="currentColor" strokeWidth="2" />
    <path d="M3.5 19c1.5-3.5 15.5-3.5 17 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const UIconPlus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const UIconSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const UIconDownload = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const UIconEdit = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
const UIconTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 7h12M9 7V5h6v2M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const UIconToggleOn = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="46" height="22" rx="11" stroke="currentColor" strokeWidth="2" />
    <circle cx="35" cy="12" r="8" fill="currentColor" />
  </svg>
);
const UIconToggleOff = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="46" height="22" rx="11" stroke="currentColor" strokeWidth="2" />
    <circle cx="13" cy="12" r="8" fill="currentColor" />
  </svg>
);

export const UsersView = ({ users, onToggleStatus, onEdit, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = (users || []).filter(user => {
    const q = (searchTerm || '').toLowerCase();
    const name = (user?.fullName || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();
    const matchesSearch = !q || name.includes(q) || email.includes(q);
    const matchesRole = roleFilter === 'all' || user?.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !!user?.isActive) ||
      (statusFilter === 'inactive' && !user?.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Removed export functionality per request

  return (
    <div className="admin-page users-page">
      <div className="page-header">
        <div className="page-title">
          <div>
            <h1>Quản lý người dùng</h1>
            <p>Quản lý tài khoản học sinh, giáo viên và admin</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <UIconPlus /> <span style={{ marginLeft: 6 }}>Thêm người dùng</span>
        </button>
      </div>

      <div className="page-controls">
        <div className="search-control" role="search">
          <UIconSearch />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-control-input"
          />
        </div>
        
        <div className="filters">
          <div className="select-with-arrow">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
              <option value="all">Tất cả vai trò</option>
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Admin</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          
          <div className="select-with-arrow">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Vô hiệu hóa</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>

        {/* Nút xuất đã được gỡ bỏ theo yêu cầu */}
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id || user.id || user.email}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user.fullName || '(Không tên)'}</span>
                      <span className="user-id">ID: {
                        typeof user._id === 'number' ? `#${user._id}` :
                        (typeof user._id === 'string' && user._id)
                          ? (user._id.length > 6 ? user._id.slice(-6) : user._id)
                          : (typeof user.id === 'number' ? `#${user.id}` :
                             (typeof user.id === 'string' && user.id)
                               ? (user.id.length > 6 ? user.id.slice(-6) : user.id)
                               : '-')
                      }</span>
                    </div>
                  </div>
                </td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`role-badge role-${user.role || 'unknown'}`}>
                    {user.role === 'student' ? 'Học sinh' : 
                     user.role === 'teacher' ? 'Giáo viên' : 'Admin'}
                  </span>
                </td>
                <td>
                  <button
                    className={`status-toggle ${user.isActive ? 'active' : 'inactive'}`}
                    onClick={(e) => {
                      try {
                        console.log('[UI] Click toggle status for user:', {
                          key: user._id ?? user.id ?? user.email,
                          id: user._id ?? user.id,
                          email: user.email,
                          isActive: user.isActive
                        });
                      } catch (_) {}
                      onToggleStatus(user._id ?? user.id ?? user.email, user.isActive);
                    }}
                    title={user.isActive ? 'Nhấn để vô hiệu hóa' : 'Nhấn để kích hoạt'}
                  >
                    {user.isActive ? <UIconToggleOn /> : <UIconToggleOff />}
                    <span>{user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}</span>
                  </button>
                </td>
                <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-outline" onClick={() => onEdit(user)} title="Chỉnh sửa">
                      <UIconEdit />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(user._id)} title="Xóa">
                      <UIconTrash />
                    </button>
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

// ==================== CLASS MANAGEMENT ====================
export const ClassesView = ({ classes = [], onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Mock data for demo
  const mockClasses = [
    {
      _id: '1',
      name: 'Toán học 10A1',
      classCode: 'MATH10A1',
      grade: '10',
      subject: 'Toán học',
      teacher: { fullName: 'Nguyễn Văn Hùng' },
      students: new Array(30),
      assignments: new Array(12),
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: 'Văn học 11B2',
      classCode: 'LIT11B2',
      grade: '11',
      subject: 'Ngữ văn',
      teacher: { fullName: 'Trần Thị Mai' },
      students: new Array(28),
      assignments: new Array(8),
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  const displayClasses = classes.length > 0 ? classes : mockClasses;

  // Apply search and filter
  const filtered = displayClasses.filter(cls => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q ||
      cls.name?.toLowerCase().includes(q) ||
      cls.classCode?.toLowerCase().includes(q) ||
      cls.subject?.toLowerCase().includes(q) ||
      cls.teacher?.fullName?.toLowerCase().includes(q);
    const matchesGrade = gradeFilter === 'all' || String(cls.grade) === String(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="admin-page classes-page">
      <div className="page-header">
        <div className="page-title">
          {/* Removed page icon for a cleaner, flat header */}
          <div>
            <h1>Quản lý lớp học</h1>
            <p>Quản lý các lớp học, giáo viên và học sinh</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <FaPlus /> Tạo lớp học
        </button>
      </div>

      <div className="page-controls">
        <div className="search-control" role="search">
          <UIconSearch />
          <input
            type="text"
            placeholder="Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-control-input"
          />
        </div>
        
        <div className="filters">
          <div className="select-with-arrow">
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="filter-select">
              <option value="all">Tất cả khối</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
              <option value="Đại học">Đại học</option>
              <option value="Cao Đẳng">Cao Đẳng</option>
              <option value="Khác">Khác</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="classes-grid">
        {filtered.map(cls => (
          <div key={cls._id} className="class-card">
            <div className="class-header">
              <div className="class-info">
                <h3>{cls.name}</h3>
                <p className="class-code">Mã lớp: {cls.classCode}</p>
              </div>
              <div className="class-actions">
                <button className="btn btn-sm btn-outline" onClick={() => onEdit && onEdit(cls)} title="Chỉnh sửa lớp">
                  <FaEdit />
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete && onDelete(cls)} title="Xóa lớp">
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="class-details">
              <div className="class-meta">
                <span className="class-grade">Khối {cls.grade}</span>
                <span className="class-subject">{cls.subject}</span>
                <span className={`class-status status-${cls.status}`}>
                  {cls.status === 'active' ? 'Hoạt động' : 'Lưu trữ'}
                </span>
              </div>
              
              <div className="class-teacher">
                <FaChalkboardTeacher className="teacher-icon" />
                <span>GV: {cls.teacher?.fullName || 'Chưa phân công'}</span>
              </div>
              
              <div className="class-stats">
                <div className="stat-item">
                  <span className="stat-number">{(typeof cls.studentsCount === 'number' ? cls.studentsCount : (cls.students?.length || 0))}</span>
                  <span className="stat-label">Học sinh</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{(typeof cls.assignmentsCount === 'number' ? cls.assignmentsCount : (cls.assignments?.length || 0))}</span>
                  <span className="stat-label">Bài tập</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== ASSIGNMENT MANAGEMENT ====================
export const AssignmentsView = ({ assignments = [], onAdd, onEdit, onView, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [confirmState, setConfirmState] = useState({ open: false, type: null, id: null, title: '' });

  // Close on Escape key when modal is open
  useEffect(() => {
    if (!confirmState.open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeConfirm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmState.open]);

  // Fetch assignments from API
  useEffect(() => {
    fetchAssignments();
  }, [searchTerm, typeFilter, pagination.page]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const url = `/admin/assignments?${params}`;
      const response = await api.get(url);
      const items = Array.isArray(response?.data?.items)
        ? response.data.items
        : (Array.isArray(response?.data) ? response.data : []);
      try { console.debug('[AssignmentsView] GET', url, 'items=', Array.isArray(items) ? items.length : undefined); } catch (_) {}
      setAssignmentsList(items || []);
      setPagination(prev => ({
        ...prev,
        total: (response?.data?.pagination?.total) || (Array.isArray(items) ? items.length : 0),
        totalPages: response?.data?.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      try { console.debug('[AssignmentsView] fetchAssignments error =', error?.message || error); } catch (_) {}
      setAssignmentsList([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed stats fetching and display per request

  const handleDelete = async (type, id) => {
    try {
      await api.delete(`/admin/assignments/${type}/${id}`);
      fetchAssignments(); // Refresh list
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Có lỗi xảy ra khi xóa bài tập');
    }
  };

  const openConfirm = (type, id, title) => {
    setConfirmState({ open: true, type, id, title: title || '' });
  };

  const closeConfirm = () => {
    setConfirmState({ open: false, type: null, id: null, title: '' });
  };

  const confirmDelete = async () => {
    if (!confirmState.open || !confirmState.type || !confirmState.id) return;
    await handleDelete(confirmState.type, confirmState.id);
    closeConfirm();
  };

  const displayAssignments = assignmentsList;

  const filteredAssignments = displayAssignments; // Filtering is now done on server-side

  return (
    <div className="admin-page assignments-page">
      <div className="page-header">
        <div className="page-title">
          {/* Removed page icon for a cleaner, flat header */}
          <div>
            <h1>Quản lý bài tập</h1>
            <p>Theo dõi và quản lý tất cả bài tập trong hệ thống</p>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={onAdd}>
            <FaPlus /> Tạo bài tập
          </button>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-control" role="search">
          <UIconSearch />
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-control-input"
          />
        </div>
        
        <div className="filters">
          <div className="select-with-arrow">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
              <option value="all">Tất cả loại</option>
              <option value="assignment">Bài tập thường</option>
              <option value="quiz">Bài tập trắc nghiệm</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Stats Summary removed per request */}

      {loading ? (
        <div className="loading-state">
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="assignments-grid">
          {filteredAssignments.length === 0 ? (
            <div className="empty-state">
              <p>Không có bài tập nào</p>
            </div>
          ) : (
            filteredAssignments.map(assignment => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-header">
                  <div className="assignment-info">
                    <h3>{assignment.title}</h3>
                    <p className="assignment-class">{assignment.class_name}</p>
                    <p className="assignment-teacher">GV: {assignment.teacher_name}</p>
                  </div>
                  <div className="assignment-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => onView && onView(assignment)} title="Xem chi tiết">
                      <FaEye />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => openConfirm(assignment.type, assignment.id, assignment.title)} title="Xóa">
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <div className="assignment-details">
                  <p className="assignment-description">{
                    (String(assignment.description || '')
                      .replace(/https?:\/\/\S+/gi, '')
                      .replace(/^Tài liệu:\s*/i, '')
                      .trim())
                  }</p>
                  
                  <div className="assignment-meta">
                    <div className="meta-item">
                      <span className="meta-label">Loại:</span>
                      <span className="meta-value">
                        {assignment.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập thường'}
                      </span>
                    </div>
                    {assignment.due_date && (
                      <div className="meta-item">
                        <span className="meta-label">Hạn:</span>
                        <span className="meta-value">{new Date(assignment.due_date).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                    {assignment.max_score && (
                      <div className="meta-item">
                        <span className="meta-label">Điểm tối đa:</span>
                        <span className="meta-value">{assignment.max_score}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="assignment-stats">
                    <div className="stat-item">
                      <span className="stat-number">{assignment.submissions_count || 0}</span>
                      <span className="stat-label">{assignment.type === 'quiz' ? 'Lần làm' : 'Bài nộp'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{new Date(assignment.created_at).toLocaleDateString('vi-VN')}</span>
                      <span className="stat-label">Tạo ngày</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-outline"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Trước
          </button>
          <span>Trang {pagination.page} / {pagination.totalPages}</span>
          <button 
            className="btn btn-outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Sau
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal (consistent with AdminDashboard.css) */}
      {confirmState.open && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeConfirm}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeConfirm} aria-label="Đóng">×</button>
            <div className="confirm-dialog">
              <h3>Xác nhận xóa</h3>
              <p>Bạn có chắc chắn muốn xóa bài tập{confirmState.title ? ` "${confirmState.title}"` : ''}?</p>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={closeConfirm}>Hủy</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ANNOUNCEMENT MANAGEMENT ====================
export const AnnouncementsView = ({ announcements = [], onAdd, onEdit, onDelete, onPublish, onUnpublish }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');

  // Mock data for demo
  const mockAnnouncements = [
    {
      _id: '1',
      title: 'Nghỉ lễ Quốc khánh 2/9',
      message: 'Các lớp học sẽ tạm dừng từ ngày 1/9 đến 3/9. Chúc mọi người nghỉ lễ vui vẻ!',
      tone: 'info',
      audience: 'all',
      status: 'published',
      author: { fullName: 'Administrator' },
      views: 245,
      createdAt: new Date().toISOString(),
      link_text: 'Lịch nghỉ',
      link_href: 'https://example.com/holiday'
    },
    {
      _id: '2',
      title: 'Kỳ thi giữa học kỳ',
      message: 'Kỳ thi giữa học kỳ diễn ra từ 15/9 đến 20/9. Học sinh chuẩn bị đầy đủ.',
      tone: 'warning',
      audience: 'student',
      status: 'published',
      author: { fullName: 'Administrator' },
      views: 189,
      createdAt: new Date().toISOString()
    }
  ];

  const displayAnnouncements = announcements.length > 0 ? announcements : mockAnnouncements;

  // Apply search and audience filter
  const filteredAnnouncements = displayAnnouncements.filter(a => {
    const q = searchTerm.trim().toLowerCase();
    const title = (a?.title || '').toLowerCase();
    const message = (a?.message || '').toLowerCase();
    const author = (a?.author?.fullName || '').toLowerCase();
    const matchesSearch = !q || title.includes(q) || message.includes(q) || author.includes(q);
    const aud = a?.audience || 'all';
    const matchesAudience = audienceFilter === 'all' || aud === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  return (
    <div className="admin-page announcements-page">
      <div className="page-header">
        <div className="page-title">
          {/* Removed page icon for a cleaner, flat header */}
          <div>
            <h1>Quản lý thông báo</h1>
            <p>Tạo và quản lý thông báo hệ thống</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <FaPlus /> Tạo thông báo
        </button>
      </div>

      <div className="page-controls">
        <div className="search-control" role="search">
          <UIconSearch />
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-control-input"
          />
        </div>
        
        <div className="filters">
          <div className="select-with-arrow">
            <select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} className="filter-select">
              <option value="all">Tất cả đối tượng</option>
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

      <div className="announcements-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="empty-state">
            <p>Không có thông báo nào</p>
          </div>
        ) : null}
        {filteredAnnouncements.map((announcement, index) => (
          <div key={announcement._id || announcement.id || `announcement-${index}`} className="announcement-card">
            <div className="announcement-header">
              <div className="announcement-info">
                <div className="announcement-badges">
                  <span className={`tone-badge tone-${announcement.tone || 'info'}`}>
                    {announcement.tone === 'warning' ? 'Cảnh báo' :
                     announcement.tone === 'danger' ? 'Khẩn cấp' :
                     announcement.tone === 'success' ? 'Thành công' : 'Thông tin'}
                  </span>
                  <span className={`audience-badge audience-${announcement.audience || 'all'}`}>
                    {announcement.audience === 'teacher' ? 'Giáo viên' :
                     announcement.audience === 'student' ? 'Học sinh' : 'Tất cả'}
                  </span>
                  <span className={`status-badge status-${announcement.status}`}>
                    {announcement.status === 'draft' ? 'Bản nháp' : 'Đã đăng'}
                  </span>
                </div>
                <div className="announcement-actions">
                  {announcement.status === 'draft' ? (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onPublish && onPublish(announcement)}
                      title="Đăng"
                    >
                      Đăng
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onUnpublish && onUnpublish(announcement)}
                      title="Gỡ xuống"
                    >
                      Gỡ xuống
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline" onClick={() => onEdit && onEdit(announcement)} title="Chỉnh sửa">
                    <FaEdit />
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => onDelete && onDelete(announcement)} title="Xóa">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="announcement-content">
              <h4>{announcement.title}</h4>
              <p>{announcement.message}</p>
            </div>
            
            <div className="announcement-footer">
              <div className="announcement-meta">
                <span>Tác giả: {announcement.author?.fullName || 'Admin'}</span>
                <span>Ngày tạo: {new Date(announcement.created_at || announcement.createdAt).toLocaleDateString('vi-VN')}</span>
                {announcement.starts_at && (
                  <span>Bắt đầu: {new Date(announcement.starts_at).toLocaleString('vi-VN')}</span>
                )}
                {announcement.ends_at && (
                  <span>Kết thúc: {new Date(announcement.ends_at).toLocaleString('vi-VN')}</span>
                )}
              </div>
              <div className="announcement-stats">
                <span>{announcement.views || 0} lượt xem</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== REPORTS VIEW ====================
export const ReportsView = () => {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [showMore, setShowMore] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [quizzesData, setQuizzesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Safety: ensure page scroll is unlocked if any admin modal classes linger
  useEffect(() => {
    document.documentElement.classList.remove('admin-modal-open');
    document.body.classList.remove('admin-modal-open', 'admin-no-scroll');
    const root = document.getElementById('root');
    if (root) root.style.overflow = '';
    const main = document.querySelector('.admin-main-content');
    if (main) main.classList.remove('no-scroll');
  }, []);

  // Helper: map dateRange to {from, to}
  const computeFromTo = (range) => {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const d = new Date(today);
    if (range === 'week') d.setDate(d.getDate() - 6);
    else if (range === 'month') d.setDate(d.getDate() - 29);
    else if (range === 'quarter') d.setDate(d.getDate() - 89);
    else if (range === 'year') d.setDate(d.getDate() - 364);
    const from = d.toISOString().slice(0, 10);
    return { from, to };
  };

  // Fetch reports data
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // Overview (no date filter)
        const pOverview = api.reports.overview().catch(() => null);
        const { from, to } = computeFromTo(dateRange);
        const pEngagement = api.reports.engagement({ from, to }).catch(() => null);
        const pQuizzes = api.reports.quizzes({ from, to }).catch(() => null);
        const [ov, en, qz] = await Promise.all([pOverview, pEngagement, pQuizzes]);
        if (cancelled) return;
        setOverviewData(ov);
        setEngagementData(en);
        setQuizzesData(qz);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Không thể tải báo cáo');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [dateRange]);

  // Build datasets hoàn toàn từ backend
  // series tổng quan: dùng thống kê điểm danh theo ngày (present/absent/late)
  const series = Array.isArray(engagementData?.byDay)
    ? engagementData.byDay.map(d => ({
        time: d.day,
        users: Number(d.present || 0),      // sử dụng làm "Có mặt"
        classes: Number(d.absent || 0),     // sử dụng làm "Vắng"
        assignments: Number(d.late || 0)    // sử dụng làm "Trễ"
      }))
    : [];

  // KPIs từ backend sẽ tính sau khi có completionSeries

  // Specific datasets từ backend
  const loginSeries = Array.isArray(engagementData?.byDay) && engagementData.byDay.length
    ? engagementData.byDay.map(d => ({ date: d.day, logins: Number(d.present || 0) }))
    : [];

  const completionSeries = (
    Array.isArray(engagementData?.byDay) && engagementData.byDay.length
      ? engagementData.byDay.map(d => ({ week: d.day, completed: Number(d.present || 0), total: Number(d.total || 0) }))
      : []
  ).map(x => ({ ...x, rate: x.total ? Math.round((x.completed / x.total) * 100) : 0 }));

  // KPIs từ backend (đặt sau khi đã có completionSeries)
  const totals = overviewData?.totals || {};
  const completionTotals = (Array.isArray(completionSeries) ? completionSeries : []).reduce(
    (acc, x) => {
      acc.completed += Number(x.completed || 0);
      acc.total += Number(x.total || 0);
      return acc;
    },
    { completed: 0, total: 0 }
  );
  const summary = {
    newUsers: Number(totals.total_users || 0),
    newClasses: Number(totals.total_classes || 0),
    assignmentsCreated: 0, // chưa có API -> 0
    completionRate: completionTotals.total ? (completionTotals.completed / completionTotals.total) : 0,
    avgScore: (typeof quizzesData?.attempts?.avg_score10 === 'number') ? quizzesData.attempts.avg_score10 : 0
  };

  const quizStatusBuckets = Array.isArray(quizzesData?.quizzesByStatus)
    ? quizzesData.quizzesByStatus.map(s => ({ range: String(s.status || 'unknown'), count: Number(s.count || 0) }))
    : [];

  // Chưa có API hoạt động theo lớp => để trống, ẩn biểu đồ nếu không có dữ liệu
  const classActivity = [];

  // Derived KPIs for summary (must come after datasets are defined)
  const totalLogins = loginSeries.reduce((sum, x) => sum + (x.logins || 0), 0);
  const topActive = classActivity.reduce((best, c) => (c.actions > (best?.actions || 0) ? c : best), null);
  const topActiveClass = topActive ? topActive.className : '-';

  // Apply dateRange filtering to time-based datasets
  const filterByDateRange = (arr) => {
    if (!Array.isArray(arr)) return arr;
    switch (dateRange) {
      case 'week':
        return arr.slice(-1);
      case 'month':
        return arr.slice(-2);
      case 'quarter':
        return arr.slice(-3);
      case 'year':
      default:
        return arr;
    }
  };
  const seriesFiltered = filterByDateRange(series);
  const loginSeriesFiltered = filterByDateRange(loginSeries);
  const completionSeriesFiltered = filterByDateRange(completionSeries);
  const classActivityFiltered = classActivity; // not time-based

  // Control visible chart groups by reportType
  const showOverview = reportType === 'overview';
  const showUsers = reportType === 'users' || showOverview;
  const showClasses = reportType === 'classes' || showOverview;
  const showAssignments = reportType === 'assignments' || showOverview;

  const handleExportCSV = () => {
    // Xuất theo dữ liệu backend: Có mặt/Vắng/Trễ theo ngày
    const headers = ['Ngày', 'Có mặt', 'Vắng', 'Trễ'];
    const rows = seriesFiltered.map(r => [r.time, r.users, r.classes, r.assignments]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao_cao_engagement_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="admin-page reports-page">
      {error && (
        <div className="error-banner" role="alert" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      {loading && (
        <div className="info-banner" role="status" style={{ marginBottom: 8 }}>
          Đang tải dữ liệu báo cáo...
        </div>
      )}
      <div className="page-header">
        <div className="page-title">
          <div>
            <h1>Báo cáo và thống kê</h1>
            <p>Xem báo cáo chi tiết về hoạt động hệ thống</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={handlePrint} title="In báo cáo">
            <FaPrint /> In báo cáo
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV} title="Xuất CSV">
            <FaDownload /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="page-controls">
        <div className="filters">
          <div className="select-with-arrow">
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="filter-select">
              <option value="overview">Tổng quan</option>
              <option value="users">Người dùng</option>
              <option value="classes">Lớp học</option>
              <option value="assignments">Bài tập</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="select-with-arrow">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="filter-select">
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
              <option value="quarter">3 tháng qua</option>
              <option value="year">1 năm qua</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      {showOverview && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Xu hướng tổng quan</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={seriesFiltered} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClasses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" name="Người dùng" />
                  <Area type="monotone" dataKey="classes" stroke="#82ca9d" fillOpacity={1} fill="url(#colorClasses)" name="Lớp" />
                  <Line type="monotone" dataKey="assignments" stroke="#ff7300" name="Bài tập" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>So sánh theo danh mục</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={seriesFiltered} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#8884d8" name="Người dùng mới" />
                  <Bar dataKey="classes" fill="#82ca9d" name="Lớp mới" />
                  <Bar dataKey="assignments" fill="#ff7300" name="Bài tập tạo mới" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        {showUsers && (
          <div className="chart-card">
            <h3>📈 Hoạt động đăng nhập theo thời gian</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={loginSeriesFiltered} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="logins" stroke="#1976d2" name="Lượt đăng nhập" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {showAssignments && (
          <div className="chart-card">
            <h3>Thống kê bài tập — Tỷ lệ hoàn thành</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={completionSeriesFiltered} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#4caf50" name="Bài tập hoàn thành" />
                  <Bar dataKey="total" fill="#b0bec5" name="Tổng số bài tập" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Toggle for extra charts to keep default view concise */}
      <div className="expand-section" style={{ marginTop: 12 }}>
        <button
          className="btn btn-outline"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          aria-controls="extra-charts"
        >
          {showMore ? 'Ẩn bớt biểu đồ' : 'Xem thêm biểu đồ'}
        </button>
      </div>

      {showMore && (
        <div id="extra-charts" className="charts-grid extra-charts">
          {showAssignments && (
            <div className="chart-card">
              <h3>🎯 Phân bố điểm số</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={quizStatusBuckets} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ff9800" name="Số học sinh" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {showClasses && (
            <div className="chart-card">
              <h3>Hoạt động theo lớp</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={classActivityFiltered} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="className" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actions" fill="#673ab7" name="Số hoạt động" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {showOverview && (
        <>
          <h3 style={{ marginTop: 8 }}>Tóm tắt báo cáo</h3>
          <div className="summary-grid">
            {/* KPI: Tổng đăng nhập */}
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label"><FaChartLine /> Tổng số đăng nhập</span>
                <span className="summary-value">{totalLogins.toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* KPI: Người dùng mới */}
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label"><FaUsers /> Người dùng mới</span>
                <span className="summary-value">{Number((overviewData?.totals?.students || 0) + (overviewData?.totals?.teachers || 0) || summary.newUsers).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* KPI: Lớp mới */}
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label"><FaChalkboardTeacher /> Lớp mới</span>
                <span className="summary-value">{Number(overviewData?.totals?.activeClasses || summary.newClasses).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* KPI: Bài tập tạo mới */}
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label"><FaClipboardList /> Bài tập tạo mới</span>
                <span className="summary-value">{Number(summary.assignmentsCreated).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* KPI: Điểm trung bình */}
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label"><FaBook /> Điểm trung bình</span>
                <span className="summary-value">{Number(quizzesData?.attempts?.avg_score10 ?? summary.avgScore).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== SETTINGS VIEW ====================
export const SettingsView = () => {
  const [settings, setSettings] = useState({
    siteName: 'EduHub Classroom',
    allowRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
    maxFileSize: 10,
    sessionTimeout: 24
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_system_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only merge known keys to avoid surprises
        setSettings(prev => ({
          ...prev,
          siteName: parsed.siteName ?? prev.siteName,
          allowRegistration: typeof parsed.allowRegistration === 'boolean' ? parsed.allowRegistration : prev.allowRegistration,
          emailNotifications: typeof parsed.emailNotifications === 'boolean' ? parsed.emailNotifications : prev.emailNotifications,
          maintenanceMode: typeof parsed.maintenanceMode === 'boolean' ? parsed.maintenanceMode : prev.maintenanceMode,
          maxFileSize: Number.isFinite(parsed.maxFileSize) ? parsed.maxFileSize : prev.maxFileSize,
          sessionTimeout: Number.isFinite(parsed.sessionTimeout) ? parsed.sessionTimeout : prev.sessionTimeout,
        }));
      }
    } catch (e) {
      // no-op; keep defaults
    }
  }, []);

  const handleSave = () => {
    // Basic validation
    const maxFileSize = Number(settings.maxFileSize);
    const sessionTimeout = Number(settings.sessionTimeout);
    if (!Number.isFinite(maxFileSize) || maxFileSize <= 0) {
      setSaveMessage('Kích thước tệp tối đa phải lớn hơn 0');
      return;
    }
    if (!Number.isFinite(sessionTimeout) || sessionTimeout <= 0) {
      setSaveMessage('Thời gian phiên phải lớn hơn 0');
      return;
    }

    setSaving(true);
    try {
      const toPersist = {
        siteName: String(settings.siteName || ''),
        allowRegistration: !!settings.allowRegistration,
        emailNotifications: !!settings.emailNotifications,
        maintenanceMode: !!settings.maintenanceMode,
        maxFileSize: Math.round(maxFileSize),
        sessionTimeout: Math.round(sessionTimeout),
      };
      localStorage.setItem('admin_system_settings', JSON.stringify(toPersist));
      setSaveMessage('Đã lưu cài đặt thành công');
    } catch (e) {
      setSaveMessage('Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
      // Auto clear message
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  // Safety: ensure scroll is enabled on this page as well
  useEffect(() => {
    document.documentElement.classList.remove('admin-modal-open');
    document.body.classList.remove('admin-modal-open', 'admin-no-scroll');
    const root = document.getElementById('root');
    if (root) root.style.overflow = '';
    const main = document.querySelector('.admin-main-content');
    if (main) main.classList.remove('no-scroll');
  }, []);

  return (
    <div className="admin-page settings-page">
      <div className="page-header">
        <div className="page-title">
          <MdSettings className="page-icon" />
          <div>
            <h1>Cài đặt hệ thống</h1>
            <p>Cấu hình các thông số hệ thống</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>

      {saveMessage && (
        <div className="info-banner" role="status" style={{ marginBottom: 12 }}>
          {saveMessage}
        </div>
      )}

      <div className="settings-sections">
        <div className="settings-section">
          <h3>Cài đặt chung</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Tên trang web:</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                className="setting-input"
              />
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.allowRegistration}
                  onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                />
                Cho phép đăng ký tài khoản mới
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
                Gửi thông báo qua email
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                />
                Chế độ bảo trì
              </label>
              <small className="setting-hint">Hiển thị banner bảo trì cho người dùng.</small>
            </div>

            <div className="setting-item">
              <label>Kích thước tệp tối đa (MB):</label>
              <input
                type="number"
                min={1}
                max={1024}
                step={1}
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', e.target.value)}
                className="setting-input"
              />
            </div>

            <div className="setting-item">
              <label>Thời gian phiên (giờ):</label>
              <input
                type="number"
                min={1}
                max={240}
                step={1}
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                className="setting-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
