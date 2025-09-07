import React, { useState, useRef } from 'react';
import { FaTrashAlt, FaPaperclip } from 'react-icons/fa';
import './AdminDashboard.css';

// Trang upload tài liệu/bài tập (drag & drop) giống giáo viên
// Props:
// - onUpload(files: File[]) => void
// - onCancel() => void
const UploadAssignmentPage = ({ onUpload, onCancel }) => {
  const [files, setFiles] = useState([]);
  const dropRef = useRef(null);

  const onFilesPicked = (list) => {
    const arr = Array.from(list || []);
    if (arr.length === 0) return;
    setFiles((prev) => [...prev, ...arr]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFilesPicked(e.dataTransfer.files);
    dropRef.current && dropRef.current.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current && dropRef.current.classList.add('dragging');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current && dropRef.current.classList.remove('dragging');
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    onUpload && onUpload(files);
  };

  return (
    <div className="upload-assignment-page">
      <div className="upload-header">
        <h3>
          Tải tài liệu/đề bài
        </h3>
        <p>Kéo-thả tệp vào khung dưới hoặc bấm để chọn tệp từ máy tính.</p>
      </div>

      <div
        ref={dropRef}
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          id="file-input"
          type="file"
          multiple
          onChange={(e) => onFilesPicked(e.target.files)}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="btn btn-outline">
          <FaPaperclip /> Chọn tệp
        </label>
        <p>Kéo tệp vào đây để tải lên</p>
      </div>

      {files.length > 0 && (
        <div className="upload-file-list">
          {files.map((f, idx) => (
            <div key={idx} className="upload-file-item">
              <div className="file-name">{f.name}</div>
              <div className="file-size">{(f.size / 1024).toFixed(1)} KB</div>
              <button className="btn btn-danger btn-icon" onClick={() => removeFile(idx)}>
                <FaTrashAlt />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel}>Hủy</button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={files.length === 0}>
          Xác nhận tải lên
        </button>
      </div>
    </div>
  );
};

export default UploadAssignmentPage;
