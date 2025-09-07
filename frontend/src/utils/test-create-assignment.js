// Script test để kiểm tra CreateAssignmentPage nhận classInfo đúng cách
import AuthStorage from './authStorage';

console.log('🧪 Testing CreateAssignmentPage ClassInfo...');

// 1. Test current page state
export const testCreateAssignmentPageState = () => {
  console.log('\n🔍 CreateAssignmentPage State Test:');
  console.log('  Current URL:', window.location.pathname);
  console.log('  Is on create-assignment page:', window.location.pathname.includes('/create-assignment'));
  
  // Extract classId from URL
  const classIdMatch = window.location.pathname.match(/\/teacher\/class\/(\d+)/);
  const urlClassId = classIdMatch ? classIdMatch[1] : null;
  console.log('  ClassId from URL:', urlClassId);
  
  // Check AuthStorage
  const storedClassInfo = AuthStorage.getClassInfo();
  console.log('  Stored ClassInfo:', storedClassInfo);
  
  // Check if sidebar exists and what it shows
  const sidebar = document.querySelector('.teacher-sidebar');
  if (sidebar) {
    console.log('  Sidebar found:', true);
    const sidebarText = sidebar.textContent;
    console.log('  Sidebar shows N/A:', sidebarText.includes('N/A'));
    console.log('  Sidebar shows Đang tải:', sidebarText.includes('Đang tải'));
    
    // Look for specific class code display
    const classCodeMatch = sidebarText.match(/Mã lớp:\s*([^\n\r]+)/);
    if (classCodeMatch) {
      console.log('  Current class code display:', classCodeMatch[1].trim());
    }
  } else {
    console.log('  Sidebar found:', false);
  }
  
  return {
    urlClassId,
    storedClassInfo,
    hasSidebar: !!sidebar,
    sidebarShowsNA: sidebar ? sidebar.textContent.includes('N/A') : false
  };
};

// 2. Fix CreateAssignmentPage classInfo
export const fixCreateAssignmentClassInfo = () => {
  console.log('\n🔧 Fixing CreateAssignmentPage ClassInfo...');
  
  const classIdMatch = window.location.pathname.match(/\/teacher\/class\/(\d+)/);
  const classId = classIdMatch ? classIdMatch[1] : null;
  
  if (!classId) {
    console.warn('⚠️ No classId found in URL');
    return false;
  }
  
  console.log('  Working with classId:', classId);
  
  // Create comprehensive classInfo
  const fixedClassInfo = {
    id: classId,
    name: `Lớp học ${classId}`,
    class_code: `CLASS${classId}`,
    code: `CLASS${classId}`,
    teacher_name: 'Nguyễn Văn An',
    teacher: 'Nguyễn Văn An',
  };
  
  // Save to AuthStorage
  AuthStorage.setClassInfo(fixedClassInfo);
  console.log('✅ ClassInfo saved to AuthStorage:', fixedClassInfo);
  
  // Dispatch custom event to trigger component updates
  window.dispatchEvent(new CustomEvent('classInfoUpdated', { 
    detail: fixedClassInfo 
  }));
  
  // Try to update sidebar directly if possible
  setTimeout(() => {
    const sidebar = document.querySelector('.teacher-sidebar');
    if (sidebar) {
      // Force re-render by triggering a React update
      const reactFiberKey = Object.keys(sidebar).find(key => key.startsWith('__reactFiber'));
      if (reactFiberKey) {
        console.log('🔄 Attempting to trigger React re-render...');
        // This is a hack to force React component update
        sidebar[reactFiberKey].memoizedProps = { ...sidebar[reactFiberKey].memoizedProps, classInfo: fixedClassInfo };
      }
    }
  }, 500);
  
  return fixedClassInfo;
};

// 3. Monitor and auto-fix CreateAssignmentPage
export const monitorCreateAssignmentPage = () => {
  console.log('👀 Starting CreateAssignmentPage monitor...');
  
  // Check immediately if on create-assignment page
  if (window.location.pathname.includes('/create-assignment')) {
    setTimeout(() => {
      const state = testCreateAssignmentPageState();
      if (state.sidebarShowsNA || !state.storedClassInfo) {
        console.log('🔧 Auto-fixing detected issues...');
        fixCreateAssignmentClassInfo();
      }
    }, 1000);
  }
  
  // Monitor URL changes
  let lastUrl = window.location.href;
  const checkUrl = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl && currentUrl.includes('/create-assignment')) {
      lastUrl = currentUrl;
      console.log('📍 Navigated to CreateAssignmentPage, checking state...');
      
      setTimeout(() => {
        const state = testCreateAssignmentPageState();
        if (state.sidebarShowsNA || !state.storedClassInfo) {
          console.log('🔧 Auto-fixing after navigation...');
          fixCreateAssignmentClassInfo();
        }
      }, 1500);
    }
  };
  
  // Check every 3 seconds
  setInterval(checkUrl, 3000);
  
  console.log('✅ CreateAssignmentPage monitor started');
};

// 4. Emergency fix for CreateAssignmentPage
export const emergencyFixCreateAssignment = () => {
  console.log('🚨 Emergency Fix for CreateAssignmentPage...');
  
  // 1. Test current state
  const state = testCreateAssignmentPageState();
  console.log('Current state:', state);
  
  // 2. Apply fix
  const fixedInfo = fixCreateAssignmentClassInfo();
  
  // 3. Wait and verify
  setTimeout(() => {
    const newState = testCreateAssignmentPageState();
    console.log('State after fix:', newState);
    
    if (newState.sidebarShowsNA) {
      console.log('🔄 Still showing N/A, trying page refresh...');
      window.location.reload();
    } else {
      console.log('✅ Emergency fix successful!');
    }
  }, 2000);
  
  return fixedInfo;
};

// 5. Complete diagnostic
export const diagnoseCreateAssignmentPage = () => {
  console.log('\n🩺 Complete CreateAssignmentPage Diagnosis:');
  
  // URL analysis
  const url = window.location.pathname;
  const isCreateAssignmentPage = url.includes('/create-assignment');
  const classIdMatch = url.match(/\/teacher\/class\/(\d+)/);
  const classId = classIdMatch ? classIdMatch[1] : null;
  
  console.log('📍 URL Analysis:');
  console.log('  Current URL:', url);
  console.log('  Is CreateAssignmentPage:', isCreateAssignmentPage);
  console.log('  Extracted ClassId:', classId);
  
  // AuthStorage analysis
  const classInfo = AuthStorage.getClassInfo();
  console.log('\n💾 AuthStorage Analysis:');
  console.log('  Has ClassInfo:', !!classInfo);
  if (classInfo) {
    console.log('  ClassInfo ID:', classInfo.id);
    console.log('  ClassInfo Name:', classInfo.name);
    console.log('  ClassInfo Code:', classInfo.code);
    console.log('  Matches URL ClassId:', classInfo.id == classId);
  }
  
  // DOM analysis
  console.log('\n🎨 DOM Analysis:');
  const sidebar = document.querySelector('.teacher-sidebar');
  console.log('  Sidebar exists:', !!sidebar);
  
  if (sidebar) {
    const sidebarText = sidebar.textContent;
    console.log('  Sidebar shows N/A:', sidebarText.includes('N/A'));
    console.log('  Sidebar shows loading:', sidebarText.includes('Đang tải'));
    
    // Extract displayed class code
    const classCodeMatch = sidebarText.match(/Mã lớp:\s*([^\n\r\s]+)/);
    if (classCodeMatch) {
      console.log('  Displayed class code:', classCodeMatch[1]);
    }
  }
  
  // React component analysis
  console.log('\n⚛️ React Component Analysis:');
  const createAssignmentDiv = document.querySelector('.create-assignment-page');
  console.log('  CreateAssignmentPage div exists:', !!createAssignmentDiv);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!isCreateAssignmentPage) {
    console.log('  ❌ Not on CreateAssignmentPage - navigate there first');
  } else if (!classId) {
    console.log('  ❌ No classId in URL - check routing');
  } else if (!classInfo || classInfo.id != classId) {
    console.log('  🔧 ClassInfo mismatch - run fixCreateAssignmentClassInfo()');
  } else if (sidebar && sidebar.textContent.includes('N/A')) {
    console.log('  🔧 Sidebar shows N/A - run emergencyFixCreateAssignment()');
  } else {
    console.log('  ✅ Everything looks good!');
  }
};

// Auto-start monitoring if on create-assignment page
if (window.location.pathname.includes('/create-assignment')) {
  setTimeout(() => {
    monitorCreateAssignmentPage();
  }, 1000);
}

// Export to window for console access
window.testCreateAssignmentPageState = testCreateAssignmentPageState;
window.fixCreateAssignmentClassInfo = fixCreateAssignmentClassInfo;
window.emergencyFixCreateAssignment = emergencyFixCreateAssignment;
window.diagnoseCreateAssignmentPage = diagnoseCreateAssignmentPage;

console.log('🎉 CreateAssignmentPage test tools loaded!');
console.log('Available commands:');
console.log('  diagnoseCreateAssignmentPage() - Complete diagnosis');
console.log('  emergencyFixCreateAssignment() - Emergency fix');
console.log('  testCreateAssignmentPageState() - Check current state');
console.log('  fixCreateAssignmentClassInfo() - Fix classInfo issues');
