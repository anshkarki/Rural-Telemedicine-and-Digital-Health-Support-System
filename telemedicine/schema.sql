-- Rural Telemedicine and Digital Health Support System
-- MySQL Database Schema
-- All times in IST

CREATE DATABASE IF NOT EXISTS telemedicine_db;
USE telemedicine_db;

-- Users table (all roles)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient','doctor','admin') NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Doctors profile table
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  specialty VARCHAR(100),
  qualification VARCHAR(200),
  experience_years INT DEFAULT 0,
  available_days VARCHAR(200),
  consultation_fee DECIMAL(10,2) DEFAULT 500.00,
  profile_picture VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Patients profile table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  blood_group VARCHAR(10),
  medical_history TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Doctor availability slots
CREATE TABLE IF NOT EXISTS doctor_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
  start_time TIME,
  end_time TIME,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL,
  status ENUM('pending','payment_pending','confirmed','completed','cancelled') DEFAULT 'pending',
  payment_status ENUM('unpaid','paid') DEFAULT 'unpaid',
  meet_link VARCHAR(500),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Health Records
CREATE TABLE IF NOT EXISTS health_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  diagnosis TEXT,
  symptoms TEXT,
  notes TEXT,
  follow_up_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  medicines JSON,
  instructions TEXT,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Emergency Requests
CREATE TABLE IF NOT EXISTS emergencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  description TEXT,
  location VARCHAR(255),
  severity ENUM('low','medium','high','critical') DEFAULT 'medium',
  status ENUM('open','in-progress','resolved') DEFAULT 'open',
  response TEXT,
  responded_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  hospital_name VARCHAR(200),
  reason TEXT,
  record_ids JSON,
  status ENUM('pending','sent','accepted','rejected') DEFAULT 'pending',
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Issues / Health Queries
CREATE TABLE IF NOT EXISTS issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  subject VARCHAR(255),
  description TEXT,
  response TEXT,
  status ENUM('open','in-progress','closed') DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Seed default admin
INSERT IGNORE INTO users (name, email, password_hash, role, phone, address)
VALUES ('System Admin', 'admin@telemedicine.in', '$2b$10$rQnH2Pj8V6Kx1LmN3OqP4eK5dF7gH8iJ9kL0mN1oP2qR3sT4uV5wX', 'admin', '9999999999', 'Admin Office, India');
-- Default admin password: Admin@123 (hashed above is placeholder - will be set on first run)
