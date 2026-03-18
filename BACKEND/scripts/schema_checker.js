import fs from 'fs';
import pool from '../configs/db.js';

const tables = [
  'category_master', 'product_master', 'product_categories', 
  'portion_master', 'product_portion', 'modifier_master', 
  'modifier_portion', 'modifier_combination', 'product_images', 
  'offer_master', 'offer_product_category', 'cart_items', 
  'cart_item_modifiers'
];

async function checkSchema() {
  const schema = {};
  for (const table of tables) {
    try {
      const [rows] = await pool.query(`DESCRIBE ??`, [table]);
      schema[table] = rows;
      console.log(`Found table: ${table}`);
    } catch (err) {
      console.log(`Table NOT found: ${table}`);
      schema[table] = null;
    }
  }
  fs.writeFileSync('schema_final.json', JSON.stringify(schema, null, 2));
  process.exit(0);
}

checkSchema();
