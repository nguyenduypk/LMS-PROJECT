const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Đăng ký
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username phải có ít nhất 3 ký tự'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('full_name').notEmpty().withMessage('Họ tên không được để trống'),
  body('role').isIn(['student', 'teacher', 'admin']).withMessage('Vai trò không hợp lệ'),
  body('school').optional().isLength({ max: 100 }).withMessage('Tên trường quá dài'),
  body('date_of_birth').optional().isISO8601().withMessage('Ngày sinh không hợp lệ'),
  body('province').optional().isLength({ max: 50 }).withMessage('Tên tỉnh quá dài'),
  body('class').optional().isLength({ max: 20 }).withMessage('Tên lớp quá dài')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name, role, school, date_of_birth, province, class: userClass } = req.body;

    // Kiểm tra username và email đã tồn tại
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username hoặc email đã tồn tại' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo user mới - chuyển undefined thành null
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, full_name, role, school, date_of_birth, province, class) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, role, school || null, date_of_birth || null, province || null, userClass || null]
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: result.insertId,
        username,
        email,
        full_name,
        role,
        school,
        date_of_birth,
        province,
        class: userClass
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đăng nhập
router.post('/login', [
  body('username').notEmpty().withMessage('Username không được để trống'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Tìm user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
    }

    const user = users[0];

    // Kiểm tra password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
    }

    // Chặn đăng nhập nếu tài khoản bị vô hiệu hóa
    if (Object.prototype.hasOwnProperty.call(user, 'is_active') && Number(user.is_active) === 0) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        school: user.school,
        date_of_birth: user.date_of_birth,
        province: user.province,
        class: user.class,
        avatar: user.avatar,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thông tin user hiện tại
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, role, school, date_of_birth, province, class, avatar, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

// Đăng xuất (client sẽ xóa token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
});

// Đổi mật khẩu
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    // Lấy thông tin user
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Cập nhật mật khẩu
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, decoded.userId]
    );

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router; 