const db = require('../db');

// GET /api/fines
exports.getAll = async (req, res) => {
  try {
    let sqlQuery = `SELECT f.*, m.name as member_name, b.title as book_title
                 FROM fines f
                 JOIN members m ON f.member_id = m.member_id
                 JOIN borrow_records br ON f.record_id = br.record_id
                 JOIN books b ON br.book_id = b.book_id`;
    let params = [];

    if (req.query.member_id) {
      sqlQuery += ' WHERE f.member_id = ?';
      params.push(req.query.member_id);
    }
    if (req.query.unpaid === 'true') {
      sqlQuery += params.length ? ' AND' : ' WHERE';
      sqlQuery += ' f.paid = 0';
    }

    sqlQuery += ' ORDER BY f.fine_date DESC';
    const rows = await db.query(sqlQuery, params);
    res.json(rows);
  } catch (err) {
    console.error('Get fines error:', err);
    res.status(500).json({ error: 'Failed to fetch fines.' });
  }
};

// PUT /api/fines/:id/pay
exports.payFine = async (req, res) => {
  try {
    const result = await db.execute(
      'UPDATE fines SET paid = 1 WHERE fine_id = ?',
      [req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Fine not found.' });
    res.json({ message: 'Fine marked as paid.' });
  } catch (err) {
    console.error('Pay fine error:', err);
    res.status(500).json({ error: 'Failed to update fine.' });
  }
};
