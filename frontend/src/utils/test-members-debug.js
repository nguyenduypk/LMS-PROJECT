// Debug script để test API members từ frontend
import { api } from './api.js';

async function debugMembersAPI() {
  console.log('🔍 Debug Members API from Frontend...');
  
  try {
    // Test với class ID = 4 (lớp "quý")
    const classId = 4;
    console.log('Testing with class ID:', classId);
    
    // Kiểm tra token
    const token = sessionStorage.getItem('token');
    console.log('Token available:', !!token);
    
    const response = await api.classes.getMembers(classId);
    console.log('🔍 API Response:', response);
    
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

// Export để có thể gọi từ console
window.debugMembersAPI = debugMembersAPI;

// Tự động chạy nếu được import
if (typeof window !== 'undefined') {
  console.log('🔍 Members debug script loaded. Run debugMembersAPI() to test.');
} 