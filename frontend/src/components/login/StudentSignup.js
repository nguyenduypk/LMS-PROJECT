import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, auth } from '../../utils/api';
import './Register.css';

function StudentSignup() {
    const [formData, setFormData] = useState({
        fullName: '',
        class: '',
        school: '',
        dateOfBirth: '',
        province: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);

        try {
            const data = await api.auth.register({
                username: formData.email.split('@')[0], // Tạo username từ email
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName,
                role: 'student',
                school: formData.school,
                date_of_birth: formData.dateOfBirth,
                province: formData.province,
                class: formData.class
            });

            // Kiểm tra nếu có lỗi từ backend
            if (data.message && data.message !== 'Đăng ký thành công') {
                throw new Error(data.message);
            }

            // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
            navigate('/login');
            
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error details:', error.message, error.stack);
            setError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-page">
        <div className="signup-wrapper">
            <a href="/register" className="back-link">← Thay đổi vai trò</a>
            <h2 className="signup-title">Bạn đang đăng ký với vai trò học sinh</h2>

            <form className="signup-form" onSubmit={handleSubmit}>
                <h4>Thông tin cá nhân</h4>

                <div className="form-row single">
                    <input 
                        type="text" 
                        placeholder="Họ tên" 
                        className="col-1-1"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <input 
                        type="text" 
                        placeholder="Lớp" 
                        className="col-1-2"
                        name="class"
                        value={formData.class}
                        onChange={handleChange}
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Trường" 
                        className="col-1-2"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <input
                        type="date"
                        placeholder="Ngày sinh"
                        required
                        className="col-1-2"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                    />

                    <select 
                        className="col-1-2" 
                        required 
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                    >
                        <option value="" disabled>Tỉnh</option>
                        <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="An Giang">An Giang</option>
                        <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                        <option value="Bắc Giang">Bắc Giang</option>
                        <option value="Bắc Kạn">Bắc Kạn</option>
                        <option value="Bạc Liêu">Bạc Liêu</option>
                        <option value="Bắc Ninh">Bắc Ninh</option>
                        <option value="Bến Tre">Bến Tre</option>
                        <option value="Bình Định">Bình Định</option>
                        <option value="Bình Dương">Bình Dương</option>
                        <option value="Bình Phước">Bình Phước</option>
                        <option value="Bình Thuận">Bình Thuận</option>
                        <option value="Cà Mau">Cà Mau</option>
                        <option value="Cao Bằng">Cao Bằng</option>
                        <option value="Đắk Lắk">Đắk Lắk</option>
                        <option value="Đắk Nông">Đắk Nông</option>
                        <option value="Điện Biên">Điện Biên</option>
                        <option value="Đồng Nai">Đồng Nai</option>
                        <option value="Đồng Tháp">Đồng Tháp</option>
                        <option value="Gia Lai">Gia Lai</option>
                        <option value="Hà Giang">Hà Giang</option>
                        <option value="Hà Nam">Hà Nam</option>
                        <option value="Hà Tĩnh">Hà Tĩnh</option>
                        <option value="Hải Dương">Hải Dương</option>
                        <option value="Hậu Giang">Hậu Giang</option>
                        <option value="Hòa Bình">Hòa Bình</option>
                        <option value="Hưng Yên">Hưng Yên</option>
                        <option value="Khánh Hòa">Khánh Hòa</option>
                        <option value="Kiên Giang">Kiên Giang</option>
                        <option value="Kon Tum">Kon Tum</option>
                        <option value="Lai Châu">Lai Châu</option>
                        <option value="Lâm Đồng">Lâm Đồng</option>
                        <option value="Lạng Sơn">Lạng Sơn</option>
                        <option value="Lào Cai">Lào Cai</option>
                        <option value="Long An">Long An</option>
                        <option value="Nam Định">Nam Định</option>
                        <option value="Nghệ An">Nghệ An</option>
                        <option value="Ninh Bình">Ninh Bình</option>
                        <option value="Ninh Thuận">Ninh Thuận</option>
                        <option value="Phú Thọ">Phú Thọ</option>
                        <option value="Phú Yên">Phú Yên</option>
                        <option value="Quảng Bình">Quảng Bình</option>
                        <option value="Quảng Nam">Quảng Nam</option>
                        <option value="Quảng Ngãi">Quảng Ngãi</option>
                        <option value="Quảng Ninh">Quảng Ninh</option>
                        <option value="Quảng Trị">Quảng Trị</option>
                        <option value="Sóc Trăng">Sóc Trăng</option>
                        <option value="Sơn La">Sơn La</option>
                        <option value="Tây Ninh">Tây Ninh</option>
                        <option value="Thái Bình">Thái Bình</option>
                        <option value="Thái Nguyên">Thái Nguyên</option>
                        <option value="Thanh Hóa">Thanh Hóa</option>
                        <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
                        <option value="Tiền Giang">Tiền Giang</option>
                        <option value="Trà Vinh">Trà Vinh</option>
                        <option value="Tuyên Quang">Tuyên Quang</option>
                        <option value="Vĩnh Long">Vĩnh Long</option>
                        <option value="Vĩnh Phúc">Vĩnh Phúc</option>
                        <option value="Yên Bái">Yên Bái</option>
                    </select>
                </div>
                
                <h4>Thông tin tài khoản</h4>
                <input 
                    type="email" 
                    placeholder="Email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Mật khẩu" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Xác nhận mật khẩu" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />

                {error && <div className="error-message" style={{color: 'red', marginBottom: '10px', textAlign: 'center'}}>{error}</div>}

                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
                <p className="login-note">Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
            </form>
        </div>
        </div>
    );
}

export default StudentSignup;
