-- Bảng quiz_assignments (bài tập trắc nghiệm)
CREATE TABLE IF NOT EXISTS quiz_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    class_id INT NOT NULL,
    created_by INT NOT NULL,
    
    -- Cài đặt thời gian
    time_limit INT DEFAULT 30, -- phút
    start_time DATETIME NULL,
    deadline DATETIME NULL,
    
    -- Cài đặt bài tập
    max_attempts INT DEFAULT 1,
    show_answers BOOLEAN DEFAULT FALSE,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_answers BOOLEAN DEFAULT FALSE,
    is_test BOOLEAN DEFAULT FALSE,
    block_review BOOLEAN DEFAULT FALSE,
    
    -- Quyền học sinh
    student_permission ENUM('Chỉ xem điểm', 'Xem điểm và đáp án', 'Xem tất cả') DEFAULT 'Chỉ xem điểm',
    score_setting ENUM('Lấy điểm lần làm bài đầu tiên', 'Lấy điểm cao nhất', 'Lấy điểm trung bình') DEFAULT 'Lấy điểm lần làm bài đầu tiên',
    
    -- Trạng thái
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_class_id (class_id),
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline)
);

-- Bảng quiz_questions (câu hỏi trắc nghiệm)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_assignment_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT NOT NULL,
    points DECIMAL(5,2) DEFAULT 1.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (quiz_assignment_id) REFERENCES quiz_assignments(id) ON DELETE CASCADE,
    
    INDEX idx_quiz_assignment_id (quiz_assignment_id),
    INDEX idx_question_order (question_order)
);

-- Bảng quiz_options (lựa chọn cho câu hỏi)
CREATE TABLE IF NOT EXISTS quiz_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    option_order INT NOT NULL, -- A=0, B=1, C=2, D=3
    is_correct BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    
    INDEX idx_question_id (question_id),
    INDEX idx_option_order (option_order),
    INDEX idx_is_correct (is_correct)
);

-- Bảng quiz_attempts (lần làm bài của học sinh)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    
    -- Thời gian
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    time_spent INT NULL, -- giây
    
    -- Điểm số
    total_score DECIMAL(5,2) DEFAULT 0,
    max_possible_score DECIMAL(5,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Trạng thái
    status ENUM('in_progress', 'submitted', 'auto_submitted') DEFAULT 'in_progress',
    
    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (quiz_assignment_id) REFERENCES quiz_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_quiz_assignment_id (quiz_assignment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    
    UNIQUE KEY unique_attempt (quiz_assignment_id, student_id, attempt_number)
);

-- Bảng quiz_answers (câu trả lời của học sinh)
CREATE TABLE IF NOT EXISTS quiz_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    points_earned DECIMAL(5,2) DEFAULT 0,
    
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES quiz_options(id) ON DELETE SET NULL,
    
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_question_id (question_id),
    INDEX idx_is_correct (is_correct),
    
    UNIQUE KEY unique_answer (attempt_id, question_id)
);

-- Bảng quiz_statistics (thống kê bài tập)
CREATE TABLE IF NOT EXISTS quiz_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_assignment_id INT NOT NULL,
    
    -- Thống kê chung
    total_students INT DEFAULT 0,
    completed_students INT DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    highest_score DECIMAL(5,2) DEFAULT 0,
    lowest_score DECIMAL(5,2) DEFAULT 0,
    
    -- Thống kê thời gian
    average_time_spent INT DEFAULT 0, -- giây
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (quiz_assignment_id) REFERENCES quiz_assignments(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_quiz_stats (quiz_assignment_id)
);
