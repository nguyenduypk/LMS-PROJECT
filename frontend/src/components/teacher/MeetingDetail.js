import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./MeetingDetail.css";
import { api } from "../../utils/api";

const MeetingDetail = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("checked"); // "checked" hoặc "notchecked"
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Fetch schedule data and students
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching schedule data for meeting ID:', meetingId);
        
        // Fetch schedule details and attendance data
        const attendanceResponse = await api.attendance.getBySchedule(meetingId);
        console.log('📊 Attendance response:', attendanceResponse);
        
        if (attendanceResponse.success) {
          setScheduleData(attendanceResponse.schedule);
          
          // Transform attendance data to students format
          const studentsWithAttendance = attendanceResponse.attendance.map(record => ({
            id: record.id,
            name: record.name,
            class: record.email.split('@')[0] || 'N/A', // Fallback class name
            checked: record.checked,
            time: record.checkInTime ? new Date(record.checkInTime).toLocaleString('vi-VN') : null,
            status: record.status,
            notes: record.notes
          }));
          
          setStudents(studentsWithAttendance);
        } else {
          console.error('❌ API Error:', attendanceResponse.message);
          setError(attendanceResponse.message || 'Không tìm thấy thông tin lịch học');
          
          // Fallback to stable mock data khi API lỗi
          setScheduleData({
            id: meetingId,
            class_name: 'Lớp mẫu',
            subject: 'Môn học mẫu',
            room: 'Phòng A101',
            start_time: '07:00',
            end_time: '08:30',
            day_of_week: 'monday',
            type: 'offline'
          });
          
          setStudents([
            { id: 1, name: "Nguyễn Khánh Dương Duy", class: "22DTH2C", checked: true, time: "1 tháng 8 lúc 12:42" },
            { id: 2, name: "Trần Thị B", class: "22DTH2C", checked: true, time: "1 tháng 8 lúc 12:45" },
            { id: 3, name: "Lê Văn C", class: "22DTH2C", checked: false },
            { id: 4, name: "Phạm Thị D", class: "22DTH2C", checked: true, time: "1 tháng 8 lúc 12:50" },
            { id: 5, name: "Hoàng Văn E", class: "22DTH2C", checked: false },
          ]);
        }
      } catch (error) {
        console.error('❌ Error fetching schedule data:', error);
        setError('Lỗi khi tải dữ liệu: ' + (error.message || 'Không thể kết nối đến server'));
        
        // Fallback to stable mock data
        setScheduleData({
          id: meetingId,
          class_name: 'Lớp mẫu',
          subject: 'Môn học mẫu',
          room: 'Phòng A101',
          start_time: '07:00',
          end_time: '08:30',
          day_of_week: 'monday',
          type: 'offline'
        });
        
        setStudents([
          { id: 1, name: "Nguyễn Khánh Dương Duy", class: "22DTH2C", checked: true, time: "1 tháng 8 lúc 12:42" },
          { id: 2, name: "Trần Thị B", class: "22DTH2C", checked: true, time: "1 tháng 8 lúc 12:45" },
          { id: 3, name: "Lê Văn C", class: "22DTH2C", checked: false },
          { id: 4, name: "Phạm Thị D", class: "22DTH2C", checked: true, time: "1 tháng 8 lúc 12:50" },
          { id: 5, name: "Hoàng Văn E", class: "22DTH2C", checked: false },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      fetchScheduleData();
    }
  }, [meetingId]);

  // Debounce search term để tránh re-render liên tục
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Tối ưu performance với useMemo
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           student.class.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      if (activeTab === "checked") {
        return student.checked && matchesSearch;
      } else {
        return !student.checked && matchesSearch;
      }
    });
  }, [students, debouncedSearchTerm, activeTab]);

  const checkedCount = useMemo(() => students.filter(s => s.checked).length, [students]);
  const notCheckedCount = useMemo(() => students.filter(s => !s.checked).length, [students]);

  // Reset selectedStudents khi chuyển tab để tránh nhầm lẫn
  useEffect(() => {
    setSelectedStudents([]);
  }, [activeTab]);

  // Xử lý chọn/bỏ chọn học sinh
  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Xử lý chọn tất cả
  const handleSelectAll = () => {
    // Kiểm tra xem tất cả học sinh trong danh sách lọc có được chọn chưa
    const allSelected = filteredStudents.every(student => selectedStudents.includes(student.id));
    
    if (allSelected) {
      // Nếu tất cả đã được chọn thì bỏ chọn tất cả
      setSelectedStudents([]);
    } else {
      // Nếu chưa tất cả được chọn thì chọn tất cả
      const allFilteredStudentIds = filteredStudents.map(s => s.id);
      setSelectedStudents(allFilteredStudentIds);
    }
  };

  // Kiểm tra xem tất cả học sinh trong danh sách lọc có được chọn không
  const areAllFilteredStudentsSelected = filteredStudents.length > 0 && 
    filteredStudents.every(student => selectedStudents.includes(student.id));

  // Kiểm tra xem có học sinh nào được chọn không
  const areSomeStudentsSelected = selectedStudents.length > 0;

  // Debug: Log thông tin về trạng thái chọn (chỉ khi có thay đổi đáng kể)
  useEffect(() => {
    // Chỉ log khi có thay đổi lớn hoặc lần đầu load
    if (filteredStudents.length > 0 && selectedStudents.length > 0) {
      console.log('🔍 Debug - Trạng thái chọn:', {
        filteredCount: filteredStudents.length,
        selectedCount: selectedStudents.length,
        allSelected: areAllFilteredStudentsSelected,
        hasSelection: areSomeStudentsSelected
      });
    }
  }, [filteredStudents.length, selectedStudents.length, areAllFilteredStudentsSelected, areSomeStudentsSelected]);

  // Xử lý điểm danh/hủy điểm danh
  const handleAttendanceAction = async () => {
    // Validation: Kiểm tra xem có học sinh nào được chọn không
    if (selectedStudents.length === 0) {
      alert('Vui lòng chọn ít nhất một học sinh để thực hiện thao tác!');
      return;
    }

    // Debug: Log thông tin trước khi thực hiện
    console.log('🔍 Debug - Trước khi thực hiện:');
    console.log('  - Số học sinh được chọn:', selectedStudents.length);
    console.log('  - Danh sách học sinh được chọn:', selectedStudents);
    console.log('  - Tab hiện tại:', activeTab);
    console.log('  - Tổng số học sinh:', students.length);
    console.log('  - Số học sinh đã điểm danh:', students.filter(s => s.checked).length);

    try {
      if (activeTab === "checked") {
        // Hủy điểm danh
        console.log('🔄 Hủy điểm danh cho:', selectedStudents);
        
        const response = await api.attendance.unmark(meetingId, selectedStudents);
        
        if (response.success) {
          // Cập nhật trạng thái local
          setStudents(prevStudents => 
            prevStudents.map(student => 
              selectedStudents.includes(student.id) 
                ? { ...student, checked: false, time: null, status: 'absent' }
                : student
            )
          );
          
          alert(`Đã hủy điểm danh cho ${selectedStudents.length} học sinh`);
        } else {
          alert(`Lỗi: ${response.message}`);
        }
      } else {
        // Điểm danh
        console.log('✅ Điểm danh cho:', selectedStudents);
        
        const response = await api.attendance.mark(meetingId, selectedStudents, 'present', '');
        
        if (response.success) {
          // Cập nhật trạng thái local với thời gian hiện tại
          const currentTime = new Date();
          const timeString = currentTime.toLocaleString('vi-VN');
          
          setStudents(prevStudents => 
            prevStudents.map(student => 
              selectedStudents.includes(student.id) 
                ? { ...student, checked: true, time: timeString, status: 'present' }
                : student
            )
          );
          
          alert(`Đã điểm danh cho ${selectedStudents.length} học sinh`);
        } else {
          alert(`Lỗi: ${response.message}`);
        }
      }
      
      // Reset selection sau khi thực hiện
      setSelectedStudents([]);
      
      // Debug: Log thông tin sau khi thực hiện
      setTimeout(() => {
        console.log('🔍 Debug - Sau khi thực hiện:');
        console.log('  - Tổng số học sinh:', students.length);
        console.log('  - Số học sinh đã điểm danh:', students.filter(s => s.checked).length);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in attendance action:', error);
      alert('Có lỗi xảy ra khi thực hiện thao tác điểm danh. Vui lòng thử lại!');
    }
  };

  // Xử lý kết thúc phòng học
  const handleEndClassroom = async () => {
    try {
      // Hiển thị confirm dialog
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn kết thúc phòng học này? Hành động này không thể hoàn tác.'
      );
      
      if (!confirmed) {
        return;
      }

      console.log('🔄 Kết thúc phòng học cho meeting ID:', meetingId);
      
      const response = await api.schedules.endSession(meetingId);
      
      if (response.success) {
        alert('Đã kết thúc phòng học thành công!');
        // Chuyển về trang dashboard
        navigate('/teacher/dashboard');
      } else {
        alert(`Lỗi: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Error ending classroom session:', error);
      alert('Có lỗi xảy ra khi kết thúc phòng học. Vui lòng thử lại!');
    }
  };

  if (loading) {
    return (
      <div className="meeting-detail-bg">
        <Header teacherName="Nguyễn Duy" />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 64px)',
          background: '#f8fafc'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <div style={{ color: '#6b7280', fontSize: '16px' }}>Đang tải dữ liệu...</div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meeting-detail-bg">
        <Header teacherName="Nguyễn Duy" />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 64px)',
          background: '#f8fafc'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '400px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'white',
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            <div style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Lỗi khi tải dữ liệu
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-detail-bg">
      <Header teacherName="Nguyễn Duy" />
      {/* Breadcrumb */}
      <div className="meeting-detail-breadcrumb-header">
        <div className="meeting-detail-breadcrumb-row">
          <span
            className="breadcrumb-link"
            onClick={() => navigate("/teacher/manageschedule")}
          >
            Danh sách lịch học
          </span>
          <span className="breadcrumb-sep"></span>
          <span className="breadcrumb-current">{scheduleData?.subject || scheduleData?.class_name || 'Chi tiết lớp học'}</span>
        </div>
      </div>
      <div className="meeting-detail-main">
        {/* Bên trái: Thông tin phòng học */}
        <div className="meeting-detail-info-card-mui">
          <div className="meeting-detail-info-label-mui">Tên phòng học</div>
          <div className="meeting-detail-info-title-mui">{scheduleData?.subject || scheduleData?.class_name}</div>
          <div className="meeting-detail-info-row-mui">
            <span className="meeting-detail-info-row-label-mui">Thời gian bắt đầu</span>
            <span className="meeting-detail-info-row-value-mui">{scheduleData?.start_time}</span>
          </div>
          <div className="meeting-detail-info-row-mui">
            <span className="meeting-detail-info-row-label-mui">Thời gian kết thúc</span>
            <span className="meeting-detail-info-row-value-mui">{scheduleData?.end_time}</span>
          </div>
          <div className="meeting-detail-info-row-mui">
            <span className="meeting-detail-info-row-label-mui">Phòng học</span>
            <span className="meeting-detail-info-row-value-mui">{scheduleData?.room}</span>
          </div>
          <div className="meeting-detail-info-row-mui">
            <span className="meeting-detail-info-row-label-mui">Loại lớp</span>
            <span className="meeting-detail-info-row-value-mui">{scheduleData?.type || 'Offline'}</span>
          </div>
          <button 
            className="meeting-detail-end-btn-mui" 
            onClick={handleEndClassroom}
          >
            Kết thúc phòng học
          </button>
        </div>
        {/* Bên phải: Quản lý điểm danh */}
        <div className="meeting-detail-content-mui">
          <div className="meeting-detail-toolbar-mui">
            <div className="meeting-detail-search-mui" style={{flex: 1}}>
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="meeting-detail-search-icon-mui" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            {selectedStudents.length > 0 && (
              <button className="meeting-detail-checkin-btn-mui" onClick={handleAttendanceAction}>
                {activeTab === "checked" ? (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6 6 18"/>
                      <path d="m6 6 12 12"/>
                    </svg>
                    Hủy điểm danh {selectedStudents.length} học sinh
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                    Điểm danh {selectedStudents.length} học sinh
                  </>
                )}
              </button>
            )}
          </div>
          <div className="meeting-detail-tabs-mui">
            <button
              className={`tab${activeTab === "checked" ? " active" : ""}`}
              onClick={() => setActiveTab("checked")}
            >
              Học sinh đã điểm danh <span>{checkedCount}</span>
            </button>
            <button
              className={`tab${activeTab === "notchecked" ? " active" : ""}`}
              onClick={() => setActiveTab("notchecked")}
            >
              Học sinh chưa điểm danh <span>{notCheckedCount}</span>
            </button>
          </div>
          
          {filteredStudents.length > 0 ? (
            <div className="meeting-detail-table-container-mui">
              <div className="meeting-detail-table-header-mui">
                <div className="meeting-detail-table-cell-mui header-cell">
                  <input 
                    type="checkbox" 
                    checked={areAllFilteredStudentsSelected}
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="meeting-detail-table-cell-mui header-cell">
                  Họ và tên
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
                <div className="meeting-detail-table-cell-mui header-cell">
                  Lớp
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
                <div className="meeting-detail-table-cell-mui header-cell">
                  Thời gian vào lớp
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
              
              <div className="meeting-detail-table-body-mui">
                {filteredStudents.map(student => (
                  <div key={student.id} className="meeting-detail-table-row-mui">
                    <div className="meeting-detail-table-cell-mui">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                      />
                    </div>
                    <div className="meeting-detail-table-cell-mui">
                      <div className="meeting-detail-student-avatar-mui">
                        {student.name.split(' ').slice(-2).map(n => n[0]).join('')}
                      </div>
                      <span className="meeting-detail-student-name-mui">{student.name}</span>
                    </div>
                    <div className="meeting-detail-table-cell-mui">
                      {student.class}
                    </div>
                    <div className="meeting-detail-table-cell-mui">
                      {student.checked ? student.time : "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="meeting-detail-empty-mui">
              <img src="/img/hero-illustration.png" alt="Empty" />
              <p className="meeting-detail-empty-title-mui">Không tìm thấy học sinh trong danh sách</p>
              <p className="meeting-detail-empty-desc-mui">Danh sách học sinh sẽ hiển thị ở đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;
