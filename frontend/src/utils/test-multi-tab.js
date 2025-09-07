// Test script để kiểm tra multi-tab functionality
export const testMultiTab = () => {
  console.log('🧪 Testing Multi-Tab Functionality');
  
  // Test sessionStorage vs localStorage (for comparison)
  const testStorage = () => {
    console.log('📦 Storage Test:');
    
    // Test localStorage (shared across tabs) - for comparison only
    localStorage.setItem('test_local', 'value1');
    console.log('localStorage test_local:', localStorage.getItem('test_local'));
    
    // Test sessionStorage (separate per tab)
    sessionStorage.setItem('test_session', 'value2');
    console.log('sessionStorage test_session:', sessionStorage.getItem('test_session'));
    
    console.log('✅ Storage test completed');
  };
  
  // Test token isolation
  const testTokenIsolation = () => {
    console.log('🔐 Token Isolation Test:');
    
    const currentToken = sessionStorage.getItem('token');
    const currentUser = sessionStorage.getItem('user');
    
    console.log('Current token exists:', !!currentToken);
    console.log('Current user exists:', !!currentUser);
    
    if (currentUser) {
      const user = JSON.parse(currentUser);
      console.log('Current user role:', user.role);
      console.log('Current user username:', user.username);
    }
    
    console.log('✅ Token isolation test completed');
  };
  
  // Test API calls
  const testAPICalls = async () => {
    console.log('🌐 API Calls Test:');
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found - please login first');
        return;
      }
      
      // Test teacher classes API
      const response = await fetch('http://localhost:5000/api/classes/teacher', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API call successful');
        console.log('Classes count:', data.classes?.length || 0);
      } else {
        console.log('❌ API call failed');
        const error = await response.text();
        console.log('Error:', error);
      }
    } catch (error) {
      console.log('❌ API call error:', error.message);
    }
  };
  
  // Run all tests
  testStorage();
  testTokenIsolation();
  testAPICalls();
  
  console.log('🎯 Multi-tab test completed!');
  console.log('💡 Tips:');
  console.log('   - Open multiple tabs to test isolation');
  console.log('   - Login as different users in different tabs');
  console.log('   - Check that each tab maintains its own session');
};

// Auto-run test if in development
if (process.env.NODE_ENV === 'development') {
  // Wait for page to load
  setTimeout(() => {
    testMultiTab();
  }, 1000);
} 