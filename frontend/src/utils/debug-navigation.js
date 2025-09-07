// Debug script để kiểm tra vấn đề navigation trong StudentClassDetailPage
import AuthStorage from './authStorage';

console.log('🔧 Navigation Debug Script Started...');

// 1. Kiểm tra trạng thái routing hiện tại
export const debugNavigation = () => {
  console.log('\n📍 Current Navigation State:');
  console.log('  Current URL:', window.location.href);
  console.log('  Pathname:', window.location.pathname);
  console.log('  Hash:', window.location.hash);
  console.log('  Search:', window.location.search);
  
  // Kiểm tra React Router state nếu có
  if (window.history && window.history.state) {
    console.log('  History State:', window.history.state);
  }
};

// 2. Kiểm tra authentication state
export const debugAuth = () => {
  console.log('\n🔐 Authentication State:');
  AuthStorage.debugAuth();
};

// 3. Test navigation đến các tab khác nhau
export const testNavigation = (classCode = '2WVEE') => {
  console.log('\n🧪 Testing Navigation...');
  
  const testRoutes = [
    `/student/class/${classCode}/announcement`,
    `/student/class/${classCode}/members`,
    `/student/class/${classCode}/schedule`,
    `/student/class/${classCode}/homework`,
    `/student/class/${classCode}/materials`
  ];
  
  testRoutes.forEach((route, index) => {
    setTimeout(() => {
      console.log(`🔄 Testing route ${index + 1}: ${route}`);
      window.history.pushState(null, '', route);
      
      // Trigger popstate event để React Router nhận biết
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      
      setTimeout(() => {
        console.log(`  ✅ Current URL after navigation: ${window.location.pathname}`);
        debugAuth();
      }, 500);
      
    }, index * 2000);
  });
};

// 4. Fix navigation issue bằng cách clear problematic redirects
export const fixNavigationRedirect = () => {
  console.log('\n🔧 Fixing Navigation Redirects...');
  
  // Override Navigate component behavior tạm thời
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  window.history.pushState = function(state, title, url) {
    console.log('🔄 pushState called:', { state, title, url });
    
    // Ngăn redirect về announcement nếu đang navigate đến members
    if (url && url.includes('/members') && window.location.pathname.includes('/announcement')) {
      console.log('⚠️ Preventing unwanted redirect from members to announcement');
      return;
    }
    
    return originalPushState.call(this, state, title, url);
  };
  
  window.history.replaceState = function(state, title, url) {
    console.log('🔄 replaceState called:', { state, title, url });
    
    // Ngăn replace về announcement nếu đang ở members
    if (url && url.includes('/announcement') && window.location.pathname.includes('/members')) {
      console.log('⚠️ Preventing unwanted replace from members to announcement');
      return;
    }
    
    return originalReplaceState.call(this, state, title, url);
  };
  
  console.log('✅ Navigation redirect fix applied');
};

// 5. Monitor navigation changes
export const monitorNavigation = () => {
  console.log('\n👀 Starting Navigation Monitor...');
  
  // Listen for popstate events
  window.addEventListener('popstate', (event) => {
    console.log('📍 Navigation changed (popstate):', {
      pathname: window.location.pathname,
      state: event.state,
      timestamp: new Date().toISOString()
    });
    
    // Check if classInfo is still available
    const classInfo = AuthStorage.getClassInfo();
    if (!classInfo) {
      console.warn('⚠️ ClassInfo lost during navigation!');
    } else {
      console.log('✅ ClassInfo preserved:', classInfo.name);
    }
  });
  
  // Listen for hash changes
  window.addEventListener('hashchange', (event) => {
    console.log('📍 Hash changed:', {
      oldURL: event.oldURL,
      newURL: event.newURL,
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('✅ Navigation monitor started');
};

// 6. Force navigate to members tab
export const forceNavigateToMembers = (classCode = '2WVEE') => {
  console.log('\n🚀 Force navigating to members tab...');
  
  const membersUrl = `/student/class/${classCode}/members`;
  console.log('Target URL:', membersUrl);
  
  // Clear any existing redirects
  fixNavigationRedirect();
  
  // Navigate using multiple methods to ensure it works
  window.history.pushState(null, '', membersUrl);
  window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  
  setTimeout(() => {
    if (window.location.pathname.includes('/members')) {
      console.log('✅ Successfully navigated to members tab');
    } else {
      console.error('❌ Failed to navigate to members tab');
      console.log('Current URL:', window.location.pathname);
    }
  }, 1000);
};

// Auto-start monitoring
monitorNavigation();

// Export to window for console access
window.debugNavigation = debugNavigation;
window.debugAuth = debugAuth;
window.testNavigation = testNavigation;
window.fixNavigationRedirect = fixNavigationRedirect;
window.forceNavigateToMembers = forceNavigateToMembers;

console.log('🎉 Navigation debug tools loaded!');
console.log('Available commands:');
console.log('  debugNavigation() - Check current navigation state');
console.log('  debugAuth() - Check authentication state');
console.log('  testNavigation() - Test navigation to all tabs');
console.log('  fixNavigationRedirect() - Fix redirect issues');
console.log('  forceNavigateToMembers() - Force navigate to members tab');
