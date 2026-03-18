import fs from 'fs';
import pool from '../configs/db.js';

async function checkSchema() {
  const result = {};
  try {
    const [modifierMaster] = await pool.query('DESCRIBE modifier_master');
    result.modifier_master = modifierMaster;

    const [cartItems] = await pool.query('DESCRIBE cart_items');
    result.cart_items = cartItems;

    const [productPortion] = await pool.query('DESCRIBE product_portion');
    result.product_portion = productPortion;

    fs.writeFileSync('schema_info.json', JSON.stringify(result, null, 2));
    console.log('Schema info written to schema_info.json');
  } catch (err) {
    console.error('Failed to describe tables:', err);
  } finally {
    process.exit(0);
  }
}

checkSchema();
