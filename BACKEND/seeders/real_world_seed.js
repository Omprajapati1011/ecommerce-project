import pool from '../configs/db.js';
import { products } from './products_data.js';

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log(`--- Starting Mass Real World Seeding (${products.length} Products) ---`);
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Cleanup
    const tables = [
      'modifier_combination_items', 'modifier_combination', 'modifier_portion', 
      'product_portion', 'product_images', 'product_categories', 'product_master', 
      'category_master', 'portion_master', 'modifier_master'
    ];
    for (const table of tables) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }
    console.log('Database cleaned.');

    // 2. Categories - Build unique tree from products
    const ensureCategory = async (name, parentId = null) => {
      const [rows] = await conn.query('SELECT category_id FROM category_master WHERE category_name = ? AND (parent_id = ? OR (? IS NULL AND parent_id IS NULL))', [name, parentId, parentId]);
      if (rows.length > 0) return rows[0].category_id;
      const [res] = await conn.query('INSERT INTO category_master (category_name, parent_id) VALUES (?, ?)', [name, parentId]);
      return res.insertId;
    };

    const categoryMap = {}; // "path>string" -> id

    // 3. Process Products
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      
      // Resolve Category ID
      let currentParentId = null;
      for (const catName of p.category_path) {
        currentParentId = await ensureCategory(catName, currentParentId);
      }
      const catId = currentParentId;

      // Insert core product
      const [pRes] = await conn.query(
        'INSERT INTO product_master (name, display_name, description, short_description, price, category_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [p.name, p.display_name, p.description, p.short_description, p.price, catId]
      );
      const productId = pRes.insertId;

      await conn.query('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, catId]);
      await conn.query("INSERT INTO product_images (product_id, image_level, image_url, public_id, is_primary) VALUES (?, 'PRODUCT', ?, ?, 1)", 
        [productId, p.image_url, `img-${productId}`]);

      // 4. Portions (e.g. Storage/RAM/Size)
      const portionIdMap = {}; // value -> product_portion_id
      for (const port of p.portions) {
        const [pmRes] = await conn.query(
          'INSERT INTO portion_master (portion_value) VALUES (?) ON DUPLICATE KEY UPDATE portion_id=LAST_INSERT_ID(portion_id)',
          [port.value]
        );
        const pmId = pmRes.insertId;
        const [ppRes] = await conn.query(
          'INSERT INTO product_portion (product_id, portion_id, price, stock) VALUES (?, ?, ?, ?)',
          [productId, pmId, port.price, port.stock]
        );
        portionIdMap[port.value] = ppRes.insertId;
      }

      // 5. Modifiers (e.g. Color, Warranty, Protection)
      const modValueMap = {}; // modName -> { val -> modifier_id }
      for (const mod of p.modifiers) {
        modValueMap[mod.name] = {};
        for (const val of mod.values) {
          const [mmRes] = await conn.query(
            'INSERT INTO modifier_master (modifier_name, modifier_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE modifier_id=LAST_INSERT_ID(modifier_id)',
            [mod.name, val]
          );
          const mmId = mmRes.insertId;
          modValueMap[mod.name][val] = mmId;

          // Always link as a standalone modifier for the product
          await conn.query(
            'INSERT INTO modifier_portion (modifier_id, product_id, additional_price, stock) VALUES (?, ?, ?, ?)',
            [mmId, productId, mod.additional_price || 0, mod.stock || 100]
          );
        }
      }

      // 6. Generate Combinations (Logical mapping: Portion x First Primary Modifier)
      // Usually, if there's a "Color" or "Size" modifier, that's what forms a variant with the portion.
      const primaryMod = p.modifiers.find(m => ['Color', 'Finish', 'Size', 'Switch Type', 'Graphics'].includes(m.name));
      
      if (primaryMod && p.portions.length > 0) {
        for (const port of p.portions) {
          const ppId = portionIdMap[port.value];
          for (const modVal of primaryMod.values) {
            const mmId = modValueMap[primaryMod.name][modVal];
            const comboName = `${port.value} / ${modVal}`;
            
            // Combination Master
            const [mcRes] = await conn.query(
              'INSERT INTO modifier_combination (product_id, product_portion_id, name, additional_price, stock) VALUES (?, ?, ?, ?, ?)',
              [productId, ppId, comboName, 0, Math.floor(port.stock / primaryMod.values.length) || 10]
            );
            const comboId = mcRes.insertId;

            // Combination Items
            await conn.query(
              'INSERT INTO modifier_combination_items (combination_id, modifier_id) VALUES (?, ?)',
              [comboId, mmId]
            );
          }
        }
      }

      if ((i + 1) % 50 === 0) console.log(`Seeded ${i + 1} products...`);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`--- Mass Seeding Successfully Completed (${products.length} Products) ---`);
  } catch (err) {
    console.error('--- Seeding Failed ---', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
