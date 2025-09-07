const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');

// Lấy danh sách điểm danh của một buổi học
router.get('/schedule/:scheduleId', auth, async (req, res) => {
  try {
    console.log('=== ATTENDANCE ENDPOINT DEBUG ===');
    console.log('Schedule ID:', req.params.scheduleId);
    console.log('Teacher ID:', req.user.userId);
    
    const { scheduleId } = req.params;
    const teacherId = req.user.userId;

    // Kiểm tra xem giáo viên có quyền truy cập buổi học này không
    const scheduleQuery = `
      SELECT cs.*, c.name as class_name 
      FROM class_schedules cs 
      JOIN classes c ON cs.class_id = c.id 
      WHERE cs.id = ? AND c.teacher_id = ?
    `;
    console.log('Executing schedule query with params:', [scheduleId, teacherId]);
    const [schedule] = await pool.execute(scheduleQuery, [scheduleId, teacherId]);
    
    console.log('Schedule query result:', schedule);
    
    if (schedule.length === 0) {
      console.log('❌ No schedule found or no access');
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy buổi học hoặc bạn không có quyền truy cập' 
      });
    }

    console.log('✅ Schedule found, class_id:', schedule[0].class_id);

    // Lấy danh sách học sinh và trạng thái điểm danh
    const attendanceQuery = `
      SELECT 
        u.id as student_id,
        u.full_name as student_name,
        u.email as student_email,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.notes,
        a.created_at,
        a.updated_at
      FROM users u
      JOIN class_members cm ON u.id = cm.user_id
      LEFT JOIN attendance a ON u.id = a.student_id AND a.schedule_id = ?
      WHERE cm.class_id = ? AND u.role = 'student'
      ORDER BY u.full_name
    `;
    
    console.log('Executing attendance query with params:', [scheduleId, schedule[0].class_id]);
    const [attendanceRecords] = await pool.execute(attendanceQuery, [scheduleId, schedule[0].class_id]);
    
    console.log('Attendance query result:', attendanceRecords);
    
    // Transform data để frontend dễ sử dụng
    const transformedRecords = attendanceRecords.map(record => ({
      id: record.student_id,
      name: record.student_name,
      email: record.student_email,
      checked: record.status === 'present',
      status: record.status || 'absent',
      checkInTime: record.check_in_time,
      checkOutTime: record.check_out_time,
      notes: record.notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    console.log('✅ Sending response with', transformedRecords.length, 'records');
    res.json({
      success: true,
      schedule: schedule[0],
      attendance: transformedRecords
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi lấy danh sách điểm danh' 
    });
  }
});

// Điểm danh học sinh (mark attendance)
router.post('/mark', auth, async (req, res) => {
  try {
    const { scheduleId, studentIds, status = 'present', notes } = req.body;
    const teacherId = req.user.userId;

    if (!scheduleId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin cần thiết' 
      });
    }

    // Kiểm tra quyền truy cập
    const scheduleQuery = `
      SELECT cs.*, c.name as class_name 
      FROM class_schedules cs 
      JOIN classes c ON cs.class_id = c.id 
      WHERE cs.id = ? AND c.teacher_id = ?
    `;
    const [schedule] = await pool.execute(scheduleQuery, [scheduleId, teacherId]);
    
    if (schedule.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy buổi học hoặc bạn không có quyền truy cập' 
      });
    }

    const currentTime = new Date();
    const results = [];

    // Điểm danh từng học sinh
    for (const studentId of studentIds) {
      try {
        // Kiểm tra xem học sinh có trong lớp không
        const memberQuery = `
          SELECT cm.* FROM class_members cm 
          JOIN users u ON cm.user_id = u.id 
          WHERE cm.class_id = ? AND u.id = ? AND u.role = 'student'
        `;
        const [member] = await pool.execute(memberQuery, [schedule[0].class_id, studentId]);
        
        if (member.length === 0) {
          results.push({ studentId, success: false, message: 'Học sinh không thuộc lớp này' });
          continue;
        }

        // Kiểm tra xem đã có record attendance chưa
        const existingQuery = 'SELECT * FROM attendance WHERE schedule_id = ? AND student_id = ?';
        const [existing] = await pool.execute(existingQuery, [scheduleId, studentId]);

        if (existing.length > 0) {
          // Cập nhật record hiện có
          const updateQuery = `
            UPDATE attendance 
            SET status = ?, check_in_time = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE schedule_id = ? AND student_id = ?
          `;
          await pool.execute(updateQuery, [status, currentTime, notes, scheduleId, studentId]);
        } else {
          // Tạo record mới
          const insertQuery = `
            INSERT INTO attendance (schedule_id, student_id, teacher_id, status, check_in_time, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          await pool.execute(insertQuery, [scheduleId, studentId, teacherId, status, currentTime, notes]);
        }

        results.push({ studentId, success: true, message: 'Điểm danh thành công' });

      } catch (error) {
        console.error(`Error marking attendance for student ${studentId}:`, error);
        results.push({ studentId, success: false, message: 'Lỗi khi điểm danh' });
      }
    }

    res.json({
      success: true,
      message: `Đã điểm danh cho ${studentIds.length} học sinh`,
      results
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi điểm danh' 
    });
  }
});

// Hủy điểm danh học sinh (unmark attendance)
router.delete('/unmark', auth, async (req, res) => {
  try {
    console.log('=== UNMARK ATTENDANCE DEBUG ===');
    console.log('Request body:', req.body);
    
    const { scheduleId, studentIds } = req.body;
    const teacherId = req.user.userId;

    console.log('Schedule ID:', scheduleId);
    console.log('Student IDs:', studentIds);
    console.log('Teacher ID:', teacherId);

    if (!scheduleId || !studentIds || !Array.isArray(studentIds)) {
      console.log('❌ Validation failed');
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin cần thiết' 
      });
    }

    // Kiểm tra quyền truy cập
    const scheduleQuery = `
      SELECT cs.*, c.name as class_name 
      FROM class_schedules cs 
      JOIN classes c ON cs.class_id = c.id 
      WHERE cs.id = ? AND c.teacher_id = ?
    `;
    const [schedule] = await pool.execute(scheduleQuery, [scheduleId, teacherId]);
    
    if (schedule.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy buổi học hoặc bạn không có quyền truy cập' 
      });
    }

    // Xóa attendance records
    const placeholders = studentIds.map(() => '?').join(',');
    const deleteQuery = `DELETE FROM attendance WHERE schedule_id = ? AND student_id IN (${placeholders})`;
    console.log('Delete query:', deleteQuery);
    console.log('Delete params:', [scheduleId, ...studentIds]);
    await pool.execute(deleteQuery, [scheduleId, ...studentIds]);
    console.log('✅ Delete query executed successfully');

    res.json({
      success: true,
      message: `Đã hủy điểm danh cho ${studentIds.length} học sinh`
    });

  } catch (error) {
    console.error('Error unmarking attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi hủy điểm danh' 
    });
  }
});

// Lấy thống kê điểm danh của một lớp
router.get('/stats/class/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.userId;

    // Kiểm tra quyền truy cập
    const classQuery = 'SELECT * FROM classes WHERE id = ? AND teacher_id = ?';
    const [classData] = await pool.execute(classQuery, [classId, teacherId]);
    
    if (classData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lớp học hoặc bạn không có quyền truy cập' 
      });
    }

    // Lấy thống kê điểm danh
    const statsQuery = `
      SELECT 
        cs.id as schedule_id,
        cs.subject,
        cs.start_time,
        cs.end_time,
        cs.day_of_week,
        COUNT(a.id) as total_attendance,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count
      FROM class_schedules cs
      LEFT JOIN attendance a ON cs.id = a.schedule_id
      WHERE cs.class_id = ?
      GROUP BY cs.id
      ORDER BY cs.start_time DESC
    `;
    
    const [stats] = await pool.execute(statsQuery, [classId]);

    res.json({
      success: true,
      class: classData[0],
      stats
    });

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi lấy thống kê điểm danh' 
    });
  }
});

module.exports = router; 