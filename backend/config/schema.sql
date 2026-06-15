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
-- 6. Activity Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED   NULL,
  action      VARCHAR(100)   NOT NULL,
  description TEXT           NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 7. Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200)   NOT NULL,
  message     TEXT           NOT NULL,
  type        ENUM(
                'new_cargo',
                'cargo_ready',
                'dispatch_delayed',
                'capacity_warning',
                'cargo_delivered',
                'task_assigned',
                'task_completed'
              ) NOT NULL DEFAULT 'new_cargo',
  is_read     TINYINT(1)     NOT NULL DEFAULT 0,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 8. Tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200)  NOT NULL,
  description  TEXT          NULL,
  assigned_to  INT UNSIGNED  NULL,
  assigned_by  INT UNSIGNED  NULL,
  status       ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  priority     ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  due_date     DATE          NULL,
  cargo_id     VARCHAR(30)   NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_assignee FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_task_assigner FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX idx_cargo_status   ON cargo (status);
CREATE INDEX idx_cargo_zone     ON cargo (zone_id);
CREATE INDEX idx_cargo_cargo_id ON cargo (cargo_id);
CREATE INDEX idx_dr_cargo_id    ON dispatch_records (cargo_id);
CREATE INDEX idx_al_user_id     ON activity_logs (user_id);
CREATE INDEX idx_al_created_at  ON activity_logs (created_at);
CREATE INDEX idx_notif_is_read  ON notifications (is_read);
CREATE INDEX idx_tasks_assigned ON tasks (assigned_to);
CREATE INDEX idx_tasks_status   ON tasks (status);
