import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import Header from '../Header';
import DocumentViewer from './DocumentViewer';
import './UploadAssignmentPage.css';
import './CreateAssignmentPage.css';

function UploadAssignmentPage({ classInfo }) {
  // Router hooks
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formInput, setFormInput] = useState('');
  // Local-only preview (does not upload into Google Form)
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [localPreviewName, setLocalPreviewName] = useState('');
  const localFileInputRef = useRef(null);


  // Quick input modal state
  const [showQuickInputModal, setShowQuickInputModal] = useState(false);
  const [quickInputText, setQuickInputText] = useState('');
  const [quickMode, setQuickMode] = useState('answers'); // 'answers' | 'points'

  // Quiz configuration state
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [totalPoints, setTotalPoints] = useState(10);
  const [questions, setQuestions] = useState(() => Array.from({ length: 10 }, () => ({
    type: 'Trắc nghiệm',
    answer: '',
    point: 1,
    video: '',
    hint: '',
  })));

  // Settings state
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    maxAttempts: 1,
    startTime: false,
    deadline: false,
    isTest: false,
    blockReview: false,
    studentPermission: 'Chỉ xem điểm',
    showAnswers: false,
    shuffleQuestions: false,
    shuffleAnswers: false,
    timeLimitValue: '30'
  });

  // Get Google Form URL from query param `form` or env default
  const baseFormUrl = searchParams.get('form') || (process.env.REACT_APP_DEFAULT_GOOGLE_FORM_URL || '');
  const formUrl = baseFormUrl
    ? `${baseFormUrl}${baseFormUrl.includes('?') ? '&' : '?'}classId=${encodeURIComponent(classId || '')}`
    : '';

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const handleBack = () => {
    if (classId) navigate(`/teacher/class/${classId}/assignments`);
    else navigate('/teacher/assignments');
  };

  // If no file yet: open OS file picker to choose, then user clicks again to upload
  const handleUploadButton = () => {
    if (uploading) return;
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadMessage('Hãy chọn tệp trước khi tải lên.');
      try { handlePickLocalPreview(); } catch {}
      return;
    }
    uploadAll();
  };

  // Initialize questions when component mounts or numberOfQuestions changes
  useEffect(() => {
    setQuestions(prev => {
      const n = Number(numberOfQuestions) || 0;
      if (prev.length === 0 && n > 0) {
        // Initialize with default questions if empty
        return Array.from({ length: n }, () => ({
          type: 'Trắc nghiệm',
          answer: '',
          point: 1,
          video: '',
          hint: ''
        }));
      }
      if (prev.length < n) {
        // Add new questions if needed
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, () => ({
            type: 'Trắc nghiệm',
            answer: '',
            point: 1,
            video: '',
            hint: ''
          }))
        ];
      }
      if (prev.length > n) {
        // Remove extra questions if needed
        return prev.slice(0, n);
      }
      return prev;
    });
  }, [numberOfQuestions]);

  // Form validation effect
  useEffect(() => {
    let isValid = false;
    
    if (activeTab === 0) {
      // Only require files for the first tab
      isValid = selectedFiles.length > 0;
    } else if (activeTab === 1) {
      // Validate second tab (questions)
      // Check if we have at least one question with a non-empty answer and point > 0
      isValid = questions.length > 0 && 
                questions.some(q => q.answer && q.answer.trim() !== '' && q.point > 0);
      
      // Enable the button if we're just switching to this tab without any questions yet
      if (questions.length === 0) {
        isValid = true;
      }
    } else if (activeTab === 2) {
      // Validate third tab (settings)
      // Only require timeLimit and maxAttempts to be greater than 0
      isValid = settings.timeLimit > 0 && 
                settings.maxAttempts > 0;
    }
    
    setIsFormValid(isValid);
  }, [activeTab, title, description, selectedFiles, questions, settings]);

  const handleContinue = () => {
    console.log('[UploadAssignment] handleContinue click', { activeTab, isFormValid, uploading });
    if (activeTab < 2) {
      // If not on the last tab, go to next tab
      if (!isFormValid) return; // Don't proceed if required fields are not filled
      setActiveTab(activeTab + 1);
    } else {
      // If on the last tab, submit the form
      console.log('[UploadAssignment] triggering uploadAll from last tab');
      uploadAll();
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleApplyQuickInput = () => {
    if (quickMode === 'answers') {
      const raw = (quickInputText || '').trim();
      let answers = [];
      if (raw.includes('\n')) {
        answers = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      } else {
        // Treat as a continuous string: remove spaces and split to characters
        const compact = raw.replace(/\s+/g, '');
        answers = compact.split('');
      }
      if (!answers.length) {
        setShowQuickInputModal(false);
        return;
      }
      setQuestions(prev => prev.map((q, idx) => ({ ...q, answer: answers[idx] ?? q.answer })));
      setShowQuickInputModal(false);
      setQuickInputText('');
      return;
    }

    // points mode: tokens separated by ';', support multiplier like 2.5*10
    const tokens = quickInputText.split(';').map(s => s.trim()).filter(Boolean);
    if (!tokens.length) {
      setShowQuickInputModal(false);
      return;
    }
    const pointsArray = [];
    for (const t of tokens) {
      const m = t.match(/^(-?\d+(?:\.\d+)?)(?:\*(\d+))?$/);
      if (m) {
        const val = parseFloat(m[1]);
        const count = m[2] ? parseInt(m[2], 10) : 1;
        for (let i = 0; i < count; i++) pointsArray.push(val);
      }
    }
    if (!pointsArray.length) {
      setShowQuickInputModal(false);
      return;
    }
    setQuestions(prev => prev.map((q, idx) => ({ ...q, point: pointsArray[idx] ?? q.point })));
    setShowQuickInputModal(false);
    setQuickInputText('');
  };


  const onFilesChosen = (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    setSelectedFiles(prev => [...prev, ...arr]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFilesChosen(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const removeFileAt = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Pick a local file for preview only (not uploaded anywhere)
  const handlePickLocalPreview = () => {
    localFileInputRef.current?.click();
  };
  const handleLocalPreviewChosen = (e) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      // Revoke previous URL if any
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      const url = URL.createObjectURL(f);
      setLocalPreviewUrl(url);
      setLocalPreviewName(f.name || 'Tệp cục bộ');
      // Also push this file into selectedFiles for actual upload later
      setSelectedFiles(prev => {
        if (!prev || prev.length === 0) return [f];
        // avoid duplicate same object reference appended repeatedly
        if (prev[prev.length - 1] === f) return prev;
        return [...prev, f];
      });
    } catch {}
  };

  const fetchDocuments = async () => {
    if (!classId) return;
    setLoadingDocs(true);
    try {
      const data = await api.documents.listByClass(classId);
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const mapped = arr.map(d => ({
        ...d,
        fileUrl: d?.file_path && typeof d.file_path === 'string'
          ? (d.file_path.startsWith('http') ? d.file_path : `${d.file_path}`)
          : '#'
      }));
      setDocuments(mapped);
    } catch (err) {
      setDocuments([]);
      setUploadMessage(`Không tải được danh sách tài liệu (${err?.message || 'error'})`);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Create object URL for first selected file to preview
  useEffect(() => {
    if (selectedFiles && selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
  }, [selectedFiles]);

  const uploadAll = async () => {
    console.log('[UploadAssignment] uploadAll start', { selectedCount: selectedFiles.length, classId, hasToken: !!token });
    // Validate required fields
    if (!selectedFiles.length) {
      setUploadMessage('Vui lòng chọn ít nhất 1 file. Hệ thống sẽ mở hộp thoại chọn tệp.');
      try { handlePickLocalPreview(); } catch {}
      return;
    }

    if (!classId) {
      setUploadMessage('Không tìm thấy thông tin lớp học.');
      return;
    }

    if (!token) {
      setUploadMessage('Thiếu token. Hãy đăng nhập lại.');
      return;
    }

    // Lấy tiêu đề/mô tả từ tab Cài đặt (ưu tiên), fallback sang state cũ
    const assignmentTitle = (settings.title || title || '').trim() || 'Bài tập không tiêu đề';
    const assignmentDescription = (settings.description || description || '').trim();

    // Ensure we have at least one question if none provided
    const assignmentQuestions = questions.length > 0
      ? questions
      : [{
          question_text: 'Câu hỏi 1',
          question_type: 'essay',
          points: 10,
          options: [],
          correct_answer: ''
        }];

    setUploading(true);
    setUploadMessage('Đang tải lên...');

    try {
      // Upload từng file qua API helper documents
      const uploadPromises = selectedFiles.map(async (file) => {
        try {
          const res = await api.documents.upload({
            classId,
            file,
            // Gửi cờ để backend đánh dấu đây là file đính kèm bài tập
            title: assignmentTitle,
            isAttachment: true,
            description: assignmentDescription,
          });
          console.log('[UploadAssignment] document uploaded:', res);
          return res;
        } catch (e) {
          console.error('[UploadAssignment] document upload failed:', e?.message || e);
          throw e;
        }
      });

      const results = await Promise.all(uploadPromises);
      console.log('[UploadAssignment] all documents uploaded, count=', results?.length);

      // Lấy URL tài liệu đầu tiên và chuẩn hóa thành tuyệt đối để học sinh luôn xem được
      const firstDoc = Array.isArray(results) && results.length ? results[0] : null;
      const rawUrl = firstDoc?.file_path || firstDoc?.fileUrl || firstDoc?.url || '';
      const toAbsolute = (u) => {
        if (!u) return '';
        try {
          // Nếu đã là http(s) thì giữ nguyên
          if (/^https?:\/\//i.test(u)) return u;
          // Nếu là đường dẫn tương đối thì thêm origin hiện tại
          const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
          if (!origin) return u;
          const path = u.startsWith('/') ? u : `/${u}`;
          return `${origin}${path}`;
        } catch (_) { return u; }
      };
      const uploadedDocUrl = toAbsolute(rawUrl);

      // Nếu có câu hỏi => tạo quiz (best-effort)
      if (questions.length > 0) {
        try {
          const payload = {
            title: assignmentTitle,
            // Gộp mô tả + đường dẫn tài liệu để HS thấy ở panel trái
            description: uploadedDocUrl
              ? `${assignmentDescription ? assignmentDescription + '\n\n' : ''}Tài liệu: ${uploadedDocUrl}`
              : assignmentDescription,
            class_id: Number(classId),
            time_limit: Number(settings.timeLimit || 30),
            start_time: settings.startTime ? settings.startTime : null,
            deadline: settings.deadline ? settings.deadline : null,
            max_attempts: Number(settings.maxAttempts || 1),
            show_answers: !!settings.showAnswers,
            shuffle_questions: !!settings.shuffleQuestions,
            shuffle_answers: !!settings.shuffleAnswers,
            is_test: !!settings.isTest,
            block_review: !!settings.blockReview,
            student_permission: settings.studentPermission || 'Chỉ xem điểm',
            score_setting: 'Lấy điểm lần làm bài đầu tiên',
            questions: questions.map((q, index) => {
              const text = `Câu ${index + 1}`;
              if (q.type === 'Trắc nghiệm') {
                const correct = (q.answer || '').trim() || 'Đáp án đúng';
                const optionTexts = [
                  correct,
                  'Đáp án sai 1',
                  'Đáp án sai 2',
                  'Đáp án sai 3'
                ];
                return {
                  text,
                  options: optionTexts.map((t, i) => ({ text: t, order: i, isCorrect: i === 0 })),
                };
              }
              return {
                text,
                options: [
                  { text: 'Ý 1', order: 0, isCorrect: true },
                  { text: 'Ý 2', order: 1, isCorrect: false },
                  { text: 'Ý 3', order: 2, isCorrect: false },
                  { text: 'Ý 4', order: 3, isCorrect: false },
                ],
              };
            })
          };

          const quizRes = await api.quiz.create(payload);
          console.log('[UploadAssignment] quiz create response:', quizRes);
          // Không throw nếu backend trả lỗi dạng JSON; chỉ cảnh báo để không chặn flow upload tài liệu
          if (quizRes && (quizRes.error || quizRes.message) && !quizRes.id) {
            console.warn('[UploadAssignment] Quiz create may have failed:', quizRes.error || quizRes.message);
          }
        } catch (quizErr) {
          console.warn('[UploadAssignment] Quiz create error (non-blocking):', quizErr?.message || quizErr);
        }
      }

      setUploadMessage('Tải lên bài tập thành công!');

      // Điều hướng về danh sách bài tập của lớp
      try {
        navigate(classId ? `/teacher/class/${classId}/assignments` : '/teacher/assignments');
        return; // Ngừng các bước reset vì sẽ rời trang
      } catch (_) {}

      // (Fallback nếu không điều hướng được) Reset form sau khi thành công
      setTitle('');
      setDescription('');
      setSelectedFiles([]);
      setQuestions([]);
      setSettings({
        title: '',
        description: '',
        timeLimit: 30,
        maxAttempts: 1,
        startTime: false,
        deadline: false,
        isTest: false,
        blockReview: false,
        studentPermission: 'Chỉ xem điểm',
        showAnswers: false,
        shuffleQuestions: false,
        shuffleAnswers: false,
        timeLimitValue: '30'
      });
      setActiveTab(0);

      // Refresh documents list (chỉ khi không điều hướng được)
      fetchDocuments();

    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage(`Lỗi: ${error.message || 'Không thể tải lên bài tập'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-assignment-layout">
      <Header />
      <div className="upload-assignment-content">
        <div className="upload-assignment-page">
          {/* Header */}
          <div className="upload-assignment-header">
            <div className="upload-assignment-header-top"></div>
            <div className="upload-assignment-header-content">
              <div className="upload-assignment-breadcrumb">
                <Link to={classId ? `/teacher/class/${classId}/assignments` : "/teacher/assignments"} className="upload-assignment-breadcrumb-link">Bài tập</Link>
                <span className="upload-assignment-breadcrumb-separator">▸</span>
                <span>Tạo bài tập</span>
                <span className="upload-assignment-breadcrumb-separator">▸</span>
                <span className="upload-assignment-breadcrumb-current">Tải lên</span>
              </div>
              <div className="upload-actions" style={{ marginLeft: 'auto' }}>
                <button
                  className="upload-primary"
                  type="button"
                  onClick={handleContinue}
                  disabled={activeTab < 2 ? !isFormValid : false}
                >
                  {activeTab < 2 ? 'Tiếp tục' : 'Hoàn tất'}
                </button>
              </div>
            </div>
          </div>

          {/* Main two-column content */}
          <div className="upload-assignment-main-content">
            {/* Left: Google Form only */}
            <section className="upload-assignment-document-preview-section">
              {/* Hidden input for real uploads (multiple) */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                onChange={(e) => onFilesChosen(e.target.files)}
              />

              {!formUrl && (
                <div className="upload-assignment-document-preview-header">
                  <h3>{title?.trim() || 'Biểu mẫu Google Form'}</h3>
                </div>
              )}

              {/* File controls: choose or drag & drop */}
              <div className="upload-file-toolbar" style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0' }}>
                <button type="button" onClick={handlePickFiles} style={{ padding: '6px 10px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 6 }}>Chọn tệp</button>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  style={{ flex: 1, padding: 8, border: '1px dashed #90a4ae', borderRadius: 6, color: '#607d8b', background: '#fafafa' }}
                  title="Kéo và thả tệp vào đây"
                >
                  {selectedFiles.length > 0 ? `${selectedFiles.length} tệp đã chọn` : 'Kéo thả tệp vào đây hoặc bấm Chọn tệp'}
                </div>
              </div>

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="selected-files-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {selectedFiles.map((f, idx) => (
                    <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: 14, background: '#fff' }}>
                      <span style={{ fontSize: 12 }}>{f?.name || `Tệp ${idx + 1}`}</span>
                      <button type="button" onClick={() => removeFileAt(idx)} style={{ border: 0, background: 'transparent', color: '#e53935', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="upload-assignment-document-preview-content">
                {formUrl ? (
                  <div className="google-form-container" style={{ width: '100%', height: '100%' }}>
                    <iframe
                      className="google-form-iframe"
                      src={formUrl}
                      title="Google Form"
                      style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                    />
                  </div>
                ) : (
                  <div className="google-form-placeholder google-form-placeholder--only">
                    <div className="google-form-placeholder" style={{ width: '100%' }}>
                      Vui lòng thêm tham số form trên URL để nhúng Google Form (vd: ?form=https://docs.google.com/forms/.../viewform)
                    </div>
                    <div className="google-form-inline-adder" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input
                        type="text"
                        placeholder="Dán URL Google Form (viewform) tại đây"
                        value={formInput}
                        onChange={(e) => setFormInput(e.target.value)}
                        style={{ flex: 1, padding: '8px 10px', border: '1px solid #cfd8dc', borderRadius: 6 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!formInput) return;
                          const url = new URL(window.location.href);
                          url.searchParams.set('form', formInput);
                          window.location.href = url.toString();
                        }}
                        style={{ padding: '8px 12px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 6 }}
                      >
                        Nhúng Form
                      </button>
                      <button
                        type="button"
                        className="btn-local-preview"
                        onClick={handlePickLocalPreview}
                        style={{ padding: '8px 12px', border: '1px dashed #607d8b', color: '#455a64', borderRadius: 6, background: '#fafafa' }}
                      >
                        Xem trước file cục bộ
                      </button>
                    </div>
                    {/* Hidden input for local preview (also available in placeholder) */}
                    <input type="file" ref={localFileInputRef} style={{ display: 'none' }} onChange={handleLocalPreviewChosen} />

                    {/* Local preview panel in placeholder state */}
                    {localPreviewUrl && (
                      <div className="local-preview-panel" style={{ marginTop: 8, border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f7f7f7', borderBottom: '1px solid #eee' }}>
                          <div style={{ fontWeight: 600 }}>{localPreviewName}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#607d8b' }}>
                            <span style={{ fontSize: 12 }}>Chỉ xem trước, không gửi vào Google Form</span>
                            <button type="button" onClick={() => { try { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); } catch {}; setLocalPreviewUrl(''); setLocalPreviewName(''); }} style={{ padding: '4px 8px', border: '1px solid #ccc', background: '#fff', borderRadius: 6 }}>Đóng</button>
                          </div>
                        </div>
                        <div style={{ height: 360 }}>
                          <iframe title="Local Preview" src={localPreviewUrl} style={{ width: '100%', height: '100%', border: '0', background: '#fff' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Right: Tabs and question grid/settings */}
            <section className="upload-assignment-input-panel-section">
              <QuickInputPanel
                numberOfQuestions={numberOfQuestions}
                setNumberOfQuestions={setNumberOfQuestions}
                totalPoints={totalPoints}
                setTotalPoints={setTotalPoints}
                questions={questions}
                setQuestions={setQuestions}
                onOpenQuickInput={() => setShowQuickInputModal(true)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                settings={settings}
                handleSettingChange={handleSettingChange}
              />
            </section>
          </div>
        </div>
      </div>

      {/* Quick Input Modal (reuse existing CSS classes) */}
      {showQuickInputModal && (
        <div className="upload-assignment-note-modal-overlay" onClick={() => setShowQuickInputModal(false)}>
          <div className="upload-assignment-upload-quick-input-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-assignment-upload-quick-input-header">
              <h3>Nhập nhanh</h3>
              <div className="upload-assignment-upload-quick-input-tabs">
                <button
                  className={`upload-assignment-upload-quick-tab-btn ${quickMode === 'answers' ? 'active' : ''}`}
                  onClick={() => setQuickMode('answers')}
                >Đáp án</button>
                <button
                  className={`upload-assignment-upload-quick-tab-btn ${quickMode === 'points' ? 'active' : ''}`}
                  onClick={() => setQuickMode('points')}
                >Điểm</button>
              </div>
            </div>
            <div className="upload-assignment-upload-quick-input-content">
              {quickMode === 'answers' ? (
                <>
                  <p className="upload-assignment-upload-quick-input-instruction">
                    Chuỗi đáp án viết liền không dấu (vd: ACDABCAD). Mỗi ký tự là 1 đáp án! Hoặc nhập mỗi dòng một đáp án.
                  </p>
                  <textarea
                    className="upload-assignment-upload-quick-input-textarea"
                    placeholder={`Ví dụ chuỗi: ACDABCAD\nhoặc mỗi dòng: ans1\nans2\nans3`}
                    value={quickInputText}
                    onChange={(e) => setQuickInputText(e.target.value)}
                  />
                  <p className="upload-assignment-upload-quick-input-counter">
                    {(() => {
                      const raw = (quickInputText || '').trim();
                      if (!raw) return 'Bạn sẽ tạo ra 0 đáp án';
                      if (raw.includes('\n')) {
                        const cnt = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean).length;
                        return `Bạn sẽ tạo ra ${cnt} đáp án`;
                      }
                      const cnt = raw.replace(/\s+/g, '').length;
                      return `Bạn sẽ tạo ra ${cnt} đáp án`;
                    })()}
                  </p>
                </>
              ) : (
                <>
                  <p className="upload-assignment-upload-quick-input-instruction">
                    Điểm từng câu ngăn cách bởi dấu ;<br/>
                    Bạn có thể dùng dấu * để nhập cho nhiều câu<br/>
                    VD: 4;6;2.5*10; (4 điểm; 6 điểm; 10 câu 2,5 điểm)
                  </p>
                  <textarea
                    className="upload-assignment-upload-quick-input-textarea"
                    placeholder={`Ví dụ\n4;6;2.5*10`}
                    value={quickInputText}
                    onChange={(e) => setQuickInputText(e.target.value)}
                  />
                </>
              )}
            </div>
            <div className="upload-assignment-upload-quick-input-footer">
              <button className="upload-assignment-upload-quick-input-cancel" onClick={() => setShowQuickInputModal(false)}>Hủy</button>
              <button className="upload-assignment-upload-quick-input-confirm" onClick={handleApplyQuickInput}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickInputPanel({ numberOfQuestions, setNumberOfQuestions, totalPoints, setTotalPoints, questions, setQuestions, onOpenQuickInput, activeTab, setActiveTab, settings, handleSettingChange }) {
  const cards = useMemo(() => Array.from({ length: Math.max(0, Number(numberOfQuestions) || 0) }, (_, i) => i + 1), [numberOfQuestions]);

  return (
    <div className="quick-panel-root">
      {/* Top white tabs bar */}
      <div className="quick-tabs-bar">
        <div className="quick-tabs">
          <button className={`quick-tab ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>1. Đáp án</button>
          <button className={`quick-tab ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>2. Mở rộng</button>
          <button className={`quick-tab ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>3. Thông tin bài tập</button>
        </div>
      </div>

      {/* Blue controls bar */}
      {activeTab === 0 && (
        <div className="quick-toolbar">
          <div className="quick-toolbar-left">
            <label className="quick-field">
              <span>Số câu</span>
              <input type="number" min={0} value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)} />
            </label>
            <label className="quick-field">
              <span>Tổng điểm</span>
              <input type="number" min={0} value={totalPoints}
                onChange={(e) => setTotalPoints(e.target.value)} />
            </label>
          </div>
          <div className="quick-toolbar-right">
            <button className="quick-btn" onClick={onOpenQuickInput}>Nhập nhanh</button>
            <button className="quick-btn">Lưu ý</button>
          </div>
        </div>
      )}

      <div className="quick-panel-content">
        {activeTab === 0 && (
          <div className="quick-grid">
            {cards.map((idx) => (
              <div className={`quick-card ${idx === 1 ? 'highlight' : ''}`} key={idx}>
                <div className="quick-card-title">Câu {idx}</div>
                <label className="quick-card-field">
                  <span>Loại</span>
                  <select value={questions[idx - 1]?.type || 'Trắc nghiệm'}
                          onChange={(e) => setQuestions(prev => prev.map((q, i) => i === (idx - 1) ? { ...q, type: e.target.value } : q))}>
                    <option>Điền khuyết</option>
                    <option>Tự luận</option>
                    <option>Trắc nghiệm</option>
                  </select>
                </label>
                <label className="quick-card-field">
                  <span>Đáp án</span>
                  <input type="text" placeholder="Nhập đáp án" value={questions[idx - 1]?.answer || ''}
                         onChange={(e) => setQuestions(prev => prev.map((q, i) => i === (idx - 1) ? { ...q, answer: e.target.value } : q))} />
                </label>
                <label className="quick-card-field">
                  <span>Điểm</span>
                  <input type="number" min={0} value={questions[idx - 1]?.point ?? 1}
                         onChange={(e) => setQuestions(prev => prev.map((q, i) => i === (idx - 1) ? { ...q, point: Number(e.target.value) || 0 } : q))} />
                </label>
              </div>
            ))}
          </div>
        )}
        {activeTab === 1 && (
          <div className="quick-advanced">
            <p>Phần Mở rộng (đang cập nhật). Bạn có thể tiếp tục để tới bước kế tiếp.</p>
          </div>
        )}
        {activeTab === 2 && (
          <div className="create-assignment-page__right" style={{ width: '100%' }}>
            <div className="create-assignment-page-settings-section" style={{ width: '100%' }}>
              <h2>Cài đặt bài tập</h2>
              <form className="create-assignment-page-settings-form">
                {/* Tên bài tập */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Tên bài tập <span className="create-assignment-page-required">(*)</span>
                  </label>
                  <input
                    className="create-assignment-page-setting-input"
                    type="text"
                    placeholder="Nhập tên bài tập..."
                    value={settings.title}
                    onChange={(e) => handleSettingChange('title', e.target.value)}
                  />
                </div>

                {/* Mô tả bài tập */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Mô tả</label>
                  <textarea
                    className="create-assignment-page-setting-input"
                    placeholder="Nhập mô tả bài tập..."
                    value={settings.description}
                    onChange={(e) => handleSettingChange('description', e.target.value)}
                    rows="3"
                  />
                </div>

                {/* Thời lượng làm bài */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Thời gian làm bài (phút)</label>
                  <div className="create-assignment-page-time-settings">
                    <input
                      className="create-assignment-page-setting-input"
                      type="number"
                      placeholder="Nhập thời gian..."
                      value={settings.timeLimit}
                      onChange={(e) => handleSettingChange('timeLimit', e.target.value)}
                    />
                    <div className="create-assignment-page-time-buttons">
                      <button type="button" className={`create-assignment-page-time-btn ${settings.timeLimit == 30 ? 'active' : ''}`} onClick={() => handleSettingChange('timeLimit', 30)}>30 phút</button>
                      <button type="button" className={`create-assignment-page-time-btn ${settings.timeLimit == 60 ? 'active' : ''}`} onClick={() => handleSettingChange('timeLimit', 60)}>60 phút</button>
                      <button type="button" className={`create-assignment-page-time-btn ${settings.timeLimit == 90 ? 'active' : ''}`} onClick={() => handleSettingChange('timeLimit', 90)}>90 phút</button>
                    </div>
                  </div>
                </div>

                {/* Thời gian bắt đầu */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Thời gian bắt đầu</label>
                  <div className="create-assignment-page-toggle-switch">
                    <input type="checkbox" id="startTime" checked={settings.startTime} onChange={(e) => handleSettingChange('startTime', e.target.checked)} />
                    <label className="create-assignment-page-toggle-label" htmlFor="startTime"></label>
                  </div>
                  {settings.startTime && (
                    <input type="datetime-local" className="create-assignment-page-setting-input" />
                  )}
                </div>

                {/* Hạn chót nộp bài */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Hạn chót nộp bài</label>
                  <div className="create-assignment-page-toggle-switch">
                    <input type="checkbox" id="deadline" checked={settings.deadline} onChange={(e) => handleSettingChange('deadline', e.target.checked)} />
                    <label className="create-assignment-page-toggle-label" htmlFor="deadline"></label>
                  </div>
                  <p className="create-assignment-page-setting-description">Học sinh không thể nộp bài sau thời gian này</p>
                  {settings.deadline && (
                    <input type="datetime-local" className="create-assignment-page-setting-input" />
                  )}
                </div>

                {/* Gán nhãn bài tập là kiểm tra */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Gán nhãn bài tập là kiểm tra</label>
                  <div className="create-assignment-page-toggle-switch">
                    <input type="checkbox" id="isTest" checked={settings.isTest} onChange={(e) => handleSettingChange('isTest', e.target.checked)} />
                    <label className="create-assignment-page-toggle-label" htmlFor="isTest"></label>
                  </div>
                </div>

                {/* Chặn học sinh xem lại đề */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Chặn học sinh xem lại đề sau khi làm bài xong</label>
                  <div className="create-assignment-page-toggle-switch">
                    <input type="checkbox" id="blockReview" checked={settings.blockReview} onChange={(e) => handleSettingChange('blockReview', e.target.checked)} />
                    <label className="create-assignment-page-toggle-label" htmlFor="blockReview"></label>
                  </div>
                </div>

                {/* Quyền của học sinh */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Quyền của học sinh</label>
                  <select className="create-assignment-page-setting-select" value={settings.studentPermission} onChange={(e) => handleSettingChange('studentPermission', e.target.value)}>
                    <option value="Chỉ xem điểm">Chỉ xem điểm</option>
                    <option value="Xem điểm và đáp án">Xem điểm và đáp án</option>
                    <option value="Xem tất cả">Xem tất cả</option>
                  </select>
                </div>

                {/* Số lần làm bài */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Số lần làm bài</label>
                  <input className="create-assignment-page-setting-input" type="number" value={settings.maxAttempts} onChange={(e) => handleSettingChange('maxAttempts', e.target.value)} min="1" />
                </div>

                {/* Thiết lập bảng điểm */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Thiết lập bảng điểm</label>
                  <select className="create-assignment-page-setting-select" value={settings.scoreSetting} onChange={(e) => handleSettingChange('scoreSetting', e.target.value)}>
                    <option value="Lấy điểm lần làm bài đầu tiên">Lấy điểm lần làm bài đầu tiên</option>
                    <option value="Lấy điểm cao nhất">Lấy điểm cao nhất</option>
                    <option value="Lấy điểm lần làm bài cuối cùng">Lấy điểm lần làm bài cuối cùng</option>
                  </select>
                </div>

                {/* Đảo thứ tự câu trong đề */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Đảo thứ tự câu trong đề</label>
                  <div className="create-assignment-page-toggle-switch">
                    <input type="checkbox" id="shuffleQuestions" checked={settings.shuffleQuestions} onChange={(e) => handleSettingChange('shuffleQuestions', e.target.checked)} />
                    <label className="create-assignment-page-toggle-label" htmlFor="shuffleQuestions"></label>
                  </div>
                </div>

                {/* Đảo thứ tự đáp án trong câu */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Đảo thứ tự đáp án trong câu</label>
                  <div className="create-assignment-page-toggle-switch">
                    <input type="checkbox" id="shuffleAnswers" checked={settings.shuffleAnswers} onChange={(e) => handleSettingChange('shuffleAnswers', e.target.checked)} />
                    <label className="create-assignment-page-toggle-label" htmlFor="shuffleAnswers"></label>
                  </div>
                </div>

                {/* Mật khẩu bài tập */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">Mật khẩu bài tập</label>
                  <div className="create-assignment-page-toggle-switch">
                    <input type="checkbox" id="password" checked={settings.password} onChange={(e) => handleSettingChange('password', e.target.checked)} />
                    <label className="create-assignment-page-toggle-label" htmlFor="password"></label>
                  </div>
                  {settings.password && (
                    <input type="text" className="create-assignment-page-setting-input" placeholder="Nhập mật khẩu bài tập" />
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions removed as requested; top-right button remains */}
    </div>
  );
}

export default UploadAssignmentPage;