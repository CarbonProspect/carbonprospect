-- add_project_type_column.sql
-- Add project_type column to projects table to differentiate between assessment projects and listings

ALTER TABLE projects 
ADD COLUMN project_type VARCHAR(20) DEFAULT 'listing';

-- Add index for faster filtering by project_type
CREATE INDEX idx_projects_project_type ON projects(project_type);

-- Add assessment_data column for storing assessment project data
ALTER TABLE projects
ADD COLUMN assessment_data JSONB DEFAULT NULL;

-- Comment on columns to provide documentation
COMMENT ON COLUMN projects.project_type IS 'Type of project: "assessment" for assessment-generated projects or "listing" for regular project listings';
COMMENT ON COLUMN projects.assessment_data IS 'JSON data storing assessment-specific parameters and results for assessment projects';

-- Update existing records if needed
-- UPDATE projects SET project_type = 'assessment' WHERE /* add condition to identify assessment projects */;