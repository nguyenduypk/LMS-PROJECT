// Test script để kiểm tra dữ liệu profile
// Chạy trong console của browser sau khi đăng nhập

console.log('=== Test Profile Data Display ===');

// 1. Kiểm tra sessionStorage
console.log('1. Kiểm tra sessionStorage:');
const token = sessionStorage.getItem('token');
const user = sessionStorage.getItem('user');
console.log('Token:', token ? 'Có' : 'Không có');
console.log('User:', user ? JSON.parse(user) : 'Không có');

// 2. Test với dữ liệu thực từ database
if (user) {
  const userData = JSON.parse(user);
  console.log('\n2. Dữ liệu user hiện tại:');
  console.log('   ID:', userData.id);
  console.log('   Username:', userData.username);
  console.log('   Full Name:', userData.full_name);
  console.log('   Email:', userData.email);
  console.log('   Role:', userData.role);
  console.log('   School:', userData.school);
  console.log('   Class:', userData.class);
  console.log('   Date of Birth:', userData.date_of_birth);
  console.log('   Province:', userData.province);
  
  // Kiểm tra các trường quan trọng
  console.log('\n3. Kiểm tra các trường quan trọng:');
  console.log('   ✅ Full Name có dữ liệu:', !!userData.full_name);
  console.log('   ✅ School có dữ liệu:', !!userData.school);
  console.log('   ✅ Class có dữ liệu:', !!userData.class);
  console.log('   ✅ Date of Birth có dữ liệu:', !!userData.date_of_birth);
  console.log('   ✅ Province có dữ liệu:', !!userData.province);
  
  // Test format date
  if (userData.date_of_birth) {
    const date = new Date(userData.date_of_birth);
    console.log('   📅 Date formatted:', date.toLocaleDateString('vi-VN'));
  }
} else {
  console.log('❌ Không có dữ liệu user trong sessionStorage');
}

// 3. Test API call để lấy thông tin user
console.log('\n4. Test API call:');
if (token) {
  fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('   API Response:', data);
    if (data.user) {
      console.log('   ✅ API trả về đầy đủ thông tin user');
      console.log('   School:', data.user.school);
      console.log('   Class:', data.user.class);
      console.log('   Date of Birth:', data.user.date_of_birth);
      console.log('   Province:', data.user.province);
    }
  })
  .catch(error => {
    console.error('   ❌ API Error:', error);
  });
} else {
  console.log('   ❌ Không có token để test API');
}

console.log('\n=== Kết thúc test ===');

// Hàm helper để refresh dữ liệu
window.refreshUserData = async () => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    console.error('Không có token');
    return;
  }

  try {
    const response = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      sessionStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ Đã refresh dữ liệu user:', data.user);
      location.reload(); // Reload trang để cập nhật UI
    } else {
      console.error('❌ Lỗi khi refresh dữ liệu');
    }
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
};

console.log('\nSử dụng: refreshUserData() để refresh dữ liệu user'); 