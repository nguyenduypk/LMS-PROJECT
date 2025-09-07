import React from 'react';

function DocumentViewer({ src, title }) {
  return (
    <div className="document-viewer" style={{ position: 'relative', boxShadow: '0 2px 16px rgba(30,136,229,0.10)', background: '#fff', padding: 0, width: '100%', height: '100%', maxWidth: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', margin: 0, borderRadius: 0 }}>
      <iframe
        src={src}
        style={{ display: 'block', width: '100%', height: '100%', border: 'none', background: '#fff', borderRadius: 0 }}
        title={title}
      />
    </div>
  );
}

export default DocumentViewer; 