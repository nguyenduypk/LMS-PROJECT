import React, { useState, useRef, useEffect } from 'react';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import '../../styles/StudentDashboard.css';
import { api } from '../../utils/api';

function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('today-class');
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [badges, setBadges] = useState({ todaySchedulesCount: 0, pendingAssignmentsCount: 0, unreadMaterialsCount: 0, unseenLecturesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create refs for each section
  const sectionRefs = {
    'today-class': useRef(null),
    'homework': useRef(null),
    'documents': useRef(null),
    'lectures': useRef(null),
    'achievements': useRef(null),
  };

  // Function to scroll to a section
  const scrollToSection = (sectionId) => {
    const ref = sectionRefs[sectionId];
    if (ref && ref.current) {
      // Scroll section lên ngay dưới header (offset đúng với header thực tế, ví dụ 65px)
      const HEADER_HEIGHT = 65;
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await api.student.getDashboard();
        if (!mounted) return;
        setTodaySchedules(data?.todaySchedules || []);
        setPendingQuizzes(data?.pendingQuizzes || []);
        setRecentDocuments(data?.recentDocuments || []);
        setBadges(data?.badges || { todaySchedulesCount: 0, pendingAssignmentsCount: 0, unreadMaterialsCount: 0, unseenLecturesCount: 0 });
      } catch (e) {
        setError(e?.message || 'Không thể tải dữ liệu bảng điều khiển');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <DashboardHeader />
      <div className="sd-dashboard-layout">
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={scrollToSection}
          todayClassCount={badges.todaySchedulesCount || todaySchedules.length}
          homeworkCount={badges.pendingAssignmentsCount || pendingQuizzes.length}
          unreadDocs={badges.unreadMaterialsCount || recentDocuments.length}
          unseenLectures={badges.unseenLecturesCount || 0}
        />
        <div className="sd-dashboard-main">
          <div className="sd-dashboard-blocks">
            {/* Phòng học hôm nay */}
            <div ref={sectionRefs['today-class']}>
              <h3 className="sd-block-title-outside">
                Phòng học hôm nay • {todaySchedules.length}
              </h3>
              <section className="sd-dashboard-block" id="today-class">
                <div className="sd-dashboard-block-content">
                  {loading ? (
                    <div className="sd-dashboard-empty">Đang tải...</div>
                  ) : todaySchedules.length === 0 ? (
                    <div className="sd-dashboard-empty">Không có buổi học nào diễn ra hôm nay</div>
                  ) : (
                    <div className="sd-table-container">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Thời gian</th>
                            <th>Tên phòng học</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todaySchedules.map((sc, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600', color: '#1976d2' }}>
                                {(sc?.start_time || '').toString().slice(0,5)}
                              </td>
                              <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>🏫</span>
                                {sc?.class_name || 'Phòng học'}
                              </td>
                              <td style={{ color: '#d32f2f', fontWeight: '500' }}>
                                {sc?.teacher_name ? `GV: ${sc.teacher_name}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Bài tập chưa nộp */}
            <div ref={sectionRefs['homework']}>
              <h3 className="sd-block-title-outside">
                Bài tập chưa nộp • {pendingQuizzes.length}
              </h3>
              <section className="sd-dashboard-block" id="homework">
                <div className="sd-dashboard-block-content">
                  {loading ? (
                    <div className="sd-dashboard-empty">Đang tải...</div>
                  ) : pendingQuizzes.length === 0 ? (
                    <div className="sd-dashboard-empty">Không có bài tập nào</div>
                  ) : (
                    <div className="sd-table-container">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Tên bài tập</th>
                            <th>Lớp</th>
                            <th>Hạn chót</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingQuizzes.map((qa, idx) => (
                            <tr key={idx}>
                              <td>
                                <div className="sd-assignment-name">
                                  <span className="sd-file-icon">W</span>
                                  {qa?.title || 'Bài tập'}
                                  <div className="sd-assignment-status">{qa?.in_progress_attempt_id ? 'Đang làm' : 'Chưa làm'}</div>
                                </div>
                              </td>
                              <td>{qa?.class_name || '-'}</td>
                              <td>{qa?.deadline ? new Date(qa.deadline).toLocaleString() : 'Không có'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Tài liệu chưa đọc */}
            <div ref={sectionRefs['documents']}>
              <h3 className="sd-block-title-outside">
                Tài liệu gần đây • {recentDocuments.length}
              </h3>
              <section className="sd-dashboard-block" id="documents">
                <div className="sd-dashboard-block-content">
                  {loading ? (
                    <div className="sd-dashboard-empty">Đang tải...</div>
                  ) : recentDocuments.length === 0 ? (
                    <div className="sd-dashboard-empty">Không có tài liệu nào</div>
                  ) : (
                    <div className="sd-table-container">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Tên tài liệu</th>
                            <th>Lớp</th>
                            <th>Ngày đăng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentDocuments.map((doc, idx) => (
                            <tr key={idx}>
                              <td>
                                <div className="sd-assignment-name">
                                  <span className="sd-file-icon">W</span>
                                  {doc?.original_name || doc?.title || 'Tài liệu'}
                                </div>
                              </td>
                              <td>{doc?.class_name || '-'}</td>
                              <td>{doc?.created_at ? new Date(doc.created_at).toLocaleString() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Bài giảng chưa xem */}
            <div ref={sectionRefs['lectures']}>
              <h3 className="sd-block-title-outside">
                Bài giảng chưa xem • 0
              </h3>
              <section className="sd-dashboard-block" id="lectures">
                <div className="sd-dashboard-block-content">
                  {true ? (
                    <div className="sd-dashboard-empty">Không có bài giảng nào</div>
                  ) : (
                    <div className="sd-table-container">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Tên bài giảng</th>
                            <th>Lớp</th>
                            <th>Ngày đăng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[]}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Thành tích học tập */}
            <div ref={sectionRefs['achievements']}>
              <h3 className="sd-block-title-outside">
                Thành tích học tập • {badges.todaySchedulesCount}
              </h3>
              <section className="sd-dashboard-block" id="achievements">
                <div className="sd-dashboard-block-content">
                  {badges.todaySchedulesCount === 0 ? (
                    <div className="sd-dashboard-empty">Chưa có dữ liệu thành tích</div>
                  ) : (
                    <div className="sd-table-container">
                      <table className="sd-table">
                        <thead>
                          <tr>
                            <th>Tên lớp</th>
                            <th>Giáo viên</th>
                            <th>ĐTB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todaySchedules.map((sc, idx) => (
                            <tr key={idx}>
                              <td>{sc.class_name}</td>
                              <td>{sc.teacher_name}</td>
                              <td>{sc.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;