import pool from '../configs/db.js';

const CATEGORIES = [
  { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80' },
  { name: 'Fashion', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80' },
  { name: 'Home & Kitchen', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80' },
  { name: 'Beauty & Personal Care', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80' },
  { name: 'Books', img: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500&q=80' },
  { name: 'Sports & Outdoors', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80' },
  { name: 'Toys & Games', img: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=500&q=80' },
  { name: 'Automotive', img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80' },
  { name: 'Grocery & Gourmet Food', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80' },
  { name: 'Health & Household', img: 'https://images.unsplash.com/photo-1505751172107-160dc6ad99e3?w=500&q=80' },
  { name: 'Pet Supplies', img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&q=80' },
  { name: 'Baby Products', img: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=500&q=80' },
  { name: 'Office Products', img: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=500&q=80' },
  { name: 'Tools & Home Improvement', img: 'https://images.unsplash.com/photo-1504148455328-4972fdeeff7d?w=500&q=80' },
  { name: 'Jewelry & Watches', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?w=500&q=80' },
  { name: 'Art & Crafts', img: 'https://images.unsplash.com/photo-1459908676235-d5f02a50184b?w=500&q=80' }
];

const BRANDS = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Lego', 'Nestle', 'Dyson', 'Bose', 'Logitech'];

const PORTIONS = [
  { value: 'Small', desc: 'Standard small size' },
  { value: 'Medium', desc: 'Standard medium size' },
  { value: 'Large', desc: 'Standard large size' },
  { value: '128GB', desc: 'Base storage' },
  { value: '256GB', desc: 'Expanded storage' },
  { value: '512GB', desc: 'Pro storage' }
];

const MODIFIERS = [
  { name: 'Color', values: ['Red', 'Blue', 'Black', 'Silver', 'Gold'], type: 'visual' },
  { name: 'Material', values: ['Cotton', 'Polyester', 'Leather', 'Aluminum', 'Titanium'], type: 'spec' },
  { name: 'Memory', values: ['8GB', '16GB', '32GB'], type: 'perf' }
];

const ADMIN_ID = 1;

async function seed() {
  console.log('--- Starting IMPROVED Massive Seeding (200 Products) ---');
  try {
    // 1. Portion Master
    const portionIds = [];
    for (const p of PORTIONS) {
      const [res] = await pool.query('INSERT INTO portion_master (portion_value, description, created_by, updated_by) VALUES (?, ?, ?, ?)', [p.value, p.desc, ADMIN_ID, ADMIN_ID]);
      portionIds.push({ id: res.insertId, value: p.value });
    }

    // 2. Modifier Master
    const modifierIds = [];
    for (const group of MODIFIERS) {
      for (const val of group.values) {
        const price = Math.floor(Math.random() * 50) + 10;
        const [res] = await pool.query('INSERT INTO modifier_master (modifier_name, modifier_value, modifier_type, additional_price, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)', [group.name, val, group.type, price, ADMIN_ID, ADMIN_ID]);
        modifierIds.push({ id: res.insertId, name: group.name, value: val, price });
      }
    }

    // 3. Categories with Images
    const categoryData = [];
    for (const cat of CATEGORIES) {
      const [res] = await pool.query('INSERT INTO category_master (category_name, created_by, updated_by) VALUES (?, ?, ?)', [cat.name, ADMIN_ID, ADMIN_ID]);
      categoryData.push({ id: res.insertId, name: cat.name, img: cat.img });
    }

    // 4. Products
    for (let i = 1; i <= 200; i++) {
      const catObj = categoryData[Math.floor(Math.random() * categoryData.length)];
      const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
      const name = `${brand} ${catObj.name} Item #${i}`;
      const price = (Math.random() * 900 + 100).toFixed(2);
      
      const [pRes] = await pool.query(
        'INSERT INTO product_master (name, display_name, description, short_description, price, category_id, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, name, `Premium ${name} from top brand ${brand}.`, `Experience the best of ${catObj.name}`, price, catObj.id, ADMIN_ID, ADMIN_ID]
      );
      const productId = pRes.insertId;

      // Associate category
      await pool.query('INSERT INTO product_categories (product_id, category_id, created_by, updated_by) VALUES (?, ?, ?, ?)', [productId, catObj.id, ADMIN_ID, ADMIN_ID]);

      // Image
      await pool.query(
        'INSERT INTO product_images (product_id, image_level, image_url, public_id, is_primary, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [productId, 'PRODUCT', catObj.img, `seeding_img_${i}`, 1, ADMIN_ID, ADMIN_ID]
      );

      // Portions (Always at least 1)
      const numPortions = Math.floor(Math.random() * 3) + 1;
      const shuffledPortions = portionIds.sort(() => 0.5 - Math.random()).slice(0, numPortions);
      const productPortionIds = [];
      for (const p of shuffledPortions) {
        const [ppRes] = await pool.query('INSERT INTO product_portion (product_id, portion_id, price, stock, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)', [productId, p.id, price, 100, ADMIN_ID, ADMIN_ID]);
        productPortionIds.push(ppRes.insertId);
      }

      // Modifiers (Always 100% of products get something)
      const modType = Math.random() > 0.5 ? 'COMBO' : 'RAW';
      if (modType === 'COMBO') {
        for (const ppId of productPortionIds) {
          const comboMods = modifierIds.sort(() => 0.5 - Math.random()).slice(0, 2);
          const comboName = comboMods.map(m => m.value).join(' + ');
          const addPrice = comboMods.reduce((sum, m) => sum + Number(m.price), 0);
          await pool.query('INSERT INTO modifier_combination (product_id, product_portion_id, name, additional_price, stock, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [productId, ppId, comboName, addPrice, 50, ADMIN_ID, ADMIN_ID]);
        }
      } else {
        // Raw Modifiers
        const numRaw = Math.floor(Math.random() * 2) + 2; // at least 2 raw modifiers
        const rawMods = modifierIds.sort(() => 0.5 - Math.random()).slice(0, numRaw);
        for (const m of rawMods) {
          await pool.query('INSERT INTO modifier_portion (modifier_id, product_id, additional_price, stock, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)', [m.id, productId, m.price, 20, ADMIN_ID, ADMIN_ID]);
        }
      }

      if (i % 50 === 0) console.log(`Inserted ${i} products...`);
    }
    console.log('--- IMPROVED Seeding Completed Successfully ---');
  } catch (err) {
    console.error('--- Seeding Failed ---', err);
  } finally {
    process.exit(0);
  }
}

seed();
