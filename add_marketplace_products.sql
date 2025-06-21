-- Insert consultant category products
INSERT INTO marketplace_products (id, name, company_name, description, category, subcategory, emissions_reduction_factor, project_types, integration_details, certifications) VALUES 
(4, 'Carbon Accounting Expert', 'EcoMetrics Consulting', 'Expert consultant specializing in carbon accounting, emissions tracking, and sustainability reporting for construction and real estate projects.', 'Consultants', 'Carbon Accounting', 0.20, '["construction", "agriculture"]', '{"consulting": {"expertise": ["carbon accounting", "emissions reporting", "regulatory compliance"], "hourlyRate": 150}}', '["GHG Protocol Certified", "CDP Accredited"]'),

(5, 'Green Building Specialist', 'Sustainable Structures', 'LEED-accredited professional with expertise in green building design, materials selection, and certification processes.', 'Consultants', 'Green Building', 0.25, '["construction"]', '{"consulting": {"expertise": ["LEED certification", "green materials", "energy modeling"], "hourlyRate": 175}}', '["LEED AP", "WELL AP"]'),

(6, 'Agricultural Sustainability Advisor', 'GreenPastures Consulting', 'Experienced consultant specializing in agricultural emissions reduction, regenerative farming practices, and sustainable livestock management.', 'Consultants', 'Agriculture', 0.30, '["agriculture", "livestock"]', '{"consulting": {"expertise": ["regenerative agriculture", "livestock emissions", "carbon sequestration"], "hourlyRate": 125}}', '["Certified Agricultural Consultant", "Regenerative Agriculture Certified"]');

-- Insert additional construction products
INSERT INTO marketplace_products (id, name, company_name, description, category, subcategory, emissions_reduction_factor, project_types, integration_details, certifications) VALUES 
(7, 'HempCrete Blocks', 'NaturBuild Materials', 'Sustainable building blocks made from hemp fiber and lime, providing excellent insulation while sequestering carbon.', 'Construction Materials', 'Alternative Concrete', 0.55, '["construction"]', '{"construction": {"materialId": "concrete_lowcarbon", "factor": 0.55}}', '["Cradle to Cradle Certified", "Bio-Based Material Certified"]'),

(8, 'SolarReflect Roofing', 'CoolTop Systems', 'High-albedo roofing material that reflects solar radiation, reducing cooling needs and urban heat island effects.', 'Construction Materials', 'Roofing', 0.40, '["construction"]', '{"construction": {"materialId": "roofing_metal", "factor": 0.40}}', '["Energy Star Certified", "Cool Roof Rating Council Certified"]'),

(9, 'EcoGlass Windows', 'ClearView Sustainable', 'Triple-glazed windows with recycled glass content and bio-based frames, reducing heating/cooling losses by up to 70%.', 'Construction Materials', 'Windows', 0.50, '["construction"]', '{"construction": {"materialId": "glass_recycled", "factor": 0.50}}', '["Passive House Certified", "Energy Star Certified"]'),

(10, 'BioFoam Insulation', 'GreenSpray Technologies', 'Plant-based spray foam insulation made from agricultural waste, offering high R-value with 70% lower embodied carbon.', 'Construction Materials', 'Insulation', 0.70, '["construction"]', '{"construction": {"materialId": "insulation_bio", "factor": 0.70}}', '["USDA Bio-Preferred", "GreenGuard Gold"]'),

(11, 'RecyClay Bricks', 'CircularMaterials Corp', 'Fired clay bricks with 60% recycled content from construction waste, requiring less energy during manufacturing.', 'Construction Materials', 'Masonry', 0.40, '["construction"]', '{"construction": {"materialId": "brick_reclaimed", "factor": 0.40}}', '["Recycled Content Certified", "Cradle to Cradle Silver"]'),

(12, 'CarbonCapture Concrete', 'CO2Lock Solutions', 'Innovative concrete that permanently sequesters carbon dioxide during curing, turning a carbon source into a carbon sink.', 'Construction Materials', 'Concrete', 0.85, '["construction"]', '{"construction": {"materialId": "concrete_ultralowcarbon", "factor": 0.85}}', '["Carbon Negative Certified", "Environmental Product Declaration"]');

-- Insert cattle feed and supplements for methane reduction
INSERT INTO marketplace_products (id, name, company_name, description, category, subcategory, emissions_reduction_factor, project_types, integration_details, certifications) VALUES 
(13, 'Seaweed Feed Supplement', 'OceanSolutions Inc.', 'Natural feed supplement containing Asparagopsis taxiformis seaweed that reduces enteric methane emissions from cattle by inhibiting methane-producing microbes.', 'Livestock', 'Feed Supplements', 0.80, '["livestock", "agriculture"]', '{"livestock": {"applicationType": "feed_supplement", "dosePerAnimal": "10g/day", "costPerAnimal": 0.50}}', '["Organic Certified", "Animal Welfare Approved"]'),

(14, 'MethaneBlock Feed Additive', 'RuminantScience Labs', 'Essential oil blend that modifies rumen fermentation to reduce methane production without impacting animal health or productivity.', 'Livestock', 'Feed Additives', 0.35, '["livestock", "agriculture"]', '{"livestock": {"applicationType": "feed_additive", "dosePerAnimal": "5g/day", "costPerAnimal": 0.25}}', '["FDA Approved", "Methane Reduction Verified"]'),

(15, 'HighDigest TMR Mix', 'NutriRumen Systems', 'Total mixed ration formula with optimized digestibility and plant compounds that reduce methane emissions while improving feed conversion efficiency.', 'Livestock', 'Complete Feed', 0.40, '["livestock", "agriculture"]', '{"livestock": {"applicationType": "complete_feed", "dosePerAnimal": "22kg/day", "costPerAnimal": 3.75}}', '["Sustainable Feed Certified", "Carbon Trust Verified"]'),

(16, 'ProBiotic Cattle Supplement', 'MicroBalance Feed', 'Probiotic feed supplement that modifies gut microbiome composition to reduce methane production and improve nutrient absorption.', 'Livestock', 'Probiotics', 0.30, '["livestock", "agriculture"]', '{"livestock": {"applicationType": "probiotic", "dosePerAnimal": "8g/day", "costPerAnimal": 0.35}}', '["USDA Organic", "Global Animal Partnership Certified"]'),

(17, 'LegumeGraze Pasture Seed Mix', 'SustainableFoods Ltd', 'Specialized pasture seed mix with high legume content and bioactive compounds that reduce methane emissions from grazing cattle.', 'Livestock', 'Grazing Systems', 0.25, '["livestock", "agriculture"]', '{"livestock": {"applicationType": "pasture_system", "implementationCost": 450, "costPerHectare": 180}}', '["Non-GMO Project Verified", "Regenerative Agriculture Certified"]'),

(18, '3-NOP Feed Integration', 'CleanCattle Technologies', 'Feed integration system for 3-Nitrooxypropanol, a methane inhibitor that blocks the enzyme responsible for methane production in the rumen.', 'Livestock', 'Methane Inhibitors', 0.50, '["livestock", "agriculture"]', '{"livestock": {"applicationType": "feed_technology", "dosePerAnimal": "1.5g/day", "costPerAnimal": 0.60}}', '["EPA Approved", "Climate Neutral Certified"]');
