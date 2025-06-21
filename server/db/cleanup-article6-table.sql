-- First, create a backup
CREATE TABLE article6_projects_backup AS SELECT * FROM article6_projects;

-- Drop the foreign key constraints if any exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT conname FROM pg_constraint 
              WHERE conrelid = 'article6_projects'::regclass 
              AND contype = 'f')
    LOOP
        EXECUTE 'ALTER TABLE article6_projects DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Drop any indexes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT indexname FROM pg_indexes 
              WHERE tablename = 'article6_projects')
    LOOP
        EXECUTE 'DROP INDEX ' || quote_ident(r.indexname);
    END LOOP;
END $$;

-- Drop the table
DROP TABLE article6_projects;

-- Provide a message
DO $$
BEGIN
    RAISE NOTICE 'Article 6 projects table has been dropped. A backup is available as article6_projects_backup.';
END $$;