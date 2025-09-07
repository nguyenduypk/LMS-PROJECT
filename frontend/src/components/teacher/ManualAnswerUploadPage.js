import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherClass.css';

export default function ManualAnswerUploadPage() {
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    navigate('/resource/manual-answer-detail', { state: { fileUrl, fileName: file.name } });
  };

  return (
    <div className="manual-answer-upload-card">
      <div className="manual-answer-upload-icon">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="40" width="80" height="48" rx="8" fill="#FDBA3B"/>
          <rect x="36" y="28" width="48" height="32" rx="4" fill="#60A5FA"/>
          <rect x="52" y="44" width="16" height="12" rx="2" fill="#FDE68A"/>
          <rect x="70" y="44" width="10" height="8" rx="2" fill="#A7F3D0"/>
          <rect x="40" y="60" width="40" height="6" rx="3" fill="#F9FAFB"/>
        </svg>
      </div>
      <div className="manual-answer-upload-title">Nhập đáp án thủ công</div>
      <div className="manual-answer-upload-desc">
        Học liệu đưa lên sẽ được lưu dưới dạng file gốc và đáp án nhập bằng tay.
      </div>
      <label htmlFor="manual-upload" className="manual-answer-upload-btn">
        <input
          id="manual-upload"
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <span>Chọn tệp</span>
      </label>
    </div>
  );
} 