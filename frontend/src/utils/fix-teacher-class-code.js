// Script khắc phục vấn đề classCode cho teacher components
import AuthStorage from './authStorage';

console.log('🔧 Teacher Class Code Fix Script Started...');

// 1. Phát hiện và sửa classId "N/A" trong teacher URLs
export const fixTeacherClassCodeInURL = () => {
  const currentURL = window.location.pathname;
  console.log('🔍 Current Teacher URL:', currentURL);
  
  if (currentURL.includes('/teacher/class/N/A/') || currentURL.includes('/teacher/class/undefined/')) {
    console.log('⚠️ Detected invalid classId in teacher URL, attempting to fix...');
    
    // Thử lấy classId từ AuthStorage
    const classInfo = AuthStorage.getClassInfo();
    if (classInfo && classInfo.id && classInfo.id !== 'N/A') {
      const fixedURL = currentURL.replace(/\/teacher\/class\/(N\/A|undefined)\//, `/teacher/class/${classInfo.id}/`);
      console.log('🔄 Fixing teacher URL from:', currentURL);
      console.log('🔄 Fixing teacher URL to:', fixedURL);
      
      window.history.replaceState(null, '', fixedURL);
      console.log('✅ Teacher URL fixed successfully');
      return true;
    }
    
    // Nếu không có trong AuthStorage, sử dụng default classId
    const defaultClassId = '10';
    const fixedURL = currentURL.replace(/\/teacher\/class\/(N\/A|undefined)\//, `/teacher/class/${defaultClassId}/`);
    console.log('🔄 Using default classId, fixing URL to:', fixedURL);
    
    // Tạo classInfo mặc định cho teacher
    const defaultClassInfo = {
      id: defaultClassId,
      name: 'Lớp học mặc định',
      code: 'DEFAULT',
      teacher: 'Giáo viên',
    };
    
    AuthStorage.setClassInfo(defaultClassInfo);
    window.history.replaceState(null, '', fixedURL);
    console.log('✅ Teacher URL fixed with default classId');
    return true;
  }
  
  console.log('✅ Teacher URL is already correct');
  return false;
};

// 2. Lấy classId từ teacher URL hiện tại
export const getTeacherClassIdFromURL = () => {
  const pathMatch = window.location.pathname.match(/\/teacher\/class\/([^\/]+)/);
  const classId = pathMatch ? pathMatch[1] : null;
  console.log('🔍 Extracted teacher classId from URL:', classId);
  return classId;
};

// 3. Đảm bảo classInfo có classId đúng cho teacher
export const ensureCorrectTeacherClassId = () => {
  console.log('🔧 Ensuring correct teacher classId...');
  
  const urlClassId = getTeacherClassIdFromURL();
  const classInfo = AuthStorage.getClassInfo();
  
  console.log('Teacher URL classId:', urlClassId);
  console.log('Stored classInfo:', classInfo);
  
  // Nếu URL có classId hợp lệ nhưng classInfo không có hoặc khác
  if (urlClassId && urlClassId !== 'N/A' && urlClassId !== 'undefined') {
    if (!classInfo || classInfo.id != urlClassId) {
      console.log('🔄 Updating classInfo to match teacher URL classId');
      
      const updatedClassInfo = {
        id: urlClassId,
        name: classInfo?.name || `Lớp học ${urlClassId}`,
        code: classInfo?.code || urlClassId,
        teacher: classInfo?.teacher || 'Giáo viên',
      };
      
      AuthStorage.setClassInfo(updatedClassInfo);
      console.log('✅ Teacher ClassInfo updated:', updatedClassInfo);
      return updatedClassInfo;
    }
  }
  
  // Nếu URL có invalid classId, fix nó
  if (urlClassId === 'N/A' || urlClassId === 'undefined') {
    fixTeacherClassCodeInURL();
  }
  
  return classInfo;
};

// 4. Monitor teacher URL changes và tự động fix
export const startTeacherClassCodeMonitor = () => {
  console.log('👀 Starting teacher classCode monitor...');
  
  // Check ngay lập tức
  fixTeacherClassCodeInURL();
  ensureCorrectTeacherClassId();
  
  // Monitor popstate events
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (window.location.pathname.includes('/teacher/class/')) {
        fixTeacherClassCodeInURL();
        ensureCorrectTeacherClassId();
      }
    }, 100);
  });
  
  // Monitor URL changes (for SPA)
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl && url.includes('/teacher/class/')) {
      lastUrl = url;
      setTimeout(() => {
        fixTeacherClassCodeInURL();
        ensureCorrectTeacherClassId();
      }, 100);
    }
  });
  
  urlObserver.observe(document, { subtree: true, childList: true });
  
  console.log('✅ Teacher ClassCode monitor started');
};

// 5. Force navigate với teacher classId đúng
export const forceTeacherNavigateWithCorrectClassId = (targetPage = 'assignments') => {
  console.log('🚀 Force teacher navigating with correct classId to:', targetPage);
  
  let classId = getTeacherClassIdFromURL();
  
  // Nếu classId từ URL không hợp lệ, lấy từ storage
  if (!classId || classId === 'N/A' || classId === 'undefined') {
    const classInfo = AuthStorage.getClassInfo();
    classId = classInfo?.id || '10';
  }
  
  const targetURL = `/teacher/class/${classId}/${targetPage}`;
  console.log('🔄 Teacher navigating to:', targetURL);
  
  window.history.pushState(null, '', targetURL);
  window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  
  // Verify navigation
  setTimeout(() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes(`/${targetPage}`) && !currentPath.includes('/N/A/') && !currentPath.includes('/undefined/')) {
      console.log('✅ Teacher navigation successful');
    } else {
      console.warn('⚠️ Teacher navigation may have failed. Current path:', currentPath);
    }
  }, 500);
};

// 6. Debug function cho teacher
export const debugTeacherClassCode = () => {
  console.log('\n🔍 Teacher ClassCode Debug Info:');
  console.log('  Current URL:', window.location.pathname);
  console.log('  URL ClassId:', getTeacherClassIdFromURL());
  console.log('  Stored ClassInfo:', AuthStorage.getClassInfo());
  console.log('  Has invalid classId in URL:', 
    window.location.pathname.includes('/N/A/') || 
    window.location.pathname.includes('/undefined/')
  );
  
  const classInfo = AuthStorage.getClassInfo();
  if (classInfo) {
    console.log('  ClassInfo ID:', classInfo.id);
    console.log('  ClassInfo Name:', classInfo.name);
    console.log('  ClassInfo Code:', classInfo.code);
  } else {
    console.log('  ❌ No ClassInfo in storage');
  }
};

// 7. Emergency fix cho teacher
export const emergencyTeacherClassCodeFix = () => {
  console.log('🚨 Emergency Teacher ClassCode Fix...');
  
  // 1. Fix URL
  fixTeacherClassCodeInURL();
  
  // 2. Ensure classInfo
  ensureCorrectTeacherClassId();
  
  // 3. Force reload current page with correct classId
  const currentPage = window.location.pathname.split('/').pop() || 'assignments';
  forceTeacherNavigateWithCorrectClassId(currentPage);
  
  // 4. Debug
  setTimeout(() => {
    debugTeacherClassCode();
  }, 1000);
  
  console.log('✅ Teacher emergency fix completed');
};

// Auto-start monitor if on teacher pages
if (window.location.pathname.includes('/teacher/class/')) {
  startTeacherClassCodeMonitor();
}

// Export to window for console access
window.fixTeacherClassCodeInURL = fixTeacherClassCodeInURL;
window.getTeacherClassIdFromURL = getTeacherClassIdFromURL;
window.ensureCorrectTeacherClassId = ensureCorrectTeacherClassId;
window.forceTeacherNavigateWithCorrectClassId = forceTeacherNavigateWithCorrectClassId;
window.debugTeacherClassCode = debugTeacherClassCode;
window.emergencyTeacherClassCodeFix = emergencyTeacherClassCodeFix;

console.log('🎉 Teacher ClassCode fix tools loaded!');
console.log('Available commands:');
console.log('  debugTeacherClassCode() - Check current teacher classCode status');
console.log('  emergencyTeacherClassCodeFix() - Fix all teacher classCode issues');
console.log('  forceTeacherNavigateWithCorrectClassId("create-assignment") - Navigate to specific page');
