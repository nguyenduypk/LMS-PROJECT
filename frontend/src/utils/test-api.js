// Test script to check API calls from frontend
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Test teacher schedules API
const testTeacherSchedules = async () => {
  try {
    console.log('Testing teacher schedules API...');
    const response = await fetch(`${API_BASE_URL}/schedules/teacher`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    console.log('Teacher schedules response:', data);
    return data;
  } catch (error) {
    console.error('Error testing teacher schedules:', error);
    return null;
  }
};

// Test student schedules API
const testStudentSchedules = async () => {
  try {
    console.log('Testing student schedules API...');
    const response = await fetch(`${API_BASE_URL}/schedules/student`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    console.log('Student schedules response:', data);
    return data;
  } catch (error) {
    console.error('Error testing student schedules:', error);
    return null;
  }
};

// Test current user
const testCurrentUser = async () => {
  try {
    console.log('Testing current user API...');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    console.log('Current user response:', data);
    return data;
  } catch (error) {
    console.error('Error testing current user:', error);
    return null;
  }
};

// Export functions for use in browser console
window.testTeacherSchedules = testTeacherSchedules;
window.testStudentSchedules = testStudentSchedules;
window.testCurrentUser = testCurrentUser;

console.log('API test functions loaded. Use:');
console.log('- testTeacherSchedules()');
console.log('- testStudentSchedules()');
console.log('- testCurrentUser()'); 