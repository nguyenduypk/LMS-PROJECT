import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader';
import ClassSidebar from './ClassSidebar';
import '../../../styles/ClassMaterialsPage.css';
import { api } from '../../../utils/api';

import { 
  MdFolder, 
  MdAdd, 
  MdSearch, 
  MdShare,
  MdMoreVert,
  MdDelete,
  MdContentCopy,
  MdVisibility,
  MdDownload
} from 'react-icons/md';

function ClassMaterialsPage({ classInfo }) {
  const navigate = useNavigate();
  const { classCode } = useParams();
  const [selectedDocument, setSelectedDocument] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('newest');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Load documents by classId from classInfo
  useEffect(() => {
    const load = async () => {
      const classId = classInfo?.id;
      if (!classId) return;
      setDocsLoading(true);
      try {
        // Chỉ lấy tài liệu chung, loại bỏ file đính kèm bài tập để tránh nhầm lẫn
        const rows = await api.documents.listByClass(classId, { excludeAttachments: true });
        const mapped = (rows || []).map(r => ({
          id: r.id,
          title: r.title || r.original_name,
          type: (r.original_name?.split('.').pop() || '').toUpperCase(),
          progress: '',
          completed: 0,
          total: 0,
          icon: (r.mime_type || '').includes('pdf') ? 'P' : 'W',
          date: new Date(r.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
        }));
        setDocuments(mapped);
      } catch (e) {
        console.error('Load documents (student) error:', e);
        setDocuments([]);
      } finally {
        setDocsLoading(false);
      }
    };
    load();
  }, [classInfo?.id]);

  const handleMenuToggle = (documentId, event) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === documentId ? null : documentId);
  };

  const handleMenuAction = async (action, document) => {
    setOpenMenuId(null);
    if (action === 'view') {
      navigate(`/student/class/${classCode}/documents/${document.id}`);
    } else if (action === 'download') {
      try {
        await api.documents.download(document.id);
      } catch (e) {
        alert('Không thể tải xuống tài liệu');
      }
    }
  };

  const handleDocumentClick = (document) => {
    if (!isSelectionMode) {
      navigate(`/student/class/${classCode}/documents/${document.id}`);
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setIsSortDropdownOpen(false);
  };

  const handleSortClick = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  return (
    <div className="class-document-page">
      <DashboardHeader />
      <div className="class-document-page__content">
        <ClassSidebar classInfo={classInfo} />
        
        {/* Header "Tài liệu lớp học" */}
        <div className="class-document-page__header">
          <h1 className="class-document-page__title">Tài liệu lớp học</h1>
        </div>

        {/* Main Content Area */}
        <div className="class-document-page__main">
          {/* Left Sidebar - Folder Navigation */}
          <div className="class-document-page__folder-sidebar">
            <div className="document-folder-sidebar__header">
              <div className="document-folder-sidebar__title">
                <span>Thư mục</span>
              </div>
            </div>
            
            <div className="document-folder-sidebar__content">
              <div className="document-folder-item document-folder-item--active">
                <div className="document-folder-item__icon">
                  <MdFolder size={20} />
                </div>
                <span className="document-folder-item__text">Tất cả tài liệu</span>
              </div>
            </div>
          </div>

          {/* Main Content - Toolbar + Document List */}
          <div className="class-document-page__main-content">
            {/* Toolbar */}
            <div className="class-document-page__toolbar">
              <div className="document-toolbar__search">
                <MdSearch size={20} />
                <input type="text" placeholder="Tìm kiếm tài liệu..." />
              </div>
              
              <select 
                className={`document-toolbar__sort ${isSortDropdownOpen ? 'document-toolbar__sort--open' : ''}`}
                value={sortBy}
                onChange={handleSortChange}
                onClick={handleSortClick}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name">Tên</option>
              </select>
            </div>

            {/* Selection Bar removed for students (no bulk actions) */}

            {/* Document List */}
            <div className="class-document-page__list-container">
              <div className="document-list">
                {docsLoading && (
                  <div style={{ padding: '12px', color: '#666' }}>Đang tải danh sách tài liệu...</div>
                )}
                {!docsLoading && documents.length === 0 && (
                  <div style={{ padding: '12px', color: '#666' }}>Chưa có tài liệu</div>
                )}
                {!docsLoading && documents.map((document) => (
                  <div 
                    key={document.id}
                    className={`document-item ${isSelectionMode ? 'selection-mode' : ''}`}
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
                        className="document-checkbox"
                      />
                    )}
                    <div className={`document-item__icon ${document.type === 'PDF' ? 'document-item__icon--pdf' : ''}`}>
                      {document.icon}
                    </div>
                    <div className="document-item__content">
                      <div className="document-item__title">{document.title}</div>
                      <div className="document-item__info">
                        <span className="document-item__progress">{document.progress}</span>
                        <span className="document-item__separator">•</span>
                        <span className="document-item__date">{document.date}</span>
                      </div>
                    </div>
                    <div className="document-item__actions">
                      <div className="document-item__menu-container">
                        <button 
                          className="document-item__more-btn"
                          onClick={(e) => handleMenuToggle(document.id, e)}
                        >
                          <MdMoreVert size={20} />
                        </button>
                        {openMenuId === document.id && (
                          <div className="document-item__dropdown-menu">
                            <button 
                              className="dropdown-menu__item"
                              onClick={() => handleMenuAction('view', document)}
                            >
                              <MdVisibility size={16} />
                              <span>Xem</span>
                            </button>
                            <button 
                              className="dropdown-menu__item"
                              onClick={() => handleMenuAction('download', document)}
                            >
                              <MdDownload size={16} />
                              <span>Tải về</span>
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
        </div>
      </div>
    </div>
  );
}

export default ClassMaterialsPage; 