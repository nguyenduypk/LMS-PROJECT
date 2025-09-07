// Test frontend API error handling
const API_BASE_URL = 'http://localhost:5000/api';

// Simulate the frontend API call with error handling
async function testFrontendAPIError() {
  try {
    console.log('🔍 Testing frontend API error handling...\n');
    
    // Step 1: Login as teacher1
    console.log('1️⃣ Logging in as teacher1...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'teacher1',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.token) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful');
    
    // Step 2: Try to create a conflicting schedule
    console.log('\n2️⃣ Testing conflicting schedule creation...');
    const conflictingScheduleData = {
      class_id: 10,
      day_of_week: 'monday',
      start_time: '08:00',
      end_time: '09:00',
      room: 'Room 101',
      subject: 'Mathematics',
      description: 'Conflicting schedule',
      type: 'offline'
    };
    
    console.log('Conflicting schedule data:', conflictingScheduleData);
    
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify(conflictingScheduleData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error data:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Success data:', data);
    
  } catch (error) {
    console.log('✅ Correctly caught error in frontend API');
    console.log('Error message:', error.message);
    
    if (error.message.includes('Đã có lịch học vào thời gian này')) {
      console.log('✅ Frontend API error handling works correctly!');
    } else {
      console.log('❌ Unexpected error message format');
    }
  }
}

// Run the test
testFrontendAPIError(); 