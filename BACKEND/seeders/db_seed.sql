-- ============================================================
-- Seed Data SQL Script
-- Converted from seed.js
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all tables
TRUNCATE TABLE modifier_portion;
TRUNCATE TABLE modifier_master;
TRUNCATE TABLE product_portion;
TRUNCATE TABLE portion_master;
TRUNCATE TABLE payment_master;
TRUNCATE TABLE offer_usage;
TRUNCATE TABLE offer_master;
TRUNCATE TABLE product_reviews;
TRUNCATE TABLE order_items;
TRUNCATE TABLE order_master;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE cart_master;
TRUNCATE TABLE product_categories;
TRUNCATE TABLE product_master;
TRUNCATE TABLE category_master;
TRUNCATE TABLE user_addresses;
TRUNCATE TABLE user_master;

-- =====================
-- 1. Users
-- =====================
INSERT INTO user_master (user_id, name, email, password, role, is_deleted, created_by, updated_by) VALUES
  (1, 'Admin User',    'admin@example.com', 'admin123',    'admin',    0, NULL, NULL),
  (2, 'Rahul Sharma',  'rahul@example.com', 'password123', 'customer', 0, 1,    1),
  (3, 'Priya Singh',   'priya@example.com', 'password123', 'customer', 0, 1,    1),
  (4, 'Amit Patel',    'amit@example.com',  'password123', 'customer', 0, 1,    1),
  (5, 'Neha Gupta',    'neha@example.com',  'password123', 'customer', 0, 1,    1),
  (6, 'Vikram Singh',  'vikram@example.com','password123', 'customer', 0, 1,    1);

-- =====================
-- 2. User Addresses
-- =====================
INSERT INTO user_addresses (address_id, user_id, address_type, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default, is_deleted, created_by, updated_by) VALUES
  (1, 2, 'shipping', 'Rahul Sharma', '9876543210', '101 MG Road',      'Near Metro Station',  'Bengaluru', 'KA', '560001', 'India', 1, 0, 2, 2),
  (2, 3, 'shipping', 'Priya Singh',  '9123456780', '202 Marine Drive', 'Sea View Apartments', 'Mumbai',    'MH', '400001', 'India', 1, 0, 3, 3),
  (3, 4, 'shipping', 'Amit Patel',    '9876543211', '45 Park Street',   'Sector 62',           'Noida',     'UP', '201301', 'India', 1, 0, 4, 4),
  (4, 5, 'shipping', 'Neha Gupta',    '9876543212', '78 Connaught Place', 'Central Market',     'New Delhi', 'DL', '110001', 'India', 1, 0, 5, 5),
  (5, 6, 'shipping', 'Vikram Singh',  '9876543213', '123 Tech Park',    'IT Corridor',         'Hyderabad', 'TG', '500081', 'India', 1, 0, 6, 6);

-- =====================
-- 3. Categories
-- =====================
INSERT INTO category_master (category_id, category_name, parent_id, is_deleted, created_by, updated_by) VALUES
  (1,  'Electronics',         NULL, 0, 1, 1),
  (43, 'Laptops',             1,    0, 1, 1),
  (44, 'Gaming Laptops',      43,   0, 1, 1),
  (45, 'Business Laptops',    43,   0, 1, 1),
  (46, 'Tablets',            1,    0, 1, 1),
  (47, 'iPads',              46,   0, 1, 1),
 (48, 'Android Tablets',     46,   0, 1, 1),
  (49, 'Audio',              1,    0, 1, 1),
  (50, 'Speakers',           49,   0, 1, 1),
  (51, 'Earbuds',            49,   0, 1, 1),
  (52, 'Gaming',             NULL, 0, 1, 1),
  (53, 'Gaming Consoles',    52,   0, 1, 1),
  (54, 'Gaming Accessories', 52,   0, 1, 1),
  (55, 'Home Appliances',    NULL, 0, 1, 1),
  (56, 'Refrigerators',      55,   0, 1, 1),
  (57, 'Washing Machines',   55,   0, 1, 1),
  (58, 'Air Conditioners',   55,   0, 1, 1);
  (2,  'Phones',              1,    0, 1, 1),
  (3,  'Android Phones',      2,    0, 1, 1),
  (4,  'iPhones',             2,    0, 1, 1),
  (5,  'Samsung Phones',      3,    0, 1, 1),
  (6,  'Xiaomi Phones',       3,    0, 1, 1),
  (7,  'OnePlus Phones',      3,    0, 1, 1),
  (8,  'Samsung Galaxy S Series', 5, 0, 1, 1),
  (9,  'Samsung Galaxy A Series', 5, 0, 1, 1),
  (10, 'Redmi Note Series',   6,    0, 1, 1),
  (11, 'Poco Series',         6,    0, 1, 1),
  (12, 'OnePlus Number Series', 7,  0, 1, 1),
  (13, 'OnePlus Nord Series', 7,    0, 1, 1),
  (14, 'iPhone 13 Series',    4,    0, 1, 1),
  (15, 'iPhone 14 Series',    4,    0, 1, 1),
  (16, 'iPhone 15 Series',    4,    0, 1, 1),
  (17, 'Televisions',         1,    0, 1, 1),
  (18, 'Smart TVs',           17,   0, 1, 1),
  (19, 'LED TVs',             17,   0, 1, 1),
  (20, 'Wearables',           1,    0, 1, 1),
  (21, 'Smartwatches',        20,   0, 1, 1),
  (22, 'Fitness Bands',       20,   0, 1, 1),
  (23, 'Accessories',         1,    0, 1, 1),
  (24, 'Phone Cases',         23,   0, 1, 1),
  (25, 'Chargers & Cables',   23,   0, 1, 1),
  (26, 'Headphones & Earbuds', 23,  0, 1, 1),
  (27, 'Fashion',             NULL, 0, 1, 1),
  (28, 'Men Fashion',         27,   0, 1, 1),
  (29, 'Women Fashion',       27,   0, 1, 1),
  (30, 'Kids Fashion',        27,   0, 1, 1),
  (31, 'Men Clothing',        28,   0, 1, 1),
  (32, 'Men Shoes',           28,   0, 1, 1),
  (33, 'Women Clothing',      29,   0, 1, 1),
  (34, 'Women Shoes',         29,   0, 1, 1),
  (35, 'Men T-Shirts',        31,   0, 1, 1),
  (36, 'Men Jeans',           31,   0, 1, 1),
  (37, 'Women Dresses',       33,   0, 1, 1),
  (38, 'Women Tops & Tees',   33,   0, 1, 1),
  (39, 'Men Sports Shoes',    32,   0, 1, 1),
  (40, 'Men Casual Shoes',    32,   0, 1, 1),
  (41, 'Women Heels',         34,   0, 1, 1),
  (42, 'Women Sneakers',      34,   0, 1, 1);

-- =====================
-- 4. Products
-- =====================
INSERT INTO product_master (product_id, name, display_name, description, short_description, price, discounted_price, stock, category_id, is_active, is_deleted, created_by, updated_by) VALUES
  (1,  'iphone_15_pro_max',       'Apple iPhone 15 Pro Max',                  'Flagship Apple smartphone with A17 chip and ProMotion display.',          'iPhone 15 Pro Max 256 GB',    159999.00, 149999.00, 25,  16, 1, 0, 1, 1),
  (21, 'macbook_air_m2',          'Apple MacBook Air M2 13-inch',            'Lightweight MacBook with M2 chip and long battery life.',              'MacBook Air M2 256GB',        99999.00,  94999.00,  15,  44, 1, 0, 1, 1),
  (22, 'macbook_pro_14',          'Apple MacBook Pro 14-inch M3',            'Powerful MacBook Pro with M3 chip for professionals.',               'MacBook Pro 14 512GB',       199999.00, 189999.00, 10,  45, 1, 0, 1, 1),
  (23, 'dell_xps_15',              'Dell XPS 15',                            'Premium Windows laptop with InfinityEdge display.',                     'Dell XPS 15 32GB RAM',       149999.00, 139999.00, 12,  44, 1, 0, 1, 1),
  (24, 'ipad_pro_12_9',           'Apple iPad Pro 12.9-inch M2',            'Powerful iPad with M2 chip and Liquid Retina XDR display.',           'iPad Pro 12.9 256GB',        119999.00, 109999.00, 20,  47, 1, 0, 1, 1),
  (25, 'samsung_tab_s9',          'Samsung Galaxy Tab S9',                  'Premium Android tablet with S Pen.',                                  'Galaxy Tab S9 128GB',         64999.00,  59999.00,  25,  48, 1, 0, 1, 1),
  (26, 'sony_wh_1000xm4',        'Sony WH-1000XM4 Wireless Headphones',     'Industry-leading noise cancellation headphones.',                       'Sony WH-1000XM4',             29999.00,  27999.00,  30,  26, 1, 0, 1, 1),
  (27, 'bose_soundlink',         'Bose SoundLink Flex Bluetooth Speaker', 'Portable Bluetooth speaker with rugged design.',                    'Bose SoundLink Flex',         14999.00,  12999.00,  50,  50, 1, 0, 1, 1),
  (28, 'airpods_pro_2',          'Apple AirPods Pro 2',                    'Active noise cancellation earbuds with spatial audio.',                 'AirPods Pro 2',              24999.00,  22999.00,  60,  51, 1, 0, 1, 1),
  (29, 'ps5_digital',            'Sony PlayStation 5 Digital Edition',     'Next-gen gaming console with stunning graphics.',                     'PS5 Digital Edition',        54999.00,  49999.00,  25,  53, 1, 0, 1, 1),
  (30, 'xbox_series_x',          'Xbox Series X',                         'Powerful gaming console with Game Pass.',                              'Xbox Series X 1TB',          54999.00,  49999.00,  20,  53, 1, 0, 1, 1),
  (31, 'lg_fridge_654',           'LG 654L Frost-Free Refrigerator',        'Large capacity refrigerator with smart features.',                      'LG 654L Frost-Free',         64999.00,  59999.00,  15,  56, 1, 0, 1, 1),
  (32, 'samsung_washing_7kg',    'Samsung 7kg Front Load Washing Machine', 'Fully automatic washing machine with AI control.',                     'Samsung 7kg Front Load',      29999.00,  26999.00,  25,  57, 1, 0, 1, 1),
  (33, 'daikin_ac_1_5ton',        'Daikin 1.5 Ton Split AC',              'Energy efficient split AC with inverter technology.',                  'Daikin 1.5 Ton Split AC',     44999.00,  39999.00,  20,  58, 1, 0, 1, 1);
  (2,  'iphone_14',               'Apple iPhone 14',                          'Powerful Apple smartphone with advanced camera system.',                  'iPhone 14 128 GB',            79999.00,  74999.00,  40,  15, 1, 0, 1, 1),
  (3,  'samsung_galaxy_s24_ultra','Samsung Galaxy S24 Ultra',                 'Samsung flagship with high refresh rate AMOLED and quad camera.',         'Galaxy S24 Ultra 256 GB',     139999.00, 129999.00, 30,  8,  1, 0, 1, 1),
  (4,  'samsung_galaxy_a55',      'Samsung Galaxy A55',                       'Mid-range Samsung Galaxy A-series smartphone.',                           'Galaxy A55 128 GB',           34999.00,  29999.00,  60,  9,  1, 0, 1, 1),
  (5,  'redmi_note_13_pro',       'Redmi Note 13 Pro',                        'Xiaomi Redmi Note series smartphone with great value.',                   'Redmi Note 13 Pro 8GB/256GB', 27999.00,  24999.00,  80,  10, 1, 0, 1, 1),
  (6,  'poco_x6',                 'POCO X6',                                  'POCO X-series smartphone focused on performance.',                        'POCO X6 8GB/256GB',           22999.00,  20999.00,  70,  11, 1, 0, 1, 1),
  (7,  'oneplus_12',              'OnePlus 12',                               'OnePlus flagship with fast charging and clean UI.',                       'OnePlus 12 12GB/256GB',       64999.00,  61999.00,  35,  12, 1, 0, 1, 1),
  (8,  'oneplus_nord_3',          'OnePlus Nord 3',                           'Upper mid-range OnePlus Nord series smartphone.',                         'OnePlus Nord 3 8GB/128GB',    32999.00,  29999.00,  55,  13, 1, 0, 1, 1),
  (9,  'samsung_55_qled_4k',      'Samsung 55 inch QLED 4K Smart TV',        'Samsung 55 inch QLED 4K Smart TV with HDR and voice assistant.',          'Samsung 55" QLED 4K Smart TV', 74999.00, 69999.00,  20,  18, 1, 0, 1, 1),
  (10, 'lg_43_led_full_hd',       'LG 43 inch Full HD LED TV',               'LG 43 inch Full HD LED TV with vivid picture engine.',                    'LG 43" Full HD LED TV',       29999.00,  24999.00,  25,  19, 1, 0, 1, 1),
  (11, 'apple_watch_series_9',    'Apple Watch Series 9 GPS 45mm',           'Apple Watch Series 9 with health sensors and Always-On Retina display.',  'Apple Watch Series 9 45mm',   45999.00,  42999.00,  30,  21, 1, 0, 1, 1),
  (12, 'galaxy_watch_6',          'Samsung Galaxy Watch6 Bluetooth 44mm',    'Samsung Galaxy Watch6 with AMOLED display and fitness tracking.',          'Galaxy Watch6 44mm',          28999.00,  25999.00,  40,  21, 1, 0, 1, 1),
  (13, 'mi_smart_band_8',         'Mi Smart Band 8',                          'Mi Smart Band 8 with AMOLED display and 150+ fitness modes.',             'Mi Smart Band 8',             3999.00,   3499.00,   100, 22, 1, 0, 1, 1),
  (14, 'boat_rockerz_450',        'boAt Rockerz 450 Bluetooth Headphones',   'Wireless on-ear headphones with 15 hours playback and deep bass.',        'boAt Rockerz 450',            2499.00,   1999.00,   120, 26, 1, 0, 1, 1),
  (15, 'sony_wh_1000xm5',        'Sony WH-1000XM5 Wireless Headphones',     'Sony flagship noise-cancelling over-ear headphones.',                     'Sony WH-1000XM5',             34999.00,  32999.00,  25,  26, 1, 0, 1, 1),
  (16, 'mens_round_neck_tshirt',  'Men Round Neck Cotton T-Shirt',           'Regular fit round neck cotton T-shirt for men.',                          'Men Cotton T-Shirt',          799.00,    599.00,    300, 35, 1, 0, 1, 1),
  (17, 'mens_slim_fit_jeans',     'Men Slim Fit Jeans',                       'Slim fit stretchable denim jeans for men.',                               'Men Slim Fit Jeans',          1999.00,   1599.00,   180, 36, 1, 0, 1, 1),
  (18, 'mens_sports_shoes',       'Men Running Sports Shoes',                 'Lightweight running shoes with breathable mesh.',                         'Men Sports Shoes',            2499.00,   1999.00,   120, 39, 1, 0, 1, 1),
  (19, 'womens_floral_dress',     'Women Floral A-Line Dress',               'Knee-length floral A-line dress for women.',                              'Women Floral Dress',          2499.00,   1999.00,   160, 37, 1, 0, 1, 1),
  (20, 'womens_sneakers',         'Women Casual Sneakers',                    'Casual lace-up sneakers for women.',                                      'Women Sneakers',              2799.00,   2299.00,   110, 42, 1, 0, 1, 1);

-- =====================
-- 5. Product Categories (many-to-many)
-- =====================
INSERT INTO product_categories (product_id, category_id, created_by, updated_by) VALUES
  -- Phones -> Electronics + Phones + leaf category
  (1, 1, 1, 1), (1, 2, 1, 1), (1, 4, 1, 1), (1, 16, 1, 1),
  (2, 1, 1, 1), (2, 2, 1, 1), (2, 4, 1, 1), (2, 15, 1, 1),
  (3, 1, 1, 1), (3, 2, 1, 1), (3, 3, 1, 1), (3, 8,  1, 1),
  (4, 1, 1, 1), (4, 2, 1, 1), (4, 3, 1, 1), (4, 9,  1, 1),
  (5, 1, 1, 1), (5, 2, 1, 1), (5, 3, 1, 1), (5, 10, 1, 1),
  (6, 1, 1, 1), (6, 2, 1, 1), (6, 3, 1, 1), (6, 11, 1, 1),
  (7, 1, 1, 1), (7, 2, 1, 1), (7, 3, 1, 1), (7, 12, 1, 1),
  (8, 1, 1, 1), (8, 2, 1, 1), (8, 3, 1, 1), (8, 13, 1, 1),
  -- Laptops -> Electronics + Laptops + leaf
  (21, 1, 1, 1), (21, 43, 1, 1), (21, 45, 1, 1),
  (22, 1, 1, 1), (22, 43, 1, 1), (22, 45, 1, 1),
  (23, 1, 1, 1), (23, 43, 1, 1), (23, 44, 1, 1),
  -- Tablets -> Electronics + Tablets + leaf
  (24, 1, 1, 1), (24, 46, 1, 1), (24, 47, 1, 1),
  (25, 1, 1, 1), (25, 46, 1, 1), (25, 48, 1, 1),
  -- TVs -> Electronics + leaf
  (9,  1, 1, 1), (9,  17, 1, 1), (9,  18, 1, 1),
  (10, 1, 1, 1), (10, 17, 1, 1), (10, 19, 1, 1),
  -- Wearables -> Electronics + leaf
  (11, 1, 1, 1), (11, 20, 1, 1), (11, 21, 1, 1),
  (12, 1, 1, 1), (12, 20, 1, 1), (12, 21, 1, 1),
  (13, 1, 1, 1), (13, 20, 1, 1), (13, 22, 1, 1),
  -- Audio -> Electronics + Audio + leaf
  (26, 1, 1, 1), (26, 23, 1, 1), (26, 26, 1, 1),
  (27, 1, 1, 1), (27, 23, 1, 1), (27, 49, 1, 1), (27, 50, 1, 1),
  (28, 1, 1, 1), (28, 23, 1, 1), (28, 49, 1, 1), (28, 51, 1, 1),
  (15, 1, 1, 1), (15, 23, 1, 1), (15, 26, 1, 1),
  -- Gaming -> Gaming + Consoles
  (29, 52, 1, 1), (29, 53, 1, 1),
  (30, 52, 1, 1), (30, 53, 1, 1),
  -- Home Appliances -> leaf
  (31, 55, 1, 1), (31, 56, 1, 1),
  (32, 55, 1, 1), (32, 57, 1, 1),
  (33, 55, 1, 1), (33, 58, 1, 1),
  -- Headphones -> Electronics + Accessories + leaf
  (14, 1, 1, 1), (14, 23, 1, 1), (14, 26, 1, 1),
  (15, 1, 1, 1), (15, 23, 1, 1), (15, 26, 1, 1),
  -- Fashion products
  (16, 27, 1, 1), (16, 28, 1, 1), (16, 31, 1, 1), (16, 35, 1, 1),
  (17, 27, 1, 1), (17, 28, 1, 1), (17, 31, 1, 1), (17, 36, 1, 1),
  (18, 27, 1, 1), (18, 28, 1, 1), (18, 32, 1, 1), (18, 39, 1, 1),
  (19, 27, 1, 1), (19, 29, 1, 1), (19, 33, 1, 1), (19, 37, 1, 1),
  (20, 27, 1, 1), (20, 29, 1, 1), (20, 34, 1, 1), (20, 42, 1, 1);

-- =====================
-- 6. Portions (global - storage, sizes, weights)
-- =====================
INSERT INTO portion_master (portion_id, portion_value, description, is_active, is_deleted, created_by, updated_by) VALUES
  (1,  '128 GB', 'Storage: 128 GB',   1, 0, 1, 1),
  (2,  '256 GB', 'Storage: 256 GB',   1, 0, 1, 1),
  (3,  '512 GB', 'Storage: 512 GB',   1, 0, 1, 1),
  (4,  '1 TB',   'Storage: 1 TB',     1, 0, 1, 1),
  (5,  '41 mm',  'Watch case: 41 mm', 1, 0, 1, 1),
  (6,  '45 mm',  'Watch case: 45 mm', 1, 0, 1, 1),
  (7,  '44 mm',  'Watch case: 44 mm', 1, 0, 1, 1),
  (8,  'S',      'Size: Small',       1, 0, 1, 1),
  (9,  'M',      'Size: Medium',      1, 0, 1, 1),
  (10, 'L',      'Size: Large',       1, 0, 1, 1),
  (11, 'XL',     'Size: Extra Large', 1, 0, 1, 1),
  (12, 'UK 6',   'Shoe size: UK 6',   1, 0, 1, 1),
  (13, 'UK 7',   'Shoe size: UK 7',   1, 0, 1, 1),
  (14, 'UK 8',   'Shoe size: UK 8',   1, 0, 1, 1),
  (15, 'UK 9',   'Shoe size: UK 9',   1, 0, 1, 1),
  (16, 'UK 10',  'Shoe size: UK 10',  1, 0, 1, 1),
  (17, '8 GB',   'RAM: 8 GB',         1, 0, 1, 1),
  (18, '16 GB',  'RAM: 16 GB',        1, 0, 1, 1),
  (19, '32 GB',  'RAM: 32 GB',        1, 0, 1, 1),
  (20, '64 GB',  'RAM: 64 GB',        1, 0, 1, 1),
  (21, '512 GB', 'Storage: 512 GB',   1, 0, 1, 1),
  (22, '1 TB',   'Storage: 1 TB',     1, 0, 1, 1),
  (23, '2 TB',   'Storage: 2 TB',     1, 0, 1, 1),
  (24, '11 inch','Display: 11 inch',  1, 0, 1, 1),
  (25, '12.9 inch','Display: 12.9 inch',1, 0, 1, 1),
  (26, 'Wi-Fi',  'Connectivity: Wi-Fi',1, 0, 1, 1),
  (27, 'Cellular','Connectivity: Cellular',1, 0, 1, 1);

-- =====================
-- 7. Product Portions (product + portion = price, stock)
-- =====================
INSERT INTO product_portion (product_portion_id, product_id, portion_id, price, discounted_price, stock, is_active, is_deleted, created_by, updated_by) VALUES
  -- iPhone 15 Pro Max: 256GB, 512GB, 1TB
  (1,  1,  2,  149999.00, 144999.00, 10, 1, 0, 1, 1),
  (2,  1,  3,  169999.00, 164999.00, 8,  1, 0, 1, 1),
  (3,  1,  4,  189999.00, 184999.00, 5,  1, 0, 1, 1),
  -- iPhone 14: 128GB, 256GB
  (4,  2,  1,  74999.00,  69999.00,  20, 1, 0, 1, 1),
  (5,  2,  2,  84999.00,  79999.00,  15, 1, 0, 1, 1),
  -- Samsung Galaxy S24 Ultra: 256GB, 512GB
  (6,  3,  2,  129999.00, 124999.00, 15, 1, 0, 1, 1),
  (7,  3,  3,  149999.00, 144999.00, 10, 1, 0, 1, 1),
  -- Samsung Galaxy A55: 128GB, 256GB
  (8,  4,  1,  29999.00,  27999.00,  30, 1, 0, 1, 1),
  (9,  4,  2,  34999.00,  32999.00,  20, 1, 0, 1, 1),
  -- Redmi Note 13 Pro: 128GB, 256GB
  (10, 5,  1,  22999.00,  20999.00,  40, 1, 0, 1, 1),
  (11, 5,  2,  24999.00,  22999.00,  30, 1, 0, 1, 1),
  -- POCO X6: 128GB, 256GB
  (12, 6,  1,  19999.00,  18499.00,  35, 1, 0, 1, 1),
  (13, 6,  2,  22999.00,  20999.00,  25, 1, 0, 1, 1),
  -- OnePlus 12: 256GB, 512GB
  (14, 7,  2,  61999.00,  59999.00,  18, 1, 0, 1, 1),
  (15, 7,  3,  69999.00,  67999.00,  12, 1, 0, 1, 1),
  -- OnePlus Nord 3: 128GB, 256GB
  (16, 8,  1,  27999.00,  25999.00,  28, 1, 0, 1, 1),
  (17, 8,  2,  29999.00,  27999.00,  22, 1, 0, 1, 1),
  -- Apple Watch Series 9: 41mm, 45mm
  (18, 11, 5,  40999.00,  38999.00,  15, 1, 0, 1, 1),
  (19, 11, 6,  45999.00,  42999.00,  12, 1, 0, 1, 1),
  -- Galaxy Watch6: 44mm
  (20, 12, 7,  28999.00,  25999.00,  20, 1, 0, 1, 1),
  -- Men T-Shirt: S, M, L, XL
  (21, 16, 8,  799.00,    599.00,    80,  1, 0, 1, 1),
  (22, 16, 9,  799.00,    599.00,    100, 1, 0, 1, 1),
  (23, 16, 10, 799.00,    599.00,    70,  1, 0, 1, 1),
  (24, 16, 11, 799.00,    599.00,    50,  1, 0, 1, 1),
  -- Men Jeans: M, L, XL
  (25, 17, 9,  1999.00,   1599.00,   60,  1, 0, 1, 1),
  (26, 17, 10, 1999.00,   1599.00,   70,  1, 0, 1, 1),
  (27, 17, 11, 1999.00,   1599.00,   50,  1, 0, 1, 1),
  -- Men Sports Shoes: UK 7, UK 8, UK 9, UK 10
  (28, 18, 13, 2499.00,   1999.00,   30,  1, 0, 1, 1),
  (29, 18, 14, 2499.00,   1999.00,   40,  1, 0, 1, 1),
  (30, 18, 15, 2499.00,   1999.00,   30,  1, 0, 1, 1),
  (31, 18, 16, 2499.00,   1999.00,   20,  1, 0, 1, 1),
  -- Women Floral Dress: S, M, L
  (32, 19, 8,  2499.00,   1999.00,   50,  1, 0, 1, 1),
  (33, 19, 9,  2499.00,   1999.00,   60,  1, 0, 1, 1),
  (34, 19, 10, 2499.00,   1999.00,   50,  1, 0, 1, 1),
  -- Women Sneakers: UK 6, UK 7, UK 8
  (35, 20, 12, 2799.00,   2299.00,   35,  1, 0, 1, 1),
  (36, 20, 13, 2799.00,   2299.00,   40,  1, 0, 1, 1),
  (37, 20, 14, 2799.00,   2299.00,   35,  1, 0, 1, 1),
  -- MacBook Air M2: 256GB, 512GB
  (38, 21, 2,  99999.00,  94999.00,  15, 1, 0, 1, 1),
  (39, 21, 21, 119999.00, 114999.00, 10, 1, 0, 1, 1),
  -- MacBook Pro 14: 512GB, 1TB
  (40, 22, 21, 199999.00, 189999.00, 10, 1, 0, 1, 1),
  (41, 22, 22, 229999.00, 219999.00, 8,  1, 0, 1, 1),
  -- Dell XPS 15: 16GB, 32GB
  (42, 23, 17, 149999.00, 139999.00, 12, 1, 0, 1, 1),
  (43, 23, 18, 179999.00, 169999.00, 8,  1, 0, 1, 1),
  -- iPad Pro 12.9: 256GB, 512GB
  (44, 24, 21, 119999.00, 109999.00, 20, 1, 0, 1, 1),
  (45, 24, 22, 139999.00, 129999.00, 15, 1, 0, 1, 1),
  -- Galaxy Tab S9: 128GB, 256GB
  (46, 25, 1,  64999.00,  59999.00,  25, 1, 0, 1, 1),
  (47, 25, 2,  74999.00,  69999.00,  20, 1, 0, 1, 1),
  -- Apple Watch Series 9: 41mm, 45mm
  (18, 11, 5,  40999.00,  38999.00,  15, 1, 0, 1, 1),
  (19, 11, 6,  45999.00,  42999.00,  12, 1, 0, 1, 1),
  -- Galaxy Watch6: 44mm
  (20, 12, 7,  28999.00,  25999.00,  20, 1, 0, 1, 1),
  -- Women Floral Dress: S, M, L
  (32, 19, 8,  2499.00,   1999.00,   50,  1, 0, 1, 1),
  (33, 19, 9,  2499.00,   1999.00,   60,  1, 0, 1, 1),
  (34, 19, 10, 2499.00,   1999.00,   50,  1, 0, 1, 1),
  -- Women Sneakers: UK 6, UK 7, UK 8
  (35, 20, 12, 2799.00,   2299.00,   35, 1, 0, 1, 1),
  (36, 20, 13, 2799.00,   2299.00,   40, 1, 0, 1, 1),
  (37, 20, 14, 2799.00,   2299.00,   35, 1, 0, 1, 1);

-- =====================
-- 8. Modifiers (global - colors, RAM, strap materials, etc.)
-- =====================
INSERT INTO modifier_master (modifier_id, modifier_name, modifier_value, additional_price, is_active, is_deleted, created_by, updated_by) VALUES
  -- Phone colors
  (1,  'Color',          'Black',            0.00,    1, 0, 1, 1),
  (2,  'Color',          'Blue',             0.00,    1, 0, 1, 1),
  (3,  'Color',          'Natural Titanium', 0.00,    1, 0, 1, 1),
  (4,  'Color',          'Titanium Gray',    0.00,    1, 0, 1, 1),
  (5,  'Color',          'Titanium Black',   0.00,    1, 0, 1, 1),
  (6,  'Color',          'Flowy Emerald',    0.00,    1, 0, 1, 1),
  (7,  'Color',          'Silky Black',      0.00,    1, 0, 1, 1),
  (8,  'Color',          'White',            0.00,    1, 0, 1, 1),
  -- RAM variants
  (9,  'RAM',            '8 GB',             0.00,    1, 0, 1, 1),
  (10, 'RAM',            '12 GB',            2000.00, 1, 0, 1, 1),
  -- Watch strap materials
  (11, 'Strap Material', 'Silicone',         0.00,    1, 0, 1, 1),
  (12, 'Strap Material', 'Metal',            3000.00, 1, 0, 1, 1),
  -- Fitness band colors
  (13, 'Strap Color',    'Black',            0.00,    1, 0, 1, 1),
  (14, 'Strap Color',    'Blue',             0.00,    1, 0, 1, 1),
  -- Fashion colors
  (15, 'Color',          'Navy Blue',        0.00,    1, 0, 1, 1),
  (16, 'Color',          'Red',              0.00,    1, 0, 1, 1),
  (17, 'Color',          'Grey',             0.00,    1, 0, 1, 1),
  -- Jeans wash types
  (18, 'Wash',           'Dark Wash',        0.00,    1, 0, 1, 1),
  (19, 'Wash',           'Light Wash',       0.00,    1, 0, 1, 1),
  -- Shoe colors
  (20, 'Color',          'Black/Red',        0.00,    1, 0, 1, 1),
  (21, 'Color',          'Grey/Blue',        0.00,    1, 0, 1, 1),
  -- Dress patterns
  (22, 'Pattern',        'Floral Pink',      0.00,    1, 0, 1, 1),
  (23, 'Pattern',        'Floral Blue',      0.00,    1, 0, 1, 1),
  -- Laptop colors
  (24, 'Color',          'Space Gray',       0.00,    1, 0, 1, 1),
  (25, 'Color',          'Silver',           0.00,    1, 0, 1, 1),
  -- Tablet connectivity
  (26, 'Connectivity',   'Wi-Fi',            0.00,    1, 0, 1, 1),
  (27, 'Connectivity',   'Cellular',         5000.00, 1, 0, 1, 1),
  -- Speaker colors
  (28, 'Color',          'Black',            0.00,    1, 0, 1, 1),
  (29, 'Color',          'Blue',             0.00,    1, 0, 1, 1),
  -- Earbud colors
  (30, 'Color',          'White',            0.00,    1, 0, 1, 1),
  (31, 'Color',          'Black',            0.00,    1, 0, 1, 1),
  -- Console colors
  (32, 'Color',          'White',            0.00,    1, 0, 1, 1),
  (33, 'Color',          'Black',            0.00,    1, 0, 1, 1);

-- =====================
-- 9. Modifier Portions (modifier + product_portion = stock, price adj.)
-- =====================
INSERT INTO modifier_portion (modifier_portion_id, modifier_id, product_portion_id, additional_price, stock, is_active, is_deleted, created_by, updated_by) VALUES
  -- iPhone 15 Pro Max 256GB (pp_id=1): Black, Blue, Natural Titanium
  (1,  1,  1,  0.00,    4,  1, 0, 1, 1),
  (2,  2,  1,  0.00,    3,  1, 0, 1, 1),
  (3,  3,  1,  0.00,    3,  1, 0, 1, 1),
  -- iPhone 15 Pro Max 512GB (pp_id=2): Black, Blue
  (4,  1,  2,  0.00,    4,  1, 0, 1, 1),
  (5,  2,  2,  0.00,    4,  1, 0, 1, 1),
  -- iPhone 15 Pro Max 1TB (pp_id=3): Black
  (6,  1,  3,  0.00,    5,  1, 0, 1, 1),
  -- Samsung Galaxy S24 Ultra 256GB (pp_id=6): Titanium Gray, Titanium Black
  (7,  4,  6,  0.00,    8,  1, 0, 1, 1),
  (8,  5,  6,  0.00,    7,  1, 0, 1, 1),
  -- Samsung Galaxy S24 Ultra 512GB (pp_id=7): Titanium Gray, Titanium Black
  (9,  4,  7,  0.00,    5,  1, 0, 1, 1),
  (10, 5,  7,  0.00,    5,  1, 0, 1, 1),
  -- Redmi Note 13 Pro 128GB (pp_id=10): 8GB RAM, 12GB RAM
  (11, 9,  10, 0.00,    20, 1, 0, 1, 1),
  (12, 10, 10, 2000.00, 15, 1, 0, 1, 1),
  -- Redmi Note 13 Pro 256GB (pp_id=11): 8GB RAM, 12GB RAM
  (13, 9,  11, 0.00,    15, 1, 0, 1, 1),
  (14, 10, 11, 2000.00, 10, 1, 0, 1, 1),
  -- OnePlus 12 256GB (pp_id=14): Flowy Emerald, Silky Black
  (15, 6,  14, 0.00,    10, 1, 0, 1, 1),
  (16, 7,  14, 0.00,    8,  1, 0, 1, 1),
  -- OnePlus 12 512GB (pp_id=15): Flowy Emerald, Silky Black
  (17, 6,  15, 0.00,    6,  1, 0, 1, 1),
  (18, 7,  15, 0.00,    6,  1, 0, 1, 1),
  -- Apple Watch 41mm (pp_id=18): Silicone, Metal strap
  (19, 11, 18, 0.00,    10, 1, 0, 1, 1),
  (20, 12, 18, 3000.00, 5,  1, 0, 1, 1),
  -- Apple Watch 45mm (pp_id=19): Silicone, Metal strap
  (21, 11, 19, 0.00,    8,  1, 0, 1, 1),
  (22, 12, 19, 3000.00, 4,  1, 0, 1, 1),
  -- MacBook Air M2 256GB (pp_id=38): Space Gray, Silver
  (44, 24, 38, 0.00,    8,  1, 0, 1, 1),
  (45, 25, 38, 0.00,    7,  1, 0, 1, 1),
  -- MacBook Air M2 512GB (pp_id=39): Space Gray, Silver
  (46, 24, 39, 0.00,    5,  1, 0, 1, 1),
  (47, 25, 39, 0.00,    5,  1, 0, 1, 1),
  -- MacBook Pro 14 512GB (pp_id=40): Space Gray, Silver
  (48, 24, 40, 0.00,    6,  1, 0, 1, 1),
  (49, 25, 40, 0.00,    4,  1, 0, 1, 1),
  -- MacBook Pro 14 1TB (pp_id=41): Space Gray, Silver
  (50, 24, 41, 0.00,    4,  1, 0, 1, 1),
  (51, 25, 41, 0.00,    4,  1, 0, 1, 1),
  -- iPad Pro 12.9 256GB (pp_id=44): Wi-Fi, Cellular
  (52, 26, 44, 0.00,    12, 1, 0, 1, 1),
  (53, 27, 44, 5000.00, 8,  1, 0, 1, 1),
  -- iPad Pro 12.9 512GB (pp_id=45): Wi-Fi, Cellular
  (54, 26, 45, 0.00,    10, 1, 0, 1, 1),
  (55, 27, 45, 5000.00, 5,  1, 0, 1, 1),
  -- Galaxy Tab S9 128GB (pp_id=46): Black, Blue
  (56, 1,  46, 0.00,    15, 1, 0, 1, 1),
  (57, 2,  46, 0.00,    10, 1, 0, 1, 1),
  -- Galaxy Tab S9 256GB (pp_id=47): Black, Blue
  (58, 1,  47, 0.00,    12, 1, 0, 1, 1),
  (59, 2,  47, 0.00,    8,  1, 0, 1, 1),
  -- Bose SoundLink Flex (pp_id=50): Black, Blue
  (60, 28, 50, 0.00,    25, 1, 0, 1, 1),
  (61, 29, 50, 0.00,    25, 1, 0, 1, 1),
  -- AirPods Pro 2: White, Black
  (62, 30, 28, 0.00,    30, 1, 0, 1, 1),
  (63, 31, 28, 0.00,    30, 1, 0, 1, 1),
  -- PS5 Digital: White, Black
  (64, 32, 29, 0.00,    15, 1, 0, 1, 1),
  (65, 33, 29, 0.00,    10, 1, 0, 1, 1),
  -- Xbox Series X: White, Black
  (66, 32, 30, 0.00,    12, 1, 0, 1, 1),
  (67, 33, 30, 0.00,    8,  1, 0, 1, 1),
  -- Men T-Shirt S (pp_id=21): Navy Blue, Red, Grey
  (23, 15, 21, 0.00,    25, 1, 0, 1, 1),
  (24, 16, 21, 0.00,    25, 1, 0, 1, 1),
  (25, 17, 21, 0.00,    30, 1, 0, 1, 1),
  -- Men T-Shirt M (pp_id=22): Navy Blue, Red, Grey
  (26, 15, 22, 0.00,    35, 1, 0, 1, 1),
  (27, 16, 22, 0.00,    30, 1, 0, 1, 1),
  (28, 17, 22, 0.00,    35, 1, 0, 1, 1),
  -- Men T-Shirt L (pp_id=23): Navy Blue, Red, Grey
  (29, 15, 23, 0.00,    25, 1, 0, 1, 1),
  (30, 16, 23, 0.00,    20, 1, 0, 1, 1),
  (31, 17, 23, 0.00,    25, 1, 0, 1, 1),
  -- Men Jeans M (pp_id=25): Dark Wash, Light Wash
  (32, 18, 25, 0.00,    30, 1, 0, 1, 1),
  (33, 19, 25, 0.00,    30, 1, 0, 1, 1),
  -- Men Jeans L (pp_id=26): Dark Wash, Light Wash
  (34, 18, 26, 0.00,    35, 1, 0, 1, 1),
  (35, 19, 26, 0.00,    35, 1, 0, 1, 1),
  -- Men Sports Shoes UK 8 (pp_id=29): Black/Red, Grey/Blue
  (36, 20, 29, 0.00,    20, 1, 0, 1, 1),
  (37, 21, 29, 0.00,    20, 1, 0, 1, 1),
  -- Men Sports Shoes UK 9 (pp_id=30): Black/Red, Grey/Blue
  (38, 20, 30, 0.00,    15, 1, 0, 1, 1),
  (39, 21, 30, 0.00,    15, 1, 0, 1, 1),
  -- Women Floral Dress M (pp_id=33): Floral Pink, Floral Blue
  (40, 22, 33, 0.00,    30, 1, 0, 1, 1),
  (41, 23, 33, 0.00,    30, 1, 0, 1, 1),
  -- Women Sneakers UK 7 (pp_id=36): Black, White
  (42, 1,  36, 0.00,    20, 1, 0, 1, 1),
  (43, 8,  36, 0.00,    20, 1, 0, 1, 1);

-- =====================
-- 10. Carts
-- =====================
INSERT INTO cart_master (cart_id, user_id, is_deleted, created_by, updated_by) VALUES
  (1, 2, 0, 2, 2),
  (2, 3, 0, 3, 3);

INSERT INTO cart_items (cart_item_id, cart_id, product_id, product_portion_id, modifier_id, quantity, price, is_deleted, created_by, updated_by) VALUES
  -- Rahul: Galaxy S24 Ultra 256GB, Titanium Gray (modifier_id=4)
  (1, 1, 3,  6,    4,    1, 124999.00, 0, 2, 2),
  -- Rahul: Redmi Note 13 Pro 256GB, 12GB RAM (modifier_id=10)
  (2, 1, 5,  11,   10,   1, 22999.00,  0, 2, 2),
  -- Rahul: Mi Smart Band 8 - NO portion, NO modifier
  (3, 1, 13, NULL, NULL, 1, 3499.00,   0, 2, 2),
  -- Priya: iPhone 15 Pro Max 256GB, Natural Titanium (modifier_id=3)
  (4, 2, 1,  1,    3,    1, 144999.00, 0, 3, 3),
  -- Priya: boAt Rockerz 450 - NO portion, NO modifier
  (5, 2, 14, NULL, NULL, 1, 1999.00,   0, 3, 3);

-- =====================
-- 11. Orders
-- =====================
INSERT INTO order_master (order_id, order_number, user_id, address_id, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, order_status, payment_status, is_deleted, created_by, updated_by) VALUES
  (1, 'ORD-2001', 2, 1, 154998.00, 7000.00, 0.00, 10000.00, 151998.00, 'completed', 'completed', 0, 2, 2),
  (2, 'ORD-2002', 3, 2, 179998.00, 9000.00, 0.00, 5000.00,  183998.00, 'delivered', 'completed', 0, 3, 3);

INSERT INTO order_items (order_item_id, order_id, product_id, product_portion_id, modifier_id, product_name, portion_value, modifier_value, quantity, price, discount, tax, total, is_deleted, created_by, updated_by) VALUES
  -- Order 1: Rahul bought S24 Ultra 256GB Titanium Black + Redmi Note 13 Pro 256GB 8GB RAM + Mi Smart Band 8
  (1, 1, 3,  6,    5,    'Samsung Galaxy S24 Ultra', '256 GB', 'Titanium Black', 1, 124999.00, 5000.00, 6500.00, 126499.00, 0, 2, 2),
  (2, 1, 5,  11,   9,    'Redmi Note 13 Pro',        '256 GB', '8 GB',           1, 22999.00,  5000.00, 500.00,  18499.00,  0, 2, 2),
  (3, 1, 13, NULL, NULL, 'Mi Smart Band 8',           NULL,     NULL,             1, 3499.00,   0.00,    180.00,  3679.00,   0, 2, 2),
  -- Order 2: Priya bought iPhone 15 Pro Max 512GB Blue + boAt Rockerz 450
  (4, 2, 1,  2,    2,    'Apple iPhone 15 Pro Max',  '512 GB', 'Blue',           1, 164999.00, 5000.00, 7500.00, 167499.00, 0, 3, 3),
  (5, 2, 14, NULL, NULL, 'boAt Rockerz 450',          NULL,     NULL,             1, 1999.00,   0.00,    100.00,  2099.00,   0, 3, 3);

-- =====================
-- 12. Offers
-- =====================
INSERT INTO offer_master (offer_id, offer_name, description, offer_type, discount_type, discount_value, maximum_discount_amount, min_purchase_amount, usage_limit_per_user, category_id, product_id, start_date, end_date, is_active, is_deleted, created_by, updated_by) VALUES
  (1, '10% off all phones',    'Get 10% discount on all phones above 10000.',      'category_discount', 'percentage',   10.00,   5000.00, 10000.00,  3, 2,    NULL, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1, 0, 1, 1),
  (2, '2000 off Android phones','Flat 2000 discount on Android phones above 15000.','category_discount', 'fixed_amount', 2000.00, 2000.00, 15000.00,  5, 3,    NULL, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1, 0, 1, 1),
  (3, 'iPhone 15 launch offer', 'Special launch discount on iPhone 15 Pro Max.',   'product_discount',  'fixed_amount', 5000.00, 5000.00, 120000.00, 2, NULL, 1,    '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1, 0, 1, 1);

INSERT INTO offer_usage (offer_usage_id, offer_id, user_id, order_id, discount_amount, usage_count, is_deleted, created_by, updated_by) VALUES
  (1, 1, 2, 1, 10000.00, 1, 0, 2, 2),
  (2, 3, 3, 2, 5000.00,  1, 0, 3, 3);

-- =====================
-- 13. Reviews
-- =====================
INSERT INTO product_reviews (review_id, product_id, user_id, order_id, rating, title, review_text, status, is_verified_purchase, helpful_count, is_deleted, created_by, updated_by) VALUES
  (1, 3, 2, 1, 5, 'Flagship experience', 'Galaxy S24 Ultra has amazing display and camera.',    'approved', 1, 4, 0, 2, 2),
  (2, 1, 3, 2, 5, 'Premium iPhone',      'iPhone 15 Pro Max feels very premium and smooth.',    'approved', 1, 3, 0, 3, 3);

-- =====================
-- 14. Payments
-- =====================
INSERT INTO payment_master (payment_id, order_id, transaction_id, payment_method, amount, currency, status, payment_details, gateway_response, is_refunded, refund_amount, is_deleted, created_by, updated_by) VALUES
  (1, 1, 'TXN-2001', 'credit_card',      151998.00, 'INR', 'completed', 'Paid with Visa ending 4242', 'OK', 0, 0.00, 0, 2, 2),
  (2, 2, 'TXN-2002', 'cash_on_delivery', 183998.00, 'INR', 'completed', 'Cash collected on delivery', 'OK', 0, 0.00, 0, 3, 3);

SET FOREIGN_KEY_CHECKS = 1;