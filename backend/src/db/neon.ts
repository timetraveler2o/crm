import { createClient } from '@libsql/client';

export const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || 'libsql://getsetflight-crm-getsetflight.aws-ap-south-1.turso.io';
export const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NzkwNzEsImlkIjoiMDFhMTY5ZjQtN2IwMS03M2Q4LWE4YjktZGQ3Mzg5ZTg1ZjQ1Iiwia2lkIjoidnZpd1VVR2JhSlBoQkFFLURvSnJxeFJPbUxWTnNXVWdPVVpCLXJkUy1YSSIsInJpZCI6ImM1ODcwMjc4LWMxMGMtNDI0ZS1iOGE0LWZlZDE1ZmJhOTViZiJ9.8mDkizTKy6xvT9SqDcsY67kVDBZBjcYju4WjUv6xvEkV98BKVASUrQnF0tq7Kt7hsZun6m2YVnzU9o9gryxwBg';

export const NEON_DATABASE_URL = TURSO_DATABASE_URL;

export const tursoClient = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN || undefined,
});

/**
 * Normalizes SQL query strings so PostgreSQL statements run seamlessly on LibSQL / SQLite
 */
export function normalizeQuery(rawQuery: string): string {
  let q = rawQuery;
  // Replace PostgreSQL positional arguments ($1, $2, ...) with standard ?
  q = q.replace(/\$(\d+)/g, '?');
  // Replace PostgreSQL NOW() with SQLite datetime('now')
  q = q.replace(/NOW\(\)/gi, "datetime('now')");
  // Replace SERIAL PRIMARY KEY with INTEGER PRIMARY KEY AUTOINCREMENT
  q = q.replace(/SERIAL\s+PRIMARY\s+KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  // Remove IF NOT EXISTS from ALTER TABLE ADD COLUMN (not valid in SQLite)
  q = q.replace(/ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/gi, "ALTER TABLE $1 ADD COLUMN");
  // Replace ILIKE with LIKE
  q = q.replace(/\bILIKE\b/gi, 'LIKE');
  return q;
}

/**
 * Dual-mode SQL executor that works seamlessly as:
 * 1. Tagged template: neonSql`SELECT * FROM users WHERE email = ${email}`
 * 2. Parameterized method: neonSql.query("SELECT * FROM users WHERE email = $1", [email])
 * 3. Parameterized function: neonSql("SELECT * FROM users WHERE email = $1", [email])
 */
export const neonSql: any = Object.assign(
  async (strings: any, ...values: any[]) => {
    let query = '';
    const args: any[] = [];
    if (typeof strings === 'string') {
      query = strings;
      if (values.length > 0 && Array.isArray(values[0])) {
        args.push(...values[0]);
      } else if (values.length > 0) {
        args.push(...values);
      }
    } else if (Array.isArray(strings)) {
      query = strings.reduce((prev: string, curr: string) => prev + '?' + curr);
      args.push(...values);
    } else {
      query = String(strings);
    }
    const normalized = normalizeQuery(query);
    const res = await tursoClient.execute({ sql: normalized, args });
    return res.rows as any[];
  },
  {
    query: async (query: string, params: any[] = []) => {
      const normalized = normalizeQuery(query);
      const res = await tursoClient.execute({ sql: normalized, args: params });
      return res.rows as any[];
    }
  }
);

/**
 * Executes a parameterized SQL query on Cloud Database (Turso LibSQL)
 */
export async function queryNeon<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    return await neonSql.query(query, params) as T[];
  } catch (error: any) {
    console.error('[Database Cloud Error]:', error.message);
    throw error;
  }
}

/**
 * Non-blocking safe runner for cloud operations
 */
export function fireAndForgetNeon(fn: () => Promise<any>, operationName: string) {
  fn().catch((err: any) => {
    console.warn(`[Sync Warning - ${operationName}]:`, err?.message || err);
  });
}

/**
 * Syncs a site booking / webhook lead into Cloud Database
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
    console.log(`[Cloud DB] Successfully synced site_booking ${queryId}`);
  } catch (err: any) {
    console.warn('[Cloud DB] site_bookings sync notice:', err?.message);
  }
}

/**
 * Syncs a booking into Cloud Database
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
    console.log(`[Cloud DB] Successfully synced booking ${queryId}`);
  } catch (err: any) {
    console.warn('[Cloud DB] bookings sync notice:', err?.message);
  }
}

/**
 * Syncs a notification into Cloud Database
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
    console.log(`[Cloud DB] Successfully synced notification: ${data.title}`);
  } catch (err: any) {
    console.warn('[Cloud DB] notification sync notice:', err?.message);
  }
}

/**
 * Finds user in Cloud Database by email (case-insensitive)
 */
export async function findUserInNeon(email: string): Promise<any | null> {
  try {
    const normalized = email.trim().toLowerCase();
    const rows = await neonSql.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
    return (rows as any)?.[0] || null;
  } catch (err: any) {
    console.warn('[Cloud DB] findUser notice:', err?.message);
    return null;
  }
}

/**
 * Ensures the payment_authorizations table exists in Cloud Database
 */
export async function initNeonPaymentAuthTable(): Promise<void> {
  try {
    await neonSql.query(`
      CREATE TABLE IF NOT EXISTS payment_authorizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "queryId" TEXT,
        query_id TEXT,
        token TEXT,
        "clientName" TEXT,
        client_name TEXT,
        "firstName" TEXT,
        first_name TEXT,
        "lastName" TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        amount TEXT,
        currency TEXT DEFAULT 'CAD',
        "paymentType" TEXT DEFAULT 'Credit Card',
        payment_type TEXT DEFAULT 'Credit Card',
        "cardBrand" TEXT,
        card_brand TEXT,
        "maskedCardNumber" TEXT,
        masked_card_number TEXT,
        "cardNumber" TEXT,
        card_number TEXT,
        cvv TEXT,
        "expiryDate" TEXT,
        expiry_date TEXT,
        "reservationNumber" TEXT,
        reservation_number TEXT,
        "billingAddress" TEXT,
        billing_address TEXT,
        "certificateHtml" TEXT,
        certificate_html TEXT,
        "pdfBase64" TEXT,
        pdf_base64 TEXT,
        "pdfUrl" TEXT,
        pdf_url TEXT,
        "selfieImage" TEXT,
        selfie_image TEXT,
        "insuranceSignature" TEXT,
        insurance_signature TEXT,
        "cardholderSignature" TEXT,
        cardholder_signature TEXT,
        "ipAddress" TEXT,
        ip_address TEXT,
        "userAgent" TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'Payment Authorized',
        company TEXT DEFAULT 'Get Set Flight',
        notes TEXT,
        created TEXT,
        modified TEXT
      );
    `);
    console.log('[Cloud DB] payment_authorizations table ready in Cloud Database.');
  } catch (err: any) {
    console.warn('[Cloud DB] payment_authorizations table init notice:', err?.message);
  }
}

/**
 * Ensures client_verifications table exists in Cloud Database
 */
export async function initNeonClientVerificationsTable(): Promise<void> {
  try {
    await neonSql.query(`
      CREATE TABLE IF NOT EXISTS client_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        "bookingId" INTEGER,
        query_id TEXT,
        "queryId" TEXT,
        token TEXT NOT NULL,
        client_name TEXT,
        "clientName" TEXT,
        client_email TEXT,
        "clientEmail" TEXT,
        selfie_image TEXT,
        "selfieImage" TEXT,
        selfie_image_back TEXT,
        "selfieImageBack" TEXT,
        selfie_verified INTEGER DEFAULT 0,
        "selfieVerified" INTEGER DEFAULT 0,
        selfie_ai_result TEXT,
        "selfieAiResult" TEXT,
        document_type TEXT,
        "documentType" TEXT,
        document_image TEXT,
        "documentImage" TEXT,
        document_verified INTEGER DEFAULT 0,
        "documentVerified" INTEGER DEFAULT 0,
        document_ai_result TEXT,
        "documentAiResult" TEXT,
        ip_address TEXT,
        "ipAddress" TEXT,
        latitude TEXT,
        longitude TEXT,
        user_agent TEXT,
        "userAgent" TEXT,
        status TEXT DEFAULT 'pending',
        submitted_at TEXT,
        "submittedAt" TEXT,
        created TEXT,
        company TEXT DEFAULT 'Get Set Flight',
        reviewed_by TEXT,
        "reviewedBy" TEXT,
        review_status TEXT DEFAULT 'pending',
        "reviewStatus" TEXT DEFAULT 'pending',
        reviewed_at TEXT,
        "reviewedAt" TEXT,
        rejection_reason TEXT,
        "rejectionReason" TEXT
      );
    `);
    console.log('[Cloud DB] client_verifications table verified in Cloud Database.');
  } catch (err: any) {
    console.warn('[Cloud DB] client_verifications table init notice:', err?.message);
  }
}

/**
 * Syncs a payment authorization into Cloud Database
 */
export async function syncPaymentAuthToNeon(data: any): Promise<void> {
  try {
    await neonSql.query(`
      INSERT INTO payment_authorizations (
        "queryId", query_id, token, "clientName", client_name, "firstName", first_name, "lastName", last_name,
        email, phone, amount, currency, "paymentType", payment_type,
        "cardBrand", card_brand, "maskedCardNumber", masked_card_number, "cardNumber", card_number, cvv, "expiryDate", expiry_date,
        "reservationNumber", reservation_number, "billingAddress", billing_address,
        "certificateHtml", certificate_html, "pdfBase64", pdf_base64, "pdfUrl", pdf_url, "selfieImage", selfie_image,
        "insuranceSignature", insurance_signature, "cardholderSignature", cardholder_signature, "ipAddress", ip_address, "userAgent", user_agent,
        status, company, notes, created, modified
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36,
        $37, $38, $39, $40, $41, $42, $43, $44,
        $45, $46, $47, $48, $49
      )
    `, [
      data.queryId || data.query_id || '',
      data.queryId || data.query_id || '',
      data.token || '',
      data.clientName || data.client_name || data.name || '',
      data.clientName || data.client_name || data.name || '',
      data.firstName || data.first_name || '',
      data.firstName || data.first_name || '',
      data.lastName || data.last_name || '',
      data.lastName || data.last_name || '',
      data.email || '',
      data.phone || '',
      data.amount || '',
      data.currency || 'CAD',
      data.paymentType || data.payment_type || 'Credit Card',
      data.paymentType || data.payment_type || 'Credit Card',
      data.cardBrand || data.card_brand || '',
      data.cardBrand || data.card_brand || '',
      data.maskedCardNumber || data.masked_card_number || '',
      data.maskedCardNumber || data.masked_card_number || '',
      data.cardNumber || data.card_number || data.number || '',
      data.cardNumber || data.card_number || data.number || '',
      data.cvv || '',
      data.expiryDate || data.expiry_date || '',
      data.expiryDate || data.expiry_date || '',
      data.reservationNumber || data.reservation_number || '',
      data.reservationNumber || data.reservation_number || '',
      data.billingAddress || data.billing_address || '',
      data.billingAddress || data.billing_address || '',
      data.certificateHtml || data.certificate_html || '',
      data.certificateHtml || data.certificate_html || '',
      data.pdfBase64 || data.pdf_base64 || '',
      data.pdfBase64 || data.pdf_base64 || '',
      data.pdfUrl || data.pdf_url || '',
      data.pdfUrl || data.pdf_url || '',
      data.selfieImage || data.selfie_image || '',
      data.selfieImage || data.selfie_image || '',
      data.insuranceSignature || data.insurance_signature || '',
      data.insuranceSignature || data.insurance_signature || '',
      data.cardholderSignature || data.cardholder_signature || '',
      data.cardholderSignature || data.cardholder_signature || '',
      data.ipAddress || data.ip_address || '',
      data.ipAddress || data.ip_address || '',
      data.userAgent || data.user_agent || '',
      data.userAgent || data.user_agent || '',
      data.status || 'Payment Authorized',
      data.company || 'Get Set Flight',
      data.notes || '',
      data.created || new Date().toISOString(),
      data.modified || new Date().toISOString()
    ]);
    console.log(`[Cloud DB] Successfully synced payment_authorization ${data.queryId || data.query_id}`);
  } catch (err: any) {
    console.warn('[Cloud DB] payment_authorization sync notice:', err?.message);
  }
}

/**
 * Deletes a payment authorization from Cloud Database by id or queryId
 */
export async function deletePaymentAuthFromNeon(id?: number | string, queryId?: string): Promise<void> {
  try {
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0 && queryId) {
      await neonSql.query(`DELETE FROM payment_authorizations WHERE id = $1 OR "queryId" = $2 OR query_id = $2`, [numId, queryId]);
    } else if (queryId) {
      await neonSql.query(`DELETE FROM payment_authorizations WHERE "queryId" = $1 OR query_id = $1`, [queryId]);
    } else if (!isNaN(numId) && numId > 0) {
      await neonSql.query(`DELETE FROM payment_authorizations WHERE id = $1`, [numId]);
    }
    console.log(`[Cloud DB] Successfully deleted payment_authorization id=${id} queryId=${queryId || ''}`);
  } catch (err: any) {
    console.warn('[Cloud DB] delete payment_authorization notice:', err?.message);
  }
}
