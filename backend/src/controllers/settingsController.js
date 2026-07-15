const { pool } = require('../config/database');

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    const [config] = await pool.query('SELECT * FROM chama_config LIMIT 1');
    if (config.length === 0) {
      return res.status(404).json({ message: 'Chama configuration not found.' });
    }
    return res.status(200).json(config[0]);
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/settings
const updateSettings = async (req, res) => {
  const { chama_name, contribution_amount, fine_amount, meeting_frequency, location_name, latitude, longitude } = req.body;

  if (!chama_name || !contribution_amount) {
    return res.status(400).json({ message: 'Chama name and contribution amount are required.' });
  }

  try {
    const [config] = await pool.query('SELECT * FROM chama_config LIMIT 1');
    if (config.length === 0) {
      return res.status(404).json({ message: 'Chama configuration not found.' });
    }

    await pool.query(
      `UPDATE chama_config
       SET chama_name = ?, contribution_amount = ?, fine_amount = ?, meeting_frequency = ?,
           location_name = ?, latitude = ?, longitude = ?
       WHERE chama_id = ?`,
      [
        chama_name, contribution_amount, fine_amount || 0, meeting_frequency || 'Monthly',
        location_name || null, latitude || null, longitude || null,
        config[0].chama_id
      ]
    );

    return res.status(200).json({ message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = { getSettings, updateSettings };
