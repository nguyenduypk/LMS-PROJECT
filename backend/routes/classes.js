const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Tạo lớp học mới (chỉ giáo viên)
router.post('/', auth, requireRole(['teacher']), [
  body('name').notEmpty().withMessage('Tên lớp không được để trống'),
  body('description').optional(),
  body('subject').optional(),
  body('room').optional(),
  body('schedule').optional(),
  body('online_link').optional()
], async (req, res) => {
  try {
    console.log('=== CREATE CLASS REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, subject, room, schedule, online_link } = req.body;
    
    const teacherId = req.user.userId;
    
    console.log('Teacher ID:', teacherId);
    console.log('Class data:', { name, description, subject, room, schedule, online_link });
    console.log('JWT Secret:', process.env.JWT_SECRET ? 'Có JWT_SECRET' : 'Không có JWT_SECRET');

                // Tạo mã lớp học ngẫu nhiên
            const generateClassCode = () => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              let result = '';
              for (let i = 0; i < 5; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              return result;
            };

            let classCode;
            let isUnique = false;
            
            // Tạo mã duy nhất
            while (!isUnique) {
              classCode = generateClassCode();
              const [existing] = await pool.execute(
                'SELECT id FROM classes WHERE class_code = ?',
                [classCode]
              );
              if (existing.length === 0) {
                isUnique = true;
              }
            }

            // Tạo lớp học mới
            const [result] = await pool.execute(
              'INSERT INTO classes (name, description, teacher_id, subject, room, schedule, online_link, class_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [name, description, teacherId, subject, room, schedule, online_link || null, classCode]
            );

    console.log('Insert result:', result);

    // Lấy thông tin lớp học vừa tạo
    const [classes] = await pool.execute(
      'SELECT * FROM classes WHERE id = ?',
      [result.insertId]
    );

    console.log('Created class:', classes[0]);

    res.status(201).json({
      message: 'Tạo lớp học thành công',
      class: classes[0]
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tổng quan của một học sinh trong lớp (thông tin + thống kê nhanh)
router.get('/:classId/members/:studentId/overview', auth, async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const studentId = Number(req.params.studentId);
    const userId = req.user.userId;
    const role = req.user.role;

    // Kiểm tra quyền truy cập lớp học
    let hasAccess = false;
    if (role === 'teacher') {
      const [t] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = t.length > 0;
    } else if (role === 'student') {
      const [m] = await pool.execute(
        'SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = m.length > 0 && userId === studentId; // học sinh chỉ xem được của mình
    }
    if (!hasAccess) return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });

    // Xác thực học sinh là thành viên lớp
    const [isMember] = await pool.execute(
      'SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
      [classId, studentId]
    );
    if (isMember.length === 0) return res.status(404).json({ message: 'Học sinh không thuộc lớp này' });

    // Thông tin học sinh
    const [[student]] = await pool.execute(
      'SELECT id, username, full_name, email, school, class AS student_class FROM users WHERE id = ?',
      [studentId]
    );

    // Tổng số bài tập/quiz trong lớp
    const [[aCount]] = await pool.execute('SELECT COUNT(*) AS c FROM assignments WHERE class_id = ?', [classId]);
    const [[qCount]] = await pool.execute('SELECT COUNT(*) AS c FROM quiz_assignments WHERE class_id = ?', [classId]);

    // Số bài đã nộp (assignments)
    const [[aDone]] = await pool.execute(
      'SELECT COUNT(DISTINCT assignment_id) AS c FROM submissions WHERE student_id = ? AND assignment_id IN (SELECT id FROM assignments WHERE class_id = ?)',
      [studentId, classId]
    );

    // Số quiz đã nộp
    const [[qDone]] = await pool.execute(
      "SELECT COUNT(DISTINCT quiz_assignment_id) AS c FROM quiz_attempts WHERE student_id = ? AND status = 'submitted' AND quiz_assignment_id IN (SELECT id FROM quiz_assignments WHERE class_id = ?)",
      [studentId, classId]
    );

    // Điểm trung bình (thang 10) đơn giản: trung bình điểm đã có giữa assignments + quizzes
    // Assignments: normalize theo max_score
    const [aScores] = await pool.execute(
      'SELECT s.score, a.max_score FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.student_id = ? AND a.class_id = ?',
      [studentId, classId]
    );
    const [qScores] = await pool.execute(
      "SELECT COALESCE(qa.percentage, NULL) AS percentage, qa.total_score, qa.max_possible_score FROM quiz_attempts qa WHERE qa.student_id = ? AND qa.status = 'submitted' AND qa.quiz_assignment_id IN (SELECT id FROM quiz_assignments WHERE class_id = ?)",
      [studentId, classId]
    );

    const normalizeTo10 = (score, max) => {
      const s = Number(score || 0);
      const m = Number(max || 0);
      if (!isFinite(s) || s < 0) return 0;
      if (isFinite(m) && m > 0) return (s / m) * 10;
      return Math.max(0, Math.min(10, s));
    };

    let total = 0, cnt = 0;
    for (const r of aScores) {
      if (r.score != null) { total += normalizeTo10(r.score, r.max_score || 100); cnt++; }
    }
    for (const r of qScores) {
      let s10 = null;
      if (isFinite(r.percentage)) s10 = Number(r.percentage) > 1 ? (Number(r.percentage) / 100) * 10 : Number(r.percentage) * 10;
      else s10 = normalizeTo10(r.total_score, r.max_possible_score);
      if (s10 != null) { total += s10; cnt++; }
    }
    const average = cnt > 0 ? Number((total / cnt).toFixed(2)) : 0;

    return res.json({
      student,
      stats: {
        total_assignments: aCount.c,
        total_quizzes: qCount.c,
        done_assignments: aDone.c,
        done_quizzes: qDone.c,
        average
      }
    });
  } catch (error) {
    console.error('Member overview error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Danh sách hoạt động (bài tập + quiz) của một học sinh trong lớp
router.get('/:classId/members/:studentId/activities', auth, async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const studentId = Number(req.params.studentId);
    const userId = req.user.userId;
    const role = req.user.role;
    const { q = '', type = 'all', page = '1', limit = '20' } = req.query;

    // Kiểm tra quyền truy cập lớp học
    let hasAccess = false;
    if (role === 'teacher') {
      const [t] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = t.length > 0;
    } else if (role === 'student') {
      const [m] = await pool.execute(
        'SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = m.length > 0 && userId === studentId;
    }
    if (!hasAccess) return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });

    // Xác thực học sinh là thành viên lớp
    const [isMember] = await pool.execute(
      'SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
      [classId, studentId]
    );
    if (isMember.length === 0) return res.status(404).json({ message: 'Học sinh không thuộc lớp này' });

    const kw = `%${String(q).trim()}%`;

    // Bài tập thường
    const [assignments] = await pool.execute(
      `SELECT a.id, a.title, a.created_at, a.due_date, a.max_score,
              (SELECT s.score FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ? LIMIT 1) AS score,
              (SELECT s.id FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ? LIMIT 1) AS submission_id
       FROM assignments a
       WHERE a.class_id = ? AND (? = '' OR a.title LIKE ?)
       ORDER BY a.created_at DESC`,
      [studentId, studentId, classId, String(q).trim(), kw]
    );

    // Quiz
    const [quizzes] = await pool.execute(
      `SELECT qa.id, qa.title, qa.created_at,
              (SELECT qa2.id
                 FROM quiz_attempts qa2
                WHERE qa2.quiz_assignment_id = qa.id
                  AND qa2.student_id = ?
                  AND qa2.status = 'submitted'
                ORDER BY qa2.submitted_at DESC
                LIMIT 1) AS attempt_id,
              (SELECT qa3.percentage
                 FROM quiz_attempts qa3
                WHERE qa3.quiz_assignment_id = qa.id
                  AND qa3.student_id = ?
                  AND qa3.status = 'submitted'
                ORDER BY qa3.submitted_at DESC
                LIMIT 1) AS percentage,
              (SELECT qa4.total_score
                 FROM quiz_attempts qa4
                WHERE qa4.quiz_assignment_id = qa.id
                  AND qa4.student_id = ?
                  AND qa4.status = 'submitted'
                ORDER BY qa4.submitted_at DESC
                LIMIT 1) AS total_score,
              (SELECT qa5.max_possible_score
                 FROM quiz_attempts qa5
                WHERE qa5.quiz_assignment_id = qa.id
                  AND qa5.student_id = ?
                  AND qa5.status = 'submitted'
                ORDER BY qa5.submitted_at DESC
                LIMIT 1) AS max_possible_score
       FROM quiz_assignments qa
       WHERE qa.class_id = ? AND (? = '' OR qa.title LIKE ?)
       ORDER BY qa.created_at DESC`,
      [studentId, studentId, studentId, studentId, classId, String(q).trim(), kw]
    );

    const items = [];
    const normalizeTo10 = (score, max) => {
      const s = Number(score || 0);
      const m = Number(max || 0);
      if (!isFinite(s) || s < 0) return 0;
      if (isFinite(m) && m > 0) return (s / m) * 10;
      return Math.max(0, Math.min(10, s));
    };

    for (const a of assignments) {
      const submitted = a.submission_id != null;
      const score10 = a.score != null ? Number(normalizeTo10(a.score, a.max_score || 100).toFixed(2)) : null;
      items.push({
        type: 'assignment', id: a.id, title: a.title,
        created_at: a.created_at, due_date: a.due_date,
        status: submitted ? 'đã nộp' : 'chưa làm',
        score: score10
      });
    }
    for (const qz of quizzes) {
      let score10 = null;
      if (isFinite(qz?.percentage)) {
        const pct = Number(qz.percentage);
        score10 = pct > 1 ? (pct / 100) * 10 : pct * 10;
      } else if (qz.total_score != null) {
        score10 = normalizeTo10(qz.total_score, qz.max_possible_score);
      }
      items.push({
        type: 'quiz', id: qz.id, title: qz.title,
        created_at: qz.created_at,
        status: qz.attempt_id ? 'đã nộp' : 'chưa làm',
        score: score10 != null ? Number(score10.toFixed(2)) : null
      });
    }

    // Lọc theo type
    const filtered = type === 'all' ? items : items.filter(it => it.type === type);
    // Sắp xếp theo created_at desc (đã có), phân trang
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, Math.min(100, parseInt(limit)));
    const start = (p - 1) * l;
    const paged = filtered.slice(start, start + l);

    return res.json({ total: filtered.length, page: p, limit: l, items: paged });
  } catch (error) {
    console.error('Member activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Loại học sinh khỏi lớp (chỉ giáo viên sở hữu)
router.delete('/:classId/members/:studentId', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const studentId = Number(req.params.studentId);
    const teacherId = req.user.userId;

    const [own] = await pool.execute('SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0', [classId, teacherId]);
    if (own.length === 0) return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa lớp này' });

    const [mem] = await pool.execute('SELECT id FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"', [classId, studentId]);
    if (mem.length === 0) return res.status(404).json({ message: 'Học sinh không thuộc lớp này' });

    await pool.execute('DELETE FROM class_members WHERE id = ?', [mem[0].id]);
    return res.json({ message: 'Đã xóa học sinh khỏi lớp' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách lớp học của giáo viên (bao gồm cả ẩn)
router.get('/teacher', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== GET TEACHER CLASSES REQUEST ===');
    console.log('Teacher ID:', req.user.userId);
    console.log('Query params:', req.query);
    
    const teacherId = req.user.userId;
    const { showHidden = 'false' } = req.query;

    let query = `
      SELECT c.*, 
             COUNT(cm.user_id) as student_count,
             u.full_name as teacher_name
      FROM classes c
      LEFT JOIN class_members cm ON c.id = cm.class_id AND cm.role = 'student'
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.teacher_id = ?
    `;

    const params = [teacherId];

    // Lọc theo trạng thái ẩn
    if (showHidden === 'false') {
      // Chỉ lấy lớp không ẩn
      query += ' AND c.is_hidden = 0';
      console.log('🔍 Querying for visible classes (not hidden)');
    } else if (showHidden === 'true') {
      // Chỉ lấy lớp đã ẩn
      query += ' AND c.is_hidden = 1';
      console.log('👻 Querying for hidden classes');
    }

    query += ' AND c.is_deleted = 0'; // Thêm điều kiện không bị xóa
    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    console.log('🔍 Final query:', query);
    console.log('🔍 Query params:', params);

    const [classes] = await pool.execute(query, params);
    console.log('📋 Found classes:', classes.length);
    classes.forEach(cls => {
      console.log(`   - ID: ${cls.id}, Name: ${cls.name}, Hidden: ${cls.is_hidden}, Deleted: ${cls.is_deleted}`);
    });

    res.json({
      classes: classes.map(cls => ({
        ...cls,
        student_count: parseInt(cls.student_count) || 0
      }))
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách lớp học của học sinh
router.get('/student', auth, async (req, res) => {
  try {
    console.log('=== GET STUDENT CLASSES REQUEST ===');
    console.log('User:', req.user);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?.userId);
    
    // Kiểm tra role - cho phép cả student và teacher
    if (req.user.role !== 'student' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Chỉ học sinh và giáo viên mới có thể truy cập danh sách lớp học này' });
    }
    
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query;
    let params;

    if (userRole === 'student') {
      // Học sinh: lấy các lớp đã tham gia
      query = `
        SELECT c.*, 
               u.full_name as teacher_name,
               COUNT(DISTINCT cm2.user_id) as student_count
        FROM classes c
        INNER JOIN class_members cm ON c.id = cm.class_id AND cm.user_id = ? AND cm.role = 'student'
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN class_members cm2 ON c.id = cm2.class_id AND cm2.role = 'student'
        WHERE c.is_deleted = 0 AND c.is_hidden = 0
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else if (userRole === 'teacher') {
      // Giáo viên: KHÔNG nên dùng route /student, mà nên dùng route /teacher
      return res.status(400).json({ 
        message: 'Giáo viên nên sử dụng route /teacher để lấy danh sách lớp học của mình' 
      });
    }

    const [classes] = await pool.execute(query, params);

    console.log('Student classes found:', classes.length);

    res.json({
      classes: classes.map(cls => ({
        ...cls,
        student_count: parseInt(cls.student_count) || 0
      }))
    });
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách lớp học đã xóa
router.get('/deleted', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== GET DELETED CLASSES REQUEST ===');
    const teacherId = req.user.userId;
    console.log('Teacher ID:', teacherId);

    const query = `
      SELECT c.*, 
              COUNT(cm.user_id) as student_count,
              u.full_name as teacher_name
       FROM classes c
       LEFT JOIN class_members cm ON c.id = cm.class_id AND cm.role = 'student'
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.teacher_id = ? AND c.is_deleted = 1
       GROUP BY c.id 
       ORDER BY c.deleted_at DESC
    `;

    console.log('🗑️ Query:', query);
    console.log('🗑️ Query params:', [teacherId]);

    const [classes] = await pool.execute(query, [teacherId]);
    console.log('🗑️ Found deleted classes:', classes.length);
    classes.forEach(cls => {
      console.log(`   - ID: ${cls.id}, Name: ${cls.name}, Deleted at: ${cls.deleted_at}`);
    });

    res.json({
      classes: classes.map(cls => ({
        ...cls,
        student_count: parseInt(cls.student_count) || 0
      }))
    });
  } catch (error) {
    console.error('Get deleted classes error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thông tin lớp học theo mã (cho học sinh xem trước khi tham gia)
router.get('/code/:classCode', auth, async (req, res) => {
  try {
    console.log('=== GET CLASS BY CODE ===');
    console.log('User:', req.user);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?.userId);
    
    const { classCode } = req.params;
    const userId = req.user.userId;

    console.log('Class code:', classCode);
    console.log('User ID:', userId);

    // Tìm lớp học theo mã
    const [classes] = await pool.execute(`
      SELECT c.*, u.full_name as teacher_name 
      FROM classes c 
      LEFT JOIN users u ON c.teacher_id = u.id 
      WHERE c.class_code = ? AND c.is_deleted = 0 AND c.is_hidden = 0
    `, [classCode]);

    console.log('Classes found:', classes.length);

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Mã lớp học không hợp lệ hoặc lớp học không tồn tại' });
    }

    const classInfo = classes[0];
    console.log('Class info:', classInfo);

    // Kiểm tra học sinh đã tham gia lớp chưa
    const [existingMembers] = await pool.execute(
      'SELECT * FROM class_members WHERE class_id = ? AND user_id = ?',
      [classInfo.id, userId]
    );

    console.log('Existing members:', existingMembers.length);
    const isAlreadyJoined = existingMembers.length > 0;

    // Lấy số lượng thành viên
    const [memberCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM class_members WHERE class_id = ? AND role = "student"',
      [classInfo.id]
    );

    // Lấy số lượng bài tập
    const [assignmentCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM assignments WHERE class_id = ?',
      [classInfo.id]
    );

    // Lấy số lượng tài liệu
    const [materialCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM materials WHERE class_id = ?',
      [classInfo.id]
    );

    const response = {
      class: {
        id: classInfo.id,
        name: classInfo.name,
        subject: classInfo.subject,
        description: classInfo.description,
        teacher_name: classInfo.teacher_name,
        class_code: classInfo.class_code,
        is_already_joined: isAlreadyJoined,
        student_count: memberCount[0]?.count || 0,
        assignment_count: assignmentCount[0]?.count || 0,
        material_count: materialCount[0]?.count || 0
      }
    };

    console.log('Response:', response);
    res.json(response);
  } catch (error) {
    console.error('Get class by code error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Lấy thông tin chi tiết lớp học
router.get('/:id', auth, async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Kiểm tra quyền truy cập
    let query = `
      SELECT c.*, u.full_name as teacher_name
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `;

    if (userRole === 'teacher') {
      query += ' AND c.teacher_id = ?';
    } else if (userRole === 'student') {
      query += ' AND EXISTS (SELECT 1 FROM class_members cm WHERE cm.class_id = c.id AND cm.user_id = ? AND cm.role = "student")';
    }

    const params = userRole === 'teacher' ? [classId, userId] : [classId, userId];
    const [classes] = await pool.execute(query, params);

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập' });
    }

    const classInfo = classes[0];

    // Lấy danh sách thành viên
    const [members] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, u.email, cm.role, cm.joined_at
       FROM class_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.class_id = ?
       ORDER BY cm.role DESC, cm.joined_at ASC`,
      [classId]
    );

    res.json({
      class: classInfo,
      members: members
    });
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật thông tin lớp học
router.put('/:id', auth, requireRole(['teacher']), [
  body('name').optional().notEmpty().withMessage('Tên lớp không được để trống'),
  body('description').optional(),
  body('subject').optional(),
  body('room').optional(),
  body('schedule').optional(),
  body('online_link').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const classId = req.params.id;
    const teacherId = req.user.userId;
    const { name, description, subject, room, schedule, online_link } = req.body;

    // Kiểm tra quyền sở hữu
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền chỉnh sửa' });
    }

    // Cập nhật thông tin
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (subject !== undefined) {
      updateFields.push('subject = ?');
      updateValues.push(subject);
    }
    if (room !== undefined) {
      updateFields.push('room = ?');
      updateValues.push(room);
    }
    if (schedule !== undefined) {
      updateFields.push('schedule = ?');
      updateValues.push(schedule);
    }
    if (online_link !== undefined) {
      updateFields.push('online_link = ?');
      updateValues.push(online_link);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    }

    updateValues.push(classId);
    await pool.execute(
      `UPDATE classes SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Lấy thông tin lớp học đã cập nhật
    const [updatedClasses] = await pool.execute(
      'SELECT * FROM classes WHERE id = ?',
      [classId]
    );

    res.json({
      message: 'Cập nhật lớp học thành công',
      class: updatedClasses[0]
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Ẩn/Hiện lớp học
router.patch('/:id/toggle-visibility', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== TOGGLE CLASS VISIBILITY REQUEST ===');
    const classId = req.params.id;
    const teacherId = req.user.userId;
    console.log('Class ID:', classId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra quyền sở hữu
    const [classes] = await pool.execute(
      'SELECT id, is_hidden FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    console.log('🔍 Found classes:', classes.length);
    if (classes.length > 0) {
      console.log('🔍 Current visibility:', classes[0].is_hidden);
    }

    if (classes.length === 0) {
      console.log('❌ Class not found or no permission');
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền chỉnh sửa' });
    }

    const currentVisibility = classes[0].is_hidden;
    const newVisibility = currentVisibility ? 0 : 1;
    console.log('🔄 Toggling visibility from', currentVisibility, 'to', newVisibility);

    await pool.execute(
      'UPDATE classes SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newVisibility, classId]
    );

    console.log('✅ Visibility updated successfully');

    res.json({
      message: newVisibility ? 'Đã ẩn lớp học' : 'Đã hiển thị lớp học',
      is_hidden: newVisibility
    });
  } catch (error) {
    console.error('Toggle class visibility error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa lớp học (soft delete)
router.delete('/:id', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== DELETE CLASS REQUEST ===');
    const classId = req.params.id;
    const teacherId = req.user.userId;
    console.log('Class ID:', classId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra quyền sở hữu
    const [classes] = await pool.execute(
      'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    console.log('🔍 Found classes:', classes.length);
    if (classes.length > 0) {
      console.log('🔍 Class to delete:', classes[0].name);
    }

    if (classes.length === 0) {
      console.log('❌ Class not found or no permission');
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền xóa' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE classes SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [classId]
    );

    console.log('✅ Class deleted successfully');

    res.json({ message: 'Đã xóa lớp học' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Khôi phục lớp học đã xóa
router.patch('/:id/restore', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== RESTORE CLASS REQUEST ===');
    const classId = req.params.id;
    const teacherId = req.user.userId;
    console.log('Class ID:', classId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra quyền sở hữu
    const [classes] = await pool.execute(
      'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 1',
      [classId, teacherId]
    );

    console.log('🔍 Found classes:', classes.length);
    if (classes.length > 0) {
      console.log('🔍 Class to restore:', classes[0].name);
    }

    if (classes.length === 0) {
      console.log('❌ Class not found or no permission');
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền khôi phục' });
    }

    // Khôi phục
    await pool.execute(
      'UPDATE classes SET is_deleted = 0, deleted_at = NULL WHERE id = ?',
      [classId]
    );

    console.log('✅ Class restored successfully');

    res.json({ message: 'Đã khôi phục lớp học' });
  } catch (error) {
    console.error('Restore class error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tham gia lớp học bằng mã (cho học sinh) - Tạo yêu cầu tham gia
router.post('/join', auth, requireRole(['student']), [
  body('classCode').notEmpty().withMessage('Mã lớp học không được để trống')
], async (req, res) => {
  try {
    console.log('=== JOIN CLASS REQUEST ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classCode } = req.body;
    const studentId = req.user.userId;

    console.log('Class code:', classCode);
    console.log('Student ID:', studentId);

    // Tìm lớp học theo mã
    const [classes] = await pool.execute(
      'SELECT * FROM classes WHERE class_code = ? AND is_deleted = 0 AND is_hidden = 0',
      [classCode]
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Mã lớp học không hợp lệ hoặc lớp học không tồn tại' });
    }

    const classInfo = classes[0];
    console.log('Class found:', classInfo);

    // Kiểm tra học sinh đã tham gia lớp chưa
    const [existingMembers] = await pool.execute(
      'SELECT * FROM class_members WHERE class_id = ? AND user_id = ?',
      [classInfo.id, studentId]
    );

    if (existingMembers.length > 0) {
      return res.status(400).json({ message: 'Bạn đã tham gia lớp học này rồi' });
    }

    // Kiểm tra đã có yêu cầu tham gia chưa
    const [existingRequests] = await pool.execute(
      'SELECT * FROM class_join_requests WHERE class_id = ? AND user_id = ?',
      [classInfo.id, studentId]
    );

    if (existingRequests.length > 0) {
      const request = existingRequests[0];
      if (request.status === 'pending') {
        return res.status(400).json({ message: 'Bạn đã gửi yêu cầu tham gia lớp học này và đang chờ duyệt' });
      } else if (request.status === 'rejected') {
        // Cho phép học sinh yêu cầu lại sau khi bị từ chối
        // Cập nhật yêu cầu cũ thành pending
        await pool.execute(
          'UPDATE class_join_requests SET status = "pending", requested_at = NOW(), processed_at = NULL, processed_by = NULL WHERE id = ?',
          [request.id]
        );
        
        console.log('✅ Join request reactivated successfully');
        
        res.json({ 
          message: 'Yêu cầu tham gia lớp học đã được gửi lại và đang chờ giáo viên duyệt',
          class: {
            id: classInfo.id,
            name: classInfo.name,
            subject: classInfo.subject,
            class_code: classInfo.class_code
          }
        });
        return;
      }
    }

    // Tạo yêu cầu tham gia mới
    await pool.execute(
      'INSERT INTO class_join_requests (class_id, user_id, status) VALUES (?, ?, "pending")',
      [classInfo.id, studentId]
    );

    console.log('✅ Join request created successfully');

    res.json({ 
      message: 'Yêu cầu tham gia lớp học đã được gửi và đang chờ giáo viên duyệt',
      class: {
        id: classInfo.id,
        name: classInfo.name,
        subject: classInfo.subject,
        class_code: classInfo.class_code
      }
    });
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách yêu cầu tham gia lớp học (cho giáo viên)
router.get('/:id/join-requests', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== GET JOIN REQUESTS ===');
    const classId = req.params.id;
    const teacherId = req.user.userId;
    
    console.log('Class ID:', classId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra quyền sở hữu lớp học
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập' });
    }

    // Lấy danh sách yêu cầu tham gia đang chờ duyệt
    const [requests] = await pool.execute(`
      SELECT cjr.*, u.full_name, u.email, u.school, u.class as student_class
      FROM class_join_requests cjr
      JOIN users u ON cjr.user_id = u.id
      WHERE cjr.class_id = ? AND cjr.status = 'pending'
      ORDER BY cjr.requested_at ASC
    `, [classId]);

    console.log('Found pending requests:', requests.length);

    res.json({
      requests: requests.map(req => ({
        id: req.id,
        user_id: req.user_id,
        full_name: req.full_name,
        email: req.email,
        school: req.school,
        student_class: req.student_class,
        requested_at: req.requested_at
      }))
    });
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Duyệt yêu cầu tham gia lớp học
router.post('/:id/join-requests/:requestId/approve', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== APPROVE JOIN REQUEST ===');
    const classId = req.params.id;
    const requestId = req.params.requestId;
    const teacherId = req.user.userId;
    
    console.log('Class ID:', classId);
    console.log('Request ID:', requestId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra quyền sở hữu lớp học
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (classes.length === 0) {
      console.log('❌ Class not found or no permission');
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập' });
    }

    // Lấy thông tin yêu cầu
    const [requests] = await pool.execute(`
      SELECT * FROM class_join_requests 
      WHERE id = ? AND class_id = ? AND status = 'pending'
    `, [requestId, classId]);

    if (requests.length === 0) {
      console.log('❌ Request not found or not pending');
      return res.status(404).json({ message: 'Yêu cầu tham gia không tồn tại hoặc đã được xử lý' });
    }

    const request = requests[0];
    console.log('Request found:', request);

    // Kiểm tra xem học sinh đã là thành viên chưa
    const [existingMembers] = await pool.execute(
      'SELECT * FROM class_members WHERE class_id = ? AND user_id = ?',
      [classId, request.user_id]
    );

    if (existingMembers.length > 0) {
      console.log('❌ Student already a member');
      // Cập nhật trạng thái yêu cầu thành approved và trả về thành công
      await pool.execute(`
        UPDATE class_join_requests 
        SET status = 'approved', processed_at = NOW(), processed_by = ?
        WHERE id = ?
      `, [teacherId, requestId]);
      
      return res.json({ message: 'Học sinh đã là thành viên của lớp học' });
    }

    // Thực hiện approve mà không cần transaction (vì đã kiểm tra duplicate)
    try {
      // Cập nhật trạng thái yêu cầu thành approved
      await pool.execute(`
        UPDATE class_join_requests 
        SET status = 'approved', processed_at = NOW(), processed_by = ?
        WHERE id = ?
      `, [teacherId, requestId]);

      // Thêm học sinh vào lớp
      await pool.execute(`
        INSERT INTO class_members (class_id, user_id, role, joined_at)
        VALUES (?, ?, 'student', NOW())
      `, [classId, request.user_id]);

      console.log('✅ Join request approved successfully');

      res.json({ message: 'Đã duyệt yêu cầu tham gia lớp học' });
    } catch (error) {
      console.error('❌ Approve operation failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Approve join request error:', error);
    res.status(500).json({ message: 'Lỗi server khi duyệt yêu cầu tham gia' });
  }
});

// Từ chối yêu cầu tham gia lớp học
router.post('/:id/join-requests/:requestId/reject', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== REJECT JOIN REQUEST ===');
    const classId = req.params.id;
    const requestId = req.params.requestId;
    const teacherId = req.user.userId;
    
    console.log('Class ID:', classId);
    console.log('Request ID:', requestId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra quyền sở hữu lớp học
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập' });
    }

    // Lấy thông tin yêu cầu
    const [requests] = await pool.execute(`
      SELECT * FROM class_join_requests 
      WHERE id = ? AND class_id = ? AND status = 'pending'
    `, [requestId, classId]);

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Yêu cầu tham gia không tồn tại hoặc đã được xử lý' });
    }

    // Cập nhật trạng thái yêu cầu thành rejected
    await pool.execute(`
      UPDATE class_join_requests 
      SET status = 'rejected', processed_at = NOW(), processed_by = ?
      WHERE id = ?
    `, [teacherId, requestId]);

    console.log('✅ Join request rejected successfully');

    res.json({ message: 'Đã từ chối yêu cầu tham gia lớp học' });
  } catch (error) {
    console.error('Reject join request error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách thành viên lớp học (cập nhật để hiển thị thông tin chi tiết hơn)
router.get('/:id/members', auth, async (req, res) => {
  try {
    console.log('=== GET CLASS MEMBERS ===');
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('Class ID:', classId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);

    // Kiểm tra quyền truy cập
    let hasAccess = false;
    
    if (userRole === 'teacher') {
      // Giáo viên: kiểm tra sở hữu lớp học
      const [teacherClasses] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = teacherClasses.length > 0;
    } else if (userRole === 'student') {
      // Học sinh: kiểm tra đã tham gia lớp chưa
      const [studentMembers] = await pool.execute(
        'SELECT * FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = studentMembers.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });
    }

    // Lấy danh sách thành viên
    const [members] = await pool.execute(`
      SELECT u.id, u.username, u.full_name, u.email, u.school, u.class as student_class,
             cm.role, cm.joined_at
      FROM class_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.class_id = ?
      ORDER BY cm.role DESC, cm.joined_at ASC
    `, [classId]);

    console.log('Found members:', members.length);

    res.json({
      members: members.map(member => ({
        id: member.id,
        username: member.username,
        full_name: member.full_name,
        email: member.email,
        school: member.school,
        student_class: member.student_class,
        role: member.role,
        joined_at: member.joined_at
      }))
    });
  } catch (error) {
    console.error('Get class members error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thêm học sinh trực tiếp vào lớp học (chỉ giáo viên)
router.post('/:id/add-student', auth, requireRole(['teacher']), [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('full_name').notEmpty().withMessage('Họ và tên không được để trống'),
  body('school').optional(),
  body('student_class').optional(),
  body('phone').optional()
], async (req, res) => {
  try {
    console.log('=== ADD STUDENT TO CLASS ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const classId = req.params.id;
    const teacherId = req.user.userId;
    const { email, full_name, school, student_class, phone } = req.body;

    console.log('Class ID:', classId);
    console.log('Teacher ID:', teacherId);
    console.log('Student data:', { email, full_name, school, student_class, phone });

    // Kiểm tra quyền sở hữu lớp học
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập' });
    }

    // Kiểm tra xem email đã tồn tại trong hệ thống chưa
    const [existingUsers] = await pool.execute(
      'SELECT id, username, email, full_name FROM users WHERE email = ?',
      [email]
    );

    let userId;

    if (existingUsers.length > 0) {
      // Email đã tồn tại, sử dụng user hiện có
      const existingUser = existingUsers[0];
      userId = existingUser.id;
      
      console.log('Found existing user:', existingUser);
      
      // Kiểm tra xem học sinh đã là thành viên của lớp chưa
      const [existingMembers] = await pool.execute(
        'SELECT * FROM class_members WHERE class_id = ? AND user_id = ?',
        [classId, userId]
      );

      if (existingMembers.length > 0) {
        return res.status(400).json({ message: 'Học sinh đã là thành viên của lớp học này' });
      }
    } else {
      // Tạo tài khoản mới cho học sinh
      const username = email.split('@')[0]; // Sử dụng phần trước @ làm username
      const defaultPassword = 'password123'; // Mật khẩu mặc định
      
      // Hash password
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
      
      console.log('Creating new user with username:', username);
      
      // Tạo user mới
      const [newUser] = await pool.execute(`
        INSERT INTO users (username, email, password, full_name, role, school, class, phone)
        VALUES (?, ?, ?, ?, 'student', ?, ?, ?)
      `, [username, email, hashedPassword, full_name, school, student_class, phone]);
      
      userId = newUser.insertId;
      console.log('Created new user with ID:', userId);
    }

    // Thêm học sinh vào lớp học
    await pool.execute(`
      INSERT INTO class_members (class_id, user_id, role, joined_at)
      VALUES (?, ?, 'student', NOW())
    `, [classId, userId]);

    console.log('✅ Student added to class successfully');

    // Lấy thông tin học sinh vừa thêm
    const [addedStudent] = await pool.execute(`
      SELECT u.id, u.username, u.full_name, u.email, u.school, u.class as student_class,
             cm.role, cm.joined_at
      FROM class_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.class_id = ? AND cm.user_id = ?
    `, [classId, userId]);

    res.status(201).json({
      message: 'Thêm học sinh vào lớp học thành công',
      student: addedStudent[0]
    });
  } catch (error) {
    console.error('Add student to class error:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm học sinh vào lớp học' });
  }
});

// ===== ANNOUNCEMENT ENDPOINTS =====

// Tạo thông báo mới (chỉ giáo viên)
router.post('/:id/announcements', auth, requireRole(['teacher']), [
  body('content').notEmpty().withMessage('Nội dung thông báo không được để trống')
], async (req, res) => {
  try {
    console.log('=== CREATE ANNOUNCEMENT ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const classId = req.params.id;
    const teacherId = req.user.userId;
    const { content } = req.body;

    console.log('Class ID:', classId);
    console.log('Teacher ID:', teacherId);
    console.log('Content:', content);

    // Kiểm tra quyền sở hữu lớp học
    const [classes] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập' });
    }

    // Tạo thông báo mới
    const [result] = await pool.execute(`
      INSERT INTO announcements (class_id, created_by, title, content, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [classId, teacherId, content.substring(0, 200), content]);

    console.log('Announcement created with ID:', result.insertId);

    // Lấy thông tin thông báo vừa tạo
    const [announcements] = await pool.execute(`
      SELECT a.*, u.full_name as teacher_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Tạo thông báo thành công',
      announcement: announcements[0]
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo thông báo' });
  }
});

// Lấy danh sách thông báo của lớp học
router.get('/:id/announcements', auth, async (req, res) => {
  try {
    console.log('=== GET ANNOUNCEMENTS ===');
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log('Class ID:', classId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);

    // Kiểm tra quyền truy cập
    let hasAccess = false;
    
    if (userRole === 'teacher') {
      // Giáo viên: kiểm tra sở hữu lớp học
      const [teacherClasses] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = teacherClasses.length > 0;
    } else if (userRole === 'student') {
      // Học sinh: kiểm tra đã tham gia lớp chưa
      const [studentMembers] = await pool.execute(
        'SELECT * FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = studentMembers.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });
    }

    // Lấy danh sách thông báo
    const [announcements] = await pool.execute(`
      SELECT a.*, u.full_name as teacher_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.class_id = ?
      ORDER BY a.created_at DESC
    `, [classId]);

    console.log('Found announcements:', announcements.length);

    res.json({
      announcements: announcements.map(announcement => ({
        id: announcement.id,
        content: announcement.content,
        teacher_name: announcement.teacher_name,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at
      }))
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật thông báo (chỉ giáo viên sở hữu)
router.put('/:classId/announcements/:announcementId', auth, requireRole(['teacher']), [
  body('content').notEmpty().withMessage('Nội dung thông báo không được để trống')
], async (req, res) => {
  try {
    console.log('=== UPDATE ANNOUNCEMENT ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const classId = req.params.classId;
    const announcementId = req.params.announcementId;
    const teacherId = req.user.userId;
    const { content } = req.body;

    console.log('Class ID:', classId);
    console.log('Announcement ID:', announcementId);
    console.log('Teacher ID:', teacherId);
    console.log('Content:', content);

    // Kiểm tra quyền sở hữu lớp học và thông báo
    const [announcements] = await pool.execute(`
      SELECT a.* FROM announcements a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = ? AND a.class_id = ? AND c.teacher_id = ? AND c.is_deleted = 0
    `, [announcementId, classId, teacherId]);

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Thông báo không tồn tại hoặc bạn không có quyền chỉnh sửa' });
    }

    // Cập nhật thông báo
    await pool.execute(`
      UPDATE announcements 
      SET title = ?, content = ?
      WHERE id = ?
    `, [content.substring(0, 200), content, announcementId]);

    console.log('Announcement updated successfully');

    res.json({
      message: 'Cập nhật thông báo thành công'
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông báo' });
  }
});

// Xóa thông báo (chỉ giáo viên sở hữu)
router.delete('/:classId/announcements/:announcementId', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== DELETE ANNOUNCEMENT ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    const classId = req.params.classId;
    const announcementId = req.params.announcementId;
    const teacherId = req.user.userId;

    console.log('Class ID:', classId);
    console.log('Announcement ID:', announcementId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra quyền sở hữu lớp học và thông báo
    const [announcements] = await pool.execute(`
      SELECT a.* FROM announcements a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = ? AND a.class_id = ? AND c.teacher_id = ? AND c.is_deleted = 0
    `, [announcementId, classId, teacherId]);

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Thông báo không tồn tại hoặc bạn không có quyền xóa' });
    }

    // Xóa thông báo
    await pool.execute('DELETE FROM announcements WHERE id = ?', [announcementId]);

    console.log('Announcement deleted successfully');

    res.json({
      message: 'Xóa thông báo thành công'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa thông báo' });
  }
});

// ===== COMMENT ENDPOINTS =====

// Tạo bình luận mới (giáo viên và học sinh)
router.post('/:classId/announcements/:announcementId/comments', auth, [
  body('content').notEmpty().withMessage('Nội dung bình luận không được để trống')
], async (req, res) => {
  try {
    console.log('=== CREATE COMMENT ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const classId = req.params.classId;
    const announcementId = req.params.announcementId;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { content } = req.body;

    console.log('Class ID:', classId);
    console.log('Announcement ID:', announcementId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Content:', content);

    // Kiểm tra quyền truy cập lớp học
    let hasAccess = false;
    
    if (userRole === 'teacher') {
      // Giáo viên: kiểm tra sở hữu lớp học
      const [teacherClasses] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = teacherClasses.length > 0;
    } else if (userRole === 'student') {
      // Học sinh: kiểm tra đã tham gia lớp chưa
      const [studentMembers] = await pool.execute(
        'SELECT * FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = studentMembers.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });
    }

    // Kiểm tra thông báo có tồn tại không
    const [announcements] = await pool.execute(
      'SELECT id FROM announcements WHERE id = ? AND class_id = ?',
      [announcementId, classId]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Thông báo không tồn tại' });
    }

    // Tạo bình luận mới
    const [result] = await pool.execute(`
      INSERT INTO announcement_comments (announcement_id, user_id, content, created_at)
      VALUES (?, ?, ?, NOW())
    `, [announcementId, userId, content]);

    console.log('Comment created with ID:', result.insertId);

    // Lấy thông tin bình luận vừa tạo
    const [comments] = await pool.execute(`
      SELECT c.*, u.full_name as user_name, u.role as user_role
      FROM announcement_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    if (comments.length === 0) {
      return res.status(500).json({ message: 'Lỗi khi tạo bình luận' });
    }

    const comment = comments[0];

    res.status(201).json({
      message: 'Tạo bình luận thành công',
      comment: {
        id: comment.id,
        content: comment.content,
        user_name: comment.user_name,
        user_role: comment.user_role,
        user_id: comment.user_id,
        created_at: comment.created_at
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo bình luận' });
  }
});

// Lấy danh sách bình luận của thông báo
router.get('/:classId/announcements/:announcementId/comments', auth, async (req, res) => {
  try {
    console.log('=== GET COMMENTS ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    const classId = req.params.classId;
    const announcementId = req.params.announcementId;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log('Class ID:', classId);
    console.log('Announcement ID:', announcementId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);

    // Kiểm tra quyền truy cập lớp học
    let hasAccess = false;
    
    if (userRole === 'teacher') {
      // Giáo viên: kiểm tra sở hữu lớp học
      const [teacherClasses] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = teacherClasses.length > 0;
    } else if (userRole === 'student') {
      // Học sinh: kiểm tra đã tham gia lớp chưa
      const [studentMembers] = await pool.execute(
        'SELECT * FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = studentMembers.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });
    }

    // Kiểm tra thông báo có tồn tại không
    const [announcements] = await pool.execute(
      'SELECT id FROM announcements WHERE id = ? AND class_id = ?',
      [announcementId, classId]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Thông báo không tồn tại' });
    }

    // Lấy danh sách bình luận
    const [comments] = await pool.execute(`
      SELECT c.*, u.full_name as user_name, u.role as user_role
      FROM announcement_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.announcement_id = ?
      ORDER BY c.created_at ASC
    `, [announcementId]);

    console.log('Found comments:', comments.length);

    res.json({
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        user_name: comment.user_name,
        user_role: comment.user_role,
        user_id: comment.user_id,
        created_at: comment.created_at
      }))
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa bình luận (chỉ người tạo bình luận hoặc giáo viên sở hữu lớp)
router.delete('/:classId/announcements/:announcementId/comments/:commentId', auth, async (req, res) => {
  try {
    console.log('=== DELETE COMMENT ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    const classId = req.params.classId;
    const announcementId = req.params.announcementId;
    const commentId = req.params.commentId;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log('Class ID:', classId);
    console.log('Announcement ID:', announcementId);
    console.log('Comment ID:', commentId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);

    // Kiểm tra quyền truy cập lớp học
    let hasAccess = false;
    
    if (userRole === 'teacher') {
      // Giáo viên: kiểm tra sở hữu lớp học
      const [teacherClasses] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = teacherClasses.length > 0;
    } else if (userRole === 'student') {
      // Học sinh: kiểm tra đã tham gia lớp chưa
      const [studentMembers] = await pool.execute(
        'SELECT * FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = studentMembers.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });
    }

    // Kiểm tra bình luận có tồn tại không
    const [comments] = await pool.execute(
      'SELECT * FROM announcement_comments WHERE id = ? AND announcement_id = ?',
      [commentId, announcementId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    const comment = comments[0];

    // Kiểm tra quyền xóa bình luận
    let canDelete = false;
    
    if (userRole === 'teacher') {
      // Giáo viên: có thể xóa bình luận của mình hoặc bình luận trong lớp mình sở hữu
      canDelete = comment.user_id === userId || hasAccess;
    } else if (userRole === 'student') {
      // Học sinh: chỉ có thể xóa bình luận của mình
      canDelete = comment.user_id === userId;
    }

    if (!canDelete) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' });
    }

    // Xóa bình luận
    await pool.execute('DELETE FROM announcement_comments WHERE id = ?', [commentId]);

    console.log('Comment deleted successfully');

    res.json({
      message: 'Xóa bình luận thành công'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa bình luận' });
  }
});

// ===== SCHEDULE ENDPOINTS =====

// Tạo lịch học mới (chỉ giáo viên)
router.post('/:id/schedules', auth, requireRole(['teacher']), [
  body('day_of_week').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Ngày trong tuần không hợp lệ'),
  body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Thời gian bắt đầu không hợp lệ'),
  body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Thời gian kết thúc không hợp lệ'),
  body('room').optional(),
  body('subject').notEmpty().withMessage('Môn học không được để trống'),
  body('type').optional(),
  body('online_link').optional()
], async (req, res) => {
  try {
    console.log('=== CREATE SCHEDULE ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const classId = req.params.id;
    const teacherId = req.user.userId;
    const { day_of_week, start_time, end_time, room, subject, description, type, online_link } = req.body;

    console.log('Class ID:', classId);
    console.log('Teacher ID:', teacherId);
    console.log('Schedule data:', { day_of_week, start_time, end_time, room, subject, description, type, online_link });

    // Ràng buộc theo hình thức
    const mode = (type && type !== 'offline') ? 'online' : 'offline';
    if (mode === 'offline' && (!room || !String(room).trim())) {
      return res.status(400).json({ message: 'Phòng học là bắt buộc đối với lịch học trực tiếp' });
    }
    if (mode === 'online' && (!online_link || !String(online_link).trim())) {
      return res.status(400).json({ message: 'Link phòng trực tuyến là bắt buộc đối với lịch học trực tuyến' });
    }

    // Kiểm tra giáo viên có sở hữu lớp học không
    const [teacherClasses] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (teacherClasses.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền tạo lịch học cho lớp này' });
    }

    // Kiểm tra xem đã có lịch học vào thời gian này chưa
    const [existingSchedules] = await pool.execute(
      'SELECT id FROM class_schedules WHERE class_id = ? AND day_of_week = ? AND start_time = ?',
      [classId, day_of_week, start_time]
    );

    if (existingSchedules.length > 0) {
      return res.status(400).json({ message: 'Đã có lịch học vào thời gian này' });
    }

    // Tạo lịch học mới
    const [result] = await pool.execute(`
      INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room, subject, description, type, online_link, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [classId, day_of_week, start_time, end_time, room || '', subject, description || '', mode, online_link || null, teacherId]);

    console.log('Schedule created with ID:', result.insertId);

    // Lấy thông tin lịch học vừa tạo
    const [schedules] = await pool.execute(`
      SELECT cs.*, c.name as class_name, u.full_name as teacher_name
      FROM class_schedules cs
      JOIN classes c ON cs.class_id = c.id
      JOIN users u ON cs.created_by = u.id
      WHERE cs.id = ?
    `, [result.insertId]);

    if (schedules.length === 0) {
      return res.status(500).json({ message: 'Lỗi khi tạo lịch học' });
    }

    const schedule = schedules[0];

    res.status(201).json({
      message: 'Tạo lịch học thành công',
      schedule: {
        id: schedule.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room,
        subject: schedule.subject,
        description: schedule.description,
        type: schedule.type,
        class_name: schedule.class_name,
        teacher_name: schedule.teacher_name,
        created_at: schedule.created_at
      }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo lịch học' });
  }
});

// Lấy danh sách lịch học của lớp
router.get('/:id/schedules', auth, async (req, res) => {
  try {
    console.log('=== GET SCHEDULES ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log('Class ID:', classId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);

    // Kiểm tra quyền truy cập lớp học
    let hasAccess = false;
    
    if (userRole === 'teacher') {
      // Giáo viên: kiểm tra sở hữu lớp học
      const [teacherClasses] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, userId]
      );
      hasAccess = teacherClasses.length > 0;
    } else if (userRole === 'student') {
      // Học sinh: kiểm tra đã tham gia lớp chưa
      const [studentMembers] = await pool.execute(
        'SELECT * FROM class_members WHERE class_id = ? AND user_id = ? AND role = "student"',
        [classId, userId]
      );
      hasAccess = studentMembers.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lớp học này' });
    }

    // Lấy danh sách lịch học
    const [schedules] = await pool.execute(`
      SELECT cs.*, c.name as class_name, u.full_name as teacher_name
      FROM class_schedules cs
      JOIN classes c ON cs.class_id = c.id
      JOIN users u ON cs.created_by = u.id
      WHERE cs.class_id = ?
      ORDER BY FIELD(cs.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), cs.start_time
    `, [classId]);

    console.log('Found schedules:', schedules.length);

    res.json({
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room,
        subject: schedule.subject,
        description: schedule.description,
        type: schedule.type,
        class_name: schedule.class_name,
        teacher_name: schedule.teacher_name,
        created_at: schedule.created_at
      }))
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật lịch học (chỉ giáo viên sở hữu)
router.put('/:classId/schedules/:scheduleId', auth, requireRole(['teacher']), [
  body('day_of_week').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Ngày trong tuần không hợp lệ'),
  body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Thời gian bắt đầu không hợp lệ'),
  body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Thời gian kết thúc không hợp lệ'),
  body('room').optional(),
  body('subject').notEmpty().withMessage('Môn học không được để trống'),
  body('type').optional(),
  body('online_link').optional()
], async (req, res) => {
  try {
    console.log('=== UPDATE SCHEDULE ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const classId = req.params.classId;
    const scheduleId = req.params.scheduleId;
    const teacherId = req.user.userId;
    const { day_of_week, start_time, end_time, room, subject, description, type, online_link } = req.body;

    console.log('Class ID:', classId);
    console.log('Schedule ID:', scheduleId);
    console.log('Teacher ID:', teacherId);
    console.log('Update data:', { day_of_week, start_time, end_time, room, subject, description, type, online_link });

    // Ràng buộc theo hình thức
    const mode = (type && type !== 'offline') ? 'online' : 'offline';
    if (mode === 'offline' && (!room || !String(room).trim())) {
      return res.status(400).json({ message: 'Phòng học là bắt buộc đối với lịch học trực tiếp' });
    }
    if (mode === 'online' && (!online_link || !String(online_link).trim())) {
      return res.status(400).json({ message: 'Link phòng trực tuyến là bắt buộc đối với lịch học trực tuyến' });
    }

    // Kiểm tra giáo viên có sở hữu lớp học không
    const [teacherClasses] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (teacherClasses.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật lịch học cho lớp này' });
    }

    // Kiểm tra lịch học có tồn tại không
    const [existingSchedules] = await pool.execute(
      'SELECT id FROM class_schedules WHERE id = ? AND class_id = ?',
      [scheduleId, classId]
    );

    if (existingSchedules.length === 0) {
      return res.status(404).json({ message: 'Lịch học không tồn tại' });
    }

    // Kiểm tra xem có lịch học khác vào thời gian này không (trừ lịch hiện tại)
    const [conflictingSchedules] = await pool.execute(
      'SELECT id FROM class_schedules WHERE class_id = ? AND day_of_week = ? AND start_time = ? AND id != ?',
      [classId, day_of_week, start_time, scheduleId]
    );

    if (conflictingSchedules.length > 0) {
      return res.status(400).json({ message: 'Đã có lịch học khác vào thời gian này' });
    }

    // Cập nhật lịch học
    await pool.execute(`
      UPDATE class_schedules 
      SET day_of_week = ?, start_time = ?, end_time = ?, room = ?, subject = ?, description = ?, type = ?, online_link = ?
      WHERE id = ?
    `, [day_of_week, start_time, end_time, room || '', subject, description || '', mode, online_link || null, scheduleId]);

    console.log('Schedule updated successfully');

    res.json({
      message: 'Cập nhật lịch học thành công'
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật lịch học' });
  }
});

// Xóa lịch học (chỉ giáo viên sở hữu)
router.delete('/:classId/schedules/:scheduleId', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== DELETE SCHEDULE ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    const classId = req.params.classId;
    const scheduleId = req.params.scheduleId;
    const teacherId = req.user.userId;

    console.log('Class ID:', classId);
    console.log('Schedule ID:', scheduleId);
    console.log('Teacher ID:', teacherId);

    // Kiểm tra giáo viên có sở hữu lớp học không
    const [teacherClasses] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );

    if (teacherClasses.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa lịch học cho lớp này' });
    }

    // Kiểm tra lịch học có tồn tại không
    const [existingSchedules] = await pool.execute(
      'SELECT id FROM class_schedules WHERE id = ? AND class_id = ?',
      [scheduleId, classId]
    );

    if (existingSchedules.length === 0) {
      return res.status(404).json({ message: 'Lịch học không tồn tại' });
    }

    // Xóa lịch học
    await pool.execute('DELETE FROM class_schedules WHERE id = ?', [scheduleId]);

    console.log('Schedule deleted successfully');

    res.json({
      message: 'Xóa lịch học thành công'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa lịch học' });
  }
});

module.exports = router; 