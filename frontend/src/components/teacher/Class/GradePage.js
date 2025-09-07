import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header';
import TeacherSidebar from './TeacherSidebar';
import './GradePage.css';
// API base for backend
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function GradePage({ classInfo }) {
  const { classId } = useParams();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [columns, setColumns] = useState([]);
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = sessionStorage.getItem('token');
        const resp = await fetch(`${API_BASE}/api/grades/class/${classId}/gradebook`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(t || `Request failed (${resp.status})`);
        }
        const data = await resp.json();
        if (!isMounted) return;
        setColumns(Array.isArray(data.columns) ? data.columns : []);
        setStudents(Array.isArray(data.students) ? data.students : []);
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setStats(data.stats || null);
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || 'Lỗi khi tải bảng điểm');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (classId) fetchData();
    return () => { isMounted = false; };
  }, [classId]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setQuery(search);
    }
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
    if (sortBy !== field) return '';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getScoreColor = (score, maxScore) => {
    return '#222'; // Màu đen giống text họ và tên
  };

  // Build class stats from API (backend uses snake_case)
  const classStats = {
    totalStudents: stats?.total_students ?? 0,
    averageScore: stats?.class_average ?? 0,
    highestScore: stats?.highest ?? 0,
    lowestScore: stats?.lowest ?? 0,
  };

  // Filtered columns (tests -> only quizzes)
  const filteredColumns = columns.filter(col => {
    if (filter === 'tests') return col.type === 'quiz' || col.type === 'test';
    return true;
  });

  // Build rows with student names and apply search/sort (backend row has full_name, student_id)
  let sorted = rows.map(r => ({
    ...r,
    studentName: r.full_name || '—',
    studentId: r.student_id,
  }));

  if (query) {
    const q = query.toLowerCase();
    sorted = sorted.filter(r => r.studentName.toLowerCase().includes(q));
  }

  sorted.sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'name':
        aValue = a.studentName;
        bValue = b.studentName;
        break;
      case 'average':
        aValue = a.average ?? 0;
        bValue = b.average ?? 0;
        break;
      default:
        aValue = a.studentName;
        bValue = b.studentName;
    }
    if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  return (
    <div className="teacher-grade-page">
      <Header />
      <div className="teacher-grade-page__content">
        <TeacherSidebar classInfo={classInfo} />
        
        {/* Header "Bảng điểm lớp học" */}
        <div className="teacher-grade-page__header">
          <h1 className="teacher-grade-page__title">Bảng điểm lớp học</h1>
        </div>

        {/* Main Content Area */}
        <div className="teacher-grade-page__main">
          {loading && (
            <div className="teacher-grade-loading">Đang tải bảng điểm...</div>
          )}
          {error && !loading && (
            <div className="teacher-grade-error">{error}</div>
          )}
          {!loading && !error && (
            <>
              {/* Toolbar */}
              <div className="teacher-grade-page__toolbar">
                <div className="teacher-grade-toolbar__search">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm học sinh..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={handleSearch}
                  />
                </div>
                  
                <div className="teacher-grade-toolbar__sort-container">
                  <div 
                    className="teacher-grade-toolbar__sort-button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  >
                    <span>{filter === 'all' ? 'Tất cả bài tập' : 'Bài kiểm tra'}</span>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className={`teacher-grade-toolbar__sort-arrow ${isSortDropdownOpen ? 'rotated' : ''}`}
                    >
                      <path d="m7 10 5 5 5-5z" fill="currentColor"/>
                    </svg>
                  </div>
                  {isSortDropdownOpen && (
                    <div className="teacher-grade-toolbar__sort-menu">
                      <div 
                        className={`teacher-grade-toolbar__sort-item ${filter === 'all' ? 'selected' : ''}`}
                        onClick={() => {
                          setFilter('all');
                          setIsSortDropdownOpen(false);
                        }}
                      >
                        Tất cả bài tập
                      </div>
                      <div 
                        className={`teacher-grade-toolbar__sort-item ${filter === 'tests' ? 'selected' : ''}`}
                        onClick={() => {
                          setFilter('tests');
                          setIsSortDropdownOpen(false);
                        }}
                      >
                        Bài kiểm tra
                      </div>

                    </div>
                  )}
                </div>
                  
                {/* Nút xuất đã được gỡ bỏ theo yêu cầu */}
              </div>

              {/* Thống kê tổng quan */}
              <div className="teacher-grade-stats">
                <div className="teacher-grade-stat-card">
                  <div className="teacher-grade-stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 9.5V4c0-.55-.45-1-1-1s-1 .45-1 1v5.5l-.99-1.51C10.54 8.37 9.8 8 9 8H7.46c-.8 0-1.54.37-2.01.99L3 14.5V22h2v-6h2.5l2.54-7.63A1.5 1.5 0 0 1 11.54 10H13c.8 0 1.54-.37 2.01-.99L16 7.5V22h2v-6h2z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="teacher-grade-stat-content">
                    <div className="teacher-grade-stat-value">{classStats.totalStudents}</div>
                    <div className="teacher-grade-stat-label">Tổng học sinh</div>
                  </div>
                </div>
                <div className="teacher-grade-stat-card">
                  <div className="teacher-grade-stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 17H5V21H9V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 3H9V21H13V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 7H15V21H19V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="teacher-grade-stat-content">
                    <div className="teacher-grade-stat-value">{classStats.averageScore}</div>
                    <div className="teacher-grade-stat-label">Điểm trung bình</div>
                  </div>
                </div>
                <div className="teacher-grade-stat-card">
                  <div className="teacher-grade-stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 14l5-5 5 5z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="teacher-grade-stat-content">
                    <div className="teacher-grade-stat-value">{classStats.highestScore}</div>
                    <div className="teacher-grade-stat-label">Điểm cao nhất</div>
                  </div>
                </div>
                <div className="teacher-grade-stat-card">
                  <div className="teacher-grade-stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="teacher-grade-stat-content">
                    <div className="teacher-grade-stat-value">{classStats.lowestScore}</div>
                    <div className="teacher-grade-stat-label">Điểm thấp nhất</div>
                  </div>
                </div>
              </div>

              {/* Grade Table */}
              <div className="teacher-grade-page__list-container">
                <table className="teacher-grade-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')} style={{cursor: 'pointer'}}>
                        Họ và tên {getSortIcon('name')}
                      </th>
                      <th onClick={() => handleSort('average')} style={{cursor: 'pointer'}}>
                        Trung bình {getSortIcon('average')}
                      </th>
                      {filteredColumns.map((col) => (
                        <th key={col.key || col.id} style={{cursor: 'pointer'}}>
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row) => (
                      <tr key={row.student_id}>
                        <td>
                          <span className="teacher-grade-student-name">{row.full_name}</span>
                        </td>
                        <td>
                          <div className="teacher-grade-average-score">
                            <span className="teacher-grade-average-value">{(row.average ?? 0).toFixed ? (row.average ?? 0).toFixed(1) : row.average}</span>
                          </div>
                        </td>
                        {filteredColumns.map((col) => {
                          const idx = col.key || col.id;
                          const val = row.scores ? (row.scores[idx] ?? null) : null;
                          return (
                            <td key={col.key || col.id}>
                              <div className="teacher-grade-score-cell">
                                <span 
                                  className="teacher-grade-score-value"
                                  style={{color: getScoreColor(val ?? 0, 10)}}
                                >
                                  {val === null || val === undefined ? '-' : val}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GradePage;