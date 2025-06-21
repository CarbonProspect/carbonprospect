# Connect to the carbon_marketplace database
psql -d carbon_marketplace << EOF

-- Update projects in North America with images and additional fields
UPDATE projects
SET 
  image_url = '/uploads/images/california-redwoods.jpg',
  methodology = 'VM0010',
  methodology_details = 'Improved Forest Management: Conversion from Logged to Protected Forest methodology',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": true, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Biodiversity protection", "Community development", "Job creation"]',
  sdg_goals = '[13, 15]'
WHERE id = 8;

UPDATE projects
SET 
  image_url = '/uploads/images/boreal-forest.jpg',
  methodology = 'VM0012',
  methodology_details = 'Improved Forest Management in Boreal Regions',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": true, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'validation',
  cobenefits = '["Biodiversity protection", "Soil conservation", "Water quality improvements"]',
  sdg_goals = '[13, 15]'
WHERE id = 9;

UPDATE projects
SET 
  image_url = '/uploads/images/texas-wind.jpg',
  methodology = 'ACM0002',
  methodology_details = 'Grid-connected electricity generation from renewable sources',
  standard_body = 'Gold Standard',
  eligibility = '{"verra": false, "article6": false, "corsia": true, "goldStandard": true, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Job creation", "Improved air quality", "Energy independence"]',
  sdg_goals = '[7, 8, 13]'
WHERE id = 10;

UPDATE projects
SET 
  image_url = '/uploads/images/ontario-grid.jpg',
  methodology = 'ACM0002',
  methodology_details = 'Renewable energy grid connection protocol',
  standard_body = 'Gold Standard',
  eligibility = '{"verra": false, "article6": false, "corsia": true, "goldStandard": true, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'unverified',
  cobenefits = '["Energy independence", "Job creation"]',
  sdg_goals = '[7, 13]'
WHERE id = 11;

-- Update projects in South America with images and additional fields
UPDATE projects
SET 
  image_url = '/uploads/images/amazon-rainforest.jpg',
  methodology = 'VM0007',
  methodology_details = 'REDD+ Methodology Framework (REDD+MF)',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": true, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Biodiversity protection", "Indigenous community support", "Watershed protection"]',
  sdg_goals = '[13, 15, 10]'
WHERE id = 12;

UPDATE projects
SET 
  image_url = '/uploads/images/andean-cloud-forest.jpg',
  methodology = 'VM0009',
  methodology_details = 'Avoided Ecosystem Conversion',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": true, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'validation',
  cobenefits = '["Biodiversity protection", "Water quality improvements", "Indigenous community support"]',
  sdg_goals = '[13, 15, 6]'
WHERE id = 13;

UPDATE projects
SET 
  image_url = '/uploads/images/patagonian-grassland.jpg',
  methodology = 'VM0017',
  methodology_details = 'Sustainable Agricultural Land Management',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": false, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Soil conservation", "Biodiversity protection", "Community development"]',
  sdg_goals = '[13, 15, 2]'
WHERE id = 14;

UPDATE projects
SET 
  image_url = '/uploads/images/atacama-solar.jpg',
  methodology = 'ACM0002',
  methodology_details = 'Grid-connected electricity generation from renewable sources',
  standard_body = 'CDM',
  eligibility = '{"verra": false, "article6": false, "corsia": false, "goldStandard": false, "cdm": true, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Energy independence", "Job creation", "Technology transfer"]',
  sdg_goals = '[7, 8, 13]'
WHERE id = 15;

-- Update projects in Europe with images and additional fields
UPDATE projects
SET 
  image_url = '/uploads/images/scottish-peatland.jpg',
  methodology = 'VM0036',
  methodology_details = 'Rewetting and Conservation of Peatlands',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": false, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Biodiversity protection", "Water quality improvements", "Flood mitigation"]',
  sdg_goals = '[13, 15, 6]'
WHERE id = 16;

UPDATE projects
SET 
  image_url = '/uploads/images/swiss-alps.jpg',
  methodology = 'VM0011',
  methodology_details = 'Improved Forest Management methodology',
  standard_body = 'Gold Standard',
  eligibility = '{"verra": false, "article6": false, "corsia": false, "goldStandard": true, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Biodiversity protection", "Soil conservation", "Community development"]',
  sdg_goals = '[13, 15]'
WHERE id = 17;

UPDATE projects
SET 
  image_url = '/uploads/images/baltic-wind.jpg',
  methodology = 'ACM0002',
  methodology_details = 'Grid-connected electricity generation from renewable sources',
  standard_body = 'Gold Standard',
  eligibility = '{"verra": false, "article6": true, "corsia": true, "goldStandard": true, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'validation',
  cobenefits = '["Energy independence", "Job creation", "Marine ecosystem protection"]',
  sdg_goals = '[7, 8, 13, 14]'
WHERE id = 18;

UPDATE projects
SET 
  image_url = '/uploads/images/mediterranean-olives.jpg',
  methodology = 'VM0017',
  methodology_details = 'Sustainable Agricultural Land Management',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": false, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Soil conservation", "Water conservation", "Community development"]',
  sdg_goals = '[2, 13, 15]'
WHERE id = 19;

-- Update projects in Africa with images and additional fields
UPDATE projects
SET 
  image_url = '/uploads/images/congo-basin.jpg',
  methodology = 'VM0007',
  methodology_details = 'REDD+ Methodology Framework (REDD+MF)',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": true, "corsia": true, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Biodiversity protection", "Indigenous community support", "Water source protection"]',
  sdg_goals = '[13, 15, 10]'
WHERE id = 20;

UPDATE projects
SET 
  image_url = '/uploads/images/sahel-agroforestry.jpg',
  methodology = 'VM0017',
  methodology_details = 'Sustainable Agricultural Land Management',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": false, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'validation',
  cobenefits = '["Soil conservation", "Food security", "Community development"]',
  sdg_goals = '[2, 13, 15]'
WHERE id = 21;

UPDATE projects
SET 
  image_url = '/uploads/images/kenya-geothermal.jpg',
  methodology = 'ACM0002',
  methodology_details = 'Grid-connected electricity generation from renewable sources',
  standard_body = 'CDM',
  eligibility = '{"verra": false, "article6": false, "corsia": false, "goldStandard": false, "cdm": true, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Energy independence", "Job creation", "Technology transfer"]',
  sdg_goals = '[7, 8, 13]'
WHERE id = 22;

UPDATE projects
SET 
  image_url = '/uploads/images/morocco-solar.jpg',
  methodology = 'ACM0002',
  methodology_details = 'Grid-connected electricity generation from renewable sources',
  standard_body = 'Gold Standard',
  eligibility = '{"verra": false, "article6": false, "corsia": true, "goldStandard": true, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'validation',
  cobenefits = '["Energy independence", "Job creation", "Water conservation"]',
  sdg_goals = '[7, 8, 13]'
WHERE id = 23;

-- Update projects in Asia with images and additional fields
UPDATE projects
SET 
  image_url = '/uploads/images/borneo-rainforest.jpg',
  methodology = 'VM0007',
  methodology_details = 'REDD+ Methodology Framework (REDD+MF)',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": true, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Biodiversity protection", "Indigenous community support", "Watershed protection"]',
  sdg_goals = '[13, 15, 10]'
WHERE id = 24;

UPDATE projects
SET 
  image_url = '/uploads/images/himalayan-forest.jpg',
  methodology = 'VM0006',
  methodology_details = 'Methodology for Carbon Accounting for Mosaic and Landscape-scale REDD Projects',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": false, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'validation',
  cobenefits = '["Biodiversity protection", "Watershed protection", "Community development"]',
  sdg_goals = '[13, 15, 6]'
WHERE id = 25;

UPDATE projects
SET 
  image_url = '/uploads/images/mangrove-china.jpg',
  methodology = 'VM0033',
  methodology_details = 'Methodology for Tidal Wetland and Seagrass Restoration',
  standard_body = 'Verra',
  eligibility = '{"verra": true, "article6": false, "corsia": true, "goldStandard": false, "cdm": false, "other": false}',
  project_stage = 'implementation',
  verification_status = 'verified',
  cobenefits = '["Biodiversity protection", "Coastal protection", "Fisheries enhancement"]',
  sdg_goals = '[13, 14, 15]'
WHERE id = 26;

UPDATE projects
SET 
  image_url = '/uploads/images/japan-offshore-wind.jpg',
  methodology = 'ACM0002',
  methodology_details = 'Grid-connected electricity generation from renewable sources',
  standard_body = 'Gold Standard',
  eligibility = '{"verra": false, "article6": false, "corsia": true, "goldStandard": true, "cdm": false, "other": false}',
  project_stage = 'planning',
  verification_status = 'unverified',
  cobenefits = '["Energy independence", "Job creation", "Technology innovation"]',
  sdg_goals = '[7, 8, 13]'
WHERE id = 27;

-- Verify the updated data
SELECT id, name, category, verification_status, project_stage, standard_body, image_url
FROM projects 
WHERE id >= 8 AND id <= 27
ORDER BY id;

EOF
