-- ============================================================
-- Cargo Warehouse Inventory System — Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS cargo_warehouse
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cargo_warehouse;

-- ============================================================
-- 1. Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  username    VARCHAR(100)  NOT NULL UNIQUE,
  email       VARCHAR(180)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM(
                'Super Admin',
                'Warehouse Staff',
                'Operations Staff',
                'Documentation Executive',
                'Accounts Staff'
              ) NOT NULL DEFAULT 'Warehouse Staff',
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. Warehouse Zones
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse_zones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  zone_name   VARCHAR(100)   NOT NULL UNIQUE,
  capacity    INT UNSIGNED   NOT NULL DEFAULT 0,
  occupied    INT UNSIGNED   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_occupied CHECK (occupied <= capacity)
) ENGINE=InnoDB;

-- ============================================================
-- 3. Storage Locations
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_locations (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  zone_id        INT UNSIGNED   NOT NULL,
  location_code  VARCHAR(50)    NOT NULL UNIQUE,
  status         ENUM('Available','Occupied','Reserved') NOT NULL DEFAULT 'Available',
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sl_zone FOREIGN KEY (zone_id) REFERENCES warehouse_zones (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4. Cargo
-- ============================================================
CREATE TABLE IF NOT EXISTS cargo (
  id                  INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  cargo_id            VARCHAR(30)    NOT NULL UNIQUE,
  customer_name       VARCHAR(120)   NOT NULL,
  customer_phone      VARCHAR(30)    NOT NULL,
  cargo_type          VARCHAR(80)    NOT NULL,
  origin_airport      VARCHAR(10)    NOT NULL,
  destination_airport VARCHAR(10)    NOT NULL,
  pickup_city         VARCHAR(100)   NOT NULL,
  package_count       INT UNSIGNED   NOT NULL DEFAULT 1,
  weight              DECIMAL(10,2)  NOT NULL COMMENT 'kg',
  length              DECIMAL(10,2)  NOT NULL COMMENT 'cm',
  width               DECIMAL(10,2)  NOT NULL COMMENT 'cm',
  height              DECIMAL(10,2)  NOT NULL COMMENT 'cm',
  chargeable_weight   DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT 'kg',
  billing_weight      DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT 'kg',
  arrival_date        DATE           NULL,
  dispatch_date       DATE           NULL,
  zone_id             INT UNSIGNED   NULL,
  location_id         INT UNSIGNED   NULL,
  status              ENUM(
                        'Received',
                        'Stored',
                        'Ready For Dispatch',
                        'Dispatched',
                        'Delivered',
                        'Cancelled'
                      ) NOT NULL DEFAULT 'Received',
  created_by          INT UNSIGNED   NULL,
  created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cargo_zone     FOREIGN KEY (zone_id)     REFERENCES warehouse_zones (id) ON DELETE SET NULL,
  CONSTRAINT fk_cargo_location FOREIGN KEY (location_id) REFERENCES storage_locations (id) ON DELETE SET NULL,
  CONSTRAINT fk_cargo_creator  FOREIGN KEY (created_by)  REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 5. Dispatch Records
-- ============================================================
CREATE TABLE IF NOT EXISTS dispatch_records (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispatch_id       VARCHAR(30)    NOT NULL UNIQUE,
  cargo_id          INT UNSIGNED   NOT NULL,
  driver_name       VARCHAR(120)   NOT NULL,
  vehicle_number    VARCHAR(50)    NOT NULL,
  dispatch_date     DATE           NOT NULL,
  expected_delivery DATE           NOT NULL,
  actual_delivery   DATE           NULL,
  status            ENUM(
                      'Scheduled',
                      'In Transit',
                      'Delivered',
                      'Delayed',
                      'Cancelled'
                    ) NOT NULL DEFAULT 'Scheduled',
  created_by        INT UNSIGNED   NULL,
  created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dr_cargo   FOREIGN KEY (cargo_id)   REFERENCES cargo (id) ON DELETE CASCADE,
  CONSTRAINT fk_dr_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 6. Partner Agents
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_agents (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_name     VARCHAR(120)  NOT NULL,
  location       VARCHAR(100)  NOT NULL,
  contact_number VARCHAR(50)   NOT NULL,
  status         ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 7. Airline Rates
-- ============================================================
CREATE TABLE IF NOT EXISTS airline_rates (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  airline_name   VARCHAR(120)  NOT NULL,
  origin         VARCHAR(10)   NOT NULL,
  destination    VARCHAR(10)   NOT NULL,
  rate_per_kg    DECIMAL(10,2) NOT NULL,
  transit_days   INT UNSIGNED  NOT NULL DEFAULT 2,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 8. Quotations
-- ============================================================
CREATE TABLE IF NOT EXISTS quotations (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id       VARCHAR(30)    NOT NULL UNIQUE,
  customer_name  VARCHAR(120)   NOT NULL,
  weight         DECIMAL(10,2)  NOT NULL,
  cargo_type     VARCHAR(80)    NOT NULL,
  origin         VARCHAR(10)    NOT NULL,
  destination    VARCHAR(10)    NOT NULL,
  rate_per_kg    DECIMAL(10,2)  NOT NULL,
  extra_charges  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  total_charge   DECIMAL(10,2)  NOT NULL,
  status         ENUM('Approved', 'Pending', 'Rejected') NOT NULL DEFAULT 'Pending',
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 9. AWB Records
-- ============================================================
CREATE TABLE IF NOT EXISTS awb_records (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  awb_number           VARCHAR(30)    NOT NULL UNIQUE,
  cargo_id             INT UNSIGNED   NOT NULL,
  shipper_name         VARCHAR(120)   NOT NULL,
  shipper_address      TEXT           NOT NULL,
  consignee_name       VARCHAR(120)   NOT NULL,
  consignee_address    TEXT           NOT NULL,
  origin_airport       VARCHAR(10)    NOT NULL,
  destination_airport  VARCHAR(10)    NOT NULL,
  cargo_description    VARCHAR(255)   NOT NULL,
  pieces               INT UNSIGNED   NOT NULL DEFAULT 1,
  actual_weight        DECIMAL(10,2)  NOT NULL,
  chargeable_weight    DECIMAL(10,2)  NOT NULL,
  declared_value       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  special_instructions TEXT           NULL,
  issue_date           DATE           NOT NULL,
  status               ENUM('draft', 'issued', 'cancelled') NOT NULL DEFAULT 'draft',
  created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_awb_rec_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. Invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30)   NOT NULL UNIQUE,
  cargo_id       INT UNSIGNED  NOT NULL,
  customer_name  VARCHAR(120)  NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  tax            DECIMAL(10,2) NOT NULL,
  total          DECIMAL(10,2) NOT NULL,
  status         ENUM('Paid', 'Unpaid', 'Overdue') NOT NULL DEFAULT 'Unpaid',
  due_date       DATE          NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 11. Payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id   VARCHAR(50)   NOT NULL UNIQUE,
  invoice_id       INT UNSIGNED  NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  payment_method   VARCHAR(50)   NOT NULL,
  status           ENUM('Success', 'Pending', 'Failed') NOT NULL DEFAULT 'Success',
  transaction_date TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 12. Complaints
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  complaint_id   VARCHAR(30)   NOT NULL UNIQUE,
  customer_name  VARCHAR(120)  NOT NULL,
  subject        VARCHAR(200)  NOT NULL,
  description    TEXT          NOT NULL,
  status         ENUM('Open', 'Resolved') NOT NULL DEFAULT 'Open',
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 13. Claims
-- ============================================================
CREATE TABLE IF NOT EXISTS claims (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  claim_id       VARCHAR(30)   NOT NULL UNIQUE,
  cargo_id       INT UNSIGNED  NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  description    TEXT          NOT NULL,
  status         ENUM('Submitted', 'Approved', 'Rejected') NOT NULL DEFAULT 'Submitted',
  document_url   VARCHAR(255)  NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_claim_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 14. Customs Checklists
-- ============================================================
CREATE TABLE IF NOT EXISTS customs_checklists (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cargo_id       INT UNSIGNED  NOT NULL,
  document_type  VARCHAR(100)  NOT NULL,
  status         ENUM('Verified', 'Pending') NOT NULL DEFAULT 'Pending',
  verified_by    VARCHAR(120)  NULL,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cc_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 15. Route Options
-- ============================================================
CREATE TABLE IF NOT EXISTS route_options (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cargo_id       INT UNSIGNED  NOT NULL,
  routes_json    TEXT          NOT NULL,
  selected_route VARCHAR(150)  NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ro_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 16. Message Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS message_logs (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipient_name VARCHAR(120)  NOT NULL,
  phone_number   VARCHAR(50)   NULL,
  email          VARCHAR(180)  NULL,
  channel        VARCHAR(20)   NOT NULL,
  message        TEXT          NOT NULL,
  status         VARCHAR(50)   NOT NULL,
  sent_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cargo_id       VARCHAR(50)   NULL,
  error_message  TEXT          NULL
) ENGINE=InnoDB;

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX idx_cargo_status   ON cargo (status);
CREATE INDEX idx_cargo_zone     ON cargo (zone_id);
CREATE INDEX idx_cargo_cargo_id ON cargo (cargo_id);
CREATE INDEX idx_dr_cargo_id    ON dispatch_records (cargo_id);
CREATE INDEX idx_awb_cargo_id   ON awb_records (cargo_id);
CREATE INDEX idx_inv_cargo_id   ON invoices (cargo_id);
CREATE INDEX idx_cc_cargo_id    ON customs_checklists (cargo_id);
CREATE INDEX idx_ml_cargo_id    ON message_logs (cargo_id);

-- ============================================================
-- 17. Weight Calculations
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_calculations (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cargo_id          VARCHAR(50)    NULL,
  description       TEXT           NOT NULL,
  pieces            INT UNSIGNED   NOT NULL DEFAULT 1,
  actual_weight     DECIMAL(10,2)  NOT NULL,
  volumetric_weight DECIMAL(10,2)  NOT NULL,
  chargeable_weight DECIMAL(10,2)  NOT NULL,
  length_cm         DECIMAL(10,2)  NOT NULL,
  width_cm          DECIMAL(10,2)  NOT NULL,
  height_cm         DECIMAL(10,2)  NOT NULL,
  rate_per_kg       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  freight_cost      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  calculated_by     INT UNSIGNED   NULL,
  created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wc_creator FOREIGN KEY (calculated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 18. Pickup Schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS pickup_schedules (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id            VARCHAR(30)    NOT NULL UNIQUE,
  cargo_id               INT UNSIGNED   NOT NULL,
  customer_name          VARCHAR(120)   NOT NULL,
  pickup_type            ENUM('airport_pickup', 'customer_delivery') NOT NULL,
  location               VARCHAR(255)   NOT NULL,
  customer_address       TEXT           NULL,
  scheduled_date         DATE           NOT NULL,
  scheduled_time         VARCHAR(20)    NOT NULL,
  assigned_driver        VARCHAR(120)   NOT NULL,
  vehicle_number         VARCHAR(50)    NOT NULL,
  contact_number         VARCHAR(50)    NOT NULL,
  notes                  TEXT           NULL,
  status                 ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  actual_completion_time DATETIME       NULL,
  driver_notes           TEXT           NULL,
  proof_of_delivery      TEXT           NULL,
  created_by             INT UNSIGNED   NULL,
  created_at             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pkp_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE,
  CONSTRAINT fk_pkp_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_wc_cargo_id ON weight_calculations (cargo_id);
CREATE INDEX idx_pkp_cargo_id ON pickup_schedules (cargo_id);
CREATE INDEX idx_pkp_schedule_id ON pickup_schedules (schedule_id);



