-- ============================================================
-- RoadReady Database Schema + Dummy Test Data
-- MySQL 8+
--
-- Usage:
--   1. Create/select the database configured in .env (DB_NAME).
--   2. Run this entire file in MySQL/phpMyAdmin.
--
-- This script creates the RoadReady tables, views, and development
-- data in dependency order.
-- ============================================================

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(120) NOT NULL,
  avatar_url      VARCHAR(500),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- VEHICLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  vin               VARCHAR(17) UNIQUE,
  nickname          VARCHAR(100),
  make              VARCHAR(60) NOT NULL,
  model             VARCHAR(60) NOT NULL,
  model_year        SMALLINT NOT NULL,
  trim              VARCHAR(60),
  engine            VARCHAR(80),
  transmission      VARCHAR(40),
  body_type         VARCHAR(40),
  current_mileage   INT NOT NULL DEFAULT 0,
  image_url         VARCHAR(500),
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- USER / VEHICLE ACCESS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_vehicles (
  user_id     INT NOT NULL,
  vehicle_id  INT NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'owner',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, vehicle_id),
  CONSTRAINT fk_uv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uv_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MAINTENANCE TYPES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_types (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  name                     VARCHAR(100) NOT NULL UNIQUE,
  default_interval_miles   INT,
  default_interval_months  INT,
  created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MAINTENANCE GUIDE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_guide_articles (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  maintenance_type_id   INT NOT NULL UNIQUE,
  title                 VARCHAR(150) NOT NULL,
  summary               VARCHAR(300),
  body_markdown         TEXT NOT NULL,
  risks_if_skipped      TEXT,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_guide_type FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- UPCOMING MAINTENANCE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_maintenance_schedule (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id            INT NOT NULL,
  maintenance_type_id   INT NOT NULL,
  due_mileage           INT,
  due_date              DATE,
  status                VARCHAR(20) NOT NULL DEFAULT 'good',
  notes                 VARCHAR(255),
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sched_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_sched_type FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id),
  INDEX idx_schedule_vehicle (vehicle_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MAINTENANCE HISTORY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_history (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id            INT NOT NULL,
  maintenance_type_id   INT NOT NULL,
  service_date          DATE NOT NULL,
  mileage_at_service    INT NOT NULL,
  cost_cents            INT NOT NULL DEFAULT 0,
  shop_name             VARCHAR(150),
  notes                 VARCHAR(500),
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_type FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id),
  INDEX idx_history_vehicle (vehicle_id),
  INDEX idx_history_date (service_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- REMINDERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  schedule_id       INT NOT NULL,
  lead_time_miles   INT,
  lead_time_days    INT,
  channel           VARCHAR(20) NOT NULL DEFAULT 'email',
  sent_at           TIMESTAMP NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rem_schedule FOREIGN KEY (schedule_id) REFERENCES vehicle_maintenance_schedule(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- VIEWS
-- DROP first so the script can be re-run against an existing DB.
-- ============================================================

DROP VIEW IF EXISTS vehicle_next_service;
CREATE VIEW vehicle_next_service AS
SELECT
  vehicle_id,
  MIN(due_mileage) AS next_due_mileage
FROM vehicle_maintenance_schedule
WHERE status != 'completed'
GROUP BY vehicle_id;

DROP VIEW IF EXISTS vehicle_maintenance_this_year;
CREATE VIEW vehicle_maintenance_this_year AS
SELECT
  vehicle_id,
  COUNT(*) AS services_completed,
  SUM(cost_cents) AS total_cost_cents
FROM maintenance_history
WHERE YEAR(service_date) = YEAR(CURDATE())
GROUP BY vehicle_id;

DROP VIEW IF EXISTS vehicle_status;
CREATE VIEW vehicle_status AS
SELECT
  vehicle_id,
  CASE
    WHEN MAX(status = 'overdue') = 1 THEN 'overdue'
    WHEN MAX(status = 'soon') = 1 THEN 'soon'
    ELSE 'good'
  END AS overall_status
FROM vehicle_maintenance_schedule
WHERE status != 'completed'
GROUP BY vehicle_id;

-- ============================================================
-- DUMMY TEST DATA
-- INSERT IGNORE keeps existing conflicting rows untouched.
-- ============================================================

INSERT IGNORE INTO users (id, email, password_hash, full_name, avatar_url) VALUES
(1, 'sam.rivera@example.com',   '$2b$10$placeholderHash.sam.rivera.000', 'Sam Rivera',   NULL),
(2, 'jamie.chen@example.com',   '$2b$10$placeholderHash.jamie.chen.001', 'Jamie Chen',   NULL),
(3, 'alicia.gomez@example.com', '$2b$10$placeholderHash.alicia.gomez.02', 'Alicia Gomez', NULL),
(4, 'marcus.webb@example.com',  '$2b$10$placeholderHash.marcus.webb.003', 'Marcus Webb',  NULL),
(5, 'priya.patel@example.com',  '$2b$10$placeholderHash.priya.patel.0004', 'Priya Patel', NULL);

INSERT IGNORE INTO vehicles
(id, vin, nickname, make, model, model_year, trim, engine, transmission, body_type, current_mileage, image_url)
VALUES
(1, '19UUA56603A012345', NULL,         'Acura',  'TL',      2003, 'Base',    '3.2L V6', 'Automatic', 'Sedan', 142850, '../images/acura-tl.png'),
(2, '2HGFC2F59JH123456', NULL,         'Honda',  'Civic',   2018, 'LX',      '2.0L I4', 'CVT',       'Sedan',  61200, NULL),
(3, '1FTFW1ET5EFA12345', 'The Hauler', 'Ford',   'F-150',   2015, 'XLT',     '5.0L V8', 'Automatic', 'Truck',  98750, NULL),
(4, '2T3P1RFV0LC123456', NULL,         'Toyota', 'RAV4',    2020, 'XLE',     '2.5L I4', 'Automatic', 'SUV',   34500, NULL),
(5, '4S4BSANC5G3123456', NULL,         'Subaru', 'Outback', 2016, 'Premium', '2.5L H4', 'CVT',       'Wagon',  88000, NULL);

INSERT IGNORE INTO user_vehicles (user_id, vehicle_id, role) VALUES
(1, 1, 'owner'),
(2, 1, 'family'),
(3, 2, 'owner'),
(4, 3, 'owner'),
(1, 4, 'owner'),
(5, 5, 'owner');

INSERT IGNORE INTO maintenance_types
(id, name, default_interval_miles, default_interval_months)
VALUES
(1, 'Oil Change',                 5000,  6),
(2, 'Tire Rotation',              7500,  6),
(3, 'Brake Inspection',           12000, 12),
(4, 'Coolant Flush',              30000, 24),
(5, 'Battery Replacement',        NULL,  48),
(6, 'Air Filter Replacement',     15000, 12),
(7, 'Transmission Fluid Service', 60000, 36),
(8, 'Spark Plug Replacement',     30000, 24);

INSERT IGNORE INTO maintenance_guide_articles
(maintenance_type_id, title, summary, body_markdown, risks_if_skipped)
VALUES
(1, 'Why Oil Changes Matter',
 'Fresh oil keeps your engine''s internal parts lubricated and cool.',
 'Engine oil lubricates moving parts, carries away heat, and picks up small metal particles created by friction. Over time it breaks down and loses these properties.',
 'Skipping oil changes leads to increased engine wear, sludge buildup, overheating, and in severe cases full engine failure.'),
(2, 'Why Tire Rotation Matters',
 'Rotating tires evens out tread wear so they last longer and grip better.',
 'Front and rear tires wear at different rates because of weight distribution, drivetrain, and steering forces. Rotating them periodically evens this out.',
 'Uneven wear shortens tire life, can affect handling and braking distance, and often voids tire warranties.'),
(3, 'Why Brake Inspections Matter',
 'Routine checks catch worn pads and low fluid before they become safety issues.',
 'Brake pads wear down gradually and brake fluid absorbs moisture over time, both of which reduce stopping power.',
 'Ignoring brake wear can lead to longer stopping distances, damaged rotors, and complete brake failure.'),
(4, 'Why Coolant Flushes Matter',
 'Old coolant loses its ability to protect the engine from overheating and corrosion.',
 'Coolant breaks down over time, becoming acidic and less effective at transferring heat, which can lead to corrosion inside the cooling system.',
 'Skipping coolant service risks overheating, radiator damage, and costly engine repairs.'),
(5, 'Why Battery Replacement Matters',
 'Batteries lose capacity with age and are a common cause of no-start situations.',
 'Car batteries typically last 3 to 5 years. Heat, cold, and short trips all accelerate capacity loss.',
 'A failing battery can strand you unexpectedly and, in some cars, cause electrical system issues.');

INSERT IGNORE INTO vehicle_maintenance_schedule
(vehicle_id, maintenance_type_id, due_mileage, due_date, status, notes)
VALUES
(1, 1, 143500, '2026-10-01', 'soon',    NULL),
(1, 2, 145000, '2026-11-15', 'good',    NULL),
(1, 3, 146000, '2026-12-20', 'good',    NULL),
(2, 1, 63000,  '2026-09-25', 'soon',    NULL),
(2, 2, 65000,  '2026-11-01', 'good',    NULL),
(3, 3, 99000,  '2026-09-10', 'overdue', 'Squeaking noticed on last drive'),
(3, 4, 105000, '2027-01-05', 'good',    NULL),
(4, 1, 37500, '2026-10-30', 'good',    NULL),
(4, 6, 40000, '2027-02-01', 'good',    NULL);

INSERT IGNORE INTO maintenance_history
(vehicle_id, maintenance_type_id, service_date, mileage_at_service, cost_cents, shop_name, notes)
VALUES
(1, 1, '2026-04-02', 140000, 4800,  'Quick Lube Express', NULL),
(1, 3, '2026-01-18', 137500, 21000, 'Downtown Auto Care', 'Replaced front pads'),
(1, 2, '2025-11-05', 135000, 3000,  'Quick Lube Express', NULL),
(1, 4, '2025-08-22', 132000, 9700,  'Downtown Auto Care', NULL),
(2, 1, '2026-06-10', 58000,  4500,  'Honda of Elizabethtown', NULL),
(2, 2, '2026-03-02', 55500,  2800,  'Honda of Elizabethtown', NULL),
(3, 1, '2026-05-28', 95500,  6200,  'Marcus''s Home Garage', 'Used synthetic blend'),
(3, 5, '2025-12-01', 92000,  15900, 'AutoZone', NULL),
(4, 1, '2026-07-14', 32000,  5500,  'Toyota Certified Service', NULL);

INSERT IGNORE INTO reminders
(user_id, schedule_id, lead_time_miles, lead_time_days, channel, sent_at)
VALUES
(1, 1, 500,  NULL, 'email', NULL),
(1, 4, NULL, 14,   'email', NULL),
(3, 4, 300,  NULL, 'email', '2026-09-01 08:00:00');

-- ============================================================
-- END OF ROADREADY DATABASE SETUP
-- ============================================================
