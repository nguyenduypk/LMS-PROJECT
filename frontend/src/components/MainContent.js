import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

function Banner() {
  return (
    <section className="banner modern-banner" id="banner">
      <div className="banner__content">
        <h1 className="banner__title">EduHub Classroom – Nền tảng học tập trực tuyến</h1>
        <p className="banner__desc">Một cách hiệu quả để<br />quản lý lớp học</p>
        <a href="/register" className="btn btn-primary banner__cta modern-cta">Tham gia ngay</a>
        <p className="banner__subdesc">Kết nối học sinh - giáo viên, giao bài tập, chấm điểm tự động</p>
      </div>
                      <div className="banner__image">
                  <div className="floating-shapes">
                    <div className="shape"></div>
                    <div className="shape"></div>
                    <div className="shape"></div>
                    <div className="shape"></div>
                    <div className="center-element"></div>
                    
                    {/* Student and Teacher Elements */}
                    <div className="student-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4F46E5" strokeWidth="2" fill="none"/>
                        <path d="M2 17L12 22L22 17" stroke="#4F46E5" strokeWidth="2" fill="none"/>
                        <path d="M2 12L12 17L22 12" stroke="#4F46E5" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="12" r="3" fill="#4F46E5"/>
                      </svg>
                    </div>
                    <div className="teacher-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z" fill="#10B981"/>
                        <path d="M12 8C14.21 8 16 9.79 16 12V16H8V12C8 9.79 9.79 8 12 8Z" fill="#10B981"/>
                        <path d="M6 20V18C6 16.9 6.9 16 8 16H16C17.1 16 18 16.9 18 18V20" stroke="#10B981" strokeWidth="2" fill="none"/>
                        <path d="M9 12H15" stroke="#10B981" strokeWidth="2"/>
                        <path d="M9 14H13" stroke="#10B981" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="book-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="#F59E0B" strokeWidth="2" fill="none"/>
                        <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z" stroke="#F59E0B" strokeWidth="2" fill="none"/>
                        <path d="M8 6H16" stroke="#F59E0B" strokeWidth="2"/>
<path d="M8 10H16" stroke="#F59E0B" strokeWidth="2"/>
                        <path d="M8 14H12" stroke="#F59E0B" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="pencil-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#EF4444" strokeWidth="2" fill="none"/>
                        <path d="M18.5 2.50023C18.8978 2.10297 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10297 21.5 2.50023C21.8971 2.89792 22.1212 3.43739 22.1212 4.00023C22.1212 4.56307 21.8971 5.10254 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="#EF4444" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                    <div className="graduation-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 10V6L12 1L2 6V10" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
                        <path d="M6 10V16C6 16 8 18 12 18C16 18 18 16 18 16V10" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
                        <path d="M2 6L12 11L22 6" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="18" r="2" fill="#8B5CF6"/>
                      </svg>
                    </div>
                    <div className="microscope-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3H15" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <path d="M12 3V7" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <path d="M8 7H16" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <path d="M6 9H18" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <path d="M4 11H20" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <path d="M6 13H18" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <path d="M8 15H16" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <path d="M10 17H14" stroke="#06B6D4" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="19" r="2" fill="#06B6D4"/>
                      </svg>
                    </div>
                    <div className="calculator-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="2" width="16" height="20" rx="2" stroke="#F97316" strokeWidth="2" fill="none"/>
<path d="M8 6H16" stroke="#F97316" strokeWidth="2"/>
                        <path d="M8 10H10" stroke="#F97316" strokeWidth="2"/>
                        <path d="M12 10H14" stroke="#F97316" strokeWidth="2"/>
                        <path d="M16 10H18" stroke="#F97316" strokeWidth="2"/>
                        <path d="M8 14H10" stroke="#F97316" strokeWidth="2"/>
                        <path d="M12 14H14" stroke="#F97316" strokeWidth="2"/>
                        <path d="M16 14H18" stroke="#F97316" strokeWidth="2"/>
                        <path d="M8 18H10" stroke="#F97316" strokeWidth="2"/>
                        <path d="M12 18H14" stroke="#F97316" strokeWidth="2"/>
                        <path d="M16 18H18" stroke="#F97316" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="globe-element">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="2" fill="none"/>
                        <path d="M2 12H22" stroke="#059669" strokeWidth="2" fill="none"/>
                        <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="#059669" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                  </div>
                </div>
    </section>
  );
}

const features = [
  { 
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    title: 'Giao bài – chấm điểm' 
  },
  { 
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    title: 'Báo cáo tiến độ học tập' 
  },
  { 
    icon: (
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    title: 'Chat lớp học' 
  },
  { 
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 13A5 5 0 0 0 13 10A5 5 0 0 0 10 7A5 5 0 0 0 7 10A5 5 0 0 0 10 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 7H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 11H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 15H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 19H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 7H20.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 11H20.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 15H20.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 19H20.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    title: 'Tích hợp Google/Zalo' 
  },
];
function Features() {
  return (
    <section className="features" id="features">
      <h2 className="features__title">Tính năng nổi bật</h2>
      <p className="features__desc">SHub Classroom cung cấp đầy đủ công cụ hỗ trợ dạy và học trực tuyến hiệu quả, tiện lợi và hiện đại.</p>
      <div className="features__grid">
        {features.map((f, idx) => (
          <div className="feature" key={idx}>
            <div className="feature__icon">{f.icon}</div>
            <div className="feature__title">{f.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}


const galleryImages = [
  './img/carousel1.png',
  './img/carousel2.png',
  './img/carousel3.png',
  './img/carousel4.png',
  './img/carousel5.png',
  './img/carousel6.png',
  './img/carousel7.png',
  './img/carousel8.png',
  './img/carousel9.png',
  './img/carousel10.png',
  './img/carousel1.png',
];
function CommunityGallery() {
  const [start, setStart] = useState(0);
  const visible = 4;
  const end = start + visible;
  const canPrev = start > 0;
  const canNext = end < galleryImages.length;
  const handlePrev = () => setStart(s => Math.max(0, s - 1));
const handleNext = () => setStart(s => Math.min(galleryImages.length - visible, s + 1));
  return (
    <section className="gallery-section" id="review-section">
      <h2 className="gallery-title">Hoạt động tiêu biểu từ cộng đồng giáo dục</h2>
      <p className="gallery-desc">Hình ảnh được chính những giáo viên từ khắp 3 miền ghi lại trong quá trình giảng dạy, dạy học ứng dụng công nghệ SHub Classroom.</p>
      <div className="gallery-carousel">
        <button className="gallery-nav" onClick={handlePrev} disabled={!canPrev} aria-label="Trước">
          &#8592;
        </button>
        <div className="gallery-track">
          {galleryImages.slice(start, end).map((img, idx) => (
            <img className="gallery-img" src={img} alt="Hoạt động giáo dục" key={start + idx} />
          ))}
        </div>
        <button className="gallery-nav" onClick={handleNext} disabled={!canNext} aria-label="Sau">
          &#8594;
        </button>
      </div>
    </section>
  );
}

const stats = [
  {
    img: './img/school.png',
    value: '2.000',
    label: 'Trường học',
  },
  {
    img: './img/class.png',
    value: '500.000',
    label: 'Lớp học',
  },
  {
    img: './img/students.png',
    value: '3 triệu',
    label: 'Học sinh',
  },
  {
    img: './img/teacher.png',
    value: '100.000',
    label: 'Giáo viên',
  },
];
function StatsSection() {
  return (
    <section className="stats-section" id="stats-section">
      <h2 className="stats-title">SHub đồng hành cùng giáo dục cả nước</h2>
      <p className="stats-desc">
        <span className="stats-highlight">Có mặt trên 63 tỉnh thành, với hơn 3.000.000 người dùng mỗi ngày</span> cho việc dạy và học, SHub trở thành cộng đồng giáo dục trực tuyến, môi trường học tập, giảng dạy và chia sẻ rộng lớn.
      </p>
      <div className="stats-grid">
        {stats.map((s, idx) => (
          <div className="stat-card" key={idx}>
            <img className="stat-img" src={s.img} alt={s.label} />
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}



// School logos data
const schoolLogos = [
  { src: './img/logo1.jpg', alt: 'Logo 1' },
  { src: './img/logo2.jpg', alt: 'Logo 2' },
  { src: './img/logo3.jpg', alt: 'Logo 3' },
  { src: './img/logo4.jpg', alt: 'Logo 4' },
  { src: './img/logo5.jpg', alt: 'Logo 5' },
  { src: './img/logo1.jpg', alt: 'Logo 6' },
  { src: './img/logo2.jpg', alt: 'Logo 7' },
  { src: './img/logo3.jpg', alt: 'Logo 8' },
  { src: './img/logo4.jpg', alt: 'Logo 9' },
  { src: './img/logo5.jpg', alt: 'Logo 10' },
  { src: './img/logo1.jpg', alt: 'Logo 11' },
  { src: './img/logo2.jpg', alt: 'Logo 12' },
  { src: './img/logo3.jpg', alt: 'Logo 13' },
  { src: './img/logo4.jpg', alt: 'Logo 14' },
  { src: './img/logo5.jpg', alt: 'Logo 15' },
  { src: './img/logo1.jpg', alt: 'Logo 16' },
{ src: './img/logo2.jpg', alt: 'Logo 17' },
  { src: './img/logo3.jpg', alt: 'Logo 18' },
  { src: './img/logo4.jpg', alt: 'Logo 19' },
  { src: './img/logo5.jpg', alt: 'Logo 20' },
];


function SchoolLogos() {
  return (
    <section className="school-logos-section" id="school-logos">
      <h2 className="school-logos-title">Cùng các đơn vị trường học</h2>
      <div className="school-logos-list">
        {schoolLogos.map((logo, idx) => (
          <div key={idx} className="school-logo-item">
            <img src={logo.src} alt={logo.alt} />
          </div>
        ))}
      </div>
    </section>
  );
}


function MainContent() {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <main>
        <Banner />
        
        {/* Navigation Button between Banner and Features */}
        <div className="section-nav-container">
          <button 
            className="section-nav-button"
            onClick={() => scrollToSection('features')}
            aria-label="Go to Features"
          >
            <div style={{maxWidth: '80px', maxHeight: '80px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" preserveAspectRatio="xMidYMid meet" style={{width: '100%', height: '100%', transform: 'translate3d(0px, 0px, 0px)', contentVisibility: 'visible'}}>
                <defs>
                  <clipPath id="__lottie_element_2">
                    <rect width="1000" height="1000" x="0" y="0"></rect>
                  </clipPath>
                </defs>
                <g clipPath="url(#__lottie_element_2)">
                  <g transform="matrix(1,0,0,1,0,0)" opacity="1" style={{display: 'block'}}>
                    <rect width="1000" height="1000" fill="#ffffff"></rect>
                  </g>
                  <g transform="matrix(1,0,0,1,0,104.03924560546875)" opacity="1" style={{display: 'block'}}>
                    <g opacity="1" transform="matrix(1,0,0,1,500,500.52398681640625)">
<path fill="rgb(41,98,255)" fillOpacity="1" d="M10.479999542236328,56.53099822998047 C10.479999542236328,56.53099822998047 135.28799438476562,-25.80699920654297 135.28799438476562,-25.80699920654297 C151.0449981689453,-36.20199966430664 143.68499755859375,-60.7239990234375 124.80799865722656,-60.7239990234375 C124.80799865722656,-60.7239990234375 -124.80899810791016,-60.7239990234375 -124.80899810791016,-60.7239990234375 C-143.68699645996094,-60.7239990234375 -151.04600524902344,-36.20199966430664 -135.28900146484375,-25.80699920654297 C-135.28900146484375,-25.80699920654297 -10.480999946594238,56.53099822998047 -10.480999946594238,56.53099822998047 C-4.124000072479248,60.7239990234375 4.123000144958496,60.7239990234375 10.479999542236328,56.53099822998047z"></path>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </button>
        </div>

        <Features />
        
        {/* Navigation Button between Features and Stats */}
        <div className="section-nav-container">
          <button 
            className="section-nav-button"
            onClick={() => scrollToSection('stats-section')}
            aria-label="Go to Stats"
          >
            <div style={{maxWidth: '80px', maxHeight: '80px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" preserveAspectRatio="xMidYMid meet" style={{width: '100%', height: '100%', transform: 'translate3d(0px, 0px, 0px)', contentVisibility: 'visible'}}>
                <defs>
                  <clipPath id="__lottie_element_4">
                    <rect width="1000" height="1000" x="0" y="0"></rect>
                  </clipPath>
                </defs>
                <g clipPath="url(#__lottie_element_4)">
                  <g transform="matrix(1,0,0,1,0,0)" opacity="1" style={{display: 'block'}}>
                    <rect width="1000" height="1000" fill="#ffffff"></rect>
                  </g>
                  <g transform="matrix(1,0,0,1,0,104.03924560546875)" opacity="1" style={{display: 'block'}}>
                    <g opacity="1" transform="matrix(1,0,0,1,500,500.52398681640625)">
                      <path fill="rgb(41,98,255)" fillOpacity="1" d="M10.479999542236328,56.53099822998047 C10.479999542236328,56.53099822998047 135.28799438476562,-25.80699920654297 135.28799438476562,-25.80699920654297 C151.0449981689453,-36.20199966430664 143.68499755859375,-60.7239990234375 124.80799865722656,-60.7239990234375 C124.80799865722656,-60.7239990234375 -124.80899810791016,-60.7239990234375 -124.80899810791016,-60.7239990234375 C-143.68699645996094,-60.7239990234375 -151.04600524902344,-36.20199966430664 -135.28900146484375,-25.80699920654297 C-135.28900146484375,-25.80699920654297 -10.480999946594238,56.53099822998047 -10.480999946594238,56.53099822998047 C-4.124000072479248,60.7239990234375 4.123000144958496,60.7239990234375 10.479999542236328,56.53099822998047z"></path>
</g>
                  </g>
                </g>
              </svg>
            </div>
          </button>
        </div>

        <StatsSection />
        
        {/* Navigation Button between Stats and Gallery */}
        <div className="section-nav-container">
          <button 
            className="section-nav-button"
            onClick={() => scrollToSection('review-section')}
            aria-label="Go to Gallery"
          >
            <div style={{maxWidth: '80px', maxHeight: '80px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" preserveAspectRatio="xMidYMid meet" style={{width: '100%', height: '100%', transform: 'translate3d(0px, 0px, 0px)', contentVisibility: 'visible'}}>
                <defs>
                  <clipPath id="__lottie_element_5">
                    <rect width="1000" height="1000" x="0" y="0"></rect>
                  </clipPath>
                </defs>
                <g clipPath="url(#__lottie_element_5)">
                  <g transform="matrix(1,0,0,1,0,0)" opacity="1" style={{display: 'block'}}>
                    <rect width="1000" height="1000" fill="#ffffff"></rect>
                  </g>
                  <g transform="matrix(1,0,0,1,0,104.03924560546875)" opacity="1" style={{display: 'block'}}>
                    <g opacity="1" transform="matrix(1,0,0,1,500,500.52398681640625)">
                      <path fill="rgb(41,98,255)" fillOpacity="1" d="M10.479999542236328,56.53099822998047 C10.479999542236328,56.53099822998047 135.28799438476562,-25.80699920654297 135.28799438476562,-25.80699920654297 C151.0449981689453,-36.20199966430664 143.68499755859375,-60.7239990234375 124.80799865722656,-60.7239990234375 C124.80799865722656,-60.7239990234375 -124.80899810791016,-60.7239990234375 -124.80899810791016,-60.7239990234375 C-143.68699645996094,-60.7239990234375 -151.04600524902344,-36.20199966430664 -135.28900146484375,-25.80699920654297 C-135.28900146484375,-25.80699920654297 -10.480999946594238,56.53099822998047 -10.480999946594238,56.53099822998047 C-4.124000072479248,60.7239990234375 4.123000144958496,60.7239990234375 10.479999542236328,56.53099822998047z"></path>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </button>
        </div>

        <CommunityGallery />
        
        <SchoolLogos />
      </main>
      
      {/* Floating Navigation Button */}
      {showScrollButton && (
        <button 
          className="floating-nav-button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <div style={{maxWidth: '60px', maxHeight: '60px'}}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" preserveAspectRatio="xMidYMid meet" style={{width: '100%', height: '100%', transform: 'translate3d(0px, 0px, 0px) rotate(180deg)', contentVisibility: 'visible'}}>
              <defs>
<clipPath id="__lottie_element_7">
                  <rect width="1000" height="1000" x="0" y="0"></rect>
                </clipPath>
              </defs>
              <g clipPath="url(#__lottie_element_7)">
                <g transform="matrix(1,0,0,1,0,0)" opacity="1" style={{display: 'block'}}>
                  <rect width="1000" height="1000" fill="#ffffff"></rect>
                </g>
                <g transform="matrix(1,0,0,1,0,104.03924560546875)" opacity="1" style={{display: 'block'}}>
                  <g opacity="1" transform="matrix(1,0,0,1,500,500.52398681640625)">
                    <path fill="rgb(41,98,255)" fillOpacity="1" d="M10.479999542236328,56.53099822998047 C10.479999542236328,56.53099822998047 135.28799438476562,-25.80699920654297 135.28799438476562,-25.80699920654297 C151.0449981689453,-36.20199966430664 143.68499755859375,-60.7239990234375 124.80799865722656,-60.7239990234375 C124.80799865722656,-60.7239990234375 -124.80899810791016,-60.7239990234375 -124.80899810791016,-60.7239990234375 C-143.68699645996094,-60.7239990234375 -151.04600524902344,-36.20199966430664 -135.28900146484375,-25.80699920654297 C-135.28900146484375,-25.80699920654297 -10.480999946594238,56.53099822998047 -10.480999946594238,56.53099822998047 C-4.124000072479248,60.7239990234375 4.123000144958496,60.7239990234375 10.479999542236328,56.53099822998047z"></path>
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </button>
      )}
    </>
  );
}

export default MainContent;