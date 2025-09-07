import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../utils/api';

// Lazy-load mammoth only in browser
let mammothPromise = null;
function loadMammoth() {
  if (!mammothPromise) {
    mammothPromise = import('mammoth');
  }
  return mammothPromise;
}

const BACKEND_ORIGIN = (() => {
  try { return new URL(API_BASE_URL).origin; } catch (_) { return ''; }
})();

function toAbsolute(raw) {
  if (!raw) return '';
  try {
    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        const isUploads = u.pathname.startsWith('/uploads');
        const frontHosts = ['localhost:3000', '127.0.0.1:3000'];
        const isFront = frontHosts.includes(u.host);
        if (isUploads && isFront && BACKEND_ORIGIN) {
          return `${BACKEND_ORIGIN}${u.pathname}${u.search}${u.hash}`;
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
  } catch (_) { return raw; }
}

export default function DocxInlineViewer({ src }) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true); setError(''); setHtml('');
      try {
        const url = toAbsolute(src);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        const mammoth = await loadMammoth();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value || '');
      } catch (e) {
        if (!cancelled) setError(`Không thể hiển thị file .docx: ${e?.message || e}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [src]);

  if (loading) return <div style={{ padding: 12, color: '#607d8b' }}>Đang tải tài liệu...</div>;
  if (error) return (
    <div style={{ padding: 12, color: '#b00020' }}>
      {error}
    </div>
  );
  return (
    <div style={{ padding: 16, overflow: 'auto' }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
