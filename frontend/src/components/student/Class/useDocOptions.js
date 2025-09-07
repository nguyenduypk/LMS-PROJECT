import { useEffect, useMemo, useState } from 'react';

// Lazy import mammoth to avoid breaking the app if dependency is not installed yet
async function convertDocxToHtml(arrayBuffer) {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value || '';
  } catch (e) {
    console.warn('[useDocOptions] mammoth not available or failed:', e);
    return '';
  }
}

function parseOptionsFromHtml(html) {
  if (!html) return {};
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const paragraphs = Array.from(doc.querySelectorAll('p, li, div'));
    const lines = paragraphs
      .map(el => (el.textContent || '').replace(/\u00A0/g, ' ').trim())
      .filter(t => !!t);

    const map = {}; // { questionNumber: { A: '...', B: '...', C: '...', D: '...' } }
    let currentQ = null;

    for (const raw of lines) {
      const line = raw.replace(/\s+/g, ' ').trim();

      // Detect question number like: "1.", "1)", "Câu 1:", "Câu 1"
      const qMatch = line.match(/^(?:Câu\s*)?(\d{1,3})[\.:)\s-]+/i);
      if (qMatch) {
        currentQ = parseInt(qMatch[1], 10);
        if (!map[currentQ]) map[currentQ] = {};
        continue;
      }

      // Detect options like "A. 4" / "B) 5" / "C : 6"
      const oMatch = line.match(/^([ABCD])\s*[\.:)\-]?\s*(.+)$/i);
      if (oMatch && currentQ != null) {
        const letter = oMatch[1].toUpperCase();
        const text = oMatch[2].trim();
        if (!map[currentQ]) map[currentQ] = {};
        if (!map[currentQ][letter]) map[currentQ][letter] = text;
      }
    }

    return map;
  } catch (e) {
    console.warn('[useDocOptions] parse failed:', e);
    return {};
  }
}

export default function useDocOptions(docUrl) {
  const [map, setMap] = useState({});
  const isDocx = useMemo(() => typeof docUrl === 'string' && /\.docx?($|\?|#)/i.test(docUrl), [docUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!docUrl || !isDocx) { setMap({}); return; }
      try {
        const resp = await fetch(docUrl);
        if (!resp.ok) { setMap({}); return; }
        const buf = await resp.arrayBuffer();
        const html = await convertDocxToHtml(buf);
        if (cancelled) return;
        const parsed = parseOptionsFromHtml(html);
        setMap(parsed);
      } catch (e) {
        console.warn('[useDocOptions] load failed:', e);
        setMap({});
      }
    })();
    return () => { cancelled = true; };
  }, [docUrl, isDocx]);

  return map; // caller indexes by questionNumber then letter
}
