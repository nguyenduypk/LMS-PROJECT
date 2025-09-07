// Test script for frontend API integration
import { api } from './api';

// Test function to verify API connectivity
export const testFrontendAPI = async () => {
  console.log('Testing Frontend API Integration...');
  
  try {
    // Test 1: Check if backend is running
    console.log('1. Testing backend connectivity...');
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend is not responding');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    return;
  }

  // Test 2: Test login (if you have test credentials)
  console.log('2. Testing login...');
  try {
    const loginResponse = await api.auth.login({
      username: 'teacher1',
      password: 'password123'
    });
    
    if (loginResponse.token) {
      console.log('✅ Login successful');
      
      // Test 3: Get teacher classes
      console.log('3. Testing get teacher classes...');
      const classesResponse = await api.classes.getTeacherClasses();
      if (classesResponse.classes) {
        console.log(`✅ Found ${classesResponse.classes.length} classes`);
        
        if (classesResponse.classes.length > 0) {
          const firstClass = classesResponse.classes[0];
          console.log(`   First class: ${firstClass.name} (Code: ${firstClass.code})`);
          
          // Test 4: Get join requests for first class
          console.log('4. Testing get join requests...');
          const requestsResponse = await api.classes.getJoinRequests(firstClass.id);
          if (requestsResponse.requests) {
            console.log(`✅ Found ${requestsResponse.requests.length} pending requests`);
          } else {
            console.log('ℹ️ No pending requests found');
          }
          
          // Test 5: Get members for first class
          console.log('5. Testing get members...');
          const membersResponse = await api.classes.getMembers(firstClass.id);
          if (membersResponse.members) {
            console.log(`✅ Found ${membersResponse.members.length} members`);
          } else {
            console.log('ℹ️ No members found');
          }
        }
      } else {
        console.log('ℹ️ No classes found for teacher');
      }
    } else {
      console.log('❌ Login failed:', loginResponse.message);
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
  
  console.log('Frontend API test completed');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testFrontendAPI = testFrontendAPI;
} 