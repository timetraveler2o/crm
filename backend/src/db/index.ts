import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

// Load database for LibSQL (Turso Cloud Database or local SQLite fallback)
const dbUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || 'libsql://getsetflight-crm-getsetflight.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NzkwNzEsImlkIjoiMDFhMTY5ZjQtN2IwMS03M2Q4LWE4YjktZGQ3Mzg5ZTg1ZjQ1Iiwia2lkIjoidnZpd1VVR2JhSlBoQkFFLURvSnJxeFJPbUxWTnNXVWdPVVpCLXJkUy1YSSIsInJpZCI6ImM1ODcwMjc4LWMxMGMtNDI0ZS1iOGE0LWZlZDE1ZmJhOTViZiJ9.8mDkizTKy6xvT9SqDcsY67kVDBZBjcYju4WjUv6xvEkV98BKVASUrQnF0tq7Kt7hsZun6m2YVnzU9o9gryxwBg';

export const client = createClient({
  url: dbUrl,
  authToken: authToken || undefined,
});

export const db = drizzle(client, { schema });

// Initialize tables if they don't exist
export const initDb = async () => {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS payment_authorizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_id TEXT,
        queryId TEXT,
        token TEXT,
        client_name TEXT,
        clientName TEXT,
        first_name TEXT,
        firstName TEXT,
        last_name TEXT,
        lastName TEXT,
        email TEXT,
        phone TEXT,
        amount TEXT,
        currency TEXT DEFAULT 'CAD',
        payment_type TEXT DEFAULT 'Credit Card',
        paymentType TEXT DEFAULT 'Credit Card',
        card_brand TEXT,
        cardBrand TEXT,
        masked_card_number TEXT,
        maskedCardNumber TEXT,
        card_number TEXT,
        cardNumber TEXT,
        cvv TEXT,
        expiry_date TEXT,
        expiryDate TEXT,
        reservation_number TEXT,
        reservationNumber TEXT,
        billing_address TEXT,
        billingAddress TEXT,
        certificate_html TEXT,
        certificateHtml TEXT,
        pdf_base64 TEXT,
        pdfBase64 TEXT,
        pdf_url TEXT,
        pdfUrl TEXT,
        selfie_image TEXT,
        selfieImage TEXT,
        insurance_signature TEXT,
        insuranceSignature TEXT,
        cardholder_signature TEXT,
        cardholderSignature TEXT,
        ip_address TEXT,
        ipAddress TEXT,
        user_agent TEXT,
        userAgent TEXT,
        status TEXT DEFAULT 'Payment Authorized',
        company TEXT DEFAULT 'Get Set Flight',
        notes TEXT,
        created TEXT,
        modified TEXT
      );
    `);
    // Ensure all compatibility columns exist
    const pCols = ['card_number', 'cardNumber', 'cvv', 'expiry_date', 'expiryDate', 'queryId', 'clientName', 'firstName', 'lastName', 'paymentType', 'cardBrand', 'maskedCardNumber', 'reservationNumber', 'billingAddress', 'certificateHtml', 'pdfBase64', 'pdfUrl', 'selfieImage', 'insuranceSignature', 'cardholderSignature', 'ipAddress', 'userAgent'];
    for (const c of pCols) {
      await client.execute(`ALTER TABLE payment_authorizations ADD COLUMN "${c}" TEXT;`).catch(() => {});
    }
    console.log('[DB Init] payment_authorizations table verified in Turso.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS client_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        bookingId INTEGER,
        query_id TEXT,
        queryId TEXT,
        token TEXT NOT NULL,
        client_name TEXT,
        clientName TEXT,
        client_email TEXT,
        clientEmail TEXT,
        selfie_image TEXT,
        selfieImage TEXT,
        selfie_image_back TEXT,
        selfieImageBack TEXT,
        selfie_verified INTEGER DEFAULT 0,
        selfieVerified INTEGER DEFAULT 0,
        selfie_ai_result TEXT,
        selfieAiResult TEXT,
        document_type TEXT,
        documentType TEXT,
        document_image TEXT,
        documentImage TEXT,
        document_verified INTEGER DEFAULT 0,
        documentVerified INTEGER DEFAULT 0,
        document_ai_result TEXT,
        documentAiResult TEXT,
        ip_address TEXT,
        ipAddress TEXT,
        latitude TEXT,
        longitude TEXT,
        user_agent TEXT,
        userAgent TEXT,
        status TEXT DEFAULT 'pending',
        submitted_at TEXT,
        submittedAt TEXT,
        created TEXT,
        company TEXT DEFAULT 'Get Set Flight',
        reviewed_by TEXT,
        reviewedBy TEXT,
        review_status TEXT DEFAULT 'pending',
        reviewStatus TEXT DEFAULT 'pending',
        reviewed_at TEXT,
        reviewedAt TEXT,
        rejection_reason TEXT,
        rejectionReason TEXT
      );
    `);
    const cvCols = ['selfie_image_back', 'selfieImageBack', 'rejection_reason', 'rejectionReason', 'bookingId', 'queryId', 'clientName', 'clientEmail', 'selfieImage', 'selfieVerified', 'selfieAiResult', 'documentType', 'documentImage', 'documentVerified', 'documentAiResult', 'ipAddress', 'userAgent', 'submittedAt', 'reviewedBy', 'reviewStatus', 'reviewedAt'];
    for (const c of cvCols) {
      await client.execute(`ALTER TABLE client_verifications ADD COLUMN "${c}" TEXT;`).catch(() => {});
    }
    console.log('[DB Init] client_verifications table verified in Turso.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        "updatedBy" TEXT,
        "updatedAt" TEXT
      );
    `).catch(() => {});

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

    // Ensure unique indexes for UPSERT operations
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_queryId ON bookings(queryId);').catch(() => {});
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_site_bookings_queryId ON site_bookings(queryId);').catch(() => {});
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);').catch(() => {});
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);').catch(() => {});

    await client.execute('ALTER TABLE users ADD COLUMN permissions TEXT;').catch(() => {});
    await client.execute('ALTER TABLE roles ADD COLUMN name TEXT;').catch(() => {});
    await client.execute('ALTER TABLE roles ADD COLUMN isSystem INTEGER DEFAULT 0;').catch(() => {});
    await client.execute("UPDATE roles SET name = roleName WHERE name IS NULL OR name = '';").catch(() => {});
    await client.execute("UPDATE roles SET roleName = 'Travel Consultant' WHERE LOWER(roleName) = 'agent';").catch(() => {});
    await client.execute("UPDATE users SET role = 'Travel Consultant' WHERE LOWER(role) = 'agent';").catch(() => {});

    console.log('[DB Init] Database schema and indexes verified on Turso Cloud Database.');
  } catch (err: any) {
    console.warn('[DB Init] tables notice:', err?.message);
  }
};
