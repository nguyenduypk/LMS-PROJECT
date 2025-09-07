// Test script to check frontend schedule creation
const API_BASE_URL = 'http://localhost:5000/api';

// Simulate the frontend schedule creation process
async function testFrontendScheduleCreation() {
  try {
    console.log('🔍 Testing frontend schedule creation process...\n');
    
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
    
    // Step 2: Get teacher's classes
    console.log('\n2️⃣ Getting teacher\'s classes...');
    const classesResponse = await fetch(`${API_BASE_URL}/classes/teacher`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    const classesData = await classesResponse.json();
    console.log('Teacher classes:', classesData);
    
    if (classesData.classes && classesData.classes.length > 0) {
      const firstClass = classesData.classes[0];
      console.log(`Using class ID: ${firstClass.id} (${firstClass.name})`);
      
      // Step 3: Try to create a schedule for this class
      console.log('\n3️⃣ Creating schedule for class...');
      const scheduleData = {
        class_id: firstClass.id,
        day_of_week: 'wednesday',
        start_time: '14:00',
        end_time: '15:00',
        room: 'Room 202',
        subject: 'Test Subject',
        description: 'Test schedule from frontend',
        type: 'offline'
      };
      
      console.log('Schedule data:', scheduleData);
      
      const createResponse = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify(scheduleData)
      });
      
      const createData = await createResponse.json();
      console.log('Create response status:', createResponse.status);
      console.log('Create response data:', createData);
      
      if (createResponse.ok) {
        console.log('✅ Schedule created successfully!');
      } else {
        console.log('❌ Schedule creation failed');
      }
    } else {
      console.log('❌ No classes found for teacher');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testFrontendScheduleCreation(); 