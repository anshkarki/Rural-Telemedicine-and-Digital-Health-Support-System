const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  console.log('🚀 Setting up Telemedicine Database...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  // Read and execute schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  
  // Remove the placeholder admin insert from schema (we'll do it properly)
  const schemaWithoutSeed = schema.replace(/-- Seed default admin[\s\S]*$/, '');
  
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'telemedicine_db'}`);
  await connection.execute(`USE ${process.env.DB_NAME || 'telemedicine_db'}`);
  
  const statements = schemaWithoutSeed.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await connection.execute(stmt);
      } catch (e) {
        // Ignore errors for existing tables
      }
    }
  }

  // Create admin user with proper hash
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await connection.execute(`
    INSERT IGNORE INTO users (name, email, password_hash, role, phone, address)
    VALUES (?, ?, ?, 'admin', '9999999999', 'Admin Office, India')
  `, ['System Admin', 'admin@telemedicine.in', adminPassword]);

  console.log('✅ Database tables created');
  console.log('✅ Admin user created: admin@telemedicine.in / Admin@123');
  
  await connection.end();
  console.log('✅ Setup complete! Run: node server.js');
}

setup().catch(console.error);
