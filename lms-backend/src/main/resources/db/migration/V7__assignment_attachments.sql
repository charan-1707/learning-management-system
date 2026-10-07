-- V7__assignment_attachments.sql — faculty-uploaded attachments on assignments.
-- JSON list of {name,size,mime,url}; nullable so existing rows stay valid.
ALTER TABLE assignments ADD COLUMN attachments_json LONGTEXT NULL;
