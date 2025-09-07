import React from 'react';
import { useLocation } from 'react-router-dom';

export default function CreateLecturePage() {
  const location = useLocation();
  const breadcrumb = location.state?.breadcrumb || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa', padding: 0 }}>
      {/* Breadcrumb */}
      <div style={{ padding: '24px 0 0 16px', fontSize: 20, fontWeight: 500, color: '#222' }}>
        {breadcrumb.map((b, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: '#b0b3b8', margin: '0 8px' }}>&#8250;</span>}
            <span style={{
              fontWeight: i === breadcrumb.length - 1 ? 700 : 500,
              color: '#222'
            }}>
              {b.type === 'block' ? 'Khối ' : b.type === 'subject' ? 'Môn ' : b.type === 'chapter' ? 'Chương ' : b.type === 'folder' ? 'Thư mục ' : ''}
              {b.name}
            </span>
          </span>
        ))}
        <span style={{ color: '#1976d2', fontWeight: 700, marginLeft: 8 }}>&#8250; Tạo bài giảng</span>
      </div>
      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 48 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: 520, maxWidth: '95vw', padding: 36, marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 10 }}>
            Tạo bài giảng từ Youtube / Facebook Video hoặc Facebook Video
          </div>
          <div style={{ color: '#444', fontSize: 16, marginBottom: 32 }}>
            Có thể tải nhiều bài giảng video bằng cách nhập link playlist từ Youtube hoặc Link Facebook Video
          </div>
          <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 18, padding: '16px 0', width: '100%', cursor: 'pointer' }}>
            Bắt đầu
          </button>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: 520, maxWidth: '95vw', padding: 36, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 10 }}>
            Tạo bài giảng từ File
          </div>
          <div style={{ color: '#444', fontSize: 16, marginBottom: 32 }}>
            Hiện SHub chỉ hỗ trợ các định dạng File Word - File PDF - Hình ảnh - Powerpoint
          </div>
          <button style={{ background: '#f4fafd', color: '#1976d2', border: '2px dashed #1976d2', borderRadius: 8, fontWeight: 600, fontSize: 18, padding: '16px 0', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="24" height="24" fill="none" stroke="#1976d2" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 8 }}><path d="M12 16V4M12 4l-4 4m4-4l4 4"/><rect x="4" y="16" width="16" height="4" rx="2"/></svg>
            Tải lên
          </button>
        </div>
      </div>
    </div>
  );
} 