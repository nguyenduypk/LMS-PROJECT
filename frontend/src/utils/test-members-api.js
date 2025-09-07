// Test script để kiểm tra API members
import { api } from './api.js';

async function testMembersAPI() {
  console.log('🔍 Testing Members API...');
  
  try {
    // Test với class ID = 1 (hoặc class ID thực tế)
    const classId = 1;
    console.log('Testing with class ID:', classId);
    
    const response = await api.classes.getMembers(classId);
    console.log('API Response:', response);
    
    if (response.members) {
      console.log('✅ Members found:', response.members.length);
      response.members.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          id: member.id,
          name: member.full_name,
          email: member.email,
          school: member.school,
          class: member.student_class,
          role: member.role
        });
      });
    } else {
      console.log('❌ No members in response');
      console.log('Full response:', response);
    }
  } catch (error) {
    console.error('❌ Error testing members API:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response
    });
  }
}

// Chạy test
testMembersAPI(); 