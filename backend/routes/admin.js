const express = require('express');
const router = express.Router();

const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Yêu cầu quyền admin cho toàn bộ route dưới /api/admin
router.use(auth, requireRole(['admin']));

// GET /api/admin/overview?days=30
// Tổng quan hệ thống cho Admin, dựa trên dữ liệu giáo viên và học sinh
router.get('/overview', async (req, res) => {
  // Số ngày gần đây để tính "hoạt động"
  const days = Math.max(1, Math.min(parseInt(req.query.days || '30', 10) || 30, 365));
  try {
    // Tổng người dùng và theo vai trò
    const [usersAgg] = await pool.query(
      `SELECT 
         COUNT(*) AS totalUsers,
         SUM(role = 'admin') AS totalAdmins,
         SUM(role = 'teacher') AS totalTeachers,
         SUM(role = 'student') AS totalStudents
       FROM users`
    );

    // Tổng lớp học (không tính đã xóa)
    const [classesAgg] = await pool.query(
      `SELECT COUNT(*) AS totalClasses FROM classes WHERE COALESCE(is_deleted, 0) = 0`
    );

    // Tổng bài tập (bao gồm cả assignments và quiz_assignments)
    const [assignmentsAgg] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM assignments) + 
        (SELECT COUNT(*) FROM quiz_assignments) AS totalAssignments`
    );

    // Tổng thông báo
    const [annAgg] = await pool.query(
      `SELECT COUNT(*) AS totalAnnouncements FROM announcements`
    );

    // Học sinh hoạt động: có điểm danh present/late gần đây hoặc có nộp bài gần đây
    const [activeStudentsByAttendance] = await pool.query(
      `SELECT COUNT(DISTINCT student_id) AS cnt
       FROM attendance
       WHERE check_in_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND status IN ('present','late')`,
      [days]
    );

    const [activeStudentsBySubmission] = await pool.query(
      `SELECT COUNT(DISTINCT student_id) AS cnt
       FROM submissions
       WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Giáo viên hoạt động: có bản ghi điểm danh gần đây (dạy lớp) hoặc tạo bài tập gần đây
    const [activeTeachersByAttendance] = await pool.query(
      `SELECT COUNT(DISTINCT teacher_id) AS cnt
       FROM attendance
       WHERE check_in_time >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    const [activeTeachersByAssignment] = await pool.query(
      `SELECT COUNT(DISTINCT created_by) AS cnt
       FROM assignments
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Hợp nhất số liệu hoạt động (OR logic): lấy max giữa các nguồn hoạt động
    const activeStudents = Math.max(
      Number(activeStudentsByAttendance[0]?.cnt || 0),
      Number(activeStudentsBySubmission[0]?.cnt || 0)
    );

    const activeTeachers = Math.max(
      Number(activeTeachersByAttendance[0]?.cnt || 0),
      Number(activeTeachersByAssignment[0]?.cnt || 0)
    );

    res.json({
      days,
      totals: {
        users: Number(usersAgg[0]?.totalUsers || 0),
        students: Number(usersAgg[0]?.totalStudents || 0),
        teachers: Number(usersAgg[0]?.totalTeachers || 0),
        admins: Number(usersAgg[0]?.totalAdmins || 0),
        classes: Number(classesAgg[0]?.totalClasses || 0),
        assignments: Number(assignmentsAgg[0]?.totalAssignments || 0),
        announcements: Number(annAgg[0]?.totalAnnouncements || 0)
      },
      active: {
        students: activeStudents,
        teachers: activeTeachers
      }
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ message: 'Lỗi lấy số liệu tổng quan' });
  }
});

// =============================
// Users management for Admin
// Base path: /api/admin/users
// =============================

// Helper: build WHERE clause from filters
function buildUserFilters({ search, role }) {
  const where = [];
  const params = [];
  if (search) {
    where.push('(username LIKE ? OR email LIKE ? OR full_name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (role && ['student', 'teacher', 'admin'].includes(role)) {
    where.push('role = ?');
    params.push(role);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  return { whereSql, params };
}

function sanitizeSort(sortBy, sortOrder) {
  const allowedCols = new Set(['created_at', 'full_name', 'email', 'username', 'role']);
  const col = allowedCols.has(sortBy) ? sortBy : 'created_at';
  const ord = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return { col, ord };
}

// GET /api/admin/users
// Query: search, role, page=1, limit=10, sortBy=created_at, sortOrder=DESC
router.get('/users', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;
    const { col, ord } = sanitizeSort(req.query.sortBy, req.query.sortOrder);

    const { whereSql, params } = buildUserFilters({ search, role });

    // Count
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM users ${whereSql}`, params);
    const total = Number(countRows[0]?.total || 0);

    // Items
    const [items] = await pool.query(
      `SELECT id, username, email, full_name, role, avatar, created_at, is_active
       FROM users ${whereSql}
       ORDER BY ${col} ${ord}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    // Debug: log a small sample of is_active values and types
    try {
      const sample = (items || []).slice(0, 3).map(r => ({ id: r.id, is_active: r.is_active, type: typeof r.is_active }));
      console.debug('[ADMIN][LIST] sample is_active =', sample);
    } catch (_) {}

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ message: 'Lỗi lấy danh sách người dùng' });
  }
});

// POST /api/admin/users
// Body: { username, email, full_name, role, password }
router.post('/users', async (req, res) => {
  try {
    const { username, email, full_name, role = 'student', password, is_active } = req.body || {};
    if (!username || !email || !full_name || !password) {
      return res.status(400).json({ message: 'Thiếu trường bắt buộc' });
    }
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    // Check duplicates
    const [dups] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (dups.length) return res.status(400).json({ message: 'Username hoặc email đã tồn tại' });

    const hash = await bcrypt.hash(String(password), 10);
    // Strictly coerce is_active to 1/0 at creation
    let new_is_active = 1;
    if (typeof is_active === 'boolean') {
      new_is_active = is_active ? 1 : 0;
    } else if (typeof is_active === 'number') {
      new_is_active = is_active === 1 ? 1 : 0;
    } else if (typeof is_active === 'string') {
      const s = is_active.trim().toLowerCase();
      new_is_active = (s === '1' || s === 'true' || s === 'yes') ? 1 : 0;
    }

    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, full_name, role, is_active)
       VALUES (?,?,?,?,?, ?)`,
      [username, email, hash, full_name, role, new_is_active]
    );

    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, role, avatar, created_at, is_active FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ message: 'Tạo người dùng thành công', user: rows[0] });
  } catch (err) {
    console.error('Admin create user error:', err);
    res.status(500).json({ message: 'Lỗi tạo người dùng' });
  }
});

// PUT /api/admin/users/:id
// Body: { full_name?, email?, role?, school?, province?, class?, password? }
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ message: 'ID không hợp lệ' });

    // Load existing
    const [existRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existRows.length) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const existing = existRows[0];

    const body = req.body || {};
    const username = body.username ?? existing.username;
    const full_name = body.full_name ?? existing.full_name;
    const email = body.email ?? existing.email;
    const role = body.role ?? existing.role;
    const school = body.school ?? existing.school;
    const province = body.province ?? existing.province;
    const userClass = body.class ?? existing.class;
    // Strictly coerce is_active to 1/0 (handle boolean/number/string)
    let is_active;
    if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
      const v = body.is_active;
      if (typeof v === 'boolean') {
        is_active = v ? 1 : 0;
      } else if (typeof v === 'number') {
        is_active = v === 1 ? 1 : 0;
      } else if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        is_active = (s === '1' || s === 'true' || s === 'yes') ? 1 : 0;
      } else {
        is_active = existing.is_active !== undefined ? existing.is_active : 1;
      }
    } else {
      is_active = existing.is_active !== undefined ? existing.is_active : 1;
    }

    console.debug('[ADMIN][UPDATE] id=', userId, 'incoming is_active=', body?.is_active, 'coerced=', is_active);

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    // Username duplicate check
    if (username && username !== existing.username) {
      const [dupsUser] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
      if (dupsUser.length) return res.status(400).json({ message: 'Username đã được sử dụng' });
    }

    // Email duplicate check
    if (email && email !== existing.email) {
      const [dups] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (dups.length) return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const [result] = await pool.query(
      `UPDATE users SET username = ?, full_name = ?, email = ?, role = ?, school = ?, province = ?, class = ?, is_active = ? WHERE id = ?`,
      [username, full_name, email, role, school, province, userClass, is_active, userId]
    );
    try {
      console.debug('[ADMIN][UPDATE] rows affected =', result?.affectedRows);
    } catch (_) {}

    // Optional password reset
    if (body.password) {
      const hash = await bcrypt.hash(String(body.password), 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    }

    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, role, avatar, created_at, is_active FROM users WHERE id = ?',
      [userId]
    );
    res.json({ message: 'Cập nhật người dùng thành công', user: rows[0] });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ message: 'Lỗi cập nhật người dùng' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ message: 'ID không hợp lệ' });
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ message: 'Lỗi xóa người dùng' });
  }
});

// =============================
// Assignments management for Admin
// Base path: /api/admin/assignments
// =============================

// Helper: build WHERE clause for assignments
function buildAssignmentFilters({ search, classId, teacherId, type }) {
  const where = ['1=1'];
  const params = [];
  
  if (search) {
    where.push('(a.title LIKE ? OR a.description LIKE ? OR c.name LIKE ? OR u.full_name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  
  if (classId) {
    where.push('a.class_id = ?');
    params.push(classId);
  }
  
  if (teacherId) {
    where.push('a.created_by = ?');
    params.push(teacherId);
  }
  
  if (type && ['assignment', 'quiz'].includes(type)) {
    if (type === 'assignment') {
      where.push('a.id IS NOT NULL AND qa.id IS NULL');
    } else if (type === 'quiz') {
      where.push('qa.id IS NOT NULL');
    }
  }
  
  return { whereSql: 'WHERE ' + where.join(' AND '), params };
}

// GET /api/admin/assignments
// Query: search, classId, teacherId, type=all|assignment|quiz, page=1, limit=20
router.get('/assignments', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const classId = req.query.classId ? parseInt(req.query.classId, 10) : undefined;
    const teacherId = req.query.teacherId ? parseInt(req.query.teacherId, 10) : undefined;
    const type = (req.query.type || 'all').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    // Query to get both regular assignments and quiz assignments
    let baseQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.class_id,
        a.due_date,
        a.max_score,
        a.created_by,
        a.created_at,
        a.updated_at,
        'assignment' as type,
        c.name as class_name,
        u.full_name as teacher_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submissions_count
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      
      UNION ALL
      
      SELECT 
        qa.id,
        qa.title,
        qa.description,
        qa.class_id,
        qa.deadline as due_date,
        NULL as max_score,
        qa.created_by,
        qa.created_at,
        qa.updated_at,
        'quiz' as type,
        c.name as class_name,
        u.full_name as teacher_name,
        (SELECT COUNT(DISTINCT student_id) FROM quiz_attempts qat WHERE qat.quiz_assignment_id = qa.id AND qat.status = 'submitted') as submissions_count
      FROM quiz_assignments qa
      LEFT JOIN classes c ON qa.class_id = c.id
      LEFT JOIN users u ON qa.created_by = u.id
    `;

    // Apply filters
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(
        title LIKE ? OR description LIKE ? OR class_name LIKE ? OR teacher_name LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (classId) {
      whereConditions.push('class_id = ?');
      params.push(classId);
    }

    if (teacherId) {
      whereConditions.push('created_by = ?');
      params.push(teacherId);
    }

    if (type && type !== 'all') {
      whereConditions.push('type = ?');
      params.push(type);
    }

    let finalQuery = `SELECT * FROM (${baseQuery}) as combined`;
    if (whereConditions.length > 0) {
      finalQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    finalQuery += ` ORDER BY created_at DESC`;

    // Count total
    let countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as combined`;
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    const [countRows] = await pool.query(countQuery, params);
    const total = Number(countRows[0]?.total || 0);

    // Get paginated items
    const [items] = await pool.query(`${finalQuery} LIMIT ? OFFSET ?`, [...params, limit, offset]);

    res.json({
      items: items.map(item => ({
        ...item,
        submissions_count: Number(item.submissions_count || 0)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Admin list assignments error:', err);
    res.status(500).json({ message: 'Lỗi lấy danh sách bài tập' });
  }
});

// GET /api/admin/assignments/stats
// Thống kê tổng quan về bài tập
router.get('/assignments/stats', async (req, res) => {
  try {
    // Tổng số assignments và quiz assignments
    const [assignmentStats] = await pool.query(`
      SELECT COUNT(*) as total_assignments FROM assignments
    `);
    
    const [quizStats] = await pool.query(`
      SELECT COUNT(*) as total_quizzes FROM quiz_assignments
    `);

    // Thống kê submissions
    const [submissionStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(DISTINCT student_id) as unique_students,
        AVG(score) as avg_score
      FROM submissions 
      WHERE score IS NOT NULL
    `);

    // Thống kê quiz attempts
    const [quizAttemptStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(DISTINCT student_id) as unique_students,
        AVG(percentage) as avg_percentage
      FROM quiz_attempts 
      WHERE status = 'submitted' AND percentage IS NOT NULL
    `);

    // Top 5 lớp có nhiều bài tập nhất
    const [topClasses] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.class_code,
        u.full_name as teacher_name,
        (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id) +
        (SELECT COUNT(*) FROM quiz_assignments qa WHERE qa.class_id = c.id) as total_assignments
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE COALESCE(c.is_deleted, 0) = 0
      ORDER BY total_assignments DESC
      LIMIT 5
    `);

    // Bài tập được tạo theo tháng (6 tháng gần nhất)
    const [monthlyStats] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        'assignment' as type
      FROM assignments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        'quiz' as type
      FROM quiz_assignments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      
      ORDER BY month DESC
    `);

    res.json({
      totals: {
        assignments: Number(assignmentStats[0]?.total_assignments || 0),
        quizzes: Number(quizStats[0]?.total_quizzes || 0),
        total: Number(assignmentStats[0]?.total_assignments || 0) + Number(quizStats[0]?.total_quizzes || 0)
      },
      submissions: {
        total: Number(submissionStats[0]?.total_submissions || 0),
        unique_students: Number(submissionStats[0]?.unique_students || 0),
        avg_score: Number(submissionStats[0]?.avg_score || 0)
      },
      quiz_attempts: {
        total: Number(quizAttemptStats[0]?.total_attempts || 0),
        unique_students: Number(quizAttemptStats[0]?.unique_students || 0),
        avg_percentage: Number(quizAttemptStats[0]?.avg_percentage || 0)
      },
      top_classes: topClasses.map(c => ({
        ...c,
        total_assignments: Number(c.total_assignments || 0)
      })),
      monthly_stats: monthlyStats
    });
  } catch (err) {
    console.error('Admin assignments stats error:', err);
    res.status(500).json({ message: 'Lỗi lấy thống kê bài tập' });
  }
});

// DELETE /api/admin/assignments/:type/:id
// Xóa bài tập (type: assignment hoặc quiz)
router.delete('/assignments/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const assignmentId = parseInt(id, 10);
    
    if (!assignmentId) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    if (!['assignment', 'quiz'].includes(type)) {
      return res.status(400).json({ message: 'Loại bài tập không hợp lệ' });
    }

    if (type === 'assignment') {
      // Xóa assignment thông thường
      const [exists] = await pool.query('SELECT id FROM assignments WHERE id = ?', [assignmentId]);
      if (!exists.length) {
        return res.status(404).json({ message: 'Không tìm thấy bài tập' });
      }

      // Xóa submissions trước
      await pool.query('DELETE FROM submissions WHERE assignment_id = ?', [assignmentId]);
      // Xóa assignment
      await pool.query('DELETE FROM assignments WHERE id = ?', [assignmentId]);
      
      res.json({ message: 'Đã xóa bài tập thành công' });
    } else if (type === 'quiz') {
      // Xóa quiz assignment (sử dụng logic từ assignments.js)
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute(
          'SELECT id, created_by FROM quiz_assignments WHERE id = ?',
          [assignmentId]
        );
        if (rows.length === 0) {
          connection.release();
          return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }

        await connection.beginTransaction();

        // Xóa dữ liệu con theo thứ tự an toàn
        try {
          await connection.execute(
            `DELETE qa FROM quiz_answers qa
             JOIN quiz_attempts qatt ON qa.attempt_id = qatt.id
             WHERE qatt.quiz_assignment_id = ?`,
            [assignmentId]
          );
        } catch (e) {
          console.log('Info: skip deleting quiz_answers via attempts:', e.message);
        }

        try {
          await connection.execute(
            'DELETE FROM quiz_attempts WHERE quiz_assignment_id = ?',
            [assignmentId]
          );
        } catch (e) {
          console.log('Info: skip deleting quiz_attempts:', e.message);
        }

        try {
          await connection.execute(
            `DELETE qo FROM quiz_options qo
             JOIN quiz_questions qq ON qo.question_id = qq.id
             WHERE qq.quiz_assignment_id = ?`,
            [assignmentId]
          );
        } catch (e) {
          console.log('Info: skip deleting quiz_options:', e.message);
        }

        try {
          await connection.execute(
            'DELETE FROM quiz_questions WHERE quiz_assignment_id = ?',
            [assignmentId]
          );
        } catch (e) {
          console.log('Info: skip deleting quiz_questions:', e.message);
        }

        await connection.execute('DELETE FROM quiz_assignments WHERE id = ?', [assignmentId]);

        await connection.commit();
        connection.release();
        res.json({ message: 'Đã xóa bài tập trắc nghiệm thành công' });
      } catch (error) {
        try { await connection.rollback(); } catch (_) {}
        connection.release();
        throw error;
      }
    }
  } catch (err) {
    console.error('Admin delete assignment error:', err);
    res.status(500).json({ message: 'Lỗi xóa bài tập' });
  }
});

// GET /api/admin/assignments/:type/:id/details
// Xem chi tiết bài tập
router.get('/assignments/:type/:id/details', async (req, res) => {
  try {
    const { type, id } = req.params;
    const assignmentId = parseInt(id, 10);
    
    if (!assignmentId) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    if (!['assignment', 'quiz'].includes(type)) {
      return res.status(400).json({ message: 'Loại bài tập không hợp lệ' });
    }

    if (type === 'assignment') {
      // Chi tiết assignment thông thường
      const [assignments] = await pool.query(`
        SELECT a.*, c.name as class_name, u.full_name as teacher_name
        FROM assignments a
        LEFT JOIN classes c ON a.class_id = c.id
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.id = ?
      `, [assignmentId]);

      if (!assignments.length) {
        return res.status(404).json({ message: 'Không tìm thấy bài tập' });
      }

      // Lấy danh sách submissions
      const [submissions] = await pool.query(`
        SELECT s.*, u.full_name as student_name, u.username
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ?
        ORDER BY s.submitted_at DESC
      `, [assignmentId]);

      res.json({
        assignment: assignments[0],
        submissions: submissions,
        stats: {
          total_submissions: submissions.length,
          avg_score: submissions.length > 0 ? 
            submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length : 0
        }
      });
    } else if (type === 'quiz') {
      // Chi tiết quiz assignment
      const [quizzes] = await pool.query(`
        SELECT qa.*, c.name as class_name, u.full_name as teacher_name
        FROM quiz_assignments qa
        LEFT JOIN classes c ON qa.class_id = c.id
        LEFT JOIN users u ON qa.created_by = u.id
        WHERE qa.id = ?
      `, [assignmentId]);

      if (!quizzes.length) {
        return res.status(404).json({ message: 'Không tìm thấy bài tập' });
      }

      // Lấy danh sách attempts
      const [attempts] = await pool.query(`
        SELECT qat.*, u.full_name as student_name, u.username
        FROM quiz_attempts qat
        JOIN users u ON qat.student_id = u.id
        WHERE qat.quiz_assignment_id = ? AND qat.status = 'submitted'
        ORDER BY qat.submitted_at DESC
      `, [assignmentId]);

      // Lấy số câu hỏi
      const [questionCount] = await pool.query(`
        SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_assignment_id = ?
      `, [assignmentId]);

      res.json({
        assignment: quizzes[0],
        attempts: attempts,
        stats: {
          total_attempts: attempts.length,
          question_count: questionCount[0]?.count || 0,
          avg_score: attempts.length > 0 ? 
            attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length : 0
        }
      });
    }
  } catch (err) {
    console.error('Admin assignment details error:', err);
    res.status(500).json({ message: 'Lỗi lấy chi tiết bài tập' });
  }
});

module.exports = router;

// =============================
// Classes management for Admin
// Base path: /api/admin/classes
// =============================

// Helper: build WHERE clause for classes
function buildClassFilters({ search, teacherId, showHidden, deleted }) {
  const where = ['1=1'];
  const params = [];
  // deleted: default 0
  if (deleted === '1' || deleted === 1 || deleted === true || String(deleted).toLowerCase() === 'true') {
    where.push('c.is_deleted = 1');
  } else if (deleted === 'all') {
    // no filter
  } else {
    where.push('COALESCE(c.is_deleted, 0) = 0');
  }
  // showHidden: all|true|false
  const sh = String(showHidden || 'all').toLowerCase();
  if (sh === 'true') where.push('COALESCE(c.is_hidden, 0) = 1');
  if (sh === 'false') where.push('COALESCE(c.is_hidden, 0) = 0');
  // search by name/subject/code/teacher name
  if (search) {
    where.push('(c.name LIKE ? OR c.subject LIKE ? OR c.class_code LIKE ? OR u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }
  // filter by teacher
  if (teacherId) {
    where.push('c.teacher_id = ?');
    params.push(teacherId);
  }
  return { whereSql: 'WHERE ' + where.join(' AND '), params };
}

// GET /api/admin/classes
// Query: search, teacherId, showHidden=all|true|false, deleted=0|1|all, page=1, limit=12
router.get('/classes', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const teacherId = req.query.teacherId ? parseInt(req.query.teacherId, 10) : undefined;
    const showHidden = (req.query.showHidden || 'all').trim();
    const deleted = (req.query.deleted || '0').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const offset = (page - 1) * limit;
    const { whereSql, params } = buildClassFilters({ search, teacherId, showHidden, deleted });

    // Count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM classes c
       LEFT JOIN users u ON c.teacher_id = u.id
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    // Items
    const [items] = await pool.query(
      `SELECT c.*, u.full_name AS teacher_name,
              (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id = c.id AND cm.role = 'student') AS student_count,
              (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id) AS assignments_count
       FROM classes c
       LEFT JOIN users u ON c.teacher_id = u.id
       ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: items.map(r => ({
        ...r,
        student_count: Number(r.student_count || 0),
        assignments_count: Number(r.assignments_count || 0)
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Admin list classes error:', err);
    res.status(500).json({ message: 'Lỗi lấy danh sách lớp học' });
  }
});

// Helper: generate unique class code
async function generateUniqueClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const gen = () => {
    let s = '';
    for (let i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  };
  // try until unique (bounded attempts)
  for (let i = 0; i < 20; i++) {
    const code = gen();
    const [rows] = await pool.query('SELECT id FROM classes WHERE class_code = ?', [code]);
    if (!rows.length) return code;
  }
  // fallback with timestamp suffix
  return 'CLS' + Date.now().toString().slice(-5);
}

// POST /api/admin/classes
// Body: { name, description?, subject?, room?, schedule?, teacher_id }
router.post('/classes', async (req, res) => {
  try {
    const { name, description, subject, room, schedule, teacher_id } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Tên lớp không được để trống' });

    // Validate teacher
    let teacherId = teacher_id ? parseInt(teacher_id, 10) : null;
    if (teacherId) {
      const [t] = await pool.query('SELECT id FROM users WHERE id = ? AND role = "teacher"', [teacherId]);
      if (!t.length) return res.status(400).json({ message: 'Giáo viên không hợp lệ' });
    } else {
      teacherId = null; // cho phép tạo lớp chưa gán GV
    }

    const class_code = await generateUniqueClassCode();
    const [result] = await pool.query(
      `INSERT INTO classes (name, description, teacher_id, subject, room, schedule, class_code)
       VALUES (?,?,?,?,?,?,?)`,
      [name, description || null, teacherId, subject || null, room || null, schedule || null, class_code]
    );

    const [rows] = await pool.query('SELECT * FROM classes WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Tạo lớp học thành công', class: rows[0] });
  } catch (err) {
    console.error('Admin create class error:', err);
    res.status(500).json({ message: 'Lỗi tạo lớp học' });
  }
});

// PUT /api/admin/classes/:id
// Body: { name?, description?, subject?, room?, schedule?, online_link?, teacher_id? }
router.put('/classes/:id', async (req, res) => {
  try {
    const classId = parseInt(req.params.id, 10);
    if (!classId) return res.status(400).json({ message: 'ID không hợp lệ' });

    const [exist] = await pool.query('SELECT * FROM classes WHERE id = ?', [classId]);
    if (!exist.length) return res.status(404).json({ message: 'Lớp học không tồn tại' });

    const { name, description, subject, room, schedule, online_link, teacher_id } = req.body || {};

    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (subject !== undefined) { fields.push('subject = ?'); values.push(subject); }
    if (room !== undefined) { fields.push('room = ?'); values.push(room); }
    if (schedule !== undefined) { fields.push('schedule = ?'); values.push(schedule); }
    if (online_link !== undefined) { fields.push('online_link = ?'); values.push(online_link); }
    if (teacher_id !== undefined) {
      const tid = teacher_id ? parseInt(teacher_id, 10) : null;
      if (tid) {
        const [t] = await pool.query('SELECT id FROM users WHERE id = ? AND role = "teacher"', [tid]);
        if (!t.length) return res.status(400).json({ message: 'Giáo viên không hợp lệ' });
      }
      fields.push('teacher_id = ?'); values.push(tid);
    }

    if (!fields.length) return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });

    values.push(classId);
    await pool.query(`UPDATE classes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM classes WHERE id = ?', [classId]);
    res.json({ message: 'Cập nhật lớp học thành công', class: rows[0] });
  } catch (err) {
    console.error('Admin update class error:', err);
    res.status(500).json({ message: 'Lỗi cập nhật lớp học' });
  }
});

// PATCH /api/admin/classes/:id/toggle-visibility
router.patch('/classes/:id/toggle-visibility', async (req, res) => {
  try {
    const classId = parseInt(req.params.id, 10);
    if (!classId) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT is_hidden FROM classes WHERE id = ?', [classId]);
    if (!rows.length) return res.status(404).json({ message: 'Lớp học không tồn tại' });
    const current = Number(rows[0].is_hidden) ? 1 : 0;
    const next = current ? 0 : 1;
    await pool.query('UPDATE classes SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [next, classId]);
    res.json({ message: next ? 'Đã ẩn lớp học' : 'Đã hiển thị lớp học', is_hidden: next });
  } catch (err) {
    console.error('Admin toggle class visibility error:', err);
    res.status(500).json({ message: 'Lỗi đổi trạng thái hiển thị lớp học' });
  }
});

// DELETE /api/admin/classes/:id (soft)
router.delete('/classes/:id', async (req, res) => {
  try {
    const classId = parseInt(req.params.id, 10);
    if (!classId) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT id FROM classes WHERE id = ?', [classId]);
    if (!rows.length) return res.status(404).json({ message: 'Lớp học không tồn tại' });
    await pool.query('UPDATE classes SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [classId]);
    res.json({ message: 'Đã xóa lớp học' });
  } catch (err) {
    console.error('Admin delete class error:', err);
    res.status(500).json({ message: 'Lỗi xóa lớp học' });
  }
});

// PATCH /api/admin/classes/:id/restore
router.patch('/classes/:id/restore', async (req, res) => {
  try {
    const classId = parseInt(req.params.id, 10);
    if (!classId) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [rows] = await pool.query('SELECT id FROM classes WHERE id = ? AND is_deleted = 1', [classId]);
    if (!rows.length) return res.status(404).json({ message: 'Lớp học không tồn tại hoặc chưa bị xóa' });
    await pool.query('UPDATE classes SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [classId]);
    res.json({ message: 'Đã khôi phục lớp học' });
  } catch (err) {
    console.error('Admin restore class error:', err);
    res.status(500).json({ message: 'Lỗi khôi phục lớp học' });
  }
});

// =============================
// System Notices management for Admin
// Base path: /api/admin/notices
// =============================

// Helper to build filter WHERE
function buildNoticeFilters({ search, status, audience, includeDeleted }) {
  const where = ['1=1'];
  const params = [];
  if (search) {
    const like = `%${search}%`;
    where.push('(title LIKE ? OR message LIKE ?)');
    params.push(like, like);
  }
  if (status && ['draft','published'].includes(String(status))) {
    where.push('status = ?');
    params.push(status);
  }
  if (audience && ['all','teacher','student'].includes(String(audience))) {
    where.push('audience = ?');
    params.push(audience);
  }
  if (!(includeDeleted === '1' || String(includeDeleted).toLowerCase() === 'true')) {
    where.push('COALESCE(is_deleted,0) = 0');
  }
  return { whereSql: 'WHERE ' + where.join(' AND '), params };
}

// GET /api/admin/notices
// Query: search, status, audience, page=1, limit=10, includeDeleted=false
router.get('/notices', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const audience = (req.query.audience || '').trim();
    const includeDeleted = (req.query.includeDeleted || '0').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;
    const { whereSql, params } = buildNoticeFilters({ search, status, audience, includeDeleted });

    const [cntRows] = await pool.query(`SELECT COUNT(*) AS total FROM system_notices ${whereSql}`, params);
    const total = Number(cntRows[0]?.total || 0);

    const [items] = await pool.query(
      `SELECT * FROM system_notices ${whereSql}
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Admin list notices error:', err);
    res.status(500).json({ message: 'Lỗi lấy danh sách thông báo' });
  }
});

// POST /api/admin/notices
// Body: { title, message, link_text?, link_href?, tone?, audience?, status?, starts_at?, ends_at? }
router.post('/notices', async (req, res) => {
  try {
    const { title, message, link_text, link_href, tone = 'info', audience = 'all', status = 'draft', starts_at, ends_at } = req.body || {};
    if (!title || !message) return res.status(400).json({ message: 'Thiếu tiêu đề hoặc nội dung' });
    if (!['info','warning','danger','success'].includes(tone)) return res.status(400).json({ message: 'Tone không hợp lệ' });
    if (!['all','teacher','student'].includes(audience)) return res.status(400).json({ message: 'Đối tượng không hợp lệ' });
    if (!['draft','published'].includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

    const [result] = await pool.query(
      `INSERT INTO system_notices (title, message, link_text, link_href, tone, audience, status, starts_at, ends_at, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [title, message, link_text || null, link_href || null, tone, audience, status, starts_at || null, ends_at || null, req.user?.id || null]
    );

    const [rows] = await pool.query('SELECT * FROM system_notices WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Tạo thông báo thành công', notice: rows[0] });
  } catch (err) {
    console.error('Admin create notice error:', err);
    res.status(500).json({ message: 'Lỗi tạo thông báo' });
  }
});

// PUT /api/admin/notices/:id
router.put('/notices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    const [exists] = await pool.query('SELECT * FROM system_notices WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Không tìm thấy thông báo' });

    const { title, message, link_text, link_href, tone, audience, status, starts_at, ends_at, is_deleted } = req.body || {};
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (message !== undefined) { fields.push('message = ?'); values.push(message); }
    if (link_text !== undefined) { fields.push('link_text = ?'); values.push(link_text); }
    if (link_href !== undefined) { fields.push('link_href = ?'); values.push(link_href); }
    if (tone !== undefined) {
      if (!['info','warning','danger','success'].includes(tone)) return res.status(400).json({ message: 'Tone không hợp lệ' });
      fields.push('tone = ?'); values.push(tone);
    }
    if (audience !== undefined) {
      if (!['all','teacher','student'].includes(audience)) return res.status(400).json({ message: 'Đối tượng không hợp lệ' });
      fields.push('audience = ?'); values.push(audience);
    }
    if (status !== undefined) {
      if (!['draft','published'].includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      fields.push('status = ?'); values.push(status);
    }
    if (starts_at !== undefined) { fields.push('starts_at = ?'); values.push(starts_at || null); }
    if (ends_at !== undefined) { fields.push('ends_at = ?'); values.push(ends_at || null); }
    if (is_deleted !== undefined) { fields.push('is_deleted = ?'); values.push(is_deleted ? 1 : 0); }

    if (!fields.length) return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    values.push(id);
    await pool.query(`UPDATE system_notices SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM system_notices WHERE id = ?', [id]);
    res.json({ message: 'Cập nhật thông báo thành công', notice: rows[0] });
  } catch (err) {
    console.error('Admin update notice error:', err);
    res.status(500).json({ message: 'Lỗi cập nhật thông báo' });
  }
});

// PATCH publish/unpublish
router.patch('/notices/:id/publish', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    await pool.query('UPDATE system_notices SET status = "published", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ message: 'Đã xuất bản thông báo' });
  } catch (err) {
    console.error('Admin publish notice error:', err);
    res.status(500).json({ message: 'Lỗi xuất bản thông báo' });
  }
});

router.patch('/notices/:id/unpublish', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    await pool.query('UPDATE system_notices SET status = "draft", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ message: 'Đã chuyển về bản nháp' });
  } catch (err) {
    console.error('Admin unpublish notice error:', err);
    res.status(500).json({ message: 'Lỗi hủy xuất bản thông báo' });
  }
});

// DELETE (soft)
router.delete('/notices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    await pool.query('UPDATE system_notices SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa thông báo' });
  } catch (err) {
    console.error('Admin delete notice error:', err);
    res.status(500).json({ message: 'Lỗi xóa thông báo' });
  }
});

// RESTORE
router.patch('/notices/:id/restore', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    await pool.query('UPDATE system_notices SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ message: 'Đã khôi phục thông báo' });
  } catch (err) {
    console.error('Admin restore notice error:', err);
    res.status(500).json({ message: 'Lỗi khôi phục thông báo' });
  }
});
