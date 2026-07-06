const { pool } = require('../config/database');

// GET /api/history — read only, no delete or update exists here
const getHistory = async (req, res) => {
  try {
    const [rounds] = await pool.query(
      `SELECT r.*, m.name as recipient_name
       FROM rounds r
       JOIN members m ON r.recipient_member_id = m.member_id
       WHERE r.status = 'completed'
       ORDER BY r.round_number DESC`
    );

    // Attach contributions to each round
    const history = await Promise.all(rounds.map(async (round) => {
      const [contributions] = await pool.query(
        `SELECT c.*, m.name, m.phone_number
         FROM contributions c
         JOIN members m ON c.member_id = m.member_id
         WHERE c.round_id = ?
         ORDER BY m.rotation_order ASC`,
        [round.round_id]
      );

      const totalFines = contributions.reduce((sum, c) => sum + parseFloat(c.fine_amount), 0);

      // Members only see their own contribution in each round
      const visibleContributions = req.user.role === 'member'
        ? contributions.filter(c => c.member_id === req.user.member_id)
        : contributions;

      return { ...round, contributions: visibleContributions, totalFines };
    }));

    return res.status(200).json(history);

  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = { getHistory };
