const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Patient: Get my appointments
router.get('/my', auth(['patient']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.*, u.name as doctor_name, d.specialty
      FROM appointments a
      JOIN doctors doc ON a.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.time_slot
    `, [req.user.profileId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Doctor: Get my schedule
router.get('/schedule', auth(['doctor']), async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT a.*, u.name as patient_name, p.gender, p.blood_group, p.date_of_birth
      FROM appointments a
      JOIN patients pat ON a.patient_id = pat.id
      JOIN users u ON pat.user_id = u.id
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ?
    `;
    const params = [req.user.profileId];
    if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }
    query += ' ORDER BY a.appointment_date DESC, a.time_slot';
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Book appointment (patient)
router.post('/', auth(['patient']), async (req, res) => {
  try {
    const { doctor_id, appointment_date, time_slot } = req.body;
    if (!doctor_id || !appointment_date || !time_slot) return res.status(400).json({ error: 'All fields required' });

    // Check double booking
    const [existing] = await db.execute(
      'SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND time_slot=? AND status NOT IN ("cancelled")',
      [doctor_id, appointment_date, time_slot]
    );
    if (existing.length > 0) return res.status(409).json({ error: 'This time slot is already booked' });

    const [result] = await db.execute(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status, payment_status) VALUES (?,?,?,?,"payment_pending","unpaid")',
      [req.user.profileId, doctor_id, appointment_date, time_slot]
    );

    res.status(201).json({ message: 'Appointment booked. Please complete payment.', appointmentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Patient: Simulate payment
router.post('/:id/pay', auth(['patient']), async (req, res) => {
  try {
    const [appt] = await db.execute('SELECT * FROM appointments WHERE id=? AND patient_id=?', [req.params.id, req.user.profileId]);
    if (appt.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    if (appt[0].payment_status === 'paid') return res.status(400).json({ error: 'Already paid' });
    
    await db.execute('UPDATE appointments SET payment_status="paid", status="confirmed" WHERE id=?', [req.params.id]);
    res.json({ message: 'Payment successful. Appointment confirmed. Doctor will share Meet link shortly.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Doctor: Send Google Meet link
router.post('/:id/meet-link', auth(['doctor']), async (req, res) => {
  try {
    const { meet_link } = req.body;
    if (!meet_link) return res.status(400).json({ error: 'Meet link required' });
    
    const [appt] = await db.execute('SELECT * FROM appointments WHERE id=? AND doctor_id=?', [req.params.id, req.user.profileId]);
    if (appt.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    if (appt[0].payment_status !== 'paid') return res.status(400).json({ error: 'Payment not confirmed yet' });
    
    await db.execute('UPDATE appointments SET meet_link=? WHERE id=?', [meet_link, req.params.id]);
    res.json({ message: 'Meet link sent to patient successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment status
router.patch('/:id/status', auth(['doctor','admin']), async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE appointments SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel appointment (patient)
router.patch('/:id/cancel', auth(['patient']), async (req, res) => {
  try {
    const [appt] = await db.execute('SELECT * FROM appointments WHERE id=? AND patient_id=?', [req.params.id, req.user.profileId]);
    if (appt.length === 0) return res.status(404).json({ error: 'Not found' });
    if (['completed','cancelled'].includes(appt[0].status)) return res.status(400).json({ error: 'Cannot cancel this appointment' });
    await db.execute('UPDATE appointments SET status="cancelled" WHERE id=?', [req.params.id]);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: All appointments
router.get('/all', auth(['admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.*, 
             pu.name as patient_name, 
             du.name as doctor_name,
             d.specialty
      FROM appointments a
      JOIN patients pat ON a.patient_id = pat.id
      JOIN users pu ON pat.user_id = pu.id
      JOIN doctors doc ON a.doctor_id = doc.id
      JOIN users du ON doc.user_id = du.id
      JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get booked slots for a doctor on a date
router.get('/slots/:doctorId', auth(['patient']), async (req, res) => {
  try {
    const { date } = req.query;
    const [rows] = await db.execute(
      'SELECT time_slot FROM appointments WHERE doctor_id=? AND appointment_date=? AND status NOT IN ("cancelled")',
      [req.params.doctorId, date]
    );
    res.json(rows.map(r => r.time_slot));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
