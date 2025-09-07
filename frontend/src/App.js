// App.js
import React from 'react';
import './App.css';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import RegisterRoleSelect from './components/login/RegisterRoleSelection';
import LoginRoleSelect from './components/login/Login';
import TeacherSignup from './components/login/TeacherSignup';
import StudentSignup from './components/login/StudentSignup';
import TeacherLogin from './components/login/Login';
import StudentLogin from './components/login/Login';
import StudentDashboard from './components/student/StudentDashboard';
import StudentClassPage from './components/student/StudentClassPage';
import StudentClassDetailPage from './components/student/StudentClassDetailPage';
import StudentSchedulePage from './components/student/StudentSchedulePage';
import ClassAnnouncementPage from './components/student/Class/ClassAnnouncementPage';
import ClassSchedulePage from './components/student/Class/ClassSchedulePage';
import ClassMembersPage from './components/student/Class/ClassMembersPage';
import Find from './components/student/Find';
import ClassHomeworkPage from './components/student/Class/ClassHomeworkPage';
import ClassMaterialsPage from './components/student/Class/ClassMaterialsPage';
import StudentDocumentViewPage from './components/student/Class/StudentDocumentViewPage';

import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherClass from './components/teacher/TeacherClass';
import ClassSchedule from './components/teacher/ClassSchedule';
import ManageSchedule from './components/teacher/ManageSchedule';
import TrashPage from './components/teacher/TrashPage';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import CreateRoomPage from './components/teacher/CreateRoomPage';
import MeetingDetail from './components/teacher/MeetingDetail';
import CreateLecturePage from './components/teacher/CreateLecturePage';
import ManualAnswerUploadPage from './components/teacher/ManualAnswerUploadPage';
import ManualAnswerDetailPage from './components/teacher/ManualAnswerDetailPage';
import StudentQuizPage from './components/student/Class/StudentQuizPage';
import StudentQuizResultPage from './components/student/Class/StudentQuizResultPage';
import CreateClassPage from './components/teacher/CreateClassPage';
import ProfilePage from './components/teacher/ProfilePage';
import StudentProfilePage from './components/student/ProfilePage';
import { debugAuth } from './utils/debug-auth';
import TeacherClassDetailPage from './components/teacher/TeacherClassDetailPage';
import TeacherNotificationPage from './components/teacher/Class/TeacherNotificationPage';
import MembersPage from './components/teacher/Class/MembersPage';
import TeacherMemberDetailPage from './components/teacher/Class/TeacherMemberDetailPage';
import StudentScoreDetail from './components/teacher/Class/StudentScoreDetail';
import AssignmentPage from './components/teacher/Class/AssignmentPage';
import CreateAssignmentPage from './components/teacher/Class/CreateAssignmentPage';
import UploadAssignmentPage from './components/teacher/Class/UploadAssignmentPage';
import GradePage from './components/teacher/Class/GradePage';
import TeacherSchedulePage from './components/teacher/Class/TeacherSchedulePage';
import TeacherMaterialsPage from './components/teacher/Class/TeacherMaterialsPage';
import TeacherDocumentViewPage from './components/teacher/Class/TeacherDocumentViewPage';
import AssignmentDetailPage from './components/teacher/Class/AssignmentDetailPage';
import EditAssignmentPage from './components/teacher/Class/EditAssignmentPage';
import StudentQuizDetailPage from './components/teacher/Class/StudentQuizDetailPage';
import AdminDashboard from './components/admin/AdminDashboard';

// Make debugAuth available globally
window.debugAuth = debugAuth;

// Lightweight resolvers to support direct quiz links like
// "/student/quiz/:quizId" and "/student/quiz/:quizId/result" by
// redirecting to the canonical nested route 
// "/student/class/:classCode/quiz/:quizId[/result]".
function useResolveClassCode(quizId) {
  const [resolved, setResolved] = React.useState(null);

  React.useEffect(() => {
    let active = true;

    async function resolve() {
      // 1) Try sessionStorage classInfo first
      try {
        const classInfoRaw = sessionStorage.getItem('classInfo');
        if (classInfoRaw) {
          const classInfo = JSON.parse(classInfoRaw);
          if (classInfo && classInfo.code) {
            if (active) setResolved(classInfo.code);
            return;
          }
        }
      } catch (_) {}

      // 2) Fallback: call backend to find class by quizId
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`/api/assignments/quiz/${quizId}/take`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          // Try common fields that might carry class code
          const code = data?.classCode || data?.class_code || data?.class?.code || data?.quiz?.classCode;
          if (code) {
            if (active) setResolved(code);
            return;
          }
        }
      } catch (_) {}

      // 3) Last resort: try another known key used in the app
      try {
        const raw = sessionStorage.getItem('currentClass');
        if (raw) {
          const c = JSON.parse(raw);
          if (c?.code) {
            if (active) setResolved(c.code);
            return;
          }
        }
      } catch (_) {}

      // 4) Give up without a classCode
      if (active) setResolved(undefined);
    }

    resolve();
    return () => {
      active = false;
    };
  }, [quizId]);

  return resolved; // string | undefined | null (null while resolving)
}

function StudentQuizRedirect() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const classCode = useResolveClassCode(quizId);

  React.useEffect(() => {
    if (classCode === null) return; // still resolving
    if (!quizId) return;
    if (!classCode) {
      // Could not resolve; navigate to student dashboard as a safe fallback
      navigate('/student/dashboard', { replace: true });
      return;
    }
    navigate(`/student/class/${classCode}/quiz/${quizId}`, { replace: true });
  }, [classCode, quizId, navigate]);

  return null;
}

function StudentQuizResultRedirect() {
  const navigate = useNavigate();
  const { quizId, attemptId } = useParams();
  const classCode = useResolveClassCode(quizId);

  React.useEffect(() => {
    if (classCode === null) return; // still resolving
    if (!quizId) return;
    if (!classCode) {
      navigate('/student/dashboard', { replace: true });
      return;
    }
    // if attemptId missing, just send to quiz page; else to specific result
    if (attemptId) {
      navigate(`/student/class/${classCode}/quiz/${quizId}/result/${attemptId}`, { replace: true });
    } else {
      navigate(`/student/class/${classCode}/quiz/${quizId}`, { replace: true });
    }
  }, [classCode, quizId, attemptId, navigate]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="App">
      {isLanding && <Header />}
      <Routes>
        {/* Chung */}
        <Route path="/" element={<MainContent />} />
        <Route path="/register" element={<RegisterRoleSelect />} />
        <Route path="/login" element={<LoginRoleSelect />} />
        <Route path="/login/teacher" element={<TeacherLogin />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/signup/teacher" element={<TeacherSignup />} />
        <Route path="/signup/student" element={<StudentSignup />} />

        {/* 👨‍🏫 Teacher */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/resources" element={<TeacherClass />} />
        <Route path="/teacher/schedule" element={<ClassSchedule />} />
        <Route path="/teacher/createclass" element={<CreateClassPage />} />
        <Route path="/teacher/manageschedule" element={<ManageSchedule />} />
        <Route path="/teacher/schedule/create" element={<CreateRoomPage />} />
        <Route path="/teacher/manageschedule/create" element={<CreateRoomPage />} />
        <Route path="/teacher/meeting/:meetingId" element={<MeetingDetail />} />
        <Route path="/teacher/create-lecture" element={<CreateLecturePage />} />
        {/* Trang nhập đáp án thủ công */}
        <Route path="/resource/add" element={<ManualAnswerUploadPage />} />
        {/* Trang nhập đáp án chi tiết */}
        <Route path="/resource/manual-answer-detail" element={<ManualAnswerDetailPage />} />
        {/* Trang thùng rác */}
        <Route path="/teacher/trash" element={<TrashPage />} />
        {/* Teacher class subpages */}
        <Route path="/teacher/class/:classId/announcement" element={<TeacherNotificationPage />} />
        <Route path="/teacher/class/:classId/teacher-schedule" element={<TeacherSchedulePage />} />
        <Route path="/teacher/class/:classId/members" element={<MembersPage />} />
        <Route path="/teacher/class/:classId/members/:memberId" element={<TeacherMemberDetailPage />} />
        <Route path="/teacher/class/:classId/members/:memberId/score-detail" element={<StudentScoreDetail />} />
        <Route path="/teacher/class/:classId/assignments" element={<AssignmentPage />} />
        <Route path="/teacher/class/:classId/assignment/:assignmentId" element={<AssignmentDetailPage />} />
        <Route path="/teacher/class/:classId/assignment/:assignmentId/edit" element={<EditAssignmentPage />} />
        <Route path="/teacher/class/:classId/assignment/:assignmentId/student/:studentId" element={<StudentQuizDetailPage />} />
        {/* Route này có thể được xóa vì đã có route tương tự cho teacher */}
        <Route path="/teacher/class/:classId/create-assignment" element={<CreateAssignmentPage classInfo={{}} />} />
        <Route path="/teacher/class/:classId/upload-assignment" element={<UploadAssignmentPage classInfo={{}} />} />
        <Route path="/teacher/class/:classId/grades" element={<GradePage />} />
        <Route path="/teacher/class/:classId/materials" element={<TeacherMaterialsPage />} />
        <Route path="/teacher/class/:classId/documents/:docId" element={<TeacherDocumentViewPage />} />
        <Route path="/teacher/create-class" element={<CreateClassPage />} />
        <Route path="/teacher/profile" element={<ProfilePage />} />
        
        {/* 👩‍🎓 Student */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/classes" element={<StudentClassPage />} />
        <Route path="/student/find" element={<Find />} />
        <Route path="/student/schedule" element={<StudentSchedulePage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
        
        {/* Student class routes - using StudentClassDetailPage as wrapper */}
        {/* Direct student quiz routes (resolver redirects to canonical nested path) */}
        <Route path="/student/quiz/:quizId" element={<StudentQuizRedirect />} />
        <Route path="/student/quiz/:quizId/result/:attemptId" element={<StudentQuizResultRedirect />} />
        <Route path="/student/class/:classCode/*" element={<StudentClassDetailPage />} />

        {/* 🛠️ Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* Map any admin sub-routes to the dashboard for now (profile/settings, etc.) */}
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
      {isLanding && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;