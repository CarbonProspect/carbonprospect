require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'carbon_marketplace',
      user: process.env.DB_USER || 'alexandercameron',
      password: process.env.DB_PASSWORD || '',
    },
    migrations: {
      directory: './server/db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './server/db/seeds'
    }
  }
};// knexfile.js
require('dotenv').config();

/**
 * Knex.js configuration file
 * This file configures database connections for different environments
 */

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'carbon_marketplace',
      user: process.env.DB_USER || 'alexandercameron',
      password: process.env.DB_PASSWORD || '',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './server/db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './server/db/seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './server/db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './server/db/seeds'
    }
  }
};
