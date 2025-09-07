-- Assignment Documents table for uploaded assignment files
-- Run this on your LMS database (same schema as other quiz tables)

CREATE TABLE IF NOT EXISTS `assignment_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `class_id` INT NULL,
  `teacher_id` INT NOT NULL,
  `title` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(512) NOT NULL,
  `mime_type` VARCHAR(128) NOT NULL,
  `size` BIGINT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: add foreign keys if `classes` and `users` tables exist and names match
-- ALTER TABLE `assignment_documents`
--   ADD CONSTRAINT `fk_assignment_docs_class`
--   FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
--   ADD CONSTRAINT `fk_assignment_docs_teacher`
--   FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Verify
-- SELECT COUNT(*) FROM assignment_documents;
