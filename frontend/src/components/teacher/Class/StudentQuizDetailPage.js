import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ minWidth: 140, color: '#666' }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default function StudentQuizDetailPage() {
  const navigate = useNavigate();
  const { classId, assignmentId, studentId } = useParams();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`/api/assignments/quiz/${assignmentId}/student/${studentId}/details`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [assignmentId, studentId]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => navigate(-1)}>&larr; Quay lại</button>
        </div>
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => navigate(-1)}>&larr; Quay lại</button>
        </div>
        <div style={{ color: 'red' }}>Lỗi: {String(error)}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => navigate(-1)}>&larr; Quay lại</button>
        </div>
        Không có dữ liệu.
      </div>
    );
  }

  const { quiz, student, attempt, attempts = [], answers = [], events = [], message } = data;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)}>&larr; Quay lại</button>
        <h2 style={{ margin: 0 }}>Chi tiết kết quả học sinh</h2>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Thông tin</h3>
          <Row label="Lớp" value={<Link to={`/teacher/class/${classId}/assignments`}>#{classId}</Link>} />
          <Row label="Bài tập" value={`${quiz?.title || ''} (#${quiz?.id})`} />
          <Row label="Học sinh" value={`${student?.full_name || 'N/A'} (${student?.username || student?.id})`} />
        </div>

        <div style={{ flex: '1 1 320px', background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Attempt dùng chấm điểm</h3>
          {attempt ? (
            <>
              <Row label="Attempt ID" value={`#${attempt.id}`} />
              <Row label="Trạng thái" value={attempt.status} />
              <Row label="Bắt đầu" value={attempt.started_at || '—'} />
              <Row label="Nộp lúc" value={attempt.submitted_at || '—'} />
              <Row label="Thời gian (s)" value={attempt.time_spent} />
              <Row label="Điểm" value={`${attempt.total_score}/${attempt.max_possible_score} (${attempt.percentage}%)`} />
              <Row label="Rời khỏi" value={attempt.leave_count} />
              <Row label="Sửa đổi" value={attempt.edit_count} />
            </>
          ) : (
            <div>Chưa có bài nộp.</div>
          )}
        </div>
      </div>

      {message && (
        <div style={{ padding: 12, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6 }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 520px', background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Câu trả lời</h3>
          {answers.length === 0 ? (
            <div>Không có dữ liệu câu trả lời.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>#</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Câu hỏi</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Đúng/Sai</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Lựa chọn</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((a, idx) => (
                  <tr key={idx}>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{a.question_order ?? idx + 1}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{a.question_text}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8, color: a.is_correct ? '#2e7d32' : '#d32f2f' }}>
                      {a.is_correct ? 'Đúng' : 'Sai'}
                    </td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>
                      {a.options?.map(opt => (
                        <div key={opt.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontWeight: opt.isCorrect ? 600 : 400, color: opt.isCorrect ? '#2e7d32' : undefined }}>
                            {String.fromCharCode(64 + (opt.order || 0))}.
                          </span>
                          <span style={{ textDecoration: opt.selected ? 'underline' : 'none' }}>
                            {opt.text}
                          </span>
                          {opt.isCorrect && <span style={{ color: '#2e7d32' }}>(đúng)</span>}
                          {opt.selected && <span style={{ color: '#1976d2' }}>(đã chọn)</span>}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ flex: '1 1 320px', background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Lịch sử sự kiện</h3>
          {events.length === 0 ? (
            <div>Không có sự kiện.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {events.map(ev => (
                <li key={ev.id} style={{ marginBottom: 6 }}>
                  <span style={{ color: '#555' }}>[{ev.createdAt}]</span> {ev.type}
                  {ev.note ? <em style={{ color: '#888' }}> – {ev.note}</em> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Tất cả attempts</h3>
        {attempts.length === 0 ? (
          <div>Không có attempt.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>#</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>ID</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Trạng thái</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Bắt đầu</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Nộp</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Điểm</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 8 }}>Chấm</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a, idx) => (
                <tr key={a.id}>
                  <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{idx + 1}</td>
                  <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>#{a.id}</td>
                  <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{a.status}</td>
                  <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{a.started_at || '—'}</td>
                  <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{a.submitted_at || '—'}</td>
                  <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{a.total_score}/{a.max_possible_score} ({a.percentage}%)</td>
                  <td style={{ borderBottom: '1px solid #f5f5f5', padding: 8 }}>{a.take_for_grade ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
