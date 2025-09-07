-- Tạo bảng attendance để lưu trữ điểm danh học sinh
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'absent',
    check_in_time DATETIME,
    check_out_time DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint để tránh duplicate
    UNIQUE KEY unique_attendance (schedule_id, student_id)
);

-- Index để tối ưu query
CREATE INDEX idx_attendance_schedule ON attendance(schedule_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_date ON attendance(check_in_time);

-- Thêm comment
ALTER TABLE attendance COMMENT = 'Bảng lưu trữ điểm danh học sinh cho từng buổi học'; 