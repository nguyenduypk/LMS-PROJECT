import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import Header from './Header';
import './CreateClassPage.css';

const SUBJECTS = [
  'Toán', 'Số học', 'Đại số', 'Đại Số và Giải tích', 'Giải tích',
  'Hình học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học',
  'Lịch sử', 'Địa lý', 'Tin học', 'GDCD', 'Công nghệ', 'Khác'
];
const GRADES = [
  '6', '7', '8', '9', '10', '11', '12', 'Đại học', 'Cao Đẳng', 'Khác'
];

function CreateClassPage() {
  const navigate = useNavigate();
  const [coverImage, setCoverImage] = useState(null);
  const fileInputRef = useRef();

  // State cho các bước
  const [className, setClassName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [otherSubject, setOtherSubject] = useState('');
  const [otherGrade, setOtherGrade] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [createdClass, setCreatedClass] = useState(null);

  const handleCoverClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Điều kiện hoàn thành từng bước
  const isClassNameDone = className.trim().length > 0;
  const isSubjectDone = selectedSubject !== '' && (selectedSubject !== 'Khác' || otherSubject.trim() !== '');
  const isGradeDone = selectedGrade !== '' && (selectedGrade !== 'Khác' || otherGrade.trim() !== '');
  const subjectValue = selectedSubject === 'Khác' ? otherSubject : selectedSubject;
  const gradeValue = selectedGrade === 'Khác' ? otherGrade : selectedGrade;
  const canCreate = isClassNameDone && isSubjectDone && isGradeDone;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const classData = {
        name: className,
        subject: subjectValue,
        description: '',
        room: '',
        schedule: '',
        online_link: onlineLink?.trim() || undefined
      };
      
      const response = await api.classes.create(classData);
      
      if (response.message) {
        setSuccess('Tạo lớp học thành công!');
        setCreatedClass({
          id: response.class.id,
          name: response.class.name,
          subject: response.class.subject,
          grade: gradeValue,
          class_code: response.class.class_code,
          cover: coverImage
        });
        
        // Reset form
        setClassName('');
        setSelectedSubject('');
        setOtherSubject('');
        setSelectedGrade('');
        setOtherGrade('');
        setCoverImage(null);
        setOnlineLink('');
        
        // Chờ 2 giây rồi chuyển hướng để user thấy thông báo thành công
        setTimeout(() => {
          navigate('/teacher/dashboard');
        }, 2000);
      } else {
        setError(response.message || 'Tạo lớp học thất bại');
      }
    } catch (error) {
      console.error('Lỗi tạo lớp học:', error);
      setError('Có lỗi xảy ra khi tạo lớp học. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-class-root">
      <Header />
      <div className="create-class-container">

        {/* Error message */}
        {error && (
          <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '12px 24px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            border: '1px solid #ffcdd2',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {error}
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '12px 24px',
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            borderRadius: '8px',
            border: '1px solid #c8e6c9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {success}
          </div>
        )}

        <div className="create-class-form-section">
          <div className="create-class-form-group">
            <label className="create-class-label">Tên lớp học</label>
            <input className="create-class-input" placeholder="Ví dụ: Lớp thầy Ngọc 2015..." value={className} onChange={e => setClassName(e.target.value)} />
          </div>
          <div className="create-class-cover-upload">
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleCoverChange}
            />
            <div className="create-class-cover-placeholder" onClick={handleCoverClick} style={{ cursor: 'pointer', minHeight: 180 }}>
              {coverImage ? (
                <img src={coverImage} alt="Ảnh bìa" className="create-class-cover-preview" />
              ) : (
                <>
                  <span className="create-class-cover-icon">🙂</span>
                  <div className="create-class-cover-text">Thêm ảnh bìa</div>
                  <div className="create-class-cover-desc">Ảnh bìa khuyến nghị 2100px chiều dài và 900px chiều cao</div>
                </>
              )}
            </div>
          </div>
          <div className="create-class-form-group">
            <label className="create-class-label">Mã bảo vệ</label>
            <input className="create-class-input" />
          </div>
          <div className="create-class-switch-group">
            <div className="create-class-switch-row">
              <span>Phê duyệt học sinh</span>
              <input type="checkbox" className="create-class-switch" />
            </div>
            <div className="create-class-switch-desc">Phê duyệt học sinh tránh tình trạng người lạ vào lớp học mà không có sự cho phép của bạn</div>
            <div className="create-class-switch-row">
              <span>Chặn học sinh tự rời lớp học</span>
              <input type="checkbox" className="create-class-switch" />
            </div>
            <div className="create-class-switch-desc">Tính năng này giúp giáo viên xử lý tình huống thành viên trong lớp tốt hơn tránh tình trạng học sinh tự ý thoát khỏi lớp</div>
            <div className="create-class-switch-row">
              <span>Cho phép học sinh xem bảng điểm</span>
              <input type="checkbox" className="create-class-switch" />
            </div>
            <div className="create-class-switch-desc">Học sinh sẽ được xem bảng điểm của các thành viên trong lớp</div>
            <div className="create-class-switch-row">
              <span>Tắt hoạt động bảng tin</span>
              <input type="checkbox" className="create-class-switch" />
            </div>
            <div className="create-class-switch-desc">Học sinh không thể đăng bài, bình luận</div>
            <div className="create-class-switch-row">
              <span>Hạn chế quyền truy cập của giáo viên đồng hành</span>
              <input type="checkbox" className="create-class-switch" />
            </div>
            <div className="create-class-switch-desc">Giáo viên đồng hành chỉ được phép xem tài nguyên của mình tạo ra trong lớp, bao gồm: Bài tập, bài giảng, tài liệu</div>
          </div>
          <div className="create-class-form-group">
            <label className="create-class-label">Link nhóm Facebook</label>
            <input className="create-class-input" placeholder="Link nhóm Facebook" />
          </div>
          <div className="create-class-form-group">
            <label className="create-class-label">Link phòng học mặc định (Zoom/Meet/Teams...)</label>
            <input
              className="create-class-input"
              placeholder="Ví dụ: https://meet.google.com/abc-defg-hij"
              value={onlineLink}
              onChange={e => setOnlineLink(e.target.value)}
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
              Lịch học có link riêng sẽ được ưu tiên sử dụng. Nếu không có, lớp sẽ dùng link mặc định này.
            </div>
          </div>
          <div className="create-class-form-group">
            <label className="create-class-label">Facebook Fanpage</label>
            <input className="create-class-input" placeholder="Nhập đường link fanpage của lớp học" />
          </div>
          <div className="create-class-form-group">
            <label className="create-class-label">Môn học</label>
            <div className="create-class-subject-list">
              {SUBJECTS.map(subject => (
                <button
                  key={subject}
                  className={`create-class-subject-btn${selectedSubject === subject ? ' selected' : ''}`}
                  type="button"
                  onClick={() => { setSelectedSubject(subject); if(subject !== 'Khác') setOtherSubject(''); }}
                >{subject}</button>
              ))}
            </div>
            {selectedSubject === 'Khác' && (
              <input
                className="create-class-input create-class-other-input"
                placeholder="Nhập môn học khác..."
                value={otherSubject}
                onChange={e => setOtherSubject(e.target.value)}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
          <div className="create-class-form-group">
            <label className="create-class-label">Khối lớp</label>
            <div className="create-class-grade-list">
              {GRADES.map(grade => (
                <button
                  key={grade}
                  className={`create-class-grade-btn${selectedGrade === grade ? ' selected' : ''}`}
                  type="button"
                  onClick={() => { setSelectedGrade(grade); if(grade !== 'Khác') setOtherGrade(''); }}
                >{grade}</button>
              ))}
            </div>
            {selectedGrade === 'Khác' && (
              <input
                className="create-class-input create-class-other-input"
                placeholder="Nhập khối lớp khác..."
                value={otherGrade}
                onChange={e => setOtherGrade(e.target.value)}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        </div>
        <div className="create-class-side-section">
          <button 
            className="create-class-submit-btn" 
            disabled={!canCreate || isLoading} 
            style={canCreate && !isLoading ? { background: '#1976d2', cursor: 'pointer' } : {}} 
            onClick={handleCreateClass}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo lớp'}
          </button>
          <div className="create-class-required-note">Bạn phải nhập đầy đủ các trường bắt buộc để tạo lớp <span className="create-class-required-star">*</span></div>
          <div className="create-class-steps-box">
            <div className="create-class-steps-title">Các bước đã thực hiện</div>
            <div className="create-class-step-row">
              <div className="create-class-step-info">
                <div className="create-class-step-label">Đặt tên lớp học</div>
                <div className="create-class-step-desc">Bắt buộc - <span className="create-class-step-link">Thêm ngay</span></div>
              </div>
              {isClassNameDone && <span className="create-class-step-check">✔</span>}
            </div>
            <div className="create-class-step-row">
              <div className="create-class-step-info">
                <div className="create-class-step-label">Chọn môn học</div>
                <div className="create-class-step-desc">Bắt buộc - <span className="create-class-step-link">Thêm ngay</span></div>
              </div>
              {isSubjectDone && <span className="create-class-step-check">✔</span>}
            </div>
            <div className="create-class-step-row">
              <div className="create-class-step-info">
                <div className="create-class-step-label">Chọn khối lớp</div>
                <div className="create-class-step-desc">Bắt buộc - <span className="create-class-step-link">Thêm ngay</span></div>
              </div>
              {isGradeDone && <span className="create-class-step-check">✔</span>}
            </div>
          </div>
        </div>
      </div>
             {createdClass && (
         <div className="create-class-result-box">
           <h3>Lớp học vừa tạo</h3>
           {createdClass.cover && <img src={createdClass.cover} alt="Ảnh bìa" style={{ width: '100%', maxWidth: 400, borderRadius: 12, marginBottom: 12 }} />}
           <div><b>Tên lớp:</b> {createdClass.name}</div>
           <div><b>Môn học:</b> {createdClass.subject}</div>
           <div><b>Khối lớp:</b> {createdClass.grade}</div>
           <div style={{ 
             marginTop: '16px', 
             padding: '12px', 
             backgroundColor: '#f0f8ff', 
             borderRadius: '8px', 
             border: '2px dashed #1976d2' 
           }}>
             <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '8px' }}>
               🔑 Mã lớp học: {createdClass.class_code}
             </div>
             <div style={{ fontSize: '14px', color: '#666' }}>
               Học sinh có thể sử dụng mã này để tham gia lớp học
             </div>
           </div>
         </div>
       )}
    </div>
  );
}

export default CreateClassPage; 