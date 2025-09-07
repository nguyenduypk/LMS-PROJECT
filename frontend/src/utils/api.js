export const API_BASE_URL = 'http://localhost:5000/api';

// Helper function để tạo headers với token
const getAuthHeaders = () => {
  // Sử dụng sessionStorage thay vì localStorage để tránh conflict giữa các tab
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API functions
export const api = {
  // ===== Generic HTTP helpers (allow api.get('/admin/assignments?...')) =====
  get: async (path) => {
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = getAuthHeaders();
    const response = await fetch(url, { headers });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    try {
      console.debug('[API] GET', url, 'status=', response.status, 'hasToken=', !!sessionStorage.getItem('token'));
    } catch (_) {}
    if (!response.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
      throw new Error(msg);
    }
    // For consistency with axios-like usage in some places
    return { data, status: response.status };
  },

  delete: async (path) => {
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = getAuthHeaders();
    const response = await fetch(url, { method: 'DELETE', headers });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    try {
      console.debug('[API] DELETE', url, 'status=', response.status, 'hasToken=', !!sessionStorage.getItem('token'));
    } catch (_) {}
    if (!response.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return { data, status: response.status };
  },

  post: async (path, payload) => {
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = getAuthHeaders();
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload ?? {}) });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    try {
      console.debug('[API] POST', url, 'status=', response.status, 'hasToken=', !!sessionStorage.getItem('token'));
    } catch (_) {}
    if (!response.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return { data, status: response.status };
  },

  put: async (path, payload) => {
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = getAuthHeaders();
    const response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload ?? {}) });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    try {
      console.debug('[API] PUT', url, 'status=', response.status, 'hasToken=', !!sessionStorage.getItem('token'));
    } catch (_) {}
    if (!response.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
      throw new Error(msg);
    }
    return { data, status: response.status };
  },
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      return response.json();
    },

    register: async (userData) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      return response.json();
    },

    logout: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    getCurrentUser: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    changePassword: async (passwordData) => {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });
      return response.json();
    }
  },

  // Quiz Assignments endpoints (trắc nghiệm)
  quiz: {
    // Danh sách bài trắc nghiệm theo lớp
    listByClass: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/class/${classId}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Chi tiết cho giáo viên (kèm câu hỏi + đáp án)
    getDetails: async (quizId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}/details`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Tạo bài trắc nghiệm (teacher)
    create: async (payload) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return response.json();
    },

    // Cập nhật bài trắc nghiệm (teacher)
    update: async (quizId, payload) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return response.json();
    },

    // Xóa bài trắc nghiệm (teacher)
    delete: async (quizId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Học sinh lấy đề để làm
    take: async (quizId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}/take`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Bắt đầu attempt (student)
    start: async (quizId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}/start`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lưu câu trả lời (student)
    saveAnswer: async (attemptId, payload) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/attempt/${attemptId}/answer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return response.json();
    },

    // Lấy câu trả lời đã lưu của attempt (student)
    getAttemptAnswers: async (attemptId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/attempt/${attemptId}/answers`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Nộp bài làm (student)
    submitAttempt: async (attemptId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/attempt/${attemptId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Xem kết quả attempt (teacher hoặc student nếu được phép)
    getAttemptResult: async (attemptId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/attempt/${attemptId}/result`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Danh sách attempts của chính học sinh cho 1 quiz
    getMyAttempts: async (quizId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}/attempts/mine`, {
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },

  // Documents endpoints
  documents: {
    listByClass: async (classId, opts = {}) => {
      const { excludeAttachments = false } = opts || {};
      const url = `${API_BASE_URL}/documents/class/${classId}?excludeAttachments=${excludeAttachments ? '1' : '0'}`;
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    upload: async ({ classId, file, title, description, isAttachment }) => {
      const token = sessionStorage.getItem('token');
      const form = new FormData();
      if (classId) form.append('classId', classId);
      if (title) form.append('title', title);
      if (description) form.append('description', description);
      if (typeof isAttachment !== 'undefined') form.append('isAttachment', isAttachment ? '1' : '0');
      form.append('file', file);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: form
      });
      // Throw on HTTP error so caller can show the correct message
      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const data = await response.json();
          if (data) {
            if (data.message) errMsg = data.message;
            if (data.error) errMsg = `${errMsg}: ${data.error}`;
          }
        } catch (_) {
          try { errMsg = await response.text(); } catch (_) {}
        }
        throw new Error(errMsg || 'Upload failed');
      }
      return response.json();
    },

    download: async (id) => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (!response.ok) {
        const errTxt = await response.text();
        throw new Error(errTxt || `HTTP ${response.status}`);
      }
      // Try to extract filename from Content-Disposition
      let filename = `document-${id}`;
      const cd = response.headers.get('Content-Disposition');
      if (cd) {
        const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const raw = decodeURIComponent((match && (match[1] || match[2])) || '').trim();
        if (raw) filename = raw;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },

    viewInline: async (id) => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/documents/${id}/download?inline=1`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (!response.ok) {
        const errTxt = await response.text();
        throw new Error(errTxt || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      // Do not revoke immediately; give the new tab time to load.
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    },

    remove: async (id) => {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    create: async (documentData) => {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(documentData)
      });
      return response.json();
    },

    // Lấy tất cả tài liệu
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lấy tài liệu theo id
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Cập nhật tài liệu
    update: async (id, documentData) => {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(documentData)
      });
      return response.json();
    },

    // Xóa tài liệu
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },

  // Notices endpoints (system-wide announcements)
  notices: {
    // Lấy thông báo đang hiệu lực theo vai trò: student | teacher
    getActive: async (role = 'all') => {
      const url = `${API_BASE_URL}/notices/active?role=${encodeURIComponent(role)}`;
      const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      return data;
    },

    // Danh sách thông báo đang xuất bản (phục vụ menu tổng hợp)
    list: async (limit = 10) => {
      const url = `${API_BASE_URL}/notices?limit=${encodeURIComponent(limit)}`;
      const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      return response.json();
    }
  },

  // User endpoints
  users: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    update: async (id, userData) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });
      return response.json();
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },

  // Class endpoints
  classes: {
    // Lấy lớp học theo mã
    getByCode: async (classCode) => {
      const response = await fetch(`${API_BASE_URL}/classes/code/${classCode}`, {
        headers: getAuthHeaders()
      });
      let json = {};
      try {
        json = await response.json();
      } catch (_) {
        json = {};
      }
      if (!response.ok) {
        const err = new Error(json?.message || `HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }
      return json;
    },

    // Lấy tất cả lớp học (cho học sinh)
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/classes`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lấy danh sách lớp học của giáo viên
    getTeacherClasses: async (showHidden = false) => {
      const response = await fetch(`${API_BASE_URL}/classes/teacher?showHidden=${showHidden}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lấy danh sách lớp học đã xóa
    getDeletedClasses: async () => {
      const response = await fetch(`${API_BASE_URL}/classes/deleted`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    create: async (classData) => {
      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData)
      });
      return response.json();
    },

    update: async (id, classData) => {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData)
      });
      return response.json();
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Ẩn/Hiện lớp học
    toggleVisibility: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/toggle-visibility`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      return response.json();
    },

                // Khôi phục lớp học
            restore: async (classId) => {
              const response = await fetch(`${API_BASE_URL}/classes/${classId}/restore`, {
                method: 'PATCH',
                headers: getAuthHeaders()
              });
              return response.json();
            },
            // Tham gia lớp học bằng mã
            joinByCode: async (classCode) => {
              const response = await fetch(`${API_BASE_URL}/classes/join`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ classCode })
              });
              return response.json();
            },
            // Lấy thông tin lớp học theo mã
            getByCode: async (classCode) => {
              const response = await fetch(`${API_BASE_URL}/classes/code/${classCode}`, {
                headers: getAuthHeaders()
              });
              let json = {};
              try {
                json = await response.json();
              } catch (_) {
                json = {};
              }
              if (!response.ok) {
                const err = new Error(json?.message || `HTTP ${response.status}`);
                err.status = response.status;
                throw err;
              }
              return json;
            },

            // Lấy danh sách lớp học của học sinh
            getStudentClasses: async () => {
              const response = await fetch(`${API_BASE_URL}/classes/student`, {
                headers: getAuthHeaders()
              });
              return response.json();
            },

    join: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/join`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    leave: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/leave`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Join request management
    getJoinRequests: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/join-requests`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    approveJoinRequest: async (classId, requestId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/join-requests/${requestId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    rejectJoinRequest: async (classId, requestId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/join-requests/${requestId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    getMembers: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/members`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lấy tổng quan của 1 học sinh trong lớp (teacher hoặc chính học sinh)
    getMemberOverview: async (classId, studentId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/members/${studentId}/overview`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lấy hoạt động (assignments + quizzes) của 1 học sinh trong lớp
    getMemberActivities: async (classId, studentId, params = {}) => {
      const { q = '', type = 'all', page = 1, limit = 20 } = params;
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (type) qs.set('type', type);
      if (page) qs.set('page', String(page));
      if (limit) qs.set('limit', String(limit));
      const url = `${API_BASE_URL}/classes/${classId}/members/${studentId}/activities${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      return response.json();
    },

    // Giáo viên xóa học sinh khỏi lớp
    removeMember: async (classId, studentId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/members/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Thêm học sinh trực tiếp vào lớp học
    addStudent: async (classId, studentData) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/add-student`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData)
      });
      return response.json();
    },

    // ===== ANNOUNCEMENT ENDPOINTS =====
    
    // Tạo thông báo mới
    createAnnouncement: async (classId, content) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/announcements`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });
      return response.json();
    },

    // Lấy danh sách thông báo
    getAnnouncements: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/announcements`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Cập nhật thông báo
    updateAnnouncement: async (classId, announcementId, content) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/announcements/${announcementId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });
      return response.json();
    },

    // Xóa thông báo
    deleteAnnouncement: async (classId, announcementId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // ===== COMMENT ENDPOINTS =====
    
    // Tạo bình luận mới
    createComment: async (classId, announcementId, content) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });
      return response.json();
    },

    // Lấy danh sách bình luận
    getComments: async (classId, announcementId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/announcements/${announcementId}/comments`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Xóa bình luận
    deleteComment: async (classId, announcementId, commentId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/announcements/${announcementId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // ===== SCHEDULE ENDPOINTS =====
    
    // Tạo lịch học mới
    createSchedule: async (classId, scheduleData) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData)
      });
      return response.json();
    },

    // Lấy danh sách lịch học
    getSchedules: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedules`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Cập nhật lịch học
    updateSchedule: async (classId, scheduleId, scheduleData) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData)
      });
      return response.json();
    },

    // Xóa lịch học
    deleteSchedule: async (classId, scheduleId) => {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },



  // Assignment endpoints
  assignments: {
    getAll: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/assignments?classId=${classId}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    create: async (assignmentData) => {
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData)
      });
      return response.json();
    },

    update: async (id, assignmentData) => {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData)
      });
      return response.json();
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.json();
    },

    submit: async (assignmentId, submissionData) => {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(submissionData)
      });
      return response.json();
    },

    // Lấy danh sách submissions của một assignment (teacher only)
    getSubmissions: async (assignmentId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submissions`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Quiz: lấy chi tiết bài quiz (teacher)
    getQuizDetails: async (quizId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}/details`, {
        headers: getAuthHeaders()
      });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      // Trả kèm status để caller phân biệt 404/403
      return { ok: response.ok, status: response.status, data };
    },

    // Quiz: chi tiết theo học sinh (teacher)
    getQuizStudentDetails: async (quizId, studentId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}/student/${studentId}/details`, {
        headers: getAuthHeaders()
      });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      return { ok: response.ok, status: response.status, data };
    },

    // Quiz: tổng quan bài trắc nghiệm (teacher)
    getQuizOverview: async (quizId) => {
      const response = await fetch(`${API_BASE_URL}/assignments/quiz/${quizId}/overview`, {
        headers: getAuthHeaders()
      });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      return { ok: response.ok, status: response.status, data };
    }
  },

  // Attendance endpoints
  attendance: {
    // Lấy danh sách điểm danh của một buổi học
    getBySchedule: async (scheduleId) => {
      const response = await fetch(`${API_BASE_URL}/attendance/schedule/${scheduleId}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Điểm danh học sinh
    mark: async (scheduleId, studentIds, status = 'present', notes = '') => {
      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scheduleId, studentIds, status, notes })
      });
      return response.json();
    },

    // Hủy điểm danh học sinh
    unmark: async (scheduleId, studentIds) => {
      const response = await fetch(`${API_BASE_URL}/attendance/unmark`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scheduleId, studentIds })
      });
      return response.json();
    },

    // Lấy thống kê điểm danh của một lớp
    getStats: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/attendance/stats/class/${classId}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },

  // Schedule endpoints
  schedules: {
    // Tạo lịch học mới
    create: async (scheduleData) => {
      const response = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },

    // Lấy lịch học của một lớp cụ thể
    getByClass: async (classId) => {
      const response = await fetch(`${API_BASE_URL}/schedules/class/${classId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },

    // Lấy lịch học tổng hợp của giáo viên
    getTeacherSchedule: async () => {
      const response = await fetch(`${API_BASE_URL}/schedules/teacher`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lấy lịch học tổng hợp của học sinh
    getStudentSchedule: async () => {
      const response = await fetch(`${API_BASE_URL}/schedules/student`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Cập nhật lịch học
    update: async (scheduleId, scheduleData) => {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },

    // Xóa lịch học
    delete: async (scheduleId) => {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },

    // Lấy lịch học theo ngày cụ thể
    getByDate: async (date) => {
      const response = await fetch(`${API_BASE_URL}/schedules/date/${date}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Lấy lịch học theo ID
    getById: async (scheduleId) => {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },

    // Kết thúc phòng học
    endSession: async (scheduleId) => {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/end`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },

  // Student endpoints
  student: {
    // Lấy dữ liệu tổng quan dashboard học sinh
    getDashboard: async () => {
      const url = `${API_BASE_URL}/student/dashboard`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }
      if (!response.ok) {
        const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
        throw new Error(msg);
      }
      return data || {};
    }
  },

  // Admin endpoints
  admin: {
    // Overview counters for admin dashboard
    overview: async (days = 30) => {
      const response = await fetch(`${API_BASE_URL}/admin/overview?days=${encodeURIComponent(days)}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },
    // Users management (admin only)
    users: {
      // List with pagination, search, filter
      list: async (params = {}) => {
        const {
          search = '',
          role = '',
          page = 1,
          limit = 10,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = params;
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (role) qs.set('role', role);
        if (page) qs.set('page', String(page));
        if (limit) qs.set('limit', String(limit));
        if (sortBy) qs.set('sortBy', sortBy);
        if (sortOrder) qs.set('sortOrder', sortOrder);
        const url = `${API_BASE_URL}/admin/users${qs.toString() ? `?${qs.toString()}` : ''}`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        try {
          const data = await response.json();
          console.debug('[API] GET', url, 'status=', response.status, 'items=', Array.isArray(data?.items) ? data.items.length : undefined);
          return data;
        } catch (e) {
          console.debug('[API] GET', url, 'status=', response.status, '(no json)');
          throw e;
        }
      },
      // Create a new user
      create: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        return response.json();
      },
      // Update user by id
      update: async (id, payload) => {
        const url = `${API_BASE_URL}/admin/users/${id}`;
        console.debug('[API] PUT', url, 'payload=', payload);
        const response = await fetch(url, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        let data = null;
        try {
          data = await response.json();
        } catch (_) {}
        console.debug('[API] PUT', url, 'status=', response.status, 'response=', data);
        if (!response.ok) {
          const msg = data?.message || `HTTP ${response.status}`;
          throw new Error(msg);
        }
        return data;
      },
      // Delete user by id
      delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return response.json();
      }
    },
    // Classes management (admin only)
    classes: {
      // List with filters and pagination
      list: async (params = {}) => {
        const {
          search = '',
          teacherId = '',
          grade = '',
          subject = '',
          showHidden = '', // boolean or ''
          showDeleted = '', // boolean or ''
          page = 1,
          limit = 20,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = params;
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (teacherId) qs.set('teacherId', String(teacherId));
        if (grade) qs.set('grade', String(grade));
        if (subject) qs.set('subject', subject);
        if (showHidden !== '') qs.set('showHidden', String(showHidden));
        if (showDeleted !== '') qs.set('showDeleted', String(showDeleted));
        if (page) qs.set('page', String(page));
        if (limit) qs.set('limit', String(limit));
        if (sortBy) qs.set('sortBy', String(sortBy));
        if (sortOrder) qs.set('sortOrder', String(sortOrder));
        const url = `${API_BASE_URL}/admin/classes${qs.toString() ? `?${qs.toString()}` : ''}`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        let data = null;
        try { data = await response.json(); } catch (_) {}
        return data;
      },
      // Create a new class (backend auto-generates class_code if omitted)
      create: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/admin/classes`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        let data = null;
        try { data = await response.json(); } catch (_) {}
        if (!response.ok) {
          const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
          throw new Error(msg);
        }
        return data;
      },
      // Update class by id
      update: async (id, payload) => {
        const response = await fetch(`${API_BASE_URL}/admin/classes/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        return response.json();
      },
      // Toggle visibility
      toggleVisibility: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/classes/${id}/toggle-visibility`, {
          method: 'PATCH',
          headers: getAuthHeaders()
        });
        return response.json();
      },
      // Soft delete
      delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/classes/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return response.json();
      },
      // Restore soft-deleted class
      restore: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/classes/${id}/restore`, {
          method: 'PATCH',
          headers: getAuthHeaders()
        });
        return response.json();
      }
    },
    // Notices management (admin only)
    notices: {
      // List notices with filters & pagination
      list: async (params = {}) => {
        const {
          search = '',
          status = '', // draft|published
          audience = '', // all|teacher|student
          includeDeleted = '', // true|false or ''
          page = 1,
          limit = 10,
          sortBy = 'created_at',
          sortOrder = 'desc'
        } = params;
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (status) qs.set('status', status);
        if (audience) qs.set('audience', audience);
        if (includeDeleted !== '') qs.set('includeDeleted', String(includeDeleted));
        if (page) qs.set('page', String(page));
        if (limit) qs.set('limit', String(limit));
        if (sortBy) qs.set('sortBy', String(sortBy));
        if (sortOrder) qs.set('sortOrder', String(sortOrder));
        const url = `${API_BASE_URL}/admin/notices${qs.toString() ? `?${qs.toString()}` : ''}`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        let data = null;
        try { data = await response.json(); } catch (_) {}
        return data;
      },
      // Create new notice
      create: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/admin/notices`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        let data = null;
        try { data = await response.json(); } catch (_) {}
        if (!response.ok) {
          const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
          throw new Error(msg);
        }
        return data;
      },
      // Update notice by id
      update: async (id, payload) => {
        const response = await fetch(`${API_BASE_URL}/admin/notices/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        let data = null;
        try { data = await response.json(); } catch (_) {}
        if (!response.ok) {
          const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
          throw new Error(msg);
        }
        return data;
      },
      // Publish a notice
      publish: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/notices/${id}/publish`, {
          method: 'PATCH',
          headers: getAuthHeaders()
        });
        return response.json();
      },
      // Unpublish a notice
      unpublish: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/notices/${id}/unpublish`, {
          method: 'PATCH',
          headers: getAuthHeaders()
        });
        return response.json();
      },
      // Soft delete
      delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/notices/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return response.json();
      },
      // Restore soft-deleted notice
      restore: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/notices/${id}/restore`, {
          method: 'PATCH',
          headers: getAuthHeaders()
        });
        return response.json();
      }
    }
  },

  // Reports endpoints (admin only)
  reports: {
    // Tổng quan hệ thống
    overview: async () => {
      const response = await fetch(`${API_BASE_URL}/reports/overview`, {
        headers: getAuthHeaders()
      });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) {
        const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
        throw new Error(msg);
      }
      return data;
    },
    // Thống kê điểm danh theo khoảng thời gian
    engagement: async ({ from, to } = {}) => {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const url = `${API_BASE_URL}/reports/engagement${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) {
        const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
        throw new Error(msg);
      }
      return data;
    },
    // Thống kê quiz theo khoảng thời gian
    quizzes: async ({ from, to } = {}) => {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const url = `${API_BASE_URL}/reports/quizzes${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) {
        const msg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
        throw new Error(msg);
      }
      return data;
    }
  }
};

// Auth helper functions
export const auth = {
  isAuthenticated: () => {
    const token = sessionStorage.getItem('token');
    return !!token;
  },

  getToken: () => {
    return sessionStorage.getItem('token');
  },

  getUser: () => {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuth: (token, user) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  },

  clearAuth: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  hasRole: (role) => {
    const user = auth.getUser();
    return user && user.role === role;
  },

  hasAnyRole: (roles) => {
    const user = auth.getUser();
    return user && roles.includes(user.role);
  }
};

export default api; 