-- ============================================================
-- Cargo Warehouse Inventory System — Seed Data
-- Run AFTER schema.sql:  mysql -u root -p cargo_warehouse < seed.sql
-- ============================================================

USE cargo_warehouse;

-- ============================================================
-- Users (passwords are all "Password@123" hashed with bcrypt)
-- ============================================================
INSERT IGNORE INTO users (name, email, password, role) VALUES
  ('Super Admin',            'admin@cargowarehouse.com',   '$2a$12$NrymNyzzI2yMDZBQEvfzW.v4nJvDWM9gVq6MbEzVxG8kPv7jqfEgW', 'Super Admin'),
  ('Ahmed Al-Rashidi',       'warehouse@cargowarehouse.com','$2a$12$NrymNyzzI2yMDZBQEvfzW.v4nJvDWM9gVq6MbEzVxG8kPv7jqfEgW', 'Warehouse Staff'),
  ('Fatima Al-Zahra',        'ops@cargowarehouse.com',      '$2a$12$NrymNyzzI2yMDZBQEvfzW.v4nJvDWM9gVq6MbEzVxG8kPv7jqfEgW', 'Operations Staff'),
  ('Hassan Mohammed',        'docs@cargowarehouse.com',     '$2a$12$NrymNyzzI2yMDZBQEvfzW.v4nJvDWM9gVq6MbEzVxG8kPv7jqfEgW', 'Documentation Executive'),
  ('Mariam Khalid',          'accounts@cargowarehouse.com', '$2a$12$NrymNyzzI2yMDZBQEvfzW.v4nJvDWM9gVq6MbEzVxG8kPv7jqfEgW', 'Accounts Staff');

-- ============================================================
-- Warehouse Zones
-- ============================================================
INSERT IGNORE INTO warehouse_zones (zone_name, capacity, occupied) VALUES
  ('Zone A - General Cargo',   100, 42),
  ('Zone B - Fragile Items',    50, 15),
  ('Zone C - Cold Storage',     30,  8),
  ('Zone D - Hazmat',           20,  3),
  ('Zone E - Oversized',        40, 10);

-- ============================================================
-- Storage Locations (Zone A)
-- ============================================================
INSERT IGNORE INTO storage_locations (zone_id, location_code, status) VALUES
  (1, 'A-001', 'Occupied'),
  (1, 'A-002', 'Occupied'),
  (1, 'A-003', 'Available'),
  (1, 'A-004', 'Available'),
  (1, 'A-005', 'Reserved'),
  (2, 'B-001', 'Occupied'),
  (2, 'B-002', 'Available'),
  (2, 'B-003', 'Available'),
  (3, 'C-001', 'Occupied'),
  (3, 'C-002', 'Available'),
  (4, 'D-001', 'Occupied'),
  (4, 'D-002', 'Available'),
  (5, 'E-001', 'Available'),
  (5, 'E-002', 'Available');

-- ============================================================
-- Cargo
-- ============================================================
INSERT IGNORE INTO cargo
  (cargo_id, customer_name, customer_phone, cargo_type, origin_airport, destination_airport,
   pickup_city, package_count, weight, length, width, height, chargeable_weight, billing_weight,
   arrival_date, status, zone_id, location_id, created_by)
VALUES
  ('CRG-20240001', 'Raj Enterprises',    '+91-9876543210', 'Electronics',    'BOM', 'DEL', 'Mumbai',    3,  45.00, 60.0, 40.0, 30.0, 12.00, 45.00, '2024-06-01', 'Stored',             1, 1, 1),
  ('CRG-20240002', 'Global Traders',     '+91-9123456780', 'Pharmaceuticals','MAA', 'BLR', 'Chennai',   5,  30.00, 50.0, 35.0, 25.0,  7.29, 30.00, '2024-06-02', 'Stored',             2, 6, 2),
  ('CRG-20240003', 'Swift Logistics',    '+91-9988776655', 'Textiles',       'DEL', 'HYD', 'Delhi',     2,  18.00, 80.0, 60.0, 40.0, 32.00, 32.00, '2024-06-03', 'Ready For Dispatch', 1, 2, 2),
  ('CRG-20240004', 'Ocean Freight Co',   '+91-9090909090', 'Machinery',      'CCU', 'BOM', 'Kolkata',   1, 150.00,100.0, 80.0, 70.0, 93.33,150.00, '2024-06-04', 'Dispatched',         5, NULL, 1),
  ('CRG-20240005', 'Prime Exports',      '+91-9871234560', 'Perishables',    'BLR', 'MAA', 'Bengaluru', 4,  25.00, 40.0, 30.0, 20.0,  4.00, 25.00, '2024-06-05', 'Delivered',          3, 9, 1),
  ('CRG-20240006', 'Ace Supplies',       '+91-9000011111', 'Chemicals',      'HYD', 'CCU', 'Hyderabad', 2,  55.00, 60.0, 50.0, 40.0, 20.00, 55.00, '2024-06-06', 'Received',           NULL, NULL, 2),
  ('CRG-20240007', 'Northern Goods',     '+91-9555566666', 'Electronics',    'AMD', 'DEL', 'Ahmedabad', 6,  70.00, 70.0, 50.0, 35.0, 20.42, 70.00, '2024-06-07', 'Stored',             1, NULL, 2),
  ('CRG-20240008', 'FastTrack Imports',  '+91-9111122222', 'Auto Parts',     'PNQ', 'BOM', 'Pune',      1,  90.00, 90.0, 70.0, 60.0, 63.00, 90.00, '2024-06-08', 'Ready For Dispatch', 5, NULL, 1);

-- ============================================================
-- Dispatch Records
-- ============================================================
INSERT IGNORE INTO dispatch_records
  (dispatch_id, cargo_id, driver_name, vehicle_number, dispatch_date, expected_delivery, status, created_by)
VALUES
  ('DSP-20240001', 4, 'Ravi Kumar',   'MH-12-AB-1234', '2024-06-05', '2024-06-08', 'In Transit', 3),
  ('DSP-20240002', 5, 'Suresh Babu',  'TN-09-CD-5678', '2024-06-06', '2024-06-09', 'Delivered',  3),
  ('DSP-20240003', 3, 'Deepak Singh', 'DL-01-EF-9012', '2024-06-10', '2024-06-13', 'Scheduled',  3);

-- ============================================================
-- Activity Logs
-- ============================================================
INSERT IGNORE INTO activity_logs (user_id, action, description) VALUES
  (1, 'USER_LOGIN',      'Super Admin logged in'),
  (2, 'USER_LOGIN',      'Ahmed Al-Rashidi (Warehouse Staff) logged in'),
  (1, 'CARGO_CREATED',   'Cargo CRG-20240001 created for Raj Enterprises'),
  (2, 'CARGO_CREATED',   'Cargo CRG-20240002 created for Global Traders'),
  (2, 'CARGO_UPDATED',   'Cargo CRG-20240003 status updated to Ready For Dispatch'),
  (3, 'DISPATCH_CREATED','Dispatch DSP-20240001 created for cargo CRG-20240004'),
  (3, 'DISPATCH_CREATED','Dispatch DSP-20240002 created for cargo CRG-20240005'),
  (1, 'CARGO_UPDATED',   'Cargo CRG-20240005 status updated to Delivered');

-- ============================================================
-- Notifications
-- ============================================================
INSERT IGNORE INTO notifications (title, message, type, is_read) VALUES
  ('New Cargo Received',           'Cargo CRG-20240006 has been received from Ace Supplies.',               'new_cargo',       0),
  ('Cargo Ready For Dispatch',     'Cargo CRG-20240003 is ready for dispatch. Assign a driver.',            'cargo_ready',     0),
  ('Cargo Delivered',              'Cargo CRG-20240005 has been successfully delivered.',                   'cargo_delivered', 1),
  ('Warehouse Capacity Warning',   'Zone A - General Cargo is at 84% capacity. Consider rebalancing.',      'capacity_warning',0),
  ('Cargo Ready For Dispatch',     'Cargo CRG-20240008 is ready for dispatch. Assign a driver.',            'cargo_ready',     0);

-- ============================================================
-- Tasks (sample tasks assigned across roles)
-- ============================================================
INSERT IGNORE INTO tasks (title, description, assigned_to, assigned_by, status, priority, due_date, cargo_id) VALUES
  ('Inspect Zone A Storage Slots',       'Conduct a full inspection of all Zone A storage slots and report damage or availability issues.', 2, 1, 'Pending',     'High',   '2026-06-20', NULL),
  ('Verify CRG-20240001 Weight Entry',   'Double check the chargeable weight recorded for CRG-20240001 against the physical manifest.',     2, 1, 'In Progress', 'Medium', '2026-06-16', 'CRG-20240001'),
  ('Prepare June Dispatch Report',       'Compile all June dispatch records into the monthly operations summary report.',                    3, 1, 'Pending',     'High',   '2026-06-25', NULL),
  ('Coordinate DSP-20240003 Delivery',   'Follow up with the driver and update the delivery status for DSP-20240003.',                      3, 1, 'In Progress', 'Urgent', '2026-06-15', 'CRG-20240008'),
  ('Draft Cargo Documentation CRG-006',  'Prepare all export documentation and customs clearance forms for CRG-20240006.',                  4, 1, 'Pending',     'High',   '2026-06-18', 'CRG-20240006'),
  ('Archive May 2026 Shipment Docs',     'Scan, label, and archive all May 2026 shipment documentation to the shared drive.',               4, 1, 'Completed',   'Low',    '2026-06-10', NULL),
  ('Reconcile June Cargo Billing',       'Match chargeable weight entries against customer invoices for all June cargo.',                    5, 1, 'In Progress', 'High',   '2026-06-22', NULL),
  ('Process Invoice for Global Traders', 'Generate and send the invoice for CRG-20240002 (Global Traders) pending payment.',                5, 1, 'Pending',     'Medium', '2026-06-19', 'CRG-20240002'),
  ('Update Zone B Capacity Records',     'Record the new storage capacity numbers for Zone B after the recent restructuring.',              2, 1, 'Completed',   'Low',    '2026-06-12', NULL),
  ('Audit Activity Logs — June 2026',    'Review and flag any suspicious or unauthorized activity in the system logs for June 2026.',       1, 1, 'Pending',     'Medium', '2026-06-30', NULL);
