// Test logic điểm danh
export const testAttendanceLogic = () => {
  console.log('🧪 Testing Attendance Logic...');
  
  // Test case 1: Chọn tất cả học sinh
  const students = [
    { id: 1, name: "Nguyễn Văn A", checked: false },
    { id: 2, name: "Trần Thị B", checked: false },
    { id: 3, name: "Lê Văn C", checked: false },
    { id: 4, name: "Phạm Thị D", checked: false },
    { id: 5, name: "Hoàng Văn E", checked: false }
  ];
  
  const selectedStudents = [];
  const filteredStudents = students.filter(s => !s.checked); // Chưa điểm danh
  
  console.log('📋 Test Case 1: Chọn tất cả học sinh chưa điểm danh');
  console.log('  - Tổng học sinh:', students.length);
  console.log('  - Học sinh chưa điểm danh:', filteredStudents.length);
  console.log('  - Học sinh đã chọn:', selectedStudents.length);
  
  // Simulate chọn tất cả
  const allSelected = filteredStudents.every(student => selectedStudents.includes(student.id));
  console.log('  - Tất cả đã được chọn:', allSelected);
  
  if (!allSelected) {
    const allFilteredStudentIds = filteredStudents.map(s => s.id);
    console.log('  - Chọn tất cả:', allFilteredStudentIds);
  }
  
  // Test case 2: Kiểm tra logic checkbox
  const areAllFilteredStudentsSelected = filteredStudents.length > 0 && 
    filteredStudents.every(student => selectedStudents.includes(student.id));
  
  console.log('  - Checkbox "Chọn tất cả" nên checked:', areAllFilteredStudentsSelected);
  
  // Test case 3: Điểm danh
  console.log('\n📋 Test Case 2: Điểm danh');
  const studentsToMark = [1, 2, 3]; // Chọn 3 học sinh đầu
  
  const updatedStudents = students.map(student => 
    studentsToMark.includes(student.id) 
      ? { ...student, checked: true, time: "1 tháng 8 lúc 12:42" }
      : student
  );
  
  console.log('  - Học sinh được điểm danh:', studentsToMark);
  console.log('  - Kết quả sau điểm danh:');
  updatedStudents.forEach(student => {
    console.log(`    ${student.name}: ${student.checked ? 'Đã điểm danh' : 'Chưa điểm danh'}`);
  });
  
  // Test case 4: Kiểm tra số lượng
  const checkedCount = updatedStudents.filter(s => s.checked).length;
  const notCheckedCount = updatedStudents.filter(s => !s.checked).length;
  
  console.log('\n📋 Test Case 3: Thống kê');
  console.log('  - Đã điểm danh:', checkedCount);
  console.log('  - Chưa điểm danh:', notCheckedCount);
  console.log('  - Tổng:', checkedCount + notCheckedCount);
  
  // Validation
  if (checkedCount + notCheckedCount !== students.length) {
    console.error('❌ Lỗi: Tổng số không khớp!');
  } else {
    console.log('✅ Validation: Tổng số khớp');
  }
  
  return {
    students: updatedStudents,
    checkedCount,
    notCheckedCount,
    isValid: checkedCount + notCheckedCount === students.length
  };
};

// Test logic filter
export const testFilterLogic = () => {
  console.log('\n🧪 Testing Filter Logic...');
  
  const students = [
    { id: 1, name: "Nguyễn Văn A", checked: true, time: "1 tháng 8 lúc 12:42" },
    { id: 2, name: "Trần Thị B", checked: true, time: "1 tháng 8 lúc 12:45" },
    { id: 3, name: "Lê Văn C", checked: false },
    { id: 4, name: "Phạm Thị D", checked: true, time: "1 tháng 8 lúc 12:50" },
    { id: 5, name: "Hoàng Văn E", checked: false }
  ];
  
  // Test filter "Đã điểm danh"
  const checkedStudents = students.filter(s => s.checked);
  console.log('📋 Filter "Đã điểm danh":', checkedStudents.length, 'học sinh');
  
  // Test filter "Chưa điểm danh"
  const notCheckedStudents = students.filter(s => !s.checked);
  console.log('📋 Filter "Chưa điểm danh":', notCheckedStudents.length, 'học sinh');
  
  // Test search filter
  const searchTerm = "Nguyễn";
  const searchResults = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log('📋 Search "Nguyễn":', searchResults.length, 'học sinh');
  
  return {
    checkedStudents,
    notCheckedStudents,
    searchResults
  };
};

// Chạy test
if (typeof window !== 'undefined') {
  window.testAttendanceLogic = testAttendanceLogic;
  window.testFilterLogic = testFilterLogic;
  console.log('🧪 Attendance logic tests loaded. Run testAttendanceLogic() or testFilterLogic() to test.');
} 