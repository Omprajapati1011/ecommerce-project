import fs from 'fs';
import pool from '../configs/db.js';

async function checkExactSchema() {
  try {
    const [rows] = await pool.query('SHOW CREATE TABLE modifier_master');
    fs.writeFileSync('create_modifier_master.txt', rows[0]['Create Table']);
    console.log('Detailed schema written to create_modifier_master.txt');
  } catch (err) {
    console.error('Failed to show create table:', err);
  } finally {
    process.exit(0);
  }
}

checkExactSchema();
