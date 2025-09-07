import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../utils/api';

import Header from '../Header';
import TeacherSidebar from './TeacherSidebar';
import '../../../styles/TeacherMaterialsPage.css';
import { 
  MdFolder, 
  MdAdd, 
  MdSearch, 
  MdShare,
  MdMoreVert,
  MdDelete,
  MdContentCopy,
  MdVisibility,
  MdDownload,
  MdUpload
} from 'react-icons/md';

// Human-readable file size
const formatFileSize = (bytes) => {
  const n = Number(bytes);
  if (!isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(gb < 10 ? 1 : 1)} GB`;
};

function TeacherMaterialsPage() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('newest');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');


  // Fetch class information
  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        console.log('🔍 TeacherMaterialsPage: Fetching class info for classId:', classId);
        
        const data = await api.classes.getById(classId);
        console.log('🔍 TeacherMaterialsPage: API response data:', data);
        
        if (data.class) {
          const transformedClassInfo = {
            id: data.class.id,
            name: data.class.name,
            code: data.class.class_code,
            teacher: data.class.teacher_name || 'Giáo viên',
            image: 'https://i.imgur.com/0y8Ftya.jpg',
            students: data.class.student_count || 0,
            lectures: 0,
            homeworks: data.class.assignment_count || 0,
            materials: data.class.material_count || 0,
          };
          setClassInfo(transformedClassInfo);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('🔍 TeacherMaterialsPage: Error fetching class info:', error);
        // Don't use fallback data, let the error show
        setClassInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassInfo();
    } else {
      setLoading(false);
    }
  }, [classId]);

  // Load documents for class
  useEffect(() => {
    const loadDocuments = async () => {
      if (!classId) return;
      setDocsLoading(true);
      try {
        const rows = await api.documents.listByClass(classId, { excludeAttachments: true });
        const mapped = (rows || []).map(r => ({
          id: r.id,
          title: r.title || r.original_name,
          type: (r.original_name?.split('.').pop() || '').toUpperCase(),
          size: formatFileSize(r.size),
          progress: '',
          completed: 0,
          total: 0,
          icon: (r.mime_type || '').includes('pdf') ? 'P' : 'W',
          date: new Date(r.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
        }));
        setDocuments(mapped);
      } catch (e) {
        console.error('Load documents error:', e);
        setDocuments([]);
      } finally {
        setDocsLoading(false);
      }
    };
    loadDocuments();
  }, [classId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải thông tin lớp học...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>Lỗi tải thông tin lớp học</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Vui lòng kiểm tra lại kết nối hoặc thử lại sau</div>
      </div>
    );
  }

  const handleMenuToggle = (documentId, event) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === documentId ? null : documentId);
  };

  const handleMenuAction = async (action, document) => {
    setOpenMenuId(null);
    
    if (action === 'view') {
      // Mở xem trước trong tab mới
      try {
        await api.documents.viewInline(document.id);
      } catch (e) {
        console.error('Không thể mở xem trước tài liệu', e);
      }
    } else if (action === 'download') {
      try {
        await api.documents.download(document.id);
      } catch (e) {
        console.error('Không thể tải xuống tài liệu', e);
      }
    } else if (action === 'delete') {
      // Open custom modal for single delete
      setPendingDeleteIds([document.id]);
      setDeleteError('');
      setIsDeleteModalOpen(true);
    }
  };

  // Helper: refresh documents list
  const refreshDocuments = async () => {
    if (!classId) return;
    setDocsLoading(true);
    try {
      const rows = await api.documents.listByClass(classId, { excludeAttachments: true });
      const mapped = (rows || []).map(r => ({
        id: r.id,
        title: r.title || r.original_name,
        type: (r.original_name?.split('.').pop() || '').toUpperCase(),
        size: formatFileSize(r.size),
        progress: '',
        completed: 0,
        total: 0,
        icon: (r.mime_type || '').includes('pdf') ? 'P' : 'W',
        date: new Date(r.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
      }));
      setDocuments(mapped);
    } catch (e) {
      console.error('Refresh documents error:', e);
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  // Open modal for bulk delete
  const handleBulkDelete = () => {
    if (!selectedItems.length) return;
    setPendingDeleteIds(selectedItems);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setIsDeleteModalOpen(false);
    setPendingDeleteIds([]);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!pendingDeleteIds.length) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await Promise.all(pendingDeleteIds.map(id => api.documents.remove(id)));
      await refreshDocuments();
      setSelectedItems([]);
      setIsSelectionMode(false);
      setIsDeleteModalOpen(false);
    } catch (e) {
      console.error('Delete error:', e);
      setDeleteError('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDocumentClick = async (document) => {
    if (!isSelectionMode) {
      // Mặc định: mở xem trước trong tab mới
      try {
        await api.documents.viewInline(document.id);
      } catch (e) {
        alert('Không thể mở xem trước tài liệu');
      }
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setIsSortDropdownOpen(false);
  };

  const handleSortClick = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  // File upload functions
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      await api.documents.upload({ classId, file: files[0], title: files[0].name });
      // reload
      const rows = await api.documents.listByClass(classId, { excludeAttachments: true });
      const mapped = (rows || []).map(r => ({
        id: r.id,
        title: r.title || r.original_name,
        type: (r.original_name?.split('.').pop() || '').toUpperCase(),
        size: formatFileSize(r.size),
        progress: '',
        completed: 0,
        total: 0,
        icon: (r.mime_type || '').includes('pdf') ? 'P' : 'W',
        date: new Date(r.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
      }));
      setDocuments(mapped);
      alert('Tải lên tài liệu thành công!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Có lỗi xảy ra khi tải lên tài liệu: ${error?.message || 'Không rõ nguyên nhân'}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="teacher-document-page">
      <Header />
      <div className="teacher-document-page__content">
        <TeacherSidebar classInfo={classInfo} />
        
        {/* Header "Tài liệu lớp học" */}
        <div className="teacher-document-page__header">
          <h1 className="teacher-document-page__title">Tài liệu lớp học</h1>
        </div>

        {/* Main Content Area */}
        <div className="teacher-document-page__main">
          {/* Left Sidebar - Folder Navigation */}
          <div className="teacher-document-page__folder-sidebar">
            <div className="teacher-document-folder-sidebar__header">
              <div className="teacher-document-folder-sidebar__title">
                <span>Thư mục</span>
                <button 
                  className="teacher-document-folder-sidebar__add-icon"
                  onClick={() => {
                    const folderName = prompt('Nhập tên thư mục mới:');
                    if (folderName) {
                      alert(`Đã tạo thư mục: ${folderName}`);
                    }
                  }}
                  title="Tạo thư mục mới"
                >
                  <MdFolder size={20} />
                  <MdAdd size={12} style={{ position: 'absolute', bottom: '-2px', right: '-2px' }} />
                </button>
              </div>
            </div>
            
            <div className="teacher-document-folder-sidebar__content">
              <div className="teacher-document-folder-item teacher-document-folder-item--active">
                <div className="teacher-document-folder-item__icon">
                  <MdFolder size={20} />
                </div>
                <span className="teacher-document-folder-item__text">Tất cả tài liệu</span>
              </div>
            </div>
          </div>

          {/* Main Content - Toolbar + Document List */}
          <div className="teacher-document-page__main-content">
            {/* Toolbar */}
            <div className="teacher-document-page__toolbar">
              <div className="teacher-document-toolbar__view-toggle">
                <button 
                  className={`teacher-document-view-toggle__btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode('list');
                    setIsSelectionMode(false);
                    setSelectedItems([]);
                  }}
                >
                  ☰
                </button>
                <button 
                  className={`teacher-document-view-toggle__btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode('grid');
                    setIsSelectionMode(true);
                  }}
                >
                  ☰✓
                </button>
              </div>

              <div className="teacher-document-toolbar__search">
                <MdSearch size={20} />
                <input type="text" placeholder="Tìm kiếm tài liệu..." />
              </div>
              
              <div className="teacher-document-toolbar__sort-container">
                <div 
                  className="teacher-document-toolbar__sort-button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                >
                  <span>{sortBy === 'newest' ? 'Mới nhất' : sortBy === 'oldest' ? 'Cũ nhất' : 'Tên'}</span>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className={`teacher-document-toolbar__sort-arrow ${isSortDropdownOpen ? 'rotated' : ''}`}
                  >
                    <path d="m7 10 5 5 5-5z" fill="currentColor"/>
                  </svg>
                </div>
                {isSortDropdownOpen && (
                  <div className="teacher-document-toolbar__sort-menu">
                    <div 
                      className={`teacher-document-toolbar__sort-item ${sortBy === 'newest' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('newest');
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Mới nhất
                    </div>
                    <div 
                      className={`teacher-document-toolbar__sort-item ${sortBy === 'oldest' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('oldest');
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Cũ nhất
                    </div>
                    <div 
                      className={`teacher-document-toolbar__sort-item ${sortBy === 'name' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('name');
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Tên
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button 
                className="teacher-document-toolbar__upload-btn"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="upload-spinner"></div>
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <MdUpload size={16} />
                    Tải lên tài liệu
                  </>
                )}
              </button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                style={{ display: 'none' }}
                multiple={false}
              />
            </div>

            {/* Selection Bar */}
            {isSelectionMode && (
              <div className="teacher-document-page__selection-bar">
                <div className="teacher-document-selection-bar__left">
                  <input 
                    type="checkbox" 
                    checked={documents.length > 0 && selectedItems.length === documents.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(documents.map(d => d.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                  <span>
                    Đang chọn <span className="teacher-document-selection-count">{selectedItems.length} tài liệu</span>
                  </span>
                </div>
                <div className="teacher-document-selection-bar__right">
                  <button 
                    className="teacher-document-selection-action-btn"
                    onClick={handleBulkDelete}
                    disabled={selectedItems.length === 0}
                    title={selectedItems.length === 0 ? 'Chọn ít nhất 1 tài liệu để xóa' : 'Xóa các tài liệu đã chọn'}
                  >
                    <MdDelete size={16} />
                    Xoá
                  </button>
                </div>
              </div>
            )}

            {/* Document List */}
            <div className="teacher-document-page__list-container">
              <div className="teacher-document-list">
                {!docsLoading && documents.map((document) => (
                  <div 
                    key={document.id}
                    className={`teacher-document-item ${isSelectionMode ? 'selection-mode' : ''}`}
                    onClick={() => {
                      if (isSelectionMode) {
                        if (selectedItems.includes(document.id)) {
                          setSelectedItems(selectedItems.filter(id => id !== document.id));
                        } else {
                          setSelectedItems([...selectedItems, document.id]);
                        }
                      } else {
                        handleDocumentClick(document);
                      }
                    }}
                  >
                    {isSelectionMode && (
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(document.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, document.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== document.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="teacher-document-checkbox"
                      />
                    )}
                    <div className={`teacher-document-item__icon ${document.type === 'PDF' ? 'teacher-document-item__icon--pdf' : ''}`}>
                      {document.icon}
                    </div>
                    <div className="teacher-document-item__content">
                      <div className="teacher-document-item__title">{document.title}</div>
                      <div className="teacher-document-item__info">
                        <span className="teacher-document-item__progress">{document.progress}</span>
                        <span className="teacher-document-item__separator">•</span>
                        <span className="teacher-document-item__size">{document.size}</span>
                        <span className="teacher-document-item__separator">•</span>
                        <span className="teacher-document-item__date">{document.date}</span>
                      </div>
                    </div>
                    <div className="teacher-document-item__actions">
                      <div className="teacher-document-item__menu-container">
                        <button 
                          className="teacher-document-item__more-btn"
                          onClick={(e) => handleMenuToggle(document.id, e)}
                        >
                          <MdMoreVert size={20} />
                        </button>
                        {openMenuId === document.id && (
                          <div className="teacher-document-item__dropdown-menu">
                            <button 
                              className="teacher-dropdown-menu__item"
                              onClick={(e) => { e.stopPropagation(); handleMenuAction('view', document); }}
                            >
                              <MdVisibility size={16} />
                              <span>Xem</span>
                            </button>
                            
                            <button 
                              className="teacher-dropdown-menu__item"
                              onClick={(e) => { e.stopPropagation(); handleMenuAction('download', document); }}
                            >
                              <MdDownload size={16} />
                              <span>Tải về</span>
                            </button>
                            <button 
                              className="teacher-dropdown-menu__item"
                              onClick={(e) => { e.stopPropagation(); handleMenuAction('delete', document); }}
                            >
                              <MdDelete size={16} />
                              <span>Xóa tài liệu</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="teacher-doc-modal-overlay" onClick={closeDeleteModal}>
              <div className="teacher-doc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="teacher-doc-modal__title">Xác nhận xóa</div>
                <div className="teacher-doc-modal__body">
                  {pendingDeleteIds.length === 1 ? (
                    <span>Bạn có chắc muốn xóa tài liệu này? Hành động không thể hoàn tác.</span>
                  ) : (
                    <span>Bạn có chắc muốn xóa {pendingDeleteIds.length} tài liệu đã chọn? Hành động không thể hoàn tác.</span>
                  )}
                  {deleteError && (
                    <div style={{ color: 'red', marginTop: 8 }}>{deleteError}</div>
                  )}
                </div>
                <div className="teacher-doc-modal__actions">
                  <button onClick={closeDeleteModal} disabled={deleting}>Hủy</button>
                  <button onClick={confirmDelete} disabled={deleting} style={{ background: '#d93025', color: '#fff' }}>
                    {deleting ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
              <style>{`
                .teacher-doc-modal-overlay {
                  position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 1000;
                }
                .teacher-doc-modal { background: #fff; border-radius: 8px; width: 420px; max-width: calc(100% - 32px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
                .teacher-doc-modal__title { font-weight: 600; font-size: 16px; padding: 16px 20px; border-bottom: 1px solid #eee; }
                .teacher-doc-modal__body { padding: 16px 20px; font-size: 14px; color: #333; }
                .teacher-doc-modal__actions { padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #eee; }
                .teacher-doc-modal__actions button { padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd; background: #f7f7f7; cursor: pointer; }
                .teacher-doc-modal__actions button[disabled] { opacity: 0.6; cursor: not-allowed; }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherMaterialsPage; 