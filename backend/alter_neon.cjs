require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL || '');
async function run() {
  await sql.query('ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "cardNumber" TEXT;');
  await sql.query('ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "cvv" TEXT;');
  await sql.query('ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "expiryDate" TEXT;');
  console.log('Columns added successfully to Neon!');
  const cols = await sql.query("SELECT column_name FROM information_schema.columns WHERE table_name='payment_authorizations'");
  console.log('Cols:', cols.map(c => c.column_name));
}
run().catch(console.error);
