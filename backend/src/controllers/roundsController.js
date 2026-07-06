const { pool } = require('../config/database');

// GET /api/rounds/active
const getActiveRound = async (req, res) => {
  try {
    const [rounds] = await pool.query(
      `SELECT r.*, m.name as recipient_name, m.phone_number as recipient_phone
       FROM rounds r
       JOIN members m ON r.recipient_member_id = m.member_id
       WHERE r.status = 'active' LIMIT 1`
    );

    if (rounds.length === 0) {
      return res.status(200).json({ round: null, message: 'No active round. Start a new round.' });
    }

    const round = rounds[0];

    const [contributions] = await pool.query(
      `SELECT c.*, m.name, m.phone_number
       FROM contributions c
       JOIN members m ON c.member_id = m.member_id
       WHERE c.round_id = ?
       ORDER BY m.rotation_order ASC`,
      [round.round_id]
    );

    const totalPaid = contributions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + parseFloat(c.amount_paid), 0);

    // Members only see their own contribution row
    const visibleContributions = req.user.role === 'member'
      ? contributions.filter(c => c.member_id === req.user.member_id)
      : contributions;

    return res.status(200).json({ round, contributions: visibleContributions, totalPaid });

  } catch (error) {
    console.error('Get active round error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/rounds — admin starts a new round
const startRound = async (req, res) => {
  const { recipient_member_id } = req.body;

  if (!recipient_member_id) {
    return res.status(400).json({ message: 'Please select a recipient for this round.' });
  }

  const conn = await pool.getConnection();
  try {
    const [activeRound] = await conn.query("SELECT round_id FROM rounds WHERE status = 'active'");
    if (activeRound.length > 0) {
      return res.status(400).json({ message: 'There is already an active round. Close it before starting a new one.' });
    }

    const [recipient] = await conn.query('SELECT * FROM members WHERE member_id = ?', [recipient_member_id]);
    if (recipient.length === 0) {
      return res.status(404).json({ message: 'Recipient member not found.' });
    }

    const [config] = await conn.query('SELECT * FROM chama_config LIMIT 1');
    if (config.length === 0) {
      return res.status(400).json({ message: 'Chama configuration not found.' });
    }

    const [members] = await conn.query('SELECT * FROM members ORDER BY rotation_order ASC');
    const payout_amount = config[0].contribution_amount * members.length;

    const [lastRound] = await conn.query('SELECT MAX(round_number) as max FROM rounds');
    const round_number = (lastRound[0].max || 0) + 1;

    await conn.beginTransaction();

    const [roundResult] = await conn.query(
      "INSERT INTO rounds (round_number, recipient_member_id, payout_amount, status) VALUES (?, ?, ?, 'active')",
      [round_number, recipient_member_id, payout_amount]
    );

    const round_id = roundResult.insertId;

    for (const member of members) {
      await conn.query(
        "INSERT INTO contributions (round_id, member_id, status) VALUES (?, ?, 'pending')",
        [round_id, member.member_id]
      );
    }

    await conn.commit();

    return res.status(201).json({ message: 'Round started successfully.', round_id, round_number });

  } catch (error) {
    await conn.rollback();
    console.error('Start round error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  } finally {
    conn.release();
  }
};

// PUT /api/rounds/:id/close
const closeRound = async (req, res) => {
  const { id } = req.params;
  try {
    const [round] = await pool.query("SELECT * FROM rounds WHERE round_id = ? AND status = 'active'", [id]);
    if (round.length === 0) {
      return res.status(404).json({ message: 'Active round not found.' });
    }

    await pool.query("UPDATE rounds SET status = 'completed' WHERE round_id = ?", [id]);

    return res.status(200).json({ message: 'Round closed and recorded in the history ledger.' });
  } catch (error) {
    console.error('Close round error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/rounds/:roundId/contributions/:memberId/pay
const markContributionPaid = async (req, res) => {
  const { roundId, memberId } = req.params;
  const { mpesa_code } = req.body;

  try {
    const [contribution] = await pool.query(
      'SELECT * FROM contributions WHERE round_id = ? AND member_id = ?',
      [roundId, memberId]
    );

    if (contribution.length === 0) {
      return res.status(404).json({ message: 'Contribution record not found.' });
    }

    if (contribution[0].status === 'paid') {
      return res.status(400).json({ message: 'This contribution has already been marked as paid.' });
    }

    const [config] = await pool.query('SELECT * FROM chama_config LIMIT 1');

    await pool.query(
      `UPDATE contributions
       SET status = 'paid', amount_paid = ?, mpesa_code = ?, date_paid = NOW()
       WHERE round_id = ? AND member_id = ?`,
      [config[0].contribution_amount, mpesa_code || null, roundId, memberId]
    );

    return res.status(200).json({ message: 'Contribution marked as paid.' });
  } catch (error) {
    console.error('Mark paid error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/rounds/:roundId/contributions/:memberId/late
const markContributionLate = async (req, res) => {
  const { roundId, memberId } = req.params;

  try {
    const [contribution] = await pool.query(
      'SELECT * FROM contributions WHERE round_id = ? AND member_id = ?',
      [roundId, memberId]
    );

    if (contribution.length === 0) {
      return res.status(404).json({ message: 'Contribution record not found.' });
    }

    const [config] = await pool.query('SELECT * FROM chama_config LIMIT 1');

    await pool.query(
      `UPDATE contributions
       SET status = 'late', is_late = 1, fine_amount = ?
       WHERE round_id = ? AND member_id = ?`,
      [config[0].fine_amount, roundId, memberId]
    );

    return res.status(200).json({ message: 'Member marked as late. Fine applied.' });
  } catch (error) {
    console.error('Mark late error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = { getActiveRound, startRound, closeRound, markContributionPaid, markContributionLate };
