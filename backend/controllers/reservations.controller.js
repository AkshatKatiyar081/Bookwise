const db = require('../db');

// GET /api/reservations
exports.getAll = async (req, res) => {
  try {
    let sqlQuery = `SELECT r.*, b.title, b.author, m.name as member_name
                 FROM reservations r
                 JOIN books b ON r.book_id = b.book_id
                 JOIN members m ON r.member_id = m.member_id`;
    let params = [];

    if (req.query.status) {
      sqlQuery += ' WHERE r.status = ?';
      params.push(req.query.status);
    }
    if (req.query.member_id) {
      sqlQuery += params.length ? ' AND' : ' WHERE';
      sqlQuery += ' r.member_id = ?';
      params.push(req.query.member_id);
    }

    sqlQuery += ' ORDER BY r.reservation_date DESC';
    const rows = await db.query(sqlQuery, params);
    res.json(rows);
  } catch (err) {
    console.error('Get reservations error:', err);
    res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
};

// POST /api/reservations
exports.create = async (req, res) => {
  try {
    const { book_id, member_id } = req.body;
    if (!book_id || !member_id) {
      return res.status(400).json({ error: 'Book ID and Member ID are required.' });
    }

    const books = await db.query('SELECT available_copies FROM books WHERE book_id = ?', [book_id]);
    if (books.length === 0) return res.status(404).json({ error: 'Book not found.' });
    if (books[0].available_copies > 0) {
      return res.status(400).json({ error: 'Book is available — borrow instead of reserving.' });
    }

    const existing = await db.query(
      "SELECT reservation_id FROM reservations WHERE book_id = ? AND member_id = ? AND status = 'pending'",
      [book_id, member_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have a pending reservation for this book.' });
    }

    const queue = await db.query(
      "SELECT COUNT(*) as position FROM reservations WHERE book_id = ? AND status = 'pending'",
      [book_id]
    );

    const result = await db.execute(
      'INSERT INTO reservations (book_id, member_id) VALUES (?, ?)',
      [book_id, member_id]
    );

    res.status(201).json({
      reservation_id: result.lastID,
      queue_position: queue[0].position + 1,
      message: 'Reservation created successfully.'
    });
  } catch (err) {
    console.error('Create reservation error:', err);
    res.status(500).json({ error: 'Failed to create reservation.' });
  }
};

// PUT /api/reservations/:id
exports.update = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be fulfilled or cancelled.' });
    }

    const result = await db.execute(
      "UPDATE reservations SET status = ? WHERE reservation_id = ? AND status = 'pending'",
      [status, req.params.id]
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Pending reservation not found.' });
    res.json({ message: 'Reservation ' + status + ' successfully.' });
  } catch (err) {
    console.error('Update reservation error:', err);
    res.status(500).json({ error: 'Failed to update reservation.' });
  }
};
