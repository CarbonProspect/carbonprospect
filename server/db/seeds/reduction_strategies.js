/**
 * Seed data for reduction strategies
 */

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('reduction_strategies').del()
    .then(function () {
      // Insert seed entries for various industries
      return knex('reduction_strategies').insert([
        // Agriculture industry strategies
        {
          strategy_id: 'renewable-energy-ag',
          industry: 'agriculture',
          strategy: 'Renewable Energy Installation',
          description: 'Install solar panels, wind turbines, or other renewable energy sources to power farm operations',
          scope: 'Scope 2',
          timeframe: '1-3 years',
          difficulty: 'Medium',
          capex: 100000,
          opex_savings: 30000
        },
        {
          strategy_id: 'precision-agriculture',
          industry: 'agriculture',
          strategy: 'Precision Agriculture',
          description: 'Implement precision agriculture technologies to optimize resource use and reduce emissions',
          scope: 'Scope 1',
          timeframe: '1-2 years',
          difficulty: 'Medium',
          capex: 75000,
          opex_savings: 40000
        },
        {
          strategy_id: 'improved-feed-management',
          industry: 'agriculture',
          strategy: 'Improved Feed Management',
          description: 'Optimize livestock feed to reduce methane emissions',
          scope: 'Scope 1',
          timeframe: '1-2 years',
          difficulty: 'Low',
          capex: 20000,
          opex_savings: 15000
        },
        {
          strategy_id: 'no-till-farming',
          industry: 'agriculture',
          strategy: 'No-Till Farming',
          description: 'Implement no-till practices to reduce soil carbon loss and fuel use',
          scope: 'Scope 1',
          timeframe: '1-2 years',
          difficulty: 'Low',
          capex: 30000,
          opex_savings: 25000
        },
        {
          strategy_id: 'agroforestry',
          industry: 'agriculture',
          strategy: 'Agroforestry',
          description: 'Integrate trees into farming systems for carbon sequestration',
          scope: 'Scope 1',
          timeframe: '3-5 years',
          difficulty: 'Medium',
          capex: 50000,
          opex_savings: 10000
        },
        
        // Manufacturing industry strategies
        {
          strategy_id: 'energy-efficient-equipment-mfg',
          industry: 'manufacturing',
          strategy: 'Energy-Efficient Equipment',
          description: 'Replace old manufacturing equipment with energy-efficient alternatives',
          scope: 'Scope 1',
          timeframe: '1-3 years',
          difficulty: 'Medium',
          capex: 250000,
          opex_savings: 80000
        },
        {
          strategy_id: 'process-optimization',
          industry: 'manufacturing',
          strategy: 'Process Optimization',
          description: 'Optimize manufacturing processes to reduce energy consumption and waste',
          scope: 'Scope 1',
          timeframe: '1-2 years',
          difficulty: 'Medium',
          capex: 100000,
          opex_savings: 60000
        },
        {
          strategy_id: 'renewable-energy-mfg',
          industry: 'manufacturing',
          strategy: 'Renewable Energy Installation',
          description: 'Install solar panels or wind turbines to power manufacturing facilities',
          scope: 'Scope 2',
          timeframe: '1-3 years',
          difficulty: 'Medium',
          capex: 300000,
          opex_savings: 90000
        },
        {
          strategy_id: 'heat-recovery',
          industry: 'manufacturing',
          strategy: 'Heat Recovery Systems',
          description: 'Implement heat recovery systems to reuse waste heat in manufacturing processes',
          scope: 'Scope 1',
          timeframe: '1-3 years',
          difficulty: 'Medium',
          capex: 200000,
          opex_savings: 75000
        },
        {
          strategy_id: 'supply-chain-optimization-mfg',
          industry: 'manufacturing',
          strategy: 'Supply Chain Optimization',
          description: 'Work with suppliers to reduce emissions in the value chain',
          scope: 'Scope 3',
          timeframe: '1-3 years',
          difficulty: 'High',
          capex: 50000,
          opex_savings: 30000
        },
        
        // Retail industry strategies
        {
          strategy_id: 'led-lighting',
          industry: 'retail',
          strategy: 'LED Lighting Upgrade',
          description: 'Replace all lighting with energy-efficient LED alternatives',
          scope: 'Scope 2',
          timeframe: '1 year',
          difficulty: 'Low',
          capex: 60000,
          opex_savings: 25000
        },
        {
          strategy_id: 'hvac-optimization',
          industry: 'retail',
          strategy: 'HVAC System Optimization',
          description: 'Upgrade and optimize heating, ventilation, and air conditioning systems',
          scope: 'Scope 2',
          timeframe: '1-2 years',
          difficulty: 'Medium',
          capex: 100000,
          opex_savings: 40000
        },
        {
          strategy_id: 'renewable-energy-retail',
          industry: 'retail',
          strategy: 'Renewable Energy Purchase',
          description: 'Switch to renewable energy sources through power purchase agreements',
          scope: 'Scope 2',
          timeframe: '1 year',
          difficulty: 'Low',
          capex: 20000,
          opex_savings: 5000
        },
        {
          strategy_id: 'supply-chain-optimization-retail',
          industry: 'retail',
          strategy: 'Supply Chain Optimization',
          description: 'Work with suppliers to reduce emissions in product manufacturing and distribution',
          scope: 'Scope 3',
          timeframe: '1-3 years',
          difficulty: 'High',
          capex: 40000,
          opex_savings: 20000
        },
        {
          strategy_id: 'sustainable-packaging',
          industry: 'retail',
          strategy: 'Sustainable Packaging',
          description: 'Switch to sustainable, recyclable, or reusable packaging materials',
          scope: 'Scope 3',
          timeframe: '1-2 years',
          difficulty: 'Medium',
          capex: 30000,
          opex_savings: 10000
        },
        
        // Office-based business strategies
        {
          strategy_id: 'energy-efficient-equipment-office',
          industry: 'office',
          strategy: 'Energy-Efficient Equipment',
          description: 'Replace old office equipment with energy-efficient alternatives',
          scope: 'Scope 2',
          timeframe: '1 year',
          difficulty: 'Low',
          capex: 40000,
          opex_savings: 15000
        },
        {
          strategy_id: 'remote-work-policy',
          industry: 'office',
          strategy: 'Remote Work Policy',
          description: 'Implement remote work policies to reduce commuting emissions',
          scope: 'Scope 3',
          timeframe: '6 months',
          difficulty: 'Low',
          capex: 10000,
          opex_savings: 30000
        },
        {
          strategy_id: 'paperless-office',
          industry: 'office',
          strategy: 'Paperless Office Initiative',
          description: 'Implement digital solutions to reduce paper consumption',
          scope: 'Scope 3',
          timeframe: '1 year',
          difficulty: 'Low',
          capex: 15000,
          opex_savings: 8000
        },
        {
          strategy_id: 'renewable-energy-office',
          industry: 'office',
          strategy: 'Renewable Energy Purchase',
          description: 'Switch to renewable energy sources for office power needs',
          scope: 'Scope 2',
          timeframe: '1 year',
          difficulty: 'Low',
          capex: 5000,
          opex_savings: 2000
        },
        {
          strategy_id: 'sustainable-procurement',
          industry: 'office',
          strategy: 'Sustainable Procurement',
          description: 'Implement sustainable procurement policies for office supplies and equipment',
          scope: 'Scope 3',
          timeframe: '1 year',
          difficulty: 'Medium',
          capex: 5000,
          opex_savings: 3000
        },
        
        // Logistics & Transportation strategies
        {
          strategy_id: 'electric-vehicle-fleet',
          industry: 'logistics',
          strategy: 'Electric Vehicle Fleet',
          description: 'Replace conventional vehicles with electric alternatives',
          scope: 'Scope 1',
          timeframe: '2-5 years',
          difficulty: 'High',
          capex: 500000,
          opex_savings: 150000
        },
        {
          strategy_id: 'route-optimization',
          industry: 'logistics',
          strategy: 'Route Optimization',
          description: 'Implement route optimization software to reduce fuel consumption',
          scope: 'Scope 1',
          timeframe: '1 year',
          difficulty: 'Medium',
          capex: 50000,
          opex_savings: 100000
        },
        {
          strategy_id: 'driver-training',
          industry: 'logistics',
          strategy: 'Eco-Driving Training',
          description: 'Train drivers in fuel-efficient driving techniques',
          scope: 'Scope 1',
          timeframe: '6 months',
          difficulty: 'Low',
          capex: 20000,
          opex_savings: 60000
        },
        {
          strategy_id: 'alternative-fuels',
          industry: 'logistics',
          strategy: 'Alternative Fuels',
          description: 'Switch to biodiesel, hydrogen, or other alternative fuels',
          scope: 'Scope 1',
          timeframe: '1-3 years',
          difficulty: 'Medium',
          capex: 100000,
          opex_savings: 40000
        },
        {
          strategy_id: 'warehouse-efficiency',
          industry: 'logistics',
          strategy: 'Warehouse Energy Efficiency',
          description: 'Implement energy-efficient lighting, heating, and cooling in warehouses',
          scope: 'Scope 2',
          timeframe: '1-2 years',
          difficulty: 'Medium',
          capex: 80000,
          opex_savings: 30000
        }
      ]);
    });
};