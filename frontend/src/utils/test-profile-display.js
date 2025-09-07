// Test script để kiểm tra hiển thị và cập nhật thông tin profile
// Chạy trong console của browser

console.log('=== Test Profile Display & Update ===');

// 1. Kiểm tra sessionStorage
console.log('1. Kiểm tra sessionStorage:');
const token = sessionStorage.getItem('token');
const user = sessionStorage.getItem('user');
console.log('Token:', token ? 'Có' : 'Không có');
console.log('User:', user ? JSON.parse(user) : 'Không có');

// 2. Test với dữ liệu học sinh mẫu
console.log('\n2. Test với dữ liệu học sinh mẫu:');
const sampleStudent = {
  id: 1,
  username: 'student1',
  email: 'student1@example.com',
  full_name: 'Nguyễn Văn A',
  role: 'student',
  school: 'THPT ABC',
  class: '12A1',
  date_of_birth: '2005-01-15',
  province: 'Hồ Chí Minh',
  phone: '0123456789'
};

sessionStorage.setItem('user', JSON.stringify(sampleStudent));
console.log('Đã lưu student mẫu vào sessionStorage');

// 3. Test với dữ liệu giáo viên mẫu
console.log('\n3. Test với dữ liệu giáo viên mẫu:');
const sampleTeacher = {
  id: 2,
  username: 'teacher1',
  email: 'teacher1@example.com',
  full_name: 'Trần Thị B',
  role: 'teacher',
  school: 'THPT XYZ',
  date_of_birth: '1985-06-20',
  province: 'Hà Nội',
  phone: '0987654321'
};

sessionStorage.setItem('user', JSON.stringify(sampleTeacher));
console.log('Đã lưu teacher mẫu vào sessionStorage');

// 4. Test API update (cần token thực)
console.log('\n4. Test API update:');
console.log('Để test API update, cần đăng nhập trước và có token hợp lệ');

// 5. Xóa dữ liệu test
console.log('\n5. Xóa dữ liệu test:');
sessionStorage.removeItem('user');
console.log('Đã xóa user khỏi sessionStorage');

console.log('=== Kết thúc test ===');

// Hàm helper để test update
window.testProfileUpdate = async (field, value) => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    console.error('Không có token, vui lòng đăng nhập trước');
    return;
  }

  try {
    const response = await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        [field]: value
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Cập nhật thành công:', result);
      
      // Cập nhật sessionStorage
      const currentUser = JSON.parse(sessionStorage.getItem('user'));
      const updatedUser = { ...currentUser, ...result.user };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      
      return result;
    } else {
      const errorData = await response.json();
      console.error('Lỗi cập nhật:', errorData);
      throw new Error(errorData.message);
    }
  } catch (error) {
    console.error('Lỗi:', error);
    throw error;
  }
};

console.log('\nSử dụng: testProfileUpdate("full_name", "Tên mới") để test cập nhật'); 