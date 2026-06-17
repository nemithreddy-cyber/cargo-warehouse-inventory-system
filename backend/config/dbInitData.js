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

CREATE TABLE IF NOT EXISTS activity_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER   NULL,
  action      TEXT   NOT NULL,
  description TEXT           NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT   NOT NULL,
  message     TEXT   NOT NULL,
  type        TEXT NOT NULL DEFAULT 'new_cargo',
  is_read     INTEGER     NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT  NOT NULL,
  description  TEXT          NULL,
  assigned_to  INTEGER  NULL,
  assigned_by  INTEGER  NULL,
  status       TEXT NOT NULL DEFAULT 'Pending',
  priority     TEXT NOT NULL DEFAULT 'Medium',
  due_date     DATE          NULL,
  cargo_id     TEXT   NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cargo_status   ON cargo (status);
CREATE INDEX IF NOT EXISTS idx_cargo_zone     ON cargo (zone_id);
CREATE INDEX IF NOT EXISTS idx_cargo_cargo_id ON cargo (cargo_id);
CREATE INDEX IF NOT EXISTS idx_dr_cargo_id    ON dispatch_records (cargo_id);
CREATE INDEX IF NOT EXISTS idx_al_user_id     ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_al_created_at  ON activity_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_notif_is_read  ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks (status);
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
  (1, 1, 'A-001', 'Occupied'),
  (2, 1, 'A-002', 'Occupied'),
  (3, 1, 'A-003', 'Available'),
  (4, 1, 'A-004', 'Available'),
  (5, 1, 'A-005', 'Reserved'),
  (6, 2, 'B-001', 'Occupied'),
  (7, 2, 'B-002', 'Available'),
  (8, 2, 'B-003', 'Available'),
  (9, 3, 'C-001', 'Occupied'),
  (10, 3, 'C-002', 'Available'),
  (11, 4, 'D-001', 'Occupied'),
  (12, 4, 'D-002', 'Available'),
  (13, 5, 'E-001', 'Available'),
  (14, 5, 'E-002', 'Available');

INSERT OR IGNORE INTO cargo
  (id, cargo_id, customer_name, customer_phone, cargo_type, origin_airport, destination_airport,
   pickup_city, package_count, weight, length, width, height, chargeable_weight, billing_weight,
   arrival_date, status, zone_id, location_id, created_by)
VALUES
  (1, 'CRG-20240001', 'Raj Enterprises',    '+91-9876543210', 'Electronics',    'BOM', 'DEL', 'Mumbai',    3,  45.00, 60.0, 40.0, 30.0, 12.00, 45.00, '2024-06-01', 'Stored',             1, 1, 1),
  (2, 'CRG-20240002', 'Global Traders',     '+91-9123456780', 'Pharmaceuticals','MAA', 'BLR', 'Chennai',   5,  30.00, 50.0, 35.0, 25.0,  7.29, 30.00, '2024-06-02', 'Stored',             2, 6, 2),
  (3, 'CRG-20240003', 'Swift Logistics',    '+91-9988776655', 'Textiles',       'DEL', 'HYD', 'Delhi',     2,  18.00, 80.0, 60.0, 40.0, 32.00, 32.00, '2024-06-03', 'Ready For Dispatch', 1, 2, 2),
  (4, 'CRG-20240004', 'Ocean Freight Co',   '+91-9090909090', 'Machinery',      'CCU', 'BOM', 'Kolkata',   1, 150.00,100.0, 80.0, 70.0, 93.33,150.00, '2024-06-04', 'Dispatched',         5, NULL, 1),
  (5, 'CRG-20240005', 'Prime Exports',      '+91-9871234560', 'Perishables',    'BLR', 'MAA', 'Bengaluru', 4,  25.00, 40.0, 30.0, 20.0,  4.00, 25.00, '2024-06-05', 'Delivered',          3, 9, 1),
  (6, 'CRG-20240006', 'Ace Supplies',       '+91-9000011111', 'Chemicals',      'HYD', 'CCU', 'Hyderabad', 2,  55.00, 60.0, 50.0, 40.0, 20.00, 55.00, '2024-06-06', 'Received',           NULL, NULL, 2),
  (7, 'CRG-20240007', 'Northern Goods',     '+91-9555566666', 'Electronics',    'AMD', 'DEL', 'Ahmedabad', 6,  70.00, 70.0, 50.0, 35.0, 20.42, 70.00, '2024-06-07', 'Stored',             1, NULL, 2),
  (8, 'CRG-20240008', 'FastTrack Imports',  '+91-9111122222', 'Auto Parts',     'PNQ', 'BOM', 'Pune',      1,  90.00, 90.0, 70.0, 60.0, 63.00, 90.00, '2024-06-08', 'Ready For Dispatch', 5, NULL, 1);

INSERT OR IGNORE INTO dispatch_records
  (id, dispatch_id, cargo_id, driver_name, vehicle_number, dispatch_date, expected_delivery, status, created_by)
VALUES
  (1, 'DSP-20240001', 4, 'Ravi Kumar',   'MH-12-AB-1234', '2024-06-05', '2024-06-08', 'In Transit', 3),
  (2, 'DSP-20240002', 5, 'Suresh Babu',  'TN-09-CD-5678', '2024-06-06', '2024-06-09', 'Delivered',  3),
  (3, 'DSP-20240003', 3, 'Deepak Singh', 'DL-01-EF-9012', '2024-06-10', '2024-06-13', 'Scheduled',  3);

INSERT OR IGNORE INTO activity_logs (id, user_id, action, description) VALUES
  (1, 1, 'USER_LOGIN',      'Super Admin logged in'),
  (2, 2, 'USER_LOGIN',      'Ahmed Al-Rashidi (Warehouse Staff) logged in'),
  (3, 1, 'CARGO_CREATED',   'Cargo CRG-20240001 created for Raj Enterprises'),
  (4, 2, 'CARGO_CREATED',   'Cargo CRG-20240002 created for Global Traders'),
  (5, 2, 'CARGO_UPDATED',   'Cargo CRG-20240003 status updated to Ready For Dispatch'),
  (6, 3, 'DISPATCH_CREATED','Dispatch DSP-20240001 created for cargo CRG-20240004'),
  (7, 3, 'DISPATCH_CREATED','Dispatch DSP-20240002 created for cargo CRG-20240005'),
  (8, 1, 'CARGO_UPDATED',   'Cargo CRG-20240005 status updated to Delivered');

INSERT OR IGNORE INTO notifications (id, title, message, type, is_read) VALUES
  (1, 'New Cargo Received',           'Cargo CRG-20240006 has been received from Ace Supplies.',               'new_cargo',       0),
  (2, 'Cargo Ready For Dispatch',     'Cargo CRG-20240003 is ready for dispatch. Assign a driver.',            'cargo_ready',     0),
  (3, 'Cargo Delivered',              'Cargo CRG-20240005 has been successfully delivered.',                   'cargo_delivered', 1),
  (4, 'Warehouse Capacity Warning',   'Zone A - General Cargo is at 84% capacity. Consider rebalancing.',      'capacity_warning',0),
  (5, 'Cargo Ready For Dispatch',     'Cargo CRG-20240008 is ready for dispatch. Assign a driver.',            'cargo_ready',     0);

INSERT OR IGNORE INTO tasks (id, title, description, assigned_to, assigned_by, status, priority, due_date, cargo_id) VALUES
  (1, 'Inspect Zone A Storage Slots',       'Conduct a full inspection of all Zone A storage slots and report damage or availability issues.', 2, 1, 'Pending',     'High',   '2026-06-20', NULL),
  (2, 'Verify CRG-20240001 Weight Entry',   'Double check the chargeable weight recorded for CRG-20240001 against the physical manifest.',     2, 1, 'In Progress', 'Medium', '2026-06-16', 'CRG-20240001'),
  (3, 'Prepare June Dispatch Report',       'Compile all June dispatch records into the monthly operations summary report.',                    3, 1, 'Pending',     'High',   '2026-06-25', NULL),
  (4, 'Coordinate DSP-20240003 Delivery',   'Follow up with the driver and update the delivery status for DSP-20240003.',                      3, 1, 'In Progress', 'Urgent', '2026-06-15', 'CRG-20240008'),
  (5, 'Draft Cargo Documentation CRG-006',  'Prepare all export documentation and customs clearance forms for CRG-20240006.',                  4, 1, 'Pending',     'High',   '2026-06-18', 'CRG-20240006'),
  (6, 'Archive May 2026 Shipment Docs',     'Scan, label, and archive all May 2026 shipment documentation to the shared drive.',               4, 1, 'Completed',   'Low',    '2026-06-10', NULL),
  (7, 'Reconcile June Cargo Billing',       'Match chargeable weight entries against customer invoices for all June cargo.',                    5, 1, 'In Progress', 'High',   '2026-06-22', NULL),
  (8, 'Process Invoice for Global Traders', 'Generate and send the invoice for CRG-20240002 (Global Traders) pending payment.',                5, 1, 'Pending',     'Medium', '2026-06-19', 'CRG-20240002'),
  (9, 'Update Zone B Capacity Records',     'Record the new storage capacity numbers for Zone B after the recent restructuring.',              2, 1, 'Completed',   'Low',    '2026-06-12', NULL),
  (10, 'Audit Activity Logs — June 2026',    'Review and flag any suspicious or unauthorized activity in the system logs for June 2026.',       1, 1, 'Pending',     'Medium', '2026-06-30', NULL);
`;

module.exports = { SCHEMA_SQL, SEED_SQL };
