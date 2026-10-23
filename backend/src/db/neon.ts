import { neon } from '@neondatabase/serverless';

const DEFAULT_NEON_URL = "postgresql://neondb_owner:npg_gmvBZ2j8xFun@ep-misty-sound-arkbxxkq-pooler.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const envUrl = process.env.DATABASE_URL || '';
export const NEON_DATABASE_URL = (!envUrl || envUrl.includes('ep-odd-hat-b4bwqvtu')) ? DEFAULT_NEON_URL : envUrl;

const rawNeon = NEON_DATABASE_URL ? neon(NEON_DATABASE_URL) : null;
export const neonSql: any = Object.assign(
  (query: any, ...params: any[]) => {
    if (!rawNeon) return Promise.resolve([]);
    if (typeof query === 'string' && params.length === 1 && Array.isArray(params[0])) {
      return (rawNeon as any)(query, params[0]);
    }
    return (rawNeon as any)(query, ...params);
  },
  {
    query: (query: string, params: any[] = []) => rawNeon ? (rawNeon as any)(query, params) : Promise.resolve([])
  }
);

/**
 * Executes a parameterized SQL query on Neon PostgreSQL
 */
export async function queryNeon<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    return await neonSql.query(query, params) as T[];
  } catch (error: any) {
    console.error('[Neon Postgres Error]:', error.message);
    throw error;
  }
}

/**
 * Non-blocking safe runner for Neon cloud operations
 */
export function fireAndForgetNeon(fn: () => Promise<any>, operationName: string) {
  fn().catch((err: any) => {
    console.warn(`[Neon Sync Warning - ${operationName}]:`, err?.message || err);
  });
}

/**
 * Syncs a site booking / webhook lead into Neon PostgreSQL
 */
export async function syncSiteBookingToNeon(data: any): Promise<void> {
  try {
    const queryId = data.queryId;
    if (!queryId) return;

    await neonSql.query(`
      INSERT INTO site_bookings (
        "queryId", name, email, phone, origin, destination, "travelDates",
        assignment, created, adults, children, infants, "cabinClass",
        passengers, "departDate", status, source, modified, trip_type,
        cabin, departure_date, return_date, raw_data, "assignedTo", company
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT ("queryId") DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        origin = EXCLUDED.origin,
        destination = EXCLUDED.destination,
        status = EXCLUDED.status,
        modified = EXCLUDED.modified,
        assignment = EXCLUDED.assignment,
        "assignedTo" = EXCLUDED."assignedTo"
    `, [
      data.queryId,
      data.name || '',
      data.email || '',
      data.phone || '',
      data.origin || '',
      data.destination || '',
      data.travelDates || data.departDate || '',
      data.assignment || 'Unassigned',
      data.created || new Date().toISOString(),
      Number(data.adults || 1),
      Number(data.children || 0),
      Number(data.infants || 0),
      data.cabinClass || data.cabin || 'Economy',
      typeof data.passengers === 'string' ? data.passengers : JSON.stringify(data.passengers || []),
      data.departDate || data.departureDate || '',
      data.status || 'New',
      data.source || 'Website Form',
      data.modified || data.created || new Date().toISOString(),
      data.tripType || data.trip_type || 'One Way',
      data.cabin || data.cabinClass || 'Economy',
      data.departureDate || data.departDate || '',
      data.returnDate || data.return_date || '',
      typeof data.rawData === 'string' ? data.rawData : JSON.stringify(data.rawData || {}),
      data.assignedTo || '',
      data.company || 'Get Set Flight'
    ]);
    console.log(`[Neon Cloud DB] Successfully synced site_booking ${queryId}`);
  } catch (err: any) {
    console.warn('[Neon Cloud DB] site_bookings sync notice:', err?.message);
  }
}

/**
 * Syncs a booking into Neon PostgreSQL
 */
export async function syncBookingToNeon(data: any): Promise<void> {
  try {
    const queryId = data.queryId;
    if (!queryId) return;

    await neonSql.query(`
      INSERT INTO bookings (
        "queryId", "addedBy", "firstName", "lastName", email, phone,
        origin, destination, "departureDate", "returnDate", cabin,
        adults, children, infants, "queryStatus", "querySource", remarks,
        "partialPayment", pnr, created, modified, images, pnr_details,
        trip_type, currency, qc_status, company
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27
      )
      ON CONFLICT ("queryId") DO UPDATE SET
        "queryStatus" = EXCLUDED."queryStatus",
        modified = EXCLUDED.modified,
        pnr = EXCLUDED.pnr,
        pnr_details = EXCLUDED.pnr_details,
        images = EXCLUDED.images,
        remarks = EXCLUDED.remarks,
        "partialPayment" = EXCLUDED."partialPayment",
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        origin = EXCLUDED.origin,
        destination = EXCLUDED.destination,
        "departureDate" = EXCLUDED."departureDate",
        "returnDate" = EXCLUDED."returnDate",
        cabin = EXCLUDED.cabin,
        adults = EXCLUDED.adults,
        children = EXCLUDED.children,
        infants = EXCLUDED.infants,
        trip_type = EXCLUDED.trip_type,
        currency = EXCLUDED.currency,
        qc_status = EXCLUDED.qc_status,
        company = EXCLUDED.company,
        "addedBy" = EXCLUDED."addedBy"
    `, [
      data.queryId,
      data.addedBy || '',
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.origin || '',
      data.destination || '',
      data.departureDate || '',
      data.returnDate || '',
      data.cabin || 'Economy',
      Number(data.adults || 1),
      Number(data.children || 0),
      Number(data.infants || 0),
      data.queryStatus || 'New Query',
      data.querySource || 'Website',
      data.remarks || '',
      data.partialPayment || '',
      data.pnr || '',
      data.created || new Date().toISOString(),
      data.modified || new Date().toISOString(),
      typeof data.images === 'string' ? data.images : JSON.stringify(data.images || []),
      data.pnrDetails || data.pnr_details || '',
      data.tripType || data.trip_type || 'One Way',
      data.currency || 'INR',
      data.qcStatus || data.qc_status || 'NULL',
      data.company || 'Get Set Flight'
    ]);
    console.log(`[Neon Cloud DB] Successfully synced booking ${queryId}`);
  } catch (err: any) {
    console.warn('[Neon Cloud DB] bookings sync notice:', err?.message);
  }
}

/**
 * Syncs a notification into Neon PostgreSQL
 */
export async function syncNotificationToNeon(data: any): Promise<void> {
  try {
    await neonSql.query(`
      INSERT INTO crm_notifications (
        "targetRole", "targetUserId", title, message, type,
        "bookingId", "queryId", "isRead", "createdBy", created, company
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      data.targetRole || 'all',
      data.targetUserId ? Number(data.targetUserId) : null,
      data.title || 'Notification',
      data.message || '',
      data.type || 'info',
      data.bookingId ? Number(data.bookingId) : null,
      data.queryId || '',
      data.isRead ? 1 : 0,
      data.createdBy || 'System',
      data.created || new Date().toISOString(),
      data.company || 'Get Set Flight'
    ]);
    console.log(`[Neon Cloud DB] Successfully synced notification: ${data.title}`);
  } catch (err: any) {
    console.warn('[Neon Cloud DB] notification sync notice:', err?.message);
  }
}

/**
 * Finds user in Neon by email (case-insensitive)
 */
export async function findUserInNeon(email: string): Promise<any | null> {
  try {
    const normalized = email.trim().toLowerCase();
    const rows = await neonSql.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
    return (rows as any)?.[0] || null;
  } catch (err: any) {
    console.warn('[Neon Cloud DB] findUserInNeon notice:', err?.message);
    return null;
  }
}

/**
 * Ensures the payment_authorizations table exists in Neon PostgreSQL
 */
export async function initNeonPaymentAuthTable(): Promise<void> {
  try {
    await neonSql.query(`
      CREATE TABLE IF NOT EXISTS payment_authorizations (
        id SERIAL PRIMARY KEY,
        "queryId" TEXT,
        token TEXT,
        "clientName" TEXT,
        "firstName" TEXT,
        "lastName" TEXT,
        email TEXT,
        phone TEXT,
        amount TEXT,
        currency TEXT DEFAULT 'CAD',
        "paymentType" TEXT DEFAULT 'Credit Card',
        "cardBrand" TEXT,
        "maskedCardNumber" TEXT,
        "cardNumber" TEXT,
        cvv TEXT,
        "expiryDate" TEXT,
        "reservationNumber" TEXT,
        "billingAddress" TEXT,
        "certificateHtml" TEXT,
        "pdfBase64" TEXT,
        "pdfUrl" TEXT,
        "selfieImage" TEXT,
        "insuranceSignature" TEXT,
        "cardholderSignature" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        status TEXT DEFAULT 'Payment Authorized',
        company TEXT DEFAULT 'Get Set Flight',
        notes TEXT,
        created TEXT,
        modified TEXT
      );
    `);
    // Ensure all columns exist even if table was created previously
    const extraCols = [
      'ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "cardNumber" TEXT;',
      'ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS cvv TEXT;',
      'ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "expiryDate" TEXT;',
      'ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "certificateHtml" TEXT;',
      'ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "pdfBase64" TEXT;',
      'ALTER TABLE payment_authorizations ADD COLUMN IF NOT EXISTS "cardholderSignature" TEXT;'
    ];
    for (const stmt of extraCols) {
      await neonSql.query(stmt).catch(() => {});
    }
    console.log('[Neon Cloud DB] payment_authorizations table ready in Neon.');
  } catch (err: any) {
    console.warn('[Neon Cloud DB] payment_authorizations table init notice:', err?.message);
  }
}

/**
 * Ensures client_verifications table exists in Neon PostgreSQL
 */
export async function initNeonClientVerificationsTable(): Promise<void> {
  try {
    await neonSql.query(`
      CREATE TABLE IF NOT EXISTS client_verifications (
        id SERIAL PRIMARY KEY,
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
    console.log('[Neon Cloud DB] client_verifications table verified in Neon.');
  } catch (err: any) {
    console.warn('[Neon Cloud DB] client_verifications table init notice:', err?.message);
  }
}

/**
 * Syncs a payment authorization into Neon PostgreSQL
 */
export async function syncPaymentAuthToNeon(data: any): Promise<void> {
  try {
    await neonSql.query(`
      INSERT INTO payment_authorizations (
        "queryId", token, "clientName", "firstName", "lastName",
        email, phone, amount, currency, "paymentType",
        "cardBrand", "maskedCardNumber", "cardNumber", cvv, "expiryDate", "reservationNumber", "billingAddress",
        "certificateHtml", "pdfBase64", "pdfUrl", "selfieImage",
        "insuranceSignature", "cardholderSignature", "ipAddress", "userAgent",
        status, company, notes, created, modified
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24, $25,
        $26, $27, $28, $29, $30
      )
    `, [
      data.queryId || '',
      data.token || '',
      data.clientName || data.name || '',
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.amount || '',
      data.currency || 'CAD',
      data.paymentType || 'Credit Card',
      data.cardBrand || '',
      data.maskedCardNumber || '',
      data.cardNumber || data.number || '',
      data.cvv || '',
      data.expiryDate || data.expiry_date || '',
      data.reservationNumber || '',
      data.billingAddress || '',
      data.certificateHtml || data.certificate_html || '',
      data.pdfBase64 || data.pdf_base64 || '',
      data.pdfUrl || data.pdf_url || '',
      data.selfieImage || '',
      data.insuranceSignature || '',
      data.cardholderSignature || '',
      data.ipAddress || '',
      data.userAgent || '',
      data.status || 'Payment Authorized',
      data.company || 'Get Set Flight',
      data.notes || '',
      data.created || new Date().toISOString(),
      data.modified || new Date().toISOString()
    ]);
    console.log(`[Neon Cloud DB] Successfully synced payment_authorization ${data.queryId}`);
  } catch (err: any) {
    console.warn('[Neon Cloud DB] payment_authorization sync notice:', err?.message);
  }
}

/**
 * Deletes a payment authorization from Neon PostgreSQL by id or queryId
 */
export async function deletePaymentAuthFromNeon(id?: number | string, queryId?: string): Promise<void> {
  try {
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0 && queryId) {
      await neonSql.query(`DELETE FROM payment_authorizations WHERE id = $1 OR "queryId" = $2`, [numId, queryId]);
    } else if (queryId) {
      await neonSql.query(`DELETE FROM payment_authorizations WHERE "queryId" = $1`, [queryId]);
    } else if (!isNaN(numId) && numId > 0) {
      await neonSql.query(`DELETE FROM payment_authorizations WHERE id = $1`, [numId]);
    }
    console.log(`[Neon Cloud DB] Successfully deleted payment_authorization id=${id} queryId=${queryId || ''}`);
  } catch (err: any) {
    console.warn('[Neon Cloud DB] delete payment_authorization notice:', err?.message);
  }
}
