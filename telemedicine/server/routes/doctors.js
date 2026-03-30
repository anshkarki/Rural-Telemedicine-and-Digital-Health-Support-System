const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const auth = require('../middleware/auth');

// Get all doctors (public - for booking)
router.get('/', auth(['patient','doctor','admin']), async (req, res) => {
  try {
    const { specialty, name } = req.query;
    let query = `
      SELECT d.id, d.specialty, d.qualification, d.experience_years, d.consultation_fee, d.available_days,
             u.name, u.email, u.phone
      FROM doctors d JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (specialty) { query += ' AND d.specialty LIKE ?'; params.push(`%${specialty}%`); }
    if (name) { query += ' AND u.name LIKE ?'; params.push(`%${name}%`); }
    const [doctors] = await db.execute(query, params);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor by ID with availability
router.get('/:id', auth(['patient','doctor','admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, u.name, u.email, u.phone
      FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
    
    const [avail] = await db.execute('SELECT * FROM doctor_availability WHERE doctor_id = ?', [req.params.id]);
    rows[0].availability = avail;
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Add new doctor
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const { name, email, password, phone, address, specialty, qualification, experience_years, consultation_fee, available_days } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, "doctor", ?, ?)',
      [name, email, hash, phone || null, address || null]
    );

    await db.execute(
      'INSERT INTO doctors (user_id, specialty, qualification, experience_years, consultation_fee, available_days) VALUES (?, ?, ?, ?, ?, ?)',
      [userResult.insertId, specialty || null, qualification || null, experience_years || 0, consultation_fee || 500, available_days || null]
    );

    res.status(201).json({ message: 'Doctor added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Update doctor
router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const { specialty, qualification, experience_years, consultation_fee, available_days } = req.body;
    await db.execute(
      'UPDATE doctors SET specialty=?, qualification=?, experience_years=?, consultation_fee=?, available_days=? WHERE id=?',
      [specialty, qualification, experience_years, consultation_fee, available_days, req.params.id]
    );
    res.json({ message: 'Doctor updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Deactivate doctor (delete user)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const [doc] = await db.execute('SELECT user_id FROM doctors WHERE id = ?', [req.params.id]);
    if (doc.length === 0) return res.status(404).json({ error: 'Doctor not found' });
    await db.execute('DELETE FROM users WHERE id = ?', [doc[0].user_id]);
    res.json({ message: 'Doctor removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Doctor: Set availability
router.post('/:id/availability', auth(['doctor','admin']), async (req, res) => {
  try {
    const { slots } = req.body; // array of {day_of_week, start_time, end_time}
    await db.execute('DELETE FROM doctor_availability WHERE doctor_id = ?', [req.params.id]);
    for (const slot of slots) {
      await db.execute(
        'INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)',
        [req.params.id, slot.day_of_week, slot.start_time, slot.end_time]
      );
    }
    res.json({ message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor dashboard stats
router.get('/:id/stats', auth(['doctor']), async (req, res) => {
  try {
    const doctorId = req.params.id;
    const today = new Date().toISOString().split('T')[0];
    
    const [[todayAppts]] = await db.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE doctor_id=? AND appointment_date=? AND status != "cancelled"',
      [doctorId, today]
    );
    const [[totalPatients]] = await db.execute(
      'SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id=?', [doctorId]
    );
    const [[pending]] = await db.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE doctor_id=? AND status="pending"', [doctorId]
    );
    const [[emergencies]] = await db.execute(
      'SELECT COUNT(*) as count FROM emergencies WHERE status="open"', []
    );
    
    res.json({ todayAppts: todayAppts.count, totalPatients: totalPatients.count, pending: pending.count, emergencies: emergencies.count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
