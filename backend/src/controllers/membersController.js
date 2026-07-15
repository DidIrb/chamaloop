const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// GET /api/members
const getAllMembers = async (req, res) => {
  try {
    // Members can only see their own record — admins see everyone
    if (req.user.role === 'member') {
      const [rows] = await pool.query(
        `SELECT m.*, u.user_id, u.role
         FROM members m
         LEFT JOIN users u ON u.member_id = m.member_id
         WHERE m.member_id = ?`,
        [req.user.member_id]
      );
      return res.status(200).json(rows);
    }

    const [members] = await pool.query(
      `SELECT m.*, u.user_id, u.role
       FROM members m
       LEFT JOIN users u ON u.member_id = m.member_id
       ORDER BY m.rotation_order ASC`
    );
    return res.status(200).json(members);
  } catch (error) {
    console.error('Get members error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/members — admin adds a new member
const addMember = async (req, res) => {
  const { name, phone_number, pin, business_name, business_type, business_location } = req.body;

  if (!name || !phone_number || !pin) {
    return res.status(400).json({ message: 'Name, phone number and PIN are required.' });
  }

  if (String(pin).length !== 4 || isNaN(pin)) {
    return res.status(400).json({ message: 'PIN must be exactly 4 digits.' });
  }

  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query('SELECT member_id FROM members WHERE phone_number = ?', [phone_number]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A member with this phone number already exists.' });
    }

    const pin_hash = bcrypt.hashSync(String(pin), 10);

    // Get next rotation order
    const [lastOrder] = await conn.query('SELECT MAX(rotation_order) as max_order FROM members');
    const rotation_order = (lastOrder[0].max_order || 0) + 1;

    await conn.beginTransaction();

    const [memberResult] = await conn.query(
      'INSERT INTO members (name, phone_number, rotation_order, business_name, business_type, business_location) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone_number, rotation_order, business_name || null, business_type || null, business_location || null]
    );

    await conn.query(
      "INSERT INTO users (phone_number, pin_hash, role, member_id) VALUES (?, ?, 'member', ?)",
      [phone_number, pin_hash, memberResult.insertId]
    );

    await conn.commit();

    return res.status(201).json({ message: 'Member added successfully.', member_id: memberResult.insertId });

  } catch (error) {
    await conn.rollback();
    console.error('Add member error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  } finally {
    conn.release();
  }
};

// PUT /api/members/:id/rotation
const updateRotationOrder = async (req, res) => {
  const { id } = req.params;
  const { rotation_order } = req.body;

  if (!rotation_order || isNaN(rotation_order)) {
    return res.status(400).json({ message: 'A valid rotation order number is required.' });
  }

  try {
    const [member] = await pool.query('SELECT * FROM members WHERE member_id = ?', [id]);
    if (member.length === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    await pool.query('UPDATE members SET rotation_order = ? WHERE member_id = ?', [rotation_order, id]);

    return res.status(200).json({ message: 'Rotation order updated successfully.' });
  } catch (error) {
    console.error('Update rotation error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/members/:id/reset-pin
const resetMemberPin = async (req, res) => {
  const { id } = req.params;
  const { new_pin } = req.body;

  if (!new_pin || String(new_pin).length !== 4 || isNaN(new_pin)) {
    return res.status(400).json({ message: 'New PIN must be exactly 4 digits.' });
  }

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE member_id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const pin_hash = bcrypt.hashSync(String(new_pin), 10);
    await pool.query('UPDATE users SET pin_hash = ? WHERE member_id = ?', [pin_hash, id]);

    return res.status(200).json({ message: 'PIN reset successfully.' });
  } catch (error) {
    console.error('Reset PIN error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/members/:id/business
const updateMemberBusiness = async (req, res) => {
  const { id } = req.params;
  const { business_name, business_type, business_location } = req.body;

  try {
    const [member] = await pool.query('SELECT * FROM members WHERE member_id = ?', [id]);
    if (member.length === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    await pool.query(
      'UPDATE members SET business_name = ?, business_type = ?, business_location = ? WHERE member_id = ?',
      [business_name || null, business_type || null, business_location || null, id]
    );

    return res.status(200).json({ message: 'Business info updated successfully.' });
  } catch (error) {
    console.error('Update business info error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = { getAllMembers, addMember, updateRotationOrder, resetMemberPin, updateMemberBusiness };
