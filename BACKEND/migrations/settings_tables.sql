-- ============================================================
-- Settings and Activity Logs Tables
-- Run this SQL to create the required tables for the admin settings feature
-- ============================================================

-- App Settings Table
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_id` INT NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT,
  `setting_type` ENUM('string', 'number', 'boolean', 'password', 'currency', 'timezone') DEFAULT 'string',
  `category` VARCHAR(50) DEFAULT 'general',
  `description` VARCHAR(255),
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_by` INT,
  `updated_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`),
  KEY `idx_category` (`category`),
  CONSTRAINT `fk_settings_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT,
  `action` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50),
  `entity_id` VARCHAR(100),
  `details` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert Default Settings
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `created_by`, `updated_by`) VALUES
-- General Settings
('site_name', 'ShopSphere', 'string', 'general', 'Website name displayed in headers and titles', 1, 1),
('site_tagline', 'Your Premium Shopping Destination', 'string', 'general', 'Website tagline or slogan', 1, 1),
('contact_email', 'support@shopsphere.com', 'string', 'general', 'Primary contact email address', 1, 1),
('contact_phone', '+91 9876543210', 'string', 'general', 'Primary contact phone number', 1, 1),
('timezone', 'Asia/Kolkata', 'timezone', 'general', 'Default timezone for the application', 1, 1),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode to restrict site access', 1, 1),

-- Store Settings
('default_currency', 'INR', 'currency', 'store', 'Default currency for prices and transactions', 1, 1),
('tax_rate', '18', 'number', 'store', 'Default tax rate percentage (GST)', 1, 1),
('tax_inclusive', 'true', 'boolean', 'store', 'Whether prices include tax', 1, 1),
('free_shipping_threshold', '500', 'number', 'store', 'Minimum order amount for free shipping', 1, 1),
('shipping_flat_rate', '50', 'number', 'store', 'Flat shipping rate for orders below threshold', 1, 1),
('max_order_items', '50', 'number', 'store', 'Maximum items allowed in a single order', 1, 1),

-- Payment Settings
('stripe_enabled', 'true', 'boolean', 'payment', 'Enable Stripe payment gateway', 1, 1),
('stripe_test_mode', 'true', 'boolean', 'payment', 'Use Stripe test mode (use test keys)', 1, 1),
('cod_enabled', 'true', 'boolean', 'payment', 'Enable Cash on Delivery option', 1, 1),
('cod_max_amount', '50000', 'number', 'payment', 'Maximum order amount for COD', 1, 1),
('payment_retry_attempts', '3', 'number', 'payment', 'Number of payment retry attempts allowed', 1, 1),

-- Email Settings
('smtp_host', 'smtp.gmail.com', 'string', 'email', 'SMTP server hostname', 1, 1),
('smtp_port', '587', 'number', 'email', 'SMTP server port', 1, 1),
('smtp_user', '', 'string', 'email', 'SMTP authentication username', 1, 1),
('smtp_password', '', 'password', 'email', 'SMTP authentication password', 1, 1),
('smtp_from_email', 'noreply@shopsphere.com', 'string', 'email', 'Default sender email address', 1, 1),
('smtp_from_name', 'ShopSphere', 'string', 'email', 'Default sender name', 1, 1),

-- Security Settings
('jwt_expires_in', '7d', 'string', 'security', 'JWT token expiration time', 1, 1),
('password_min_length', '8', 'number', 'security', 'Minimum password length', 1, 1),
('password_require_uppercase', 'true', 'boolean', 'security', 'Require uppercase letters in passwords', 1, 1),
('password_require_number', 'true', 'boolean', 'security', 'Require numbers in passwords', 1, 1),
('password_require_special', 'true', 'boolean', 'security', 'Require special characters in passwords', 1, 1),
('max_login_attempts', '5', 'number', 'security', 'Maximum failed login attempts before lockout', 1, 1),
('lockout_duration', '30', 'number', 'security', 'Account lockout duration in minutes', 1, 1),

-- Notification Settings
('email_order_confirmation', 'true', 'boolean', 'notifications', 'Send order confirmation emails', 1, 1),
('email_order_shipped', 'true', 'boolean', 'notifications', 'Send shipping notification emails', 1, 1),
('email_order_delivered', 'true', 'boolean', 'notifications', 'Send delivery confirmation emails', 1, 1),
('email_new_user_welcome', 'true', 'boolean', 'notifications', 'Send welcome email to new users', 1, 1),
('email_password_reset', 'true', 'boolean', 'notifications', 'Send password reset emails', 1, 1),
('email_offer_notifications', 'true', 'boolean', 'notifications', 'Send promotional offer emails', 1, 1)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

-- ============================================================
-- Sample Activity Logs (Optional - for testing)
-- ============================================================
-- INSERT INTO `activity_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`) VALUES
-- (1, 'LOGIN', 'user', '1', '{"method": "email_password"}', '127.0.0.1'),
-- (1, 'UPDATE_SETTING', 'setting', 'site_name', '{"oldValue": "Old Name", "newValue": "ShopSphere"}', '127.0.0.1');
