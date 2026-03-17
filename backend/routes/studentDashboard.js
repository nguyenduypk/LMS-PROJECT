const express = require('express');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helpers
const getDayOfWeek = (date) => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[date.getDay()];
};

// GET /api/student/dashboard
// Aggregate data for student dashboard
router.get('/dashboard', auth, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    // 1) Today's schedules for student's classes ( cần sửa lại cho gọn hơn)
    const today = new Date();
    const dayOfWeek = getDayOfWeek(today);

    const [todaySchedules] = await pool.execute(
      `SELECT cs.*, c.name as class_name, u.full_name as teacher_name
       FROM class_schedules cs
       JOIN classes c ON cs.class_id = c.id
       JOIN users u ON cs.created_by = u.id
       JOIN class_members cm ON c.id = cm.class_id
       WHERE cm.user_id = ? AND cs.day_of_week = ?
       ORDER BY cs.start_time`,
      [studentId, dayOfWeek]
    );

    // 2) Pending quizzes (not yet submitted by this student)
    //*bỏ else null đi trong max() vì sql tự hiểu
    //gom điều kiện cm.user_id và cm.role xuống where
    const [pendingQuizzes] = await pool.execute(
      `SELECT 
          qa.id,
          qa.title,
          qa.description,
          qa.class_id,
          qa.time_limit,
          qa.start_time,
          qa.deadline,
          qa.status,
          c.name as class_name,
          COUNT(DISTINCT qq.id) as question_count,
          -- attempts of this student
          SUM(CASE WHEN qat.student_id = ? AND qat.status = 'submitted' THEN 1 ELSE 0 END) as submitted_attempts_count,
          MAX(CASE WHEN qat.student_id = ? AND qat.status = 'in_progress' THEN qat.id ELSE NULL END) as in_progress_attempt_id
       FROM quiz_assignments qa
       JOIN classes c ON qa.class_id = c.id
       JOIN class_members cm ON c.id = cm.class_id AND cm.user_id = ? AND cm.role = 'student'
       LEFT JOIN quiz_questions qq ON qa.id = qq.quiz_assignment_id
       LEFT JOIN quiz_attempts qat ON qa.id = qat.quiz_assignment_id
       WHERE qa.status = 'published'
         AND (qa.start_time IS NULL OR qa.start_time <= NOW())
         AND (qa.deadline IS NULL OR qa.deadline >= NOW())
       GROUP BY qa.id
       HAVING COALESCE(submitted_attempts_count, 0) = 0
       ORDER BY qa.deadline IS NULL, qa.deadline ASC
       LIMIT 5`
      , [studentId, studentId, studentId]
    );

    // 3) Recent documents from student's classes (materials only, exclude assignment attachments)
    const [recentDocuments] = await pool.execute(
      `SELECT ad.id, ad.class_id, c.name as class_name, ad.title, ad.original_name, ad.file_path, ad.mime_type, ad.size, ad.created_at
       FROM assignment_documents ad
       JOIN classes c ON ad.class_id = c.id
       JOIN class_members cm ON c.id = cm.class_id AND cm.user_id = ? AND cm.role = 'student'
       WHERE COALESCE(ad.is_attachment, 0) = 0
       ORDER BY ad.created_at DESC
       LIMIT 5`,
      [studentId]
    );

    // Counts for sidebar badges (MVP: materials/lectures unread not tracked yet)
    const badges = {
      todaySchedulesCount: todaySchedules.length,
      pendingAssignmentsCount: pendingQuizzes.length,
      unreadMaterialsCount: 0, // TODO: implement read tracking
      unseenLecturesCount: 0   // TODO: pending lectures feature
    };

    res.json({
      message: 'Student dashboard data',
      today: today.toISOString().slice(0, 10),
      todaySchedules,
      pendingQuizzes,
      recentDocuments,
      badges
    });
  } catch (error) {
    console.error('[studentDashboard] error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tổng quan', error: error.message });
  }
});

module.exports = router;
