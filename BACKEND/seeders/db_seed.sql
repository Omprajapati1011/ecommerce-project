-- Ecommerce project seed data
-- NOTE: This script is intended for development / testing only.
-- It will truncate data from the relevant tables and insert a small,
-- consistent dataset that satisfies all foreign key constraints.

SET FOREIGN_KEY_CHECKS = 0;

-- Truncate child tables first, then parents
TRUNCATE TABLE payments;
TRUNCATE TABLE offer_usage;
TRUNCATE TABLE offer_master;
TRUNCATE TABLE product_reviews;
TRUNCATE TABLE order_items;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE modifiers_master;
TRUNCATE TABLE portions_master;
TRUNCATE TABLE product_categories;
TRUNCATE TABLE orders_master;
TRUNCATE TABLE carts_master;
TRUNCATE TABLE products_master;
TRUNCATE TABLE category_master;
TRUNCATE TABLE user_addresses;
TRUNCATE TABLE users;

-- =====================
-- Users
-- =====================

INSERT INTO users (user_id, name, email, password, role, is_deleted, created_by, updated_by)
VALUES
  (1, 'Admin User', 'admin@example.com', 'admin123', 'admin', 0, NULL, NULL),
  (2, 'Alice Customer', 'alice@example.com', 'password123', 'customer', 0, 1, 1),
  (3, 'Bob Customer', 'bob@example.com', 'password123', 'customer', 0, 1, 1);

-- =====================
-- User Addresses
-- =====================

INSERT INTO user_addresses (
  address_id,
  user_id,
  address_type,
  full_name,
  phone,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  country,
  is_default,
  is_deleted
) VALUES
  (1, 2, 'shipping', 'Alice Customer', '9999999999', '123 Main Street', 'Near City Park', 'Mumbai', 'MH', '400001', 'India', 1, 0),
  (2, 3, 'shipping', 'Bob Customer', '8888888888', '456 Market Road', 'Opp. Mall', 'Delhi', 'DL', '110001', 'India', 1, 0);

-- =====================
-- Categories (category_master)
-- =====================

INSERT INTO category_master (
  category_id,
  category_name,
  parent_id,
  is_deleted,
  created_by,
  updated_by
) VALUES
  (1, 'Electronics', NULL, 0, 1, 1),
  (2, 'Phones', 1, 0, 1, 1),
  (3, 'TVs', 1, 0, 1, 1),
  (4, 'Laptops', 1, 0, 1, 1),
  (5, 'Wearables', 1, 0, 1, 1),
  (6, 'Accessories', 1, 0, 1, 1),
  (7, 'Apple Phones', 2, 0, 1, 1),
  (8, 'Samsung Phones', 2, 0, 1, 1),
  (9, 'Xiaomi Phones', 2, 0, 1, 1),
  (10, 'Samsung TVs', 3, 0, 1, 1),
  (11, 'LG TVs', 3, 0, 1, 1),
  (12, 'Sony TVs', 3, 0, 1, 1),
  (13, 'Gaming Laptops', 4, 0, 1, 1),
  (14, 'Ultrabooks', 4, 0, 1, 1),
  (15, 'Smartwatches', 5, 0, 1, 1),
  (16, 'Fitness Bands', 5, 0, 1, 1),
  (17, 'Phone Cases', 6, 0, 1, 1),
  (18, 'Chargers & Cables', 6, 0, 1, 1),
  (19, 'Headphones & Earbuds', 6, 0, 1, 1);

-- =====================
-- Products (products_master)
-- =====================

INSERT INTO products_master (
  product_id,
  name,
  display_name,
  description,
  short_description,
  price,
  discounted_price,
  stock,
  category_id,
  is_active,
  is_deleted,
  created_by,
  updated_by
) VALUES
  (
    1,
    'iphone_15',
    'Apple iPhone 15',
    'Latest generation smartphone with A17 chip.',
    'Apple iPhone 15 128 GB',
    999.00,
    949.00,
    50,
    3,
    1,
    0,
    1,
    1
  ),
  (
    2,
    'dell_xps_13',
    'Dell XPS 13',
    '13-inch ultrabook laptop with Intel i7 processor.',
    'Dell XPS 13 16GB RAM',
    1299.00,
    1199.00,
    30,
    4,
    1,
    0,
    1,
    1
  ),
  (
    3,
    'mens_tshirt',
    'Men''s Cotton T-Shirt',
    'Comfortable cotton T-shirt for men.',
    'Men''s T-Shirt - Black',
    19.99,
    14.99,
    200,
    5,
    1,
    0,
    1,
    1
  ),
  (
    4,
    'womens_dress',
    'Women''s Summer Dress',
    'Lightweight summer dress for women.',
    'Women''s Floral Dress',
    59.99,
    49.99,
    120,
    1,
    1,
    0,
    1,
    1
  );

DELIMITER $$

DROP PROCEDURE IF EXISTS seed_additional_products $$
CREATE PROCEDURE seed_additional_products()
BEGIN
  DECLARE i INT;

  -- Apple phones (50)
  SET i = 1;
  WHILE i <= 50 DO
    INSERT INTO products_master (
      name,
      display_name,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      category_id,
      is_active,
      is_deleted,
      created_by,
      updated_by
    ) VALUES (
      CONCAT('apple_phone_', i),
      CONCAT('Apple Phone Model ', i),
      CONCAT('Apple smartphone model ', i, ' with powerful performance.'),
      CONCAT('Apple phone ', i),
      600.00 + (i * 5),
      550.00 + (i * 5),
      100,
      7,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Samsung phones (50)
  SET i = 1;
  WHILE i <= 50 DO
    INSERT INTO products_master (
      name,
      display_name,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      category_id,
      is_active,
      is_deleted,
      created_by,
      updated_by
    ) VALUES (
      CONCAT('samsung_phone_', i),
      CONCAT('Samsung Phone Model ', i),
      CONCAT('Samsung smartphone model ', i, ' with large display.'),
      CONCAT('Samsung phone ', i),
      500.00 + (i * 4),
      450.00 + (i * 4),
      120,
      8,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Xiaomi phones (50)
  SET i = 1;
  WHILE i <= 50 DO
    INSERT INTO products_master (
      name,
      display_name,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      category_id,
      is_active,
      is_deleted,
      created_by,
      updated_by
    ) VALUES (
      CONCAT('xiaomi_phone_', i),
      CONCAT('Xiaomi Phone Model ', i),
      CONCAT('Xiaomi smartphone model ', i, ' with value pricing.'),
      CONCAT('Xiaomi phone ', i),
      300.00 + (i * 3),
      260.00 + (i * 3),
      150,
      9,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Samsung TVs (20)
  SET i = 1;
  WHILE i <= 20 DO
    INSERT INTO products_master (
      name,
      display_name,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      category_id,
      is_active,
      is_deleted,
      created_by,
      updated_by
    ) VALUES (
      CONCAT('samsung_tv_', i),
      CONCAT('Samsung TV ', i, ' Series'),
      CONCAT('Samsung smart TV series ', i, ' with 4K display.'),
      CONCAT('Samsung 4K TV ', i),
      700.00 + (i * 10),
      650.00 + (i * 10),
      40,
      10,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- LG TVs (20)
  SET i = 1;
  WHILE i <= 20 DO
    INSERT INTO products_master (
      name,
      display_name,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      category_id,
      is_active,
      is_deleted,
      created_by,
      updated_by
    ) VALUES (
      CONCAT('lg_tv_', i),
      CONCAT('LG TV ', i, ' Series'),
      CONCAT('LG smart TV series ', i, ' with vivid colors.'),
      CONCAT('LG 4K TV ', i),
      650.00 + (i * 9),
      600.00 + (i * 9),
      35,
      11,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Smartwatches (20)
  SET i = 1;
  WHILE i <= 20 DO
    INSERT INTO products_master (
      name,
      display_name,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      category_id,
      is_active,
      is_deleted,
      created_by,
      updated_by
    ) VALUES (
      CONCAT('smartwatch_', i),
      CONCAT('Smartwatch Series ', i),
      CONCAT('Smartwatch series ', i, ' with fitness tracking.'),
      CONCAT('Smartwatch ', i),
      150.00 + (i * 2),
      130.00 + (i * 2),
      80,
      15,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Fitness Bands (20)
  SET i = 1;
  WHILE i <= 20 DO
    INSERT INTO products_master (
      name,
      display_name,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      category_id,
      is_active,
      is_deleted,
      created_by,
      updated_by
    ) VALUES (
      CONCAT('fitness_band_', i),
      CONCAT('Fitness Band Model ', i),
      CONCAT('Fitness band model ', i, ' with heart rate monitoring.'),
      CONCAT('Fitness band ', i),
      80.00 + i,
      70.00 + i,
      90,
      16,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;
END $$
DELIMITER ;

CALL seed_additional_products();

-- =====================
-- Product Categories (many-to-many)
-- =====================

INSERT INTO product_categories (
  product_id,
  category_id
) VALUES
  (1, 1), -- iPhone in Electronics
  (1, 3), -- iPhone in Mobiles
  (2, 1), -- XPS in Electronics
  (2, 4), -- XPS in Laptops
  (3, 2), -- T-shirt in Clothing
  (3, 5), -- T-shirt in Men Clothing
  (4, 2), -- Dress in Clothing
  (4, 6); -- Dress in Women Clothing

-- =====================
-- Carts (carts_master)
-- =====================

INSERT INTO carts_master (
  cart_id,
  user_id
) VALUES
  (1, 2), -- Alice
  (2, 3); -- Bob

-- =====================
-- Cart Items
-- =====================

INSERT INTO cart_items (
  cart_item_id,
  cart_id,
  product_id,
  quantity,
  price
) VALUES
  (1, 1, 1, 1, 949.00),   -- Alice: iPhone (discounted)
  (2, 1, 3, 2, 14.99),    -- Alice: 2x T-shirts
  (3, 2, 2, 1, 1199.00),  -- Bob: Dell XPS
  (4, 2, 4, 1, 49.99);    -- Bob: Dress

-- =====================
-- Orders (orders_master)
-- =====================

INSERT INTO orders_master (
  order_id,
  order_number,
  user_id,
  address_id,
  subtotal,
  tax_amount,
  shipping_amount,
  discount_amount,
  total_amount,
  order_status,
  payment_status,
  is_deleted,
  created_by,
  updated_by
) VALUES
  (
    1,
    'ORD-1001',
    2,
    1,
    978.98,
    50.00,
    20.00,
    80.00,
    968.98,
    'completed',
    'completed',
    0,
    1,
    1
  ),
  (
    2,
    'ORD-1002',
    3,
    2,
    1248.99,
    75.00,
    25.00,
    50.00,
    1298.99,
    'delivered',
    'completed',
    0,
    1,
    1
  );

-- =====================
-- Order Items
-- =====================

INSERT INTO order_items (
  order_item_id,
  order_id,
  product_id,
  product_name,
  quantity,
  price,
  discount,
  tax,
  total
) VALUES
  (1, 1, 1, 'Apple iPhone 15', 1, 949.00, 0.00, 50.00, 999.00),
  (2, 1, 3, 'Men''s Cotton T-Shirt', 2, 14.99, 10.00, 0.00, 19.98),
  (3, 2, 2, 'Dell XPS 13', 1, 1199.00, 50.00, 75.00, 1224.00),
  (4, 2, 4, 'Women''s Summer Dress', 1, 49.99, 0.00, 0.00, 49.99);

-- =====================
-- Modifiers (modifiers_master)
-- =====================

INSERT INTO modifiers_master (
  modifier_id,
  product_id,
  modifier_name,
  modifier_value,
  stock,
  is_active,
  is_deleted,
  created_by,
  updated_by
) VALUES
  (1, 3, 'Size', 'M', 50, 1, 0, 1, 1),
  (2, 3, 'Size', 'L', 50, 1, 0, 1, 1),
  (3, 4, 'Size', 'S', 40, 1, 0, 1, 1),
  (4, 4, 'Size', 'M', 40, 1, 0, 1, 1);

-- =====================
-- Portions (portions_master)
-- =====================

INSERT INTO portions_master (
  portion_id,
  product_id,
  portion_value,
  price,
  stock,
  is_active,
  is_deleted,
  created_by,
  updated_by
) VALUES
  (1, 1, '128 GB', 949.00, 30, 1, 0, 1, 1),
  (2, 1, '256 GB', 1049.00, 20, 1, 0, 1, 1),
  (3, 2, '256 GB SSD', 1199.00, 15, 1, 0, 1, 1),
  (4, 2, '512 GB SSD', 1399.00, 15, 1, 0, 1, 1);

-- =====================
-- Offers (offer_master)
-- =====================

INSERT INTO offer_master (
  offer_id,
  offer_name,
  description,
  offer_type,
  discount_type,
  discount_value,
  maximum_discount_amount,
  min_purchase_amount,
  usage_limit_per_user,
  category_id,
  product_id,
  start_date,
  end_date,
  start_time,
  end_time,
  is_active,
  is_deleted,
  created_by,
  updated_by
) VALUES
  (
    1,
    '10% off first order',
    'Get 10% discount on your first order.',
    'first_order',
    'percentage',
    10.00,
    100.00,
    500.00,
    1,
    NULL,
    NULL,
    '2025-01-01 00:00:00',
    '2025-12-31 23:59:59',
    NULL,
    NULL,
    1,
    0,
    1,
    1
  ),
  (
    2,
    '5% off Electronics',
    'Category discount for all electronics products.',
    'category_discount',
    'percentage',
    5.00,
    200.00,
    1000.00,
    5,
    1,
    NULL,
    '2025-01-01 00:00:00',
    '2025-12-31 23:59:59',
    NULL,
    NULL,
    1,
    0,
    1,
    1
  ),
  (
    3,
    'Flat 100 off iPhone 15',
    'Flat discount on Apple iPhone 15.',
    'product_discount',
    'fixed_amount',
    100.00,
    100.00,
    900.00,
    3,
    NULL,
    1,
    '2025-01-01 00:00:00',
    '2025-12-31 23:59:59',
    NULL,
    NULL,
    1,
    0,
    1,
    1
  );

-- =====================
-- Offer Usage
-- =====================

INSERT INTO offer_usage (
  offer_usage_id,
  offer_id,
  user_id,
  order_id,
  discount_amount,
  usage_count
) VALUES
  (1, 1, 2, 1, 80.00, 1),
  (2, 2, 3, 2, 50.00, 1);

-- =====================
-- Product Reviews
-- =====================

INSERT INTO product_reviews (
  review_id,
  product_id,
  user_id,
  order_id,
  rating,
  title,
  review_text,
  status,
  is_verified_purchase,
  helpful_count
) VALUES
  (
    1,
    1,
    2,
    1,
    5,
    'Excellent phone',
    'The iPhone 15 is fast and has a great camera.',
    'approved',
    1,
    3
  ),
  (
    2,
    2,
    3,
    2,
    4,
    'Solid laptop',
    'Great performance for work and light gaming.',
    'approved',
    1,
    1
  );

-- =====================
-- Payments
-- =====================

INSERT INTO payments (
  payment_id,
  order_id,
  transaction_id,
  payment_method,
  amount,
  currency,
  status,
  payment_details,
  gateway_response,
  is_refunded,
  refund_amount
) VALUES
  (
    1,
    1,
    'TXN-1001',
    'credit_card',
    968.98,
    'INR',
    'completed',
    'Paid with Visa ending 4242',
    'OK',
    0,
    0.00
  ),
  (
    2,
    2,
    'TXN-1002',
    'cash_on_delivery',
    1298.99,
    'INR',
    'completed',
    'Cash collected on delivery',
    'OK',
    0,
    0.00
  );

SET FOREIGN_KEY_CHECKS = 1;
