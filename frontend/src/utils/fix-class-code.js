// Script khắc phục vấn đề classCode bị "N/A" và đảm bảo tất cả trang nhận được mã lớp đúng
import AuthStorage from './authStorage';

console.log('🔧 Class Code Fix Script Started...');

// 1. Phát hiện và sửa URL có classCode = "N/A"
export const fixClassCodeInURL = () => {
  const currentURL = window.location.pathname;
  console.log('🔍 Current URL:', currentURL);
  
  if (currentURL.includes('/student/class/N/A/')) {
    console.log('⚠️ Detected N/A in URL, attempting to fix...');
    
    // Thử lấy classCode từ AuthStorage
    const classInfo = AuthStorage.getClassInfo();
    if (classInfo && classInfo.code && classInfo.code !== 'N/A') {
      const fixedURL = currentURL.replace('/student/class/N/A/', `/student/class/${classInfo.code}/`);
      console.log('🔄 Fixing URL from:', currentURL);
      console.log('🔄 Fixing URL to:', fixedURL);
      
      window.history.replaceState(null, '', fixedURL);
      console.log('✅ URL fixed successfully');
      return true;
    }
    
    // Nếu không có trong AuthStorage, sử dụng default classCode
    const defaultClassCode = '2WVEE';
    const fixedURL = currentURL.replace('/student/class/N/A/', `/student/class/${defaultClassCode}/`);
    console.log('🔄 Using default classCode, fixing URL to:', fixedURL);
    
    // Tạo classInfo mặc định
    const defaultClassInfo = {
      id: 1,
      name: 'Lớp học mặc định',
      code: defaultClassCode,
      teacher: 'Giáo viên',
      image: 'https://i.imgur.com/0y8Ftya.jpg',
      students: 0,
      lectures: 0,
      homeworks: 0,
      materials: 0,
    };
    
    AuthStorage.setClassInfo(defaultClassInfo);
    window.history.replaceState(null, '', fixedURL);
    console.log('✅ URL fixed with default classCode');
    return true;
  }
  
  console.log('✅ URL is already correct');
  return false;
};

// 2. Lấy classCode từ URL hiện tại
export const getClassCodeFromURL = () => {
  const pathMatch = window.location.pathname.match(/\/student\/class\/([^\/]+)/);
  const classCode = pathMatch ? pathMatch[1] : null;
  console.log('🔍 Extracted classCode from URL:', classCode);
  return classCode;
};

// 3. Đảm bảo classInfo có classCode đúng
export const ensureCorrectClassCode = () => {
  console.log('🔧 Ensuring correct classCode...');
  
  const urlClassCode = getClassCodeFromURL();
  const classInfo = AuthStorage.getClassInfo();
  
  console.log('URL classCode:', urlClassCode);
  console.log('Stored classInfo:', classInfo);
  
  // Nếu URL có classCode hợp lệ nhưng classInfo không có hoặc khác
  if (urlClassCode && urlClassCode !== 'N/A') {
    if (!classInfo || classInfo.code !== urlClassCode) {
      console.log('🔄 Updating classInfo to match URL classCode');
      
      const updatedClassInfo = {
        id: classInfo?.id || 1,
        name: classInfo?.name || 'Lớp học',
        code: urlClassCode,
        teacher: classInfo?.teacher || 'Giáo viên',
        image: classInfo?.image || 'https://i.imgur.com/0y8Ftya.jpg',
        students: classInfo?.students || 0,
        lectures: classInfo?.lectures || 0,
        homeworks: classInfo?.homeworks || 0,
        materials: classInfo?.materials || 0,
      };
      
      AuthStorage.setClassInfo(updatedClassInfo);
      console.log('✅ ClassInfo updated:', updatedClassInfo);
      return updatedClassInfo;
    }
  }
  
  // Nếu URL có N/A, fix nó
  if (urlClassCode === 'N/A') {
    fixClassCodeInURL();
  }
  
  return classInfo;
};

// 4. Monitor URL changes và tự động fix
export const startClassCodeMonitor = () => {
  console.log('👀 Starting classCode monitor...');
  
  // Only run this monitor on student class routes to avoid noise on admin/teacher pages
  if (!window.location.pathname.includes('/student/class/')) {
    console.log('ℹ️ Skipping classCode monitor: not on /student/class/ route');
    return;
  }

  // Check ngay lập tức
  fixClassCodeInURL();
  ensureCorrectClassCode();
  
  // Monitor popstate events
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      fixClassCodeInURL();
      ensureCorrectClassCode();
    }, 100);
  });
  
  // Monitor URL changes (for SPA)
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        fixClassCodeInURL();
        ensureCorrectClassCode();
      }, 100);
    }
  });
  
  urlObserver.observe(document, { subtree: true, childList: true });
  
  console.log('✅ ClassCode monitor started');
};

// 5. Force navigate với classCode đúng
export const forceNavigateWithCorrectClassCode = (targetPage = 'members') => {
  console.log('🚀 Force navigating with correct classCode to:', targetPage);
  
  let classCode = getClassCodeFromURL();
  
  // Nếu classCode từ URL không hợp lệ, lấy từ storage
  if (!classCode || classCode === 'N/A') {
    const classInfo = AuthStorage.getClassInfo();
    classCode = classInfo?.code || '2WVEE';
  }
  
  const targetURL = `/student/class/${classCode}/${targetPage}`;
  console.log('🔄 Navigating to:', targetURL);
  
  window.history.pushState(null, '', targetURL);
  window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  
  // Verify navigation
  setTimeout(() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes(`/${targetPage}`) && !currentPath.includes('/N/A/')) {
      console.log('✅ Navigation successful');
    } else {
      console.warn('⚠️ Navigation may have failed. Current path:', currentPath);
    }
  }, 500);
};

// 6. Debug function để kiểm tra trạng thái
export const debugClassCode = () => {
  console.log('\n🔍 ClassCode Debug Info:');
  console.log('  Current URL:', window.location.pathname);
  console.log('  URL ClassCode:', getClassCodeFromURL());
  console.log('  Stored ClassInfo:', AuthStorage.getClassInfo());
  console.log('  Has N/A in URL:', window.location.pathname.includes('/N/A/'));
  
  const classInfo = AuthStorage.getClassInfo();
  if (classInfo) {
    console.log('  ClassInfo Code:', classInfo.code);
    console.log('  ClassInfo Name:', classInfo.name);
  } else {
    console.log('  ❌ No ClassInfo in storage');
  }
};

// 7. Emergency fix - khôi phục tất cả
export const emergencyClassCodeFix = () => {
  console.log('🚨 Emergency ClassCode Fix...');
  
  // 1. Fix URL
  fixClassCodeInURL();
  
  // 2. Ensure classInfo
  ensureCorrectClassCode();
  
  // 3. Force reload current page with correct classCode
  const currentPage = window.location.pathname.split('/').pop() || 'announcement';
  forceNavigateWithCorrectClassCode(currentPage);
  
  // 4. Debug
  setTimeout(() => {
    debugClassCode();
  }, 1000);
  
  console.log('✅ Emergency fix completed');
};

// Auto-start monitor ONLY on student class routes
if (window.location.pathname.includes('/student/class/')) {
  startClassCodeMonitor();
}

// Export to window for console access
window.fixClassCodeInURL = fixClassCodeInURL;
window.getClassCodeFromURL = getClassCodeFromURL;
window.ensureCorrectClassCode = ensureCorrectClassCode;
window.forceNavigateWithCorrectClassCode = forceNavigateWithCorrectClassCode;
window.debugClassCode = debugClassCode;
window.emergencyClassCodeFix = emergencyClassCodeFix;

console.log('🎉 ClassCode fix tools loaded!');
console.log('Available commands:');
console.log('  debugClassCode() - Check current classCode status');
console.log('  emergencyClassCodeFix() - Fix all classCode issues');
console.log('  forceNavigateWithCorrectClassCode("members") - Navigate to specific page');
