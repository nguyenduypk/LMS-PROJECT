// Test script to check button functionality
console.log('Testing button functionality...');

// Simulate button click
const testButtonClick = () => {
  console.log('Button click simulated');
  return true;
};

// Test modal state
const testModalState = (isOpen) => {
  console.log('Modal state:', isOpen);
  return isOpen;
};

// Test class info
const testClassInfo = (classInfo) => {
  console.log('Class info:', classInfo);
  return classInfo && classInfo.id;
};

export { testButtonClick, testModalState, testClassInfo }; 