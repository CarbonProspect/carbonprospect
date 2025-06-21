-- Migration script for project type architecture

-- 1. Ensure the project_type column exists and has proper constraints
DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE projects ADD COLUMN project_type VARCHAR(50) DEFAULT 'listing';
  END IF;
  
  -- Set default values for existing projects
  UPDATE projects 
  SET project_type = 'listing' 
  WHERE project_type IS NULL OR project_type = '';

  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'chk_valid_project_type'
  ) THEN
    ALTER TABLE projects 
    ADD CONSTRAINT chk_valid_project_type 
    CHECK (project_type IN ('assessment', 'listing'));
  END IF;
END
$$;

-- 2. Create assessment_data table for assessment-specific details
CREATE TABLE IF NOT EXISTS assessment_data (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  financial_metrics JSONB,
  assessment_parameters JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create listing_data table for listing-specific details
CREATE TABLE IF NOT EXISTS listing_data (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  requirements JSONB,
  partnership_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_assessment_data_project_id ON assessment_data(project_id);
CREATE INDEX IF NOT EXISTS idx_listing_data_project_id ON listing_data(project_id);

-- 5. Create comment to document project_type column
COMMENT ON COLUMN projects.project_type IS 'Project type: "listing" or "assessment"';
COMMENT ON TABLE assessment_data IS 'Stores assessment-specific data for assessment projects';
COMMENT ON TABLE listing_data IS 'Stores listing-specific data for listing projects';

-- 6. Set existing projects to their correct type (if applicable)
-- This is a placeholder for more specific logic if needed
-- For example, you could identify assessment projects by searching for specific patterns in the name/description
-- UPDATE projects SET project_type = 'assessment' WHERE name LIKE '%Assessment%';

-- 7. Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Project type migration completed at %', NOW();
END
$$;