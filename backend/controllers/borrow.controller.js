const db = require('../db');

// GET /api/borrow — list all borrow records
exports.getAll = async (req, res) => {
  try {
    let sqlQuery = `SELECT br.*, b.title, b.author, m.name as member_name
                 FROM borrow_records br
                 JOIN books b ON br.book_id = b.book_id
                 JOIN members m ON br.member_id = m.member_id`;
    let params = [];

    if (req.query.status) {
      sqlQuery += ' WHERE br.status = ?';
      params.push(req.query.status);
    }

    if (req.query.member_id) {
      sqlQuery += params.length ? ' AND' : ' WHERE';
      sqlQuery += ' br.member_id = ?';
      params.push(req.query.member_id);
    }

    sqlQuery += ' ORDER BY br.borrow_date DESC';
    const rows = await db.query(sqlQuery, params);
    res.json(rows);
  } catch (err) {
    console.error('Get borrow records error:', err);
    res.status(500).json({ error: 'Failed to fetch borrow records.' });
  }
};

// POST /api/borrow — issue a book
exports.issueBook = async (req, res) => {
  const sqliteDb = await db.getDb();
  try {
    const { book_id, member_id, due_date } = req.body;
    if (!book_id || !member_id) {
      return res.status(400).json({ error: 'Book ID and Member ID are required.' });
    }

    await sqliteDb.run('BEGIN TRANSACTION');

    const books = await sqliteDb.all('SELECT available_copies FROM books WHERE book_id = ?', [book_id]);

    if (books.length === 0) {
      await sqliteDb.run('ROLLBACK');
      return res.status(404).json({ error: 'Book not found.' });
    }
    if (books[0].available_copies <= 0) {
      await sqliteDb.run('ROLLBACK');
      return res.status(400).json({ error: 'No copies available. Member can reserve instead.' });
    }

    const existing = await sqliteDb.all(
      "SELECT record_id FROM borrow_records WHERE book_id = ? AND member_id = ? AND status = 'borrowed'",
      [book_id, member_id]
    );

    if (existing.length > 0) {
      await sqliteDb.run('ROLLBACK');
      return res.status(400).json({ error: 'Member already has this book borrowed.' });
    }

    const dueDate = due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await sqliteDb.run(
      'INSERT INTO borrow_records (book_id, member_id, due_date) VALUES (?, ?, ?)',
      [book_id, member_id, dueDate]
    );

    await sqliteDb.run('UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?', [book_id]);

    await sqliteDb.run('COMMIT');
    res.status(201).json({ record_id: result.lastID, message: 'Book issued successfully.' });
  } catch (err) {
    try { await sqliteDb.run('ROLLBACK'); } catch(e) {}
    console.error('Issue book error:', err);
    res.status(500).json({ error: 'Failed to issue book.' });
  }
};

// PUT /api/borrow/:id/return — return a book
exports.returnBook = async (req, res) => {
  const sqliteDb = await db.getDb();
  try {
    await sqliteDb.run('BEGIN TRANSACTION');

    const records = await sqliteDb.all(
      "SELECT * FROM borrow_records WHERE record_id = ? AND status IN ('borrowed', 'overdue')",
      [req.params.id]
    );

    if (records.length === 0) {
      await sqliteDb.run('ROLLBACK');
      return res.status(404).json({ error: 'Active borrow record not found.' });
    }

    const record = records[0];
    const returnDate = new Date();
    const dueDate = new Date(record.due_date);
    let fineAmount = 0;

    if (returnDate > dueDate) {
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 2;
    }

    const returnDateStr = returnDate.toISOString().split('T')[0];

    await sqliteDb.run(
      "UPDATE borrow_records SET return_date = ?, status = 'returned', fine_amount = ? WHERE record_id = ?",
      [returnDateStr, fineAmount, req.params.id]
    );

    await sqliteDb.run('UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ?', [record.book_id]);

    if (fineAmount > 0) {
      await sqliteDb.run(
        'INSERT INTO fines (record_id, member_id, amount) VALUES (?, ?, ?)',
        [req.params.id, record.member_id, fineAmount]
      );
    }

    const reservations = await sqliteDb.all(
      "SELECT * FROM reservations WHERE book_id = ? AND status = 'pending' ORDER BY reservation_date ASC LIMIT 1",
      [record.book_id]
    );

    await sqliteDb.run('COMMIT');

    res.json({
      message: 'Book returned successfully.',
      fine_amount: fineAmount,
      days_overdue: fineAmount > 0 ? fineAmount / 2 : 0,
      pending_reservation: reservations.length > 0 ? reservations[0] : null
    });
  } catch (err) {
    try { await sqliteDb.run('ROLLBACK'); } catch(e) {}
    console.error('Return book error:', err);
    res.status(500).json({ error: 'Failed to return book.' });
  }
};
