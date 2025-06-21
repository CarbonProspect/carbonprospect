-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider profiles (for solution providers)
CREATE TABLE IF NOT EXISTS provider_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200),
  company_description TEXT,
  industry VARCHAR(100),
  regions TEXT[],
  headquarters_country VARCHAR(100),
  headquarters_city VARCHAR(100),
  website VARCHAR(200),
  founded_year INTEGER,
  company_size VARCHAR(50),
  certifications JSONB DEFAULT '[]',
  social_profiles JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  visibility_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Developer profiles (for project developers)
CREATE TABLE IF NOT EXISTS developer_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(200),
  organization_type VARCHAR(100),
  industry VARCHAR(100),
  regions TEXT[],
  headquarters_country VARCHAR(100),
  headquarters_city VARCHAR(100),
  project_types TEXT[],
  carbon_goals JSONB DEFAULT '{}',
  budget_range VARCHAR(100),
  project_timeline JSONB DEFAULT '{}',
  decision_makers JSONB DEFAULT '[]',
  previous_projects JSONB DEFAULT '[]',
  visibility_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultant profiles
CREATE TABLE IF NOT EXISTS consultant_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  firm VARCHAR(200),
  is_independent BOOLEAN DEFAULT TRUE,
  industry VARCHAR(100),
  regions TEXT[],
  expertise TEXT[],
  years_of_experience INTEGER,
  certifications JSONB DEFAULT '[]',
  services_offered TEXT[],
  client_types TEXT[],
  project_examples JSONB DEFAULT '[]',
  rate_range VARCHAR(100),
  availability VARCHAR(100),
  visibility_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);