const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Multer config for avatar uploads
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `user_${req.user?.userId || 'unknown'}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  }
});

// Lấy thông tin user hiện tại
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, role, school, date_of_birth, province, class, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách users (admin only)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, role, avatar, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật thông tin user
router.put('/me', auth, async (req, res) => {
  try {
    // Lấy user hiện tại
    const [existingArr] = await pool.execute(
      'SELECT id, username, email, full_name, role, school, date_of_birth, province, class, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    if (existingArr.length === 0) return res.status(404).json({ message: 'Không tìm thấy user' });
    const existing = existingArr[0];

    // Lấy dữ liệu mới (partial)
    const body = req.body || {};
    const full_name = body.full_name ?? existing.full_name;
    const email = body.email ?? existing.email;
    const school = body.school ?? existing.school;
    const province = body.province ?? existing.province;
    const userClass = body.class ?? existing.class;
    const date_of_birth = body.date_of_birth ?? existing.date_of_birth;
    const avatar = body.avatar ?? existing.avatar;

    // Validate email nếu có thay đổi
    if (email && email !== existing.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email không hợp lệ' });
      }
      const [dups] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.userId]
      );
      if (dups.length > 0) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
      }
    }

    // Cập nhật thông tin user (chỉ các cột cho phép)
    await pool.execute(
      'UPDATE users SET full_name = ?, email = ?, school = ?, province = ?, class = ?, date_of_birth = ?, avatar = ? WHERE id = ?',
      [full_name, email, school, province, userClass, date_of_birth, avatar, req.user.userId]
    );

    const [updatedUsers] = await pool.execute(
      'SELECT id, username, email, full_name, role, school, date_of_birth, province, class, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    return res.json({ message: 'Cập nhật thành công', user: updatedUsers[0] });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file tải lên' });
    const relativeUrl = `/uploads/avatars/${req.file.filename}`;

    await pool.execute('UPDATE users SET avatar = ? WHERE id = ?', [relativeUrl, req.user.userId]);

    const [updatedUsers] = await pool.execute(
      'SELECT id, username, email, full_name, role, school, date_of_birth, province, class, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    return res.json({ message: 'Upload avatar thành công', user: updatedUsers[0] });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;