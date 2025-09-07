-- System notices for marquee/announcements managed by Admin
-- Safe to run multiple times with IF NOT EXISTS guards

CREATE TABLE IF NOT EXISTS system_notices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link_text VARCHAR(200),
  link_href VARCHAR(500),
  tone ENUM('info','warning','danger','success') DEFAULT 'info',
  audience ENUM('all','teacher','student') DEFAULT 'all',
  status ENUM('draft','published') DEFAULT 'draft',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_audience (audience),
  INDEX idx_time (starts_at, ends_at),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
