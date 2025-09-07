-- Fix unique constraint for quiz_answers so each (attempt_id, question_id) is unique
-- Safe to run multiple times. Compatible with MySQL that does not support IF EXISTS/IF NOT EXISTS on index DDL.

SET @db := DATABASE();

-- Helper: drop index if exists
SET @idx_to_drop := NULL;
SELECT @idx_to_drop := index_name
FROM information_schema.statistics
WHERE table_schema = @db AND table_name = 'quiz_answers' AND index_name IN ('uq_question_only','uq_selected_option_only','question_id','selected_option_id')
LIMIT 1;

SET @sql := IF(@idx_to_drop IS NOT NULL, CONCAT('ALTER TABLE quiz_answers DROP INDEX `', @idx_to_drop, '`'), NULL);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure correct unique index (attempt_id, question_id)
SET @has_correct_unique := 0;
SELECT COUNT(*) INTO @has_correct_unique
FROM information_schema.statistics
WHERE table_schema = @db 
  AND table_name = 'quiz_answers'
  AND index_name = 'uq_attempt_question'
  AND NON_UNIQUE = 0;

SET @sql := IF(@has_correct_unique = 0,
  'ALTER TABLE quiz_answers ADD UNIQUE KEY `uq_attempt_question` (`attempt_id`, `question_id`)',
  NULL
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Optional helpers: non-unique indexes for performance
-- attempt_id
SET @has_idx_attempt := 0;
SELECT COUNT(*) INTO @has_idx_attempt
FROM information_schema.statistics
WHERE table_schema = @db AND table_name = 'quiz_answers' AND index_name = 'idx_quiz_answers_attempt';

SET @sql := IF(@has_idx_attempt = 0,
  'CREATE INDEX `idx_quiz_answers_attempt` ON quiz_answers (`attempt_id`)',
  NULL
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- question_id
SET @has_idx_question := 0;
SELECT COUNT(*) INTO @has_idx_question
FROM information_schema.statistics
WHERE table_schema = @db AND table_name = 'quiz_answers' AND index_name = 'idx_quiz_answers_question';

SET @sql := IF(@has_idx_question = 0,
  'CREATE INDEX `idx_quiz_answers_question` ON quiz_answers (`question_id`)',
  NULL
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
