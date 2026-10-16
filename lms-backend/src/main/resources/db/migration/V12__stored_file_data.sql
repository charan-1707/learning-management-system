-- V12__stored_file_data.sql — persist upload bytes in the database.
-- Local disk is ephemeral on PaaS hosts (wiped on restart), orphaning every
-- stored_files row. LONGBLOB keeps files wherever the database lives.
-- 10 MB app cap fits comfortably inside default max_allowed_packet (64 MB).
-- Plain NULL column: MySQL and H2 both accept it; old disk-only rows keep
-- working through the path fallback in the download endpoint.
ALTER TABLE stored_files ADD COLUMN data LONGBLOB NULL;
