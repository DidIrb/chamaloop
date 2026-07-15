const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// POST /api/auth/register
const register = async (req, res) => {
  const { chama_name, contribution_amount, fine_amount, meeting_frequency,
          admin_name, phone_number, email, pin,
          location_name, latitude, longitude } = req.body;

  if (!chama_name || !contribution_amount || !admin_name || !phone_number || !pin) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  if (String(pin).length !== 4 || isNaN(pin)) {
    return res.status(400).json({ message: 'PIN must be exactly 4 digits.' });
  }

  const conn = await pool.getConnection();
  try {
    // Only one Chama per installation
    const [existing] = await conn.query('SELECT chama_id FROM chama_config LIMIT 1');
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A Chama is already registered on this system.' });
    }

    // Check phone number not already in use
    const [existingUser] = await conn.query('SELECT user_id FROM users WHERE phone_number = ?', [phone_number]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'This phone number is already registered.' });
    }

    const pin_hash = bcrypt.hashSync(String(pin), 10);

    await conn.beginTransaction();

    // Insert Chama config
    await conn.query(
      'INSERT INTO chama_config (chama_name, contribution_amount, fine_amount, meeting_frequency, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [chama_name, contribution_amount, fine_amount || 0, meeting_frequency || 'Monthly', location_name || null, latitude || null, longitude || null]
    );

    // Insert admin as a member first
    const [memberResult] = await conn.query(
      'INSERT INTO members (name, phone_number, rotation_order) VALUES (?, ?, 1)',
      [admin_name, phone_number]
    );

    // Insert admin user account
    await conn.query(
      "INSERT INTO users (phone_number, pin_hash, role, email, member_id) VALUES (?, ?, 'admin', ?, ?)",
      [phone_number, pin_hash, email || null, memberResult.insertId]
    );

    await conn.commit();

    return res.status(201).json({ message: 'Chama registered successfully. You can now log in.' });

  } catch (error) {
    await conn.rollback();
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { phone_number, pin } = req.body;

  if (!phone_number || !pin) {
    return res.status(400).json({ message: 'Phone number and PIN are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.*, m.name FROM users u
       LEFT JOIN members m ON u.member_id = m.member_id
       WHERE u.phone_number = ?`,
      [phone_number]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or PIN.' });
    }

    const pinMatch = bcrypt.compareSync(String(pin), user.pin_hash);
    if (!pinMatch) {
      return res.status(401).json({ message: 'Invalid phone number or PIN.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, member_id: user.member_id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: { user_id: user.user_id, name: user.name, role: user.role, phone_number: user.phone_number }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Temporary in-memory store for reset tokens
// In production this would go in the database but for this project this is fine
const resetTokens = {};

const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

// POST /api/auth/forgot-pin — admin requests PIN reset via email
const forgotPin = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND role = 'admin'",
      [email]
    );

    // Always return success even if email not found — security best practice
    if (rows.length === 0) {
      return res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });
    }

    const user = rows[0];

    // Generate a 6 digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetTokens[email] = { code: resetCode, expires, user_id: user.user_id };

    await mailer.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'ChamaLoop PIN Reset',
      text: `Your ChamaLoop PIN reset code is: ${resetCode}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`
    });

    return res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });

  } catch (error) {
    console.error('Forgot PIN error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// POST /api/auth/reset-pin — admin submits reset code and new PIN
const resetPin = async (req, res) => {
  const { email, code, new_pin } = req.body;

  if (!email || !code || !new_pin) {
    return res.status(400).json({ message: 'Email, reset code and new PIN are required.' });
  }

  if (String(new_pin).length !== 4 || isNaN(new_pin)) {
    return res.status(400).json({ message: 'New PIN must be exactly 4 digits.' });
  }

  const record = resetTokens[email];

  if (!record) {
    return res.status(400).json({ message: 'Invalid or expired reset code.' });
  }

  if (Date.now() > record.expires) {
    delete resetTokens[email];
    return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
  }

  if (record.code !== String(code)) {
    return res.status(400).json({ message: 'Invalid reset code.' });
  }

  try {
    const pin_hash = bcrypt.hashSync(String(new_pin), 10);
    await pool.query('UPDATE users SET pin_hash = ? WHERE user_id = ?', [pin_hash, record.user_id]);

    delete resetTokens[email];

    return res.status(200).json({ message: 'PIN reset successfully. You can now log in.' });

  } catch (error) {
    console.error('Reset PIN error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { register, login, forgotPin, resetPin };
