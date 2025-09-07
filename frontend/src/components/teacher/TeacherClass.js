import React, { useState, useEffect, useRef } from 'react';
import './TeacherClass.css';
import Header from './Header';
import { useNavigate } from 'react-router-dom';

const SUBJECT_SUGGESTIONS = [
  'Môn Toán', 'Môn Số học', 'Môn Đại số', 'Môn Đại Số và Giải tích',
  'Môn Giải tích', 'Môn Hình học', 'Môn Ngữ văn', 'Môn Tiếng Anh',
  'Môn Vật lý', 'Môn Hóa học', 'Môn Sinh học', 'Môn Lịch sử',
  'Môn Địa lý', 'Môn Tin học', 'Môn GDCD', 'Môn Công nghệ'
];
const CHUONG_SUGGESTIONS = [
  'Chương Hữu cơ', 'Chương Vô cơ', 'Chương Quang học', 'Chương Hình học không gian'
];

const initialData = [
  {
    name: '10',
    subjects: [
      {
        name: 'Địa lý',
        chapters: [
          { name: 'Bản đồ', folders: [
            { name: 'Lớp 6A1 - Toán cơ bản' },
            { name: 'Lớp 6A2 - Văn học cơ bản' }
          ] },
          { name: 'Cấu trúc của Trái Đất', folders: [
            { name: 'Lớp 7B1 - Khoa học tự nhiên' },
            { name: 'Lớp 7B2 - Khoa học xã hội' }
          ] },
          { name: 'Cơ cấu nền kinh tế', folders: [
            { name: 'Lớp 8C1 - Toán nâng cao' },
            { name: 'Lớp 8C2 - Văn học nâng cao' }
          ] },
          { name: 'Địa lí công nghiệp', folders: [
            { name: 'Lớp 9D3 - Công nghệ' },
            { name: 'Lớp 9D4 - Tin học' }
          ] },
          { name: 'Địa lí dân cư', folders: [
            { name: 'Lớp 10A3 - Tiếng Anh' },
            { name: 'Lớp 10A4 - GDCD' }
          ] },
          { name: 'Địa lí dịch vụ', folders: [
            { name: 'Lớp 11B2 - Toán chuyên' },
            { name: 'Lớp 11B3 - Văn chuyên' }
          ] },
          { name: 'Địa lí nông nghiệp', folders: [
            { name: 'Lớp 12C3 - Lý chuyên' },
            { name: 'Lớp 12C4 - Hóa chuyên' }
          ] },
          { name: 'Môi trường và tài nguyên thiên nhiên', folders: [
            { name: 'Lớp 10A1 - Toán học' },
            { name: 'Lớp 10A2 - Văn học' },
            { name: 'Lớp 11B1 - Vật lý' }
          ] },
          { name: 'Một số quy luật của l...', folders: [
            { name: 'Lớp 12C1 - Hóa học' },
            { name: 'Lớp 12C2 - Sinh học' }
          ] },
          { name: 'Vũ trụ. Hệ quả các ch...', folders: [
            { name: 'Lớp 9D1 - Địa lý' },
            { name: 'Lớp 9D2 - Lịch sử' }
          ] },
        ]
      },
      {
        name: 'Toán học',
        chapters: [
          { name: 'Đại số', folders: [
            { name: 'Lớp 10A5 - Toán đại số' },
            { name: 'Lớp 10A6 - Toán hình học' }
          ] },
          { name: 'Hình học', folders: [
            { name: 'Lớp 10A7 - Hình học phẳng' },
            { name: 'Lớp 10A8 - Hình học không gian' }
          ] }
        ]
      },
      {
        name: 'Văn học',
        chapters: [
          { name: 'Văn học Việt Nam', folders: [
            { name: 'Lớp 10A9 - Văn học trung đại' },
            { name: 'Lớp 10A10 - Văn học hiện đại' }
          ] },
          { name: 'Văn học nước ngoài', folders: [
            { name: 'Lớp 10A11 - Văn học phương Tây' },
            { name: 'Lớp 10A12 - Văn học phương Đông' }
          ] }
        ]
      }
    ]
  },
  { 
    name: '11', 
    subjects: [
      {
        name: 'Vật lý',
        chapters: [
          { name: 'Cơ học', folders: [
            { name: 'Lớp 11B4 - Cơ học chất điểm' },
            { name: 'Lớp 11B5 - Cơ học vật rắn' }
          ] },
          { name: 'Điện học', folders: [
            { name: 'Lớp 11B6 - Điện trường' },
            { name: 'Lớp 11B7 - Từ trường' }
          ] }
        ]
      }
    ] 
  },
  { 
    name: '12', 
    subjects: [
      {
        name: 'Hóa học',
        chapters: [
          { name: 'Hóa vô cơ', folders: [
            { name: 'Lớp 12C5 - Hóa vô cơ cơ bản' },
            { name: 'Lớp 12C6 - Hóa vô cơ nâng cao' }
          ] },
          { name: 'Hóa hữu cơ', folders: [
            { name: 'Lớp 12C7 - Hóa hữu cơ cơ bản' },
            { name: 'Lớp 12C8 - Hóa hữu cơ nâng cao' }
          ] }
        ]
      }
    ] 
  },
  { 
    name: '6', 
    subjects: [
      {
        name: 'Toán học',
        chapters: [
          { name: 'Số học', folders: [
            { name: 'Lớp 6E1 - Số tự nhiên' },
            { name: 'Lớp 6E2 - Phân số' }
          ] }
        ]
      }
    ] 
  },
  { 
    name: '7', 
    subjects: [
      {
        name: 'Khoa học tự nhiên',
        chapters: [
          { name: 'Vật lý', folders: [
            { name: 'Lớp 7F1 - Cơ học' },
            { name: 'Lớp 7F2 - Nhiệt học' }
          ] }
        ]
      }
    ] 
  },
  { 
    name: '8', 
    subjects: [
      {
        name: 'Hóa học',
        chapters: [
          { name: 'Hóa vô cơ', folders: [
            { name: 'Lớp 8G1 - Chất và sự biến đổi' },
            { name: 'Lớp 8G2 - Phản ứng hóa học' }
          ] }
        ]
      }
    ] 
  },
  { 
    name: '9', 
    subjects: [
      {
        name: 'Sinh học',
        chapters: [
          { name: 'Di truyền học', folders: [
            { name: 'Lớp 9H1 - Di truyền Menđen' },
            { name: 'Lớp 9H2 - Nhiễm sắc thể' }
          ] }
        ]
      }
    ] 
  },
  { 
    name: 'Cao đẳng', 
    subjects: [
      {
        name: 'Công nghệ thông tin',
        chapters: [
          { name: 'Lập trình', folders: [
            { name: 'Lớp CD1 - Lập trình C++' },
            { name: 'Lớp CD2 - Lập trình Java' }
          ] }
        ]
      }
    ] 
  },
  { 
    name: 'Đại học', 
    subjects: [
      {
        name: 'Kỹ thuật',
        chapters: [
          { name: 'Cơ khí', folders: [
            { name: 'Lớp DH1 - Cơ khí chế tạo' },
            { name: 'Lớp DH2 - Cơ khí động lực' }
          ] }
        ]
      }
    ] 
  },
];

const FolderCreateIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#2196f3">
    <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z" fill="#2196f3"/>
  </svg>
);
const FolderBlueIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#2196f3">
    <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" fill="#2196f3"/>
  </svg>
);
const FolderBlackIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#000000">
    <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" fill="#000000"/>
  </svg>
);

export default function TeacherClass() {
  const [blocks, setBlocks] = useState(initialData);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, type: '', items: [], input: '', selected: [] });
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sortOrder, setSortOrder] = useState('Mới nhất');
  const [showResourceDetail, setShowResourceDetail] = useState(true);
  const navigate = useNavigate();
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const uploadBtnRef = useRef(null);
  const uploadMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        showUploadMenu &&
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(e.target) &&
        !uploadBtnRef.current.contains(e.target)
      ) {
        setShowUploadMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUploadMenu]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [breadcrumb]);

  // Helper: get current list to render
  let currentList = blocks;
  let currentType = 'block';
  let parentIdx = null;
  let parentObj = null;
  breadcrumb.forEach((b) => {
    if (b.type === 'block') {
      parentIdx = blocks.findIndex(x => x.name === b.name);
      parentObj = blocks[parentIdx];
      currentList = blocks[parentIdx]?.subjects || [];
      currentType = 'subject';
    } else if (b.type === 'subject') {
      parentIdx = parentObj.subjects.findIndex(x => x.name === b.name);
      parentObj = parentObj.subjects[parentIdx];
      currentList = parentObj?.chapters || [];
      currentType = 'chapter';
    } else if (b.type === 'chapter') {
      parentIdx = parentObj.chapters.findIndex(x => x.name === b.name);
      parentObj = parentObj.chapters[parentIdx];
      currentList = parentObj?.folders || [];
      currentType = 'folder';
    }
  });

  const getTitle = () => {
    if (currentType === 'block') return 'Khối';
    if (currentType === 'subject') return 'Môn';
    if (currentType === 'chapter') return 'Chương';
    if (currentType === 'folder') return 'Thư mục';
    return '';
  };
  const getCreateLabel = () => {
    if (currentType === 'block') return 'Tạo khối mới';
    if (currentType === 'subject') return 'Tạo môn mới';
    if (currentType === 'chapter') return 'Tạo chương mới';
    if (currentType === 'folder') return 'Tạo thư mục mới';
    return '';
  };
  const getSuggests = () => {
    if (currentType === 'subject') return SUBJECT_SUGGESTIONS;
    if (currentType === 'chapter') return CHUONG_SUGGESTIONS;
    return [];
  };

  const handleItemClick = (item) => {
    if (currentType === 'block') {
      setBreadcrumb([...breadcrumb, { type: 'block', name: item.name }]);
      setSelectedIndex(null);
    }
    if (currentType === 'subject') {
      setBreadcrumb([...breadcrumb, { type: 'subject', name: item.name }]);
      setSelectedIndex(null);
    }
    if (currentType === 'chapter') {
      setBreadcrumb([...breadcrumb, { type: 'chapter', name: item.name }]);
      setSelectedIndex(null);
    }
    if (currentType === 'folder') {
      // Khi click vào folder (lớp học), điều hướng đến trang chính của lớp học
      const classId = item.name.replace(/\s+/g, '-').toLowerCase(); // Tạo ID từ tên folder
      navigate(`/teacher/class/${classId}/announcement`);
    }
  };
  const handleBack = (idx) => {
    setBreadcrumb(breadcrumb.slice(0, idx + 1));
    setSelectedIndex(null);
  };
  const handleCreate = () => {
    setModal({ open: true, type: currentType, items: getSuggests(), input: '', selected: [] });
  };
  const handleAdd = () => {
    if (!modal.selected.length) return;
    if (currentType === 'block') {
      setBlocks([{ name: modal.selected[0], subjects: [] }, ...blocks]);
    } else if (currentType === 'subject') {
      const idx = blocks.findIndex(x => x.name === breadcrumb[0].name);
      const newSubjects = modal.selected.map(name => ({ name, chapters: [] }));
      const newBlocks = [...blocks];
      newBlocks[idx].subjects = [...newSubjects, ...newBlocks[idx].subjects];
      setBlocks(newBlocks);
    } else if (currentType === 'chapter') {
      const idxBlock = blocks.findIndex(x => x.name === breadcrumb[0].name);
      const idxSubject = blocks[idxBlock].subjects.findIndex(x => x.name === breadcrumb[1].name);
      const newChapters = modal.selected.map(name => ({ name, folders: [] }));
      const newBlocks = [...blocks];
      newBlocks[idxBlock].subjects[idxSubject].chapters = [...newChapters, ...newBlocks[idxBlock].subjects[idxSubject].chapters];
      setBlocks(newBlocks);
    } else if (currentType === 'folder') {
      const idxBlock = blocks.findIndex(x => x.name === breadcrumb[0].name);
      const idxSubject = blocks[idxBlock].subjects.findIndex(x => x.name === breadcrumb[1].name);
      const idxChapter = blocks[idxBlock].subjects[idxSubject].chapters.findIndex(x => x.name === breadcrumb[2].name);
      const newFolders = modal.selected.map(name => ({ name }));
      const newBlocks = [...blocks];
      newBlocks[idxBlock].subjects[idxSubject].chapters[idxChapter].folders = [...newFolders, ...newBlocks[idxBlock].subjects[idxSubject].chapters[idxChapter].folders];
      setBlocks(newBlocks);
    }
    setModal({ open: false, type: '', items: [], input: '', selected: [] });
  };
  const handleSuggest = (name) => {
    if (!modal.selected.includes(name)) {
      setModal({ ...modal, selected: [...modal.selected, name] });
    }
  };
  const handleInput = (e) => {
    setModal({ ...modal, input: e.target.value });
  };
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && modal.input.trim() && !modal.selected.includes(modal.input.trim())) {
      setModal({ ...modal, selected: [...modal.selected, modal.input.trim()], input: '' });
    }
  };
  const handleRemoveSelected = (name) => {
    setModal({ ...modal, selected: modal.selected.filter(x => x !== name) });
  };
  const handleCloseModal = () => {
    setModal({ open: false, type: '', items: [], input: '', selected: [] });
  };
  const handleDelete = (idx) => {
    if (currentType === 'block') {
      setBlocks(blocks.filter((_, i) => i !== idx));
    } else if (currentType === 'subject') {
      const idxBlock = blocks.findIndex(x => x.name === breadcrumb[0].name);
      const newBlocks = [...blocks];
      newBlocks[idxBlock].subjects = newBlocks[idxBlock].subjects.filter((_, i) => i !== idx);
      setBlocks(newBlocks);
    } else if (currentType === 'chapter') {
      const idxBlock = blocks.findIndex(x => x.name === breadcrumb[0].name);
      const idxSubject = blocks[idxBlock].subjects.findIndex(x => x.name === breadcrumb[1].name);
      const newBlocks = [...blocks];
      newBlocks[idxBlock].subjects[idxSubject].chapters = newBlocks[idxBlock].subjects[idxSubject].chapters.filter((_, i) => i !== idx);
      setBlocks(newBlocks);
    } else if (currentType === 'folder') {
      const idxBlock = blocks.findIndex(x => x.name === breadcrumb[0].name);
      const idxSubject = blocks[idxBlock].subjects.findIndex(x => x.name === breadcrumb[1].name);
      const idxChapter = blocks[idxBlock].subjects[idxSubject].chapters.findIndex(x => x.name === breadcrumb[2].name);
      const newBlocks = [...blocks];
      newBlocks[idxBlock].subjects[idxSubject].chapters[idxChapter].folders = newBlocks[idxBlock].subjects[idxSubject].chapters[idxChapter].folders.filter((_, i) => i !== idx);
      setBlocks(newBlocks);
    }
    setOpenMenuIndex(null);
  };

  const filteredList = currentList.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  const breadcrumbRender = [
    <span
      key="hoclieu"
      className={breadcrumb.length === 0 ? "breadcrumb-current" : "breadcrumb-link"}
      style={{ cursor: 'pointer' }}
              onClick={() => {
          setBreadcrumb([]);
          setSelectedIndex(null);
          navigate('/teacher/resources');
        }}
    >
      Học liệu
    </span>
  ];
  breadcrumb.forEach((b, i) => {
    breadcrumbRender.push(
      <React.Fragment key={i}>
        <span className="breadcrumb-separator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 7l5 5-5 5z" fill="currentColor"/>
          </svg>
        </span>
        <span 
          className={i === breadcrumb.length - 1 ? "breadcrumb-current" : "breadcrumb-link"} 
          onClick={() => handleBack(i)}
        >
          {b.type === 'block' ? 'Khối ' : b.type === 'subject' ? 'Môn ' : b.type === 'chapter' ? 'Chương ' : ''}{b.name}
        </span>
      </React.Fragment>
    );
  });

  const handleFileUpload = (e) => {
    const files = e.target.files;
    // TODO: Xử lý file ở đây (upload lên server, v.v.)
    // Ví dụ: console.log(files);
  };

  return (
    <>
      <Header teacherName="Nguyễn Duy" />
      <div className="block-manager-layout">
        <aside className="block-sidebar">
          <div className="sidebar-title">Đề chưa phân loại</div>
          <button
            className="sort-toggle-btn"
            onClick={() => setSortOrder(order => order === 'Mới nhất' ? 'Cũ nhất' : 'Mới nhất')}
            style={{ marginBottom: 16 }}
          >
            ⇅ {sortOrder}
          </button>
          <div className="sidebar-toggle-detail">
            <span>Hiển thị chi tiết học liệu</span>
            <label className="mui-switch">
              <input type="checkbox" checked={showResourceDetail} onChange={e => setShowResourceDetail(e.target.checked)} />
              <span className="mui-slider"></span>
            </label>
          </div>
          <div className="sidebar-empty">Không còn học liệu chưa phân loại.</div>
        </aside>
        <main className="block-main">
          <div className="block-main-header">
            <div className="block-breadcrumb">{breadcrumbRender}</div>
            <div className="block-main-controls">
              <button
                className="block-upload"
                onClick={() => setShowUploadMenu(v => !v)}
                ref={uploadBtnRef}
              >
                Tải lên
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                onChange={handleFileUpload}
              />
              {showUploadMenu && (
                <div className="upload-menu" ref={uploadMenuRef}>
                  <div className="upload-menu-item" onClick={() => { setShowUploadMenu(false); navigate('/resource/add'); }}>
                    <span className="upload-menu-icon">
                      <svg width="28" height="28" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8v8H8z"/></svg>
                    </span>
                    <span>Bài tập</span>
                  </div>
                  <div className="upload-menu-item" onClick={() => { setShowUploadMenu(false); navigate('/teacher/create-lecture', { state: { breadcrumb } }); }}>
                    <span className="upload-menu-icon">
                      <svg width="28" height="28" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="#222"/></svg>
                    </span>
                    <span>Bài giảng</span>
                  </div>
                  <div className="upload-menu-item" onClick={() => { setShowUploadMenu(false); if (fileInputRef.current) fileInputRef.current.click(); }}>
                    <span className="upload-menu-icon">
                      <svg width="28" height="28" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </span>
                    <span>Tài liệu</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="search-box" style={{ position: 'relative' }}>
            <input
              className="search-input"
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="search-icon-inside">
              <svg width="20" height="20" fill="none" stroke="#b0b3b8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
          <div className="block-section-title">{getTitle()}</div>
          <div className="block-grid">
            <div className="block-card create" onClick={handleCreate}>
              <span className="block-folder-icon">{FolderCreateIcon}</span>
              <span className="block-create-label">{getCreateLabel()}</span>
            </div>
            {filteredList.map((item, idx) => (
              <div
                className={`block-card${selectedIndex === idx ? ' selected' : ''}`}
                key={item.name + idx}
                onClick={() => setSelectedIndex(idx)}
                onDoubleClick={() => handleItemClick(item)}
              >
                <span className="block-folder-icon">{selectedIndex === idx ? FolderBlueIcon : FolderBlackIcon}</span>
                <span className="block-info">
                  <span className="block-label">{getTitle()}</span>
                  <span className="block-title">{item.name}</span>
                  {currentType === 'folder' && (
                    <span className="block-hint" style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                      Double-click để mở lớp học
                    </span>
                  )}
                </span>
                <span
                  className="block-more"
                  onClick={e => { e.stopPropagation(); setOpenMenuIndex(openMenuIndex === idx ? null : idx); }}
                >
                  ⋯
                </span>
                {openMenuIndex === idx && (
                  <div className="block-menu">
                    {currentType === 'folder' && (
                      <button 
                        className="block-menu-item" 
                        onClick={() => {
                          const classId = item.name.replace(/\s+/g, '-').toLowerCase();
                          navigate(`/teacher/class/${classId}/announcement`);
                          setOpenMenuIndex(null);
                        }}
                      >
                        Mở lớp học
                      </button>
                    )}
                    <button className="block-menu-item" onClick={() => handleDelete(idx)}>Xóa</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Modal thêm mới */}
          {modal.open && (
            <div className="block-modal-overlay">
              <div className="block-modal-content">
                <div className="block-modal-title">Thêm {getTitle()}</div>
                {modal.items.length > 0 && <>
                  <div className="modal-label">Đề xuất</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {modal.items.map(subj => (
                      <span
                        key={subj}
                        style={{ background: '#f3f4f6', color: '#222', borderRadius: 16, padding: '6px 16px', fontSize: '1rem', cursor: 'pointer' }}
                        onClick={() => handleSuggest(subj)}
                      >
                        {subj}
                      </span>
                    ))}
                  </div>
                </>}
                <div className="modal-label">Nhập tên {getTitle()}</div>
                <input
                  className="block-modal-input"
                  type="text"
                  placeholder={`Nhập tên ${getTitle()} bạn muốn tạo`}
                  value={modal.input}
                  onChange={handleInput}
                  onKeyDown={handleInputKeyDown}
                  autoFocus
                />
                <div className="modal-hint">Bấm phím Enter để xác nhận</div>
                <div className="modal-block-list">
                  {modal.selected.map(name => (
                    <span className="modal-block-tag" key={name}>
                      {name}
                      <button className="modal-block-remove" onClick={() => handleRemoveSelected(name)}>&times;</button>
                    </span>
                  ))}
                </div>
                <div className="modal-footer">
                  <span>Bạn đã chọn {modal.selected.length} {getTitle()}</span>
                </div>
                <div className="modal-actions">
                  <button className="modal-cancel" onClick={handleCloseModal}>Quay lại</button>
                  <button className="modal-add" onClick={handleAdd} disabled={modal.selected.length === 0}>Thêm {getTitle()}</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
