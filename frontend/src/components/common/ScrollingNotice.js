import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/ScrollingNotice.css';

// Simple reusable scrolling notice (marquee-like)
// Props:
// - message: string (required)
// - linkText: string (optional)
// - linkHref: string (optional)
// - tone: 'info' | 'warning' | 'danger' | 'success' (optional, default 'info')
// - visible: boolean (optional, default true)
export default function ScrollingNotice({ message, messages, linkText, linkHref, tone = 'info', visible = true }) {
  const messageList = useMemo(() => {
    if (Array.isArray(messages) && messages.length > 0) return messages.filter(Boolean);
    if (message) return [message];
    return [];
  }, [messages, message]);

  const isVisible = !!visible && messageList.length > 0;

  const toneMap = {
    info: { bg: '#eef6ff', border: '#b3d4ff', text: '#1e40af' },
    warning: { bg: '#fffbea', border: '#fde68a', text: '#92400e' },
    danger: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  };

  const c = toneMap[tone] || toneMap.info;

  // Tính thời gian chạy mượt theo độ dài nội dung
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const [durationSec, setDurationSec] = useState(18);
  const [index, setIndex] = useState(0);
  const [styleVars, setStyleVars] = useState({ start: '100%', end: '-100%' });
  const [runId, setRunId] = useState(0); // dùng để restart animation khi chỉ có 1 message

  useEffect(() => {
    if (!isVisible) return;
    const viewport = viewportRef.current;
    const textEl = textRef.current;
    if (!viewport || !textEl) return;

    // Tính từ phải (ngoài viewport) tới trái hết nội dung
    const vw = viewport.offsetWidth;
    const tw = textEl.offsetWidth;

    // tốc độ mong muốn (px/s). Có thể tinh chỉnh 60-100 cho mượt
    const SPEED = 80;
    let secs = (vw + tw) / SPEED; // phải đi qua toàn bộ đoạn đường

    // Giới hạn min/max để tránh quá nhanh/chậm
    secs = Math.max(12, Math.min(40, secs));
    setDurationSec(secs);
    setStyleVars({ start: `${vw}px`, end: `-${tw}px` });
  }, [isVisible, index, messageList]);

  // Khi kết thúc 1 lượt chạy, chuyển sang message tiếp theo
  const handleAnimationEnd = () => {
    if (messageList.length <= 1) {
      // restart cùng 1 message bằng cách đổi key
      setRunId((r) => r + 1);
      return;
    }
    setIndex((prev) => (prev + 1) % messageList.length);
  };

  if (!isVisible) return null;

  return (
    <div className="scrolling-notice" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      <div className="scrolling-notice__viewport" ref={viewportRef}>
        <div
          className="scrolling-notice__track scrolling-notice__track--ticker"
          style={{ ['--marquee-duration']: `${durationSec}s`, ['--start']: styleVars.start, ['--end']: styleVars.end }}
          onAnimationEnd={handleAnimationEnd}
          key={`${index}-${runId}`}
        >
          <span className="scrolling-notice__text" ref={textRef}>
            {messageList[index]}
          </span>
        </div>
      </div>
    </div>
  );
}
