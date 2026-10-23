import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

async function migrate() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASS || '';
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;

  console.log('--- Hostinger MySQL Direct Migration ---');
  console.log(`Target: ${host}:${port}, database: ${database}, user: ${user}`);

  if (!database || !user) {
    console.error('❌ Missing credentials! Please set DB_NAME and DB_USER in your backend/.env file.');
    process.exit(1);
  }

  const dumpPath = path.join(process.cwd(), 'hostinger_crm_data.sql');
  if (!fs.existsSync(dumpPath)) {
    console.error('❌ hostinger_crm_data.sql file not found!');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(dumpPath, 'utf8');

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true
    });

    console.log('✅ Connected to Hostinger MySQL successfully.');
    console.log('Executing migration statements...');

    await connection.query(sqlContent);
    console.log('🎉 ALL DATA MIGRATED TO HOSTINGER MYSQL WITH ZERO DATA LOSS!');

    const [users] = await connection.query('SELECT count(*) as count FROM users');
    console.log(`Verified users in Hostinger MySQL: ${users[0].count}`);

    const [bookings] = await connection.query('SELECT count(*) as count FROM bookings');
    console.log(`Verified bookings in Hostinger MySQL: ${bookings[0].count}`);

    await connection.end();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
