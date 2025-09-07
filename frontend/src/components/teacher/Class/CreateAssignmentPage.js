import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header';
import './CreateAssignmentPage.css';
import { 
  MdArrowBack, 
  MdCheck, 
  MdAdd,
  MdDelete,
  MdHelpOutline
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import AuthStorage from '../../../utils/authStorage';
import '../../../utils/fix-teacher-class-code';
import '../../../utils/teacher-class-fix-complete';
import '../../../utils/test-create-assignment';

function CreateAssignmentPage({ classInfo: propClassInfo }) {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(propClassInfo || null);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    maxAttempts: 1,
    showAnswers: false,
    shuffleQuestions: false,
    shuffleAnswers: false,
    password: false,
    startTime: false,
    deadline: false,
    isTest: false,
    blockReview: false,
    studentPermission: 'Chỉ xem điểm',
    scoreSetting: 'Lấy điểm lần làm bài đầu tiên',
    timeLimitValue: '30'
  });

  const navigate = useNavigate();

  // Load classInfo từ URL params và AuthStorage
  useEffect(() => {
    console.log('🔍 CreateAssignmentPage: Loading classInfo...');
    console.log('  classId from URL:', classId);
    console.log('  propClassInfo:', propClassInfo);
    
    if (propClassInfo && Object.keys(propClassInfo).length > 0) {
      // Nếu có prop classInfo hợp lệ, sử dụng nó
      console.log('✅ Using prop classInfo');
      setClassInfo(propClassInfo);
      
      // Lưu vào AuthStorage
      AuthStorage.setClassInfo({
        id: propClassInfo.id || classId,
        name: propClassInfo.name,
        code: propClassInfo.class_code || propClassInfo.code,
        teacher: propClassInfo.teacher_name || propClassInfo.teacher,
      });
    } else if (classId) {
      // Nếu không có prop, thử lấy từ AuthStorage
      const cachedClassInfo = AuthStorage.getClassInfo();
      console.log('  cached classInfo:', cachedClassInfo);
      
      if (cachedClassInfo && cachedClassInfo.id == classId) {
        console.log('✅ Using cached classInfo from AuthStorage');
        setClassInfo({
          id: cachedClassInfo.id,
          name: cachedClassInfo.name,
          class_code: cachedClassInfo.code,
          code: cachedClassInfo.code,
          teacher_name: cachedClassInfo.teacher,
        });
      } else {
        // Tạo classInfo mặc định từ classId
        console.log('🔧 Creating default classInfo from classId');
        const defaultClassInfo = {
          id: classId,
          name: `Lớp học ${classId}`,
          class_code: `CLASS${classId}`,
          code: `CLASS${classId}`,
          teacher_name: 'Giáo viên',
        };
        
        setClassInfo(defaultClassInfo);
        
        // Lưu vào AuthStorage
        AuthStorage.setClassInfo({
          id: classId,
          name: defaultClassInfo.name,
          code: defaultClassInfo.class_code,
          teacher: defaultClassInfo.teacher_name,
        });
      }
    }
  }, [classId, propClassInfo]);

  const addQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = { ...updatedQuestions[questionIndex].options[optionIndex], text: value };
    setQuestions(updatedQuestions);
  };

  const setCorrectAnswer = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.map((option, idx) => ({
      ...option,
      isCorrect: idx === optionIndex
    }));
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    if (activeQuestionIndex >= updatedQuestions.length) {
      setActiveQuestionIndex(Math.max(0, updatedQuestions.length - 1));
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleTooltipShow = (event, tooltipText) => {
    const tooltip = event.currentTarget.querySelector('.tooltip');
    if (tooltip) {
      const rect = event.currentTarget.getBoundingClientRect();
      tooltip.style.left = rect.left + 'px';
      tooltip.style.top = (rect.top - 8) + 'px';
      tooltip.style.transform = 'translateY(-100%)';
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
      tooltip.textContent = tooltipText;
    }
  };

  const handleTooltipHide = (event) => {
    const tooltip = event.currentTarget.querySelector('.tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
  };

  const handleComplete = async () => {
    try {
      // Validate required fields
      if (!settings.title.trim()) {
        alert('Vui lòng nhập tên bài tập');
        return;
      }

      if (questions.length === 0) {
        alert('Vui lòng thêm ít nhất một câu hỏi');
        return;
      }

      // Validate all questions have content and correct answers
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.text.trim()) {
          alert(`Vui lòng nhập nội dung câu hỏi ${i + 1}`);
          return;
        }

        const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer) {
          alert(`Vui lòng chọn đáp án đúng cho câu hỏi ${i + 1}`);
          return;
        }

        const hasEmptyOption = question.options.some(opt => !opt.text.trim());
        if (hasEmptyOption) {
          alert(`Vui lòng nhập đầy đủ các lựa chọn cho câu hỏi ${i + 1}`);
          return;
        }
      }

      // Prepare data for API
      const quizData = {
        title: settings.title,
        description: settings.description,
        class_id: classInfo?.id, // Assuming classInfo is passed as prop
        time_limit: parseInt(settings.timeLimit),
        start_time: settings.startTime ? new Date(settings.startTime).toISOString() : null,
        deadline: settings.deadline ? new Date(settings.deadline).toISOString() : null,
        max_attempts: settings.maxAttempts,
        show_answers: settings.showAnswers,
        shuffle_questions: settings.shuffleQuestions,
        shuffle_answers: settings.shuffleAnswers,
        is_test: settings.isTest,
        block_review: settings.blockReview,
        student_permission: settings.studentPermission,
        score_setting: settings.scoreSetting,
        questions: questions.map(q => ({
          text: q.text,
          options: q.options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          }))
        }))
      };

      // Call API
      const response = await fetch('/api/assignments/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(quizData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Tạo bài tập thành công!');
        navigate(-1); // Go back to previous page
      } else {
        alert(result.message || 'Có lỗi xảy ra khi tạo bài tập');
      }

    } catch (error) {
      console.error('Create quiz error:', error);
      alert('Có lỗi xảy ra khi tạo bài tập');
    }
  };

  // Debug logging cho classInfo
  console.log('🔍 CreateAssignmentPage render - classInfo:', classInfo);
  console.log('🔍 CreateAssignmentPage render - classId:', classId);

  return (
    <div className="create-assignment-page">
      <Header />
      <div className="create-assignment-page__content">
        <TeacherSidebar classInfo={classInfo} />
        
        {/* Header */}
        <div className="create-assignment-page__header">
          <div className="create-assignment-page-header__left">
            <button className="create-assignment-page-header__back-btn" onClick={() => navigate(-1)}>
              <MdArrowBack size={24} />
            </button>
            <div className="create-assignment-page-header__content">
              <h1 className="create-assignment-page-header__title">Tạo bài tập mới</h1>
              <div className="create-assignment-page-header__breadcrumb">
                <span 
                  className="create-assignment-page-breadcrumb__link" 
                  onClick={() => navigate(-1)}
                >
                  Bài tập
                </span>
                <span className="create-assignment-page-breadcrumb__separator"> ▶ </span>
                <span className="create-assignment-page-breadcrumb__current">Tạo mới</span>
              </div>
            </div>
          </div>

          <div className="create-assignment-page-header__right">
            <button className="create-assignment-page-header__complete-btn" onClick={handleComplete}>
              <MdCheck size={20} />
              Hoàn tất
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="create-assignment-page__main">
          {/* Left Side - Questions */}
          <div className="create-assignment-page__left">
            <div className="create-assignment-page-question-section">
              <div className="create-assignment-page-question-section__header">
                <h2>Câu hỏi</h2>
                <button className="create-assignment-page-add-question-btn" onClick={addQuestion}>
                  <MdAdd size={20} />
                  Thêm câu hỏi
                </button>
              </div>
              
              {questions.length === 0 ? (
                <div className="create-assignment-page-empty-state">
                  <p>Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
                </div>
              ) : (
                <div className="create-assignment-page-questions-list">
                  {questions.map((question, questionIndex) => (
                    <div 
                      key={questionIndex} 
                      className={`create-assignment-page-question-item ${activeQuestionIndex === questionIndex ? 'active' : ''}`}
                      onClick={() => setActiveQuestionIndex(questionIndex)}
                    >
                      <div className="create-assignment-page-question-item__header">
                        <span className="create-assignment-page-question-number">Câu {questionIndex + 1}</span>
                        <button 
                          className="create-assignment-page-delete-question-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(questionIndex);
                          }}
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                      
                      <div className="create-assignment-page-question-content">
                        <textarea
                          className="create-assignment-page-question-input"
                          placeholder="Nhập câu hỏi..."
                          value={question.text}
                          onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="create-assignment-page-options-list">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="create-assignment-page-option-item">
                              <button
                                className={`create-assignment-page-option-selector ${option.isCorrect ? 'correct' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCorrectAnswer(questionIndex, optionIndex);
                                }}
                              >
                                {String.fromCharCode(65 + optionIndex)}
                              </button>
                              <input
                                className="create-assignment-page-option-input"
                                type="text"
                                placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`}
                                value={option.text}
                                onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Settings */}
          <div className="create-assignment-page__right">
            <div className="create-assignment-page-settings-section">
              <h2>Cài đặt bài tập</h2>
              
              <form className="create-assignment-page-settings-form">
                {/* Tên bài tập */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Tên bài tập <span className="create-assignment-page-required">(*)</span>
                    <div className="create-assignment-page-help-icon-container">
                      <span 
                        className="create-assignment-page-help-icon"
                        onMouseEnter={(e) => handleTooltipShow(e, 'Tên hiển thị của bài tập')}
                        onMouseLeave={handleTooltipHide}
                      >
                        ?
                      </span>
                    </div>
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
                  <label className="create-assignment-page-setting-label">
                    Mô tả
                    <div className="create-assignment-page-help-icon-container">
                      <span 
                        className="create-assignment-page-help-icon"
                        onMouseEnter={(e) => handleTooltipShow(e, 'Mô tả chi tiết về bài tập')}
                        onMouseLeave={handleTooltipHide}
                      >
                        ?
                      </span>
                    </div>
                  </label>
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
                  <label className="create-assignment-page-setting-label">
                    Thời gian làm bài (phút)
                    <div className="create-assignment-page-help-icon-container">
                      <span 
                        className="create-assignment-page-help-icon"
                        onMouseEnter={(e) => handleTooltipShow(e, 'Thời gian tối đa để hoàn thành bài tập')}
                        onMouseLeave={handleTooltipHide}
                      >
                        ?
                      </span>
                    </div>
                  </label>
                  <div className="create-assignment-page-time-settings">
                    <input
                      className="create-assignment-page-setting-input"
                      type="number"
                      placeholder="Nhập thời gian..."
                      value={settings.timeLimit}
                      onChange={(e) => handleSettingChange('timeLimit', e.target.value)}
                    />
                    <div className="create-assignment-page-time-buttons">
                      <button 
                        type="button"
                        className={`create-assignment-page-time-btn ${settings.timeLimit === 30 ? 'active' : ''}`}
                        onClick={() => handleSettingChange('timeLimit', 30)}
                      >
                        30 phút
                      </button>
                      <button 
                        type="button"
                        className={`create-assignment-page-time-btn ${settings.timeLimit === 60 ? 'active' : ''}`}
                        onClick={() => handleSettingChange('timeLimit', 60)}
                      >
                        60 phút
                      </button>
                      <button 
                        type="button"
                        className={`create-assignment-page-time-btn ${settings.timeLimit === 90 ? 'active' : ''}`}
                        onClick={() => handleSettingChange('timeLimit', 90)}
                      >
                        90 phút
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thời gian bắt đầu */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Thời gian bắt đầu
                  </label>
                  <div className="create-assignment-page-toggle-switch">
                    <input
                      type="checkbox"
                      id="startTime"
                      checked={settings.startTime}
                      onChange={(e) => handleSettingChange('startTime', e.target.checked)}
                    />
                    <label className="create-assignment-page-toggle-label" htmlFor="startTime"></label>
                  </div>
                  {settings.startTime && (
                    <input
                      type="datetime-local"
                      className="create-assignment-page-setting-input"
                    />
                  )}
                </div>

                {/* Hạn chót nộp bài */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Hạn chót nộp bài
                  </label>
                  <div className="create-assignment-page-toggle-switch">
                    <input
                      type="checkbox"
                      id="deadline"
                      checked={settings.deadline}
                      onChange={(e) => handleSettingChange('deadline', e.target.checked)}
                    />
                    <label className="create-assignment-page-toggle-label" htmlFor="deadline"></label>
                  </div>
                  <p className="create-assignment-page-setting-description">Học sinh không thể nộp bài sau thời gian này</p>
                  {settings.deadline && (
                    <input
                      type="datetime-local"
                      className="create-assignment-page-setting-input"
                    />
                  )}
                </div>

                {/* Gán nhãn bài tập là kiểm tra */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Gán nhãn bài tập là kiểm tra
                  </label>
                  <div className="create-assignment-page-toggle-switch">
                    <input
                      type="checkbox"
                      id="isTest"
                      checked={settings.isTest}
                      onChange={(e) => handleSettingChange('isTest', e.target.checked)}
                    />
                    <label className="create-assignment-page-toggle-label" htmlFor="isTest"></label>
                  </div>
                </div>

                {/* Chặn học sinh xem lại đề */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Chặn học sinh xem lại đề sau khi làm bài xong
                  </label>
                  <div className="create-assignment-page-toggle-switch">
                    <input
                      type="checkbox"
                      id="blockReview"
                      checked={settings.blockReview}
                      onChange={(e) => handleSettingChange('blockReview', e.target.checked)}
                    />
                    <label className="create-assignment-page-toggle-label" htmlFor="blockReview"></label>
                  </div>
                </div>

                {/* Quyền của học sinh */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Quyền của học sinh
                  </label>
                  <select
                    className="create-assignment-page-setting-select"
                    value={settings.studentPermission}
                    onChange={(e) => handleSettingChange('studentPermission', e.target.value)}
                  >
                    <option value="Chỉ xem điểm">Chỉ xem điểm</option>
                    <option value="Xem điểm và đáp án">Xem điểm và đáp án</option>
                    <option value="Xem tất cả">Xem tất cả</option>
                  </select>
                </div>

                {/* Số lần làm bài */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Số lần làm bài
                  </label>
                  <input
                    className="create-assignment-page-setting-input"
                    type="number"
                    value={settings.maxAttempts}
                    onChange={(e) => handleSettingChange('maxAttempts', e.target.value)}
                    min="1"
                  />
                </div>

                {/* Thiết lập bảng điểm */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Thiết lập bảng điểm
                  </label>
                  <select
                    className="create-assignment-page-setting-select"
                    value={settings.scoreSetting}
                    onChange={(e) => handleSettingChange('scoreSetting', e.target.value)}
                  >
                    <option value="Lấy điểm lần làm bài đầu tiên">Lấy điểm lần làm bài đầu tiên</option>
                    <option value="Lấy điểm cao nhất">Lấy điểm cao nhất</option>
                    <option value="Lấy điểm lần làm bài cuối cùng">Lấy điểm lần làm bài cuối cùng</option>
                  </select>
                </div>

                {/* Đảo thứ tự câu trong đề */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Đảo thứ tự câu trong đề
                  </label>
                  <div className="create-assignment-page-toggle-switch">
                    <input
                      type="checkbox"
                      id="shuffleQuestions"
                      checked={settings.shuffleQuestions}
                      onChange={(e) => handleSettingChange('shuffleQuestions', e.target.checked)}
                    />
                    <label className="create-assignment-page-toggle-label" htmlFor="shuffleQuestions"></label>
                  </div>
                  {!settings.shuffleQuestions && (
                    <div className="create-assignment-page-info-box">
                      <div className="create-assignment-page-info-box__icon">⚠️</div>
                      <div className="create-assignment-page-info-box__content">
                        Khi làm bài, mọi học sinh đều có đề giống nhau (Không đảo thứ tự câu)
                      </div>
                    </div>
                  )}
                </div>

                {/* Đảo thứ tự đáp án trong câu */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Đảo thứ tự đáp án trong câu
                  </label>
                  <div className="create-assignment-page-toggle-switch">
                    <input
                      type="checkbox"
                      id="shuffleAnswers"
                      checked={settings.shuffleAnswers}
                      onChange={(e) => handleSettingChange('shuffleAnswers', e.target.checked)}
                    />
                    <label className="create-assignment-page-toggle-label" htmlFor="shuffleAnswers"></label>
                  </div>
                  {!settings.shuffleAnswers && (
                    <div className="create-assignment-page-info-box">
                      <div className="create-assignment-page-info-box__icon">⚠️</div>
                      <div className="create-assignment-page-info-box__content">
                        Khi làm bài, thứ tự các đáp án A B C D sẽ giữ nguyên như đề gốc
                      </div>
                    </div>
                  )}
                </div>

                {/* Mật khẩu bài tập */}
                <div className="create-assignment-page-setting-item">
                  <label className="create-assignment-page-setting-label">
                    Mật khẩu bài tập
                    <div className="create-assignment-page-help-icon-container">
                      <span 
                        className="create-assignment-page-help-icon"
                        onMouseEnter={(e) => handleTooltipShow(e, 'Học sinh cần nhập mật khẩu để truy cập bài tập')}
                        onMouseLeave={handleTooltipHide}
                      >
                        ?
                      </span>
                    </div>
                  </label>
                  <div className="create-assignment-page-toggle-switch">
                    <input
                      type="checkbox"
                      id="password"
                      checked={settings.password}
                      onChange={(e) => handleSettingChange('password', e.target.checked)}
                    />
                    <label className="create-assignment-page-toggle-label" htmlFor="password"></label>
                  </div>
                  {settings.password && (
                    <input
                      type="text"
                      className="create-assignment-page-setting-input"
                      placeholder="Nhập mật khẩu bài tập"
                    />
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAssignmentPage; 