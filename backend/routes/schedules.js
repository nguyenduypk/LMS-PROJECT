const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Tạo lịch học mới (chỉ giáo viên)
router.post('/', auth, requireRole(['teacher']), [
  body('class_id').isInt().withMessage('ID lớp học phải là số nguyên'),
  body('day_of_week').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Ngày trong tuần không hợp lệ'),
  body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Thời gian bắt đầu không hợp lệ (HH:MM)'),
  body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Thời gian kết thúc không hợp lệ (HH:MM)'),
  body('room').optional(),
  body('subject').optional(),
  body('description').optional(),
  body('type').isIn(['offline', 'online', 'hybrid']).withMessage('Loại lớp học không hợp lệ'),
  body('online_link').optional().isString().withMessage('online_link phải là chuỗi nếu cung cấp')
], async (req, res) => {
  try {
    console.log('=== CREATE SCHEDULE REQUEST ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      class_id, 
      day_of_week, 
      start_time, 
      end_time, 
      room, 
      subject, 
      description, 
      type = 'offline',
      online_link = null,
    } = req.body;
    const teacherId = req.user.userId;

    // Kiểm tra xem giáo viên có quyền tạo lịch cho lớp này không
    const [classCheck] = await pool.execute(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
      [class_id, teacherId]
    );

    if (classCheck.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền tạo lịch cho lớp học này' });
    }

    // Kiểm tra xem đã có lịch học vào thời gian này chưa
    const [existingSchedule] = await pool.execute(
      'SELECT id FROM class_schedules WHERE class_id = ? AND day_of_week = ? AND start_time = ?',
      [class_id, day_of_week, start_time]
    );

    if (existingSchedule.length > 0) {
      return res.status(400).json({ message: 'Đã có lịch học vào thời gian này' });
    }

    // Tạo lịch học mới
    let result;
    try {
      [result] = await pool.execute(
        'INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room, subject, description, type, online_link, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [class_id, day_of_week, start_time, end_time, room, subject, description, type, online_link, teacherId]
      );
    } catch (err) {
      // Fallback nếu cột online_link chưa tồn tại trong DB (chưa chạy migration)
      if (err && err.code === 'ER_BAD_FIELD_ERROR' && /online_link/i.test(err.sqlMessage || '')) {
        console.warn('[schedules] online_link column missing. Falling back to insert without online_link. Please run migration backend/scripts/add_online_link_to_class_schedules.sql');
        [result] = await pool.execute(
          'INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room, subject, description, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [class_id, day_of_week, start_time, end_time, room, subject, description, type, teacherId]
        );
      } else {
        throw err;
      }
    }

    // Lấy thông tin lịch học vừa tạo
    const [schedules] = await pool.execute(
      `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
       FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       JOIN users u ON cs.created_by = u.id 
       WHERE cs.id = ?`,
      [result.insertId]
    );

    console.log('Created schedule:', schedules[0]);

    res.status(201).json({
      message: 'Tạo lịch học thành công',
      schedule: schedules[0]
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đặt các route đặc biệt lên trước
router.get('/teacher', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== GET TEACHER SCHEDULE REQUEST ===');
    console.log('Teacher ID:', req.user.userId);

    const teacherId = req.user.userId;

    // Lấy lịch học của tất cả lớp mà giáo viên dạy
    const [schedules] = await pool.execute(
      `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
       FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       JOIN users u ON cs.created_by = u.id 
       WHERE c.teacher_id = ? 
       ORDER BY FIELD(cs.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), cs.start_time`,
      [teacherId]
    );

    console.log('Teacher schedules:', schedules);

    res.json({
      message: 'Lấy lịch học thành công',
      schedules
    });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/student', auth, requireRole(['student']), async (req, res) => {
  try {
    console.log('=== GET STUDENT SCHEDULE REQUEST ===');
    console.log('Student ID:', req.user.userId);

    const studentId = req.user.userId;

    // Lấy lịch học của tất cả lớp mà học sinh tham gia
    const [schedules] = await pool.execute(
      `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
       FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       JOIN users u ON cs.created_by = u.id 
       JOIN class_members cm ON c.id = cm.class_id 
       WHERE cm.user_id = ? 
       ORDER BY FIELD(cs.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), cs.start_time`,
      [studentId]
    );

    console.log('Student schedules:', schedules);

    res.json({
      message: 'Lấy lịch học thành công',
      schedules
    });
  } catch (error) {
    console.error('Get student schedule error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/class/:classId', auth, async (req, res) => {
  try {
    console.log('=== GET CLASS SCHEDULE REQUEST ===');
    console.log('Class ID:', req.params.classId);
    console.log('User:', req.user);

    const { classId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Kiểm tra xem user có quyền xem lịch của lớp này không
    let accessCheck;
    if (userRole === 'teacher') {
      // Giáo viên chỉ có thể xem lịch của lớp mình dạy
      [accessCheck] = await pool.execute(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [classId, userId]
      );
    } else {
      // Học sinh chỉ có thể xem lịch của lớp mình tham gia
      [accessCheck] = await pool.execute(
        'SELECT cm.id FROM class_members cm WHERE cm.class_id = ? AND cm.user_id = ?',
        [classId, userId]
      );
    }

    if (accessCheck.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xem lịch học của lớp này' });
    }

    // Lấy lịch học của lớp
    const [schedules] = await pool.execute(
      `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
       FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       JOIN users u ON cs.created_by = u.id 
       WHERE cs.class_id = ? 
       ORDER BY FIELD(cs.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), cs.start_time`,
      [classId]
    );

    console.log('Class schedules:', schedules);

    res.json({
      message: 'Lấy lịch học thành công',
      schedules
    });
  } catch (error) {
    console.error('Get class schedule error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Kết thúc phòng học (End classroom session) - Đặt trước route động để tránh conflict
router.post('/:scheduleId/end', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== END CLASSROOM SESSION ===');
    console.log('Schedule ID:', req.params.scheduleId);
    console.log('User:', req.user);

    const { scheduleId } = req.params;
    const teacherId = req.user.userId;

    // Kiểm tra xem giáo viên có quyền kết thúc buổi học này không
    const [scheduleCheck] = await pool.execute(
      `SELECT cs.*, c.name as class_name 
       FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       WHERE cs.id = ? AND c.teacher_id = ?`,
      [scheduleId, teacherId]
    );

    if (scheduleCheck.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Bạn không có quyền kết thúc buổi học này' 
      });
    }

    // Cập nhật trạng thái buổi học thành đã kết thúc
    const [result] = await pool.execute(
      'UPDATE class_schedules SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['ended', scheduleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy buổi học' 
      });
    }

    console.log('✅ Classroom session ended successfully');

    res.json({
      success: true,
      message: 'Đã kết thúc phòng học thành công',
      schedule: scheduleCheck[0]
    });
  } catch (error) {
    console.error('End classroom session error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi kết thúc phòng học' 
    });
  }
});

// Cuối cùng mới đến route động này
router.get('/:scheduleId', auth, async (req, res) => {
  try {
    console.log('=== GET SCHEDULE BY ID REQUEST ===');
    console.log('Schedule ID:', req.params.scheduleId);
    console.log('User:', req.user);

    const { scheduleId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let schedule;
    if (userRole === 'teacher') {
      // Giáo viên chỉ có thể xem lịch học của mình
      [schedule] = await pool.execute(
        `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
         FROM class_schedules cs 
         JOIN classes c ON cs.class_id = c.id 
         JOIN users u ON cs.created_by = u.id 
         WHERE cs.id = ? AND c.teacher_id = ?`,
        [scheduleId, userId]
      );
    } else {
      // Học sinh chỉ có thể xem lịch học của lớp mình tham gia
      [schedule] = await pool.execute(
        `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
         FROM class_schedules cs 
         JOIN classes c ON cs.class_id = c.id 
         JOIN users u ON cs.created_by = u.id 
         JOIN class_members cm ON c.id = cm.class_id 
         WHERE cs.id = ? AND cm.user_id = ?`,
        [scheduleId, userId]
      );
    }

    if (schedule.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch học' });
    }

    console.log('Schedule found:', schedule[0]);

    res.json({
      message: 'Lấy lịch học thành công',
      schedule: schedule[0]
    });
  } catch (error) {
    console.error('Get schedule by ID error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy lịch học theo ngày cụ thể
router.get('/date/:date', auth, async (req, res) => {
  try {
    console.log('=== GET SCHEDULE BY DATE REQUEST ===');
    console.log('Date:', req.params.date);
    console.log('User:', req.user);

    const { date } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Chuyển đổi ngày thành day_of_week
    const targetDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[targetDate.getDay()];

    let schedules;
    if (userRole === 'teacher') {
      // Lấy lịch học của giáo viên theo ngày
      [schedules] = await pool.execute(
        `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
         FROM class_schedules cs 
         JOIN classes c ON cs.class_id = c.id 
         JOIN users u ON cs.created_by = u.id 
         WHERE c.teacher_id = ? AND cs.day_of_week = ? 
         ORDER BY cs.start_time`,
        [userId, dayOfWeek]
      );
    } else {
      // Lấy lịch học của học sinh theo ngày
      [schedules] = await pool.execute(
        `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
         FROM class_schedules cs 
         JOIN classes c ON cs.class_id = c.id 
         JOIN users u ON cs.created_by = u.id 
         JOIN class_members cm ON c.id = cm.class_id 
         WHERE cm.user_id = ? AND cs.day_of_week = ? 
         ORDER BY cs.start_time`,
        [userId, dayOfWeek]
      );
    }

    console.log('Schedules for date:', schedules);

    res.json({
      message: 'Lấy lịch học theo ngày thành công',
      date: date,
      dayOfWeek: dayOfWeek,
      schedules
    });
  } catch (error) {
    console.error('Get schedule by date error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật lịch học
router.put('/:scheduleId', auth, requireRole(['teacher']), [
  body('day_of_week').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Ngày trong tuần không hợp lệ'),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Thời gian bắt đầu không hợp lệ (HH:MM)'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Thời gian kết thúc không hợp lệ (HH:MM)'),
  body('room').optional(),
  body('subject').optional(),
  body('description').optional(),
  body('type').optional().isIn(['offline', 'online', 'hybrid']).withMessage('Loại lớp học không hợp lệ'),
  body('online_link').optional().isString().withMessage('online_link phải là chuỗi nếu cung cấp')
], async (req, res) => {
  try {
    console.log('=== UPDATE SCHEDULE REQUEST ===');
    console.log('Schedule ID:', req.params.scheduleId);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { scheduleId } = req.params;
    const teacherId = req.user.userId;
    const updateData = req.body;

    // Kiểm tra xem giáo viên có quyền cập nhật lịch này không
    const [scheduleCheck] = await pool.execute(
      `SELECT cs.id FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       WHERE cs.id = ? AND c.teacher_id = ?`,
      [scheduleId, teacherId]
    );

    if (scheduleCheck.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật lịch học này' });
    }

    // Kiểm tra xem có conflict với lịch khác không (nếu thay đổi thời gian)
    if (updateData.day_of_week || updateData.start_time) {
      const [currentSchedule] = await pool.execute(
        'SELECT class_id, day_of_week, start_time FROM class_schedules WHERE id = ?',
        [scheduleId]
      );

      const checkDay = updateData.day_of_week || currentSchedule[0].day_of_week;
      const checkStart = updateData.start_time || currentSchedule[0].start_time;

      const [conflictCheck] = await pool.execute(
        'SELECT id FROM class_schedules WHERE class_id = ? AND day_of_week = ? AND start_time = ? AND id != ?',
        [currentSchedule[0].class_id, checkDay, checkStart, scheduleId]
      );

      if (conflictCheck.length > 0) {
        return res.status(400).json({ message: 'Thời gian này đã có lịch học khác' });
      }
    }

    // Tạo câu lệnh UPDATE động
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    }

    updateValues.push(scheduleId);

    const [result] = await pool.execute(
      `UPDATE class_schedules SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch học' });
    }

    // Lấy thông tin lịch học đã cập nhật
    const [schedules] = await pool.execute(
      `SELECT cs.*, c.name as class_name, u.full_name as teacher_name 
       FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       JOIN users u ON cs.created_by = u.id 
       WHERE cs.id = ?`,
      [scheduleId]
    );

    console.log('Updated schedule:', schedules[0]);

    res.json({
      message: 'Cập nhật lịch học thành công',
      schedule: schedules[0]
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa lịch học
router.delete('/:scheduleId', auth, requireRole(['teacher']), async (req, res) => {
  try {
    console.log('=== DELETE SCHEDULE REQUEST ===');
    console.log('Schedule ID:', req.params.scheduleId);
    console.log('User:', req.user);

    const { scheduleId } = req.params;
    const teacherId = req.user.userId;

    // Kiểm tra xem giáo viên có quyền xóa lịch này không
    const [scheduleCheck] = await pool.execute(
      `SELECT cs.id FROM class_schedules cs 
       JOIN classes c ON cs.class_id = c.id 
       WHERE cs.id = ? AND c.teacher_id = ?`,
      [scheduleId, teacherId]
    );

    if (scheduleCheck.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa lịch học này' });
    }

    // Xóa lịch học
    const [result] = await pool.execute(
      'DELETE FROM class_schedules WHERE id = ?',
      [scheduleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch học' });
    }

    console.log('Deleted schedule ID:', scheduleId);

    res.json({
      message: 'Xóa lịch học thành công'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router; 