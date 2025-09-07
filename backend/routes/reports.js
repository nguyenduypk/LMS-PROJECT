const express = require('express');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helpers
function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// GET /api/reports/overview
// Admin-only: high level counts for dashboard cards
router.get('/overview', auth, requireRole(['admin']), async (req, res) => {
  try {
    // Users by role
    const [userCounts] = await pool.execute(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );

    // Total classes and active classes (not deleted)
    const [[classesTotal]] = await pool.execute(`SELECT COUNT(*) AS c FROM classes`);
    const [[classesActive]] = await pool.execute(`SELECT COUNT(*) AS c FROM classes WHERE COALESCE(is_deleted, 0) = 0`);

    // Total students in class_members
    const [[studentsTotal]] = await pool.execute(
      `SELECT COUNT(*) AS c FROM users WHERE role = 'student'`
    );

    // Total teachers
    const [[teachersTotal]] = await pool.execute(
      `SELECT COUNT(*) AS c FROM users WHERE role = 'teacher'`
    );

    // Recent classes (5)
    const [recentClasses] = await pool.execute(
      `SELECT id, name, subject, teacher_id, class_code, created_at
       FROM classes
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      message: 'Admin overview stats',
      usersByRole: userCounts,
      totals: {
        classes: Number(classesTotal.c || 0),
        activeClasses: Number(classesActive.c || 0),
        students: Number(studentsTotal.c || 0),
        teachers: Number(teachersTotal.c || 0)
      },
      recentClasses
    });
  } catch (err) {
    console.error('[reports] overview error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy tổng quan báo cáo', error: err.message });
  }
});

// GET /api/reports/engagement?from=YYYY-MM-DD&to=YYYY-MM-DD
// Admin-only: aggregate attendance status counts and by day
router.get('/engagement', auth, requireRole(['admin']), async (req, res) => {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const where = [];
    const params = [];

    if (from) {
      where.push('DATE(a.check_in_time) >= ?');
      params.push(from.toISOString().slice(0, 10));
    }
    if (to) {
      where.push('DATE(a.check_in_time) <= ?');
      params.push(to.toISOString().slice(0, 10));
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Overall counts
    const [overall] = await pool.execute(
      `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late
       FROM attendance a
       ${whereSql}`,
      params
    );

    // By day
    const [byDay] = await pool.execute(
      `SELECT 
         DATE(a.check_in_time) AS day,
         COUNT(*) AS total,
         SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
         SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
         SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late
       FROM attendance a
       ${whereSql}
       GROUP BY DATE(a.check_in_time)
       ORDER BY day ASC`,
      params
    );

    res.json({
      message: 'Engagement (attendance) stats',
      range: { from: from ? from.toISOString().slice(0, 10) : null, to: to ? to.toISOString().slice(0, 10) : null },
      overall: overall && overall[0] ? overall[0] : (overall[0] || {}),
      byDay
    });
  } catch (err) {
    console.error('[reports] engagement error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê tương tác', error: err.message });
  }
});

// GET /api/reports/quizzes?from=YYYY-MM-DD&to=YYYY-MM-DD
// Admin-only: quizzes published, attempts, and average score
router.get('/quizzes', auth, requireRole(['admin']), async (req, res) => {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const whereQA = [];
    const paramsQA = [];
    if (from) { whereQA.push('(qa.start_time IS NULL OR DATE(qa.start_time) >= ?)'); paramsQA.push(from.toISOString().slice(0,10)); }
    if (to) { whereQA.push('(qa.deadline IS NULL OR DATE(qa.deadline) <= ?)'); paramsQA.push(to.toISOString().slice(0,10)); }
    const whereQASql = whereQA.length ? `WHERE ${whereQA.join(' AND ')}` : '';

    // Quizzes count by status
    const [quizzesByStatus] = await pool.execute(
      `SELECT qa.status, COUNT(*) AS count
       FROM quiz_assignments qa
       ${whereQASql}
       GROUP BY qa.status`
      , paramsQA
    );

    // Attempts within range by submitted_at
    const whereAttempt = [];
    const paramsAttempt = [];
    if (from) { whereAttempt.push('DATE(qat.submitted_at) >= ?'); paramsAttempt.push(from.toISOString().slice(0,10)); }
    if (to) { whereAttempt.push('DATE(qat.submitted_at) <= ?'); paramsAttempt.push(to.toISOString().slice(0,10)); }
    const whereAttemptSql = whereAttempt.length ? `WHERE ${whereAttempt.join(' AND ')}` : '';

    const [attemptAgg] = await pool.execute(
      `SELECT 
         COUNT(*) AS submitted_count,
         AVG(CASE 
               WHEN qat.percentage IS NOT NULL AND qat.percentage <= 1 THEN qat.percentage * 10
               WHEN qat.percentage IS NOT NULL AND qat.percentage > 1 THEN (qat.percentage / 100) * 10
               ELSE (CASE WHEN qat.max_possible_score > 0 THEN (qat.total_score / qat.max_possible_score) * 10 ELSE NULL END)
             END) AS avg_score10
       FROM quiz_attempts qat
       WHERE qat.status = 'submitted'
       ${whereAttemptSql ? `AND ${whereAttempt.join(' AND ')}` : ''}`,
      paramsAttempt
    );

    res.json({
      message: 'Quiz stats',
      range: { from: from ? from.toISOString().slice(0, 10) : null, to: to ? to.toISOString().slice(0, 10) : null },
      quizzesByStatus,
      attempts: attemptAgg && attemptAgg[0] ? attemptAgg[0] : (attemptAgg[0] || {})
    });
  } catch (err) {
    console.error('[reports] quizzes error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê quiz', error: err.message });
  }
});

module.exports = router;
