// Debug script cho authentication
export const debugAuth = () => {
  console.log('🔍 Debug Authentication...\n');

  // 1. Kiểm tra sessionStorage
  console.log('1. 📋 Kiểm tra sessionStorage:');
  const token = sessionStorage.getItem('token');
  const user = sessionStorage.getItem('user');
  
  console.log('   Token exists:', !!token);
  console.log('   User exists:', !!user);
  
  if (token) {
    console.log('   Token:', token.substring(0, 50) + '...');
  }
  
  if (user) {
    try {
      const userObj = JSON.parse(user);
      console.log('   User:', userObj);
    } catch (error) {
      console.log('   ❌ Error parsing user:', error.message);
    }
  }
  console.log('');

  // 2. Test API headers
  console.log('2. 🌐 Test API headers:');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  console.log('   Headers:', headers);
  console.log('');

  // 3. Test token validation
  console.log('3. 🔍 Test token validation:');
  if (token) {
    try {
      // Decode JWT token (without verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('   Token payload:', payload);
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('   ❌ Token đã hết hạn');
      } else {
        console.log('   ✅ Token còn hiệu lực');
      }
    } catch (error) {
      console.log('   ❌ Error decoding token:', error.message);
    }
  } else {
    console.log('   ❌ Không có token');
  }
  console.log('');

  // 4. Test API call simulation
  console.log('4. 🧪 Test API call simulation:');
  if (token) {
    console.log('   Simulating API call with token...');
    console.log('   Authorization header:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log('   ❌ Không thể test API call - không có token');
  }
};

// Export để có thể gọi từ console
window.debugAuth = debugAuth; 