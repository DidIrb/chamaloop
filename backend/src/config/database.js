const mysql = require('mysql2/promise');

// Create a connection pool — better than a single connection for web apps
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chamaloop',
  waitForConnections: true,
  connectionLimit: 10,
});

// Create all tables if they do not exist
const initDB = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS chama_config (
        chama_id INT AUTO_INCREMENT PRIMARY KEY,
        chama_name VARCHAR(255) NOT NULL,
        contribution_amount DECIMAL(10,2) NOT NULL,
        fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        meeting_frequency VARCHAR(50) NOT NULL DEFAULT 'Monthly',
        location_name VARCHAR(255),
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS members (
        member_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        rotation_order INT,
        date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        business_name VARCHAR(255),
        business_type VARCHAR(100),
        business_location VARCHAR(255)
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        pin_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'member') NOT NULL,
        email VARCHAR(255),
        member_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(member_id)
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS rounds (
        round_id INT AUTO_INCREMENT PRIMARY KEY,
        round_number INT NOT NULL,
        recipient_member_id INT NOT NULL,
        payout_amount DECIMAL(10,2) NOT NULL,
        date_conducted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'completed') NOT NULL DEFAULT 'active',
        FOREIGN KEY (recipient_member_id) REFERENCES members(member_id)
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS contributions (
        contribution_id INT AUTO_INCREMENT PRIMARY KEY,
        round_id INT NOT NULL,
        member_id INT NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
        date_paid TIMESTAMP NULL,
        mpesa_code VARCHAR(20),
        is_late TINYINT(1) NOT NULL DEFAULT 0,
        fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status ENUM('pending', 'paid', 'late') NOT NULL DEFAULT 'pending',
        FOREIGN KEY (round_id) REFERENCES rounds(round_id),
        FOREIGN KEY (member_id) REFERENCES members(member_id)
      );
    `);

    console.log('Database tables ready.');
  } catch (error) {
    console.error('Database init error:', error.message);
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = { pool, initDB };
