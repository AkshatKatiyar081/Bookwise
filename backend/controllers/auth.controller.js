const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check admins
    const admins = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admins.length > 0) {
      const admin = admins[0];
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

      const token = jwt.sign(
        { id: admin.admin_id, role: admin.role, email: admin.email, name: admin.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token, user: { id: admin.admin_id, name: admin.name, email: admin.email, role: admin.role } });
    }

    // Check members
    const members = await db.query('SELECT * FROM members WHERE email = ?', [email]);
    if (members.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const member = members[0];
    if (member.status !== 'active') {
      return res.status(403).json({ error: 'Your account is ' + member.status + '.' });
    }

    const valid = await bcrypt.compare(password, member.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: member.member_id, role: 'member', email: member.email, name: member.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, user: { id: member.member_id, name: member.name, email: member.email, role: 'member' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, address, membership_type, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingMembers = await db.query('SELECT member_id FROM members WHERE email = ?', [email]);
    const existingAdmins = await db.query('SELECT admin_id FROM admins WHERE email = ?', [email]);
    if (existingMembers.length > 0 || existingAdmins.length > 0) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.execute(
      'INSERT INTO members (name, email, phone, address, membership_type, password) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, address || null, membership_type || 'student', hashedPassword]
    );

    const token = jwt.sign(
      { id: result.lastID, role: 'member', email, name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: result.lastID, name, email, role: 'member' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};
