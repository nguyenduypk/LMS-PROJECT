import React, { useEffect, useState } from "react";
import Header from "../Header";
import TeacherSidebar from './TeacherSidebar';
import { useNavigate, useParams } from "react-router-dom";
import "./TeacherMemberDetailPage.css";
import { MdOutlineScore, MdOutlineAssignment, MdOutlineVisibilityOff, MdDeleteOutline, MdSearch, MdFolder, MdKeyboardArrowDown } from "react-icons/md";
import { api } from "../../../utils/api";

function getInitials(name) {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

function TeacherMemberDetailPage({ classInfo }) {
  const { classId, memberId } = useParams();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState('all'); // all | assignments | quizzes
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  const filterOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'assignments', label: 'Bài tập' },
    { value: 'quizzes', label: 'Bài kiểm tra' }
  ];

  // Load members list for dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.classes.getMembers(classId);
        if (mounted) setMembers(Array.isArray(res?.members) ? res.members : (Array.isArray(res) ? res : []));
      } catch (_) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [classId]);

  // Load overview and activities
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [ov, acts] = await Promise.all([
          api.classes.getMemberOverview(classId, memberId),
          api.classes.getMemberActivities(classId, memberId, { q: search, type: selectedFilter, page, limit })
        ]);
        if (!mounted) return;
        try { console.log('👤 memberOverview:', ov); } catch(_) {}
        try { console.log('📝 memberActivities:', acts); } catch(_) {}
        setOverview(ov || null);
        // Expect acts: { items, total, page, limit }
        const items = acts?.items || acts?.data || acts || [];
        setActivities(Array.isArray(items) ? items : []);
        setTotal(Number(acts?.total || 0));
      } catch (e) {
        if (mounted) setError(e?.message || 'Lỗi tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [classId, memberId, selectedFilter, search, page, limit]);

  const memberName = overview?.student?.name || overview?.student?.full_name || overview?.student_name || overview?.full_name || overview?.name || '';
  const initials = getInitials(memberName);
  // Helpers
  const clamp10 = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(10, n));
  };
  const fmtScore = (v) => {
    const c = clamp10(v);
    return c == null ? '-' : c.toFixed(1);
  };
  const fmtDate = (v) => {
    if (!v) return '-';
    try { return new Date(v).toLocaleString('vi-VN'); } catch { return String(v); }
  };
  let averageScoreRaw = overview?.average_score ?? overview?.avg ?? overview?.avg_10 ?? overview?.stats?.average ?? overview?.stats?.average_score ?? overview?.stats?.avg ?? overview?.stats?.avg_10 ?? null;
  // Raw stats from overview with multiple fallbacks (snake_case/camelCase)
  let attemptsCount = overview?.stats?.attempts_count ?? overview?.stats?.attempts ?? overview?.attempts_count ?? overview?.attempts ?? overview?.stats?.total_attempts ?? overview?.total_attempts ?? null;
  let completedCount = overview?.stats?.completed_count ?? overview?.stats?.completed ?? overview?.completed_count ?? overview?.completed ?? overview?.stats?.submissions_count ?? overview?.submissions_count ?? null;
  // Nếu backend trả done_assignments/done_quizzes, suy ra counts từ đó
  if (overview?.stats) {
    const da = Number(overview.stats.done_assignments ?? 0);
    const dq = Number(overview.stats.done_quizzes ?? 0);
    const sumDone = (Number.isFinite(da) ? da : 0) + (Number.isFinite(dq) ? dq : 0);
    if (attemptsCount == null) attemptsCount = sumDone;
    if (completedCount == null) completedCount = sumDone;
  }
  let joinedAtRaw = overview?.stats?.joined_at ?? overview?.stats?.joinedAt ?? overview?.joined_at ?? overview?.joinedAt ?? overview?.student?.joined_at ?? overview?.student?.joinedAt ?? overview?.member?.joined_at ?? overview?.member?.joinedAt ?? overview?.enrolled_at ?? overview?.enrolledAt ?? overview?.created_at ?? overview?.createdAt;
  let bestScoreRaw = overview?.stats?.best_score ?? overview?.stats?.bestScore ?? overview?.best_score ?? overview?.bestScore ?? overview?.stats?.best_score_10 ?? overview?.best_score_10;

  // Derive from activities if missing
  try {
    if ((attemptsCount == null || completedCount == null || bestScoreRaw == null || !joinedAtRaw || averageScoreRaw == null) && Array.isArray(activities) && activities.length > 0) {
      const withScore = activities.filter(x => (x.score_10 ?? x.normalized_score ?? x.score) != null);
      if (attemptsCount == null) attemptsCount = activities.length; // tổng mục hoạt động
      if (completedCount == null) completedCount = withScore.length; // coi có điểm là đã làm
      if (bestScoreRaw == null && withScore.length > 0) {
        bestScoreRaw = withScore.reduce((mx, x) => {
          const s = Number(x.score_10 ?? x.normalized_score ?? x.score);
          return Number.isFinite(s) ? Math.max(mx, s) : mx;
        }, 0);
      }
      if (averageScoreRaw == null && withScore.length > 0) {
        const sum = withScore.reduce((acc, x) => acc + Number((x.score_10 ?? x.normalized_score ?? x.score) || 0), 0);
        averageScoreRaw = sum / withScore.length;
      }
      if (!joinedAtRaw) {
        // ngày sớm nhất theo created_at/assigned_at
        const times = activities
          .map(x => x.created_at || x.createdAt || x.assigned_at || x.assignedAt)
          .filter(Boolean)
          .map(t => new Date(t).getTime())
          .filter(n => Number.isFinite(n));
        if (times.length > 0) {
          joinedAtRaw = new Date(Math.min(...times)).toISOString();
        }
      }
    }
  } catch (_) {}

  const joinedAt = fmtDate(joinedAtRaw);
  const bestScore = bestScoreRaw != null ? fmtScore(bestScoreRaw) : '-';
  const averageScore = averageScoreRaw != null ? fmtScore(averageScoreRaw) : '-';

  // Ensure counts show 0 instead of '-'
  if (attemptsCount == null) attemptsCount = 0;
  if (completedCount == null) completedCount = 0;

  const filteredMembers = members.filter(m => (m.name || m.full_name || m.display_name || '').toLowerCase().includes(memberSearch.toLowerCase()));

  const handleRemove = async () => {
    if (!window.confirm('Bạn có chắc muốn xoá học sinh này khỏi lớp?')) return;
    try {
      await api.classes.removeMember(classId, memberId);
      navigate(`/teacher/class/${classId}/members`);
    } catch (e) {
      alert(e?.message || 'Không thể xoá học sinh');
    }
  };

  return (
    <div className="teacher-member-detail-layout">
      <Header />
      <div className="teacher-member-detail-main">
        <TeacherSidebar classInfo={classInfo} />
        <div className="teacher-member-detail-content">
          <div className="teacher-member-detail-breadcrumb-row">
            <div className="teacher-member-detail-breadcrumb">
              <span style={{cursor: 'pointer', color: '#000'}} onClick={() => navigate(`/teacher/class/${classId}/members`)}>Thành viên</span>
              <span className="teacher-member-detail-breadcrumb-sep">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 7l5 5-5 5z" fill="currentColor"/>
                </svg>
              </span>
              <b>{memberName || '...'}</b>
            </div>
            <div className="teacher-member-detail-dropdown-wrapper">
              <div 
                className="teacher-member-detail-dropdown-btn"
                onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
              >
                <div className="teacher-member-detail-dropdown-avatar">
                  {initials}
                </div>
                <div className="teacher-member-detail-dropdown-name">{memberName || '...'}</div>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={`teacher-member-detail-dropdown-arrow ${isMemberDropdownOpen ? 'rotated' : ''}`}
                >
                  <path d="m7 10 5 5 5-5z" fill="currentColor"/>
                </svg>
              </div>
              <div className={`teacher-member-detail-dropdown-list ${isMemberDropdownOpen ? 'open' : ''}`}>
                  <div className="teacher-member-detail-dropdown-search-row">
                    <input 
                      className="teacher-member-detail-dropdown-search-input" 
                      placeholder="Tìm thành viên..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                    <MdSearch size={18} className="teacher-member-detail-dropdown-search-icon" />
                  </div>
                  {filteredMembers.map((memberItem) => (
                    <div
                      key={memberItem.id || memberItem.user_id || memberItem.student_id}
                      className="teacher-member-detail-dropdown-member-item"
                      onClick={() => {
                        const mId = memberItem.id || memberItem.user_id || memberItem.student_id;
                        navigate(`/teacher/class/${classId}/members/${mId}`);
                        setIsMemberDropdownOpen(false);
                      }}
                    >
                      <div className="teacher-member-detail-dropdown-avatar">
                        {getInitials(memberItem.name || memberItem.full_name || memberItem.display_name)}
                      </div>
                      <div className="teacher-member-detail-dropdown-name">{memberItem.name || memberItem.full_name || memberItem.display_name}</div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
          <div className="teacher-member-detail-body">
            <div className="teacher-member-detail-info-col">
              <div className="teacher-member-detail-info-card teacher-member-detail-main-card">
                <div className="teacher-member-detail-student-badge">Chỉ số học sinh</div>
                <div className="teacher-member-detail-avatar-circle">{initials}</div>
                <div className="teacher-member-detail-name">{memberName || '...'}</div>
                <div className="teacher-member-detail-average">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight:6,verticalAlign:'middle'}}>
                    <path d="M9 17H5V21H9V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 3H9V21H13V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 7H15V21H19V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Điểm trung bình <b style={{float:'right'}}>{averageScore ?? '-'}</b>
                </div>
              </div>
              <div className="teacher-member-detail-info-card teacher-member-detail-unified-card">
                <div className="teacher-member-detail-unified-header">
                  <div className="teacher-member-detail-unified-title">Thông tin & Thống kê</div>
                </div>
                
                <div className="teacher-member-detail-unified-content">
                  <div className="teacher-member-detail-unified-section">
                    <div className="teacher-member-detail-unified-section-title">Hành động</div>
                    <div className="teacher-member-detail-unified-actions">
                      <div className="teacher-member-detail-unified-action">
                        <MdOutlineVisibilityOff size={16} className="teacher-member-detail-unified-action-icon" />
                        <div className="teacher-member-detail-unified-action-text">Chia sẻ điểm bài tập : Chỉ mình tôi</div>
                      </div>
                      <div className="teacher-member-detail-unified-action" onClick={handleRemove} style={{cursor:'pointer'}}>
                        <MdDeleteOutline size={16} className="teacher-member-detail-unified-action-icon" />
                        <div className="teacher-member-detail-unified-action-text">Xoá khỏi lớp</div>
                      </div>
                    </div>
                  </div>

                  <div className="teacher-member-detail-unified-section">
                    <div className="teacher-member-detail-unified-section-title">Thống kê học tập</div>
                    <div className="teacher-member-detail-unified-stats">
                      <div className="teacher-member-detail-unified-stat">
                        <div className="teacher-member-detail-unified-stat-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="teacher-member-detail-unified-stat-content">
                          <div className="teacher-member-detail-unified-stat-label">Số lần làm bài</div>
                          <div className="teacher-member-detail-unified-stat-value">{attemptsCount ?? '-'}</div>
                        </div>
                      </div>
                      <div className="teacher-member-detail-unified-stat">
                        <div className="teacher-member-detail-unified-stat-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="teacher-member-detail-unified-stat-content">
                          <div className="teacher-member-detail-unified-stat-label">Bài đã hoàn thành</div>
                          <div className="teacher-member-detail-unified-stat-value">{completedCount ?? '-'}</div>
                        </div>
                      </div>
                      <div className="teacher-member-detail-unified-stat">
                        <div className="teacher-member-detail-unified-stat-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="teacher-member-detail-unified-stat-content">
                          <div className="teacher-member-detail-unified-stat-label">Ngày tham gia</div>
                          <div className="teacher-member-detail-unified-stat-value">{joinedAt || '-'}</div>
                        </div>
                      </div>
                      <div className="teacher-member-detail-unified-stat">
                        <div className="teacher-member-detail-unified-stat-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="teacher-member-detail-unified-stat-content">
                          <div className="teacher-member-detail-unified-stat-label">Điểm cao nhất</div>
                          <div className="teacher-member-detail-unified-stat-value">{bestScore ?? '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="teacher-member-detail-assignments-col">
              <div className="teacher-member-detail-assignments-header-row">
                <div className="teacher-member-detail-assignments-title">Điểm bài tập</div>
                <div className="teacher-member-detail-assignments-filter-row">
                  <div className="teacher-member-detail-dropdown-container">
                    <div 
                      className="teacher-member-detail-dropdown-button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span>{filterOptions.find(opt => opt.value === selectedFilter)?.label}</span>
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className={`teacher-member-detail-dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`}
                      >
                        <path d="m7 10 5 5 5-5z" fill="currentColor"/>
                      </svg>
                    </div>
                    {isDropdownOpen && (
                      <div className="teacher-member-detail-dropdown-menu">
                        {filterOptions.map((option) => (
                          <div
                            key={option.value}
                            className={`teacher-member-detail-dropdown-item ${selectedFilter === option.value ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedFilter(option.value);
                              setIsDropdownOpen(false);
                              setPage(1);
                            }}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="teacher-member-detail-assignments-search-wrapper">
                    <input 
                      className="teacher-member-detail-assignments-search" 
                      placeholder="Tìm bài tập ..." 
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                    <MdSearch size={20} className="teacher-member-detail-assignments-search-icon" />
                  </div>
                </div>
              </div>
              <div className="teacher-member-detail-assignments-table-wrapper">
                <table className="teacher-member-detail-assignments-table">
                <thead>
                  <tr>
                    <th className="teacher-member-detail-th-title">
                      Tên bài tập
                    </th>
                    <th className="teacher-member-detail-th-date">
                      Ngày tạo
                    </th>
                    <th className="teacher-member-detail-th-member-score">
                      Điểm
                    </th>
                    <th className="teacher-member-detail-th-action">
                      <span className="teacher-member-detail-action-header-text"></span>
                    </th>
                  </tr>
                </thead>
                </table>
                <div className="teacher-member-detail-table-body-scroll">
                  <table className="teacher-member-detail-assignments-table">
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} style={{textAlign:'center'}}>Đang tải...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={4} style={{color:'red'}}>{String(error)}</td></tr>
                    ) : activities.length === 0 ? (
                      <tr><td colSpan={4} style={{textAlign:'center'}}>Không có dữ liệu</td></tr>
                    ) : (
                      activities.map((a, idx) => {
                        const type = a.type || a.kind || (a.quiz_id ? 'quizzes' : 'assignments');
                        const typeNorm = String(type).toLowerCase();
                        const title = a.title || a.name || a.quiz_title || a.assignment_title || '—';
                        const created = a.created_at || a.createdAt || a.assigned_at || '—';
                        const score = a.score_10 ?? a.normalized_score ?? a.score ?? null;
                        const status = a.status || (score == null ? 'Chưa làm' : 'Đã làm');
                        return (
                          <tr key={idx}>
                            <td className="teacher-member-detail-assignment-title-cell">
                              <div className="teacher-member-detail-assignment-row">
                                <span className="teacher-member-detail-assignment-type-icon">{(typeNorm === 'quiz' || type === 'quizzes') ? 'W' : 'W'}</span>
                                <div className="teacher-member-detail-assignment-title-group">
                                  <div className="teacher-member-detail-assignment-type-label">{(typeNorm === 'quiz' || type === 'quizzes') ? 'Bài kiểm tra' : 'Bài tập'}</div>
                                  <div className="teacher-member-detail-assignment-title-main">{title}</div>
                                </div>
                              </div>
                            </td>
                            <td className="teacher-member-detail-date-cell">{fmtDate(created)}</td>
                            <td className="teacher-member-detail-member-score-cell">
                              <span className="teacher-member-detail-member-score-value">{score != null ? fmtScore(score) : '-'}</span>
                            </td>
                            <td className="teacher-member-detail-action-cell">
                              {status === 'Chưa làm' ? (
                                <span className="teacher-member-detail-assignment-status">Chưa làm</span>
                              ) : (
                                <button
                                  className="teacher-member-detail-btn-detail"
                                  onClick={() => {
                                    try { console.log('🔎 Result click item:', { type, typeNorm, id: a?.id, memberId, classId }); } catch(_) {}
                                    if (type === 'quizzes' || typeNorm === 'quiz') {
                                      // Trang chi tiết kết quả học sinh cho quiz (giáo viên xem)
                                      navigate(`/teacher/class/${classId}/assignment/${a.id}/student/${memberId}`);
                                    } else {
                                      // Giữ nguyên hành vi hiện tại cho bài tập thường
                                      navigate(`/teacher/class/${classId}/members/${memberId}/score-detail`);
                                    }
                                  }}
                                >
                                  Chi tiết
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  </table>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0'}}>
                  <div>Tổng: {total}</div>
                  <div style={{display:'flex', gap:8}}>
                    <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Trang trước</button>
                    <span>Trang {page}</span>
                    <button disabled={(page*limit)>=total} onClick={() => setPage(p => p+1)}>Trang sau</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherMemberDetailPage; 