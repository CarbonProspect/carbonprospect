-- Products/Solutions table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  description TEXT,
  emissions_reduction_factor FLOAT,
  cost_savings_per_unit FLOAT,
  certifications TEXT[],
  project_types TEXT[],
  integration_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  location VARCHAR(200),
  reduction_target FLOAT,
  budget FLOAT,
  timeline JSONB,
  requirements JSONB,
  status VARCHAR(50) DEFAULT 'Draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved projects (for users to save projects they're interested in)
CREATE TABLE IF NOT EXISTS saved_projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price FLOAT,
  features JSONB,
  specifications JSONB,
  application_areas JSONB,
  emission_reduction JSONB,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);