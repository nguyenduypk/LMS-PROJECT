// Utility để quản lý authentication storage một cách nhất quán
export class AuthStorage {
  // Lấy token
  static getToken() {
    return sessionStorage.getItem('token');
  }

  // Lưu token
  static setToken(token) {
    sessionStorage.setItem('token', token);
  }

  // Lấy thông tin user
  static getUser() {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Lưu thông tin user
  static setUser(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  // Kiểm tra xem user có đăng nhập không
  static isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Xóa tất cả dữ liệu authentication
  static clearAuth() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('classInfo'); // Xóa cả classInfo cache
  }

  // Lưu thông tin class để tránh mất dữ liệu khi chuyển trang
  static setClassInfo(classInfo) {
    sessionStorage.setItem('classInfo', JSON.stringify(classInfo));
  }

  // Lấy thông tin class
  static getClassInfo() {
    const classInfoStr = sessionStorage.getItem('classInfo');
    if (!classInfoStr) return null;
    
    try {
      return JSON.parse(classInfoStr);
    } catch (error) {
      console.error('Error parsing class info:', error);
      return null;
    }
  }

  // Debug: In ra tất cả thông tin auth hiện tại
  static debugAuth() {
    console.log('🔍 Auth Debug Info:');
    console.log('  Token:', this.getToken() ? 'Present' : 'Missing');
    console.log('  User:', this.getUser());
    console.log('  ClassInfo:', this.getClassInfo());
    console.log('  Is Authenticated:', this.isAuthenticated());
  }
}

// Export default để dễ sử dụng
export default AuthStorage;
