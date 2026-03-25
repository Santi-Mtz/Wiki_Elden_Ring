const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
}

async function initDb() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');

  try {
    await runSqlFile(schemaPath);
    await runSqlFile(seedPath);
    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void initDb();
