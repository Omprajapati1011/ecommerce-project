import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../configs/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const migrationPath = path.join(__dirname, '../migrations/add_modifier_combinations.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Starting migration: ${statements.length} statements found.`);

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      await pool.query(statement);
      console.log('✓ Success');
    } catch (err) {
      // Ignore "Duplicate column name" (1060) and "Duplicate key name" (1061)
      if (err.errno === 1060 || err.errno === 1061) {
        console.warn(`! Skipping: ${err.sqlMessage}`);
      } else if (err.errno === 1050) { // Table already exists
        console.warn(`! Skipping: ${err.sqlMessage}`);
      } else {
        console.error('✗ Failed!');
        console.error('Statement:', statement);
        console.error('Error:', err);
        process.exit(1);
      }
    }
  }
  process.exit(0);
}

runMigration();
