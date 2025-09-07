import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader';
import ClassSidebar from './ClassSidebar';
import DocumentViewer from './DocumentViewer';
import '../../../styles/ClassMaterialsPage.css';

// Mock dữ liệu tài liệu (có thể thay bằng API thực tế)
const documents = [
  {
    id: '1',
    title: 'qpan.docx',
    type: 'DOCX',
    src: 'https://view.officeapps.live.com/op/embed.aspx?src=https://filesamples.com/samples/document/docx/sample1.docx',
  },
  {
    id: '2',
    title: 'bai_giang.pdf',
    type: 'PDF',
    src: 'https://docs.google.com/gview?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf&embedded=true',
  },
];

function StudentDocumentViewPage({ classInfo }) {
  const { classCode, docId } = useParams();
  const navigate = useNavigate();

  // Lấy thông tin tài liệu theo docId
  const document = documents.find((d) => d.id === docId);

  if (!document) {
    return <div style={{ padding: 32 }}>Không tìm thấy tài liệu.</div>;
  }

  // Hàm quay lại đúng trang tài liệu của lớp
  const handleBack = () => {
    navigate(`/student/class/${classCode}/materials`);
  };

  return (
    <div className="class-document-page">
      <DashboardHeader />
      <div className="class-document-page__content">
        <ClassSidebar classInfo={classInfo} />
        <div className="class-document-page__main" style={{ justifyContent: 'center', alignItems: 'stretch', padding: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header tài liệu */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0', background: '#fafbfc', padding: '0 0 0 0', minHeight: 56 }}>
              <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#1976d2', fontWeight: 500, cursor: 'pointer', fontSize: 15, padding: '0 24px', height: 56 }}>
                Quay lại
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 17, color: '#222' }}>{document.title}</div>
              <div style={{ width: 90 }}></div> {/* Để cân bằng với nút Quay lại */}
            </div>
            {/* Nội dung tài liệu */}
            <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'stretch', padding: 0 }}>
              <div style={{ width: '100%', height: '100%' }}>
                <DocumentViewer src={document.src} title={document.title} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDocumentViewPage; 