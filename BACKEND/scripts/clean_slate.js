import pool from '../configs/db.js';

const tables = [
  'activity_logs', 'review_helpful', 'product_reviews', 'offer_usage',
  'payment_master', 'order_items', 'order_master', 'cart_item_modifiers',
  'cart_items', 'cart_master', 'product_images', 'modifier_combination',
  'modifier_portion', 'product_portion', 'product_categories',
  'product_master', 'category_master', 'modifier_master', 'portion_master'
];

async function cleanSlate() {
  console.log('--- Starting Database Cleanup ---');
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) {
      try {
        console.log(`Cleaning table: ${table}...`);
        await pool.query(`TRUNCATE TABLE ??`, [table]);
      } catch (err) {
        if (err.errno === 1146) {
          console.warn(`Table ${table} does not exist, skipping...`);
        } else {
          console.warn(`Could not truncate ${table}, trying DELETE instead...`);
          try {
            await pool.query(`DELETE FROM ??`, [table]);
          } catch (deleteErr) {
            console.error(`Failed to clean table ${table}:`, deleteErr.message);
          }
        }
      }
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('--- Database Cleanup Successful ---');
  } catch (err) {
    console.error('--- Cleanup Failed ---');
    console.error(err);
  } finally {
    process.exit(0);
  }
}

cleanSlate();
