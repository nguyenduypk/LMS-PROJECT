import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api } from '../../utils/api';
import AuthStorage from '../../utils/authStorage';
import '../../utils/fix-class-code';
import ClassAnnouncementPage from './Class/ClassAnnouncementPage';
import ClassSchedulePage from './Class/ClassSchedulePage';
import ClassMembersPage from './Class/ClassMembersPage';
import ClassHomeworkPage from './Class/ClassHomeworkPage';
import StudentQuizPage from './Class/StudentQuizPage';
import StudentQuizResultPage from './Class/StudentQuizResultPage';
import ClassMaterialsPage from './Class/ClassMaterialsPage';
import StudentDocumentViewPage from './Class/StudentDocumentViewPage';

function StudentClassDetailPage() {
  const { classCode } = useParams();
  const location = useLocation();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const storageKey = classCode ? `classInfo:${classCode}` : null;

  // Hydrate ngay từ cache để tránh trống dữ liệu khi quay lại từ quiz
  useEffect(() => {
    try {
      const cached = AuthStorage.getClassInfo();
      if (cached && cached.code === classCode) {
        setClassInfo(cached);
        setLoading(false);
      } else if (storageKey) {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.code === classCode) {
            setClassInfo(parsed);
            setLoading(false);
          }
        }
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classCode]);

  // Fetch class information from API using class code
  // Track latest classCode to avoid setting state for stale requests
  const latestCodeRef = useRef(classCode);
  useEffect(() => { latestCodeRef.current = classCode; }, [classCode]);

  const fetchClassInfo = useCallback(async () => {
      const myCode = classCode; // capture for this run
      let isActive = true;
      // Cleanup function in case we want to cancel state updates after unmount
      const cancelIfStale = () => !isActive || latestCodeRef.current !== myCode;
      
      try {
        console.log('🔍 Fetching class info for classCode:', myCode);
        
        // Sử dụng getByCode thay vì getById vì classCode là mã lớp, không phải ID
        const data = await api.classes.getByCode(myCode);
        console.log('🔍 API response data:', data);
        
        if (data && data.class) {
          // Transform API data to match the expected format for StudentSidebar
          const transformedClassInfo = {
            id: data.class.id,
            name: data.class.name,
            code: data.class.class_code,
            teacher: data.class.teacher_name || 'Giáo viên',
            image: 'https://i.imgur.com/0y8Ftya.jpg', // Default image
            students: data.class.student_count || 0,
            lectures: 0, // Will be updated when we implement lectures
            homeworks: data.class.assignment_count || 0,
            materials: data.class.material_count || 0,
          };
          console.log('🔍 Transformed class info:', transformedClassInfo);
          if (cancelIfStale()) return;
          setClassInfo(transformedClassInfo);
          // Lưu classInfo vào AuthStorage để tránh mất dữ liệu
          AuthStorage.setClassInfo(transformedClassInfo);
          if (storageKey) {
            try { sessionStorage.setItem(storageKey, JSON.stringify(transformedClassInfo)); } catch (_) {}
          }
        } else {
          // Một số backend trả 200 nhưng không có data.class và có message => coi như không tìm thấy
          console.warn('🔍 No class data returned, treating as not found');
          if (cancelIfStale()) return;
          const cachedClassInfo = AuthStorage.getClassInfo();
          if (cachedClassInfo && cachedClassInfo.code === myCode) {
            console.log('🔍 Using cached class info for this code');
            setClassInfo(cachedClassInfo);
            setError(null);
          } else {
            setError('Mã lớp học không hợp lệ hoặc lớp học không tồn tại');
          }
          return;
        }
      } catch (error) {
        // Only log/show if still on the same class route
        if (!cancelIfStale()) {
          console.error('🔍 Error fetching class info:', error);
        }
        // 404 hoặc lỗi: không được ghi fallback vào storage
        if (!cancelIfStale() && error && Number(error.status) === 404) {
          setError('Mã lớp học không hợp lệ hoặc lớp học không tồn tại');
          return;
        }

        // Thử lấy từ AuthStorage nếu khớp URL classCode
        const cachedClassInfo = AuthStorage.getClassInfo();
        if (!cancelIfStale() && cachedClassInfo && cachedClassInfo.code === myCode) {
          console.log('🔍 Using cached class info from AuthStorage');
          setClassInfo(cachedClassInfo);
          setError(null);
          return;
        }

        // Không ghi fallback vào storage để tránh ô nhiễm trạng thái
        if (!cancelIfStale()) {
          console.log('🔍 Network/unknown error; not persisting fallback');
          setError('Không thể tải thông tin lớp học. Vui lòng thử lại.');
        }
      } finally {
        if (!cancelIfStale()) {
          setLoading(false);
        }
        isActive = false;
      }
  }, [classCode, storageKey]);

  useEffect(() => {
    if (classCode) {
      fetchClassInfo();
    } else {
      console.error('🔍 No classCode provided');
      setError('Không có ID lớp được cung cấp');
      setLoading(false);
    }
  }, [classCode, fetchClassInfo]);

  // Tự refetch khi quay lại tab/trang để đảm bảo các tab con luôn có dữ liệu
  useEffect(() => {
    const isOnThisClassRoute = () => {
      // Chỉ refetch nếu vẫn đang ở trong route của class hiện tại
      const expectedPrefix = `/student/class/${classCode}`;
      return location && typeof location.pathname === 'string' && location.pathname.startsWith(expectedPrefix);
    };

    const onFocus = () => {
      if (!isOnThisClassRoute()) return;
      console.log('🔄 Window focus: refetch class info');
      fetchClassInfo();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && isOnThisClassRoute()) {
        console.log('🔄 Visibility visible: refetch class info');
        fetchClassInfo();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchClassInfo, classCode, location]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải thông tin lớp học...</div>
      </div>
    );
  }

  // Show error only if there's an actual error, not when classInfo is successfully loaded
  if (error && !classInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h3>Debug Info:</h3>
          <p>Class ID from URL: <strong>{classCode}</strong></p>
          <p>Error: <strong>{error}</strong></p>
          <p>Loading: <strong>{loading ? 'Yes' : 'No'}</strong></p>
          <p>Token: <strong>{sessionStorage.getItem('token') ? 'Present' : 'Missing'}</strong></p>
          
          <div style={{ marginTop: '20px' }}>
            <h4>Test Options:</h4>
            <button 
              onClick={() => window.location.href = '/student/dashboard'}
              style={{ margin: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              Go to Student Dashboard
            </button>
            
            <h4 style={{ marginTop: '20px' }}>Quick Test (Bypass API):</h4>
            <button 
              onClick={() => {
                const testClassInfo = {
                  id: 4,
                  name: 'quý',
                  code: classCode || '2WVEE',
                  teacher: 'Nguyễn Văn An',
                  image: 'https://i.imgur.com/0y8Ftya.jpg',
                  students: 1,
                  lectures: 0,
                  homeworks: 0,
                  materials: 0,
                };
                setClassInfo(testClassInfo);
                setError(null);
                console.log('🔍 Force loaded class info for UI test:', testClassInfo);
              }}
              style={{ margin: '10px', padding: '10px 20px', backgroundColor: '#ff6b35', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              🚀 Force Load Class 2WVEE (UI Test)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no classInfo and no error, show loading or not found
  if (!classInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Không tìm thấy lớp học</div>
      </div>
    );
  }

  return (
    <>
      {console.log('🔍 Rendering child component with classInfo:', classInfo)}
      {console.log('🔍 Current location:', location.pathname)}
      <Routes>
        <Route index element={<Navigate to="announcement" replace />} />
        <Route path="announcement" element={<ClassAnnouncementPage classInfo={classInfo} />} />
        <Route path="schedule" element={<ClassSchedulePage classInfo={classInfo} />} />
        <Route path="members" element={<ClassMembersPage classInfo={classInfo} />} />
        <Route path="homework" element={<ClassHomeworkPage classInfo={classInfo} />} />
        <Route path="quiz/:quizId" element={<StudentQuizPage classInfo={classInfo} />} />
        <Route path="quiz/:quizId/result/:attemptId" element={<StudentQuizResultPage classInfo={classInfo} />} />
        <Route path="materials" element={<ClassMaterialsPage classInfo={classInfo} />} />
        <Route path="documents/:docId" element={<StudentDocumentViewPage classInfo={classInfo} />} />
      </Routes>
    </>
  );
}

export default StudentClassDetailPage;
