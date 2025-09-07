const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Public notices API for client apps
// Base path: /api/notices

// GET /api/notices/active?role=teacher|student
// Returns the latest published notice applicable to the given role and within time window
router.get('/active', async (req, res) => {
  try {
    const role = String(req.query.role || 'all').toLowerCase();
    const roles = ['teacher', 'student'];
    const filters = [];
    const params = [];

    // status & deletion
    filters.push('status = "published"');
    filters.push('COALESCE(is_deleted,0) = 0');

    // time window
    filters.push('(starts_at IS NULL OR starts_at <= NOW())');
    filters.push('(ends_at IS NULL OR ends_at >= NOW())');

    // audience
    if (roles.includes(role)) {
      filters.push('(audience = "all" OR audience = ? )');
      params.push(role);
    } else {
      filters.push('audience = "all"');
    }

    const whereSql = 'WHERE ' + filters.join(' AND ');

    const [rows] = await pool.query(
      `SELECT id, title, message, link_text, link_href, tone, audience, starts_at, ends_at, updated_at
       FROM system_notices
       ${whereSql}
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      params
    );

    if (!rows.length) return res.json({ notice: null });
    res.json({ notice: rows[0] });
  } catch (err) {
    console.error('Public get active notice error:', err);
    res.status(500).json({ message: 'Lỗi lấy thông báo đang hiệu lực' });
  }
});

// GET /api/notices
// Optional: list recent published notices (for app menu, not admin)
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const [rows] = await pool.query(
      `SELECT id, title, message, link_text, link_href, tone, audience, starts_at, ends_at, updated_at
       FROM system_notices
       WHERE status = "published" AND COALESCE(is_deleted,0) = 0
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY updated_at DESC, id DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error('Public list notices error:', err);
    res.status(500).json({ message: 'Lỗi lấy danh sách thông báo' });
  }
});

module.exports = router;
