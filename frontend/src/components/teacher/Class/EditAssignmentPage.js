import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import { MdArrowBack, MdCheck } from 'react-icons/md';
import '../../../styles/EditAssignmentPage.css';

function EditAssignmentPage({ classInfo: propClassInfo }) {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState(propClassInfo || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state (bám theo CreateAssignmentPage để đồng bộ)
  const [form, setForm] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    startTime: null,
    deadline: null,
    maxAttempts: 1,
    showAnswers: false,
    shuffleQuestions: false,
    shuffleAnswers: false,
    isTest: false,
    blockReview: false,
    studentPermission: 'Chỉ xem điểm',
    scoreSetting: 'Lấy điểm lần làm bài đầu tiên',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Tải dữ liệu chi tiết; fallback: lấy từ listByClass nếu endpoint chi tiết chưa có
  useEffect(() => {
    let mounted = true;
    const normalize = (d) => ({
      title: d?.title || '',
      description: d?.description || '',
      timeLimit: d?.time_limit ?? d?.timeLimit ?? 30,
      startTime: d?.start_time || null,
      deadline: d?.deadline || null,
      maxAttempts: d?.max_attempts ?? d?.maxAttempts ?? 1,
      showAnswers: Boolean(d?.show_answers ?? d?.showAnswers ?? false),
      shuffleQuestions: Boolean(d?.shuffle_questions ?? d?.shuffleQuestions ?? false),
      shuffleAnswers: Boolean(d?.shuffle_answers ?? d?.shuffleAnswers ?? false),
      isTest: Boolean(d?.is_test ?? d?.isTest ?? false),
      blockReview: Boolean(d?.block_review ?? d?.blockReview ?? false),
      studentPermission: d?.student_permission || d?.studentPermission || 'Chỉ xem điểm',
      scoreSetting: d?.score_setting || d?.scoreSetting || 'Lấy điểm lần làm bài đầu tiên',
    });

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        // Thử gọi endpoint chi tiết
        let data = null;
        try {
          data = await api.quiz.getDetails(assignmentId);
        } catch (e) {
          data = null; // tiếp tục fallback
        }

        // Fallback từ danh sách lớp
        if (!data || data?.message === 'Not Found' || data?.status === 404) {
          try {
            const list = await api.quiz.listByClass(classId);
            const found = Array.isArray(list) ? list.find(x => String(x.id) === String(assignmentId)) : null;
            data = found || null;
          } catch (_) {
            // bỏ qua
          }
        }

        if (!mounted) return;
        if (!data) {
          setError('Không tìm thấy dữ liệu bài tập để chỉnh sửa');
          return;
        }

        setForm(normalize(data));
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to load quiz details:', e);
        setError(e?.message || 'Không thể tải chi tiết bài tập');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [assignmentId, classId]);

  const handleSave = async () => {
    try {
      if (!form.title.trim()) {
        alert('Vui lòng nhập tên bài tập');
        return;
      }

      const payload = {
        title: form.title,
        description: form.description,
        time_limit: Number(form.timeLimit) || 0,
        start_time: form.startTime ? new Date(form.startTime).toISOString() : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        max_attempts: Number(form.maxAttempts) || 1,
        show_answers: !!form.showAnswers,
        shuffle_questions: !!form.shuffleQuestions,
        shuffle_answers: !!form.shuffleAnswers,
        is_test: !!form.isTest,
        block_review: !!form.blockReview,
        student_permission: form.studentPermission,
        score_setting: form.scoreSetting,
      };

      const res = await api.quiz.update(assignmentId, payload);
      if (res && (res.ok || res.success || !res.error)) {
        alert('Đã cập nhật bài tập');
        navigate(-1);
      } else {
        const msg = res?.message || 'Cập nhật thất bại (có thể thiếu endpoint PUT /assignments/quiz/:id trên backend)';
        alert(msg);
      }
    } catch (e) {
      console.error('Update error:', e);
      alert(e?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  return (
    <div className="ea-container">
      {/* Breadcrumb */}
      <div className="ea-breadcrumb">
        <span className="ea-breadcrumb-link" onClick={() => navigate(`/teacher/class/${classId}/assignments`)}>Bài tập</span>
        <span className="ea-breadcrumb-sep" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 7l5 5-5 5z" fill="currentColor"/>
          </svg>
        </span>
        <b>Chỉnh sửa</b>
      </div>

      <div className="ea-main">
        {/* Title bar */}
        <div className="ea-titlebar">
          <div>
            <h1 className="ea-title">Chỉnh sửa bài tập</h1>
            <div className="ea-subtitle">Lớp: {classId} • Mã bài: {assignmentId}</div>
          </div>
          <button className="ea-primary-btn" onClick={handleSave}>
            <MdCheck size={18} />
            <span>Lưu thay đổi</span>
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="ea-hint">Đang tải chi tiết bài tập...</div>
        ) : error ? (
          <div className="ea-error">Lỗi: {error}</div>
        ) : (
          <div className="ea-form">
              {/* Tên bài tập */}
              <div className="ea-field">
                <label className="ea-label">Tên bài tập</label>
                <input
                  className="ea-input"
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Nhập tên bài tập"
                />
              </div>

              {/* Mô tả */}
              <div className="ea-field">
                <label className="ea-label">Mô tả</label>
                <textarea
                  className="ea-textarea"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Nhập mô tả bài tập"
                  rows={4}
                />
              </div>

              {/* Thời gian làm bài + Số lần làm */}
              <div className="ea-row-2">
                <div className="ea-field">
                  <label className="ea-label">Thời gian làm bài (phút)</label>
                  <input
                    className="ea-input"
                    type="number"
                    value={form.timeLimit}
                    onChange={(e) => setField('timeLimit', e.target.value)}
                    min={0}
                  />
                </div>
                <div className="ea-field">
                  <label className="ea-label">Số lần làm bài</label>
                  <input
                    className="ea-input"
                    type="number"
                    value={form.maxAttempts}
                    onChange={(e) => setField('maxAttempts', e.target.value)}
                    min={1}
                  />
                </div>
              </div>

              {/* Start/Deadline */}
              <div className="ea-row-2">
                <div className="ea-field">
                  <label className="ea-label">Thời gian bắt đầu</label>
                  <input
                    className="ea-input"
                    type="datetime-local"
                    value={form.startTime ? new Date(form.startTime).toISOString().slice(0,16) : ''}
                    onChange={(e) => setField('startTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
                <div className="ea-field">
                  <label className="ea-label">Hạn chót nộp bài</label>
                  <input
                    className="ea-input"
                    type="datetime-local"
                    value={form.deadline ? new Date(form.deadline).toISOString().slice(0,16) : ''}
                    onChange={(e) => setField('deadline', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
              </div>

              {/* Quyền học sinh + Thiết lập bảng điểm */}
              <div className="ea-row-2">
                <div className="ea-field">
                  <label className="ea-label">Quyền của học sinh</label>
                  <select
                    className="ea-select"
                    value={form.studentPermission}
                    onChange={(e) => setField('studentPermission', e.target.value)}
                  >
                    <option value="Chỉ xem điểm">Chỉ xem điểm</option>
                    <option value="Xem điểm và đáp án">Xem điểm và đáp án</option>
                    <option value="Xem tất cả">Xem tất cả</option>
                  </select>
                </div>
                <div className="ea-field">
                  <label className="ea-label">Thiết lập bảng điểm</label>
                  <select
                    className="ea-select"
                    value={form.scoreSetting}
                    onChange={(e) => setField('scoreSetting', e.target.value)}
                  >
                    <option value="Lấy điểm lần làm bài đầu tiên">Lấy điểm lần làm bài đầu tiên</option>
                    <option value="Lấy điểm cao nhất">Lấy điểm cao nhất</option>
                    <option value="Lấy điểm lần làm bài cuối cùng">Lấy điểm lần làm bài cuối cùng</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="ea-grid">
                <label className="ea-check"><input type="checkbox" checked={form.showAnswers} onChange={(e) => setField('showAnswers', e.target.checked)} /> Cho phép xem đáp án</label>
                <label className="ea-check"><input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setField('shuffleQuestions', e.target.checked)} /> Đảo thứ tự câu</label>
                <label className="ea-check"><input type="checkbox" checked={form.shuffleAnswers} onChange={(e) => setField('shuffleAnswers', e.target.checked)} /> Đảo thứ tự đáp án</label>
                <label className="ea-check"><input type="checkbox" checked={form.isTest} onChange={(e) => setField('isTest', e.target.checked)} /> Gán nhãn kiểm tra</label>
                <label className="ea-check"><input type="checkbox" checked={form.blockReview} onChange={(e) => setField('blockReview', e.target.checked)} /> Chặn xem lại đề sau khi làm xong</label>
              </div>

              {/* ghi chú backend đã được yêu cầu bỏ */}
            </div>
          )}
      </div>
    </div>
  );
}

export default EditAssignmentPage;
