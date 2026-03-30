const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

// Patient Register
router.post('/register/patient', async (req, res) => {
  try {
    const { name, email, password, phone, address, date_of_birth, gender, blood_group, medical_history } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, "patient", ?, ?)',
      [name, email, hash, phone || null, address || null]
    );
    const userId = userResult.insertId;

    await db.execute(
      'INSERT INTO patients (user_id, date_of_birth, gender, blood_group, medical_history) VALUES (?, ?, ?, ?, ?)',
      [userId, date_of_birth || null, gender || null, blood_group || null, medical_history || null]
    );

    res.status(201).json({ message: 'Patient registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Universal Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Email, password, role required' });

    const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(401).json({ error: 'Invalid credentials' });

    // Get profile id
    let profileId = null;
    if (role === 'patient') {
      const [p] = await db.execute('SELECT id FROM patients WHERE user_id = ?', [user.id]);
      if (p.length > 0) profileId = p[0].id;
    } else if (role === 'doctor') {
      const [d] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      if (d.length > 0) profileId = d[0].id;
    }

    const token = jwt.sign(
      { userId: user.id, profileId, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, profileId, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', auth(), async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?', [req.user.userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
