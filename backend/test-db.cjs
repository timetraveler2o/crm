require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabase() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASS || '';
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;

  console.log(`Connecting to MySQL on ${host}:${port}, database: ${database}, user: ${user}...`);

  if (!database || !user) {
    console.error('Error: DB_NAME or DB_USER is missing in .env');
    process.exit(1);
  }

  try {
    const db = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database
    });

    const [rows] = await db.query('SELECT 1 AS connected');
    console.log('✅ Connection test successful:', rows);
    await db.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testDatabase();
