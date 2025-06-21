/**
 * Migrations for emissions-related tables
 * 
 * This file contains migrations for:
 * - emissions_calculations
 * - reduction_strategies
 * - carbon_reports
 */

// Migration for emissions_calculations table
exports.up = function(knex) {
  return Promise.all([
    // Create emissions_calculations table
    knex.schema.createTable('emissions_calculations', function(table) {
      table.increments('id').primary();
      table.integer('project_id').unsigned().notNullable();
      table.foreign('project_id').references('projects.id').onDelete('CASCADE');
      table.string('industry').notNullable();
      table.string('country').notNullable();
      
      // Company size information
      table.jsonb('company_size').notNullable();
      
      // Emissions values by category
      table.jsonb('emission_values').notNullable();
      
      // Calculated emissions
      table.float('scope1_emissions').notNullable();
      table.float('scope2_emissions').notNullable();
      table.float('scope3_emissions').notNullable();
      table.float('total_emissions').notNullable();
      
      // Reduction target
      table.float('reduction_target').notNullable();
      
      // Metadata
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.string('created_by');
    }),
    
    // Create reduction_strategies table
    knex.schema.createTable('reduction_strategies', function(table) {
      table.increments('id').primary();
      table.string('strategy_id').notNullable();
      table.string('industry').notNullable();
      table.string('strategy').notNullable();
      table.text('description');
      table.string('scope').notNullable();
      table.string('timeframe');
      table.string('difficulty');
      table.float('capex').notNullable();
      table.float('opex_savings').notNullable();
      
      // Metadata
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    }),
    
    // Create selected_strategies table
    knex.schema.createTable('selected_strategies', function(table) {
      table.increments('id').primary();
      table.integer('calculation_id').unsigned().notNullable();
      table.foreign('calculation_id').references('emissions_calculations.id').onDelete('CASCADE');
      table.string('strategy_id').notNullable();
      table.float('potential_reduction').notNullable();
      
      // Created a composite unique key to prevent duplicate selections
      table.unique(['calculation_id', 'strategy_id']);
      
      // Metadata
      table.timestamp('created_at').defaultTo(knex.fn.now());
    }),
    
    // Create carbon_reports table
    knex.schema.createTable('carbon_reports', function(table) {
      table.increments('id').primary();
      table.integer('project_id').unsigned().notNullable();
      table.foreign('project_id').references('projects.id').onDelete('CASCADE');
      table.string('report_id').notNullable().unique();
      table.integer('calculation_id').unsigned().notNullable();
      table.foreign('calculation_id').references('emissions_calculations.id').onDelete('CASCADE');
      table.string('report_type').notNullable().defaultTo('standard');
      table.jsonb('report_content').notNullable();
      table.jsonb('emissions_data').notNullable();
      table.float('reduction_target').notNullable();
      
      // Metadata
      table.timestamp('generated_at').defaultTo(knex.fn.now());
      table.string('generated_by');
    }),
    
    // Create strategy_scenarios table
    knex.schema.createTable('strategy_scenarios', function(table) {
      table.increments('id').primary();
      table.integer('calculation_id').unsigned().notNullable();
      table.foreign('calculation_id').references('emissions_calculations.id').onDelete('CASCADE');
      table.string('name').notNullable();
      table.jsonb('strategies').notNullable();
      table.float('direct_reduction_percentage').notNullable();
      table.float('offsetting_percentage').notNullable();
      
      // Metadata
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    }),
    
    // Create industry_benchmarks table
    knex.schema.createTable('industry_benchmarks', function(table) {
      table.increments('id').primary();
      table.string('industry').notNullable().unique();
      table.string('name').notNullable();
      table.jsonb('total_emissions').notNullable();
      table.jsonb('emission_intensity').notNullable();
      table.jsonb('scope_breakdown').notNullable();
      table.jsonb('reductions').notNullable();
      
      // Metadata
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  ]);
};

exports.down = function(knex) {
  // Drop tables in reverse order to avoid foreign key constraints
  return Promise.all([
    knex.schema.dropTableIfExists('industry_benchmarks'),
    knex.schema.dropTableIfExists('strategy_scenarios'),
    knex.schema.dropTableIfExists('carbon_reports'),
    knex.schema.dropTableIfExists('selected_strategies'),
    knex.schema.dropTableIfExists('reduction_strategies'),
    knex.schema.dropTableIfExists('emissions_calculations')
  ]);
};