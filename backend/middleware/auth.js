const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Headers:', req.headers);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token:', token ? 'Có token' : 'Không có token');
    
    if (!token) {
      console.log('❌ Không có token');
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;

    // Kiểm tra trạng thái tài khoản từ DB
    try {
      const [rows] = await pool.execute('SELECT is_active FROM users WHERE id = ?', [decoded.userId]);
      if (rows && rows.length) {
        const isActive = Number(rows[0].is_active) === 1;
        if (!isActive) {
          console.log('❌ Tài khoản bị vô hiệu hóa');
          return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
        }
      }
    } catch (e) {
      console.log('⚠️ Không kiểm tra được trạng thái tài khoản:', e.message);
      // Không chặn cứng nếu lỗi DB tạm thởi, nhưng có thể chọn chặn để an toàn
    }
    next();
  } catch (error) {
    console.log('❌ Token không hợp lệ:', error.message);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('=== ROLE CHECK ===');
    console.log('User:', req.user);
    console.log('Required roles:', roles);
    console.log('User role:', req.user?.role);
    
    if (!req.user) {
      console.log('❌ Không có user');
      return res.status(401).json({ message: 'Yêu cầu xác thực' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Không có quyền truy cập');
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    console.log('✅ Quyền truy cập hợp lệ');
    next();
  };
};

module.exports = { auth, requireRole }; 