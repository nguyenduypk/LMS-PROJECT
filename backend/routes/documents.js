const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Ensure upload directory exists
const uploadRoot = path.join(__dirname, '..', 'uploads', 'documents');
fs.mkdirSync(uploadRoot, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ts = Date.now();
    cb(null, `${ts}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// POST /api/documents/upload
// fields: classId (optional), title, description, isAttachment (0/1, optional), file
router.post('/upload', auth, requireRole(['teacher', 'admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn tệp để tải lên' });
    }

    const { classId, title, description, isAttachment } = req.body;
    const is_attachment = (String(isAttachment).toLowerCase() === '1' || String(isAttachment).toLowerCase() === 'true') ? 1 : 0;

    const [result] = await pool.execute(
      `INSERT INTO assignment_documents (class_id, teacher_id, title, description, original_name, file_path, mime_type, size, is_attachment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classId ? Number(classId) : null,
        Number(req.user.userId),
        title || null,
        description || null,
        req.file.originalname,
        path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/'),
        req.file.mimetype,
        req.file.size,
        is_attachment,
      ]
    );

    return res.status(201).json({
      id: result.insertId,
      class_id: classId ? Number(classId) : null,
      teacher_id: Number(req.user.userId),
      title: title || null,
      description: description || null,
      original_name: req.file.originalname,
      // Keep both file_path (legacy) and file_url for compatibility
      file_path: `/uploads/${path.relative(path.join(__dirname, '..', 'uploads'), req.file.path).replace(/\\/g, '/')}`,
      mime_type: req.file.mimetype,
      size: req.file.size,
      is_attachment,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Upload document error:', error);
    // Expose error message for debugging purposes
    return res.status(500).json({ message: 'Lỗi khi tải lên tài liệu', error: error?.message || String(error) });
  }
});

// GET /api/documents/class/:classId - list by class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const excludeAttachments = String(req.query.excludeAttachments || '').toLowerCase();
    const shouldExclude = excludeAttachments === '1' || excludeAttachments === 'true';
    const whereExtra = shouldExclude ? ' AND (is_attachment = 0 OR is_attachment IS NULL)' : '';
    const [rows] = await pool.execute(
      `SELECT id, class_id, teacher_id, title, description, original_name,
              file_path,
              CONCAT('/uploads/', SUBSTRING_INDEX(file_path, 'uploads/', -1)) AS file_url,
              mime_type, size, is_attachment, created_at
       FROM assignment_documents
       WHERE class_id = ?${whereExtra}
       ORDER BY created_at DESC`,
      [classId]
    );
    return res.json(rows);
  } catch (error) {
    console.error('List documents error:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách tài liệu' });
  }
});

// GET /api/documents/:id/download - download by id
router.get('/:id/download', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute(
      `SELECT original_name, file_path, mime_type FROM assignment_documents WHERE id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    const doc = rows[0];
    const absPath = path.join(__dirname, '..', doc.file_path);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'Tệp không tồn tại trên máy chủ' });

    res.setHeader('Content-Type', doc.mime_type);
    const isInline = req.query.inline === '1' || req.query.inline === 'true';
    const dispositionType = isInline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(doc.original_name)}"`);
    return fs.createReadStream(absPath).pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    return res.status(500).json({ message: 'Lỗi khi tải xuống tài liệu' });
  }
});

// DELETE /api/documents/:id - owner teacher or admin
router.delete('/:id', auth, requireRole(['teacher', 'admin']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);

    const [rows] = await conn.execute(
      `SELECT id, teacher_id, file_path FROM assignment_documents WHERE id = ?`,
      [id]
    );
    if (!rows.length) {
      conn.release();
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    const doc = rows[0];

    // Only owner teacher or admin
    if (req.user.role !== 'admin' && Number(req.user.userId) !== doc.teacher_id) {
      conn.release();
      return res.status(403).json({ message: 'Bạn không có quyền xóa tài liệu này' });
    }

    await conn.beginTransaction();
    await conn.execute(`DELETE FROM assignment_documents WHERE id = ?`, [id]);
    await conn.commit();
    conn.release();

    const absPath = path.join(__dirname, '..', doc.file_path);
    fs.unlink(absPath, () => {}); // best-effort

    return res.json({ message: 'Đã xóa tài liệu' });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    console.error('Delete document error:', error);
    return res.status(500).json({ message: 'Lỗi khi xóa tài liệu' });
  }
});

module.exports = router;
