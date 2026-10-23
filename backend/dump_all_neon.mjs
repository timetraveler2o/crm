import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_gmvBZ2j8xFun@ep-misty-sound-arkbxxkq-pooler.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function dumpAllFromNeon() {
  console.log('Connecting to Neon PostgreSQL database...');
  const sql = neon(NEON_DATABASE_URL);

  try {
    // 1. Get all user tables in public schema
    const tablesRes = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log(`Found ${tablesRes.length} tables in Neon PostgreSQL public schema:`);
    const tablesWithData = [];

    for (const t of tablesRes) {
      try {
        const rows = await sql.query(`SELECT * FROM "${t.table_name}"`);
        console.log(`- ${t.table_name}: ${rows.length} rows`);
        if (rows.length > 0) {
          tablesWithData.push({ name: t.table_name, rows });
        }
      } catch (e) {
        console.warn(`Could not read ${t.table_name}:`, e.message);
      }
    }

    console.log(`\nTables with data: ${tablesWithData.map(t => `${t.name} (${t.rows.length})`).join(', ')}`);

    // Let's generate a complete SQL insert file for MySQL
    function escapeSql(val) {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'object') return "'" + String(JSON.stringify(val)).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
      return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
    }

    let mysqlSql = `-- =========================================================================\n`;
    mysqlSql += `-- Complete Data Dump from Live Neon PostgreSQL for Hostinger MySQL\n`;
    mysqlSql += `-- Generated: ${new Date().toISOString()}\n`;
    mysqlSql += `-- Safe for WordPress shared databases: Does NOT touch wp_* tables\n`;
    mysqlSql += `-- =========================================================================\n\n`;
    mysqlSql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    mysqlSql += `SET NAMES utf8mb4;\n\n`;

    for (const item of tablesWithData) {
      const tbl = item.name;
      const rows = item.rows;
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const colList = cols.map(c => `\`${c}\``).join(', ');

      mysqlSql += `-- -----------------------------------------------------\n`;
      mysqlSql += `-- Data for \`${tbl}\` (${rows.length} rows from Neon)\n`;
      mysqlSql += `-- -----------------------------------------------------\n`;

      for (const row of rows) {
        const valList = cols.map(c => escapeSql(row[c])).join(', ');
        mysqlSql += `INSERT INTO \`${tbl}\` (${colList}) VALUES (${valList}) ON DUPLICATE KEY UPDATE id=id;\n`;
      }
      mysqlSql += `\n`;
    }

    mysqlSql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    mysqlSql += `-- End of Neon dump\n`;

    const outPath = path.join(process.cwd(), 'neon_migrated_data.sql');
    fs.writeFileSync(outPath, mysqlSql, 'utf8');
    console.log(`\n✅ Successfully generated: ${outPath} (${mysqlSql.length} bytes)`);

  } catch (err) {
    console.error('Error connecting to Neon:', err);
  }
}

dumpAllFromNeon();
