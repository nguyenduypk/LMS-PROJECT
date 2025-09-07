// Script khắc phục vấn đề navigation bị redirect về tab thông báo khi click vào thành viên
import AuthStorage from './authStorage';

console.log('🔧 Members Navigation Fix Script Started...');

// 1. Khắc phục vấn đề redirect
export const fixMembersNavigation = () => {
  console.log('🔧 Applying members navigation fix...');
  
  // Lưu lại các method gốc
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  // Override pushState để ngăn redirect không mong muốn
  window.history.pushState = function(state, title, url) {
    console.log('📍 pushState intercepted:', { url, currentPath: window.location.pathname });
    
    // Nếu đang cố navigate đến members, không cho redirect về announcement
    if (url && url.includes('/announcement') && window.location.pathname.includes('/members')) {
      console.log('⚠️ Blocked redirect from members to announcement');
      return;
    }
    
    return originalPushState.call(this, state, title, url);
  };
  
  // Override replaceState để ngăn replace không mong muốn
  window.history.replaceState = function(state, title, url) {
    console.log('📍 replaceState intercepted:', { url, currentPath: window.location.pathname });
    
    // Nếu đang cố replace về announcement từ members, chặn lại
    if (url && url.includes('/announcement') && window.location.pathname.includes('/members')) {
      console.log('⚠️ Blocked replace from members to announcement');
      return;
    }
    
    return originalReplaceState.call(this, state, title, url);
  };
  
  console.log('✅ Navigation fix applied');
};

// 2. Force navigate đến members tab
export const forceNavigateToMembers = (classCode) => {
  if (!classCode) {
    // Thử extract classCode từ URL hiện tại
    const pathMatch = window.location.pathname.match(/\/student\/class\/([^\/]+)/);
    classCode = pathMatch ? pathMatch[1] : '2WVEE';
  }
  
  console.log('🚀 Force navigating to members tab for class:', classCode);
  
  const membersUrl = `/student/class/${classCode}/members`;
  
  // Apply fix trước khi navigate
  fixMembersNavigation();
  
  // Clear any existing timers or redirects
  if (window.navigationTimer) {
    clearTimeout(window.navigationTimer);
  }
  
  // Navigate ngay lập tức
  window.history.pushState(null, '', membersUrl);
  
  // Trigger React Router update
  window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  
  // Verify navigation sau 500ms
  window.navigationTimer = setTimeout(() => {
    if (window.location.pathname.includes('/members')) {
      console.log('✅ Successfully navigated to members tab');
    } else {
      console.warn('⚠️ Navigation may have been redirected. Current path:', window.location.pathname);
      // Thử lại một lần nữa
      window.history.replaceState(null, '', membersUrl);
    }
  }, 500);
};

// 3. Monitor và log tất cả navigation events
export const startNavigationMonitor = () => {
  console.log('👀 Starting navigation monitor...');
  
  // Monitor popstate
  window.addEventListener('popstate', (event) => {
    console.log('📍 Navigation (popstate):', {
      pathname: window.location.pathname,
      state: event.state,
      timestamp: new Date().toISOString()
    });
    
    // Kiểm tra nếu bị redirect về announcement khi muốn đến members
    if (window.location.pathname.includes('/announcement') && 
        document.referrer && document.referrer.includes('/members')) {
      console.warn('⚠️ Detected unwanted redirect from members to announcement!');
    }
  });
  
  // Monitor hash changes
  window.addEventListener('hashchange', (event) => {
    console.log('📍 Hash change:', {
      oldURL: event.oldURL,
      newURL: event.newURL
    });
  });
  
  // Monitor URL changes (for SPA)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      console.log('📍 URL changed:', { from: lastUrl, to: url });
      lastUrl = url;
      
      // Check authentication state on URL change
      const user = AuthStorage.getUser();
      const classInfo = AuthStorage.getClassInfo();
      if (!user || !classInfo) {
        console.warn('⚠️ Authentication data lost during navigation!');
      }
    }
  }).observe(document, { subtree: true, childList: true });
  
  console.log('✅ Navigation monitor started');
};

// 4. Test function để verify fix
export const testMembersNavigation = () => {
  console.log('🧪 Testing members navigation...');
  
  const classCode = '2WVEE'; // Default test class
  
  // Test sequence
  const testSteps = [
    () => {
      console.log('Step 1: Navigate to announcement');
      window.history.pushState(null, '', `/student/class/${classCode}/announcement`);
    },
    () => {
      console.log('Step 2: Navigate to members');
      forceNavigateToMembers(classCode);
    },
    () => {
      console.log('Step 3: Verify we are still on members');
      const currentPath = window.location.pathname;
      if (currentPath.includes('/members')) {
        console.log('✅ Test passed: Still on members tab');
      } else {
        console.error('❌ Test failed: Redirected to', currentPath);
      }
    }
  ];
  
  testSteps.forEach((step, index) => {
    setTimeout(step, index * 1000);
  });
};

// 5. Emergency fix - nếu đã bị redirect
export const emergencyFixNavigation = () => {
  console.log('🚨 Applying emergency navigation fix...');
  
  // Stop all navigation redirects
  const stopRedirect = () => {
    window.stop();
    if (window.location.pathname.includes('/announcement')) {
      const classCode = window.location.pathname.match(/\/student\/class\/([^\/]+)/)?.[1];
      if (classCode) {
        const membersUrl = `/student/class/${classCode}/members`;
        window.history.replaceState(null, '', membersUrl);
        console.log('🔄 Forced redirect to members:', membersUrl);
      }
    }
  };
  
  // Apply immediately
  stopRedirect();
  
  // Also apply on next tick
  setTimeout(stopRedirect, 0);
  setTimeout(stopRedirect, 100);
  
  console.log('✅ Emergency fix applied');
};

// Auto-start monitoring và apply fix
fixMembersNavigation();
startNavigationMonitor();

// Export to window for console access
window.fixMembersNavigation = fixMembersNavigation;
window.forceNavigateToMembers = forceNavigateToMembers;
window.testMembersNavigation = testMembersNavigation;
window.emergencyFixNavigation = emergencyFixNavigation;

console.log('🎉 Members navigation fix loaded!');
console.log('Available commands:');
console.log('  forceNavigateToMembers() - Force navigate to members tab');
console.log('  testMembersNavigation() - Test navigation fix');
console.log('  emergencyFixNavigation() - Emergency fix if stuck on announcement');
