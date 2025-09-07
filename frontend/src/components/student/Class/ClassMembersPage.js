import React, { useState, useEffect } from 'react';
import DashboardHeader from '../DashboardHeader';
import ClassSidebar from './ClassSidebar';
import '../../../styles/ClassMembersPage.css';
import { api } from '../../../utils/api';
import { useParams } from 'react-router-dom';
import AuthStorage from '../../../utils/authStorage';
import '../../../utils/fix-class-code';
import '../../../utils/test-members-debug.js';

function ClassMembersPage({ classInfo: propClassInfo }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const { classCode } = useParams();

  // Khôi phục classInfo từ props hoặc sessionStorage
  useEffect(() => {
    let currentClassInfo = propClassInfo;
    
    // Nếu không có props, thử lấy từ sessionStorage
    if (!currentClassInfo) {
      currentClassInfo = AuthStorage.getClassInfo();
    }
    
    // Nếu vẫn không có, thử load từ API dựa trên classCode
    if (!currentClassInfo && classCode) {
      loadClassInfo(classCode);
      return;
    }
    
    if (currentClassInfo) {
      setClassInfo(currentClassInfo);
      // Lưu vào sessionStorage để tránh mất dữ liệu
      AuthStorage.setClassInfo(currentClassInfo);
    }
  }, [propClassInfo, classCode]);

  // Load thông tin class từ API nếu cần
  const loadClassInfo = async (code) => {
    try {
      console.log('🔍 Loading class info for code:', code);
      const response = await api.classes.getByCode(code);
      if (response && response.class) {
        setClassInfo(response.class);
        AuthStorage.setClassInfo(response.class);
        console.log('✅ Class info loaded:', response.class);
      }
    } catch (error) {
      console.error('❌ Error loading class info:', error);
    }
  };

  useEffect(() => {
    if (classInfo && classInfo.id) {
      loadMembers();
    }
  }, [classInfo]);

  const loadMembers = async () => {
    if (!classInfo || !classInfo.id) {
      console.error('No classInfo or classInfo.id available');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔍 Loading members for class ID:', classInfo.id);
      console.log('🔍 Current URL when loading members:', window.location.pathname);
      
      const response = await api.classes.getMembers(classInfo.id);
      console.log('🔍 Members API response:', response);
      
      if (response.members) {
        setMembers(response.members);
        console.log('🔍 Members loaded:', response.members.length);
        console.log('🔍 Members data:', response.members);
      } else {
        console.log('🔍 No members in response');
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      // Sử dụng mock data để test UI
      const mockMembers = [
        {
          id: 1,
          full_name: 'Nguyễn Văn A',
          email: 'student1@example.com',
          role: 'student',
          joined_at: '2024-01-15'
        },
        {
          id: 2,
          full_name: 'Trần Thị B',
          email: 'student2@example.com',
          role: 'student',
          joined_at: '2024-01-16'
        }
      ];
      setMembers(mockMembers);
      console.log('🔍 Using mock members data for testing');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const nameMatch = member.full_name && member.full_name.toLowerCase().includes(query);
    const schoolMatch = member.school && member.school.toLowerCase().includes(query);
    const classMatch = member.student_class && member.student_class.toLowerCase().includes(query);
    
    return nameMatch || schoolMatch || classMatch;
  });

  // Debug: Log filtered members
  console.log('🔍 Filtered members:', filteredMembers.length, 'out of', members.length);

  // Hàm lấy avatar text
  const getAvatarText = (name) => {
    if (!name) return '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Debug: Log component state
  console.log('🔍 Component state:', {
    classInfo: classInfo,
    members: members.length,
    filteredMembers: filteredMembers.length,
    isLoading: isLoading,
    searchQuery: searchQuery
  });

  return (
    <div className="class-document-page">
      <DashboardHeader />
      <div className="class-document-page__content">
        <ClassSidebar classInfo={classInfo} />

        <div className="class-document-page__header">
          <h1 className="class-document-page__title">
            Thành viên lớp học ({filteredMembers.length})
          </h1>
        </div>

        <div className="members-search-bar">
          <input
            type="text"
            placeholder="Nhập và ấn enter để tìm kiếm"
            className="members-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="members-search-divider" />

        <div className="members-table-wrapper">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Đang tải danh sách thành viên...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Không có thành viên nào trong lớp học này.</p>
            </div>
          ) : (
            <div>
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Trường</th>
                    <th>Lớp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, idx) => (
                    <tr key={member.id || idx}>
                      <td>
                        <span className="member-avatar">{getAvatarText(member.full_name)}</span>
                        <span className="member-name">{member.full_name}</span>
                      </td>
                      <td>{member.school || '--'}</td>
                      <td>{member.student_class || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassMembersPage;
