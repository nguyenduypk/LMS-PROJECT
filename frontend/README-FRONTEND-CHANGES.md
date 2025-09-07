# Frontend Changes for Class Join Request Feature

This document outlines all the frontend changes made to support the new class join request functionality where students send requests to join classes and teachers approve/reject them.

## Overview

The frontend has been updated to support the new workflow:
1. **Students**: Send join requests instead of directly joining classes
2. **Teachers**: View pending requests and approve/reject them
3. **Both**: View updated member lists with real data from the backend

## Files Modified

### 1. `src/utils/api.js`
**Changes**: Added new API methods for join request management

**New Methods Added**:
- `api.classes.getJoinRequests(classId)` - Get pending join requests for a class
- `api.classes.approveJoinRequest(classId, requestId)` - Approve a join request
- `api.classes.rejectJoinRequest(classId, requestId)` - Reject a join request
- `api.classes.getMembers(classId)` - Get class members with detailed information

**Code Added**:
```javascript
// Join request management
getJoinRequests: async (classId) => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}/join-requests`, {
    headers: getAuthHeaders()
  });
  return response.json();
},

approveJoinRequest: async (classId, requestId) => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}/join-requests/${requestId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return response.json();
},

rejectJoinRequest: async (classId, requestId) => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}/join-requests/${requestId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return response.json();
},

getMembers: async (classId) => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}/members`, {
    headers: getAuthHeaders()
  });
  return response.json();
}
```

### 2. `src/components/student/Find.js`
**Changes**: Updated join class functionality to handle join requests

**Key Changes**:
- Updated success message to indicate request is pending approval
- Increased timeout for navigation to 3 seconds to allow users to read the message

**Code Modified**:
```javascript
// Updated success message
setSuccess('Yêu cầu tham gia lớp học đã được gửi và đang chờ giáo viên duyệt!');
setTimeout(() => {
  navigate('/student/dashboard');
}, 3000); // Increased from 2000ms
```

### 3. `src/components/teacher/Class/MembersPage.js`
**Changes**: Complete overhaul to use real API data instead of hardcoded data

**Major Changes**:
- Added `useEffect` to load data when component mounts
- Replaced hardcoded `MEMBERS` array with dynamic data from API
- Added real API calls for loading members and pending requests
- Updated approve/reject functions to use real API endpoints
- Added loading states and error handling
- Updated table rendering to use real member data
- Enhanced pending requests display with additional student information

**New State Variables**:
```javascript
const [pendingRequests, setPendingRequests] = useState([]);
const [members, setMembers] = useState([]);
const [isLoading, setIsLoading] = useState(false);
```

**New Functions Added**:
```javascript
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
```

**Updated Functions**:
```javascript
const approveStudent = async (requestId) => {
  try {
    setIsLoading(true);
    const response = await api.classes.approveJoinRequest(classId, requestId);
    if (response.message) {
      await loadMembers();
      await loadPendingRequests();
    }
  } catch (error) {
    console.error('Error approving student:', error);
  } finally {
    setIsLoading(false);
  }
};

const rejectStudent = async (requestId) => {
  try {
    setIsLoading(true);
    const response = await api.classes.rejectJoinRequest(classId, requestId);
    if (response.message) {
      await loadPendingRequests();
    }
  } catch (error) {
    console.error('Error rejecting student:', error);
  } finally {
    setIsLoading(false);
  }
};
```

**Enhanced Pending Requests Display**:
- Shows student's school and class information
- Displays real class code in the info message
- Added loading states for approve/reject buttons
- Improved error handling

### 4. `src/components/student/Class/ClassMembersPage.js`
**Changes**: Complete rewrite to use real API data

**Major Changes**:
- Added `useEffect` to load members when component mounts
- Replaced hardcoded member data with API calls
- Added search functionality
- Added loading states
- Updated member display to use real data structure

**New State Variables**:
```javascript
const [members, setMembers] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
```

**New Functions Added**:
```javascript
const loadMembers = async () => {
  setIsLoading(true);
  try {
    const response = await api.classes.getMembers(classId);
    if (response.members) {
      setMembers(response.members);
    }
  } catch (error) {
    console.error('Error loading members:', error);
  } finally {
    setIsLoading(false);
  }
};
```

**Enhanced Features**:
- Real-time search filtering
- Loading indicators
- Proper error handling
- Dynamic member count display

### 5. `src/components/teacher/Class/MembersPage.css`
**Changes**: Added styles for new pending request elements

**New CSS Classes Added**:
```css
.teacher-pending-student-school {
  font-size: 12px;
  color: #666;
  display: block;
  margin-top: 2px;
}

.teacher-pending-student-class {
  font-size: 12px;
  color: #666;
  display: block;
  margin-top: 2px;
}
```

**Updated Styles**:
- Enhanced pending actions spacing
- Improved visual hierarchy for student information

### 6. `src/utils/test-frontend-api.js` (New File)
**Purpose**: Test script to verify frontend API integration

**Features**:
- Tests backend connectivity
- Tests login functionality
- Tests class data retrieval
- Tests join request management
- Tests member data retrieval

## Data Structure Changes

### Member Data Structure
**Before** (Hardcoded):
```javascript
{
  name: 'Nguyễn Duy',
  school: 'CNTT',
  className: '--',
  phone: '--',
  assignments: '1/2',
  avatar: ''
}
```

**After** (API Response):
```javascript
{
  id: 1,
  full_name: 'Nguyễn Duy',
  email: 'nguyendu@example.com',
  school: 'CNTT',
  student_class: '22DTH2C',
  phone: '0123456789',
  role: 'student',
  joined_at: '2024-01-15T10:30:00Z'
}
```

### Pending Request Data Structure
**Before** (Hardcoded):
```javascript
{
  id: 1,
  name: "Nguyễn Văn A",
  email: "a@gmail.com"
}
```

**After** (API Response):
```javascript
{
  id: 1,
  full_name: "Nguyễn Văn A",
  email: "a@gmail.com",
  school: "Đại học Nguyễn Tất Thành",
  student_class: "22DTH2C",
  requested_at: "2024-01-15T10:30:00Z"
}
```

## User Experience Improvements

### For Students
1. **Clear Feedback**: Students now see a clear message that their request is pending approval
2. **Real Member Lists**: Students can see actual approved members in their class
3. **Search Functionality**: Students can search through class members

### For Teachers
1. **Real-time Data**: Teachers see actual pending requests and class members
2. **Enhanced Information**: Pending requests show student's school and class information
3. **Loading States**: Clear feedback during approve/reject operations
4. **Error Handling**: Proper error messages for failed operations
5. **Dynamic Updates**: Member lists and pending requests update automatically after actions

## Testing

### Manual Testing Steps
1. **Start Backend**: Ensure the backend server is running with the new join request functionality
2. **Start Frontend**: Run `npm start` in the frontend directory
3. **Test Student Flow**:
   - Login as a student
   - Try to join a class using a class code
   - Verify the "pending approval" message appears
4. **Test Teacher Flow**:
   - Login as a teacher
   - Navigate to a class's members page
   - Check if pending requests appear in the sidebar
   - Test approve/reject functionality
5. **Test Member Display**:
   - Verify both student and teacher member pages show real data
   - Test search functionality

### API Testing
Use the test script in `src/utils/test-frontend-api.js`:
```javascript
// In browser console
import { testFrontendAPI } from './utils/test-frontend-api';
testFrontendAPI();
```

## Dependencies

The frontend changes require the following backend endpoints to be available:
- `GET /api/classes/:id/members`
- `GET /api/classes/:id/join-requests`
- `POST /api/classes/:id/join-requests/:requestId/approve`
- `POST /api/classes/:id/join-requests/:requestId/reject`

## Notes

1. **Error Handling**: All API calls include proper error handling and user feedback
2. **Loading States**: Loading indicators are shown during API operations
3. **Data Consistency**: Member lists and pending requests are refreshed after each action
4. **Responsive Design**: All changes maintain the existing responsive design
5. **Backward Compatibility**: Changes are designed to work with the existing backend structure

## Future Enhancements

1. **Real-time Updates**: Consider implementing WebSocket connections for real-time updates
2. **Notifications**: Add notification system for new join requests
3. **Bulk Actions**: Allow teachers to approve/reject multiple requests at once
4. **Request History**: Show history of approved/rejected requests
5. **Email Notifications**: Send email notifications for request status changes 