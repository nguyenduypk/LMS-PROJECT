import React, { useState } from 'react';
import DocumentViewer from './DocumentViewer';
import './StudentScoreDetail.css';

function StudentScoreDetail() {
  // Dữ liệu mẫu
  const [showSolution, setShowSolution] = useState(false);
  const [attempt, setAttempt] = useState(7);
  const [tab, setTab] = useState('result');
  const [isAttemptDropdownOpen, setIsAttemptDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    submissionInfo: false,
    submissionHistory: false,
    submissionResults: false
  });
  const totalQuestions = 10;
  const correct = 0;
  const wrong = 0;
  const notDone = 5;
  const time = 40 * 60 + 46; // 40 phút 46 giây
  const submitTime = '22 tháng 7 lúc 17:24';
  const answers = [
    { num: 1, chosen: '-', correct: 'a', score: 2 },
    { num: 2, chosen: '-', correct: 'b', score: 2 },
    { num: 3, chosen: '-', correct: 'c', score: 2 },
    { num: 4, chosen: '-', correct: 'd', score: 2 },
    { num: 5, chosen: '-', correct: 'a', score: 2 },
    { num: 6, chosen: '-', correct: 'b', score: 2 },
    { num: 7, chosen: '-', correct: 'c', score: 2 },
    { num: 8, chosen: '-', correct: 'd', score: 2 },
    { num: 9, chosen: '-', correct: 'a', score: 2 },
    { num: 10, chosen: '-', correct: 'b', score: 2 },
  ];

  // Dữ liệu mẫu lịch sử cho từng lần làm bài
  const historyEventsByAttempt = {
    1: [
      { type: 'leave', time: '22/07/2024 16:10:12' },
      { type: 'return', time: '22/07/2024 16:12:05' },
    ],
    2: [
      { type: 'leave', time: '22/07/2024 16:20:00' },
      { type: 'return', time: '22/07/2024 16:21:30' },
      { type: 'leave', time: '22/07/2024 16:25:00' },
      { type: 'return', time: '22/07/2024 16:26:10' },
    ],
    3: [],
    4: [
      { type: 'leave', time: '22/07/2024 17:10:12' },
      { type: 'return', time: '22/07/2024 17:12:05' },
      { type: 'leave', time: '22/07/2024 17:20:00' },
      { type: 'return', time: '22/07/2024 17:21:30' },
    ],
    5: [],
    6: [],
    7: [
      { type: 'leave', time: '22/07/2024 18:00:00' },
      { type: 'return', time: '22/07/2024 18:01:00' },
    ],
    8: [],
    9: [],
    10: [],
  };
  const historyEvents = historyEventsByAttempt[attempt] || [];
  const leaveCount = historyEvents.filter(e => e.type === 'leave').length;

  // Dữ liệu thành viên lớp
  const MEMBERS = [
    { id: 1, name: "Nguyễn Duy" },
    { id: 2, name: "Nguyễn Khánh Dương Duy" },
    { id: 3, name: "Trần Thị Mai" },
    { id: 4, name: "Lê Văn An" },
    { id: 5, name: "Phạm Thị Hoa" },
  ];

  function getInitials(name) {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  }

  function formatTime(sec) {
    if (sec < 60) return `${sec} giây`;
    if (sec < 3600) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m} phút${s > 0 ? ` ${s} giây` : ''}`;
    }
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h} giờ${m > 0 ? ` ${m} phút` : ''}`;
  }

  return (
    <div className="student-score-layout" style={{ gap: 0 }}>
      {/* Header */}
      <div className="score-detail-header">
        <div className="score-detail-header-content">
          <div className="score-detail-header-left">
            <div className="score-detail-breadcrumb">
              <span className="score-detail-breadcrumb-icon">✕</span>
              <span className="score-detail-breadcrumb-text">Mẫuonaldo</span>
              <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="score-detail-breadcrumb-separator"
            >
              <path d="M10 7l5 5-5 5z" fill="currentColor"/>
            </svg>
            </div>
            <div className="score-detail-member-dropdown-container">
            <div
              className="score-detail-member-dropdown-button"
              onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
            >
              <div className="score-detail-member-dropdown-avatar">
                {getInitials("Nguyễn Duy")}
              </div>
              <div className="score-detail-member-dropdown-name">Nguyễn Duy</div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`score-detail-member-dropdown-arrow ${isMemberDropdownOpen ? 'rotated' : ''}`}
              >
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </div>
            <div className={`score-detail-member-dropdown-list ${isMemberDropdownOpen ? 'open' : ''}`}>
              <div className="score-detail-member-dropdown-search-row">
                <input
                  className="score-detail-member-dropdown-search-input"
                  placeholder="Tìm thành viên..."
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="score-detail-member-dropdown-search-icon">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {MEMBERS.map((memberItem) => (
                <div
                  key={memberItem.id}
                  className="score-detail-member-dropdown-member-item"
                  onClick={() => {
                    // Navigate to member detail page
                    setIsMemberDropdownOpen(false);
                  }}
                >
                  <div className="score-detail-member-dropdown-avatar">
                    {getInitials(memberItem.name)}
                  </div>
                  <div className="score-detail-member-dropdown-name">{memberItem.name}</div>
                </div>
              ))}
            </div>
          </div>
          </div>
          <div className="score-detail-header-right">
            <div className="score-detail-toggle-container">
              <span className="score-detail-toggle-label">Lời giải</span>
              <label className="score-detail-toggle-switch">
                <input
                  type="checkbox"
                  checked={showSolution}
                  onChange={(e) => setShowSolution(e.target.checked)}
                />
                <span className="score-detail-toggle-slider"></span>
              </label>
            </div>
            <div className="score-detail-action-buttons">
              <button className="score-detail-action-btn print-btn" onClick={() => setIsPrintModalOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 8H5C3.34 8 2 9.34 2 11V17H6V21H18V17H22V11C22 9.34 20.66 8 19 8ZM16 19H8V15H16V19ZM20 15H18V13H6V15H4V11C4 10.45 4.45 10 5 10H19C19.55 10 20 10.45 20 11V15Z" fill="currentColor"/>
                  <path d="M7 12H9V14H7V12ZM11 12H13V14H11V12ZM15 12H17V14H15V12Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="student-score-content">
        {/* Bên trái: Viewer tài liệu */}
        <div className="student-score-left">
          <DocumentViewer
            src="https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fshub-storage.shub.edu.vn%2Ftests%2F3301349%2Ffile_url%2F1752139174477_qpan.docx"
            title="Word Viewer"
          />
        </div>
        {/* Bên phải: Kết quả */}
        <div className="student-score-right-placeholder student-score-right">

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <div className="score-detail-dropdown-container">
            <div
              className="score-detail-dropdown-button"
              onClick={() => setIsAttemptDropdownOpen(!isAttemptDropdownOpen)}
            >
              <span>{`Lần làm bài ${attempt}`}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`score-detail-dropdown-arrow ${isAttemptDropdownOpen ? 'rotated' : ''}`}
              >
                <path d="m7 10 5 5 5-5z" fill="currentColor"/>
              </svg>
            </div>
            {isAttemptDropdownOpen && (
              <div className="score-detail-dropdown-menu">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i+1}
                    className={`score-detail-dropdown-item ${attempt === i+1 ? 'selected' : ''}`}
                    onClick={() => {
                      setAttempt(i+1);
                      setIsAttemptDropdownOpen(false);
                    }}
                  >
                    {`Lần làm bài ${i+1}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="score-detail-tabs">
          <button
            className={`score-detail-tab${tab === 'result' ? ' active' : ''}`}
            onClick={() => setTab('result')}
          >
            Kết quả
          </button>
          <button
            className={`score-detail-tab${tab === 'history' ? ' active' : ''}`}
            onClick={() => setTab('history')}
          >
            Lịch sử
          </button>
        </div>
        {tab === 'result' && (
          <>
            <div className="score-detail-score-box">0 / 10</div>
            <div className="score-detail-info-block">
              <div className="score-detail-info-row">
                <span className="score-detail-info-label">Thời gian</span>
                <span className="score-detail-info-value">{formatTime(time)}</span>
              </div>
              <div className="score-detail-info-row">
                <span className="score-detail-info-label">Nộp lúc</span>
                <span className="score-detail-info-value">{submitTime}</span>
              </div>
              <div className="score-detail-info-row">
                <span className="score-detail-info-label-group">
                  <span className="score-detail-dot green"></span>
                  <span className="score-detail-info-label">Số câu đúng</span>
                </span>
                <span className="score-detail-info-value">{correct}</span>
              </div>
              <div className="score-detail-info-row">
                <span className="score-detail-info-label-group">
                  <span className="score-detail-dot red"></span>
                  <span className="score-detail-info-label">Số câu sai</span>
                </span>
                <span className="score-detail-info-value">{wrong}</span>
              </div>
              <div className="score-detail-info-row not-done">
                <span className="score-detail-info-label-group">
                  <span className="score-detail-dot gray"></span>
                  <span className="score-detail-info-label">Chưa làm</span>
                </span>
                <span className="score-detail-info-value">{notDone}</span>
              </div>
            </div>
            <div className="score-detail-table-container">
              <div className="score-detail-table-title">Phiếu bài làm</div>
              <table className="score-detail-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Câu</th>
                    <th>Chọn</th>
                    <th>Đáp án đúng</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map(a => (
                    <tr key={a.num}>
                      <td>
                        <span className="score-detail-dot gray"></span>
                      </td>
                      <td>{a.num}</td>
                      <td style={{ color: '#898ea0' }}>{a.chosen}</td>
                      <td>{a.correct}</td>
                      <td>({a.score})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === 'history' && (
          <>
            <div className="history-summary-box" style={{border: '1px solid #e3eafc', borderRadius: 12, padding: 16, marginBottom: 16}}>
              <div style={{fontWeight: 600, marginBottom: 8}}>Tổng quan quá trình làm bài</div>
              <div>Số lần rời khỏi làm bài: {leaveCount}</div>
              <div>Số lần chỉnh sửa: 0</div>
            </div>
            <div className="history-detail-box">
              <div style={{fontWeight: 600, color: '#d32f2f', marginBottom: 8}}>
                <span style={{display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#d32f2f', marginRight: 8}}></span>
                Lịch sử làm bài
              </div>
              {historyEvents.length === 0 ? (
                <div style={{color: '#757575'}}>Không có dữ liệu để hiển thị. Học sinh có thể đã hoàn thành bài tập trước khi tính năng ra mắt.</div>
              ) : (
                <ul style={{paddingLeft: 0, listStyle: 'none'}}>
                  {historyEvents.map((event, idx) => (
                    <li key={idx} style={{marginBottom: 8, display: 'flex', alignItems: 'center'}}>
                      <span style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: event.type === 'leave' ? '#d32f2f' : '#388e3c',
                        marginRight: 8
                      }}></span>
                      <span>
                        {event.type === 'leave' ? 'Rời khỏi trang' : 'Quay lại trang'}: <b>{event.time}</b>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        </div>
      </div>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="score-detail-print-modal-overlay" onClick={() => setIsPrintModalOpen(false)}>
          <div className="score-detail-print-modal" onClick={(e) => e.stopPropagation()}>
            <div className="score-detail-print-modal-header">
              <h3>Chọn thông tin bài làm cần xuất</h3>
            </div>
            <div className="score-detail-print-modal-content">
              <div className="score-detail-print-option">
                <input
                  type="checkbox"
                  id="submissionInfo"
                  checked={printOptions.submissionInfo}
                  onChange={(e) => setPrintOptions(prev => ({...prev, submissionInfo: e.target.checked}))}
                />
                <label htmlFor="submissionInfo">Thông tin bài làm</label>
              </div>
              <div className="score-detail-print-option">
                <input
                  type="checkbox"
                  id="submissionHistory"
                  checked={printOptions.submissionHistory}
                  onChange={(e) => setPrintOptions(prev => ({...prev, submissionHistory: e.target.checked}))}
                />
                <label htmlFor="submissionHistory">Lịch sử làm bài</label>
              </div>
              <div className="score-detail-print-option">
                <input
                  type="checkbox"
                  id="submissionResults"
                  checked={printOptions.submissionResults}
                  onChange={(e) => setPrintOptions(prev => ({...prev, submissionResults: e.target.checked}))}
                />
                <label htmlFor="submissionResults">Kết quả bài làm</label>
              </div>
            </div>
            <div className="score-detail-print-modal-footer">
              <button 
                className="score-detail-print-modal-btn cancel-btn"
                onClick={() => setIsPrintModalOpen(false)}
              >
                Hủy
              </button>
              <button 
                className={`score-detail-print-modal-btn confirm-btn ${Object.values(printOptions).some(Boolean) ? 'active' : 'disabled'}`}
                onClick={() => {
                  if (Object.values(printOptions).some(Boolean)) {
                    // Handle print logic here
                    setIsPrintModalOpen(false);
                  }
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentScoreDetail;
