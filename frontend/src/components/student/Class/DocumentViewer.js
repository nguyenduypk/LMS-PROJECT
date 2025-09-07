import React, { useMemo } from 'react';
import { API_BASE_URL } from '../../../utils/api';
import DocxInlineViewer from './DocxInlineViewer';

const BACKEND_ORIGIN = (() => {
  try { return new URL(API_BASE_URL).origin; } catch (_) { return ''; }
})();

function toAbsolute(raw) {
  if (!raw) return '';
  try {
    if (/^https?:\/\//i.test(raw)) {
      // Nếu là URL tuyệt đối nhưng trỏ về frontend origin và path là /uploads, chuyển sang backend origin
      try {
        const parsed = new URL(raw);
        const isUploads = parsed.pathname.startsWith('/uploads');
        const frontHosts = ['localhost:3000', '127.0.0.1:3000'];
        const isFront = frontHosts.includes(parsed.host);
        if (isUploads && isFront && BACKEND_ORIGIN) {
          return `${BACKEND_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch (_) {}
      return raw;
    }
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
    const isUploads = raw.startsWith('/uploads');
    const targetOrigin = isUploads && BACKEND_ORIGIN ? BACKEND_ORIGIN : origin;
    if (!targetOrigin) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${targetOrigin}${path}`;
  } catch (_) {
    return raw;
  }
}

function buildEmbeddableUrl(raw) {
  if (!raw) return '';
  const absolute = toAbsolute(raw);
  try {
    const url = new URL(absolute);
    const href = url.toString();

    // Google Forms
    if (url.hostname.includes('docs.google.com') && url.pathname.includes('/forms')) {
      let path = url.pathname.replace(/\/edit$/, '/viewform');
      if (!/\/viewform($|\?)/.test(path)) path = path.endsWith('/') ? path + 'viewform' : path + '/viewform';
      url.pathname = path;
      if (!url.searchParams.has('embedded')) url.searchParams.set('embedded', 'true');
      return url.toString();
    }

    // Google Drive direct file preview
    if (url.hostname.includes('drive.google.com')) {
      // formats: /file/d/<id>/view or /open?id=<id>
      const m = href.match(/\/file\/d\/([^/]+)\//);
      const id = m ? m[1] : url.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
      return href;
    }

    // Google Docs/Sheets/Slides preview
    if (url.hostname.includes('docs.google.com')) {
      if (!/\/preview($|\?)/.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/edit$/, '/preview');
      }
      return url.toString();
    }

    // Office files via Office Online viewer (only for public hosts)
    const officeExt = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
    const lower = href.toLowerCase();
    if (officeExt.some(ext => lower.endsWith(ext))) {
      const host = url.hostname || '';
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      if (isLocal) {
        // Không thể nhúng Office từ localhost (Office viewer không truy cập được). Hiển thị fallback.
        return '';
      }
      const enc = encodeURIComponent(href);
      return `https://view.officeapps.live.com/op/embed.aspx?src=${enc}`;
    }

    // PDFs usually embed fine directly
    if (lower.endsWith('.pdf')) return href;

    // Default: return as-is (may be blocked by X-Frame-Options)
    return href;
  } catch (_) {
    return absolute;
  }
}

function DocumentViewer({ src, title }) {
  const viewerSrc = useMemo(() => buildEmbeddableUrl(src), [src]);
  const openHref = useMemo(() => toAbsolute(src), [src]);
  const isLocalOffice = useMemo(() => {
    try {
      const abs = toAbsolute(src);
      if (!abs) return false;
      const url = new URL(abs);
      const lower = abs.toLowerCase();
      const officeExt = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
      const isOffice = officeExt.some(ext => lower.endsWith(ext));
      const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      return isOffice && isLocal;
    } catch (_) { return false; }
  }, [src]);
  const safeTitle = title || 'Document';
  return (
    <div className="document-viewer" style={{ position: 'relative', boxShadow: '0 2px 16px rgba(30,136,229,0.10)', background: '#fff', padding: 0, width: '100%', height: '100%', maxWidth: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', margin: 0, borderRadius: 0 }}>
      {viewerSrc ? (
        <iframe
          src={viewerSrc}
          style={{ display: 'block', width: '100%', height: '100%', border: 'none', background: '#fff', borderRadius: 0 }}
          title={safeTitle}
        />
      ) : isLocalOffice ? (
        <DocxInlineViewer src={src} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', color: '#607d8b', padding: 16, textAlign: 'center' }}>
          {src ? (
            <>
              <div style={{ fontSize: 14 }}>Tài liệu không thể nhúng để xem trực tiếp (ví dụ: file Office trên môi trường cục bộ).</div>
              <a href={openHref} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#1976d2', color: '#fff', padding: '8px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>Mở trong tab mới</a>
            </>
          ) : (
            <div>Không có tài liệu để hiển thị.</div>
          )}
        </div>
      )}
      {/* Fallback quick access (small link at corner) */}
      {src && viewerSrc && (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <a href={openHref} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1976d2' }}>Mở trong tab mới</a>
        </div>
      )}
    </div>
  );
}

export default DocumentViewer;