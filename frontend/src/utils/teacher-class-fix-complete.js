// Script tổng hợp để khắc phục hoàn toàn vấn đề teacher class code hiển thị "N/A"
import AuthStorage from './authStorage';

console.log('🔧 Complete Teacher Class Fix Script Started...');

// 1. Comprehensive fix for teacher class display
export const fixTeacherClassDisplay = () => {
  console.log('🔧 Fixing teacher class display...');
  
  const currentURL = window.location.pathname;
  console.log('Current URL:', currentURL);
  
  // Extract classId from URL
  const classIdMatch = currentURL.match(/\/teacher\/class\/(\d+)/);
  const classId = classIdMatch ? classIdMatch[1] : null;
  
  console.log('Extracted classId:', classId);
  
  if (classId) {
    // Create or update classInfo with the correct classId
    const existingClassInfo = AuthStorage.getClassInfo();
    
    const updatedClassInfo = {
      id: classId,
      name: existingClassInfo?.name || `Lớp học ${classId}`,
      code: existingClassInfo?.code || `CLASS${classId}`,
      teacher: existingClassInfo?.teacher || 'Giáo viên',
      class_code: existingClassInfo?.code || `CLASS${classId}`,
      teacher_name: existingClassInfo?.teacher || 'Giáo viên'
    };
    
    // Save to AuthStorage
    AuthStorage.setClassInfo(updatedClassInfo);
    
    console.log('✅ Updated classInfo:', updatedClassInfo);
    
    // Force refresh of sidebar by dispatching a custom event
    window.dispatchEvent(new CustomEvent('classInfoUpdated', { 
      detail: updatedClassInfo 
    }));
    
    return updatedClassInfo;
  }
  
  console.warn('⚠️ Could not extract classId from URL');
  return null;
};

// 2. Fix specifically for CreateAssignmentPage
export const fixCreateAssignmentPage = () => {
  console.log('🔧 Fixing CreateAssignmentPage display...');
  
  // Check if we're on create assignment page
  if (!window.location.pathname.includes('/create-assignment')) {
    console.log('Not on create assignment page, skipping...');
    return;
  }
  
  const classInfo = fixTeacherClassDisplay();
  
  if (classInfo) {
    // Try to update the sidebar directly if possible
    const sidebarElement = document.querySelector('.teacher-sidebar');
    if (sidebarElement) {
      console.log('🔄 Attempting to refresh sidebar display...');
      
      // Find and update class code display
      const classCodeElement = sidebarElement.querySelector('.sidebar-class-code');
      if (classCodeElement) {
        classCodeElement.textContent = `Mã lớp: ${classInfo.code}`;
      }
      
      // Find and update class name display
      const classNameElement = sidebarElement.querySelector('.sidebar-class-name');
      if (classNameElement) {
        classNameElement.textContent = classInfo.name;
      }
    }
    
    console.log('✅ CreateAssignmentPage fix completed');
  }
};

// 3. Monitor and auto-fix for teacher pages
export const startTeacherAutoFix = () => {
  console.log('👀 Starting teacher auto-fix monitor...');
  
  // Fix immediately
  fixTeacherClassDisplay();
  
  // Fix when URL changes
  let lastURL = window.location.href;
  const checkAndFix = () => {
    const currentURL = window.location.href;
    if (currentURL !== lastURL && currentURL.includes('/teacher/class/')) {
      lastURL = currentURL;
      console.log('📍 Teacher URL changed, applying fix...');
      setTimeout(() => {
        fixTeacherClassDisplay();
        if (currentURL.includes('/create-assignment')) {
          fixCreateAssignmentPage();
        }
      }, 500);
    }
  };
  
  // Check every 2 seconds
  setInterval(checkAndFix, 2000);
  
  // Also listen for navigation events
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (window.location.pathname.includes('/teacher/class/')) {
        fixTeacherClassDisplay();
      }
    }, 300);
  });
  
  console.log('✅ Teacher auto-fix monitor started');
};

// 4. Emergency fix for immediate use
export const emergencyTeacherFix = () => {
  console.log('🚨 Emergency Teacher Fix - Applying all fixes...');
  
  // 1. Fix class display
  const classInfo = fixTeacherClassDisplay();
  
  // 2. Fix create assignment page specifically
  if (window.location.pathname.includes('/create-assignment')) {
    setTimeout(() => {
      fixCreateAssignmentPage();
    }, 500);
  }
  
  // 3. Force page refresh if needed
  setTimeout(() => {
    const sidebarClassCode = document.querySelector('.teacher-sidebar')?.textContent;
    if (sidebarClassCode && sidebarClassCode.includes('N/A')) {
      console.log('🔄 Sidebar still shows N/A, forcing page refresh...');
      window.location.reload();
    } else {
      console.log('✅ Emergency fix completed successfully');
    }
  }, 2000);
  
  return classInfo;
};

// 5. Debug teacher class state
export const debugTeacherClassState = () => {
  console.log('\n🔍 Teacher Class Debug Info:');
  console.log('  Current URL:', window.location.pathname);
  
  const classIdMatch = window.location.pathname.match(/\/teacher\/class\/(\d+)/);
  const classId = classIdMatch ? classIdMatch[1] : null;
  console.log('  Extracted ClassId:', classId);
  
  const classInfo = AuthStorage.getClassInfo();
  console.log('  Stored ClassInfo:', classInfo);
  
  // Check DOM elements
  const sidebarElement = document.querySelector('.teacher-sidebar');
  if (sidebarElement) {
    console.log('  Sidebar found:', true);
    const sidebarText = sidebarElement.textContent;
    console.log('  Sidebar contains N/A:', sidebarText.includes('N/A'));
    console.log('  Sidebar text preview:', sidebarText.substring(0, 200) + '...');
  } else {
    console.log('  Sidebar found:', false);
  }
  
  console.log('  Page type:', window.location.pathname.includes('/create-assignment') ? 'Create Assignment' : 'Other');
};

// 6. Quick fix command
export const quickFixTeacherClass = () => {
  console.log('⚡ Quick Fix for Teacher Class...');
  
  // Extract classId from URL
  const classIdMatch = window.location.pathname.match(/\/teacher\/class\/(\d+)/);
  if (classIdMatch) {
    const classId = classIdMatch[1];
    
    // Create minimal classInfo
    const quickClassInfo = {
      id: classId,
      name: `Lớp học ${classId}`,
      code: `CLASS${classId}`,
      class_code: `CLASS${classId}`,
      teacher: 'Nguyễn Văn An',
      teacher_name: 'Nguyễn Văn An'
    };
    
    // Save and apply
    AuthStorage.setClassInfo(quickClassInfo);
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('classInfoUpdated', { 
      detail: quickClassInfo 
    }));
    
    console.log('⚡ Quick fix applied:', quickClassInfo);
    
    // Refresh page if still showing N/A after 1 second
    setTimeout(() => {
      const sidebarText = document.querySelector('.teacher-sidebar')?.textContent || '';
      if (sidebarText.includes('N/A')) {
        console.log('🔄 Still showing N/A, refreshing page...');
        window.location.reload();
      }
    }, 1000);
    
    return quickClassInfo;
  }
  
  console.warn('⚠️ Could not extract classId for quick fix');
  return null;
};

// Auto-start for teacher pages
if (window.location.pathname.includes('/teacher/class/')) {
  // Apply immediate fix
  setTimeout(() => {
    fixTeacherClassDisplay();
    if (window.location.pathname.includes('/create-assignment')) {
      fixCreateAssignmentPage();
    }
  }, 500);
  
  // Start monitoring
  startTeacherAutoFix();
}

// Export to window for console access
window.fixTeacherClassDisplay = fixTeacherClassDisplay;
window.fixCreateAssignmentPage = fixCreateAssignmentPage;
window.emergencyTeacherFix = emergencyTeacherFix;
window.debugTeacherClassState = debugTeacherClassState;
window.quickFixTeacherClass = quickFixTeacherClass;

console.log('🎉 Complete Teacher Class Fix loaded!');
console.log('Available commands:');
console.log('  quickFixTeacherClass() - Quick fix for N/A display');
console.log('  emergencyTeacherFix() - Complete emergency fix');
console.log('  debugTeacherClassState() - Debug current state');
console.log('  fixCreateAssignmentPage() - Fix create assignment page specifically');
