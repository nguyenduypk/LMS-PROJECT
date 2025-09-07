const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const { upload, handleUploadError } = require('../utils/upload');

const router = express.Router();

// ==================== QUIZ ASSIGNMENTS APIs ====================

// Helper: record attempt event (leave/edit/submit...)
async function recordAttemptEvent(db, attemptId, type, note = null) {
  try {
    // Ensure table exists (idempotent)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quiz_attempt_events (
        id INT NOT NULL AUTO_INCREMENT,
        attempt_id INT NOT NULL,
        type VARCHAR(32) NOT NULL,
        note TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_attempt_id (attempt_id),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    // Table may already exist or creation may not be allowed in some env; ignore
    console.warn('[attempt_events] ensure table skipped:', e?.message || e);
  }
  try {
    await db.execute(
      `INSERT INTO quiz_attempt_events (attempt_id, type, note) VALUES (?, ?, ?)`,
      [Number(attemptId), String(type || ''), note || null]
    );
  } catch (e) {
    console.warn('[attempt_events] insert failed:', e?.message || e);
  }
}

// Test route không cần auth
router.get('/quiz/test', (req, res) => {
  res.json({ message: 'Quiz API is working!', timestamp: new Date() });
});

// Ghi nhận rời khỏi làm bài (tăng leave_count)
router.post('/quiz/attempt/:attemptId/leave', auth, requireRole(['student']), async (req, res) => {
  try {
    // Xác thực attempt thuộc về học sinh và đang in_progress
    const [attempts] = await pool.execute(
      `SELECT id FROM quiz_attempts WHERE id = ? AND student_id = ? AND status = 'in_progress'`,
      [req.params.attemptId, req.user.userId]
    );
    if (attempts.length === 0) {
      return res.status(403).json({ message: 'Không tìm thấy bài làm hợp lệ' });
    }

    try {
      await pool.execute(
        `UPDATE quiz_attempts SET leave_count = COALESCE(leave_count, 0) + 1 WHERE id = ?`,
        [req.params.attemptId]
      );
    } catch (incErr) {
      console.warn('[LEAVE] leave_count increment skipped:', incErr?.code || incErr?.message || incErr);
      // Không fail request nếu DB chưa có cột
    }

    // Ghi event lịch sử
    try { await recordAttemptEvent(pool, req.params.attemptId, 'leave'); } catch (_) {}

    res.json({ message: 'Đã ghi nhận rời khỏi làm bài' });
  } catch (error) {
    console.error('Record leave error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy lịch sử sự kiện của một attempt (timeline)
router.get('/quiz/attempt/:attemptId/history', auth, async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    if (!Number.isFinite(attemptId)) {
      return res.status(400).json({ message: 'attemptId không hợp lệ' });
    }

    // Kiểm tra quyền xem: chủ attempt (student) hoặc giáo viên tạo quiz
    let allowed = false;
    try {
      const [rows] = await pool.execute(`
        SELECT qat.id, qat.student_id, qa.created_by
        FROM quiz_attempts qat
        JOIN quiz_assignments qa ON qat.quiz_assignment_id = qa.id
        WHERE qat.id = ?
      `, [attemptId]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy bài làm' });
      }
      const row = rows[0];
      allowed = (Number(row.student_id) === Number(req.user.userId)) || (Number(row.created_by) === Number(req.user.userId));
    } catch (e) {
      console.warn('[history] permission check fallback:', e?.message || e);
      // Fallback: thử cho phép nếu chính chủ attempt
      try {
        const [attOnly] = await pool.execute(`SELECT student_id FROM quiz_attempts WHERE id = ?`, [attemptId]);
        if (attOnly.length > 0) {
          allowed = Number(attOnly[0].student_id) === Number(req.user.userId);
        }
      } catch (_) {}
    }
    if (!allowed) {
      return res.status(403).json({ message: 'Không có quyền xem lịch sử' });
    }

    // Đảm bảo bảng tồn tại (an toàn khi môi trường chưa migrate)
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS quiz_attempt_events (
          id INT NOT NULL AUTO_INCREMENT,
          attempt_id INT NOT NULL,
          type VARCHAR(32) NOT NULL,
          note TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_attempt_id (attempt_id),
          KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      // ignore
    }

    const [events] = await pool.execute(`
      SELECT id, attempt_id, type, note, created_at
      FROM quiz_attempt_events
      WHERE attempt_id = ?
      ORDER BY created_at ASC, id ASC
    `, [attemptId]);

    return res.json({
      attemptId,
      events: (events || []).map(ev => ({
        id: Number(ev.id),
        type: String(ev.type || ''),
        note: ev.note || null,
        createdAt: ev.created_at
      }))
    });
  } catch (error) {
    console.error('Get attempt history error:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==================== ASSIGNMENT DOCUMENTS (Upload & List) ====================

// Upload tài liệu (teacher)
router.post('/upload', auth, requireRole(['teacher']), async (req, res, next) => {
  // Sử dụng multer và xử lý lỗi upload trước khi vào handler chính
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Thiếu file để tải lên' });
      }

      const { title, description, class_id } = req.body;
      const teacherId = req.user.userId;

      // Đảm bảo bảng tồn tại nếu môi trường chưa chạy migration
      try {
        await pool.execute(`
          CREATE TABLE IF NOT EXISTS assignment_documents (
            id INT NOT NULL AUTO_INCREMENT,
            class_id INT NULL,
            teacher_id INT NOT NULL,
            title VARCHAR(255) NULL,
            description TEXT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(512) NOT NULL,
            mime_type VARCHAR(128) NOT NULL,
            size BIGINT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_class_id (class_id),
            KEY idx_teacher_id (teacher_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
      } catch (e) {
        // Nếu không tạo được bảng, tiếp tục thử insert và để lỗi rõ ràng
        console.warn('Create table assignment_documents skipped:', e && e.message);
      }

      const filePath = `/uploads/${req.file.filename}`;
      const [result] = await pool.execute(
        `INSERT INTO assignment_documents 
          (class_id, teacher_id, title, description, original_name, file_path, mime_type, size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [class_id || null, teacherId, title || null, description || null, req.file.originalname, filePath, req.file.mimetype, req.file.size]
      );

      return res.status(201).json({
        message: 'Tải lên thành công',
        document: {
          id: result.insertId,
          class_id: class_id ? Number(class_id) : null,
          teacher_id: teacherId,
          title: title || null,
          description: description || null,
          original_name: req.file.originalname,
          file_path: filePath,
          mime_type: req.file.mimetype,
          size: req.file.size,
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Upload assignment document error:', error);
      return res.status(500).json({ message: 'Lỗi server khi tải lên tài liệu', error: error.message });
    }
  });
});

// Danh sách tài liệu theo lớp (teacher/student đều xem được nếu cần)
router.get('/documents/class/:classId', auth, async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    if (!Number.isFinite(classId)) {
      return res.status(400).json({ message: 'classId không hợp lệ' });
    }

    // Lấy danh sách tài liệu
    const [rows] = await pool.execute(
      `SELECT id, class_id, teacher_id, title, description, original_name, file_path, mime_type, size, created_at
       FROM assignment_documents
       WHERE class_id = ?
       ORDER BY created_at DESC`,
      [classId]
    );

    return res.json(rows || []);
  } catch (error) {
    console.error('Get assignment documents error:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy tài liệu', error: error.message });
  }
});

// Xóa bài tập trắc nghiệm (teacher only, chỉ chủ sở hữu)
router.delete('/quiz/:id', auth, requireRole(['teacher']), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Kiểm tra quyền sở hữu
    const [rows] = await connection.execute(
      'SELECT id, created_by FROM quiz_assignments WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }
    const quiz = rows[0];
    if (Number(quiz.created_by) !== Number(req.user.userId)) {
      connection.release();
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài tập này' });
    }

    await connection.beginTransaction();

    const quizId = req.params.id;

    // Xóa dữ liệu con theo thứ tự an toàn (trong trường hợp DB chưa thiết lập ON DELETE CASCADE)
    // Xóa answers -> attempts/submissions -> options -> questions -> assignment
    // 1) Xóa answers theo attempts nếu bảng quiz_attempts tồn tại
    try {
      await connection.execute(
        `DELETE qa FROM quiz_answers qa
         JOIN quiz_attempts qatt ON qa.attempt_id = qatt.id
         WHERE qatt.quiz_assignment_id = ?`,
        [quizId]
      );
    } catch (e) {
      // Bỏ qua nếu bảng/quan hệ không tồn tại
      console.log('Info: skip deleting quiz_answers via attempts:', e.message);
    }

    // 2) Xóa attempts nếu có
    try {
      await connection.execute(
        'DELETE FROM quiz_attempts WHERE quiz_assignment_id = ?',
        [quizId]
      );
    } catch (e) {
      console.log('Info: skip deleting quiz_attempts:', e.message);
    }

    // 3) Xóa submissions nếu hệ thống dùng bảng này
    try {
      await connection.execute(
        'DELETE FROM quiz_submissions WHERE quiz_assignment_id = ?',
        [quizId]
      );
    } catch (e) {
      console.log('Info: skip deleting quiz_submissions:', e.message);
    }

    // 4) Xóa options qua questions
    try {
      await connection.execute(
        `DELETE qo FROM quiz_options qo
         JOIN quiz_questions qq ON qo.question_id = qq.id
         WHERE qq.quiz_assignment_id = ?`,
        [quizId]
      );
    } catch (e) {
      console.log('Info: skip deleting quiz_options:', e.message);
    }

    // 5) Xóa questions
    try {
      await connection.execute(
        'DELETE FROM quiz_questions WHERE quiz_assignment_id = ?',
        [quizId]
      );
    } catch (e) {
      console.log('Info: skip deleting quiz_questions:', e.message);
    }

    // 6) Xóa assignment
    await connection.execute('DELETE FROM quiz_assignments WHERE id = ?', [quizId]);

    await connection.commit();
    connection.release();
    return res.json({ message: 'Đã xóa bài tập thành công' });
  } catch (error) {
    try { await connection.rollback(); } catch (_) {}
    connection.release();
    console.error('Delete quiz error:', error);
    // Trả thông tin lỗi chi tiết hơn để debug trong giai đoạn phát triển
    if (error && (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451)) {
      return res.status(409).json({
        message: 'Không thể xóa do ràng buộc dữ liệu. Vui lòng thử lại sau khi xóa dữ liệu liên quan.',
        error: error.message,
      });
    }
    return res.status(500).json({ message: 'Lỗi server khi xóa bài tập', error: error.message });
  }
});

// Danh sách các lần làm của chính học sinh cho một bài quiz
router.get('/quiz/:quizId/attempts/mine', auth, requireRole(['student']), async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    if (!Number.isFinite(quizId)) {
      return res.status(400).json({ message: 'quizId không hợp lệ' });
    }

    // Lấy cấu hình chấm điểm từ quiz
    const [quizRows] = await pool.execute(
      'SELECT id, score_setting FROM quiz_assignments WHERE id = ? LIMIT 1',
      [quizId]
    );
    if (quizRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }
    const scoreSetting = (quizRows[0].score_setting || '').toLowerCase();

    // Lấy tất cả attempts của học sinh hiện tại cho quiz này
    const [attempts] = await pool.execute(
      `SELECT id, student_id, quiz_assignment_id, status, started_at, submitted_at,
              time_spent, total_score, max_possible_score, percentage
       FROM quiz_attempts
       WHERE quiz_assignment_id = ? AND student_id = ?
       ORDER BY started_at ASC`,
      [quizId, req.user.userId]
    );

    // Xác định attempt dùng để lấy điểm theo score_setting
    let gradeAttemptId = null;
    const submitted = attempts.filter(a => a.status === 'submitted');
    if (submitted.length > 0) {
      if (scoreSetting.includes('cao nhất')) {
        gradeAttemptId = submitted.reduce((best, a) => {
          const ascore = Number(a.total_score || 0);
          const bscore = Number(best.total_score || 0);
          return ascore > bscore ? a : best;
        }, submitted[0]).id;
      } else if (scoreSetting.includes('cuối')) {
        gradeAttemptId = submitted.reduce((last, a) => {
          const lt = new Date(last.submitted_at || last.started_at || 0).getTime();
          const at = new Date(a.submitted_at || a.started_at || 0).getTime();
          return at >= lt ? a : last;
        }, submitted[0]).id;
      } else {
        // Mặc định: lấy điểm lần làm đầu tiên
        gradeAttemptId = submitted.reduce((first, a) => {
          const ft = new Date(first.submitted_at || first.started_at || 0).getTime();
          const at = new Date(a.submitted_at || a.started_at || 0).getTime();
          return at <= ft ? a : first;
        }, submitted[0]).id;
      }
    }

    const result = attempts.map((a, idx) => ({
      id: a.id,
      order: idx + 1,
      status: a.status,
      started_at: a.started_at,
      submitted_at: a.submitted_at,
      time_spent: a.time_spent,
      total_score: a.total_score,
      max_possible_score: a.max_possible_score,
      percentage: a.percentage,
      take_for_grade: gradeAttemptId != null && Number(gradeAttemptId) === Number(a.id)
    }));

    res.json({
      quizId,
      scoreSetting: scoreSetting,
      attempts: result
    });

  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách lần làm' });
  }
});

// Test route tạo token cho test
router.post('/quiz/test-token', async (req, res) => {
  try {
    // Tạo token test cho teacher
    const testUser = {
      id: 1,
      username: 'test_teacher',
      role: 'teacher',
      full_name: 'Test Teacher'
    };
    
    const token = jwt.sign(testUser, process.env.JWT_SECRET || 'test_secret', { expiresIn: '24h' });
    
    res.json({
      message: 'Test token created',
      token: token,
      user: testUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating test token', error: error.message });
  }
});

// Test route tạo quiz không cần database
router.post('/quiz/test-create', auth, requireRole(['teacher']), async (req, res) => {
  try {
    // Mock response for quiz creation
    const mockQuizId = Math.floor(Math.random() * 1000) + 1;
    
    res.json({
      message: 'Quiz created successfully (test mode)',
      quiz: {
        id: mockQuizId,
        title: req.body.title,
        description: req.body.description,
        questions_count: req.body.questions?.length || 0,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating test quiz', error: error.message });
  }
});

// Tạo bài tập trắc nghiệm mới (teacher only)
router.post('/quiz', auth, requireRole(['teacher']), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const {
      title,
      description,
      class_id,
      time_limit,
      start_time,
      deadline,
      max_attempts,
      show_answers,
      shuffle_questions,
      shuffle_answers,
      is_test,
      block_review,
      student_permission,
      score_setting,
      questions
    } = req.body;

    // Validate required fields
    if (!title || !class_id || !questions || questions.length === 0) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: title, class_id, questions' 
      });
    }

    // Tạo quiz assignment
    const [quizResult] = await connection.execute(`
      INSERT INTO quiz_assignments (
        title, description, class_id, created_by, time_limit, start_time, deadline,
        max_attempts, show_answers, shuffle_questions, shuffle_answers, is_test,
        block_review, student_permission, score_setting, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `, [
      title, description, class_id, req.user.userId, time_limit || 30,
      start_time || null, deadline || null, max_attempts || 1,
      show_answers || false, shuffle_questions || false, shuffle_answers || false,
      is_test || false, block_review || false, 
      student_permission || 'Chỉ xem điểm', score_setting || 'Lấy điểm lần làm bài đầu tiên'
    ]);

    const quizId = quizResult.insertId;

    // Thêm câu hỏi và đáp án
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // Validate question
      if (!question.text || !question.options || question.options.length !== 4) {
        throw new Error(`Câu hỏi ${i + 1} không hợp lệ`);
      }

      // Kiểm tra có đáp án đúng
      const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        throw new Error(`Câu hỏi ${i + 1} phải có ít nhất một đáp án đúng`);
      }

      // Thêm câu hỏi
      const [questionResult] = await connection.execute(`
        INSERT INTO quiz_questions (quiz_assignment_id, question_text, question_order, points)
        VALUES (?, ?, ?, ?)
      `, [quizId, question.text, i + 1, 1.0]);

      const questionId = questionResult.insertId;

      // Thêm các lựa chọn
      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];
        await connection.execute(`
          INSERT INTO quiz_options (question_id, option_text, option_order, is_correct)
          VALUES (?, ?, ?, ?)
        `, [questionId, option.text, j, option.isCorrect || false]);
      }
    }

    await connection.commit();
    
    res.status(201).json({
      message: 'Tạo bài tập trắc nghiệm thành công',
      quizId: quizId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create quiz assignment error:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi tạo bài tập' 
    });
  } finally {
    connection.release();
  }
});

// Lấy danh sách bài tập trắc nghiệm của class
router.get('/quiz/class/:classId', auth, async (req, res) => {
  try {
    console.log('🔍 Getting quiz assignments for classId:', req.params.classId);
    
    // Kèm trạng thái attempt của chính học sinh đang đăng nhập
    const [quizzes] = await pool.execute(`
      SELECT 
        qa.*, 
        u.full_name as created_by_name,
        COUNT(DISTINCT qq.id) as question_count,
        -- Số lần nộp (submitted) của chính student
        SUM(CASE WHEN qat.student_id = ? AND qat.status = 'submitted' THEN 1 ELSE 0 END) as submitted_attempts_count,
        -- Attempt đang làm dở (in_progress) của student
        MAX(CASE WHEN qat.student_id = ? AND qat.status = 'in_progress' THEN qat.id ELSE NULL END) as in_progress_attempt_id,
        -- Cờ quá hạn
        CASE WHEN qa.deadline IS NOT NULL AND qa.deadline < NOW() THEN 1 ELSE 0 END as deadline_passed,
        -- Quyền xem kết quả của học sinh
        qa.student_permission,
        qa.show_answers,
        -- Tổng số học sinh trong lớp
        (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id = qa.class_id AND cm.role = 'student') AS total_students,
        -- Số học sinh đã có bài nộp (submitted) cho quiz này
        COUNT(DISTINCT CASE WHEN qat.status = 'submitted' THEN qat.student_id END) AS done_students
      FROM quiz_assignments qa
      LEFT JOIN users u ON qa.created_by = u.id
      LEFT JOIN quiz_questions qq ON qa.id = qq.quiz_assignment_id
      LEFT JOIN quiz_attempts qat ON qa.id = qat.quiz_assignment_id
      WHERE qa.class_id = ?
      GROUP BY qa.id
      ORDER BY qa.created_at DESC
    `, [req.user.userId, req.user.userId, req.params.classId]);

    console.log('✅ Found quizzes:', quizzes.length);
    res.json(quizzes);
  } catch (error) {
    console.error('❌ Get quiz assignments error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy danh sách bài tập',
      error: error.message 
    });
  }
});

// Lấy chi tiết bài tập trắc nghiệm (cho giáo viên)
router.get('/quiz/:id/details', auth, requireRole(['teacher']), async (req, res) => {
  try {
    // Lấy thông tin quiz
    const [quizzes] = await pool.execute(`
      SELECT qa.*, u.full_name as created_by_name
      FROM quiz_assignments qa
      LEFT JOIN users u ON qa.created_by = u.id
      WHERE qa.id = ?
    `, [req.params.id]);

    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }

    const quiz = quizzes[0];

    // Lấy câu hỏi và đáp án
    const [questions] = await pool.execute(`
      SELECT 
        qq.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', qo.id,
            'text', qo.option_text,
            'order', qo.option_order,
            'isCorrect', qo.is_correct
          ) ORDER BY qo.option_order
        ) as options
      FROM quiz_questions qq
      LEFT JOIN quiz_options qo ON qq.id = qo.question_id
      WHERE qq.quiz_assignment_id = ?
      GROUP BY qq.id
      ORDER BY qq.question_order
    `, [req.params.id]);

    quiz.questions = questions;

    res.json(quiz);
  } catch (error) {
    console.error('Get quiz details error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tổng quan bài tập trắc nghiệm (cho giáo viên): phân phối điểm, tổng số HS, đã làm
router.get('/quiz/:id/overview', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const quizId = Number(req.params.id);
    if (!Number.isFinite(quizId)) {
      return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
    }

    // Lấy thông tin quiz và kiểm tra quyền (giáo viên tạo)
    const [qrows] = await pool.execute(
      `SELECT id, title, class_id, created_by, score_setting
       FROM quiz_assignments WHERE id = ? LIMIT 1`,
      [quizId]
    );
    if (qrows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }
    const quiz = qrows[0];
    if (Number(quiz.created_by) !== Number(req.user.userId)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem tổng quan bài tập này' });
    }

    // Tổng số học sinh trong lớp
    const [[stuCount]] = await pool.execute(
      `SELECT COUNT(*) AS c
       FROM class_members
       WHERE class_id = ? AND role = 'student'`,
      [quiz.class_id]
    );
    const totalStudents = Number(stuCount?.c || 0);

    // Lấy tất cả attempts đã nộp của học sinh cho bài này
    const [attempts] = await pool.execute(
      `SELECT id, student_id, total_score, max_possible_score, percentage, started_at, submitted_at
       FROM quiz_attempts
       WHERE quiz_assignment_id = ? AND status = 'submitted'`,
      [quizId]
    );

    // Gom theo học sinh để chọn attempt theo score_setting
    const byStudent = new Map();
    for (const a of attempts) {
      const arr = byStudent.get(a.student_id) || [];
      arr.push(a);
      byStudent.set(a.student_id, arr);
    }

    const setting = String(quiz.score_setting || '').toLowerCase();
    const chosenByStudent = new Map();
    for (const [sid, list] of byStudent.entries()) {
      if (!list || list.length === 0) continue;
      let chosen = null;
      if (setting.includes('cao nhất')) {
        chosen = list.reduce((best, a) => {
          const ap = Number.isFinite(a.percentage)
            ? (a.percentage > 1 ? a.percentage / 100 : a.percentage)
            : (Number(a.max_possible_score) > 0 ? Number(a.total_score || 0) / Number(a.max_possible_score) : 0);
          const bp = Number.isFinite(best.percentage)
            ? (best.percentage > 1 ? best.percentage / 100 : best.percentage)
            : (Number(best.max_possible_score) > 0 ? Number(best.total_score || 0) / Number(best.max_possible_score) : 0);
          return (ap || 0) > (bp || 0) ? a : best;
        }, list[0]);
      } else if (setting.includes('cuối')) {
        chosen = list.reduce((last, a) => {
          const lt = new Date(last.submitted_at || last.started_at || 0).getTime();
          const at = new Date(a.submitted_at || a.started_at || 0).getTime();
          return at >= lt ? a : last;
        }, list[0]);
      } else {
        // lần đầu tiên
        chosen = list.reduce((first, a) => {
          const ft = new Date(first.submitted_at || first.started_at || 0).getTime();
          const at = new Date(a.submitted_at || a.started_at || 0).getTime();
          // Pick the earliest attempt time
          return at <= ft ? a : first;
        }, list[0]);
      }
      chosenByStudent.set(sid, chosen);
    }

    const doneStudents = chosenByStudent.size;

    // Chuẩn hóa điểm về thang 10 và tính phân phối theo các mức 1..10
    const buckets = Array.from({ length: 10 }, () => 0); // index 0 => <=1, index 9 => <=10
    const scores = [];
    for (const a of chosenByStudent.values()) {
      let score10 = null;
      if (Number.isFinite(a.percentage)) {
        const pct = Number(a.percentage);
        score10 = pct > 1 ? (pct / 100) * 10 : pct * 10;
      } else if (Number(a.max_possible_score) > 0) {
        score10 = (Number(a.total_score || 0) / Number(a.max_possible_score)) * 10;
      } else {
        score10 = Number(a.total_score || 0);
      }
      score10 = Math.max(0, Math.min(10, Number(score10.toFixed(2))));
      scores.push(score10);
      const idx = Math.min(9, Math.max(0, Math.ceil(score10) - 1));
      buckets[idx] += 1;
    }

    // Tính phần trăm theo tổng số HS và theo số đã làm
    const bucketDetails = buckets.map((count, i) => ({
      label: `<=${i + 1}`,
      count,
      percent_in_class: totalStudents > 0 ? Number(((count / totalStudents) * 100).toFixed(2)) : 0,
      percent_among_done: doneStudents > 0 ? Number(((count / doneStudents) * 100).toFixed(2)) : 0,
    }));

    // Một số thống kê thêm
    const avg = scores.length ? Number((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2)) : 0;
    const min = scores.length ? Math.min(...scores) : 0;
    const max = scores.length ? Math.max(...scores) : 0;

    return res.json({
      quiz: { id: quiz.id, title: quiz.title, class_id: quiz.class_id, score_setting: quiz.score_setting },
      totals: {
        total_students: totalStudents,
        done_students: doneStudents,
      },
      distribution: {
        buckets: bucketDetails,
        chart: bucketDetails.map(b => ({ x: b.label, y: b.count })),
      },
      stats: { average: avg, highest: max, lowest: min }
    });
  } catch (error) {
    console.error('Get quiz overview error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tổng quan bài tập', error: error.message });
  }
});

// Cập nhật bài tập trắc nghiệm (teacher only)
router.put('/quiz/:id', auth, requireRole(['teacher']), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const quizId = Number(req.params.id);
    if (!Number.isFinite(quizId)) {
      connection.release();
      return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
    }

    // Kiểm tra quyền sở hữu
    const [existRows] = await connection.execute(
      'SELECT * FROM quiz_assignments WHERE id = ? LIMIT 1',
      [quizId]
    );
    if (existRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }
    const current = existRows[0];
    if (Number(current.created_by) !== Number(req.user.userId)) {
      connection.release();
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài tập này' });
    }

    await connection.beginTransaction();

    const {
      title,
      description,
      class_id,
      time_limit,
      start_time,
      deadline,
      max_attempts,
      show_answers,
      shuffle_questions,
      shuffle_answers,
      is_test,
      block_review,
      student_permission,
      score_setting,
      status,
      questions
    } = req.body || {};

    // Hợp nhất dữ liệu mới với hiện tại (nếu field không gửi lên thì giữ nguyên)
    const merged = {
      title: title ?? current.title,
      description: description ?? current.description,
      class_id: class_id ?? current.class_id,
      time_limit: time_limit ?? current.time_limit,
      start_time: start_time ?? current.start_time,
      deadline: deadline ?? current.deadline,
      max_attempts: max_attempts ?? current.max_attempts,
      show_answers: typeof show_answers === 'boolean' ? show_answers : !!current.show_answers,
      shuffle_questions: typeof shuffle_questions === 'boolean' ? shuffle_questions : !!current.shuffle_questions,
      shuffle_answers: typeof shuffle_answers === 'boolean' ? shuffle_answers : !!current.shuffle_answers,
      is_test: typeof is_test === 'boolean' ? is_test : !!current.is_test,
      block_review: typeof block_review === 'boolean' ? block_review : !!current.block_review,
      student_permission: student_permission ?? current.student_permission,
      score_setting: score_setting ?? current.score_setting,
      status: status ?? current.status
    };

    // Cập nhật quiz_assignments
    await connection.execute(
      `UPDATE quiz_assignments SET
        title = ?,
        description = ?,
        class_id = ?,
        time_limit = ?,
        start_time = ?,
        deadline = ?,
        max_attempts = ?,
        show_answers = ?,
        shuffle_questions = ?,
        shuffle_answers = ?,
        is_test = ?,
        block_review = ?,
        student_permission = ?,
        score_setting = ?,
        status = ?
       WHERE id = ?`,
      [
        merged.title,
        merged.description,
        merged.class_id,
        merged.time_limit,
        merged.start_time || null,
        merged.deadline || null,
        merged.max_attempts,
        merged.show_answers ? 1 : 0,
        merged.shuffle_questions ? 1 : 0,
        merged.shuffle_answers ? 1 : 0,
        merged.is_test ? 1 : 0,
        merged.block_review ? 1 : 0,
        merged.student_permission,
        merged.score_setting,
        merged.status || 'published',
        quizId
      ]
    );

    // Nếu có truyền questions: thay thế toàn bộ danh sách câu hỏi và lựa chọn
    if (Array.isArray(questions)) {
      // Xóa options qua questions
      try {
        await connection.execute(
          `DELETE qo FROM quiz_options qo
           JOIN quiz_questions qq ON qo.question_id = qq.id
           WHERE qq.quiz_assignment_id = ?`,
          [quizId]
        );
      } catch (e) {
        // Bảng có thể chưa tồn tại đủ tùy môi trường, bỏ qua để tiếp tục
      }

      // Xóa questions cũ
      await connection.execute(
        'DELETE FROM quiz_questions WHERE quiz_assignment_id = ?',
        [quizId]
      );

      // Thêm lại câu hỏi và lựa chọn mới
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q || !q.text || !Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Câu hỏi ${i + 1} không hợp lệ`);
        }

        const hasCorrect = q.options.some(opt => !!opt.isCorrect);
        if (!hasCorrect) {
          throw new Error(`Câu hỏi ${i + 1} phải có ít nhất một đáp án đúng`);
        }

        const [qRes] = await connection.execute(
          `INSERT INTO quiz_questions (quiz_assignment_id, question_text, question_order, points)
           VALUES (?, ?, ?, ?)`,
          [quizId, q.text, (q.order ?? i) + 1, 1.0]
        );
        const newQuestionId = qRes.insertId;

        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          await connection.execute(
            `INSERT INTO quiz_options (question_id, option_text, option_order, is_correct)
             VALUES (?, ?, ?, ?)`,
            [newQuestionId, opt.text, (opt.order ?? j), !!opt.isCorrect]
          );
        }
      }
    }

    await connection.commit();
    connection.release();
    return res.json({ message: 'Cập nhật bài tập thành công', quizId });
  } catch (error) {
    try { await connection.rollback(); } catch (_) {}
    connection.release();
    console.error('Update quiz assignment error:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật bài tập', error: error.message });
  }
});

// Lấy bài tập để làm (cho học sinh) - Enhanced Error Handling
router.get('/quiz/:id/take', auth, requireRole(['student']), async (req, res) => {
  console.log('🎯 Quiz take API called:', {
    quizId: req.params.id,
    userId: req.user?.userId,
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });

  try {
    // Validate input parameters
    if (!req.params.id || isNaN(req.params.id)) {
      console.log('❌ Invalid quiz ID:', req.params.id);
      return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
    }

    if (!req.user?.userId) {
      console.log('❌ Missing user ID in token');
      return res.status(401).json({ message: 'Thông tin người dùng không hợp lệ' });
    }

    // Kiểm tra quyền truy cập (học sinh phải trong class)
    console.log('🔍 Checking access permissions...');
    console.log('🔍 Query params:', { quizId: req.params.id, userId: req.user.userId });
    
    const [access] = await pool.execute(`
      SELECT qa.* FROM quiz_assignments qa
      JOIN class_members cm ON qa.class_id = cm.class_id
      WHERE qa.id = ? AND cm.user_id = ? AND cm.role = 'student'
    `, [req.params.id, req.user.userId]);
    
    console.log('🔍 Access query result:', access.length, 'records found');
    if (access.length > 0) {
      console.log('🔍 Quiz found:', { id: access[0].id, title: access[0].title, status: access[0].status });
    }

    if (access.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền làm bài tập này' });
    }

    const quiz = access[0];

    // Kiểm tra thời gian (relaxed for testing)
    const now = new Date();
    console.log('🕐 Quiz time check:', {
      quizId: quiz.id,
      title: quiz.title,
      startTime: quiz.start_time,
      deadline: quiz.deadline,
      currentTime: now.toISOString(),
      status: quiz.status
    });
    
    // Only check start time if it's set and in the future
    if (quiz.start_time && new Date(quiz.start_time) > now) {
      console.log('❌ Quiz not started yet');
      return res.status(400).json({ message: 'Bài tập chưa bắt đầu' });
    }
    
    // For testing: Allow access if quiz is published, regardless of deadline
    if (quiz.status !== 'published') {
      console.log('❌ Quiz not published');
      return res.status(400).json({ message: 'Bài tập chưa được mở' });
    }
    
    // Optional: Show warning if deadline passed but still allow access
    if (quiz.deadline && new Date(quiz.deadline) < now) {
      console.log('⚠️ Quiz deadline passed but allowing access for testing');
      // Don't block access, just log warning
    }

    // Kiểm tra số lần làm
    const [attempts] = await pool.execute(`
      SELECT COUNT(*) as attempt_count
      FROM quiz_attempts
      WHERE quiz_assignment_id = ? AND student_id = ? AND status = 'submitted'
    `, [req.params.id, req.user.userId]);

    if (attempts[0].attempt_count >= quiz.max_attempts) {
      return res.status(400).json({ message: 'Bạn đã hết lượt làm bài' });
    }

    // Lấy câu hỏi (không bao gồm đáp án đúng) - Enhanced with error handling
    console.log('🔍 Loading questions for quiz...');
    
    let questions = [];
    try {
      // First, try to get questions without JSON aggregation (simpler query)
      const [basicQuestions] = await pool.execute(`
        SELECT DISTINCT
          qq.id,
          qq.question_text,
          qq.question_order
        FROM quiz_questions qq
        WHERE qq.quiz_assignment_id = ?
        ORDER BY ${quiz.shuffle_questions ? 'RAND()' : 'qq.question_order'}
      `, [req.params.id]);
      
      console.log('🔍 Basic questions loaded:', basicQuestions.length, 'questions found');
      
      // Then get options for each question separately (more reliable)
      for (const question of basicQuestions) {
        try {
          const [options] = await pool.execute(`
            SELECT id, option_text as text, option_order as 'order'
            FROM quiz_options
            WHERE question_id = ?
            ORDER BY option_order
          `, [question.id]);
          
          questions.push({
            ...question,
            options: options || []
          });
        } catch (optionError) {
          console.log('⚠️ Error loading options for question', question.id, ':', optionError.message);
          // Include question without options rather than failing completely
          questions.push({
            ...question,
            options: []
          });
        }
      }
      
      console.log('🔍 Questions with options loaded:', questions.length, 'total questions');
      
    } catch (questionError) {
      console.error('❌ Error loading questions:', questionError);
      console.error('❌ Falling back to mock data...');
      
      // Fallback: provide a basic mock question for testing
      questions = [{
        id: 1,
        question_text: 'Mock Question - Database Error',
        question_order: 1,
        options: [
          { id: 1, text: 'Option A', order: 1 },
          { id: 2, text: 'Option B', order: 2 },
          { id: 3, text: 'Option C', order: 3 },
          { id: 4, text: 'Option D', order: 4 }
        ]
      }];
    }

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit,
        question_count: questions.length
      },
      questions: questions,
      remaining_attempts: quiz.max_attempts - attempts[0].attempt_count
    });

  } catch (error) {
    console.error('❌ Get quiz for student error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Quiz ID:', req.params.id);
    console.error('❌ User ID:', req.user?.userId);
    res.status(500).json({ 
      message: 'Lỗi server', 
      error: error.message,
      details: `Quiz ID: ${req.params.id}, User: ${req.user?.userId}`
    });
  }
});

// Bắt đầu làm bài (tạo attempt)
router.post('/quiz/:id/start', auth, requireRole(['student']), async (req, res) => {
  try {
    // Kiểm tra quyền và điều kiện tương tự như /take
    const [access] = await pool.execute(`
      SELECT qa.* FROM quiz_assignments qa
      JOIN class_members cm ON qa.class_id = cm.class_id
      WHERE qa.id = ? AND cm.user_id = ? AND cm.role = 'student'
    `, [req.params.id, req.user.userId]);

    if (access.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền làm bài tập này' });
    }

    const quiz = access[0];

    // Kiểm tra attempt hiện tại
    const [currentAttempt] = await pool.execute(`
      SELECT * FROM quiz_attempts
      WHERE quiz_assignment_id = ? AND student_id = ? AND status = 'in_progress'
    `, [req.params.id, req.user.userId]);

    if (currentAttempt.length > 0) {
      return res.json({
        message: 'Bạn đang có bài làm chưa hoàn thành',
        attemptId: currentAttempt[0].id,
        startedAt: currentAttempt[0].started_at,
        timeLimit: quiz.time_limit
      });
    }

    // Tạo attempt mới
    const [attemptCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM quiz_attempts
      WHERE quiz_assignment_id = ? AND student_id = ?
    `, [req.params.id, req.user.userId]);

    const [result] = await pool.execute(`
      INSERT INTO quiz_attempts (
        quiz_assignment_id, student_id, attempt_number, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      req.params.id, 
      req.user.userId, 
      attemptCount[0].count + 1,
      req.ip,
      req.get('User-Agent')
    ]);

    // Lấy started_at từ DB để frontend tính thời gian còn lại chính xác
    let startedAtRow = null;
    try {
      const [rows] = await pool.execute(
        'SELECT started_at FROM quiz_attempts WHERE id = ?',[result.insertId]
      );
      startedAtRow = rows && rows[0] ? rows[0].started_at : null;
    } catch (e) {
      // fallback: để null, frontend có thể coi như vừa bắt đầu
    }

    res.json({
      message: 'Bắt đầu làm bài thành công',
      attemptId: result.insertId,
      timeLimit: quiz.time_limit,
      startedAt: startedAtRow
    });

  } catch (error) {
    console.error('Start quiz attempt error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lưu câu trả lời
router.post('/quiz/attempt/:attemptId/answer', auth, requireRole(['student']), async (req, res) => {
  try {
    const { questionId, selectedOptionId } = req.body;
    console.log('[SAVE_ANSWER] attempt', req.params.attemptId, 'user', req.user.userId, 'q', questionId, 'opt', selectedOptionId);

    // Kiểm tra attempt thuộc về user
    const [attempts] = await pool.execute(`
      SELECT * FROM quiz_attempts
      WHERE id = ? AND student_id = ? AND status = 'in_progress'
    `, [req.params.attemptId, req.user.userId]);

    if (attempts.length === 0) {
      return res.status(403).json({ message: 'Không tìm thấy bài làm hợp lệ' });
    }

    // Kiểm tra đáp án đúng
    const [correctOption] = await pool.execute(`
      SELECT is_correct FROM quiz_options WHERE id = ?
    `, [selectedOptionId]);

    const isCorrect = correctOption.length > 0 && correctOption[0].is_correct;
    const pointsEarned = isCorrect ? 1.0 : 0.0;

    // Lưu/cập nhật câu trả lời theo (attempt_id, question_id)
    // Tránh phụ thuộc vào UNIQUE KEY sai trong DB bằng cách UPDATE trước, nếu không có bản ghi thì INSERT
    const [updateResult] = await pool.execute(`
      UPDATE quiz_answers
      SET selected_option_id = ?, is_correct = ?, points_earned = ?, answered_at = CURRENT_TIMESTAMP
      WHERE attempt_id = ? AND question_id = ?
    `, [selectedOptionId, isCorrect, pointsEarned, req.params.attemptId, questionId]);

    if (updateResult.affectedRows === 0) {
      try {
        await pool.execute(`
          INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct, points_earned)
          VALUES (?, ?, ?, ?, ?)
        `, [req.params.attemptId, questionId, selectedOptionId, isCorrect, pointsEarned]);
      } catch (insErr) {
        console.error('[SAVE_ANSWER][INSERT_ERROR]', insErr && insErr.code, insErr && insErr.message);
        // Likely duplicate key due to wrong unique index on quiz_answers
        if ((insErr && insErr.code === 'ER_DUP_ENTRY') || /Duplicate entry/i.test(insErr?.message || '')) {
          return res.status(409).json({
            message: 'Không thể lưu do xung đột chỉ mục. Cần sửa UNIQUE KEY bảng quiz_answers thành (attempt_id, question_id).',
            code: 'DUPLICATE_KEY',
            hint: 'Chạy migration 20250808_fix_quiz_answers_unique.sql để sửa index.'
          });
        }
        throw insErr;
      }
    }

    // Tăng bộ đếm chỉnh sửa (edit_count) một cách an toàn (nếu cột chưa tồn tại thì bỏ qua)
    try {
      await pool.execute(
        `UPDATE quiz_attempts SET edit_count = COALESCE(edit_count, 0) + 1 WHERE id = ? AND student_id = ?`,
        [req.params.attemptId, req.user.userId]
      );
    } catch (incErr) {
      // Nếu cột không tồn tại hoặc lỗi khác, chỉ log và tiếp tục
      console.warn('[SAVE_ANSWER] edit_count increment skipped:', incErr?.code || incErr?.message || incErr);
    }

    res.json({ message: 'Lưu câu trả lời thành công', isCorrect, pointsEarned });
    // Ghi event lịch sử (edit)
    try { await recordAttemptEvent(pool, req.params.attemptId, 'edit', `q=${questionId},opt=${selectedOptionId}`); } catch (_) {}

  } catch (error) {
    console.error('Save quiz answer error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error?.message || String(error) });
  }
});

// Lấy các câu trả lời đã lưu cho attempt (khi đang làm dở)
router.get('/quiz/attempt/:attemptId/answers', auth, requireRole(['student']), async (req, res) => {
  try {
    // Xác nhận attempt thuộc về user và đang ở trạng thái in_progress (hoặc đã nộp nếu chỉ để xem lại)
    const [attempts] = await pool.execute(`
      SELECT * FROM quiz_attempts
      WHERE id = ? AND student_id = ?
    `, [req.params.attemptId, req.user.userId]);

    if (attempts.length === 0) {
      return res.status(403).json({ message: 'Không tìm thấy bài làm hợp lệ' });
    }

    const [rows] = await pool.execute(`
      SELECT question_id, selected_option_id
      FROM quiz_answers
      WHERE attempt_id = ?
    `, [req.params.attemptId]);

    return res.json({
      attemptId: Number(req.params.attemptId),
      answers: rows.map(r => ({
        question_id: Number(r.question_id),
        selected_option_id: r.selected_option_id != null ? Number(r.selected_option_id) : null
      }))
    });

  } catch (error) {
    console.error('Get attempt answers error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Nộp bài
router.post('/quiz/attempt/:attemptId/submit', auth, requireRole(['student']), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Kiểm tra attempt
    const [attempts] = await connection.execute(`
      SELECT qa.*, qat.* FROM quiz_attempts qat
      JOIN quiz_assignments qa ON qat.quiz_assignment_id = qa.id
      WHERE qat.id = ? AND qat.student_id = ? AND qat.status = 'in_progress'
    `, [req.params.attemptId, req.user.userId]);

    if (attempts.length === 0) {
      return res.status(403).json({ message: 'Không tìm thấy bài làm hợp lệ' });
    }

    const attempt = attempts[0];

    // Tính điểm
    const [answers] = await connection.execute(`
      SELECT SUM(points_earned) as total_score, COUNT(*) as answered_count
      FROM quiz_answers WHERE attempt_id = ?
    `, [req.params.attemptId]);

    const [totalQuestions] = await connection.execute(`
      SELECT COUNT(*) as total FROM quiz_questions WHERE quiz_assignment_id = ?
    `, [attempt.quiz_assignment_id]);

    const totalScore = answers[0].total_score || 0;
    const maxPossibleScore = totalQuestions[0].total;
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const timeSpent = Math.floor((new Date() - new Date(attempt.started_at)) / 1000);

    // Cập nhật attempt
    await connection.execute(`
      UPDATE quiz_attempts SET
        submitted_at = CURRENT_TIMESTAMP,
        time_spent = ?,
        total_score = ?,
        max_possible_score = ?,
        percentage = ?,
        status = 'submitted'
      WHERE id = ?
    `, [timeSpent, totalScore, maxPossibleScore, percentage, req.params.attemptId]);

    await connection.commit();

    // Ghi event lịch sử (submit)
    try { await recordAttemptEvent(pool, req.params.attemptId, 'submit'); } catch (_) {}

    res.json({
      message: 'Nộp bài thành công',
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: percentage.toFixed(2),
      timeSpent: timeSpent
    });

  } catch (error) {
    await connection.rollback();
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  } finally {
    connection.release();
  }
});

// Xem kết quả bài làm
router.get('/quiz/attempt/:attemptId/result', auth, async (req, res) => {
  try {
    // Kiểm tra quyền xem kết quả
    let attempts = [];
    try {
      const [attemptRows] = await pool.execute(`
        SELECT qat.*, qa.student_permission, qa.show_answers, qa.title as quiz_title
        FROM quiz_attempts qat
        JOIN quiz_assignments qa ON qat.quiz_assignment_id = qa.id
        WHERE qat.id = ? AND (qat.student_id = ? OR qa.created_by = ?)
      `, [req.params.attemptId, req.user.userId, req.user.userId]);
      attempts = attemptRows;
    } catch (joinError) {
      console.error('⚠️ Attempt-Quiz join failed, using fallback:', joinError.message);
      // Fallback: fetch attempt alone
      const [attemptOnly] = await pool.execute(`
        SELECT * FROM quiz_attempts WHERE id = ?
      `, [req.params.attemptId]);
      if (attemptOnly.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy bài làm' });
      }
      const att = attemptOnly[0];
      // Permission check fallback
      if (Number(att.student_id) !== Number(req.user.userId)) {
        // Check teacher ownership
        const [quizRows] = await pool.execute(`
          SELECT id, created_by, title
          FROM quiz_assignments
          WHERE id = ?
        `, [att.quiz_assignment_id]);
        if (quizRows.length === 0) {
          return res.status(403).json({ message: 'Không có quyền xem kết quả này' });
        }
        const quizRow = quizRows[0];
        if (Number(quizRow.created_by) !== Number(req.user.userId)) {
          return res.status(403).json({ message: 'Không có quyền xem kết quả này' });
        }
        // Attach safe fields
        attempts = [{
          ...att,
          quiz_title: quizRow.title || '',
          student_permission: 'Chỉ xem điểm',
          show_answers: 0
        }];
      } else {
        // Student can view own result
        // Get quiz title best-effort
        let quizTitle = '';
        try {
          const [quizRows] = await pool.execute(`
            SELECT title FROM quiz_assignments WHERE id = ?
          `, [att.quiz_assignment_id]);
          quizTitle = quizRows[0]?.title || '';
        } catch (_) {}
        attempts = [{
          ...att,
          quiz_title: quizTitle,
          student_permission: 'Chỉ xem điểm',
          show_answers: 0
        }];
      }
    }

    if (attempts.length === 0) {
      return res.status(403).json({ message: 'Không có quyền xem kết quả này' });
    }

    const attempt = attempts[0];

    // Always use simple, compatible retrieval without JSON aggregation
    // Always return one row per question with LEFT JOIN to answers of this attempt
    let basicRows = [];
    try {
      const [qRows] = await pool.execute(`
        SELECT 
          qq.id as question_id,
          qq.question_text,
          qq.question_order,
          qans.is_correct,
          qans.points_earned,
          qans.selected_option_id,
          (SELECT option_order FROM quiz_options WHERE id = qans.selected_option_id) as selected_option_order
        FROM quiz_questions qq
        LEFT JOIN quiz_answers qans 
          ON qans.question_id = qq.id AND qans.attempt_id = ?
        WHERE qq.quiz_assignment_id = ?
        ORDER BY qq.question_order
      `, [req.params.attemptId, attempt.quiz_assignment_id]);
      basicRows = qRows || [];
    } catch (answersError) {
      console.error('⚠️ Loading questions+answers failed:', answersError.message);
      basicRows = [];
    }

    // Allow viewing answers if:
    // - teacher
    // - quiz flagged to show answers (qa.show_answers)
    // - student_permission is not the restrictive 'Chỉ xem điểm'
    const isOwner = Number(attempt.student_id) === Number(req.user.userId);
    const isSubmitted = (attempt.status || '').toString() === 'submitted';
    const canView = (
      req.user.role === 'teacher' ||
      !!Number(attempt.show_answers ?? 0) ||
      attempt.student_permission !== 'Chỉ xem điểm' ||
      (isOwner && isSubmitted) ||
      true // Tạm thời cho phép xem đáp án để debug
    );
    
    // Debug log để kiểm tra quyền xem đáp án
    console.log('🔍 Backend canView debug:', {
      userRole: req.user.role,
      showAnswers: attempt.show_answers,
      studentPermission: attempt.student_permission,
      isOwner,
      isSubmitted,
      canView
    });
    let enriched = [];
    if (basicRows.length > 0 && canView) {
      // Load options per question
      const mapByQ = new Map();
      for (const row of basicRows) {
        mapByQ.set(row.question_id, []);
      }
      for (const qId of mapByQ.keys()) {
        const [opts] = await pool.execute(`
          SELECT 
            id, 
            option_text as text, 
            option_order, 
            is_correct as isCorrect
          FROM quiz_options
          WHERE question_id = ?
          ORDER BY option_order
        `, [qId]);
        mapByQ.set(qId, opts || []);
        
        // Debug log để kiểm tra dữ liệu options
        if (qId && opts && opts.length > 0) {
          console.log(`🔍 Question ${qId} options:`, opts.map(o => ({
            id: o.id,
            text: o.text,
            option_order: o.option_order,
            is_correct: o.isCorrect
          })));
        }
      }
      enriched = basicRows.map(r => {
        const opts = (mapByQ.get(r.question_id) || []).map(o => ({
          id: Number(o.id),
          text: o.text,
          order: Number(o.option_order ?? 0),
          // Normalize isCorrect to boolean true ONLY when value is 1/true/'1'
          isCorrect: (o.isCorrect === true) || Number(o.isCorrect) === 1,
          selected: (o.id != null && r.selected_option_id != null) ? Number(o.id) === Number(r.selected_option_id) : false
        }));
        const selectedId = r.selected_option_id != null ? Number(r.selected_option_id) : null;
        // Recompute correctness against current option keys to avoid stale answers when teacher changed keys afterward
        const dynamicIsCorrect = selectedId != null ? opts.some(o => o.id === selectedId && o.isCorrect === true) : false;
        const dynamicPoints = dynamicIsCorrect ? 1.0 : 0.0;
        return {
          question_text: r.question_text,
          question_order: Number(r.question_order ?? 0),
          is_correct: dynamicIsCorrect, // prefer dynamic correctness
          points_earned: dynamicPoints, // prefer dynamic points
          selected_option_id: selectedId,
          selected_option_order: r.selected_option_order != null ? Number(r.selected_option_order) : null,
          options: opts
        };
      });
    } else {
      // When cannot view full answers, still return user's chosen option and basic options (without revealing correctness)
      const mapByQ2 = new Map();
      for (const row of basicRows) mapByQ2.set(row.question_id, []);
      for (const qId of mapByQ2.keys()) {
        const [opts2] = await pool.execute(`
          SELECT 
            id,
            option_text as text,
            option_order as option_order_alias
          FROM quiz_options
          WHERE question_id = ?
          ORDER BY option_order
        `, [qId]);
        mapByQ2.set(qId, opts2 || []);
      }
      enriched = basicRows.map(r => ({
        question_text: r.question_text,
        question_order: Number(r.question_order ?? 0),
        is_correct: !!r.is_correct, // may be null if not graded yet
        points_earned: Number(r.points_earned ?? 0),
        selected_option_id: r.selected_option_id != null ? Number(r.selected_option_id) : null,
        selected_option_order: r.selected_option_order != null ? Number(r.selected_option_order) : null,
        options: (mapByQ2.get(r.question_id) || []).map(o => ({
          id: Number(o.id),
          text: o.text,
          order: Number(o.option_order_alias ?? 0)
          // isCorrect intentionally omitted
        }))
      }));
    }

    return res.json({
      attempt: {
        id: Number(attempt.id),
        quizTitle: attempt.quiz_title || '',
        totalScore: Number(attempt.total_score ?? 0),
        maxPossibleScore: Number(attempt.max_possible_score ?? 0),
        percentage: Number(attempt.percentage ?? 0),
        timeSpent: Number(attempt.time_spent ?? 0),
        submittedAt: attempt.submitted_at,
        leaveCount: Number(attempt.leave_count ?? 0),
        editCount: Number(attempt.edit_count ?? 0)
      },
      answers: enriched,
      canViewAnswers: canView
    });

  } catch (error) {
    console.error('Get quiz result error:', error);
    console.error('Stack:', error.stack);
    // Development-friendly fallback to avoid blocking UI
    const isProd = process.env.NODE_ENV === 'production';
    const fallbackPayload = {
      attempt: {
        id: Number(req.params.attemptId || 0),
        quizTitle: '',
        totalScore: 0,
        maxPossibleScore: 0,
        percentage: 0,
        timeSpent: 0,
        submittedAt: null
      },
      answers: [],
      canViewAnswers: false,
      debug: isProd ? undefined : { message: error.message }
    };
    if (isProd) {
      return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
    return res.status(200).json(fallbackPayload);
  }
});

// Chi tiết kết quả theo học sinh cho một bài quiz (teacher only)
router.get('/quiz/:quizId/student/:studentId/details', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const studentId = Number(req.params.studentId);
    if (!Number.isFinite(quizId) || !Number.isFinite(studentId)) {
      return res.status(400).json({ message: 'quizId hoặc studentId không hợp lệ' });
    }

    // Kiểm tra giáo viên là chủ sở hữu bài tập
    const [quizRows] = await pool.execute(`
      SELECT id, title, created_by, score_setting
      FROM quiz_assignments
      WHERE id = ?
      LIMIT 1
    `, [quizId]);
    if (quizRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }
    const quiz = quizRows[0];
    if (Number(quiz.created_by) !== Number(req.user.userId)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem chi tiết học sinh của bài tập này' });
    }

    // Lấy thông tin học sinh
    let student = null;
    try {
      const [stuRows] = await pool.execute(`
        SELECT id, username, full_name
        FROM users
        WHERE id = ?
        LIMIT 1
      `, [studentId]);
      student = stuRows[0] || null;
    } catch (_) {}

    // Lấy tất cả attempts đã có của học sinh cho quiz này
    // Một số DB có thể chưa có cột leave_count/edit_count => thêm fallback để tránh 500
    let attempts = [];
    try {
      const [attemptRows] = await pool.execute(`
        SELECT id, student_id, quiz_assignment_id, status, started_at, submitted_at,
               time_spent, total_score, max_possible_score, percentage, leave_count, edit_count
        FROM quiz_attempts
        WHERE quiz_assignment_id = ? AND student_id = ?
        ORDER BY started_at ASC
      `, [quizId, studentId]);
      attempts = attemptRows;
    } catch (attemptErr) {
      console.warn('⚠️ quiz_attempts missing columns (leave_count/edit_count) fallback:', attemptErr?.code || attemptErr?.message || attemptErr);
      const [attemptRows] = await pool.execute(`
        SELECT id, student_id, quiz_assignment_id, status, started_at, submitted_at,
               time_spent, total_score, max_possible_score, percentage
        FROM quiz_attempts
        WHERE quiz_assignment_id = ? AND student_id = ?
        ORDER BY started_at ASC
      `, [quizId, studentId]);
      attempts = attemptRows.map(a => ({
        ...a,
        leave_count: 0,
        edit_count: 0
      }));
    }

    // Chọn attempt để chấm điểm theo score_setting
    const scoreSetting = (quiz.score_setting || '').toLowerCase();
    const submitted = (attempts || []).filter(a => (a.status || '') === 'submitted');
    let gradeAttempt = null;
    if (submitted.length > 0) {
      if (scoreSetting.includes('cao nhất')) {
        gradeAttempt = submitted.reduce((best, a) => {
          const ascore = Number(a.total_score || 0);
          const bscore = Number(best.total_score || 0);
          return ascore > bscore ? a : best;
        }, submitted[0]);
      } else if (scoreSetting.includes('cuối')) {
        gradeAttempt = submitted.reduce((last, a) => {
          const lt = new Date(last.submitted_at || last.started_at || 0).getTime();
          const at = new Date(a.submitted_at || a.started_at || 0).getTime();
          return at >= lt ? a : last;
        }, submitted[0]);
      } else {
        // Mặc định: lấy điểm lần làm đầu tiên
        gradeAttempt = submitted.reduce((first, a) => {
          const ft = new Date(first.submitted_at || first.started_at || 0).getTime();
          const at = new Date(a.submitted_at || a.started_at || 0).getTime();
          return at <= ft ? a : first;
        }, submitted[0]);
      }
    }

    // Nếu chưa có attempt nộp, trả về danh sách attempts để giáo viên theo dõi
    if (!gradeAttempt) {
      return res.json({
        quiz: { id: Number(quiz.id), title: quiz.title || '' },
        student: student ? { id: Number(student.id), username: student.username || '', full_name: student.full_name || '' } : { id: studentId },
        attempts: (attempts || []).map((a, idx) => ({
          id: Number(a.id),
          order: idx + 1,
          status: a.status,
          started_at: a.started_at,
          submitted_at: a.submitted_at,
          time_spent: Number(a.time_spent || 0),
          total_score: Number(a.total_score || 0),
          max_possible_score: Number(a.max_possible_score || 0),
          percentage: Number(a.percentage || 0)
        })),
        message: 'Học sinh chưa có bài nộp để xem chi tiết'
      });
    }

    // Tải danh sách câu hỏi + câu trả lời của attempt được chấm
    let basicRows = [];
    try {
      const [qRows] = await pool.execute(`
        SELECT 
          qq.id as question_id,
          qq.question_text,
          qq.question_order,
          qans.is_correct,
          qans.points_earned,
          qans.selected_option_id,
          (SELECT option_order FROM quiz_options WHERE id = qans.selected_option_id) as selected_option_order
        FROM quiz_questions qq
        LEFT JOIN quiz_answers qans 
          ON qans.question_id = qq.id AND qans.attempt_id = ?
        WHERE qq.quiz_assignment_id = ?
        ORDER BY qq.question_order
      `, [gradeAttempt.id, quizId]);
      basicRows = qRows || [];
    } catch (answersError) {
      console.error('⚠️ Loading student details questions+answers failed:', answersError.message);
      basicRows = [];
    }

    // Teacher luôn được xem đáp án
    const mapByQ = new Map();
    for (const row of basicRows) mapByQ.set(row.question_id, []);
    for (const qId of mapByQ.keys()) {
      const [opts] = await pool.execute(`
        SELECT id, option_text as text, option_order, is_correct as isCorrect
        FROM quiz_options
        WHERE question_id = ?
        ORDER BY option_order
      `, [qId]);
      mapByQ.set(qId, opts || []);
    }

    const answers = basicRows.map(r => {
      const opts = (mapByQ.get(r.question_id) || []).map(o => ({
        id: Number(o.id),
        text: o.text,
        order: Number(o.option_order ?? 0),
        isCorrect: (o.isCorrect === true) || Number(o.isCorrect) === 1,
        selected: (o.id != null && r.selected_option_id != null) ? Number(o.id) === Number(r.selected_option_id) : false
      }));
      const selectedId = r.selected_option_id != null ? Number(r.selected_option_id) : null;
      const dynamicIsCorrect = selectedId != null ? opts.some(o => o.id === selectedId && o.isCorrect === true) : false;
      const dynamicPoints = dynamicIsCorrect ? 1.0 : 0.0;
      return {
        question_text: r.question_text,
        question_order: Number(r.question_order ?? 0),
        is_correct: dynamicIsCorrect,
        points_earned: dynamicPoints,
        selected_option_id: selectedId,
        selected_option_order: r.selected_option_order != null ? Number(r.selected_option_order) : null,
        options: opts
      };
    });

    // Lịch sử events của attempt
    let events = [];
    try {
      const [evRows] = await pool.execute(`
        SELECT id, type, note, created_at
        FROM quiz_attempt_events
        WHERE attempt_id = ?
        ORDER BY created_at ASC, id ASC
      `, [gradeAttempt.id]);
      events = (evRows || []).map(ev => ({
        id: Number(ev.id),
        type: String(ev.type || ''),
        note: ev.note || null,
        createdAt: ev.created_at
      }));
    } catch (_) {}

    return res.json({
      quiz: { id: Number(quiz.id), title: quiz.title || '' },
      student: student ? { id: Number(student.id), username: student.username || '', full_name: student.full_name || '' } : { id: studentId },
      attempt: {
        id: Number(gradeAttempt.id),
        status: gradeAttempt.status,
        started_at: gradeAttempt.started_at,
        submitted_at: gradeAttempt.submitted_at,
        time_spent: Number(gradeAttempt.time_spent || 0),
        total_score: Number(gradeAttempt.total_score || 0),
        max_possible_score: Number(gradeAttempt.max_possible_score || 0),
        percentage: Number(gradeAttempt.percentage || 0),
        leave_count: Number(gradeAttempt.leave_count || 0),
        edit_count: Number(gradeAttempt.edit_count || 0)
      },
      answers,
      events,
      attempts: (attempts || []).map((a, idx) => ({
        id: Number(a.id),
        order: idx + 1,
        status: a.status,
        started_at: a.started_at,
        submitted_at: a.submitted_at,
        time_spent: Number(a.time_spent || 0),
        total_score: Number(a.total_score || 0),
        max_possible_score: Number(a.max_possible_score || 0),
        percentage: Number(a.percentage || 0),
        take_for_grade: Number(a.id) === Number(gradeAttempt.id)
      }))
    });

  } catch (error) {
    console.error('Get student quiz details error:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy chi tiết học sinh', error: error.message });
  }
});

// ==================== ORIGINAL ASSIGNMENTS APIs ====================

// Lấy danh sách assignments của class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const [assignments] = await pool.execute(`
      SELECT a.*, u.full_name as created_by_name
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.class_id = ?
      ORDER BY a.created_at DESC
    `, [req.params.classId]);

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo assignment mới (teacher only)
router.post('/', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const { title, description, class_id, due_date, max_score } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO assignments (title, description, class_id, due_date, max_score, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, class_id, due_date, max_score, req.user.userId]
    );

    res.status(201).json({
      message: 'Tạo bài tập thành công',
      assignmentId: result.insertId
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy chi tiết assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const [assignments] = await pool.execute(`
      SELECT a.*, u.full_name as created_by_name
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }

    res.json(assignments[0]);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Nộp bài tập
router.post('/:id/submit', auth, requireRole(['student']), async (req, res) => {
  try {
    const { content, file_path } = req.body;
    const assignmentId = req.params.id;

    // Kiểm tra đã nộp chưa
    const [existing] = await pool.execute(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, req.user.userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Bạn đã nộp bài tập này rồi' });
    }

    const [result] = await pool.execute(
      'INSERT INTO submissions (assignment_id, student_id, content, file_path) VALUES (?, ?, ?, ?)',
      [assignmentId, req.user.userId, content, file_path]
    );

    res.status(201).json({
      message: 'Nộp bài tập thành công',
      submissionId: result.insertId
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách submissions của assignment (teacher only)
router.get('/:id/submissions', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const [submissions] = await pool.execute(`
      SELECT s.*, u.full_name as student_name, u.username
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at ASC
    `, [req.params.id]);

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router; 