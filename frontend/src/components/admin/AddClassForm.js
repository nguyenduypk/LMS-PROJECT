import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher } from 'react-icons/fa';
import './AdminCreateClass.css';
import { api } from '../../utils/api';

// Add Class Form (Admin) — mimic teacher CreateClassPage UI
const AddClassForm = ({ onSave, onCancel }) => {
  const SUBJECTS = [
    'Toán', 'Số học', 'Đại số', 'Đại Số và Giải tích', 'Giải tích',
    'Hình học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học',
    'Lịch sử', 'Địa lý', 'Tin học', 'GDCD', 'Công nghệ', 'Khác'
  ];
  const GRADES = ['6','7','8','9','10','11','12','Đại học','Cao Đẳng','Khác'];

  const [name, setName] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [classCode, setClassCode] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [otherSubject, setOtherSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [otherGrade, setOtherGrade] = useState('');
  const [requireApproval, setRequireApproval] = useState(true);
  const [blockLeaving, setBlockLeaving] = useState(false);
  const [allowViewGrades, setAllowViewGrades] = useState(false);
  const [disableFeed, setDisableFeed] = useState(false);
  const [restrictCoTeacher, setRestrictCoTeacher] = useState(false);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherId, setTeacherId] = useState('');

  const subjectValue = selectedSubject === 'Khác' ? otherSubject : selectedSubject;
  const gradeValue = selectedGrade === 'Khác' ? otherGrade : selectedGrade;

  const canCreate = name.trim() && subjectValue && gradeValue && (teachers.length === 0 || teacherId);

  // Load teachers for dropdown
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTeachers(true);
        const res = await api.admin.users.list({ role: 'teacher', limit: 100 });
        const items = res?.items || [];
        if (alive) setTeachers(items);
      } catch (e) {
        if (alive) {
          // fallback: empty list; error will show inline hint
          setTeachers([]);
        }
      } finally {
        if (alive) setLoadingTeachers(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation
    const newErrors = {};
    const nameTrim = (name || '').trim();
    const otherSubjTrim = (otherSubject || '').trim();
    const otherGradeTrim = (otherGrade || '').trim();
    const codeTrim = (classCode || '').trim();

    if (!nameTrim) newErrors.name = 'Vui lòng nhập tên lớp học';
    else if (nameTrim.length < 3) newErrors.name = 'Tên lớp tối thiểu 3 ký tự';

    if (!subjectValue) newErrors.subject = 'Vui lòng chọn môn học';
    if (selectedSubject === 'Khác' && !otherSubjTrim) newErrors.subject = 'Vui lòng nhập tên môn học';

    if (!gradeValue) newErrors.grade = 'Vui lòng chọn khối lớp';
    if (selectedGrade === 'Khác' && !otherGradeTrim) newErrors.grade = 'Vui lòng nhập khối lớp';

    if (codeTrim) {
      const re = /^[A-Za-z0-9_-]{4,16}$/;
      if (!re.test(codeTrim)) newErrors.classCode = 'Mã lớp 4-16 ký tự, chỉ gồm A–Z, a–z, 0–9, “-”, “_”';
    }
    if (teachers.length > 0 && !teacherId) newErrors.teacherId = 'Vui lòng chọn giáo viên phụ trách';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      name: nameTrim,
      classCode: codeTrim || undefined,
      subject: selectedSubject === 'Khác' ? otherSubjTrim : subjectValue,
      grade: selectedGrade === 'Khác' ? otherGradeTrim : gradeValue,
      academicYear: (academicYear || '').trim(),
      description: `Lớp ${selectedSubject === 'Khác' ? otherSubjTrim : subjectValue} khối ${selectedGrade === 'Khác' ? otherGradeTrim : gradeValue}`,
      teacherId: teacherId ? parseInt(teacherId, 10) : undefined,
      settings: {
        isPublic: false,
        allowStudentJoin: true,
        requireApproval,
        blockLeaving,
        allowViewGrades,
        disableFeed,
        restrictCoTeacher,
        maxStudents: 50
      }
      // coverImage is preview-only; backend upload not implemented here
    };

    try {
      setSubmitting(true);
      const ret = onSave && onSave(payload);
      if (ret && typeof ret.then === 'function') await ret; // await promise if provided
    } finally {
      setSubmitting(false);
    }
  };

  // Local handlers similar to teacher page
  const fileInputRef = React.useRef();
  const handleCoverClick = () => fileInputRef.current && fileInputRef.current.click();
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={onSubmit} className="create-class-root create-class-admin">
      <div className="create-class-container">
        <div className="create-class-form-section">
          <div className="create-class-form-group">
            <label className="create-class-label">Tên lớp học</label>
            <input
              className="create-class-input"
              placeholder="VD: Toán 10A1"
              value={name}
              onChange={e => setName(e.target.value)}
              aria-invalid={!!errors.name}
              disabled={submitting}
            />
            {errors.name && <div className="form-error" role="alert">{errors.name}</div>}
          </div>

          <div className="create-class-cover-upload">
            <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleCoverChange} />
            <div className="create-class-cover-placeholder" onClick={handleCoverClick} style={{ cursor: 'pointer', minHeight: 180, opacity: 0.95 }}>
              {coverImage ? (
                <img src={coverImage} alt="Ảnh bìa" className="create-class-cover-preview" />
              ) : (
                <>
                  <span className="create-class-cover-icon">🙂</span>
                  <div className="create-class-cover-text">Thêm ảnh bìa</div>
                  <div className="create-class-cover-desc">Ảnh bìa khuyến nghị 2100x900 (chưa hỗ trợ tải lên máy chủ)</div>
                </>
              )}
            </div>
          </div>

          <div className="create-class-form-group">
            <label className="create-class-label">Mã lớp (tùy chọn)</label>
            <input
              className="create-class-input"
              placeholder="Để trống để hệ thống tự sinh"
              value={classCode}
              onChange={e => setClassCode(e.target.value)}
              aria-invalid={!!errors.classCode}
              disabled={submitting}
            />
            {!errors.classCode && <div className="form-hint">Chỉ dùng chữ, số, gạch dưới, gạch ngang. 4–16 ký tự.</div>}
            {errors.classCode && <div className="form-error" role="alert">{errors.classCode}</div>}
          </div>

          <div className="create-class-switch-group">
            <div className="create-class-switch-row"><span>Phê duyệt học sinh</span><input type="checkbox" className="create-class-switch" checked={requireApproval} onChange={e => setRequireApproval(e.target.checked)} /></div>
            <div className="create-class-switch-desc">Phê duyệt học sinh tránh người lạ vào lớp</div>
            <div className="create-class-switch-row"><span>Chặn học sinh tự rời lớp học</span><input type="checkbox" className="create-class-switch" checked={blockLeaving} onChange={e => setBlockLeaving(e.target.checked)} /></div>
            <div className="create-class-switch-desc">Giúp quản lý thành viên tốt hơn</div>
            <div className="create-class-switch-row"><span>Cho phép học sinh xem bảng điểm</span><input type="checkbox" className="create-class-switch" checked={allowViewGrades} onChange={e => setAllowViewGrades(e.target.checked)} /></div>
            <div className="create-class-switch-desc">Học sinh có thể xem bảng điểm</div>
            <div className="create-class-switch-row"><span>Tắt hoạt động bảng tin</span><input type="checkbox" className="create-class-switch" checked={disableFeed} onChange={e => setDisableFeed(e.target.checked)} /></div>
            <div className="create-class-switch-desc">Học sinh không thể đăng bài, bình luận</div>
            <div className="create-class-switch-row"><span>Hạn chế quyền GV đồng hành</span><input type="checkbox" className="create-class-switch" checked={restrictCoTeacher} onChange={e => setRestrictCoTeacher(e.target.checked)} /></div>
            <div className="create-class-switch-desc">GV đồng hành chỉ xem tài nguyên của mình</div>
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
                  disabled={submitting}
                >{subject}</button>
              ))}
            </div>
            {selectedSubject === 'Khác' && (
              <>
                <input
                  className="create-class-input create-class-other-input"
                  placeholder="Nhập môn học khác..."
                  value={otherSubject}
                  onChange={e => setOtherSubject(e.target.value)}
                  style={{ marginTop: 8 }}
                  aria-invalid={!!errors.subject}
                  disabled={submitting}
                  autoFocus
                />
                {errors.subject && <div className="form-error" role="alert">{errors.subject}</div>}
              </>
            )}
            {selectedSubject !== 'Khác' && errors.subject && <div className="form-error" role="alert">{errors.subject}</div>}
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
                  disabled={submitting}
                >{grade}</button>
              ))}
            </div>
            {selectedGrade === 'Khác' && (
              <>
                <input
                  className="create-class-input create-class-other-input"
                  placeholder="Nhập khối lớp khác..."
                  value={otherGrade}
                  onChange={e => setOtherGrade(e.target.value)}
                  style={{ marginTop: 8 }}
                  aria-invalid={!!errors.grade}
                  disabled={submitting}
                />
                {errors.grade && <div className="form-error" role="alert">{errors.grade}</div>}
              </>
            )}
            {selectedGrade !== 'Khác' && errors.grade && <div className="form-error" role="alert">{errors.grade}</div>}
          </div>
        </div>

        <div className="create-class-side-section">
          <div className="create-class-form-group">
            <label className="create-class-label">Năm học</label>
            <input
              className="create-class-input"
              placeholder="VD: 2024-2025"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="create-class-form-group">
            <label className="create-class-label">Giáo viên phụ trách</label>
            <div className="select-with-arrow">
              <select
                className="create-class-input"
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                disabled={submitting || loadingTeachers}
                aria-invalid={!!errors.teacherId}
              >
                <option value="">{loadingTeachers ? 'Đang tải danh sách...' : '— Chọn giáo viên —'}</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name || t.username || t.email}</option>
                ))}
              </select>
              <span className="select-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dropdown-arrow">
                  <path d="m7 10 5 5 5-5z" fill="currentColor"/>
                </svg>
              </span>
            </div>
            {!errors.teacherId && !loadingTeachers && teachers.length === 0 && (
              <div className="form-hint">Không có giáo viên nào hoặc lỗi tải danh sách.</div>
            )}
            {errors.teacherId && <div className="form-error" role="alert">{errors.teacherId}</div>}
          </div>
          <button className="create-class-submit-btn" disabled={!canCreate || submitting} type="submit">
            {submitting ? 'Đang tạo…' : 'Tạo lớp'}
          </button>
          <div className="create-class-required-note">Bạn phải nhập đầy đủ các trường bắt buộc <span className="create-class-required-star">*</span></div>
          <div className="create-class-steps-box">
            <div className="create-class-steps-title">Các bước đã thực hiện</div>
            <div className="create-class-step-row">
              <div className="create-class-step-info">
                <div className="create-class-step-label">Đặt tên lớp học</div>
                <div className="create-class-step-desc">Bắt buộc - <span className="create-class-step-link">Thêm ngay</span></div>
              </div>
              {name.trim() ? <span className="create-class-step-check">✔</span> : null}
            </div>
            <div className="create-class-step-row">
              <div className="create-class-step-info">
                <div className="create-class-step-label">Chọn môn học</div>
                <div className="create-class-step-desc">Bắt buộc - <span className="create-class-step-link">Thêm ngay</span></div>
              </div>
              {subjectValue ? <span className="create-class-step-check">✔</span> : null}
            </div>
            <div className="create-class-step-row">
              <div className="create-class-step-info">
                <div className="create-class-step-label">Chọn khối lớp</div>
                <div className="create-class-step-desc">Bắt buộc - <span className="create-class-step-link">Thêm ngay</span></div>
              </div>
              {gradeValue ? <span className="create-class-step-check">✔</span> : null}
            </div>
          </div>
          {/* Cancel button removed per Admin UX requirement */}
        </div>
      </div>
    </form>
  );
};

export default AddClassForm;
