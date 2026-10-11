require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || '';
const sql = neon(DATABASE_URL);

async function seed() {
  console.log('Seeding Neon database...');

  // Default Roles
  const defaultRoles = [
    { roleName: 'Admin', permissions: JSON.stringify(['All']), status: 'Active', company: 'Get Set Flight' },
    { roleName: 'Manager', permissions: JSON.stringify(['Booking Management', 'Reports', 'User Management']), status: 'Active', company: 'Get Set Flight' },
    { roleName: 'Agent', permissions: JSON.stringify(['Booking Management']), status: 'Active', company: 'Get Set Flight' },
    { roleName: 'Supervisor', permissions: JSON.stringify(['Booking Management', 'Reports']), status: 'Active', company: 'Get Set Flight' }
  ];

  for (const r of defaultRoles) {
    await sql.query(`
      INSERT INTO roles ("roleName", permissions, status, company, created, modified)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [r.roleName, r.permissions, r.status, r.company]);
  }
  console.log('Roles seeded.');

  // Default Query Statuses
  const defaultStatuses = [
    'New Query',
    'Follow Up',
    'Under Process',
    'Send to QC',
    'Confirmed',
    'Ticketed',
    'Cancelled'
  ];

  for (const s of defaultStatuses) {
    await sql.query(`
      INSERT INTO query_statuses (name, status, company, created, modified)
      VALUES ($1, 'Active', 'Get Set Flight', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [s]);
  }
  console.log('Query statuses seeded.');

  // Default Admin User
  await sql.query(`
    INSERT INTO users (name, role, email, status, company, created, modified)
    VALUES ('Super Admin', 'Admin', 'admin@getsetflight.com', 'Active', 'Get Set Flight', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  console.log('Default Admin user seeded.');

  console.log('Neon database seeding complete!');
}

seed().catch(console.error);
