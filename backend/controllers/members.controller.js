const db = require('../db');
const bcrypt = require('bcryptjs');

// GET /api/members
exports.getAll = async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT member_id, name, email, phone, address, membership_date, membership_type, status FROM members ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
};

// GET /api/members/:id
exports.getById = async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT member_id, name, email, phone, address, membership_date, membership_type, status FROM members WHERE member_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Member not found.' });

    const borrows = await db.query(
      `SELECT br.*, b.title, b.author FROM borrow_records br
       JOIN books b ON br.book_id = b.book_id
       WHERE br.member_id = ? ORDER BY br.borrow_date DESC`,
      [req.params.id]
    );

    const fines = await db.query(
      `SELECT f.*, b.title FROM fines f
       JOIN borrow_records br ON f.record_id = br.record_id
       JOIN books b ON br.book_id = b.book_id
       WHERE f.member_id = ?`,
      [req.params.id]
    );

    res.json({ ...rows[0], borrows, fines });
  } catch (err) {
    console.error('Get member error:', err);
    res.status(500).json({ error: 'Failed to fetch member.' });
  }
};

// POST /api/members
exports.create = async (req, res) => {
  try {
    const { name, email, phone, address, membership_type, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.execute(
      'INSERT INTO members (name, email, phone, address, membership_type, password) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, address || null, membership_type || 'student', hashedPassword]
    );

    res.status(201).json({ member_id: result.lastID, message: 'Member created successfully.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Failed to create member.' });
  }
};

// PUT /api/members/:id
exports.update = async (req, res) => {
  try {
    const { name, email, phone, address, membership_type, status } = req.body;
    const result = await db.execute(
      'UPDATE members SET name=?, email=?, phone=?, address=?, membership_type=?, status=? WHERE member_id=?',
      [name, email, phone, address, membership_type, status, req.params.id]
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Member not found.' });
    res.json({ message: 'Member updated successfully.' });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Failed to update member.' });
  }
};

// DELETE /api/members/:id
exports.remove = async (req, res) => {
  try {
    const active = await db.query(
      "SELECT COUNT(*) as count FROM borrow_records WHERE member_id = ? AND status = 'borrowed'",
      [req.params.id]
    );
    if (active[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete member with active borrows.' });
    }

    const result = await db.execute('DELETE FROM members WHERE member_id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Member not found.' });
    res.json({ message: 'Member deleted successfully.' });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Failed to delete member.' });
  }
};
