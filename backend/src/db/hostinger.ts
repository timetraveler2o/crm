import { getMySqlPool, isMySqlActive, initMySqlTables } from './mysql';

/**
 * Hostinger MySQL Integration Layer
 * Replaces all external cloud databases (Neon, Turso) with Hostinger MySQL.
 * Strictly avoids touching any WordPress (wp_*) tables.
 */

export function isHostingerActive(): boolean {
  return isMySqlActive();
}

/**
 * Non-blocking safe runner for Hostinger MySQL operations
 */
export function fireAndForgetHostinger(fn: () => Promise<any>, operationName: string) {
  fn().catch((err: any) => {
    console.warn(`[Hostinger MySQL Notice - ${operationName}]:`, err?.message || err);
  });
}

// Backward compatibility alias
export const fireAndForgetNeon = fireAndForgetHostinger;

/**
 * Executes a parameterized SQL query on Hostinger MySQL
 * Automatically adapts PostgreSQL queries (quotes, $1 placeholders, RETURNING) for MySQL compatibility.
 */
export async function queryHostinger<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getMySqlPool();
  if (!pool) return [];
  try {
    let mysqlSql = sql;
    // 1. Convert PostgreSQL double quoted identifiers "addedBy" to MySQL backticks `addedBy`
    mysqlSql = mysqlSql.replace(/"([a-zA-Z0-9_]+)"/g, '`$1`');

    // 2. Convert PostgreSQL $1, $2, etc. placeholders to MySQL ?
    mysqlSql = mysqlSql.replace(/\$(\d+)/g, '?');

    // 3. Handle RETURNING clause which is unsupported in MySQL
    const returningMatch = mysqlSql.match(/\s+RETURNING\s+([\s\S]+)$/i);
    let isInsertWithReturning = false;
    let tableName = '';
    if (returningMatch) {
      const tableMatch = mysqlSql.match(/INSERT\s+INTO\s+[`"]?([a-zA-Z0-9_]+)[`"]?/i);
      if (tableMatch) {
        tableName = tableMatch[1];
        isInsertWithReturning = true;
      }
      mysqlSql = mysqlSql.replace(/\s+RETURNING\s+[\s\S]+$/i, '');
    }

    const [result]: any = await pool.query(mysqlSql, params);

    // If it was an INSERT with RETURNING, fetch the created row
    if (isInsertWithReturning && result && result.insertId && tableName) {
      const [newRow]: any = await pool.query(`SELECT * FROM \`${tableName}\` WHERE id = ? LIMIT 1`, [result.insertId]);
      return newRow as T[];
    }

    if (Array.isArray(result)) {
      return result as T[];
    }
    return [result] as T[];
  } catch (error: any) {
    console.warn('[Hostinger MySQL Query Notice]:', error.message);
    return [];
  }
}

// Backward compatibility alias
export const queryNeon = queryHostinger;

export const hostingerSql: any = {
  query: async (sql: string, params: any[] = []) => {
    return await queryHostinger(sql, params);
  }
};

// Backward compatibility alias
export const neonSql = hostingerSql;

/**
 * Find user by email in Hostinger MySQL
 */
export async function findUserInHostinger(email: string): Promise<any | null> {
  const pool = getMySqlPool();
  if (!pool) return null;
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email.trim().toLowerCase()]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err: any) {
    console.warn('[Hostinger MySQL findUser Notice]:', err.message);
    return null;
  }
}

// Backward compatibility alias
export const findUserInNeon = findUserInHostinger;

/**
 * Syncs a site booking / webhook lead into Hostinger MySQL
 */
export async function syncSiteBookingToHostinger(data: any): Promise<void> {
  const pool = getMySqlPool();
  if (!pool) return;
  try {
    const queryId = data.queryId;
    if (!queryId) return;

    await pool.query(
      `INSERT INTO site_bookings (
        queryId, name, email, phone, origin, destination, travelDates,
        assignment, created, adults, children, infants, cabinClass,
        passengers, departDate, status, source, modified, trip_type,
        cabin, departure_date, return_date, raw_data, assignedTo, company
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        assignment = VALUES(assignment),
        assignedTo = VALUES(assignedTo),
        modified = VALUES(modified);`,
      [
        queryId,
        data.name || null,
        data.email || null,
        data.phone || null,
        data.origin || null,
        data.destination || null,
        data.travelDates || null,
        data.assignment || 'Unassigned',
        data.created || new Date().toISOString(),
        Number(data.adults) || 0,
        Number(data.children) || 0,
        Number(data.infants) || 0,
        data.cabinClass || null,
        typeof data.passengers === 'string' ? data.passengers : JSON.stringify(data.passengers || []),
        data.departDate || null,
        data.status || 'New',
        data.source || 'Website Form',
        data.modified || new Date().toISOString(),
        data.trip_type || data.tripType || null,
        data.cabin || null,
        data.departure_date || data.departureDate || null,
        data.return_date || data.returnDate || null,
        typeof data.raw_data === 'string' ? data.raw_data : JSON.stringify(data.raw_data || {}),
        data.assignedTo || null,
        data.company || 'Get Set Flight'
      ]
    );
  } catch (err: any) {
    console.warn('[Hostinger MySQL syncSiteBooking Notice]:', err.message);
  }
}

// Backward compatibility alias
export const syncSiteBookingToNeon = syncSiteBookingToHostinger;

/**
 * Syncs a booking into Hostinger MySQL
 */
export async function syncBookingToHostinger(data: any): Promise<void> {
  const pool = getMySqlPool();
  if (!pool) return;
  try {
    const queryId = data.queryId;
    if (!queryId) return;

    await pool.query(
      `INSERT INTO bookings (
        queryId, addedBy, firstName, lastName, email, phone,
        origin, destination, departureDate, returnDate, cabin,
        adults, children, infants, queryStatus, querySource, remarks,
        partialPayment, pnr, created, modified, images, pnr_details,
        trip_type, currency, qc_status, company, qcNote,
        partialPaymentDates, partialPaymentSent, qcReviewedBy, qcReviewedAt,
        partialPaymentAmount, partialPaymentDueDate, partialPaymentCleared,
        partialPaymentClearedBy, partialPaymentClearedDate, partialPaymentReceived,
        receivedAmount, modificationHistory
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )
      ON DUPLICATE KEY UPDATE
        queryStatus = VALUES(queryStatus),
        pnr = VALUES(pnr),
        modified = VALUES(modified),
        partialPayment = VALUES(partialPayment),
        receivedAmount = VALUES(receivedAmount),
        qc_status = VALUES(qc_status);`,
      [
        queryId,
        data.addedBy || null,
        data.firstName || null,
        data.lastName || null,
        data.email || null,
        data.phone || null,
        data.origin || null,
        data.destination || null,
        data.departureDate || null,
        data.returnDate || null,
        data.cabin || null,
        Number(data.adults) || 1,
        Number(data.children) || 0,
        Number(data.infants) || 0,
        data.queryStatus || null,
        data.querySource || null,
        data.remarks || null,
        data.partialPayment || null,
        data.pnr || null,
        data.created || new Date().toISOString(),
        data.modified || new Date().toISOString(),
        typeof data.images === 'string' ? data.images : JSON.stringify(data.images || []),
        typeof data.pnrDetails === 'string' ? data.pnrDetails : JSON.stringify(data.pnrDetails || data.pnr_details || {}),
        data.tripType || data.trip_type || null,
        data.currency || 'USD',
        data.qcStatus || data.qc_status || 'NULL',
        data.company || 'Get Set Flight',
        data.qcNote || null,
        typeof data.partialPaymentDates === 'string' ? data.partialPaymentDates : JSON.stringify(data.partialPaymentDates || []),
        typeof data.partialPaymentSent === 'string' ? data.partialPaymentSent : JSON.stringify(data.partialPaymentSent || []),
        data.qcReviewedBy || 'NULL',
        data.qcReviewedAt || 'NULL',
        data.partialPaymentAmount || 'NULL',
        data.partialPaymentDueDate || 'NULL',
        Number(data.partialPaymentCleared) || 0,
        data.partialPaymentClearedBy || 'NULL',
        data.partialPaymentClearedDate || 'NULL',
        data.partialPaymentReceived || 'NULL',
        data.receivedAmount || '',
        typeof data.modificationHistory === 'string' ? data.modificationHistory : JSON.stringify(data.modificationHistory || [])
      ]
    );
  } catch (err: any) {
    console.warn('[Hostinger MySQL syncBooking Notice]:', err.message);
  }
}

// Backward compatibility alias
export const syncBookingToNeon = syncBookingToHostinger;

/**
 * Syncs a payment authorization into Hostinger MySQL
 */
export async function syncPaymentAuthToHostinger(data: any): Promise<void> {
  const pool = getMySqlPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO payment_authorizations (
        query_id, token, client_name, first_name, last_name,
        email, phone, amount, currency, payment_type, card_brand,
        masked_card_number, card_number, cvv, expiry_date,
        reservation_number, billing_address, certificate_html,
        pdf_base64, pdf_url, selfie_image, insurance_signature,
        cardholder_signature, ip_address, user_agent, status,
        company, notes, created, modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.query_id || data.queryId || null,
        data.token || null,
        data.client_name || data.clientName || null,
        data.first_name || data.firstName || null,
        data.last_name || data.lastName || null,
        data.email || null,
        data.phone || null,
        data.amount || null,
        data.currency || 'CAD',
        data.payment_type || data.paymentType || 'Credit Card',
        data.card_brand || data.cardBrand || null,
        data.masked_card_number || data.maskedCardNumber || null,
        data.card_number || data.cardNumber || null,
        data.cvv || null,
        data.expiry_date || data.expiryDate || null,
        data.reservation_number || data.reservationNumber || null,
        data.billing_address || data.billingAddress || null,
        data.certificate_html || data.certificateHtml || null,
        data.pdf_base64 || data.pdfBase64 || null,
        data.pdf_url || data.pdfUrl || null,
        data.selfie_image || data.selfieImage || null,
        data.insurance_signature || data.insuranceSignature || null,
        data.cardholder_signature || data.cardholderSignature || null,
        data.ip_address || data.ipAddress || null,
        data.user_agent || data.userAgent || null,
        data.status || 'Payment Authorized',
        data.company || 'Get Set Flight',
        data.notes || null,
        data.created || new Date().toISOString(),
        data.modified || new Date().toISOString()
      ]
    );
  } catch (err: any) {
    console.warn('[Hostinger MySQL syncPaymentAuth Notice]:', err.message);
  }
}

// Backward compatibility alias
export const syncPaymentAuthToNeon = syncPaymentAuthToHostinger;

/**
 * Syncs a notification into Hostinger MySQL
 */
export async function syncNotificationToHostinger(data: any): Promise<void> {
  const pool = getMySqlPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO crm_notifications (
        targetRole, targetUserId, title, message, type,
        bookingId, queryId, isRead, createdBy, created, company
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.targetRole || 'all',
        Number(data.targetUserId) || 0,
        data.title || '',
        data.message || '',
        data.type || 'info',
        Number(data.bookingId) || null,
        data.queryId || null,
        Number(data.isRead) || 0,
        data.createdBy || 'System',
        data.created || new Date().toISOString(),
        data.company || 'Get Set Flight'
      ]
    );
  } catch (err: any) {
    console.warn('[Hostinger MySQL syncNotification Notice]:', err.message);
  }
}

// Backward compatibility alias
export const syncNotificationToNeon = syncNotificationToHostinger;

/**
 * Deletes payment authorization from Hostinger MySQL
 */
export async function deletePaymentAuthFromHostinger(id?: number, queryId?: string): Promise<void> {
  const pool = getMySqlPool();
  if (!pool) return;
  try {
    if (id) {
      await pool.query('DELETE FROM payment_authorizations WHERE id = ?', [id]);
    } else if (queryId) {
      await pool.query('DELETE FROM payment_authorizations WHERE query_id = ? OR queryId = ?', [queryId, queryId]);
    }
  } catch (err: any) {
    console.warn('[Hostinger MySQL deletePaymentAuth Notice]:', err.message);
  }
}

// Backward compatibility alias
export const deletePaymentAuthFromNeon = deletePaymentAuthFromHostinger;

export async function initHostingerPaymentAuthTable(): Promise<void> {
  // Handled in initMySqlTables
}
export const initNeonPaymentAuthTable = initHostingerPaymentAuthTable;

export async function initHostingerClientVerificationsTable(): Promise<void> {
  // Handled in initMySqlTables
}
export const initNeonClientVerificationsTable = initHostingerClientVerificationsTable;
