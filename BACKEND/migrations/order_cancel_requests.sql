CREATE TABLE IF NOT EXISTS `order_cancel_requests` (
  `request_id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `reason` TEXT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `admin_note` TEXT NULL,
  `reviewed_by` INT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `idx_order_cancel_requests_order_id` (`order_id`),
  KEY `idx_order_cancel_requests_user_id` (`user_id`),
  KEY `idx_order_cancel_requests_status` (`status`),
  CONSTRAINT `fk_order_cancel_requests_order`
    FOREIGN KEY (`order_id`) REFERENCES `order_master` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_cancel_requests_user`
    FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_cancel_requests_reviewed_by`
    FOREIGN KEY (`reviewed_by`) REFERENCES `user_master` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
