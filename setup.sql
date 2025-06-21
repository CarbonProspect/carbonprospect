-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS marketplace_products;

-- Create the table
CREATE TABLE marketplace_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  emissions_reduction_factor FLOAT,
  cost_savings_per_unit FLOAT,
  certifications JSONB,
  project_types JSONB,
  integration_details JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample data with more unique products
INSERT INTO marketplace_products (id, name, company_name, category, subcategory, description, emissions_reduction_factor, certifications, project_types, integration_details)
VALUES 
('1', 'GreenSteel™', 'CleanMetals Inc.', 'Green Materials', 'Steel', 'Hydrogen-based direct reduction iron process', 0.75, '["ISO 14001"]', '["construction"]', '{"construction": {"materialId": "steel_green", "factor": 0.75}}'),
('2', 'CarbonCap™ Cement', 'GreenBuild Materials', 'Construction Materials', 'Cement', 'Low-carbon cement alternative', 0.60, '["ASTM Compliant"]', '["construction"]', '{"construction": {"materialId": "cement_geopolymer", "factor": 0.60}}'),
('3', 'EcoPlastic Resin', 'BioCycle Tech', 'Construction Materials', 'Insulation', 'Bio-based plastic resin', 0.45, '["Bio-Based Carbon Certified"]', '["construction"]', '{"construction": {"materialId": "insulation_bio", "factor": 0.45}}'),
('4', 'RecycloGlass XR', 'EcoVision Materials', 'Green Materials', 'Glass', 'Ultra-high recycled content architectural glass', 0.82, '["C2C Gold Certified"]', '["construction"]', '{"construction": {"materialId": "glass_recycled", "factor": 0.82}}'),
('5', 'ThermalCrete Pro', 'InnoTherm Solutions', 'Construction Materials', 'Concrete', 'Carbon-negative concrete with enhanced thermal properties', 0.92, '["CarbonCure Verified", "LEED Platinum Compatible"]', '["construction"]', '{"construction": {"materialId": "concrete_ultralowcarbon", "factor": 0.92}}'),
('6', 'BioTimber Structural', 'NatureFrame Systems', 'Construction Materials', 'Timber', 'Reclaimed timber with enhanced structural treatments', 0.68, '["FSC 100% Certified", "Living Building Challenge Ready"]', '["construction"]', '{"construction": {"materialId": "timber_reclaimed", "factor": 0.68}}'),
('7', 'NanoAluminum Alloy', 'MetalTech Innovations', 'Green Materials', 'Aluminum', 'Advanced recycled aluminum with nanoparticle reinforcement', 0.85, '["Aluminum Stewardship Initiative"]', '["construction"]', '{"construction": {"materialId": "aluminum_recycled", "factor": 0.85}}'),
('8', 'HempCrete Plus', 'BioBuild Materials', 'Construction Materials', 'Alternative Concrete', 'Hemp-based building material with natural lime binder', 0.94, '["USDA BioPreferred", "ASTM E84 Class A"]', '["construction"]', '{"construction": {"materialId": "concrete_lowcarbon", "factor": 0.94}}'),
('9', 'CarbonLock Cladding', 'ClimateShield Tech', 'Construction Materials', 'Cladding', 'Carbon-sequestering facade panels made from captured CO2', 0.89, '["Carbon Removal Certified", "EPD Verified"]', '["construction"]', '{"construction": {"materialId": "cladding_recycled", "factor": 0.89}}'),
('10', 'CircuitSmart Sensors', 'GreenWatt Systems', 'Smart Building', 'Energy Management', 'AI-powered energy optimization system for commercial buildings', 0.35, '["Energy Star Certified", "BuildingIQ Compatible"]', '["construction", "energy"]', '{"construction": {"energyAttribute": "efficiency", "factor": 0.35}}'),
('11', 'SolarGlass Windows', 'SunTech Integration', 'Smart Building', 'Windows', 'Transparent solar collection windows with enhanced insulation', 0.42, '["NFRC Certified", "IEC 61215 Compliant"]', '["construction", "energy"]', '{"construction": {"materialId": "glass_lowemissivity", "factor": 0.42}}'),
('12', 'AeroBrick Thermal', 'InsuTech Materials', 'Green Materials', 'Brick', 'Ultra-lightweight reclaimed brick with aerogel insulation', 0.78, '["Cradle to Cradle Silver", "BREEM A+"]', '["construction"]', '{"construction": {"materialId": "brick_reclaimed", "factor": 0.78}}');
