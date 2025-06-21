/**
 * Seed data for industry benchmarks
 */

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('industry_benchmarks').del()
    .then(function () {
      // Insert seed entries
      return knex('industry_benchmarks').insert([
        {
          industry: 'agriculture',
          name: 'Agriculture',
          total_emissions: JSON.stringify({
            min: 25.0,
            max: 120.0,
            mean: 58.3,
            median: 51.2,
            percentiles: {
              10: 32.1,
              25: 41.5,
              50: 51.2,
              75: 68.7,
              90: 84.3
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 250,
            max: 1200,
            mean: 580,
            median: 510,
            percentiles: {
              10: 320,
              25: 420,
              50: 510,
              75: 690,
              90: 840
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 65.2,
              median: 67.8
            },
            scope2Percentage: {
              mean: 12.5,
              median: 10.8
            },
            scope3Percentage: {
              mean: 22.3,
              median: 21.4
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 28.5,
            leadersTargetPercentage: 42.0
          })
        },
        {
          industry: 'manufacturing',
          name: 'Manufacturing',
          total_emissions: JSON.stringify({
            min: 100.0,
            max: 500.0,
            mean: 250.0,
            median: 230.0,
            percentiles: {
              10: 125.0,
              25: 175.0,
              50: 230.0,
              75: 325.0,
              90: 425.0
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 150,
            max: 900,
            mean: 420,
            median: 380,
            percentiles: {
              10: 200,
              25: 280,
              50: 380,
              75: 520,
              90: 680
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 45.0,
              median: 42.5
            },
            scope2Percentage: {
              mean: 30.0,
              median: 32.5
            },
            scope3Percentage: {
              mean: 25.0,
              median: 25.0
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 32.0,
            leadersTargetPercentage: 45.0
          })
        },
        {
          industry: 'retail',
          name: 'Retail',
          total_emissions: JSON.stringify({
            min: 30.0,
            max: 200.0,
            mean: 85.0,
            median: 75.0,
            percentiles: {
              10: 40.0,
              25: 55.0,
              50: 75.0,
              75: 110.0,
              90: 160.0
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 30,
            max: 200,
            mean: 95,
            median: 85,
            percentiles: {
              10: 45,
              25: 65,
              50: 85,
              75: 120,
              90: 165
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 10.0,
              median: 8.5
            },
            scope2Percentage: {
              mean: 30.0,
              median: 28.5
            },
            scope3Percentage: {
              mean: 60.0,
              median: 63.0
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 25.0,
            leadersTargetPercentage: 40.0
          })
        },
        {
          industry: 'office',
          name: 'Office-Based Business',
          total_emissions: JSON.stringify({
            min: 10.0,
            max: 100.0,
            mean: 35.0,
            median: 30.0,
            percentiles: {
              10: 15.0,
              25: 22.5,
              50: 30.0,
              75: 45.0,
              90: 70.0
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 20,
            max: 100,
            mean: 45,
            median: 40,
            percentiles: {
              10: 25,
              25: 32,
              50: 40,
              75: 55,
              90: 75
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 5.0,
              median: 4.0
            },
            scope2Percentage: {
              mean: 30.0,
              median: 28.0
            },
            scope3Percentage: {
              mean: 65.0,
              median: 68.0
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 30.0,
            leadersTargetPercentage: 50.0
          })
        },
        {
          industry: 'logistics',
          name: 'Logistics & Transportation',
          total_emissions: JSON.stringify({
            min: 80.0,
            max: 500.0,
            mean: 220.0,
            median: 190.0,
            percentiles: {
              10: 100.0,
              25: 140.0,
              50: 190.0,
              75: 275.0,
              90: 380.0
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 400,
            max: 1500,
            mean: 850,
            median: 800,
            percentiles: {
              10: 500,
              25: 650,
              50: 800,
              75: 1000,
              90: 1300
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 75.0,
              median: 78.0
            },
            scope2Percentage: {
              mean: 10.0,
              median: 7.0
            },
            scope3Percentage: {
              mean: 15.0,
              median: 15.0
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 25.0,
            leadersTargetPercentage: 45.0
          })
        },
        {
          industry: 'hospitality',
          name: 'Hospitality',
          total_emissions: JSON.stringify({
            min: 40.0,
            max: 300.0,
            mean: 120.0,
            median: 100.0,
            percentiles: {
              10: 55.0,
              25: 75.0,
              50: 100.0,
              75: 150.0,
              90: 220.0
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 100,
            max: 500,
            mean: 250,
            median: 220,
            percentiles: {
              10: 130,
              25: 175,
              50: 220,
              75: 300,
              90: 400
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 25.0,
              median: 23.0
            },
            scope2Percentage: {
              mean: 45.0,
              median: 47.0
            },
            scope3Percentage: {
              mean: 30.0,
              median: 30.0
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 30.0,
            leadersTargetPercentage: 45.0
          })
        },
        {
          industry: 'construction',
          name: 'Construction',
          total_emissions: JSON.stringify({
            min: 50.0,
            max: 400.0,
            mean: 180.0,
            median: 150.0,
            percentiles: {
              10: 70.0,
              25: 100.0,
              50: 150.0,
              75: 230.0,
              90: 320.0
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 120,
            max: 800,
            mean: 350,
            median: 300,
            percentiles: {
              10: 150,
              25: 220,
              50: 300,
              75: 450,
              90: 650
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 30.0,
              median: 28.0
            },
            scope2Percentage: {
              mean: 15.0,
              median: 12.0
            },
            scope3Percentage: {
              mean: 55.0,
              median: 60.0
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 25.0,
            leadersTargetPercentage: 40.0
          })
        },
        {
          industry: 'tech',
          name: 'Technology',
          total_emissions: JSON.stringify({
            min: 20.0,
            max: 200.0,
            mean: 80.0,
            median: 65.0,
            percentiles: {
              10: 30.0,
              25: 45.0,
              50: 65.0,
              75: 100.0,
              90: 150.0
            }
          }),
          emission_intensity: JSON.stringify({
            unit: 'tonnes CO₂e per $1M revenue',
            min: 25,
            max: 150,
            mean: 65,
            median: 55,
            percentiles: {
              10: 35,
              25: 45,
              50: 55,
              75: 80,
              90: 110
            }
          }),
          scope_breakdown: JSON.stringify({
            scope1Percentage: {
              mean: 5.0,
              median: 3.0
            },
            scope2Percentage: {
              mean: 40.0,
              median: 42.0
            },
            scope3Percentage: {
              mean: 55.0,
              median: 55.0
            }
          }),
          reductions: JSON.stringify({
            averageTargetPercentage: 40.0,
            leadersTargetPercentage: 60.0
          })
        }
      ]);
    });
};