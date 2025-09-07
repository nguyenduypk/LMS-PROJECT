// Test script để kiểm tra chức năng chỉnh sửa profile
// Chạy trong console của browser sau khi đăng nhập

console.log('=== Test Edit Profile Functionality ===');

// 1. Kiểm tra sessionStorage
console.log('1. Kiểm tra sessionStorage:');
const token = sessionStorage.getItem('token');
const user = sessionStorage.getItem('user');
console.log('Token:', token ? 'Có' : 'Không có');
console.log('User:', user ? JSON.parse(user) : 'Không có');

// 2. Test API GET /me
console.log('\n2. Test API GET /me:');
if (token) {
  fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('   API GET Response:', data);
    if (data.id) {
      console.log('   ✅ API GET trả về đầy đủ thông tin user');
      console.log('   School:', data.school);
      console.log('   Class:', data.class);
      console.log('   Date of Birth:', data.date_of_birth);
      console.log('   Province:', data.province);
    }
  })
  .catch(error => {
    console.error('   ❌ API GET Error:', error);
  });
}

// 3. Test API PUT /me
console.log('\n3. Test API PUT /me:');
if (token) {
  const testData = {
    full_name: 'Nguyễn Văn A (Test)',
    school: 'THPT Test',
    province: 'Hà Nội (Test)',
    date_of_birth: '2005-01-20'
  };

  fetch('/api/users/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(testData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('   API PUT Response:', data);
    if (data.message === 'Cập nhật thành công') {
      console.log('   ✅ API PUT hoạt động thành công');
      console.log('   Updated User:', data.user);
      
      // Cập nhật sessionStorage
      sessionStorage.setItem('user', JSON.stringify(data.user));
      console.log('   ✅ Đã cập nhật sessionStorage');
    } else {
      console.log('   ❌ API PUT không thành công:', data.message);
    }
  })
  .catch(error => {
    console.error('   ❌ API PUT Error:', error);
  });
}

console.log('\n=== Kết thúc test ===');

// Hàm helper để test edit từng field
window.testEditField = async (field, value) => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    console.error('Không có token');
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

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Cập nhật ${field} thành công:`, result);
      
      // Cập nhật sessionStorage
      sessionStorage.setItem('user', JSON.stringify(result.user));
      console.log('✅ Đã cập nhật sessionStorage');
      
      return result;
    } else {
      console.error(`❌ Lỗi cập nhật ${field}:`, result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('❌ Lỗi:', error);
    throw error;
  }
};

// Hàm helper để restore dữ liệu gốc
window.restoreOriginalData = async () => {
  const originalData = {
    full_name: 'Nguyễn Văn A',
    school: 'THPT Marie Curie',
    class: '12A4',
    date_of_birth: '2005-01-20',
    province: 'Hồ Chí Minh'
  };

  try {
    const result = await window.testEditField('full_name', originalData.full_name);
    await window.testEditField('school', originalData.school);
    await window.testEditField('class', originalData.class);
    await window.testEditField('date_of_birth', originalData.date_of_birth);
    await window.testEditField('province', originalData.province);
    
    console.log('✅ Đã khôi phục dữ liệu gốc');
    location.reload();
  } catch (error) {
    console.error('❌ Lỗi khi khôi phục:', error);
  }
};

console.log('\nSử dụng:');
console.log('  testEditField("full_name", "Tên mới") - Test chỉnh sửa tên');
console.log('  testEditField("school", "Trường mới") - Test chỉnh sửa trường');
console.log('  testEditField("province", "Tỉnh mới") - Test chỉnh sửa tỉnh');
console.log('  restoreOriginalData() - Khôi phục dữ liệu gốc'); 