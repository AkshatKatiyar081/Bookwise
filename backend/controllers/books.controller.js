const db = require('../db');

// GET /api/books — list all (with search)
exports.getAll = async (req, res) => {
  try {
    const search = req.query.q;
    let sqlQuery = 'SELECT * FROM books';
    let params = [];

    if (search) {
      sqlQuery += ' WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? OR genre LIKE ?';
      const term = '%' + search + '%';
      params = [term, term, term, term];
    }
    sqlQuery += ' ORDER BY title ASC';

    const rows = await db.query(sqlQuery, params);
    res.json(rows);
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ error: 'Failed to fetch books.' });
  }
};

// GET /api/books/:id
exports.getById = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM books WHERE book_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found.' });

    const history = await db.query(
      `SELECT br.*, m.name as member_name 
       FROM borrow_records br 
       JOIN members m ON br.member_id = m.member_id 
       WHERE br.book_id = ? 
       ORDER BY br.borrow_date DESC`,
      [req.params.id]
    );

    res.json({ ...rows[0], borrow_history: history });
  } catch (err) {
    console.error('Get book error:', err);
    res.status(500).json({ error: 'Failed to fetch book.' });
  }
};

// POST /api/books
exports.create = async (req, res) => {
  try {
    const { title, author, isbn, genre, publisher, published_year, total_copies, shelf_location, cover_image } = req.body;
    if (!title || !author || !isbn) {
      return res.status(400).json({ error: 'Title, author, and ISBN are required.' });
    }

    const copies = total_copies || 1;
    const result = await db.execute(
      `INSERT INTO books (title, author, isbn, genre, publisher, published_year, total_copies, available_copies, shelf_location, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, isbn, genre || null, publisher || null, published_year || null, copies, copies, shelf_location || null, cover_image || null]
    );

    res.status(201).json({ book_id: result.lastID, message: 'Book added successfully.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A book with this ISBN already exists.' });
    }
    console.error('Create book error:', err);
    res.status(500).json({ error: 'Failed to add book.' });
  }
};

// PUT /api/books/:id
exports.update = async (req, res) => {
  try {
    const { title, author, isbn, genre, publisher, published_year, total_copies, available_copies, shelf_location, cover_image } = req.body;
    const result = await db.execute(
      `UPDATE books SET title=?, author=?, isbn=?, genre=?, publisher=?, published_year=?, 
       total_copies=?, available_copies=?, shelf_location=?, cover_image=? WHERE book_id=?`,
      [title, author, isbn, genre, publisher, published_year, total_copies, available_copies, shelf_location, cover_image, req.params.id]
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book updated successfully.' });
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ error: 'Failed to update book.' });
  }
};

// DELETE /api/books/:id
exports.remove = async (req, res) => {
  try {
    const active = await db.query(
      "SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND status = 'borrowed'",
      [req.params.id]
    );
    if (active[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active borrows.' });
    }

    const result = await db.execute('DELETE FROM books WHERE book_id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book deleted successfully.' });
  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({ error: 'Failed to delete book.' });
  }
};
