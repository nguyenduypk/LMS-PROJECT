import React, { useState } from 'react';
import './BlockManager.css';

const initialBlocks = [
  { name: '6' },
  { name: '7' },
  { name: '8' },
  { name: '9' },
  { name: '10' },
  { name: '11' },
  { name: '12' },
  { name: 'Cao đẳng' },
  { name: 'Đại học' },
];

export default function BlockManager() {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [sortOrder, setSortOrder] = useState('Mới nhất');
  const [showDetail, setShowDetail] = useState(true);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const filteredBlocks = blocks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateBlock = () => {
    setIsModalOpen(true);
    setNewBlockName('');
  };

  const handleAddBlock = () => {
    if (newBlockName.trim() && !blocks.some(b => b.name === newBlockName.trim())) {
      setBlocks([{ name: newBlockName.trim() }, ...blocks]);
      setIsModalOpen(false);
      setNewBlockName('');
    }
  };

  const handleDeleteBlock = idx => {
    setBlocks(blocks.filter((_, i) => i !== idx));
    setOpenMenuIndex(null);
  };

  return (
    <div className="block-manager-layout">
      <aside className="block-sidebar">
        <div className="sidebar-title">Đề chưa phân loại</div>
        <button className="sidebar-sort" onClick={() => setSortOrder(s => s === 'Mới nhất' ? 'Cũ nhất' : 'Mới nhất')}>⇅ {sortOrder}</button>
        <div className="sidebar-toggle-detail">
          <span>Hiển thị chi tiết học liệu</span>
          <label className="switch">
            <input type="checkbox" checked={showDetail} onChange={() => setShowDetail(v => !v)} />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="sidebar-empty">Không còn học liệu chưa phân loại.</div>
      </aside>
      <main className="block-main">
        <div className="block-main-header">
          <h2>Học liệu</h2>
          <div className="block-main-controls">
            <button className="block-upload">Tải lên</button>
          </div>
        </div>
        <div className="block-search-bar">
          <input type="text" placeholder="Tìm kiếm" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="block-search-icon">🔍</span>
        </div>
        <div className="block-section-title">Khối</div>
        <div className="block-grid">
          <div className="block-card create" onClick={handleCreateBlock}>
            <span className="block-folder-icon" style={{ color: '#2196f3' }}>📁</span>
            <span className="block-create-label">Tạo khối mới</span>
          </div>
          {filteredBlocks.map((block, idx) => (
            <div className="block-card" key={block.name + idx}>
              <span className="block-folder-icon">📁</span>
              <span className="block-info">
                <span className="block-label">Khối</span>
                <span className="block-title">{block.name}</span>
              </span>
              <span className="block-more" onClick={() => setOpenMenuIndex(openMenuIndex === idx ? null : idx)}>⋯</span>
              {openMenuIndex === idx && (
                <div className="block-menu">
                  <button className="block-menu-item" onClick={() => handleDeleteBlock(idx)}>Xóa</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {isModalOpen && (
          <div className="block-modal-overlay">
            <div className="block-modal-content">
              <div className="block-modal-title">Thêm Khối</div>
              <input
                className="block-modal-input"
                type="text"
                placeholder="Nhập tên Khối bạn muốn tạo"
                value={newBlockName}
                onChange={e => setNewBlockName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddBlock()}
                autoFocus
              />
              <div className="block-modal-actions">
                <button onClick={() => setIsModalOpen(false)}>Quay lại</button>
                <button onClick={handleAddBlock} disabled={!newBlockName.trim()}>Thêm Khối</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 