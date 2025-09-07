// Script test tất cả các trang để đảm bảo đều nhận được mã lớp đúng
import AuthStorage from './authStorage';

console.log('🧪 All Pages Test Script Started...');

// 1. Test tất cả các trang với classCode
export const testAllPagesWithClassCode = (classCode = '2WVEE') => {
  console.log('🧪 Testing all pages with classCode:', classCode);
  
  const pages = [
    'announcement',
    'schedule', 
    'members',
    'homework',
    'materials'
  ];
  
  const testResults = [];
  
  pages.forEach((page, index) => {
    setTimeout(() => {
      console.log(`\n🔄 Testing page ${index + 1}/${pages.length}: ${page}`);
      
      const targetURL = `/student/class/${classCode}/${page}`;
      console.log('  Target URL:', targetURL);
      
      // Navigate to page
      window.history.pushState(null, '', targetURL);
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      
      // Check after navigation
      setTimeout(() => {
        const currentURL = window.location.pathname;
        const hasCorrectClassCode = currentURL.includes(`/student/class/${classCode}/`);
        const hasNAClassCode = currentURL.includes('/N/A/');
        const classInfo = AuthStorage.getClassInfo();
        
        const result = {
          page,
          targetURL,
          currentURL,
          hasCorrectClassCode,
          hasNAClassCode,
          classInfoAvailable: !!classInfo,
          classInfoCode: classInfo?.code,
          success: hasCorrectClassCode && !hasNAClassCode && classInfo?.code === classCode
        };
        
        testResults.push(result);
        
        console.log('  Result:', result.success ? '✅ PASS' : '❌ FAIL');
        console.log('  Current URL:', currentURL);
        console.log('  ClassInfo Code:', classInfo?.code);
        console.log('  Has N/A:', hasNAClassCode);
        
        // If this is the last test, show summary
        if (testResults.length === pages.length) {
          showTestSummary(testResults);
        }
        
      }, 1000);
      
    }, index * 2000);
  });
};

// 2. Show test summary
const showTestSummary = (results) => {
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.page}: ${result.currentURL}`);
      if (result.hasNAClassCode) console.log(`    Issue: Has N/A in URL`);
      if (!result.classInfoAvailable) console.log(`    Issue: No classInfo available`);
      if (result.classInfoCode !== result.targetURL.split('/')[3]) {
        console.log(`    Issue: ClassInfo code mismatch`);
      }
    });
  }
  
  console.log('\n🎯 Overall Result:', failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
};

// 3. Quick test current page
export const testCurrentPage = () => {
  console.log('🧪 Testing current page...');
  
  const currentURL = window.location.pathname;
  const classCode = currentURL.match(/\/student\/class\/([^\/]+)/)?.[1];
  const classInfo = AuthStorage.getClassInfo();
  
  console.log('Current URL:', currentURL);
  console.log('Extracted ClassCode:', classCode);
  console.log('ClassInfo:', classInfo);
  
  const issues = [];
  
  if (classCode === 'N/A') {
    issues.push('❌ ClassCode is N/A in URL');
  }
  
  if (!classInfo) {
    issues.push('❌ No ClassInfo in storage');
  } else if (classInfo.code !== classCode) {
    issues.push(`❌ ClassInfo code (${classInfo.code}) doesn't match URL code (${classCode})`);
  }
  
  if (issues.length === 0) {
    console.log('✅ Current page is working correctly');
  } else {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log('  ' + issue));
  }
  
  return issues.length === 0;
};

// 4. Fix và test lại
export const fixAndRetest = () => {
  console.log('🔧 Fixing issues and retesting...');
  
  // Import và chạy emergency fix
  if (window.emergencyClassCodeFix) {
    window.emergencyClassCodeFix();
  }
  
  // Test lại sau khi fix
  setTimeout(() => {
    testCurrentPage();
  }, 2000);
};

// 5. Test navigation giữa các trang
export const testNavigation = () => {
  console.log('🧪 Testing navigation between pages...');
  
  const classCode = '2WVEE';
  const navigationSequence = [
    'announcement',
    'members',
    'schedule', 
    'homework',
    'materials',
    'members' // Test lại members để đảm bảo không bị redirect
  ];
  
  navigationSequence.forEach((page, index) => {
    setTimeout(() => {
      console.log(`\n🔄 Step ${index + 1}: Navigating to ${page}`);
      
      const targetURL = `/student/class/${classCode}/${page}`;
      window.history.pushState(null, '', targetURL);
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      
      setTimeout(() => {
        const currentURL = window.location.pathname;
        const isCorrect = currentURL.includes(`/${page}`) && !currentURL.includes('/N/A/');
        
        console.log(`  Result: ${isCorrect ? '✅' : '❌'} ${currentURL}`);
        
        if (!isCorrect) {
          console.log('  ⚠️ Navigation failed, attempting fix...');
          if (window.forceNavigateWithCorrectClassCode) {
            window.forceNavigateWithCorrectClassCode(page);
          }
        }
      }, 500);
      
    }, index * 1500);
  });
};

// 6. Monitor và auto-fix
export const startAutoMonitor = () => {
  console.log('👀 Starting auto-monitor for all pages...');
  
  let lastURL = window.location.href;
  
  const checkAndFix = () => {
    const currentURL = window.location.href;
    
    if (currentURL !== lastURL) {
      lastURL = currentURL;
      console.log('📍 URL changed:', currentURL);
      
      // Check for issues
      setTimeout(() => {
        const hasIssues = !testCurrentPage();
        if (hasIssues) {
          console.log('🔧 Auto-fixing detected issues...');
          if (window.emergencyClassCodeFix) {
            window.emergencyClassCodeFix();
          }
        }
      }, 500);
    }
  };
  
  // Check every 2 seconds
  setInterval(checkAndFix, 2000);
  
  console.log('✅ Auto-monitor started');
};

// Auto-start monitor
startAutoMonitor();

// Export to window for console access
window.testAllPagesWithClassCode = testAllPagesWithClassCode;
window.testCurrentPage = testCurrentPage;
window.fixAndRetest = fixAndRetest;
window.testNavigation = testNavigation;

console.log('🎉 All Pages Test Tools loaded!');
console.log('Available commands:');
console.log('  testCurrentPage() - Test current page');
console.log('  testAllPagesWithClassCode() - Test all pages');
console.log('  testNavigation() - Test navigation between pages');
console.log('  fixAndRetest() - Fix issues and retest');
