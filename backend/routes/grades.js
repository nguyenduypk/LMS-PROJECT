const express = require('express');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: normalize a score to 10-point scale
function normalizeTo10(score, maxPossible) {
  const s = Number(score || 0);
  const m = Number(maxPossible || 0);
  if (!isFinite(s) || s < 0) return 0;
  if (isFinite(m) && m > 0) return (s / m) * 10;
  // If no maxPossible, assume score already on 0..10
  return Math.max(0, Math.min(10, s));
}

// GET /api/grades/class/:classId/gradebook
// Only teacher (owner of the class)
router.get('/class/:classId/gradebook', auth, requireRole(['teacher']), async (req, res) => {
  const classId = Number(req.params.classId);
  const teacherId = req.user.userId;

  if (!Number.isFinite(classId)) {
    return res.status(400).json({ message: 'classId không hợp lệ' });
  }

  try {
    // Verify teacher owns this class
    const [classes] = await pool.execute(
      'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
      [classId, teacherId]
    );
    if (classes.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xem bảng điểm của lớp này' });
    }

    // Students in class
    const [students] = await pool.execute(
      `SELECT u.id, u.full_name
       FROM class_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.class_id = ? AND cm.role = 'student'
       ORDER BY u.full_name ASC`,
      [classId]
    );

    // Quizzes in class
    const [quizzes] = await pool.execute(
      `SELECT id, title, score_setting
       FROM quiz_assignments
       WHERE class_id = ? AND status IN ('published','closed','draft')
       ORDER BY created_at ASC`,
      [classId]
    );

    const quizIds = quizzes.map(q => q.id);

    // Attempts for all quizzes (submitted)
    let attemptsMap = new Map(); // key `${quizId}-${studentId}` => best/first/last attempt row
    if (quizIds.length > 0) {
      const [attempts] = await pool.execute(
        `SELECT id, quiz_assignment_id, student_id, total_score, max_possible_score, percentage, started_at, submitted_at
         FROM quiz_attempts
         WHERE quiz_assignment_id IN (${quizIds.map(() => '?').join(',')}) AND status = 'submitted'`,
        quizIds
      );

      // Group by quiz and student to pick attempt by score_setting per quiz
      const byQuizStudent = new Map();
      for (const a of attempts) {
        const key = `${a.quiz_assignment_id}-${a.student_id}`;
        if (!byQuizStudent.has(key)) byQuizStudent.set(key, []);
        byQuizStudent.get(key).push(a);
      }

      for (const q of quizzes) {
        for (const s of students) {
          const key = `${q.id}-${s.id}`;
          const list = byQuizStudent.get(key) || [];
          if (list.length === 0) continue;

          // pick attempt based on score_setting
          const setting = String(q.score_setting || '').toLowerCase();
          let chosen = null;
          if (setting.includes('cao nhất')) {
            chosen = list.reduce((best, a) => {
              const ap = isFinite(a.percentage) ? a.percentage : (Number(a.total_score||0) / Number(a.max_possible_score||0));
              const bp = isFinite(best.percentage) ? best.percentage : (Number(best.total_score||0) / Number(best.max_possible_score||0));
              return (ap||0) > (bp||0) ? a : best;
            }, list[0]);
          } else if (setting.includes('cuối')) {
            chosen = list.reduce((last, a) => {
              const lt = new Date(last.submitted_at || last.started_at || 0).getTime();
              const at = new Date(a.submitted_at || a.started_at || 0).getTime();
              return at >= lt ? a : last;
            }, list[0]);
          } else {
            // first attempt
            chosen = list.reduce((first, a) => {
              const ft = new Date(first.submitted_at || first.started_at || 0).getTime();
              const at = new Date(a.submitted_at || a.started_at || 0).getTime();
              // Pick the earliest attempt time
              return at <= ft ? a : first;
            }, list[0]);
          }
          attemptsMap.set(key, chosen);
        }
      }
    }

    // Classic assignments in class
    const [assignments] = await pool.execute(
      `SELECT id, title, max_score
       FROM assignments
       WHERE class_id = ?
       ORDER BY created_at ASC`,
      [classId]
    );
    const assignmentIds = assignments.map(a => a.id);

    // Submissions for assignments
    let submissionMap = new Map(); // key `${assignmentId}-${studentId}` => score
    if (assignmentIds.length > 0) {
      const [subs] = await pool.execute(
        `SELECT assignment_id, student_id, score
         FROM submissions
         WHERE assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
        assignmentIds
      );
      for (const r of subs) {
        submissionMap.set(`${r.assignment_id}-${r.student_id}`, r.score);
      }
    }

    // Build columns
    const columns = [];
    for (const a of assignments) {
      columns.push({ key: `A-${a.id}`, type: 'assignment', id: a.id, title: a.title, max_score: a.max_score || 100 });
    }
    for (const q of quizzes) {
      columns.push({ key: `Q-${q.id}`, type: 'quiz', id: q.id, title: q.title, max_score: 10 });
    }

    // Build rows per student
    const rows = [];
    let classTotalAvg = 0;
    let classHigh = null;
    let classLow = null;

    for (const s of students) {
      const scores = {};
      let sumForAvg = 0;
      let countForAvg = 0;

      // assignments
      for (const a of assignments) {
        const key = `${a.id}-${s.id}`;
        const score = submissionMap.has(key) ? Number(submissionMap.get(key) || 0) : null;
        scores[`A-${a.id}`] = score;
        if (score != null) {
          sumForAvg += normalizeTo10(score, a.max_score || 100);
          countForAvg += 1;
        }
      }

      // quizzes
      for (const q of quizzes) {
        const aKey = `${q.id}-${s.id}`;
        const at = attemptsMap.get(aKey);
        let score10 = null;
        if (at) {
          if (isFinite(at.percentage)) {
            const pct = Number(at.percentage);
            // Handle both 0..1 and 0..100 representations
            score10 = pct > 1 ? (pct / 100) * 10 : pct * 10;
          } else {
            score10 = normalizeTo10(at.total_score, at.max_possible_score);
          }
        }
        scores[`Q-${q.id}`] = score10 != null ? Number(score10.toFixed(2)) : null;
        if (score10 != null) {
          sumForAvg += score10;
          countForAvg += 1;
        }
      }

      const average = countForAvg > 0 ? Number((sumForAvg / countForAvg).toFixed(2)) : 0;
      classTotalAvg += average;
      classHigh = classHigh == null ? average : Math.max(classHigh, average);
      classLow = classLow == null ? average : Math.min(classLow, average);

      rows.push({ student_id: s.id, full_name: s.full_name, average, scores });
    }

    const stats = {
      total_students: students.length,
      class_average: students.length > 0 ? Number((classTotalAvg / students.length).toFixed(2)) : 0,
      highest: classHigh == null ? 0 : Number(classHigh.toFixed(2)),
      lowest: classLow == null ? 0 : Number(classLow.toFixed(2))
    };

    return res.json({
      class_id: classId,
      columns,
      students: students.map(s => ({ id: s.id, full_name: s.full_name })),
      rows,
      stats
    });
  } catch (error) {
    console.error('Get gradebook error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy bảng điểm', error: error.message });
  }
});

// GET /api/grades/class/:classId/student/:studentId
// Teacher (owner) can view any student, student can only view his/her own record if a class member
router.get('/class/:classId/student/:studentId', auth, async (req, res) => {
  const classId = Number(req.params.classId);
  const studentId = Number(req.params.studentId);
  const requesterId = req.user.userId;
  const role = req.user.role;

  if (!Number.isFinite(classId) || !Number.isFinite(studentId)) {
    return res.status(400).json({ message: 'Tham số không hợp lệ' });
  }

  try {
    // Verify class exists and permission
    let permitted = false;
    if (role === 'teacher') {
      const [own] = await pool.execute(
        'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ? AND is_deleted = 0',
        [classId, requesterId]
      );
      permitted = own.length > 0;
    } else if (role === 'student') {
      const [m] = await pool.execute(
        "SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ? AND role = 'student'",
        [classId, requesterId]
      );
      // Student can only view self
      permitted = m.length > 0 && requesterId === studentId;
    }
    if (!permitted) return res.status(403).json({ message: 'Bạn không có quyền xem điểm học sinh này' });

    // Ensure the target student is a member of this class
    const [isMember] = await pool.execute(
      "SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ? AND role = 'student'",
      [classId, studentId]
    );
    if (isMember.length === 0) return res.status(404).json({ message: 'Học sinh không thuộc lớp này' });

    // Student info
    const [[student]] = await pool.execute(
      'SELECT id, full_name, username, email FROM users WHERE id = ?',
      [studentId]
    );

    // Assignments of class and submission of this student
    const [assignments] = await pool.execute(
      `SELECT a.id, a.title, a.max_score,
              (SELECT s.score FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ? LIMIT 1) AS score
       FROM assignments a
       WHERE a.class_id = ?
       ORDER BY a.created_at ASC`,
      [studentId, classId]
    );

    // Quizzes in class
    const [quizzes] = await pool.execute(
      `SELECT id, title, score_setting
       FROM quiz_assignments
       WHERE class_id = ? AND status IN ('published','closed','draft')
       ORDER BY created_at ASC`,
      [classId]
    );

    // Fetch all submitted attempts of this student for quizzes
    const quizIds = quizzes.map(q => q.id);
    let attemptsByQuiz = new Map();
    if (quizIds.length > 0) {
      const [attempts] = await pool.execute(
        `SELECT id, quiz_assignment_id, total_score, max_possible_score, percentage, started_at, submitted_at
         FROM quiz_attempts
         WHERE student_id = ? AND status = 'submitted' AND quiz_assignment_id IN (${quizIds.map(() => '?').join(',')})`,
        [studentId, ...quizIds]
      );
      // Group by quiz
      for (const a of attempts) {
        if (!attemptsByQuiz.has(a.quiz_assignment_id)) attemptsByQuiz.set(a.quiz_assignment_id, []);
        attemptsByQuiz.get(a.quiz_assignment_id).push(a);
      }
    }

    // Resolve attempt per quiz based on score_setting
    function pickAttempt(list, setting) {
      if (!list || list.length === 0) return null;
      const cfg = String(setting || '').toLowerCase();
      if (cfg.includes('cao nhất')) {
        return list.reduce((best, a) => {
          const ap = isFinite(a.percentage) ? Number(a.percentage) : (Number(a.total_score||0) / Number(a.max_possible_score||0));
          const bp = isFinite(best.percentage) ? Number(best.percentage) : (Number(best.total_score||0) / Number(best.max_possible_score||0));
          return (ap||0) > (bp||0) ? a : best;
        }, list[0]);
      }
      if (cfg.includes('cuối')) {
        return list.reduce((last, a) => {
          const lt = new Date(last.submitted_at || last.started_at || 0).getTime();
          const at = new Date(a.submitted_at || a.started_at || 0).getTime();
          return at >= lt ? a : last;
        }, list[0]);
      }
      // default: first
      return list.reduce((first, a) => {
        const ft = new Date(first.submitted_at || first.started_at || 0).getTime();
        const at = new Date(a.submitted_at || a.started_at || 0).getTime();
        return at <= ft ? a : first;
      }, list[0]);
    }

    // Build result
    const assignmentResults = assignments.map(a => {
      const score = a.score != null ? Number(a.score) : null;
      const score10 = score != null ? Number(normalizeTo10(score, a.max_score || 100).toFixed(2)) : null;
      return { id: a.id, title: a.title, max_score: a.max_score || 100, score_raw: score, score10 };
    });

    const quizResults = quizzes.map(q => {
      const list = attemptsByQuiz.get(q.id) || [];
      const chosen = pickAttempt(list, q.score_setting);
      let score10 = null;
      if (chosen) {
        if (isFinite(chosen.percentage)) {
          const pct = Number(chosen.percentage);
          score10 = pct > 1 ? (pct / 100) * 10 : pct * 10;
        } else {
          score10 = normalizeTo10(chosen.total_score, chosen.max_possible_score);
        }
      }
      return {
        id: q.id,
        title: q.title,
        attempt_id: chosen ? chosen.id : null,
        score10: score10 != null ? Number(score10.toFixed(2)) : null
      };
    });

    // Compute average across available scores
    let total = 0, count = 0;
    for (const r of assignmentResults) { if (r.score10 != null) { total += r.score10; count++; } }
    for (const r of quizResults) { if (r.score10 != null) { total += r.score10; count++; } }
    const average = count > 0 ? Number((total / count).toFixed(2)) : 0;

    return res.json({
      class_id: classId,
      student: { id: student.id, full_name: student.full_name, username: student.username, email: student.email },
      assignments: assignmentResults,
      quizzes: quizResults,
      average
    });
  } catch (error) {
    console.error('Get student grade detail error:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy điểm học sinh', error: error.message });
  }
});

// Simple CSV export (no external deps)
router.get('/class/:classId/export', auth, requireRole(['teacher']), async (req, res) => {
  try {
    // Reuse the gradebook endpoint internally
    req.url = `/class/${req.params.classId}/gradebook`;
    // Call handler function programmatically isn't trivial here, so duplicate a lightweight call
    const fetch = async (path) => {
      // Not available in Node without global fetch in this environment; fallback by calling DB directly
      return null;
    };
    // Instead of re-calling, quickly build minimal matrix again (avoid re-implementing all). For simplicity, instruct client to use JSON and export on frontend if needed.
    return res.status(501).json({ message: 'Export CSV/Excel chưa được bật. Hãy dùng dữ liệu JSON từ /gradebook để xuất trên frontend.' });
  } catch (error) {
    console.error('Export gradebook error:', error);
    res.status(500).json({ message: 'Lỗi server khi xuất bảng điểm', error: error.message });
  }
});

module.exports = router;
