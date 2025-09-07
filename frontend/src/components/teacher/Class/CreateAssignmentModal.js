import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateAssignmentModal.css';

function CreateAssignmentModal({ isOpen, onClose, classId }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="create-assignment-modal-overlay" onClick={onClose}>
      <div className="create-assignment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="create-assignment-modal__close-btn" onClick={onClose}>
          ×
        </button>

        {/* Modal Content */}
        <div className="create-assignment-modal__content">
          <h2>Tạo bài tập mới</h2>
          <div className="create-assignment-modal__options">
            {/* Option 1: Tạo theo khung mẫu */}
            <div className="create-assignment-modal__option">
              <div className="create-assignment-modal__option-icon create-assignment-modal__option-icon--template">
                📝
              </div>
              <div className="create-assignment-modal__option-content">
                <h3 className="create-assignment-modal__option-title">Tạo từ mẫu</h3>
                <p className="create-assignment-modal__option-description">
                  Sử dụng các mẫu bài tập có sẵn để tạo nhanh
                </p>
              </div>
              <button 
                className="create-assignment-modal__option-btn"
                onClick={() => {
                  onClose();
                  navigate(`/teacher/class/${classId}/create-assignment`);
                }}
              >
                Chọn
              </button>
            </div>

            {/* Option 2: Tải lên */}
            <div className="create-assignment-modal__option">
              <div className="create-assignment-modal__option-icon create-assignment-modal__option-icon--upload">
                📤
              </div>
              <div className="create-assignment-modal__option-content">
                <h3 className="create-assignment-modal__option-title">Tải lên tài liệu</h3>
                <p className="create-assignment-modal__option-description">
                  Tải lên file PDF, Word để tạo bài tập
                </p>
              </div>
              <button 
                className="create-assignment-modal__option-btn"
                onClick={() => {
                  onClose();
                  navigate(`/teacher/class/${classId}/upload-assignment`);
                }}
              >
                Chọn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAssignmentModal; 