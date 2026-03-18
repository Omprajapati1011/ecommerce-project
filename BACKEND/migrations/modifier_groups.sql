-- Migration: Modifier Groups + Junction Table
-- Run these three statements in order.
-- cart_items.modifier_id is kept for backward compatibility (new rows write NULL).

-- 1. Add modifier_type group label to modifier_master
ALTER TABLE modifier_master
  ADD COLUMN modifier_type VARCHAR(50) NULL AFTER modifier_value;

-- 2. Add denormalized modifier_key to cart_items for fast lookup
--    Value: sorted comma-joined selected modifier IDs, e.g. "2,4". NULL = no modifiers.
ALTER TABLE cart_items
  ADD COLUMN modifier_key VARCHAR(200) NULL AFTER modifier_id;

-- 3. Junction table: stores each selected modifier per cart item
CREATE TABLE cart_item_modifiers (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_item_id INT UNSIGNED NOT NULL,
  modifier_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_modifier (cart_item_id, modifier_id),
  CONSTRAINT fk_cim_cart_item FOREIGN KEY (cart_item_id) REFERENCES cart_items(cart_item_id) ON DELETE CASCADE,
  CONSTRAINT fk_cim_modifier  FOREIGN KEY (modifier_id)  REFERENCES modifier_master(modifier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
