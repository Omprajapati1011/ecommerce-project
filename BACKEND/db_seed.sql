-- Ecommerce project seed data - Flipkart-style phone hierarchy (India)
-- NOTE: This script is intended for development / testing only.
-- It will truncate data from the relevant tables and insert a rich,
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
  (2, 'Rahul Sharma', 'rahul@example.com', 'password123', 'customer', 0, 1, 1),
  (3, 'Priya Singh', 'priya@example.com', 'password123', 'customer', 0, 1, 1);

-- =====================
-- User Addresses (India)
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
  (1, 2, 'shipping', 'Rahul Sharma', '9876543210', '101 MG Road', 'Near Metro Station', 'Bengaluru', 'KA', '560001', 'India', 1, 0),
  (2, 3, 'shipping', 'Priya Singh', '9123456780', '202 Marine Drive', 'Sea View Apartments', 'Mumbai', 'MH', '400001', 'India', 1, 0);

-- =====================
-- Categories (category_master)
-- Phones > Android/iPhone > Brand > Series
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
  (3, 'Android Phones', 2, 0, 1, 1),
  (4, 'iPhones', 2, 0, 1, 1),

  -- Android brands under Android Phones
  (5, 'Samsung Phones', 3, 0, 1, 1),
  (6, 'Xiaomi Phones', 3, 0, 1, 1),
  (7, 'OnePlus Phones', 3, 0, 1, 1),

  -- Series under Samsung Phones
  (8, 'Samsung Galaxy S Series', 5, 0, 1, 1),
  (9, 'Samsung Galaxy A Series', 5, 0, 1, 1),

  -- Series under Xiaomi Phones
  (10, 'Redmi Note Series', 6, 0, 1, 1),
  (11, 'Poco Series', 6, 0, 1, 1),

  -- Series under OnePlus Phones
  (12, 'OnePlus Number Series', 7, 0, 1, 1),
  (13, 'OnePlus Nord Series', 7, 0, 1, 1),

  -- iPhone series under iPhones
  (14, 'iPhone 13 Series', 4, 0, 1, 1),
  (15, 'iPhone 14 Series', 4, 0, 1, 1),
  (16, 'iPhone 15 Series', 4, 0, 1, 1),

  -- Other electronics under Electronics
  (17, 'Televisions', 1, 0, 1, 1),
  (18, 'Smart TVs', 17, 0, 1, 1),
  (19, 'LED TVs', 17, 0, 1, 1),

  (20, 'Wearables', 1, 0, 1, 1),
  (21, 'Smartwatches', 20, 0, 1, 1),
  (22, 'Fitness Bands', 20, 0, 1, 1),

  (23, 'Accessories', 1, 0, 1, 1),
  (24, 'Phone Cases', 23, 0, 1, 1),
  (25, 'Chargers & Cables', 23, 0, 1, 1),
  (26, 'Headphones & Earbuds', 23, 0, 1, 1),

  -- Fashion root and hierarchy
  (27, 'Fashion', NULL, 0, 1, 1),
  (28, 'Men Fashion', 27, 0, 1, 1),
  (29, 'Women Fashion', 27, 0, 1, 1),
  (30, 'Kids Fashion', 27, 0, 1, 1),

  (31, 'Men Clothing', 28, 0, 1, 1),
  (32, 'Men Shoes', 28, 0, 1, 1),
  (33, 'Women Clothing', 29, 0, 1, 1),
  (34, 'Women Shoes', 29, 0, 1, 1),

  (35, 'Men T-Shirts', 31, 0, 1, 1),
  (36, 'Men Jeans', 31, 0, 1, 1),
  (37, 'Women Dresses', 33, 0, 1, 1),
  (38, 'Women Tops & Tees', 33, 0, 1, 1),

  (39, 'Men Sports Shoes', 32, 0, 1, 1),
  (40, 'Men Casual Shoes', 32, 0, 1, 1),
  (41, 'Women Heels', 34, 0, 1, 1),
  (42, 'Women Sneakers', 34, 0, 1, 1),

  -- Unisex fashion subtree
  (43, 'Unisex Clothing', 27, 0, 1, 1),
  (44, 'Unisex Sportswear', 43, 0, 1, 1),
  (45, 'Unisex Track Pants', 44, 0, 1, 1);

-- =====================
-- Core Products (featured phones)
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
    'iphone_15_pro_max',
    'Apple iPhone 15 Pro Max',
    'Flagship Apple smartphone with A17 chip and ProMotion display.',
    'iPhone 15 Pro Max 256 GB',
    159999.00,
    149999.00,
    25,
    16,
    1,
    0,
    1,
    1
  ),
  (
    2,
    'iphone_14',
    'Apple iPhone 14',
    'Powerful Apple smartphone with advanced camera system.',
    'iPhone 14 128 GB',
    79999.00,
    74999.00,
    40,
    15,
    1,
    0,
    1,
    1
  ),
  (
    3,
    'samsung_galaxy_s24_ultra',
    'Samsung Galaxy S24 Ultra',
    'Samsung flagship with high refresh rate AMOLED and quad camera.',
    'Galaxy S24 Ultra 256 GB',
    139999.00,
    129999.00,
    30,
    8,
    1,
    0,
    1,
    1
  ),
  (
    4,
    'samsung_galaxy_a55',
    'Samsung Galaxy A55',
    'Mid-range Samsung Galaxy A-series smartphone.',
    'Galaxy A55 128 GB',
    34999.00,
    29999.00,
    60,
    9,
    1,
    0,
    1,
    1
  ),
  (
    5,
    'redmi_note_13_pro',
    'Redmi Note 13 Pro',
    'Xiaomi Redmi Note series smartphone with great value.',
    'Redmi Note 13 Pro 8GB/256GB',
    27999.00,
    24999.00,
    80,
    10,
    1,
    0,
    1,
    1
  ),
  (
    6,
    'poco_x6',
    'POCO X6',
    'POCO X-series smartphone focused on performance.',
    'POCO X6 8GB/256GB',
    22999.00,
    20999.00,
    70,
    11,
    1,
    0,
    1,
    1
  ),
  (
    7,
    'oneplus_12',
    'OnePlus 12',
    'OnePlus flagship with fast charging and clean UI.',
    'OnePlus 12 12GB/256GB',
    64999.00,
    61999.00,
    35,
    12,
    1,
    0,
    1,
    1
  ),
  (
    8,
    'oneplus_nord_3',
    'OnePlus Nord 3',
    'Upper mid-range OnePlus Nord series smartphone.',
    'OnePlus Nord 3 8GB/128GB',
    32999.00,
    29999.00,
    55,
    13,
    1,
    0,
    1,
    1
  );

-- =====================
-- Generate additional phones for each series (200+ products total)
-- =====================

DELIMITER $$

DROP PROCEDURE IF EXISTS seed_additional_phones $$
CREATE PROCEDURE seed_additional_phones()
BEGIN
  DECLARE i INT;

  -- Samsung Galaxy S Series (20 models) - category_id = 8
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
      CONCAT('samsung_s_series_', i),
      CONCAT('Samsung Galaxy S', ' ', i),
      CONCAT('Samsung Galaxy S series model ', i, ' with premium features.'),
      CONCAT('Galaxy S', ' ', i),
      60000.00 + (i * 1000),
      55000.00 + (i * 1000),
      40,
      8,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Samsung Galaxy A Series (20 models) - category_id = 9
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
      CONCAT('samsung_a_series_', i),
      CONCAT('Samsung Galaxy A', ' ', i),
      CONCAT('Samsung Galaxy A series model ', i, ' with balanced specs.'),
      CONCAT('Galaxy A', ' ', i),
      20000.00 + (i * 800),
      18000.00 + (i * 800),
      60,
      9,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Redmi Note Series (30 models) - category_id = 10
  SET i = 1;
  WHILE i <= 30 DO
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
      CONCAT('redmi_note_', i),
      CONCAT('Redmi Note ', i),
      CONCAT('Redmi Note series phone ', i, ' with great value.'),
      CONCAT('Redmi Note ', i),
      12000.00 + (i * 500),
      11000.00 + (i * 500),
      80,
      10,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- POCO Series (20 models) - category_id = 11
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
      CONCAT('poco_series_', i),
      CONCAT('POCO ', i),
      CONCAT('POCO performance-focused phone ', i, '.'),
      CONCAT('POCO ', i),
      18000.00 + (i * 700),
      16500.00 + (i * 700),
      70,
      11,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- OnePlus Number Series (20 models) - category_id = 12
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
      CONCAT('oneplus_number_', i),
      CONCAT('OnePlus ', i),
      CONCAT('OnePlus flagship phone ', i, ' with OxygenOS.'),
      CONCAT('OnePlus ', i),
      35000.00 + (i * 1500),
      33000.00 + (i * 1500),
      50,
      12,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- Additional products: TVs, wearables, accessories, fashion
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
  ) VALUES
    -- Televisions
    (
      'samsung_55_qled_4k',
      'Samsung 55 inch QLED 4K Smart TV',
      'Samsung 55 inch QLED 4K Smart TV with HDR and voice assistant.',
      'Samsung 55" QLED 4K Smart TV',
      74999.00,
      69999.00,
      20,
      18,
      1,
      0,
      1,
      1
    ),
    (
      'lg_43_led_full_hd',
      'LG 43 inch Full HD LED TV',
      'LG 43 inch Full HD LED TV with vivid picture engine.',
      'LG 43" Full HD LED TV',
      29999.00,
      24999.00,
      25,
      19,
      1,
      0,
      1,
      1
    ),
    (
      'sony_65_oled_4k',
      'Sony Bravia 65 inch OLED 4K TV',
      'Sony Bravia 65 inch OLED 4K TV with Dolby Vision and Atmos.',
      'Sony 65" OLED 4K TV',
      189999.00,
      179999.00,
      10,
      18,
      1,
      0,
      1,
      1
    ),

    -- Wearables
    (
      'apple_watch_series_9',
      'Apple Watch Series 9 GPS 45mm',
      'Apple Watch Series 9 with health sensors and Always-On Retina display.',
      'Apple Watch Series 9 45mm',
      45999.00,
      42999.00,
      30,
      21,
      1,
      0,
      1,
      1
    ),
    (
      'galaxy_watch_6',
      'Samsung Galaxy Watch6 Bluetooth 44mm',
      'Samsung Galaxy Watch6 with AMOLED display and fitness tracking.',
      'Galaxy Watch6 44mm',
      28999.00,
      25999.00,
      40,
      21,
      1,
      0,
      1,
      1
    ),
    (
      'mi_smart_band_8',
      'Mi Smart Band 8',
      'Mi Smart Band 8 with AMOLED display and 150+ fitness modes.',
      'Mi Smart Band 8',
      3999.00,
      3499.00,
      100,
      22,
      1,
      0,
      1,
      1
    ),

    -- Accessories
    (
      'spigen_rugged_case_iphone_15',
      'Spigen Rugged Armor Case for iPhone 15',
      'Shock-absorbing TPU case for iPhone 15 with carbon fiber design.',
      'Spigen Rugged Armor iPhone 15',
      1999.00,
      1499.00,
      200,
      24,
      1,
      0,
      1,
      1
    ),
    (
      'oneplus_fast_charger',
      'OnePlus 80W SuperVOOC Charger',
      'OnePlus 80W SuperVOOC fast charger with Type-C cable.',
      'OnePlus 80W Charger',
      3499.00,
      2999.00,
      150,
      25,
      1,
      0,
      1,
      1
    ),
    (
      'boat_rockerz_450',
      'boAt Rockerz 450 Bluetooth Headphones',
      'Wireless on-ear headphones with 15 hours playback and deep bass.',
      'boAt Rockerz 450',
      2499.00,
      1999.00,
      120,
      26,
      1,
      0,
      1,
      1
    ),
    (
      'sony_wh_1000xm5',
      'Sony WH-1000XM5 Wireless Headphones',
      'Sony flagship noise-cancelling over-ear headphones.',
      'Sony WH-1000XM5',
      34999.00,
      32999.00,
      25,
      26,
      1,
      0,
      1,
      1
    ),

    -- Fashion: Men clothing and shoes
    (
      'mens_round_neck_tshirt',
      'Men''s Round Neck Cotton T-Shirt',
      'Regular fit round neck cotton T-shirt for men.',
      'Men''s Cotton T-Shirt',
      799.00,
      599.00,
      300,
      35,
      1,
      0,
      1,
      1
    ),
    (
      'mens_slim_fit_jeans',
      'Men''s Slim Fit Jeans',
      'Slim fit stretchable denim jeans for men.',
      'Men''s Slim Fit Jeans',
      1999.00,
      1599.00,
      180,
      36,
      1,
      0,
      1,
      1
    ),
    (
      'mens_sports_shoes',
      'Men''s Running Sports Shoes',
      'Lightweight running shoes with breathable mesh.',
      'Men''s Sports Shoes',
      2499.00,
      1999.00,
      120,
      39,
      1,
      0,
      1,
      1
    ),

    -- Fashion: Women clothing and shoes
    (
      'womens_floral_dress',
      'Women''s Floral A-Line Dress',
      'Knee-length floral A-line dress for women.',
      'Women''s Floral Dress',
      2499.00,
      1999.00,
      160,
      37,
      1,
      0,
      1,
      1
    ),
    (
      'womens_top_tee',
      'Women''s Casual Top & Tee',
      'Solid casual top and tee for everyday wear.',
      'Women''s Top & Tee',
      1299.00,
      999.00,
      200,
      38,
      1,
      0,
      1,
      1
    ),
    (
      'womens_heels',
      'Women''s Block Heels',
      'Comfortable block heels for women.',
      'Women''s Heels',
      2199.00,
      1799.00,
      90,
      41,
      1,
      0,
      1,
      1
    ),
    (
      'womens_sneakers',
      'Women''s Casual Sneakers',
      'Casual lace-up sneakers for women.',
      'Women''s Sneakers',
      2799.00,
      2299.00,
      110,
      42,
      1,
      0,
      1,
      1
    ),
    (
      'unisex_sports_pants',
      'Unisex Sports Track Pants',
      'Comfortable unisex sports track pants suitable for men and women.',
      'Unisex Sports Pants',
      1999.00,
      1599.00,
      220,
      45,
      1,
      0,
      1,
      1
    );

  -- OnePlus Nord Series (20 models) - category_id = 13
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
      CONCAT('oneplus_nord_series_', i),
      CONCAT('OnePlus Nord ', i),
      CONCAT('OnePlus Nord series phone ', i, ' for mid-range segment.'),
      CONCAT('Nord ', i),
      22000.00 + (i * 600),
      20000.00 + (i * 600),
      65,
      13,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- iPhone 13 Series (15 models) - category_id = 14
  SET i = 1;
  WHILE i <= 15 DO
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
      CONCAT('iphone_13_', i),
      CONCAT('iPhone 13 Model ', i),
      CONCAT('Apple iPhone 13 variant ', i, '.'),
      CONCAT('iPhone 13 ', i),
      60000.00 + (i * 2000),
      57000.00 + (i * 2000),
      40,
      14,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- iPhone 14 Series (15 models) - category_id = 15
  SET i = 1;
  WHILE i <= 15 DO
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
      CONCAT('iphone_14_', i),
      CONCAT('iPhone 14 Model ', i),
      CONCAT('Apple iPhone 14 variant ', i, '.'),
      CONCAT('iPhone 14 ', i),
      70000.00 + (i * 2500),
      66000.00 + (i * 2500),
      35,
      15,
      1,
      0,
      1,
      1
    );
    SET i = i + 1;
  END WHILE;

  -- iPhone 15 Series (15 models) - category_id = 16
  SET i = 1;
  WHILE i <= 15 DO
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
      CONCAT('iphone_15_', i),
      CONCAT('iPhone 15 Model ', i),
      CONCAT('Apple iPhone 15 variant ', i, '.'),
      CONCAT('iPhone 15 ', i),
      80000.00 + (i * 3000),
      76000.00 + (i * 3000),
      30,
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

CALL seed_additional_phones();

-- =====================
-- Product Categories (many-to-many)
-- Every product is mapped to: Electronics (1), Phones (2), and its leaf category
-- =====================

-- Map electronics products (Electronics subtree) to Electronics (1)
INSERT INTO product_categories (product_id, category_id)
SELECT p.product_id, 1
FROM products_master p
JOIN category_master c ON c.category_id = p.category_id
WHERE c.category_id BETWEEN 2 AND 26;

-- Map only phone products (Phones subtree) to Phones (2)
INSERT INTO product_categories (product_id, category_id)
SELECT p.product_id, 2
FROM products_master p
JOIN category_master c ON c.category_id = p.category_id
WHERE c.category_id BETWEEN 3 AND 16;

-- Map fashion products (Fashion subtree) to Fashion (27)
INSERT INTO product_categories (product_id, category_id)
SELECT p.product_id, 27
FROM products_master p
JOIN category_master c ON c.category_id = p.category_id
WHERE c.category_id BETWEEN 28 AND 45;

-- Map all products to their leaf category (series / brand / type level)
INSERT INTO product_categories (product_id, category_id)
SELECT product_id, category_id FROM products_master;

-- Extra mappings for unisex sports pants: visible under both Men and Women clothing
INSERT INTO product_categories (product_id, category_id)
SELECT p.product_id, 31 -- Men Clothing
FROM products_master p
WHERE p.name = 'unisex_sports_pants';

INSERT INTO product_categories (product_id, category_id)
SELECT p.product_id, 33 -- Women Clothing
FROM products_master p
WHERE p.name = 'unisex_sports_pants';

-- =====================
-- Carts (carts_master)
-- =====================

INSERT INTO carts_master (
  cart_id,
  user_id
) VALUES
  (1, 2), -- Rahul
  (2, 3); -- Priya

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
  (1, 1, 3, 1, 129999.00),   -- Rahul: Galaxy S24 Ultra (discounted)
  (2, 1, 5, 1, 24999.00),    -- Rahul: Redmi Note 13 Pro
  (3, 2, 1, 1, 149999.00),   -- Priya: iPhone 15 Pro Max
  (4, 2, 8, 1, 29999.00);    -- Priya: OnePlus Nord 3

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
    'ORD-2001',
    2,
    1,
    154998.00,
    7000.00,
    0.00,
    10000.00,
    151998.00,
    'completed',
    'completed',
    0,
    1,
    1
  ),
  (
    2,
    'ORD-2002',
    3,
    2,
    179998.00,
    9000.00,
    0.00,
    5000.00,
    183998.00,
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
  -- Order 1: Rahul's order
  (1, 1, 3, 'Samsung Galaxy S24 Ultra', 1, 129999.00, 5000.00, 6500.00, 131499.00),
  (2, 1, 5, 'Redmi Note 13 Pro', 1, 24999.00, 5000.00, 500.00, 20499.00),
  -- Order 2: Priya's order
  (3, 2, 1, 'Apple iPhone 15 Pro Max', 1, 149999.00, 5000.00, 7500.00, 152499.00),
  (4, 2, 8, 'OnePlus Nord 3', 1, 29999.00, 0.00, 1500.00, 31499.00);

-- =====================
-- Modifiers (modifiers_master)
-- =====================

INSERT INTO modifiers_master (
  product_id,
  modifier_name,
  modifier_value,
  stock,
  is_active,
  is_deleted,
  created_by,
  updated_by
)
-- iPhone 15 Pro Max colors
SELECT p.product_id, 'Color', 'Black', 15, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'iphone_15_pro_max'
UNION ALL
SELECT p.product_id, 'Color', 'Blue', 10, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'iphone_15_pro_max'
UNION ALL
SELECT p.product_id, 'Color', 'Natural Titanium', 8, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'iphone_15_pro_max'

-- Samsung Galaxy S24 Ultra colors
UNION ALL
SELECT p.product_id, 'Color', 'Titanium Gray', 12, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'samsung_galaxy_s24_ultra'
UNION ALL
SELECT p.product_id, 'Color', 'Titanium Black', 10, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'samsung_galaxy_s24_ultra'

-- Redmi Note 13 Pro RAM options
UNION ALL
SELECT p.product_id, 'RAM', '8 GB', 30, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'redmi_note_13_pro'
UNION ALL
SELECT p.product_id, 'RAM', '12 GB', 20, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'redmi_note_13_pro'

-- OnePlus 12 colors
UNION ALL
SELECT p.product_id, 'Color', 'Flowy Emerald', 15, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_12'
UNION ALL
SELECT p.product_id, 'Color', 'Silky Black', 15, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_12'

-- TVs: panel size modifiers
UNION ALL
SELECT p.product_id, 'Panel Size', '55 inch', 10, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'samsung_55_qled_4k'
UNION ALL
SELECT p.product_id, 'Panel Size', '43 inch', 15, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'lg_43_led_full_hd'
UNION ALL
SELECT p.product_id, 'Panel Size', '65 inch', 8, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'sony_65_oled_4k'

-- Apple Watch straps
UNION ALL
SELECT p.product_id, 'Strap Material', 'Silicone', 25, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'apple_watch_series_9'
UNION ALL
SELECT p.product_id, 'Strap Material', 'Metal', 15, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'apple_watch_series_9'

-- Galaxy Watch straps
UNION ALL
SELECT p.product_id, 'Strap Material', 'Silicone', 30, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'galaxy_watch_6'

-- Mi Smart Band colors
UNION ALL
SELECT p.product_id, 'Strap Color', 'Black', 40, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'mi_smart_band_8'
UNION ALL
SELECT p.product_id, 'Strap Color', 'Blue', 35, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'mi_smart_band_8'

-- Accessories
UNION ALL
SELECT p.product_id, 'Color', 'Matte Black', 50, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'spigen_rugged_case_iphone_15'
UNION ALL
SELECT p.product_id, 'Pack', 'Charger only', 60, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_fast_charger'
UNION ALL
SELECT p.product_id, 'Pack', 'Charger + Cable', 40, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_fast_charger'
UNION ALL
SELECT p.product_id, 'Color', 'Black', 80, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'boat_rockerz_450'
UNION ALL
SELECT p.product_id, 'Color', 'Black', 30, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'sony_wh_1000xm5';

-- =====================
-- Portions (portions_master) - storage variants
-- =====================

INSERT INTO portions_master (
  product_id,
  portion_value,
  price,
  stock,
  is_active,
  is_deleted,
  created_by,
  updated_by
)
-- iPhone 15 Pro Max storage variants
SELECT p.product_id, '256 GB', 149999.00, 10, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'iphone_15_pro_max'
UNION ALL
SELECT p.product_id, '512 GB', 169999.00, 6, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'iphone_15_pro_max'
UNION ALL
SELECT p.product_id, '1 TB', 189999.00, 3, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'iphone_15_pro_max'

-- Samsung Galaxy S24 Ultra storage
UNION ALL
SELECT p.product_id, '256 GB', 129999.00, 12, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'samsung_galaxy_s24_ultra'
UNION ALL
SELECT p.product_id, '512 GB', 149999.00, 8, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'samsung_galaxy_s24_ultra'

-- Redmi Note 13 Pro storage
UNION ALL
SELECT p.product_id, '128 GB', 22999.00, 30, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'redmi_note_13_pro'
UNION ALL
SELECT p.product_id, '256 GB', 24999.00, 25, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'redmi_note_13_pro'

-- POCO X6 storage
UNION ALL
SELECT p.product_id, '128 GB', 19999.00, 25, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'poco_x6'
UNION ALL
SELECT p.product_id, '256 GB', 20999.00, 20, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'poco_x6'

-- OnePlus 12 storage
UNION ALL
SELECT p.product_id, '256 GB', 61999.00, 15, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_12'
UNION ALL
SELECT p.product_id, '512 GB', 69999.00, 10, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_12'

-- OnePlus Nord 3 storage
UNION ALL
SELECT p.product_id, '128 GB', 27999.00, 25, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_nord_3'
UNION ALL
SELECT p.product_id, '256 GB', 29999.00, 20, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'oneplus_nord_3'

-- TVs as size portions
UNION ALL
SELECT p.product_id, '55 inch', 69999.00, 10, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'samsung_55_qled_4k'
UNION ALL
SELECT p.product_id, '43 inch', 24999.00, 15, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'lg_43_led_full_hd'
UNION ALL
SELECT p.product_id, '65 inch', 179999.00, 6, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'sony_65_oled_4k'

-- Apple Watch case sizes
UNION ALL
SELECT p.product_id, '41 mm', 40999.00, 10, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'apple_watch_series_9'
UNION ALL
SELECT p.product_id, '45 mm', 42999.00, 20, 1, 0, 1, 1
FROM products_master p WHERE p.name = 'apple_watch_series_9';

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
    '10% off all phones',
    'Get 10% discount on all phones above ₹10,000.',
    'category_discount',
    'percentage',
    10.00,
    5000.00,
    10000.00,
    3,
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
    2,
    '₹2000 off Android phones',
    'Flat ₹2000 discount on Android phones above ₹15,000.',
    'category_discount',
    'fixed_amount',
    2000.00,
    2000.00,
    15000.00,
    5,
    2,
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
    'iPhone 15 launch offer',
    'Special launch discount on iPhone 15 Pro Max.',
    'product_discount',
    'fixed_amount',
    5000.00,
    5000.00,
    120000.00,
    2,
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
-- Offer Usage (offer_usage)
-- =====================

INSERT INTO offer_usage (
  offer_usage_id,
  offer_id,
  user_id,
  order_id,
  discount_amount,
  usage_count
) VALUES
  (1, 1, 2, 1, 10000.00, 1),
  (2, 3, 3, 2, 5000.00, 1);

-- =====================
-- Product Reviews (product_reviews)
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
    3,
    2,
    1,
    5,
    'Flagship experience',
    'Galaxy S24 Ultra has amazing display and camera.',
    'approved',
    1,
    4
  ),
  (
    2,
    1,
    3,
    2,
    5,
    'Premium iPhone',
    'iPhone 15 Pro Max feels very premium and smooth.',
    'approved',
    1,
    3
  );

-- =====================
-- Payments (payments)
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
    'TXN-2001',
    'credit_card',
    151998.00,
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
    'TXN-2002',
    'cash_on_delivery',
    183998.00,
    'INR',
    'completed',
    'Cash collected on delivery',
    'OK',
    0,
    0.00
  );

SET FOREIGN_KEY_CHECKS = 1;
