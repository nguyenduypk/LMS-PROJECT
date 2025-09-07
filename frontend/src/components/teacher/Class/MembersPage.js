import React, { useState, useEffect } from 'react';
import Header from '../Header';
import './MembersPage.css';
import { MdSearch, MdPrint, MdShare, MdDeleteOutline } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import { api } from '../../../utils/api';

// Dữ liệu mẫu cho học sinh chờ duyệt - sẽ được thay thế bằng API
const PENDING_REQUESTS = [
  { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com" },
  { id: 2, name: "Trần Thị B", email: "b@gmail.com" },
  { id: 3, name: "Lê Văn C", email: "c@gmail.com" }
];

function getInitials(name) {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

function MembersPage({ classInfo }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' hoặc 'select'
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStudentData, setAddStudentData] = useState({
    name: '',
    email: '',
    school: '',
    className: '',
    phone: ''
  });
  const navigate = useNavigate();
  const { classId } = useParams();

  // Load data when component mounts
  useEffect(() => {
    if (classId) {
      loadMembers();
      loadPendingRequests();
    }
  }, [classId]);

  const loadMembers = async () => {
    try {
      const response = await api.classes.getMembers(classId);
      if (response.members) {
        setMembers(response.members);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await api.classes.getJoinRequests(classId);
      if (response.requests) {
        setPendingRequests(response.requests);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (e) => {
    if (e.key === 'Enter') setQuery(search);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'list') {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filtered.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filtered.map((_, index) => index + 1));
    }
  };

  const handleDeleteSelected = () => {
    // Xử lý xóa các thành viên đã chọn
    setSelectedMembers([]);
    setViewMode('list');
  };

  // Hàm duyệt học sinh
  const approveStudent = async (requestId) => {
    try {
      setIsLoading(true);
      const response = await api.classes.approveJoinRequest(classId, requestId);
      if (response.message) {
        // Reload both members and pending requests
        await loadMembers();
        await loadPendingRequests();
      }
    } catch (error) {
      console.error('Error approving student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm từ chối học sinh
  const rejectStudent = async (requestId) => {
    try {
      setIsLoading(true);
      const response = await api.classes.rejectJoinRequest(classId, requestId);
      if (response.message) {
        // Reload pending requests
        await loadPendingRequests();
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddStudentData({
      name: '',
      email: '',
      school: '',
      className: '',
      phone: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddStudentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAddStudent = async (e) => {
    e.preventDefault();
    if (!addStudentData.name.trim() || !addStudentData.email.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Chuẩn bị dữ liệu để gửi lên server
      const studentData = {
        full_name: addStudentData.name,
        email: addStudentData.email,
        school: addStudentData.school || null,
        student_class: addStudentData.className || null,
        phone: addStudentData.phone || null
      };
      
      // Gọi API để thêm học sinh
      const response = await api.classes.addStudent(classId, studentData);
      
      if (response.message) {
        // Reload danh sách thành viên
        await loadMembers();
        handleCloseModal();
        alert('Thêm học sinh thành công!');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm học sinh');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="teacher-members-root">
      <Header />
      <div className="teacher-members-layout">
        <TeacherSidebar classInfo={classInfo} />
        <div className="teacher-members-content">
          <div className="teacher-members-header">
            <div className="teacher-members-title">Thành viên lớp học ({filtered.length})</div>
            <div className="teacher-members-toolbar">
              <div className="teacher-members-toolbar-left">
                <div className="teacher-members-view-buttons">
                  <button 
                    className={`teacher-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('list')}
                  >
                    ☰
                  </button>
                  <button 
                    className={`teacher-view-btn ${viewMode === 'select' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('select')}
                  >
                    ☰✓
                  </button>
                </div>
                <div className="teacher-members-search-container">
                  <div className="teacher-search-input-wrapper">
                    <MdSearch size={20} className="teacher-search-icon" />
                    <input
                      className="teacher-members-search"
                      type="text"
                      placeholder="Nhập và ấn enter để tìm kiếm"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={handleSearch}
                    />
                  </div>
                </div>
                <button className="teacher-members-print-btn">
                  <MdPrint size={20} />
                </button>
              </div>
              <button className="teacher-members-add-btn" onClick={handleAddStudent}>Thêm học sinh</button>
            </div>
          </div>

          <div className="teacher-members-table-container">
            {viewMode === 'select' && (
              <div className="teacher-members-selection-header">
                <div className="teacher-selection-left">
                  <input 
                    type="checkbox" 
                    checked={selectedMembers.length === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span className="teacher-selection-text">
                    Đang chọn <span className="teacher-selection-count">{selectedMembers.length}</span> học sinh
                  </span>
                </div>
                <div className="teacher-selection-right">
                  <button 
                    className="teacher-delete-selected-btn"
                    onClick={handleDeleteSelected}
                    disabled={selectedMembers.length === 0}
                  >
                    <MdDeleteOutline size={16} />
                    Xóa
                  </button>
                </div>
              </div>
            )}
            <table className={`teacher-members-table ${viewMode === 'select' ? 'select-mode' : ''}`}>
              <thead>
                {viewMode === 'select' && (
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.length === filtered.length && filtered.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Họ và tên
                      <button className="teacher-sort-btn" aria-label="Sắp xếp">↑</button>
                    </th>
                    <th>Trường</th>
                    <th>Lớp</th>
                    <th>SĐT</th>
                    <th>Bài đã làm</th>
                    <th></th>
                  </tr>
                )}
                {viewMode === 'list' && (
                  <tr>
                    <th>Họ và tên
                      <button className="teacher-sort-btn" aria-label="Sắp xếp">↑</button>
                    </th>
                    <th>Trường</th>
                    <th>Lớp</th>
                    <th>SĐT</th>
                    <th>Bài đã làm</th>
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr key={m.id || idx} style={{cursor: viewMode === 'select' ? 'default' : 'pointer'}} onClick={viewMode === 'select' ? undefined : () => navigate(`/teacher/class/${classId}/members/${m.id}`)}>
                    {viewMode === 'select' && (
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedMembers.includes(m.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectMember(m.id);
                          }}
                        />
                      </td>
                    )}
                    <td>
                      <div className="teacher-member-info">
                        <div className="teacher-member-main">
                          <span className="teacher-member-avatar">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.full_name} />
                            ) : (
                              getInitials(m.full_name)
                            )}
                          </span>
                          <span className="teacher-member-name">{m.full_name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="teacher-school-info">
                        <span>{m.school || '--'}</span>
                      </div>
                    </td>
                    <td>{m.student_class || '--'}</td>
                    <td>{m.phone || '--'}</td>
                    <td>{m.assignments || '0/0'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className="teacher-share-btn" onClick={(e) => e.stopPropagation()}>
                          <MdShare size={16} />
                          Chia sẻ
                        </button>
                        <button className="teacher-delete-btn" onClick={(e) => e.stopPropagation()}>
                          <MdDeleteOutline size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Right sidebar for pending requests */}
        <div className="teacher-members-sidebar">
          <div className="teacher-pending-requests">
            <div className="teacher-pending-title">Chờ duyệt • {pendingRequests.length}</div>
            {pendingRequests.length === 0 ? (
              <div className="teacher-pending-info">
                Yêu cầu vào lớp sẽ được hiển thị khi có học sinh tìm kiếm lớp bạn với mã lớp <b>{classInfo?.code || 'N/A'}</b>
              </div>
            ) : (
              <ul className="teacher-pending-list">
                {pendingRequests.map(student => (
                  <li key={student.id} className="teacher-pending-item">
                    <div className="teacher-pending-student-info">
                      <span className="teacher-pending-student-name">{student.full_name}</span>
                      <span className="teacher-pending-student-email">{student.email}</span>
                      {student.school && (
                        <span className="teacher-pending-student-school">{student.school}</span>
                      )}
                      {student.student_class && (
                        <span className="teacher-pending-student-class">Lớp: {student.student_class}</span>
                      )}
                    </div>
                    <div className="teacher-pending-actions">
                      <button 
                        className="teacher-approve-btn" 
                        onClick={() => approveStudent(student.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Đang xử lý...' : 'Duyệt'}
                      </button>
                      <button 
                        className="teacher-reject-btn" 
                        onClick={() => rejectStudent(student.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Đang xử lý...' : 'Từ chối'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="teacher-modal-overlay" onClick={handleCloseModal}>
          <div className="teacher-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h2 className="teacher-modal-title">Thêm học sinh</h2>
              <button className="teacher-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitAddStudent} className="teacher-modal-form">
              <div className="teacher-modal-form-group">
                <label className="teacher-modal-label">
                  Họ và tên <span className="teacher-modal-required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={addStudentData.name}
                  onChange={handleInputChange}
                  className="teacher-modal-input"
                  placeholder="Nhập họ và tên học sinh"
                  required
                />
              </div>
              
              <div className="teacher-modal-form-group">
                <label className="teacher-modal-label">
                  Email <span className="teacher-modal-required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={addStudentData.email}
                  onChange={handleInputChange}
                  className="teacher-modal-input"
                  placeholder="Nhập email học sinh"
                  required
                />
              </div>
              
              <div className="teacher-modal-form-group">
                <label className="teacher-modal-label">Trường</label>
                <input
                  type="text"
                  name="school"
                  value={addStudentData.school}
                  onChange={handleInputChange}
                  className="teacher-modal-input"
                  placeholder="Nhập tên trường"
                />
              </div>
              
              <div className="teacher-modal-form-group">
                <label className="teacher-modal-label">Lớp</label>
                <input
                  type="text"
                  name="className"
                  value={addStudentData.className}
                  onChange={handleInputChange}
                  className="teacher-modal-input"
                  placeholder="Nhập tên lớp"
                />
              </div>
              
              <div className="teacher-modal-form-group">
                <label className="teacher-modal-label">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={addStudentData.phone}
                  onChange={handleInputChange}
                  className="teacher-modal-input"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              
              <div className="teacher-modal-actions">
                <button type="button" className="teacher-modal-cancel" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="teacher-modal-submit" disabled={isLoading}>
                  {isLoading ? 'Đang thêm...' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembersPage; 