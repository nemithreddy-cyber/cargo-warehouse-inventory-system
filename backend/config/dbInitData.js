const SCHEMA_SQL = `
-- ============================================================
-- Cargo Warehouse Inventory System — Database Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT  NOT NULL,
  email       TEXT  NOT NULL UNIQUE,
  password    TEXT  NOT NULL,
  role        TEXT NOT NULL DEFAULT 'Warehouse Staff',
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouse_zones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_name   TEXT   NOT NULL UNIQUE,
  capacity    INTEGER   NOT NULL DEFAULT 0,
  occupied    INTEGER   NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_locations (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id        INTEGER   NOT NULL,
  location_code  TEXT    NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'Available',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES warehouse_zones (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cargo (
  id                  INTEGER   PRIMARY KEY AUTOINCREMENT,
  cargo_id            TEXT    NOT NULL UNIQUE,
  customer_name       TEXT   NOT NULL,
  customer_phone      TEXT   NOT NULL,
  cargo_type          TEXT    NOT NULL,
  origin_airport      TEXT    NOT NULL,
  destination_airport TEXT    NOT NULL,
  pickup_city         TEXT   NOT NULL,
  package_count       INTEGER   NOT NULL DEFAULT 1,
  weight              REAL  NOT NULL,
  length              REAL  NOT NULL,
  width               REAL  NOT NULL,
  height              REAL  NOT NULL,
  chargeable_weight   REAL  NOT NULL DEFAULT 0.00,
  billing_weight      REAL  NOT NULL DEFAULT 0.00,
  arrival_date        DATE           NULL,
  dispatch_date       DATE           NULL,
  zone_id             INTEGER   NULL,
  location_id         INTEGER   NULL,
  status              TEXT NOT NULL DEFAULT 'Received',
  created_by          INTEGER   NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id)     REFERENCES warehouse_zones (id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES storage_locations (id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dispatch_records (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id       TEXT    NOT NULL UNIQUE,
  cargo_id          INTEGER   NOT NULL,
  driver_name       TEXT   NOT NULL,
  vehicle_number    TEXT    NOT NULL,
  dispatch_date     DATE           NOT NULL,
  expected_delivery DATE           NOT NULL,
  actual_delivery   DATE           NULL,
  status            TEXT NOT NULL DEFAULT 'Scheduled',
  created_by        INTEGER   NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id)   REFERENCES cargo (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS partner_agents (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_name     TEXT  NOT NULL,
  location       TEXT  NOT NULL,
  contact_number TEXT   NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Active',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS airline_rates (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  airline_name   TEXT  NOT NULL,
  origin         TEXT   NOT NULL,
  destination    TEXT   NOT NULL,
  rate_per_kg    REAL NOT NULL,
  transit_days   INTEGER  NOT NULL DEFAULT 2,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotations (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id       TEXT    NOT NULL UNIQUE,
  customer_name  TEXT   NOT NULL,
  weight         REAL  NOT NULL,
  cargo_type     TEXT    NOT NULL,
  origin         TEXT    NOT NULL,
  destination    TEXT    NOT NULL,
  rate_per_kg    REAL  NOT NULL,
  extra_charges  REAL  NOT NULL DEFAULT 0.00,
  total_charge   REAL  NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Pending',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS awb_records (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  awb_number           TEXT    NOT NULL UNIQUE,
  cargo_id             INTEGER   NOT NULL,
  shipper_name         TEXT    NOT NULL,
  shipper_address      TEXT    NOT NULL,
  consignee_name       TEXT    NOT NULL,
  consignee_address    TEXT    NOT NULL,
  origin_airport       TEXT    NOT NULL,
  destination_airport  TEXT    NOT NULL,
  cargo_description    TEXT    NOT NULL,
  pieces               INTEGER   NOT NULL DEFAULT 1,
  actual_weight        REAL  NOT NULL,
  chargeable_weight    REAL  NOT NULL,
  declared_value       REAL  NOT NULL DEFAULT 0.00,
  special_instructions TEXT           NULL,
  issue_date           DATE           NOT NULL,
  status               TEXT NOT NULL DEFAULT 'draft',
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT   NOT NULL UNIQUE,
  cargo_id       INTEGER  NOT NULL,
  customer_name  TEXT  NOT NULL,
  amount         REAL NOT NULL,
  tax            REAL NOT NULL,
  total          REAL NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Unpaid',
  due_date       DATE          NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id   TEXT   NOT NULL UNIQUE,
  invoice_id       INTEGER  NOT NULL,
  amount           REAL NOT NULL,
  payment_method   TEXT   NOT NULL,
  status           TEXT NOT NULL DEFAULT 'Success',
  transaction_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaints (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id   TEXT   NOT NULL UNIQUE,
  customer_name  TEXT  NOT NULL,
  subject        TEXT  NOT NULL,
  description    TEXT          NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Open',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id       TEXT   NOT NULL UNIQUE,
  cargo_id       INTEGER  NOT NULL,
  amount         REAL NOT NULL,
  description    TEXT          NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Submitted',
  document_url   TEXT  NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customs_checklists (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  cargo_id       INTEGER  NOT NULL,
  document_type  TEXT  NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Pending',
  verified_by    TEXT  NULL,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS route_options (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  cargo_id       INTEGER  NOT NULL,
  routes_json    TEXT          NOT NULL,
  selected_route TEXT  NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cargo_status   ON cargo (status);
CREATE INDEX IF NOT EXISTS idx_cargo_zone     ON cargo (zone_id);
CREATE INDEX IF NOT EXISTS idx_cargo_cargo_id ON cargo (cargo_id);
CREATE INDEX IF NOT EXISTS idx_dr_cargo_id    ON dispatch_records (cargo_id);
CREATE INDEX IF NOT EXISTS idx_awb_cargo_id   ON awb_records (cargo_id);
CREATE INDEX IF NOT EXISTS idx_inv_cargo_id   ON invoices (cargo_id);
CREATE INDEX IF NOT EXISTS idx_cc_cargo_id    ON customs_checklists (cargo_id);

CREATE TABLE IF NOT EXISTS weight_calculations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  cargo_id          TEXT    NULL,
  description       TEXT           NOT NULL,
  pieces            INTEGER   NOT NULL DEFAULT 1,
  actual_weight     REAL  NOT NULL,
  volumetric_weight REAL  NOT NULL,
  chargeable_weight REAL  NOT NULL,
  length_cm         REAL  NOT NULL,
  width_cm          REAL  NOT NULL,
  height_cm         REAL  NOT NULL,
  rate_per_kg       REAL  NOT NULL DEFAULT 0.00,
  freight_cost      REAL  NOT NULL DEFAULT 0.00,
  calculated_by     INTEGER   NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (calculated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pickup_schedules (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id            TEXT    NOT NULL UNIQUE,
  cargo_id               INTEGER   NOT NULL,
  customer_name          TEXT   NOT NULL,
  pickup_type            TEXT NOT NULL,
  location               TEXT   NOT NULL,
  customer_address       TEXT           NULL,
  scheduled_date         DATE           NOT NULL,
  scheduled_time         TEXT    NOT NULL,
  assigned_driver        TEXT   NOT NULL,
  vehicle_number         TEXT    NOT NULL,
  contact_number         TEXT    NOT NULL,
  notes                  TEXT           NULL,
  status                 TEXT NOT NULL DEFAULT 'scheduled',
  actual_completion_time DATETIME       NULL,
  driver_notes           TEXT           NULL,
  proof_of_delivery      TEXT           NULL,
  created_by             INTEGER   NULL,
  created_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wc_cargo_id ON weight_calculations (cargo_id);
CREATE INDEX IF NOT EXISTS idx_pkp_cargo_id ON pickup_schedules (cargo_id);
CREATE INDEX IF NOT EXISTS idx_pkp_schedule_id ON pickup_schedules (schedule_id);
`;

const SEED_SQL = `
INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES
  (1, 'Super Admin',            'admin@cargowarehouse.com',   '$2a$12$NrymNyzzI2yMDZBQEvfzW.v4nJvDWM9gVq6MbEzVxG8kPv7jqfEgW', 'Super Admin');

INSERT OR IGNORE INTO warehouse_zones (id, zone_name, capacity, occupied) VALUES
  (1, 'Zone A - General Cargo',   100, 42),
  (2, 'Zone B - Fragile Items',    50, 15),
  (3, 'Zone C - Cold Storage',     30,  8),
  (4, 'Zone D - Hazmat',           20,  3),
  (5, 'Zone E - Oversized',        40, 10);

INSERT OR IGNORE INTO storage_locations (id, zone_id, location_code, status) VALUES
  (1, 1, 'Slot A-01, Bin 01', 'Occupied'),
  (2, 1, 'Slot A-02, Bin 02', 'Occupied'),
  (3, 1, 'Slot A-03, Bin 03', 'Occupied'),
  (4, 1, 'Slot A-04, Bin 04', 'Available'),
  (5, 1, 'Slot A-05, Bin 05', 'Reserved'),
  (6, 2, 'Slot B-01, Bin 01', 'Occupied'),
  (7, 2, 'Slot B-02, Bin 02', 'Available'),
  (8, 2, 'Slot B-03, Bin 03', 'Available'),
  (9, 3, 'Slot C-01, Bin 01', 'Occupied'),
  (10, 3, 'Slot C-02, Bin 02', 'Available'),
  (11, 4, 'Slot D-01, Bin 01', 'Occupied'),
  (12, 4, 'Slot D-02, Bin 02', 'Available'),
  (13, 5, 'Slot E-12, Bin 04', 'Occupied'),
  (14, 5, 'Slot E-15, Bin 01', 'Occupied');

INSERT OR IGNORE INTO cargo
  (id, cargo_id, customer_name, customer_phone, cargo_type, origin_airport, destination_airport,
   pickup_city, package_count, weight, length, width, height, chargeable_weight, billing_weight,
   arrival_date, status, zone_id, location_id, created_by)
VALUES
  (1, 'CRG-20260001', 'Raj Enterprises',    '+91-9876543210', 'Electronics',    'BOM', 'DEL', 'Mumbai',    3,  45.00, 60.0, 40.0, 30.0, 12.00, 45.00, '2026-06-01', 'Stored',             1, 1, 1),
  (2, 'CRG-20260002', 'Global Traders',     '+91-9123456780', 'Pharmaceuticals','MAA', 'BLR', 'Chennai',   5,  30.00, 50.0, 35.0, 25.0,  7.29, 30.00, '2026-06-02', 'Stored',             2, 6, 1),
  (3, 'CRG-20260003', 'Swift Logistics',    '+91-9988776655', 'Textiles',       'DEL', 'HYD', 'Delhi',     2,  18.00, 80.0, 60.0, 40.0, 32.00, 32.00, '2026-06-03', 'Ready For Dispatch', 1, 2, 1),
  (4, 'CRG-20260004', 'Ocean Freight Co',   '+91-9090909090', 'Machinery',      'CCU', 'BOM', 'Kolkata',   1, 150.00,100.0, 80.0, 70.0, 93.33,150.00, '2026-06-04', 'Dispatched',         5, 13, 1),
  (5, 'CRG-20260005', 'Prime Exports',      '+91-9871234560', 'Perishables',    'BLR', 'MAA', 'Bengaluru', 4,  25.00, 40.0, 30.0, 20.0,  4.00, 25.00, '2026-06-05', 'Delivered',          3, 9, 1),
  (6, 'CRG-20260006', 'Ace Supplies',       '+91-9000011111', 'Chemicals',      'HYD', 'CCU', 'Hyderabad', 2,  55.00, 60.0, 50.0, 40.0, 20.00, 55.00, '2026-06-06', 'Received',           NULL, NULL, 1),
  (7, 'CRG-20260007', 'Northern Goods',     '+91-9555566666', 'Electronics',    'AMD', 'DEL', 'Ahmedabad', 6,  70.00, 70.0, 50.0, 35.0, 20.42, 70.00, '2026-06-07', 'Stored',             1, 3, 1),
  (8, 'CRG-20260008', 'FastTrack Imports',  '+91-9111122222', 'Auto Parts',     'PNQ', 'BOM', 'Pune',      1,  90.00, 90.0, 70.0, 60.0, 63.00, 90.00, '2026-06-08', 'Ready For Dispatch', 5, 14, 1);

INSERT OR IGNORE INTO dispatch_records
  (id, dispatch_id, cargo_id, driver_name, vehicle_number, dispatch_date, expected_delivery, status, created_by)
VALUES
  (1, 'DSP-20260001', 4, 'Ravi Kumar',   'MH-12-AB-1234', '2026-06-05', '2026-06-08', 'In Transit', 1),
  (2, 'DSP-20260002', 5, 'Suresh Babu',  'TN-09-CD-5678', '2026-06-06', '2026-06-09', 'Delivered',  1),
  (3, 'DSP-20260003', 3, 'Deepak Singh', 'DL-01-EF-9012', '2026-06-10', '2026-06-13', 'Scheduled',  1);

INSERT OR IGNORE INTO partner_agents (id, agent_name, location, contact_number, status) VALUES
  (1, 'Emirates Cargo Agent', 'Dubai',   '+971-4-1111111', 'Active'),
  (2, 'DHL Aviation Agent',    'Muscat',  '+968-24-222222', 'Active'),
  (3, 'Gulf Air Cargo Agent',   'Manama',  '+973-17-333333', 'Active');

INSERT OR IGNORE INTO airline_rates (id, airline_name, origin, destination, rate_per_kg, transit_days) VALUES
  (1, 'Emirates SkyCargo',     'BOM', 'DEL', 2.50, 1),
  (2, 'Qatar Airways Cargo',   'MAA', 'BLR', 1.80, 2),
  (3, 'Gulf Air Cargo',         'DEL', 'HYD', 1.45, 2),
  (4, 'Air India Cargo',        'BOM', 'DEL', 2.10, 1),
  (5, 'DHL Aviation',           'HYD', 'CCU', 3.10, 1);

INSERT OR IGNORE INTO quotations (id, quote_id, customer_name, weight, cargo_type, origin, destination, rate_per_kg, extra_charges, total_charge, status) VALUES
  (1, 'QT-20260001', 'Raj Enterprises',    45.00, 'Electronics',     'BOM', 'DEL', 2.50, 15.00, 127.50, 'Approved'),
  (2, 'QT-20260002', 'Global Traders',     30.00, 'Pharmaceuticals', 'MAA', 'BLR', 1.80, 10.00, 64.00,  'Pending'),
  (3, 'QT-20260003', 'Swift Logistics',    18.00, 'Textiles',        'DEL', 'HYD', 1.45,  0.00, 26.10,  'Pending');

INSERT OR IGNORE INTO awb_records (id, awb_number, cargo_id, shipper_name, shipper_address, consignee_name, consignee_address, origin_airport, destination_airport, cargo_description, pieces, actual_weight, chargeable_weight, declared_value, special_instructions, issue_date, status) VALUES
  (1, 'AWB-2026-00001', 1, 'Raj Enterprises', 'Mumbai Warehouse Slot A-01', 'Raj Delhi Warehouse', 'DEL Airport Gate 4', 'BOM', 'DEL', 'Electronics', 3, 45.00, 45.00, 5000.00, 'Keep dry', '2026-06-01', 'issued'),
  (2, 'AWB-2026-00002', 2, 'Global Traders', 'Chennai Warehouse Slot B-01', 'Global Bangalore Warehouse', 'BLR Airport Gate 2', 'MAA', 'BLR', 'Pharmaceuticals', 5, 30.00, 30.00, 12000.00, 'Refrigerate', '2026-06-02', 'issued');

INSERT OR IGNORE INTO weight_calculations (id, cargo_id, description, pieces, actual_weight, volumetric_weight, chargeable_weight, length_cm, width_cm, height_cm, rate_per_kg, freight_cost) VALUES
  (1, 1, 'Electronics parts', 3, 45.00, 12.00, 45.00, 60.00, 40.00, 30.00, 12.50, 562.50),
  (2, 2, 'Medical cartons', 5, 30.00, 7.29, 30.00, 50.00, 35.00, 25.00, 15.00, 450.00);

INSERT OR IGNORE INTO pickup_schedules (id, schedule_id, cargo_id, customer_name, pickup_type, location, customer_address, scheduled_date, scheduled_time, assigned_driver, vehicle_number, contact_number, status, notes) VALUES
  (1, 'PKP-2026-00001', 3, 'Swift Logistics', 'airport_pickup', 'DEL Cargo Terminal 3', NULL, '2026-06-10', '10:30', 'Karan Johar', 'DL-01-AB-1234', '+91 9999888877', 'scheduled', 'Collect original customs slip'),
  (2, 'PKP-2026-00002', 8, 'FastTrack Imports', 'customer_delivery', 'Pune Logistics Hub', 'Sector 15, Industrial Area', '2026-06-12', '14:00', 'Amitabh B', 'MH-12-CD-5678', '+91 9876543210', 'in_progress', 'Call before arrival');


INSERT OR IGNORE INTO invoices (id, invoice_number, cargo_id, customer_name, amount, tax, total, status, due_date) VALUES
  (1, 'INV-20260001', 1, 'Raj Enterprises', 127.50, 6.38, 133.88, 'Paid',   '2026-06-30'),
  (2, 'INV-20260002', 2, 'Global Traders',  64.00,  3.20, 67.20,  'Unpaid', '2026-07-15');

INSERT OR IGNORE INTO payments (id, transaction_id, invoice_id, amount, payment_method, status) VALUES
  (1, 'TXN-7890123', 1, 133.88, 'Credit Card', 'Success');

INSERT OR IGNORE INTO complaints (id, complaint_id, customer_name, subject, description, status) VALUES
  (1, 'COMP-001', 'Global Traders', 'Delay in Storing', 'Cargo was received but not stored for 24 hours in Zone B.', 'Resolved'),
  (2, 'COMP-002', 'Northern Goods',  'Fragile Handle Warning', 'Missing fragile caution tape on electronics pallet.', 'Open');

INSERT OR IGNORE INTO claims (id, claim_id, cargo_id, amount, description, status, document_url) VALUES
  (1, 'CLM-001', 2, 500.00, 'Water damage to pharmaceutical cartons in Zone B.', 'Approved', 'https://cargo-warehouse.com/docs/claims/clm-001.pdf');

INSERT OR IGNORE INTO customs_checklists (id, cargo_id, document_type, status, verified_by) VALUES
  (1, 1, 'Commercial Invoice', 'Verified', 'Super Admin'),
  (2, 1, 'Packing List',        'Verified', 'Super Admin'),
  (3, 2, 'Certificate of Origin', 'Pending', NULL),
  (4, 2, 'Phytosanitary Cert',   'Pending', NULL);

INSERT OR IGNORE INTO route_options (id, cargo_id, routes_json, selected_route) VALUES
  (1, 1, '["Emirates SkyCargo: BOM -> DXB -> DEL (Fastest)", "Air India: BOM -> DEL (Direct, Eco)"]', 'Air India: BOM -> DEL (Direct, Eco)'),
  (2, 2, '["Qatar Cargo: MAA -> DOH -> BLR (Fastest)", "SpiceJet: MAA -> BLR (Direct, Eco)"]', 'SpiceJet: MAA -> BLR (Direct, Eco)');
`;

module.exports = { SCHEMA_SQL, SEED_SQL };
