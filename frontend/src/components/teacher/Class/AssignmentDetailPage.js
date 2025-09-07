import React, { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Header';
import TeacherSidebar from './TeacherSidebar';
import './AssignmentDetailPage.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { 
  MdSearch, 
  MdPrint,
  MdRefresh,
  MdExpandMore,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdArrowForward
} from 'react-icons/md';
import { api } from '../../../utils/api';

function AssignmentDetailPage({ classInfo }) {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const safeClassName = classInfo?.name || 'Lớp học';
  const safeClassCode = classInfo?.code ? ` (${classInfo.code})` : '';

  // States
  const [filter, setFilter] = useState('all'); // 'all', 'notDone', 'submitted'
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('grades'); // 'grades', 'overview', 'questionStats', 'assignment', 'solution'
  // Overview states
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  // Assignment title for breadcrumb (real data)
  const [assignmentTitle, setAssignmentTitle] = useState('Bài tập');
  
  // State dữ liệu thật
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length === 1) return words[0][0]?.toUpperCase() || '';
    return ((words[words.length - 2][0] || '') + (words[words.length - 1][0] || '')).toUpperCase();
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        // 1) Lấy members trước
        const membersRes = await api.classes.getMembers(classId);
        const members = (membersRes?.members || []).filter(m => m.role === 'student');
        console.debug('[AssignmentDetailPage] members', { total: (membersRes?.members || []).length, students: members.length });

        // 2) Gọi song song: quiz details, submissions, assignment meta (để lấy title)
        const [quizCheck, submissionsRes, assignmentMeta] = await Promise.all([
          (async () => {
            try { return await api.assignments.getQuizDetails(assignmentId); } catch (e) { return { ok: false, status: 0 }; }
          })(),
          (async () => {
            try { return await api.assignments.getSubmissions(assignmentId); } catch (e) { return []; }
          })(),
          (async () => {
            try { return await api.assignments.getById(assignmentId); } catch (e) { return null; }
          })()
        ]);
        console.debug('[AssignmentDetailPage] quizCheck', { ok: quizCheck?.ok, status: quizCheck?.status });
        const submissions = Array.isArray(submissionsRes) ? submissionsRes : [];
        console.debug('[AssignmentDetailPage] submissions (original)', { count: submissions.length });
        const metaTitle = assignmentMeta?.title || assignmentMeta?.name || assignmentMeta?.data?.title;
        if (metaTitle && isMounted) setAssignmentTitle(metaTitle);
        // Ưu tiên dùng title từ quiz details nếu có
        const quizTitle = quizCheck?.data?.title || quizCheck?.data?.quiz?.title;
        if (quizCheck?.ok && quizTitle && isMounted) setAssignmentTitle(quizTitle);
        // Fallback: nếu vẫn chưa có tiêu đề, lấy từ danh sách quiz theo lớp
        if (isMounted) {
          const currentTitle = quizTitle || metaTitle;
          if (!currentTitle) {
            try {
              const list = await api.quiz.listByClass(classId);
              const found = Array.isArray(list) ? list.find(q => String(q.id) === String(assignmentId)) : null;
              if (found?.title) setAssignmentTitle(found.title);
            } catch (_) {}
          }
        }

        // 3) Xác định quiz
        let isQuiz = !!quizCheck?.ok;
        if (!isQuiz && submissions.length === 0 && members.length > 0) {
          // Probe nhanh 1-3 học sinh để phát hiện quiz ngay cả khi details bị 500
          const sample = members.slice(0, Math.min(3, members.length));
          const probe = await Promise.allSettled(sample.map(async (m) => {
            const r = await api.assignments.getQuizStudentDetails(assignmentId, m.id);
            console.debug('[AssignmentDetailPage] probe quiz student details', { studentId: m.id, status: r?.status, ok: r?.ok });
            return r?.ok === true;
          }));
          isQuiz = probe.some(p => p.status === 'fulfilled' && p.value === true);
          console.debug('[AssignmentDetailPage] probe result isQuiz', isQuiz);
        }

        const formatMinutes = (mins) => {
          const n = Number(mins || 0);
          if (!Number.isFinite(n) || n <= 0) return '0m';
          const h = Math.floor(n / 60);
          const m = Math.floor(n % 60);
          return h > 0 ? `${h}h${m}m` : `${m}m`;
        };

        if (isQuiz) {
          // Quiz: lấy chi tiết từng học sinh
          const perStudent = await Promise.allSettled(
            members.map(async (m) => {
              const displayName = m.full_name || m.username || 'Học sinh';
              try {
                const details = await api.assignments.getQuizStudentDetails(assignmentId, m.id);
                console.debug('[AssignmentDetailPage] quiz student details', { studentId: m.id, status: details?.status, ok: details?.ok });
                const payload = details?.data || {};
                const attempt = payload.attempt || null;
                const attempts = payload.attempts || [];
                const hasSubmitted = attempt?.status === 'submitted' || attempts.some(a => a.status === 'submitted');
                if (hasSubmitted) {
                  const subAt = attempt?.submitted_at || (attempts.find(a => a.status === 'submitted')?.submitted_at);
                  console.debug('[AssignmentDetailPage] submitted', { studentId: m.id, submitted_at: subAt, score: attempt?.total_score, time_spent: attempt?.time_spent });
                }
                return {
                  id: m.id,
                  name: displayName,
                  initials: getInitials(displayName),
                  completed: 0,
                  total: 0,
                  score: Number(attempt?.total_score || 0),
                  duration: formatMinutes(attempt?.time_spent || 0),
                  submissionDate: attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : '--',
                  leaveCount: String(attempt?.leave_count ?? '--'),
                  status: hasSubmitted ? 'submitted' : 'notDone'
                };
              } catch (_e) {
                return {
                  id: m.id,
                  name: displayName,
                  initials: getInitials(displayName),
                  completed: 0,
                  total: 0,
                  score: 0,
                  duration: '0m',
                  submissionDate: '--',
                  leaveCount: '--',
                  status: 'notDone'
                };
              }
            })
          );
          const studentsData = perStudent.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
          if (isMounted) setStudents(studentsData);
        } else {
          // Assignment thường: dùng submissions
          const studentsData = members.map(m => {
            const sub = submissions.find(s => Number(s.student_id) === Number(m.id));
            const displayName = m.full_name || m.username || 'Học sinh';
            if (sub) {
              return {
                id: m.id,
                name: displayName,
                initials: getInitials(displayName),
                completed: 0,
                total: 0,
                score: 0,
                duration: '0m',
                submissionDate: sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '--',
                leaveCount: '--',
                status: 'submitted'
              };
            }
            return {
              id: m.id,
              name: displayName,
              initials: getInitials(displayName),
              completed: 0,
              total: 0,
              score: 0,
              duration: '0m',
              submissionDate: '--',
              leaveCount: '--',
              status: 'notDone'
            };
          });
          if (isMounted) setStudents(studentsData);
        }
      } catch (e) {
        if (isMounted) setError(e?.message || 'Lỗi tải dữ liệu');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [classId, assignmentId]);

  // Load overview when tab active
  useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      if (activeTab !== 'overview') return;
      if (overviewLoading) return;
      setOverviewError('');
      setOverviewLoading(true);
      try {
        const res = await api.assignments.getQuizOverview(assignmentId);
        if (!res?.ok) {
          const msg = res?.data?.message || `HTTP ${res?.status || ''}`.trim();
          throw new Error(msg || 'Không thể tải tổng quan');
        }
        const data = res.data || {};
        // Normalize buckets to <=1..<=10
        const bucketLabels = Array.from({ length: 10 }, (_, i) => `<=${i + 1}`);
        const bucketMap = new Map((data?.distribution?.buckets || []).map(b => [String(b.label), Number(b.count || 0)]));
        const totalStudents = Number(data?.totals?.total_students || 0);
        const doneStudents = Number(data?.totals?.done_students || 0);
        const normalized = bucketLabels.map(lbl => {
          const count = Number(bucketMap.get(lbl) || 0);
          const denom = doneStudents > 0 ? doneStudents : totalStudents > 0 ? totalStudents : 0;
          const pct = denom > 0 ? Math.round((count / denom) * 100) : 0;
          return { label: lbl, count, percent: pct };
        });
        const chart = normalized.map(x => ({ x: x.label, y: x.count }));
        const next = {
          quiz: data?.quiz || {},
          totals: { totalStudents, doneStudents },
          distribution: { buckets: normalized, chart },
          stats: {
            average: Number(data?.stats?.average ?? 0),
            highest: Number(data?.stats?.highest ?? 0),
            lowest: Number(data?.stats?.lowest ?? 0)
          }
        };
        if (isMounted) setOverview(next);
      } catch (e) {
        if (isMounted) setOverviewError(e?.message || 'Lỗi tải tổng quan');
      } finally {
        if (isMounted) setOverviewLoading(false);
      }
    }
    loadOverview();
    return () => { isMounted = false; };
  }, [activeTab, assignmentId]);

  // Fallback: if overview has quiz.title and current title is default, use it
  useEffect(() => {
    if (overview?.quiz?.title && (assignmentTitle === 'Bài tập' || !assignmentTitle)) {
      setAssignmentTitle(overview.quiz.title);
    }
  }, [overview]);

  // Filter and search logic
  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === 'all' || student.status === filter;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sorting logic
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'score':
        comparison = a.score - b.score;
        break;
      case 'duration':
        comparison = parseInt(a.duration) - parseInt(b.duration);
        break;
      case 'submissionDate':
        comparison = new Date(a.submissionDate) - new Date(b.submissionDate);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === sortedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(sortedStudents.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleViewDetails = (studentId) => {
    navigate(`/teacher/class/${classId}/assignment/${assignmentId}/student/${studentId}`);
  };

  // getInitials đã được định nghĩa phía trên để dùng trong useEffect

  const renderTabContent = () => {
    switch (activeTab) {
      case 'grades':
        return (
          <>
            {/* Toolbar */}
            <div className="teacher-assignment-detail-page__toolbar">
              <div className="teacher-assignment-detail-page__filters">
                <button 
                  className={`teacher-assignment-detail-page__filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Tất cả
                </button>
                <button 
                  className={`teacher-assignment-detail-page__filter-btn ${filter === 'notDone' ? 'active' : ''}`}
                  onClick={() => setFilter('notDone')}
                >
                  Chưa làm
                </button>

                <button 
                  className={`teacher-assignment-detail-page__filter-btn ${filter === 'submitted' ? 'active' : ''}`}
                  onClick={() => setFilter('submitted')}
                >
                  Đã nộp
                </button>
              </div>

              <div className="teacher-assignment-detail-page__search">
                <MdSearch className="teacher-assignment-detail-page__search-icon" />
                <input
                  type="text"
                  placeholder="Nhập để tìm kiếm"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="teacher-assignment-detail-page__search-input"
                />
              </div>

              <button className="teacher-assignment-detail-page__print-btn">
                <MdPrint />
              </button>
            </div>

            {/* Table */}
            <div className="teacher-assignment-detail-page__table-container">
              {loading && (
                <div style={{ padding: '12px' }}>Đang tải dữ liệu...</div>
              )}
              {!!error && !loading && (
                <div style={{ padding: '12px', color: 'red' }}>{error}</div>
              )}
              <table className="teacher-assignment-detail-page__table">
                <thead>
                  <tr>
                    <th>
                      <MdCheckBoxOutlineBlank 
                        className="teacher-assignment-detail-page__select-all"
                        onClick={handleSelectAll}
                      />
                    </th>
                    <th>#</th>
                    <th onClick={() => handleSort('name')} className="teacher-assignment-detail-page__sortable">
                      Họ và tên {getSortIcon('name')}
                    </th>
                    <th>Đã làm</th>
                    <th onClick={() => handleSort('score')} className="teacher-assignment-detail-page__sortable">
                      Điểm {getSortIcon('score')}
                    </th>
                    <th onClick={() => handleSort('duration')} className="teacher-assignment-detail-page__sortable">
                      Thời lượng {getSortIcon('duration')}
                    </th>
                    <th onClick={() => handleSort('submissionDate')} className="teacher-assignment-detail-page__sortable">
                      Ngày nộp {getSortIcon('submissionDate')}
                    </th>
                    <th>Rời khỏi</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>
                        <MdCheckBoxOutlineBlank 
                          className="teacher-assignment-detail-page__select-checkbox"
                          onClick={() => handleSelectStudent(student.id)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <div className="teacher-assignment-detail-page__student-info">
                          <div className="teacher-assignment-detail-page__student-avatar">
                            {student.initials}
                          </div>
                          <span className="teacher-assignment-detail-page__student-name">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td>{student.completed}/{student.total}</td>
                      <td className="teacher-assignment-detail-page__score">{Number(student.score || 0).toFixed(2)}</td>
                      <td>{student.duration}</td>
                      <td>{student.submissionDate}</td>
                      <td>{student.leaveCount}</td>
                      <td>
                        <div className="teacher-assignment-detail-page__actions">
                          <button 
                            className="teacher-assignment-detail-page__refresh-btn"
                            title="Đặt lại kết quả"
                          >
                            <MdRefresh />
                          </button>
                          <button 
                            className="teacher-assignment-detail-page__details-btn"
                            onClick={() => handleViewDetails(student.id)}
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      case 'overview':
        // Hiển thị dữ liệu thật
        return (
          <div className="teacher-assignment-detail-page__overview">
            <h3>Bảng phân bố điểm</h3>
            {overviewLoading && (
              <div style={{ padding: '8px 0' }}>Đang tải tổng quan...</div>
            )}
            {!!overviewError && !overviewLoading && (
              <div style={{ padding: '8px 0', color: 'red' }}>{overviewError}</div>
            )}
            {!overviewLoading && !overviewError && overview && (
              <>
            <div className="score-distribution-table-container">
              <table className="score-distribution-table">
                <thead>
                  <tr>
                    <th rowSpan="2">Số học sinh</th>
                    <th rowSpan="2">Đã làm</th>
                    {overview.distribution.buckets.map((item, idx) => (
                      <th key={item.label} colSpan="2">{item.label}</th>
                    ))}
                  </tr>
                  <tr>
                    {overview.distribution.buckets.map((item, idx) => (
                      <React.Fragment key={`hdr-${item.label}`}>
                        <th>SL</th>
                        <th>%</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{overview.totals.totalStudents}</td>
                    <td>{overview.totals.doneStudents}</td>
                    {overview.distribution.buckets.map((item, idx) => (
                      <React.Fragment key={`row-${item.label}`}>
                        <td>{item.count}</td>
                        <td>{item.percent}</td>
                      </React.Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="score-distribution-chart-container">
              <h4 className="score-distribution-chart-title">Biểu đồ phân bố điểm</h4>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={overview.distribution.buckets} margin={{ top: 16, right: 24, left: 8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 13 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                  <Tooltip formatter={(value) => `${value} học sinh`} />
                  <Legend />
                  <Bar dataKey="count" name="Số lượng học sinh" fill="#2196f3" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </>
            )}
          </div>
        );
      case 'assignment':
        return (
          <div className="teacher-assignment-detail-page__assignment" style={{ 
            position: 'relative', 
            boxShadow: '0 2px 16px rgba(30,136,229,0.10)', 
            background: '#fff', 
            padding: 0, 
            width: '100%', 
            height: '100%', 
            maxWidth: '100%', 
            minHeight: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            margin: 0, 
            borderRadius: 0 
          }}>
            <div style={{ 
              position: 'relative', 
              flex: '1 1 0%',
              height: 'calc(100vh - 180px)',
              overflow: 'hidden',
              padding: '4px'
            }}>
              <div style={{ 
                height: '100%', 
                width: '100%', 
                overflow: 'hidden' 
              }}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'center', 
                  flexDirection: 'column', 
                  position: 'relative' 
                }}>
                  <iframe 
                    src="https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fshub-storage.shub.edu.vn%2Ftests%2F3303522%2Ffile_url%2F1752742804570_De_trac_nghiem_Toan_Lop_1.docx"
                    style={{ 
                      display: 'block', 
                      height: '100%', 
                      width: '100%',
                      border: 'none',
                      maxHeight: 'calc(100vh - 200px)'
                    }}
                    title="Đề bài"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="teacher-assignment-detail-page">
      <Header />
      <div className="teacher-assignment-detail-page__content">
        <TeacherSidebar classInfo={classInfo} />
        
        {/* Main Content Area */}
        <div className="teacher-assignment-detail-page__main">
          {/* Header Content */}
          <div className="teacher-assignment-detail-page__header">
            <div className="teacher-assignment-detail-page__header-content">
              {/* Class Title */}
              <div className="teacher-assignment-detail-page__class-title">
                <h2>{safeClassName}{safeClassCode}</h2>
              </div>
              
              {/* Header Row */}
              <div className="teacher-assignment-detail-page__header-row">
                {/* Breadcrumb */}
                <div className="teacher-assignment-detail-page__breadcrumb">
                  <span 
                    className="teacher-assignment-detail-page__breadcrumb-item"
                    onClick={() => navigate(`/teacher/class/${classId}/assignments`)}
                    style={{ cursor: 'pointer' }}
                  >
                    Bài tập
                  </span>
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
                  <span className="teacher-assignment-detail-page__breadcrumb-item active">{assignmentTitle}</span>
                </div>

                {/* Tabs Navigation */}
                <div className="teacher-assignment-detail-page__tabs">
                  <button 
                    className={`teacher-assignment-page__filter-btn${activeTab === 'grades' ? ' active' : ''}`}
                    onClick={() => setActiveTab('grades')}
                  >
                    Bảng điểm
                  </button>
                  <button 
                    className={`teacher-assignment-page__filter-btn${activeTab === 'overview' ? ' active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Tổng quan
                  </button>
                  <button 
                    className={`teacher-assignment-page__filter-btn${activeTab === 'assignment' ? ' active' : ''}`}
                    onClick={() => setActiveTab('assignment')}
                  >
                    Đề bài
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default AssignmentDetailPage; 