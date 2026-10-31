/*
 * Filename: /server/db.js
 *
 * This file configures the MySQL connection pool used by RoadReady.
 *
 * Responsibilities:
 * - Load database configuration from environment variables.
 * - Create the MySQL connection pool.
 * - Configure connection pooling and connection limits.
 * - Export the database pool for use by server routes.
 *
 * This file does NOT:
 * - Define API routes.
 * - Handle user authentication.
 * - Render pages.
 * - Contain frontend JavaScript.
 *
 * Database queries are performed by the appropriate server route files.
 */

const mysql = require("mysql2/promise");
const path = require('path');
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env') 
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
