// Test script để kiểm tra hiển thị tên người dùng
// Chạy trong console của browser

console.log('=== Test User Display ===');

// 1. Kiểm tra sessionStorage
console.log('1. Kiểm tra sessionStorage:');
const token = sessionStorage.getItem('token');
const user = sessionStorage.getItem('user');
console.log('Token:', token ? 'Có' : 'Không có');
console.log('User:', user ? JSON.parse(user) : 'Không có');

// 2. Test với dữ liệu mẫu
console.log('\n2. Test với dữ liệu mẫu:');
const sampleUser = {
  id: 1,
  name: 'Nguyễn Văn A',
  email: 'student1@example.com',
  role: 'student',
  code: 'SV001'
};

// Lưu vào sessionStorage
sessionStorage.setItem('user', JSON.stringify(sampleUser));
console.log('Đã lưu user mẫu vào sessionStorage');

// Đọc lại
const retrievedUser = JSON.parse(sessionStorage.getItem('user'));
console.log('User đã lưu:', retrievedUser);

// 3. Test với teacher
console.log('\n3. Test với teacher:');
const sampleTeacher = {
  id: 2,
  name: 'Trần Thị B',
  email: 'teacher1@example.com',
  role: 'teacher',
  phone: '0123456789'
};

sessionStorage.setItem('user', JSON.stringify(sampleTeacher));
console.log('Đã lưu teacher mẫu vào sessionStorage');

const retrievedTeacher = JSON.parse(sessionStorage.getItem('user'));
console.log('Teacher đã lưu:', retrievedTeacher);

// 4. Xóa dữ liệu test
console.log('\n4. Xóa dữ liệu test:');
sessionStorage.removeItem('user');
console.log('Đã xóa user khỏi sessionStorage');

console.log('=== Kết thúc test ==='); 