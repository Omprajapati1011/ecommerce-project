-- ============================================================
-- Migration: Add Modifier Combinations (Option B)
-- Run this ONCE before deploying the combination feature.
-- ============================================================

-- 1. Combination header — one row per combo (e.g. "Black + 8 GB")
DROP TABLE IF EXISTS modifier_combination_items;
DROP TABLE IF EXISTS modifier_combination;

CREATE TABLE modifier_combination (
  combination_id      INT AUTO_INCREMENT PRIMARY KEY,
  product_id          INT NOT NULL,
  product_portion_id  INT NULL,          -- NULL when product has no portions
  name                VARCHAR(255) NOT NULL,       -- auto-generated: "Black + 8 GB"
  additional_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock               INT NOT NULL DEFAULT 0,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted          TINYINT(1) NOT NULL DEFAULT 0,
  created_by          INT NULL,
  updated_by          INT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mc_product  (product_id),
  INDEX idx_mc_portion  (product_portion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Combination items — which modifier_ids make up a combination
CREATE TABLE modifier_combination_items (
  item_id          INT AUTO_INCREMENT PRIMARY KEY,
  combination_id   INT NOT NULL,
  modifier_id      INT NOT NULL,
  UNIQUE KEY uq_combo_modifier (combination_id, modifier_id),
  CONSTRAINT fk_mci_combination FOREIGN KEY (combination_id)
    REFERENCES modifier_combination (combination_id) ON DELETE CASCADE,
  CONSTRAINT fk_mci_modifier FOREIGN KEY (modifier_id)
    REFERENCES modifier_master (modifier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Add combination_id to cart_items
ALTER TABLE cart_items ADD COLUMN combination_id INT NULL AFTER modifier_id;
ALTER TABLE cart_items ADD INDEX idx_ci_combination (combination_id);
