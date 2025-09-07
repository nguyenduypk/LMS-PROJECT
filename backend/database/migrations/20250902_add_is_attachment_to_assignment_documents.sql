-- Add is_attachment flag to assignment_documents to distinguish assignment attachments from regular materials
ALTER TABLE assignment_documents
  ADD COLUMN IF NOT EXISTS is_attachment TINYINT(1) NOT NULL DEFAULT 0 AFTER size;
