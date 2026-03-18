-- MySQL dump - Merged Schema
-- Database: ecommerce_accrete
-- Merged from: ommm.sql, ecommerce-accrete.sql, offer_updated_schema.txt, db_schema_user.sql
-- Generated: 2026-02-19
--
-- Changes merged: 
--   [ommm.sql]              Added product_images table
--   [ommm.sql]              Added review_helpful table
--   [ommm.sql]              offer_master: added category_id, product_id columns + FKs
--   [ommm.sql]              offer_usage: added usage_count column
--   [ecommerce-accrete.sql] Added offer_product_category table
--   [ecommerce-accrete.sql] cart_items: added offer_id column
--   [ecommerce-accrete.sql] cart_master: added offer_id, discount_amount columns
--   [db_schema_user.sql]    user_master: added is_blocked, refresh_token columns
-- ------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ============================================================
-- Table: user_master
-- Changes: Added is_blocked (db_schema_user.sql) and refresh_token (db_schema_user.sql)
-- ============================================================

DROP TABLE IF EXISTS `user_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_master` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `is_deleted` tinyint(1) DEFAULT '0',
  `is_blocked` tinyint(1) DEFAULT '0',
  `refresh_token` text DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: category_master
-- ============================================================

DROP TABLE IF EXISTS `category_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_master` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `parent_id` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  KEY `idx_categories_parent` (`parent_id`),
  KEY `fk_categories_created_by` (`created_by`),
  KEY `fk_categories_updated_by` (`updated_by`),
  CONSTRAINT `fk_categories_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `category_master` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_categories_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: portion_master
-- ============================================================

DROP TABLE IF EXISTS `portion_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portion_master` (
  `portion_id` int NOT NULL AUTO_INCREMENT,
  `portion_value` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`portion_id`),
  KEY `fk_portions_created_by` (`created_by`),
  KEY `fk_portions_updated_by` (`updated_by`),
  CONSTRAINT `fk_portions_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_portions_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: modifier_master
-- ============================================================

DROP TABLE IF EXISTS `modifier_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modifier_master` (
  `modifier_id` int NOT NULL AUTO_INCREMENT,
  `modifier_name` varchar(100) NOT NULL,
  `modifier_value` varchar(100) NOT NULL,
  `additional_price` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`modifier_id`),
  KEY `fk_modifiers_created_by` (`created_by`),
  KEY `fk_modifiers_updated_by` (`updated_by`),
  CONSTRAINT `fk_modifiers_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_modifiers_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: product_master
-- ============================================================

DROP TABLE IF EXISTS `product_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_master` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text,
  `short_description` varchar(500) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `discounted_price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `category_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  KEY `idx_products_category` (`category_id`),
  KEY `fk_products_created_by` (`created_by`),
  KEY `fk_products_updated_by` (`updated_by`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `category_master` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_products_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: product_portion
-- ============================================================

DROP TABLE IF EXISTS `product_portion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_portion` (
  `product_portion_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `portion_id` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discounted_price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_portion_id`),
  UNIQUE KEY `unique_product_portion` (`product_id`,`portion_id`),
  KEY `fk_product_portion_portion` (`portion_id`),
  KEY `fk_product_portion_created_by` (`created_by`),
  KEY `fk_product_portion_updated_by` (`updated_by`),
  CONSTRAINT `fk_product_portion_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_product_portion_portion` FOREIGN KEY (`portion_id`) REFERENCES `portion_master` (`portion_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_portion_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_portion_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: modifier_portion
-- ============================================================

DROP TABLE IF EXISTS `modifier_portion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modifier_portion` (
  `modifier_portion_id` int NOT NULL AUTO_INCREMENT,
  `modifier_id` int NOT NULL,
  `product_portion_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `additional_price` decimal(10,2) DEFAULT '0.00',
  `stock` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`modifier_portion_id`),
  UNIQUE KEY `unique_modifier_product_portion` (`modifier_id`,`product_portion_id`),
  UNIQUE KEY `unique_modifier_product` (`modifier_id`,`product_id`),
  KEY `fk_modifier_portion_product_portion` (`product_portion_id`),
  KEY `fk_modifier_portion_product` (`product_id`),
  KEY `fk_modifier_portion_created_by` (`created_by`),
  KEY `fk_modifier_portion_updated_by` (`updated_by`),
  CONSTRAINT `fk_modifier_portion_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_modifier_portion_modifier` FOREIGN KEY (`modifier_id`) REFERENCES `modifier_master` (`modifier_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_modifier_portion_product_portion` FOREIGN KEY (`product_portion_id`) REFERENCES `product_portion` (`product_portion_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_modifier_portion_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_modifier_portion_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: product_categories
-- ============================================================

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `product_id` int NOT NULL,
  `category_id` int NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`,`category_id`),
  KEY `fk_product_categories_category` (`category_id`),
  KEY `fk_product_categories_created_by` (`created_by`),
  KEY `fk_product_categories_updated_by` (`updated_by`),
  CONSTRAINT `fk_product_categories_category` FOREIGN KEY (`category_id`) REFERENCES `category_master` (`category_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_categories_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_product_categories_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_categories_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: product_images  [NEW - from ommm.sql]
-- ============================================================

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `product_portion_id` int DEFAULT NULL,
  `modifier_portion_id` int DEFAULT NULL,
  `image_level` enum('PRODUCT','PORTION','MODIFIER','VARIANT') NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `public_id` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `fk_img_product_portion` (`product_portion_id`),
  KEY `fk_img_modifier_portion` (`modifier_portion_id`),
  KEY `fk_img_created_by` (`created_by`),
  KEY `fk_img_updated_by` (`updated_by`),
  KEY `idx_lookup` (`product_id`,`product_portion_id`,`modifier_portion_id`,`image_level`),
  CONSTRAINT `fk_img_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_img_modifier_portion` FOREIGN KEY (`modifier_portion_id`) REFERENCES `modifier_portion` (`modifier_portion_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_img_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_img_product_portion` FOREIGN KEY (`product_portion_id`) REFERENCES `product_portion` (`product_portion_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_img_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: offer_master
-- Changes: Added category_id, product_id columns + FKs (from ommm.sql)
-- ============================================================

DROP TABLE IF EXISTS `offer_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_master` (
  `offer_id` int NOT NULL AUTO_INCREMENT,
  `offer_name` varchar(100) NOT NULL,
  `description` text,
  `offer_type` enum('first_order','time_based','flat_discount','category_discount','product_discount') NOT NULL,
  `discount_type` enum('percentage','fixed_amount') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `maximum_discount_amount` decimal(10,2) NOT NULL,
  `min_purchase_amount` decimal(10,2) DEFAULT '0.00',
  `usage_limit_per_user` int DEFAULT '1',
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`offer_id`),
  KEY `fk_offers_created_by` (`created_by`),
  KEY `fk_offers_updated_by` (`updated_by`),
  CONSTRAINT `fk_offers_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_offers_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: offer_product_category  [NEW - from ecommerce-accrete.sql]
-- ============================================================

DROP TABLE IF EXISTS `offer_product_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_product_category` (
  `offer_product_category_id` int NOT NULL AUTO_INCREMENT,
  `offer_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`offer_product_category_id`),
  KEY `fk_opc_offer` (`offer_id`),
  KEY `fk_opc_product` (`product_id`),
  KEY `fk_opc_category` (`category_id`),
  KEY `fk_opc_created_by` (`created_by`),
  KEY `fk_opc_updated_by` (`updated_by`),
  CONSTRAINT `fk_opc_offer` FOREIGN KEY (`offer_id`) REFERENCES `offer_master` (`offer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opc_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opc_category` FOREIGN KEY (`category_id`) REFERENCES `category_master` (`category_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opc_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_opc_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: user_addresses
-- ============================================================

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address_type` varchar(20) DEFAULT 'shipping',
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `country` varchar(100) DEFAULT 'USA',
  `is_default` tinyint(1) DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_user_addresses_user` (`user_id`),
  KEY `fk_user_addresses_created_by` (`created_by`),
  KEY `fk_user_addresses_updated_by` (`updated_by`),
  CONSTRAINT `fk_user_addresses_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_user_addresses_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: order_master
-- ============================================================

DROP TABLE IF EXISTS `order_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_master` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `address_id` int DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `order_status` enum('pending','processing','shipped','delivered','completed','cancelled','refunded') DEFAULT 'pending',
  `payment_status` enum('pending','processing','completed','failed','refunded') DEFAULT 'pending',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `idx_orders_number` (`order_number`),
  KEY `fk_orders_user` (`user_id`),
  KEY `fk_orders_address` (`address_id`),
  KEY `fk_orders_created_by` (`created_by`),
  KEY `fk_orders_updated_by` (`updated_by`),
  CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `user_addresses` (`address_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_orders_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: order_items
-- ============================================================

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_portion_id` int DEFAULT NULL,
  `modifier_id` int DEFAULT NULL,
  `product_name` varchar(100) NOT NULL,
  `portion_value` varchar(50) DEFAULT NULL,
  `modifier_value` varchar(100) DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_product` (`product_id`),
  KEY `fk_order_items_product_portion` (`product_portion_id`),
  KEY `fk_order_items_modifier` (`modifier_id`),
  KEY `fk_order_items_created_by` (`created_by`),
  KEY `fk_order_items_updated_by` (`updated_by`),
  CONSTRAINT `fk_order_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_order_items_modifier` FOREIGN KEY (`modifier_id`) REFERENCES `modifier_master` (`modifier_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `order_master` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_product_portion` FOREIGN KEY (`product_portion_id`) REFERENCES `product_portion` (`product_portion_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: offer_usage
-- Changes: Added usage_count column (from ommm.sql)
-- ============================================================

DROP TABLE IF EXISTS `offer_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_usage` (
  `offer_usage_id` int NOT NULL AUTO_INCREMENT,
  `offer_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` int NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`offer_usage_id`),
  KEY `fk_offer_usage_offer` (`offer_id`),
  KEY `fk_offer_usage_user` (`user_id`),
  KEY `fk_offer_usage_order` (`order_id`),
  KEY `fk_offer_usage_created_by` (`created_by`),
  KEY `fk_offer_usage_updated_by` (`updated_by`),
  CONSTRAINT `fk_offer_usage_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_offer_usage_offer` FOREIGN KEY (`offer_id`) REFERENCES `offer_master` (`offer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_usage_order` FOREIGN KEY (`order_id`) REFERENCES `order_master` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_usage_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_offer_usage_user` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: payment_master
-- ============================================================

DROP TABLE IF EXISTS `payment_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_master` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_method` enum('credit_card','debit_card','paypal','stripe','cash_on_delivery','bank_transfer') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `status` enum('pending','processing','completed','failed','refunded') DEFAULT 'pending',
  `payment_details` text,
  `gateway_response` text,
  `is_refunded` tinyint(1) DEFAULT '0',
  `refund_amount` decimal(10,2) DEFAULT '0.00',
  `processing_started_at` timestamp NULL DEFAULT NULL,
  `succeeded_at` timestamp NULL DEFAULT NULL,
  `failed_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payments_order` (`order_id`),
  KEY `fk_payments_created_by` (`created_by`),
  KEY `fk_payments_updated_by` (`updated_by`),
  CONSTRAINT `fk_payments_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `order_master` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: cart_master
-- Changes: Added offer_id, discount_amount columns (from ecommerce-accrete.sql)
-- ============================================================

DROP TABLE IF EXISTS `cart_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_master` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `offer_id` int DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  KEY `fk_carts_user` (`user_id`),
  KEY `fk_cart_master_offer` (`offer_id`),
  KEY `fk_carts_created_by` (`created_by`),
  KEY `fk_carts_updated_by` (`updated_by`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_master_offer` FOREIGN KEY (`offer_id`) REFERENCES `offer_master` (`offer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_carts_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_carts_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: cart_items
-- Changes: Added offer_id column (from ecommerce-accrete.sql)
-- ============================================================

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `cart_item_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_portion_id` int DEFAULT NULL,
  `modifier_id` int DEFAULT NULL,
  `offer_id` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_item_id`),
  KEY `fk_cart_items_cart` (`cart_id`),
  KEY `fk_cart_items_product` (`product_id`),
  KEY `fk_cart_items_product_portion` (`product_portion_id`),
  KEY `fk_cart_items_modifier` (`modifier_id`),
  KEY `fk_cart_items_offer` (`offer_id`),
  KEY `fk_cart_items_created_by` (`created_by`),
  KEY `fk_cart_items_updated_by` (`updated_by`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `cart_master` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_cart_items_modifier` FOREIGN KEY (`modifier_id`) REFERENCES `modifier_master` (`modifier_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cart_items_offer` FOREIGN KEY (`offer_id`) REFERENCES `offer_master` (`offer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product_portion` FOREIGN KEY (`product_portion_id`) REFERENCES `product_portion` (`product_portion_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: product_reviews
-- ============================================================

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `rating` tinyint NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `review_text` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `is_verified_purchase` tinyint(1) DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `fk_reviews_product` (`product_id`),
  KEY `fk_reviews_user` (`user_id`),
  KEY `fk_reviews_order` (`order_id`),
  KEY `fk_reviews_created_by` (`created_by`),
  KEY `fk_reviews_updated_by` (`updated_by`),
  CONSTRAINT `fk_reviews_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `order_master` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `product_master` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user_master` (`user_id`),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ============================================================
-- Table: review_helpful  [NEW - from ommm.sql]
-- ============================================================

DROP TABLE IF EXISTS `review_helpful`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_helpful` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review_user` (`review_id`,`user_id`),
  KEY `fk_review_helpful_user` (`user_id`),
  CONSTRAINT `fk_review_helpful_review` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`review_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_helpful_user` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-19

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
  KEY `idx_category` (`category`)
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
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default settings
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `created_by`, `updated_by`) VALUES
('site_name', 'ShopSphere', 'string', 'general', 'Website name', 1, 1),
('default_currency', 'INR', 'currency', 'store', 'Default currency', 1, 1),
('tax_rate', '18', 'number', 'store', 'Tax rate percentage', 1, 1)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
