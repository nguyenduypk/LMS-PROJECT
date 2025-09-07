import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Inline SVG icons (flat, currentColor-driven)
import AdminHeader from './AdminHeader';
import './AdminDashboard.css';
import { UsersView, ClassesView, AssignmentsView, AnnouncementsView, ReportsView, SettingsView } from './ComprehensiveAdminComponents';
import AddClassForm from './AddClassForm';
import CreateAssignmentModal from './CreateAssignmentModal';
import CreateAnnouncementModal from './CreateAnnouncementModal';
import './ComprehensiveAdminComponents.css';
import { api } from '../../utils/api';
// Charts removed per requirement: lower charts on dashboard are no longer displayed.

// Inline SVG Icons (flat, currentColor-driven)
const IconClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUserPlus = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
    <path d="M3.5 19c1.2-3 9.8-3 11 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 7v6M14 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconChalkboard = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <path d="M7 19h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="6" y="8" width="6" height="2" fill="currentColor" />
  </svg>
);

const IconClipboardList = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
    <rect x="9" y="2" width="6" height="4" rx="1.5" fill="currentColor" />
    <path d="M10 10h6M10 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconBullhorn = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 14v-4l10-4v12L4 14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M4 10a3 3 0 000 4M14 6.5c2 .5 4 2.5 4 5s-2 4.5-4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 14l2.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUsers = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 8a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" stroke="currentColor" strokeWidth="2" />
    <path d="M4 19c1.5-3.5 14.5-3.5 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconGraduationCap = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4l9 4-9 4-9-4 9-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M6 11v3.5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5V11" stroke="currentColor" strokeWidth="2" />
    <path d="M21 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Add User Form
const AddUserForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'student',
    isActive: true,
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="add-user-form">
      <div className="form-header">
        <div className="form-icon"><IconUserPlus /></div>
        <div>
          <h3>Thêm người dùng</h3>
          <p>Điền thông tin cơ bản để tạo tài khoản mới</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Tên đăng nhập (username)</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="form-input"
            placeholder="VD: nguyenvana"
            required
          />
        </div>
        <div className="form-group">
          <label>Họ tên</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="form-input"
            placeholder="VD: Nguyễn Văn A"
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="form-input"
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Vai trò</label>
          <div className="select-with-arrow">
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-input"
            >
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
        </div>

        <div className="form-group">
          <label>Mật khẩu (tùy chọn)</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="form-input"
            placeholder="Tối thiểu 6 ký tự"
            required
          />
        </div>


      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          Tạo mới
        </button>
      </div>
    </form>
  );
};
/* eslint-enable no-unused-vars */

// Edit Class Form (top-level)
const EditClassForm = ({ cls, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: cls?.name || '',
    description: cls?.description || '',
    subject: cls?.subject || '',
    grade: cls?.grade || '',
    classCode: cls?.classCode || '',
    status: cls?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="add-user-form">
      <div className="form-header">
        <div className="form-icon"><IconChalkboard /></div>
        <div>
          <h3>Chỉnh sửa lớp học</h3>
          <p>Cập nhật thông tin lớp</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Tên lớp</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Mã lớp</label>
          <input
            type="text"
            value={formData.classCode}
            onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Môn học</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Khối</label>
          <div className="select-with-arrow">
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="form-input"
            >
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
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

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-input"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Trạng thái</label>
          <div className="select-with-arrow">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-input"
            >
              <option value="active">Đang hoạt động</option>
              <option value="archived">Đã lưu trữ</option>
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
        <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
      </div>
    </form>
  );
};

// Add Assignment Form
/* eslint-disable no-unused-vars */
const AddAssignmentForm = ({ classesOptions = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: classesOptions[0]?.value || '',
    dueDate: '',
    totalPoints: 100,
    status: 'draft'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="add-user-form">
      <div className="form-header">
        <div className="form-icon"><IconClipboardList /></div>
        <div>
          <h3>Thêm bài tập</h3>
          <p>Tạo bài tập mới và gán cho lớp</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Tiêu đề</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="form-input"
            placeholder="VD: Bài tập Toán - Hàm số bậc hai"
            required
          />
        </div>

        <div className="form-group">
          <label>Mô tả</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-input"
            placeholder="Mô tả ngắn về bài tập"
          />
        </div>

        <div className="form-group">
          <label>Lớp</label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
          >
            {classesOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Hạn nộp</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group form-group-inline">
          <label>Điểm tối đa</label>
          <input
            type="number"
            min="1"
            value={formData.totalPoints}
            onChange={(e) => setFormData({ ...formData, totalPoints: Number(e.target.value) })}
            className="form-input"
          />
        </div>

        <div className="form-group form-group-inline">
          <label>Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Đã phát hành</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Hủy</button>
        <button type="submit" className="btn btn-primary">Tạo bài tập</button>
      </div>
    </form>
  );
};

// Edit Assignment Form (top-level)
const EditAssignmentForm = ({ assignment, classesOptions = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    classId: assignment?.classId || classesOptions[0]?.value || '',
    dueDate: assignment?.dueDate ? assignment.dueDate.slice(0, 10) : '',
    totalPoints: assignment?.totalPoints || 100,
    status: assignment?.status || 'draft'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="add-user-form">
      <div className="form-header">
        <div className="form-icon"><IconClipboardList /></div>
        <div>
          <h3>Chỉnh sửa bài tập</h3>
          <p>Cập nhật thông tin bài tập</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Tiêu đề</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Lớp học</label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            className="form-input"
          >
            {classesOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Hạn nộp</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Điểm tối đa</label>
          <input
            type="number"
            value={formData.totalPoints}
            onChange={(e) => setFormData({ ...formData, totalPoints: Number(e.target.value) })}
            className="form-input"
            min={1}
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-input"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="form-input"
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Đã phát hành</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Hủy</button>
        <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
      </div>
    </form>
  );
};

const EnhancedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const prevScrollYRef = useRef(0);
  
  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    totalAnnouncements: 0,
    activeStudents: 0,
    activeTeachers: 0
  });
  
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  // Notifications (header bell)
  const [notifications, setNotifications] = useState([]);
  const NOTIF_READ_KEY = 'admin_notif_read_ids';

  // Keep activeTab in sync with URL path (e.g., /admin/profile -> 'dashboard' or a specific tab)
  useEffect(() => {
    const path = location.pathname || '';
    if (!path.startsWith('/admin')) return;
    const seg = path.replace(/^\/admin\/?/, '').split('/')[0];
    // Map known paths to tabs; unknowns default to dashboard
    const pathToTab = {
      '': 'dashboard',
      dashboard: 'dashboard',
      users: 'users',
      classes: 'classes',
      assignments: 'assignments',
      announcements: 'announcements',
      reports: 'reports',
    };
    const tab = pathToTab[seg] || 'dashboard';
    setActiveTab(tab);
    // Do not force-redirect when visiting non-tab admin routes like /admin/settings.
    // Those routes are handled by separate components via App.js routing.
  }, [location.pathname, navigate]);

  // Utility functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helpers for notification read states
  const readNotifIds = () => {
    try {
      const raw = localStorage.getItem(NOTIF_READ_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  };
  const writeNotifIds = (idsSet) => {
    try {
      localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(Array.from(idsSet)));
    } catch {}
  };

  // Derive notifications from announcements
  useEffect(() => {
    const seen = readNotifIds();
    const list = (announcements || []).slice(0, 10).map(a => ({
      id: a._id || a.id,
      title: a.content?.slice(0, 80) || 'Thông báo mới',
      content: a.content,
      time: a.createdAt ? new Date(a.createdAt).toLocaleString() : '',
      read: seen.has(a._id || a.id)
    }));
    setNotifications(list);
  }, [announcements]);

  const markAllNotificationsRead = () => {
    const ids = new Set(readNotifIds());
    notifications.forEach(n => ids.add(n.id));
    writeNotifIds(ids);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Compute unread count for header badge
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle single notification click: mark as read and go to announcements
  const handleClickNotification = (notif) => {
    if (!notif || !notif.id) return;
    const ids = new Set(readNotifIds());
    if (!ids.has(notif.id)) {
      ids.add(notif.id);
      writeNotifIds(ids);
    }
    setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, read: true } : n)));
    setActiveTab('announcements');
  };

  // Lock body scroll when modal is open (robust: fix body position & restore)
  useEffect(() => {
    const container = document.querySelector('.admin-main-content');
    if (modal) {
      // Lưu vị trí cuộn hiện tại để khôi phục khi đóng modal
      prevScrollYRef.current = window.scrollY || window.pageYOffset || 0;
      if (container) container.classList.add('no-scroll');
    } else {
      if (container) container.classList.remove('no-scroll');
      const y = prevScrollYRef.current || 0;
      window.scrollTo(0, y);
    }
    return () => {
      // Cleanup khi modal đổi hoặc component unmount
      const c = document.querySelector('.admin-main-content');
      if (c) c.classList.remove('no-scroll');
      const y = prevScrollYRef.current || 0;
      window.scrollTo(0, y);
    };
  }, [modal]);

  // Cleanup scroll lock khi đổi route để tránh kẹt trạng thái
  useEffect(() => {
    // Đảm bảo modal đóng khi chuyển tab/route trong admin
    setModal(null);
    const c = document.querySelector('.admin-main-content');
    if (c) c.classList.remove('no-scroll');
    // Thu dọn các class/style cũ nếu còn tồn tại (phòng trường hợp từ phiên bản trước)
    document.documentElement.classList.remove('admin-modal-open');
    document.body.classList.remove('admin-modal-open', 'admin-no-scroll');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';
  }, [location.pathname]);

  // Local persistence helpers (fallback when admin APIs aren't available)
  const LOCAL_USERS_KEY = 'admin_local_users';
  const readLocalUsers = () => {
    try {
      const raw = localStorage.getItem(LOCAL_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const writeLocalUsers = (list) => {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list));
    } catch {}
  };
  const upsertLocalUser = (user) => {
    const list = readLocalUsers();
    const idx = list.findIndex(u => (u._id && user._id ? u._id === user._id : u.email === user.email));
    if (idx >= 0) list[idx] = { ...list[idx], ...user };
    else list.unshift(user);
    writeLocalUsers(list);
  };
  const removeLocalUser = (idOrEmail) => {
    const list = readLocalUsers();
    const filtered = list.filter(u => (u._id ? u._id !== idOrEmail : u.email !== idOrEmail));
    writeLocalUsers(filtered);
  };

// Create user (real API)
const createUser = async (payload) => {
  try {
    setLoading(true);
    const body = {
      username: (payload.username || '').trim(),
      full_name: (payload.fullName || payload.name || '').trim(),
      email: (payload.email || '').trim(),
      role: ['student', 'teacher', 'admin'].includes(payload.role) ? payload.role : 'student',
      is_active: Boolean(payload.isActive ?? true),
      password: String(payload.password || '')
    };
    // Backend yêu cầu các trường bắt buộc: username, full_name, email, password
    if (!body.username || !body.full_name || !body.email || !body.password) {
      throw new Error('Thiếu username / họ tên / email / mật khẩu');
    }
    const res = await api.admin.users.create(body);
    // Luôn refetch để đồng bộ với DB (backend trả user có id)
    await fetchUsers();
    showToast('Tạo người dùng thành công');
  } catch (e) {
    console.error('createUser error:', e);
    const msg = e?.response?.data?.message || e?.message || 'Không thể tạo người dùng. Kiểm tra quyền admin/ dữ liệu đầu vào.';
    showToast(msg, 'error');
  } finally {
    setLoading(false);
  }
};

// Update user (real API)
const updateUser = async (id, payload) => {
  try {
    setLoading(true);
    // Chuẩn hóa payload gửi lên server
    const body = {
      // Backend dùng full_name
      ...(payload.fullName !== undefined ? { full_name: payload.fullName } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.role !== undefined ? { role: payload.role } : {}),
      // Map isActive (boolean) -> is_active (server expects)
      ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
      // Thêm username nếu có chỉnh sửa
      ...(payload.username !== undefined ? { username: payload.username } : {}),
    };
    console.debug('[UI] updateUser sending payload', body);
    const res = await api.admin.users.update(id, body);
    const updated = res?.user || res?.data || res;
    if (updated && updated._id) {
      setUsers(prev => prev.map(u => (u._id === id ? { ...u, ...updated } : u)));
    } else {
      // fallback: merge local with payload
      setUsers(prev => prev.map(u => (u._id === id ? { ...u, ...payload } : u)));
    }
    // Refetch để đảm bảo đồng bộ và bền vững sau reload
    try { await fetchUsers(); } catch (e) { console.debug('fetchUsers after update failed', e); }
    showToast('Cập nhật người dùng thành công');
  } catch (e) {
    console.error('updateUser error:', e);
    const msg = (e && e.message) ? e.message : 'Không thể cập nhật người dùng.';
    showToast(`Không thể cập nhật người dùng: ${msg}`, 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

// Update assignment (frontend-only)
const updateAssignment = async (id, payload) => {
  try {
    setLoading(true);
    setAssignments(prev => prev.map(a => (a._id === id ? { ...a, ...payload } : a)));
    showToast('Cập nhật bài tập thành công (cục bộ)');
  } catch (e) {
    console.error(e);
    showToast('Không thể cập nhật bài tập (cục bộ)', 'error');
  } finally {
    setLoading(false);
  }
};

// Delete assignment (frontend-only)
const deleteAssignment = async (id) => {
  try {
    setLoading(true);
    setAssignments(prev => prev.filter(a => a._id !== id));
    showToast('Xóa bài tập thành công (cục bộ)');
  } catch (e) {
    console.error(e);
    showToast('Không thể xóa bài tập (cục bộ)', 'error');
  } finally {
    setLoading(false);
  }
};

// Announcements (real API)
const fetchAnnouncements = async (params = {}) => {
  try {
    setLoading(true);
    const { page = 1, limit = 20, status = '', search = '' } = params;
    const res = await api.admin.notices.list({ page, limit, status, search });
    // Hỗ trợ nhiều định dạng trả về: {items,total} hoặc mảng thuần
    const items = Array.isArray(res) ? res : (res?.items || res?.data || res?.list || []);
    setAnnouncements(items);
    const total = (typeof res?.total === 'number') ? res.total : items.length;
    setStats(prev => ({ ...prev, totalAnnouncements: total }));
  } catch (e) {
    console.error('fetchAnnouncements error:', e);
    showToast(e?.message || 'Không thể tải thông báo', 'error');
  } finally {
    setLoading(false);
  }
};

const createAnnouncement = async (payload) => {
  try {
    setLoading(true);
    // payload đến từ CreateAnnouncementModal: { content, type: 'system'|'class', classId?, status }
    const body = {
      title: (payload.content || '').trim().slice(0, 80) || 'Thông báo',
      message: payload.content || '',
      audience: payload.audience || 'all',
      status: payload.status || 'draft',
      tone: payload.tone || 'info'
    };
    const res = await api.admin.notices.create(body);
    const created = res?.notice || res?.data || res;
    if (created) {
      setAnnouncements(prev => [created, ...(prev || [])]);
      setStats(prev => ({ ...prev, totalAnnouncements: Number(prev.totalAnnouncements || 0) + 1 }));
    }
    showToast(body.status === 'published' ? 'Đã phát hành thông báo' : 'Đã lưu nháp thông báo');
    // Đồng bộ lại danh sách để chắc chắn
    try { await fetchAnnouncements(); } catch (_) {}
  } catch (e) {
    console.error('createAnnouncement error:', e);
    showToast(e?.message || 'Tạo thông báo thất bại', 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

// Update announcement (real API)
const updateAnnouncement = async (id, payload) => {
  try {
    setLoading(true);
    const body = {
      ...(payload.content !== undefined ? { message: payload.content, title: (payload.content || '').trim().slice(0, 80) } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {})
    };
    const res = await api.admin.notices.update(id, body);
    const updated = res?.notice || res?.data || res;
    if (updated && (updated.id !== undefined)) {
      setAnnouncements(prev => prev.map(a => (String(a.id) === String(id) ? { ...a, ...updated } : a)));
    } else {
      setAnnouncements(prev => prev.map(a => (String(a.id) === String(id) ? { ...a, ...body } : a)));
    }
    showToast('Cập nhật thông báo thành công');
    try { await fetchAnnouncements(); } catch (_) {}
  } catch (e) {
    console.error('updateAnnouncement error:', e);
    showToast(e?.message || 'Không thể cập nhật thông báo', 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

// Publish announcement (real API)
const publishAnnouncement = async (id) => {
  try {
    setLoading(true);
    await api.admin.notices.publish(id);
    setAnnouncements(prev => prev.map(a => (String(a.id) === String(id) ? { ...a, status: 'published' } : a)));
    showToast('Đã xuất bản thông báo');
    try { await fetchAnnouncements(); } catch (_) {}
  } catch (e) {
    console.error('publishAnnouncement error:', e);
    showToast(e?.message || 'Không thể xuất bản thông báo', 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

// Unpublish announcement (real API)
const unpublishAnnouncement = async (id) => {
  try {
    setLoading(true);
    await api.admin.notices.unpublish(id);
    setAnnouncements(prev => prev.map(a => (String(a.id) === String(id) ? { ...a, status: 'draft' } : a)));
    showToast('Đã chuyển về bản nháp');
    try { await fetchAnnouncements(); } catch (_) {}
  } catch (e) {
    console.error('unpublishAnnouncement error:', e);
    showToast(e?.message || 'Không thể gỡ thông báo', 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

// Delete announcement (real API)
const deleteAnnouncement = async (id) => {
  try {
    setLoading(true);
    await api.admin.notices.delete(id);
    setAnnouncements(prev => prev.filter(a => String(a.id) !== String(id)));
    setStats(prev => ({ ...prev, totalAnnouncements: Math.max(0, Number(prev.totalAnnouncements || 0) - 1) }));
    showToast('Xóa thông báo thành công');
    try { await fetchAnnouncements(); } catch (_) {}
  } catch (e) {
    console.error('deleteAnnouncement error:', e);
    showToast(e?.message || 'Không thể xóa thông báo', 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

// Delete user (real API)
const deleteUser = async (userId) => {
  try {
    setLoading(true);
    await api.admin.users.delete(userId);
    setUsers(prev => prev.filter(u => u._id !== userId));
    showToast('Đã xóa người dùng');
  } catch (e) {
    console.error('deleteUser error:', e);
    showToast('Không thể xóa người dùng.', 'error');
  } finally {
    setLoading(false);
  }
};

// Toggle user status (real API)
const toggleUserStatus = async (userKey, currentStatus) => {
  let previousUsers = null;
  try {
    setLoading(true);
    console.debug('[UI] toggleUserStatus called with', { userKey, currentStatus });

    // 1) Xác định user mục tiêu và serverId trước khi cập nhật state
    const keyStr = String(userKey);
    const target = (users || []).find(u => {
      const k = String(u._id ?? u.id ?? u.email);
      return k === keyStr;
    });
    const serverId = target?._id ?? target?.id ?? null;
    console.debug('[UI] toggleUserStatus target=', target, 'serverId=', serverId);

    // 2) Cập nhật lạc quan
    setUsers(prev => {
      previousUsers = prev;
      return prev.map(u => (
        String(u._id ?? u.id ?? u.email) === keyStr
          ? { ...u, isActive: !currentStatus }
          : u
      ));
    });

    // 3) Gọi API nếu có id từ server
    if (serverId) {
      await api.admin.users.update(serverId, { is_active: !currentStatus });
      // Refetch để đồng bộ trạng thái từ DB, tránh lệch dữ liệu sau reload
      await fetchUsers();
    } else {
      console.warn('[UI] toggleUserStatus: Không tìm thấy serverId, bỏ qua gọi API');
    }

    showToast(`Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`);
  } catch (e) {
    console.error('toggleUserStatus error:', e);
    // Rollback nếu thất bại
    if (previousUsers) setUsers(previousUsers);
    showToast('Không thể đổi trạng thái tài khoản.', 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

// Users (real API) — basic list without pagination controls (UI to be enhanced)
const fetchUsers = async () => {
  try {
    setLoading(true);
    const res = await api.admin.users.list({ page: 1, limit: 25, sortBy: 'createdAt', sortOrder: 'desc' });
    const items = res?.items || res?.data?.items || res?.data || res?.users || [];
    const normalized = Array.isArray(items)
      ? items.map(row => ({
          _id: row._id ?? row.id ?? row.userId ?? row.uuid ?? null,
          id: row.id ?? row._id ?? null,
          fullName: row.fullName ?? row.full_name ?? row.username ?? '',
          email: row.email ?? '',
          role: row.role ?? 'student',
          // Coerce is_active to boolean strictly to avoid '0' string being truthy
          isActive: (() => {
            const raw = (row.isActive ?? row.is_active);
            if (raw === undefined || raw === null) return true;
            if (typeof raw === 'boolean') return raw;
            if (typeof raw === 'number') return raw === 1;
            if (typeof raw === 'string') return raw === '1' || raw.toLowerCase() === 'true';
            return Boolean(raw);
          })(),
          createdAt: row.createdAt ?? row.created_at ?? null,
          avatar: row.avatar ?? null,
          username: row.username ?? null,
        }))
      : [];
    setUsers(normalized);
  } catch (e) {
    console.error('fetchUsers error:', e);
    setUsers([]);
    showToast('Không thể tải danh sách người dùng. Kiểm tra đăng nhập/ quyền admin.', 'error');
  } finally {
    setLoading(false);
  }
};

// API calls
const fetchStats = async (days = 30) => {
  try {
    setLoading(true);
    const data = await api.admin.overview(days);
    // Map đúng cấu trúc backend trả về: { totals: {...}, active: {...} }
    setStats({
      totalUsers: Number(data?.totals?.users ?? 0),
      totalClasses: Number(data?.totals?.classes ?? 0),
      totalAssignments: Number(data?.totals?.assignments ?? 0),
      totalAnnouncements: Number(data?.totals?.announcements ?? 0),
      activeStudents: Number(data?.active?.students ?? 0),
      activeTeachers: Number(data?.active?.teachers ?? 0)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Fallback hiển thị 0 khi lỗi
    setStats({
      totalUsers: 0,
      totalClasses: 0,
      totalAssignments: 0,
      totalAnnouncements: 0,
      activeStudents: 0,
      activeTeachers: 0
    });
    showToast('Không tải được số liệu tổng quan. Kiểm tra đăng nhập/ quyền admin.', 'error');
  } finally {
    setLoading(false);
  }
};

// Classes API (real backend)
const fetchClasses = async (params = {}) => {
  try {
    setLoading(true);
    const res = await api.admin.classes.list({ page: 1, limit: 50, ...params });
    const items = Array.isArray(res)
      ? res
      : (res?.items || res?.data || res?.results || []);
    const normalized = (items || []).map(it => {
      const studentsCount = it?.student_count ?? it?.students_count ?? it?.studentCount ?? it?.membersCount ?? it?.members_count ?? (Array.isArray(it?.students) ? it.students.length : 0);
      const assignmentsCount = it?.assignments_count ?? it?.assignmentCount ?? (Array.isArray(it?.assignments) ? it.assignments.length : 0);
      const teacherFullName = it?.teacher_name || it?.teacherFullName || it?.teacher?.fullName || it?.teacherInfo?.fullName || '';
      const hidden = it?.hidden ?? it?.isHidden ?? it?.is_hidden ?? false;
      return {
        _id: it?._id || it?.id,
        name: it?.name || '',
        classCode: it?.classCode || it?.class_code || it?.code || '',
        grade: String(it?.grade ?? it?.class_grade ?? ''),
        subject: it?.subject ?? it?.class_subject ?? '',
        description: it?.description ?? '',
        status: it?.status || (hidden ? 'archived' : 'active'),
        teacher: it?.teacher || it?.teacherInfo || (teacherFullName ? { fullName: teacherFullName } : null),
        // Convert counts to arrays for current UI which reads .length
        students: Array.isArray(it?.students) ? it.students : new Array(Math.max(0, Number(studentsCount) || 0)).fill(0),
        assignments: Array.isArray(it?.assignments) ? it.assignments : new Array(Math.max(0, Number(assignmentsCount) || 0)).fill(0),
        studentsCount: Number(studentsCount) || (Array.isArray(it?.students) ? it.students.length : 0),
        assignmentsCount: Number(assignmentsCount) || (Array.isArray(it?.assignments) ? it.assignments.length : 0),
        createdAt: it?.createdAt || it?.created_at,
        deletedAt: it?.deletedAt || it?.deleted_at
      };
    });
    setClasses(normalized);
  } catch (e) {
    console.error('fetchClasses error:', e);
    showToast('Không thể tải danh sách lớp học.', 'error');
  } finally {
    setLoading(false);
  }
};

const updateClass = async (id, payload) => {
  try {
    setLoading(true);
    const body = {
      ...(payload?.name !== undefined ? { name: payload.name } : {}),
      ...(payload?.description !== undefined ? { description: payload.description } : {}),
      ...(payload?.subject !== undefined ? { subject: payload.subject } : {}),
      ...(payload?.grade !== undefined ? { grade: payload.grade } : {}),
      ...(payload?.status !== undefined ? { status: payload.status } : {}),
      ...(payload?.classCode !== undefined ? { class_code: payload.classCode } : {}),
    };
    await api.admin.classes.update(id, body);
    await fetchClasses();
    showToast('Cập nhật lớp học thành công');
  } catch (e) {
    console.error('updateClass error:', e);
    showToast('Không thể cập nhật lớp học.', 'error');
    throw e;
  } finally {
    setLoading(false);
  }
};

const deleteClass = async (id) => {
  try {
    setLoading(true);
    await api.admin.classes.delete(id);
    await fetchClasses();
    showToast('Đã xóa lớp (xóa mềm)');
  } catch (e) {
    console.error('deleteClass error:', e);
    showToast('Không thể xóa lớp.', 'error');
  } finally {
    setLoading(false);
  }
};

// Create class (real API; backend tự sinh mã nếu không cung cấp)
const createClass = async (payload) => {
  try {
    setLoading(true);
    const body = {
      name: (payload?.name || '').trim(),
      description: payload?.description || '',
      subject: payload?.subject || '',
      grade: payload?.grade || '',
      status: payload?.status || 'active',
      ...(payload?.classCode ? { class_code: payload.classCode } : {}),
      ...(payload?.teacherId ? { teacher_id: payload.teacherId } : {})
    };
    if (!body.name) throw new Error('Vui lòng nhập tên lớp');
    await api.admin.classes.create(body);
    await fetchClasses();
    showToast('Tạo lớp học thành công');
  } catch (e) {
    console.error('createClass error:', e);
    showToast(e?.message || 'Không thể tạo lớp học.', 'error');
  } finally {
    setLoading(false);
  }
};

// Toggle visibility and restore (available for future UI controls)
const toggleClassVisibility = async (id) => {
  try {
    setLoading(true);
    await api.admin.classes.toggleVisibility(id);
    await fetchClasses();
    showToast('Đã thay đổi trạng thái hiển thị lớp');
  } catch (e) {
    console.error('toggleClassVisibility error:', e);
    showToast('Không thể đổi trạng thái hiển thị lớp.', 'error');
  } finally {
    setLoading(false);
  }
};

const restoreClass = async (id) => {
  try {
    setLoading(true);
    await api.admin.classes.restore(id);
    await fetchClasses();
    showToast('Đã khôi phục lớp');
  } catch (e) {
    console.error('restoreClass error:', e);
    showToast('Không thể khôi phục lớp.', 'error');
  } finally {
    setLoading(false);
  }
};

// Assignments API
const fetchAssignments = async () => {
  try {
    // Frontend-only: dùng mock assignments
    setAssignments([
      {
        _id: '1',
        title: 'Bài tập Toán - Hàm số bậc hai',
        description: 'Giải các bài tập về hàm số bậc hai và đồ thị',
        className: 'Toán học 10A1',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalPoints: 100,
        submissions: new Array(10),
        graded: new Array(5),
        status: 'published'
      }
    ]);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    // Mock fallback data to keep UI functional
    setAssignments([
      {
        _id: '1',
        title: 'Bài tập Toán - Hàm số bậc hai',
        description: 'Giải các bài tập về hàm số bậc hai và đồ thị',
        className: 'Toán học 10A1',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalPoints: 100,
        submissions: new Array(10),
        graded: new Array(5),
        status: 'published'
      }
    ]);
  }
};

const createAssignment = async (payload) => {
  try {
    setLoading(true);
    // Frontend-only: tạo cục bộ
    const newItem = {
      _id: String(Date.now()),
      title: payload.title,
      description: payload.description,
      className: (classes && classes[0]?.name) || 'Lớp A',
      dueDate: payload.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalPoints: payload.totalPoints || 100,
      submissions: [],
      graded: [],
      status: payload.status || 'draft'
    };
    setAssignments(prev => [newItem, ...(prev || [])]);
    showToast('Tạo bài tập thành công (cục bộ)');
  } catch (e) {
    console.error(e);
    showToast('Có lỗi xảy ra khi tạo bài tập', 'error');
  } finally {
    setLoading(false);
  }
};

  // Disable page scroll while dashboard is mounted
  useEffect(() => {
    document.body.classList.add('admin-no-scroll');
    return () => {
      document.body.classList.remove('admin-no-scroll');
    };
  }, []);

  // Load data on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('🏁 AdminDashboard mounted, fetching data...');
    fetchStats();
    fetchUsers();
    fetchClasses();
    fetchAssignments();
    fetchAnnouncements();
  }, []);
 
  return (
    <div className="enhanced-admin-dashboard">
      {/* Admin Header */}
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllNotificationsRead}
        onSeeAll={() => setActiveTab('announcements')}
        onClickNotification={handleClickNotification}
      />
      
      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Main Content */}
      <div className={`admin-main-content${modal ? ' no-scroll' : ''}`}>
        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            onCardNavigate={(target) => {
              const allowed = new Set(['users', 'classes', 'assignments', 'announcements']);
              const t = allowed.has(target) ? target : 'dashboard';
              setActiveTab(t);
              if (t !== 'dashboard') {
                navigate(`/admin/${t}`);
              } else {
                navigate('/admin/dashboard');
              }
            }}
          />
        )}
        {activeTab === 'users' && (
          <UsersView
            users={users}
            onToggleStatus={toggleUserStatus}
            onEdit={(user) => setModal({ type: 'editUser', data: user })}
            onDelete={deleteUser}
            onAdd={() => setModal({ type: 'addUser' })}
          />
        )}
        {activeTab === 'classes' && (
          <ClassesView
            classes={classes}
            onAdd={() => setModal({ type: 'addClass' })}
            onEdit={(cls) => setModal({ type: 'editClass', data: cls })}
            onDelete={(cls) => setModal({ type: 'confirmDeleteClass', data: cls })}
          />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsView
            assignments={assignments}
            onAdd={() => setModal({ type: 'addAssignment' })}
            onEdit={(a) => setModal({ type: 'editAssignment', data: a })}
            onView={(a) => setModal({ type: 'viewAssignment', data: a })}
            onDelete={(a) => setModal({ type: 'confirmDeleteAssignment', data: a })}
          />
        )}
        {activeTab === 'announcements' && (
          <AnnouncementsView
            announcements={announcements}
            onAdd={async () => {
              try { await fetchClasses(); } catch {}
              setModal({ type: 'addAnnouncement' });
            }}
            onEdit={(a) => setModal({ type: 'editAnnouncement', data: a })}
            onDelete={async (a) => {
              setModal({ type: 'confirmDeleteAnnouncement', data: a });
            }}
            onPublish={(a) => publishAnnouncement(a.id || a._id)}
            onUnpublish={(a) => unpublishAnnouncement(a.id || a._id)}
          />
        )}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(null)}
          size={
            modal.type === 'addClass'
              ? 'wide'
              : modal.type === 'addAssignment'
              ? 'wide'
              : (modal.type === 'confirmDeleteClass' || modal.type === 'confirmDeleteAssignment' || modal.type === 'confirmDeleteAnnouncement')
              ? 'small'
              : 'medium'
          }
        >
          {modal.type === 'editUser' && (
            <EditUserForm
              user={modal.data}
              onSave={async (userData) => {
                try {
                  // Xác định serverId chắc chắn trước khi gọi API
                  const original = modal.data || {};
                  const key = String(original._id ?? original.id ?? original.email ?? '');
                  const target = (users || []).find(u => String(u._id ?? u.id ?? u.email) === key);
                  const serverId = target?._id ?? target?.id ?? original?._id ?? original?.id ?? null;
                  if (!serverId) {
                    console.warn('[UI] EditUser onSave: không tìm thấy serverId cho', original);
                    showToast('Không xác định được người dùng để cập nhật.', 'error');
                    return;
                  }
                  await updateUser(serverId, userData);
                  setModal(null);
                } catch (e) {
                  // updateUser đã hiển thị toast lỗi
                }
              }}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === 'addUser' && (
            <AddUserForm
              onSave={async (userData) => {
                await createUser(userData);
                setModal(null);
              }}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === 'addClass' && (
            <AddClassForm
              onSave={async (classData) => {
                await createClass(classData);
                setModal(null);
              }}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === 'editClass' && (
            <EditClassForm
              cls={modal.data}
              onSave={async (data) => {
                await updateClass(modal.data._id, data);
                setModal(null);
              }}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === 'confirmDeleteClass' && (
            <div className="confirm-dialog">
              <h3>Xóa lớp học</h3>
              <p>Bạn có chắc muốn xóa lớp "{modal.data?.name}"? Thao tác này không thể hoàn tác.</p>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={async () => { await deleteClass(modal.data._id); setModal(null); }}>Xóa</button>
              </div>
            </div>
          )}
          {modal.type === 'addAssignment' && (
            <CreateAssignmentModal
              classesOptions={classes.map(c => ({ value: c._id, label: c.name }))}
              onSave={async (assignmentData) => {
                await createAssignment(assignmentData);
                setModal(null);
              }}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === 'editAssignment' && (
            <EditAssignmentForm
              assignment={modal.data}
              classesOptions={classes.map(c => ({ value: c._id, label: c.name }))}
              onSave={async (data) => {
                await updateAssignment(modal.data._id, data);
                setModal(null);
              }}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === 'viewAssignment' && (
            <div className="view-assignment-modal">
              {(() => {
                const a = modal.data || {};
                const classId = a.classId ?? a.class_id ?? a.classID;
                const className = a.className || a.class_name || (classes.find(c => String(c._id) === String(classId))?.name);
                const dueRaw = a.dueDate || a.due_date || a.deadline || a.end_time;
                const dueDate = dueRaw ? new Date(dueRaw) : null;
                const totalPoints = (a.totalPoints ?? a.max_score ?? a.maxPoints ?? (a.type === 'quiz' ? undefined : 100));
                const status = a.status || (dueDate ? (Date.now() > dueDate.getTime() ? 'Quá hạn' : 'Đang mở') : '');
                const teacherName = a.teacher_name || a.teacherName || a.created_by_name || '';
                const typeLabel = a.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập';
                // Clean description: remove URLs and 'Tài liệu:' prefix
                const rawDesc = String(a.description || '').trim();
                const descNoUrl = rawDesc.replace(/https?:\/\/\S+/gi, '').trim();
                const cleanedDesc = descNoUrl.replace(/^Tài liệu:\s*/i, '').trim();
                return (
                  <>
                    <div className="vam-header">
                      <h3 className="vam-title">{a.title || 'Chi tiết bài tập'}</h3>
                      <span className={`badge ${a.type === 'quiz' ? 'badge-warning' : 'badge-info'}`}>{typeLabel}</span>
                    </div>

                    <div className="vam-meta-grid">
                      <div className="meta-item">
                        <div className="meta-label">Lớp</div>
                        <div className="meta-value">{className || '—'}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Giáo viên</div>
                        <div className="meta-value">{teacherName || '—'}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Hạn nộp</div>
                        <div className="meta-value">{dueDate ? dueDate.toLocaleString() : '—'}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Trạng thái</div>
                        <div className={`meta-value ${status === 'Quá hạn' ? 'text-danger' : ''}`}>{status || '—'}</div>
                      </div>
                      {totalPoints !== undefined && totalPoints !== null ? (
                        <div className="meta-item">
                          <div className="meta-label">Điểm tối đa</div>
                          <div className="meta-value">{totalPoints}</div>
                        </div>
                      ) : null}
                    </div>

                    {cleanedDesc ? (
                      <div className="vam-description">{cleanedDesc}</div>
                    ) : null}

                    <div className="form-actions">
                      <button className="btn" onClick={() => setModal(null)}>Đóng</button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          {modal.type === 'confirmDeleteAssignment' && (
            <div className="confirm-dialog">
              <h3>Xóa bài tập</h3>
              <p>Bạn có chắc muốn xóa bài tập "{modal.data?.title}"? Thao tác này không thể hoàn tác.</p>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={async () => { await deleteAssignment(modal.data._id); setModal(null); }}>Xóa</button>
              </div>
            </div>
          )}
          {modal.type === 'addAnnouncement' && (
            <CreateAnnouncementModal
              classesOptions={classes.map(c => ({ value: c._id, label: c.name }))}
              onSave={async (announcementData) => {
                await createAnnouncement(announcementData);
                setModal(null);
              }}
              onCancel={() => setModal(null)}
              onPublish={async (announcementData) => {
                await createAnnouncement(announcementData);
                setModal(null);
              }}
            />
          )}
          {modal.type === 'editAnnouncement' && (
            <EditAnnouncementForm
              announcement={modal.data}
              classesOptions={classes.map(c => ({ value: c._id, label: c.name }))}
              onSave={async (data) => {
                await updateAnnouncement(modal.data.id, data);
                setModal(null);
              }}
              onCancel={() => setModal(null)}
            />
          )}
          {modal.type === 'confirmDeleteAnnouncement' && (
            <div className="confirm-dialog">
              <h3>Xóa thông báo</h3>
              <p>Bạn có chắc muốn xóa thông báo này? Thao tác này không thể hoàn tác.</p>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={async () => { await deleteAnnouncement(modal.data.id); setModal(null); }}>Xóa</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// Edit Announcement Form (top-level)
const EditAnnouncementForm = ({ announcement, classesOptions = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    content: announcement?.message || '',
    type: announcement?.type === 'class' ? 'class' : 'system',
    classId: announcement?.classId || classesOptions[0]?.value || '',
    status: announcement?.status || 'draft'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="create-assignment-form">
      <div className="form-header">
        <div>
          <h3>Chỉnh sửa thông báo</h3>
          <p>Cập nhật nội dung và phạm vi thông báo</p>
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
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="form-input"
            >
              <option value="system">Hệ thống</option>
              <option value="class">Theo lớp</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
        </div>

        {formData.type === 'class' && (
          <div className="form-group">
            <label>Chọn lớp</label>
            <div className="select-with-arrow">
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="form-input"
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
        )}

        <div className="form-group">
          <label>Trạng thái</label>
          <div className="select-with-arrow">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-input"
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
        <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
      </div>
    </form>
  );
};

// Modal Component
const Modal = ({ children, onClose, size }) => (
  <div className={`modal-overlay${size === 'fullscreen' ? ' modal-overlay--fullscreen' : ''}`} onClick={onClose}>
    <div className={`modal-content${size === 'wide' ? ' modal-wide' : ''}${size === 'fullscreen' ? ' modal-fullscreen' : ''}${size === 'small' ? ' modal-small' : ''}${size === 'medium' ? ' modal-medium' : ''}`} onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><IconClose /></button>
      <div className="modal-body">
        {children}
      </div>
    </div>
  </div>
);

// Dashboard Overview Component
const DashboardView = ({ stats, onCardNavigate }) => (
  <div className="dashboard-view">
    <div className="dashboard-header">
      <h1>Tổng quan hệ thống</h1>
      <p>Thống kê tổng quan về hoạt động của hệ thống LMS</p>
    </div>
    
    <div className="dashboard-stats-grid">
      <div
        className="stat-card"
        role="button"
        tabIndex={0}
        aria-label="Đi tới Người dùng"
        onClick={() => onCardNavigate && onCardNavigate('users')}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onCardNavigate) onCardNavigate('users'); }}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-icon"><IconUsers /></div>
        <div className="stat-content">
          <h3>{stats.totalUsers}</h3>
          <p>Tổng người dùng</p>
        </div>
      </div>
      
      <div
        className="stat-card"
        role="button"
        tabIndex={0}
        aria-label="Đi tới Người dùng"
        onClick={() => onCardNavigate && onCardNavigate('users')}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onCardNavigate) onCardNavigate('users'); }}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-icon"><IconGraduationCap /></div>
        <div className="stat-content">
          <h3>{stats.activeStudents}</h3>
          <p>Học sinh hoạt động</p>
        </div>
      </div>
      
      <div
        className="stat-card"
        role="button"
        tabIndex={0}
        aria-label="Đi tới Người dùng"
        onClick={() => onCardNavigate && onCardNavigate('users')}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onCardNavigate) onCardNavigate('users'); }}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-icon"><IconChalkboard /></div>
        <div className="stat-content">
          <h3>{stats.activeTeachers}</h3>
          <p>Giáo viên hoạt động</p>
        </div>
      </div>
      
      <div
        className="stat-card"
        role="button"
        tabIndex={0}
        aria-label="Đi tới Lớp học"
        onClick={() => onCardNavigate && onCardNavigate('classes')}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onCardNavigate) onCardNavigate('classes'); }}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-icon"><IconChalkboard /></div>
        <div className="stat-content">
          <h3>{stats.totalClasses}</h3>
          <p>Lớp học</p>
        </div>
      </div>
      
      <div
        className="stat-card"
        role="button"
        tabIndex={0}
        aria-label="Đi tới Bài tập"
        onClick={() => onCardNavigate && onCardNavigate('assignments')}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onCardNavigate) onCardNavigate('assignments'); }}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-icon"><IconClipboardList /></div>
        <div className="stat-content">
          <h3>{stats.totalAssignments}</h3>
          <p>Bài tập</p>
        </div>
      </div>
      
      <div
        className="stat-card"
        role="button"
        tabIndex={0}
        aria-label="Đi tới Thông báo"
        onClick={() => onCardNavigate && onCardNavigate('announcements')}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onCardNavigate) onCardNavigate('announcements'); }}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-icon"><IconBullhorn /></div>
        <div className="stat-content">
          <h3>{stats.totalAnnouncements}</h3>
          <p>Thông báo</p>
        </div>
      </div>
    </div>
  </div>
);

// Edit User Form
const EditUserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    fullName: user.fullName || '',
    email: user.email || '',
    role: user.role || 'student',
    isActive: user.isActive || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {
      ...formData,
      username: (formData.username || '').trim(),
      fullName: (formData.fullName || '').trim(),
      email: (formData.email || '').trim(),
    };
    onSave(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-user-form">
      <h3>Chỉnh sửa người dùng</h3>
      
      <div className="form-group">
        <label>Tên đăng nhập (username):</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Họ tên:</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Vai trò:</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="student">Học sinh</option>
          <option value="teacher">Giáo viên</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
          />
          Tài khoản hoạt động
        </label>
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
};

export default EnhancedAdminDashboard;
