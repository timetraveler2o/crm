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

    await client.execute(`
      CREATE TABLE IF NOT EXISTS client_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        query_id TEXT,
        token TEXT NOT NULL,
        client_name TEXT,
        client_email TEXT,
        selfie_image TEXT,
        selfie_image_back TEXT,
        selfie_verified INTEGER DEFAULT 0,
        selfie_ai_result TEXT,
        document_type TEXT,
        document_image TEXT,
        document_verified INTEGER DEFAULT 0,
        document_ai_result TEXT,
        ip_address TEXT,
        latitude TEXT,
        longitude TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'pending',
        submitted_at TEXT,
        created TEXT,
        company TEXT DEFAULT 'Get Set Flight',
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'pending',
        reviewed_at TEXT,
        rejection_reason TEXT
      );
    `);
    await client.execute('ALTER TABLE client_verifications ADD COLUMN selfie_image_back TEXT;').catch(() => {});
    await client.execute('ALTER TABLE client_verifications ADD COLUMN rejection_reason TEXT;').catch(() => {});
    console.log('[DB Init] client_verifications table verified in SQLite.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        performedBy TEXT NOT NULL,
        performedByRole TEXT DEFAULT '',
        targetType TEXT NOT NULL,
        targetId TEXT DEFAULT '',
        targetName TEXT NOT NULL,
        details TEXT NOT NULL,
        changes TEXT DEFAULT '',
        created TEXT NOT NULL
      );
    `).catch(() => {});
    await client.execute('ALTER TABLE users ADD COLUMN permissions TEXT;').catch(() => {});
    await client.execute("UPDATE roles SET roleName = 'Travel Consultant' WHERE LOWER(roleName) = 'agent';").catch(() => {});
    await client.execute("UPDATE users SET role = 'Travel Consultant' WHERE LOWER(role) = 'agent';").catch(() => {});

  } catch (err: any) {
    console.warn('[DB Init] tables notice:', err?.message);
  }
};
