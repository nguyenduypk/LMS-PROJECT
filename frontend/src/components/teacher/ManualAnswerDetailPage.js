import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ManualAnswerDetailPage.css';

export default function ManualAnswerDetailPage() {
  const location = useLocation();
  const fileUrl = location.state?.fileUrl;
  const fileName = location.state?.fileName;

  // State cho số câu hỏi và đáp án
  const [numQuestions, setNumQuestions] = useState(1);
  const [answers, setAnswers] = useState([{ answer: '', score: 10 }]);

  // State cho tab
  const [activeTab, setActiveTab] = useState(0); // 0: Đáp án, 1: Thông tin học liệu

  // Modal state
  const [showQuickInputModal, setShowQuickInputModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [quickInputType, setQuickInputType] = useState('answer'); // 'answer' hoặc 'score'
  const [quickInputValue, setQuickInputValue] = useState('');

  // Switch states for info form
  const [hasPassword, setHasPassword] = useState(false);
  const [hasDuration, setHasDuration] = useState(false);
  const [hasStartTime, setHasStartTime] = useState(false);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [password, setPassword] = useState('');
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState('');
  const [deadline, setDeadline] = useState('');

  // Khi thay đổi số câu hỏi
  const handleNumQuestionsChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setNumQuestions(value);
    const scorePerQuestion = +(10 / value).toFixed(2);
    setAnswers((prev) => {
      const newAnswers = Array(value).fill().map((_, i) => ({
        answer: prev[i]?.answer || '',
        score: scorePerQuestion
      }));
      return newAnswers;
    });
  };

  // Khi nhập đáp án hoặc điểm
  const handleAnswerChange = (idx, field, val) => {
    setAnswers((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Thêm hàm xử lý xác nhận nhập nhanh
  const handleQuickInputConfirm = () => {
    if (quickInputType === 'answer') {
      // Cập nhật đáp án cho từng câu
      setAnswers(prev => {
        const newAnswers = prev.map((item, idx) => ({
          ...item,
          answer: quickInputValue[idx] ? quickInputValue[idx] : ''
        }));
        return newAnswers;
      });
    } else if (quickInputType === 'score') {
      // Hỗ trợ cú pháp 2.5*10
      const parts = quickInputValue.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      let scores = [];
      parts.forEach(part => {
        if (part.includes('*')) {
          const [val, count] = part.split('*').map(x => x.trim());
          const numVal = parseFloat(val);
          const numCount = parseInt(count);
          if (!isNaN(numVal) && !isNaN(numCount)) {
            for (let i = 0; i < numCount; i++) scores.push(numVal);
          }
        } else {
          const numVal = parseFloat(part);
          if (!isNaN(numVal)) scores.push(numVal);
        }
      });
      setAnswers(prev => {
        const newAnswers = prev.map((item, idx) => ({
          ...item,
          score: scores[idx] !== undefined ? scores[idx] : item.score
        }));
        return newAnswers;
      });
    }
    setShowQuickInputModal(false);
    setQuickInputValue('');
  };

  return (
    <div className="manual-answer-detail-layout">
      <div className="manual-answer-detail-left">
        <div className="file-preview-scroll">
          <div className="file-preview">
            {fileUrl ? (
              fileName?.endsWith('.pdf') ? (
                <iframe src={fileUrl} width="100%" height="600px" title="Preview" />
              ) : fileName?.endsWith('.doc') || fileName?.endsWith('.docx') ? (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
                  width="100%"
                  height="600px"
                  frameBorder="0"
                  title="Word Preview"
                />
              ) : (
                <img src={fileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '600px' }} />
              )
            ) : (
              <span>Preview file đề ở đây</span>
            )}
          </div>
        </div>
      </div>
      <div className="manual-answer-detail-right" style={{display: 'flex', flexDirection: 'column', height: '100vh', minHeight: 0}}>
        <div className="custom-tabs">
          <div className={`custom-tab${activeTab === 0 ? ' active' : ''}`} onClick={() => setActiveTab(0)}>1. Đáp án</div>
          <div className={`custom-tab${activeTab === 1 ? ' active' : ''}`} onClick={() => setActiveTab(1)}>2. Thông tin học liệu</div>
        </div>
        <div className="tab-content" style={{flex: 1, minHeight: 0, overflow: 'auto'}}>
          {activeTab === 0 ? (
            <>
              <div className="answer-toolbar">
                <div className="toolbar-left">
                  <div className="answer-row">
                    <label style={{ color: '#fff', fontWeight: 600, marginRight: 8 }}>Số câu</label>
                    <input
                      type="number"
                      className="answer-input"
                      min={1}
                      value={numQuestions}
                      onChange={handleNumQuestionsChange}
                    />
                    <label style={{ color: '#fff', fontWeight: 600, margin: '0 8px 0 24px' }}>Tổng điểm</label>
                    <input
                      type="number"
                      className="answer-input"
                      value={answers.slice(0, numQuestions).reduce((sum, item) => sum + (parseFloat(item.score) || 0), 0).toFixed(2)}
                      readOnly
                    />
                  </div>
                </div>
                <div className="toolbar-right">
                  <button className="answer-btn" onClick={() => setShowQuickInputModal(true)}>Nhập nhanh</button>
                  <button className="answer-btn" onClick={() => setShowNoteModal(true)}>Lưu ý</button>
                </div>
              </div>
              <div className="answer-list-scroll">
                <div className="answer-list">
                  {answers.slice(0, numQuestions).map((item, idx) => (
                    <div className="answer-item" key={idx}>
                      <div className="answer-item-label">Câu {idx + 1}</div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 4, flex: 1}}>
                        <label style={{fontSize: '14px', fontWeight: 500, color: '#333'}}>Đáp án</label>
                        <input
                          className="answer-item-input"
                          placeholder="Đáp án"
                          value={item.answer}
                          onChange={e => handleAnswerChange(idx, 'answer', e.target.value)}
                        />
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 4, flex: 1}}>
                        <label style={{fontSize: '14px', fontWeight: 500, color: '#333'}}>Điểm</label>
                        <input
                          className="answer-item-input"
                          placeholder="Điểm"
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.score}
                          onChange={e => handleAnswerChange(idx, 'score', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <form className="info-form-container">
              <div className="info-form-row">
                <label className="info-form-label">Tên bài tập (*)</label>
                <input type="text" className="info-form-input" defaultValue={fileName || ''} />
              </div>
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Mật khẩu bài tập</label>
                <label className="switch">
                  <input type="checkbox" checked={hasPassword} onChange={e => setHasPassword(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
              {hasPassword && (
                <input type="text" className="info-form-input" placeholder="Nhập mật khẩu..." value={password} onChange={e => setPassword(e.target.value)} />
              )}
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Thời lượng làm bài và nộp bài (phút)</label>
                <label className="switch">
                  <input type="checkbox" checked={hasDuration} onChange={e => setHasDuration(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
              {hasDuration && (
                <>
                  <input type="number" className="info-form-input" placeholder="Thời lượng (phút)" value={duration} onChange={e => setDuration(e.target.value)} />
                  <div className="quick-btn-row">
                    <button type="button" className="quick-btn" onClick={() => setDuration('30')}>30 phút</button>
                    <button type="button" className="quick-btn" onClick={() => setDuration('45')}>45 phút</button>
                    <button type="button" className="quick-btn" onClick={() => setDuration('60')}>60 phút</button>
                  </div>
                </>
              )}
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Thời gian bắt đầu</label>
                <label className="switch">
                  <input type="checkbox" checked={hasStartTime} onChange={e => setHasStartTime(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
              {hasStartTime && (
                <input type="datetime-local" className="info-form-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              )}
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Hạn chót nộp bài</label>
                <label className="switch">
                  <input type="checkbox" checked={hasDeadline} onChange={e => setHasDeadline(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
              {hasDeadline && (
                <>
                  <div className="info-form-note">Học sinh không thể nộp bài sau thời gian này</div>
                  <input type="datetime-local" className="info-form-input" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </>
              )}
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Gán nhãn bài tập là kiểm tra</label>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Chặn học sinh xem lại đề sau khi làm bài xong</label>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Quyền của học sinh</label>
                <select className="info-form-select">
                  <option>Chỉ xem điểm</option>
                  <option>Xem đáp án</option>
                  <option>Xem đáp án và giải thích</option>
                </select>
              </div>
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Số lần làm bài</label>
                <input type="number" className="info-form-input" defaultValue={1} />
              </div>
              <div className="info-form-row">
                <label className="info-form-label"><span className="info-icon">❓</span> Thiết lập điểm</label>
                <select className="info-form-select">
                  <option>Lấy điểm lần làm bài đầu tiên</option>
                  <option>Lấy điểm cao nhất</option>
                  <option>Lấy điểm trung bình</option>
                </select>
              </div>
            </form>
          )}
        </div>
        <div className="continue-btn-wrapper">
          {activeTab === 0 ? (
            <button
              className="continue-btn"
              style={{
                minWidth: 140,
                background: "#2196f3",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 0",
                fontSize: "1.08rem",
                fontWeight: 600,
                boxShadow: "none",
                margin: 0,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setActiveTab(1)}
            >
              Tiếp tục
            </button>
          ) : (
            <>
              <div className="action-btn-row">
                <button
                  className="action-btn outline back"
                  onClick={() => setActiveTab(0)}
                >
                  Quay lại
                </button>
                <button
                  className="action-btn primary save"
                  onClick={() => {
                    // Xử lý lưu học liệu ở đây
                  }}
                >
                  Lưu học liệu
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Nhập nhanh */}
        {showQuickInputModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{fontWeight: 600, fontSize: 20, marginBottom: 16}}>Nhập nhanh</div>
              <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
                <button
                  className={quickInputType === 'answer' ? 'modal-tab active' : 'modal-tab'}
                  onClick={() => setQuickInputType('answer')}
                >Đáp án</button>
                <button
                  className={quickInputType === 'score' ? 'modal-tab active' : 'modal-tab'}
                  onClick={() => setQuickInputType('score')}
                >Điểm</button>
              </div>
              {quickInputType === 'answer' ? (
                <>
                  <div style={{marginBottom: 12, lineHeight: 1.5}}>
                    Chuỗi đáp án viết liền không dấu (VD: ACDABCAD)<br/>
                    Mỗi ký tự là 1 đáp án!
                  </div>
                  <textarea
                    className="quick-input-textarea"
                    style={{width: '100%', minHeight: 48, marginBottom: 8}}
                    value={quickInputValue}
                    onChange={e => setQuickInputValue(e.target.value)}
                  />
                  <div style={{fontSize: 13, color: '#888', marginBottom: 12}}>Bạn sẽ tạo ra {quickInputValue.length} đáp án</div>
                  <div style={{height: 20}}></div>
                </>
              ) : (
                <>
                  <div style={{marginBottom: 12, lineHeight: 1.5}}>
                    Điểm từng câu ngăn cách bởi dấu ;<br/>
                    Bạn có thể dùng dấu * để nhập cho nhiều câu<br/>
                    <span style={{color: '#444'}}>VD: 4;6;2.5*10; (4 điểm ; 6 điểm ; 10 câu 2,5 điểm)</span>
                  </div>
                  <textarea
                    className="quick-input-textarea"
                    style={{width: '100%', minHeight: 48, marginBottom: 8}}
                    value={quickInputValue}
                    onChange={e => setQuickInputValue(e.target.value)}
                  />
                  <div style={{height: 32}}></div>
                </>
              )}
              <div style={{display: 'flex', gap: 12, marginTop: 16}}>
                <button className="modal-btn" onClick={() => setShowQuickInputModal(false)}>Hủy</button>
                <button className="modal-btn primary" onClick={handleQuickInputConfirm}>Xác nhận</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lưu ý */}
        {showNoteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{fontWeight: 600, fontSize: 20, marginBottom: 16}}>Lưu ý</div>
              <ol style={{marginLeft: 16, marginBottom: 16, color: '#222'}}>
                <li>Đáp án không phân biệt chữ HOA/thường.</li>
                <li>Trong trường hợp có nhiều đáp án các đáp án được ngăn cách bởi dấu "/" (ví dụ: HS/học sinh).</li>
                <li>Bấm Enter sau khi nhập đáp án để qua câu hỏi khác nhanh hơn.</li>
                <li>Bấm phím mũi tên để di chuyển giữa các câu hỏi.</li>
              </ol>
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button className="modal-btn primary" onClick={() => setShowNoteModal(false)}>Xác nhận</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 