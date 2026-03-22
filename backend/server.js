require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Initialize SQLite connection
db.getDb().catch(err => {
  console.error('Failed to initialize database:', err);
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/books', require('./routes/books.routes'));
app.use('/api/members', require('./routes/members.routes'));
app.use('/api/borrow', require('./routes/borrow.routes'));
app.use('/api/reservations', require('./routes/reservations.routes'));
app.use('/api/fines', require('./routes/fines.routes'));

// Dashboard stats endpoint
const { verifyToken } = require('./middleware/auth.middleware');
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const totalBooks = await db.query('SELECT COUNT(*) as count FROM books');
    const totalMembers = await db.query('SELECT COUNT(*) as count FROM members');
    const borrowed = await db.query("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed'");

    // Auto-mark overdue records (SQLite CURRENT_DATE)
    await db.execute("UPDATE borrow_records SET status = 'overdue' WHERE status = 'borrowed' AND due_date < CURRENT_DATE");

    const overdueUpdated = await db.query("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'overdue'");
    
    // SQLite IFNULL instead of ISNULL
    const finesCollected = await db.query('SELECT IFNULL(SUM(amount), 0) as total FROM fines WHERE paid = 1');
    const finesOutstanding = await db.query('SELECT IFNULL(SUM(amount), 0) as total FROM fines WHERE paid = 0');

    // Recent activity (SQLite LIMIT 10)
    const recentActivity = await db.query(
      `SELECT br.*, b.title, m.name as member_name
       FROM borrow_records br
       JOIN books b ON br.book_id = b.book_id
       JOIN members m ON br.member_id = m.member_id
       ORDER BY br.borrow_date DESC
       LIMIT 10`
    );

    res.json({
      total_books: totalBooks[0].count,
      total_members: totalMembers[0].count,
      currently_borrowed: borrowed[0].count,
      overdue_books: overdueUpdated[0].count,
      fines_collected: finesCollected[0].total,
      fines_outstanding: finesOutstanding[0].total,
      recent_activity: recentActivity
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('\n📚 Bookwise Library Server running at http://localhost:' + PORT + '\n');
});
