// Script để debug và khắc phục vấn đề authentication bị mất
import AuthStorage from './authStorage';

console.log('🔧 Starting Authentication Fix Script...');

// 1. Kiểm tra trạng thái hiện tại
console.log('\n📊 Current Authentication Status:');
AuthStorage.debugAuth();

// 2. Kiểm tra xem có dữ liệu cũ trong localStorage không
console.log('\n🔍 Checking for old localStorage data:');
const oldToken = localStorage.getItem('token');
const oldUser = localStorage.getItem('user');
if (oldToken || oldUser) {
  console.log('⚠️ Found old data in localStorage:');
  console.log('  Token:', oldToken ? 'Present' : 'Missing');
  console.log('  User:', oldUser ? 'Present' : 'Missing');
  
  // Migrate từ localStorage sang sessionStorage
  if (oldToken && !AuthStorage.getToken()) {
    AuthStorage.setToken(oldToken);
    console.log('✅ Migrated token to sessionStorage');
  }
  
  if (oldUser && !AuthStorage.getUser()) {
    try {
      const userData = JSON.parse(oldUser);
      AuthStorage.setUser(userData);
      console.log('✅ Migrated user data to sessionStorage');
    } catch (error) {
      console.error('❌ Error migrating user data:', error);
    }
  }
}

// 3. Tạo dữ liệu test nếu cần
export const createTestAuth = () => {
  console.log('\n🧪 Creating test authentication data...');
  
  const testUser = {
    id: 1,
    full_name: 'Nguyễn Văn Test',
    email: 'test@student.edu.vn',
    role: 'student',
    class: 'SV001',
    code: 'SV001'
  };
  
  const testToken = 'test_token_' + Date.now();
  
  AuthStorage.setToken(testToken);
  AuthStorage.setUser(testUser);
  
  console.log('✅ Test authentication data created');
  AuthStorage.debugAuth();
  
  return { user: testUser, token: testToken };
};

// 4. Kiểm tra và sửa lỗi navigation
export const fixNavigationIssue = () => {
  console.log('\n🔧 Fixing navigation issues...');
  
  // Lắng nghe sự kiện beforeunload để lưu dữ liệu quan trọng
  window.addEventListener('beforeunload', () => {
    const currentUser = AuthStorage.getUser();
    const currentToken = AuthStorage.getToken();
    
    if (currentUser && currentToken) {
      // Đảm bảo dữ liệu được lưu trước khi trang đóng
      sessionStorage.setItem('backup_user', JSON.stringify(currentUser));
      sessionStorage.setItem('backup_token', currentToken);
    }
  });
  
  // Khôi phục dữ liệu khi trang load
  const backupUser = sessionStorage.getItem('backup_user');
  const backupToken = sessionStorage.getItem('backup_token');
  
  if (backupUser && !AuthStorage.getUser()) {
    try {
      AuthStorage.setUser(JSON.parse(backupUser));
      console.log('✅ Restored user from backup');
    } catch (error) {
      console.error('❌ Error restoring user backup:', error);
    }
  }
  
  if (backupToken && !AuthStorage.getToken()) {
    AuthStorage.setToken(backupToken);
    console.log('✅ Restored token from backup');
  }
};

// 5. Auto-run khi import
fixNavigationIssue();

console.log('🎉 Authentication fix script completed!');

// Export các hàm để sử dụng từ console
window.AuthStorage = AuthStorage;
window.createTestAuth = createTestAuth;
window.fixNavigationIssue = fixNavigationIssue;
