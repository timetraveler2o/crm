import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { neon } from '@neondatabase/serverless';

const app = new Hono();
const api = new Hono();

// Neon Cloud Database Connection
const DB_HOST = "ep-odd-hat-b4bwqvtu-pooler.c-6.us-east-2.aws.neon.tech";
const DB_USER = "neondb_owner";
const DB_PASS = "npg_fnBYaZwdx0u5";
const DB_NAME = "neondb";
const DEFAULT_DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?sslmode=require&channel_binding=require`;

function getDb() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || DEFAULT_DATABASE_URL;
  return neon(url);
}

// Brevo API Key resolution
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER = { name: "Get Set Flight", email: process.env.BREVO_SENDER_EMAIL || "officialtraveloboom@gmail.com" };
const BREVO_REPLY_TO = { name: "Get Set Flight", email: process.env.BREVO_REPLY_EMAIL || "officialtraveloboom@gmail.com" };
const BREVO_CC = [{ email: "officialtraveloboom@gmail.com", name: "Operations Team" }];

// Global CORS Middleware
api.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  c.header('Access-Control-Max-Age', '86400');
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  await next();
});

// Helper: send Brevo email
async function sendBrevoEmail(to: string, subject: string, htmlContent: string, skipCc = false) {
  try {
    const payload: any = {
      sender: BREVO_SENDER,
      replyTo: BREVO_REPLY_TO,
      to: [{ email: to }],
      subject,
      htmlContent,
    };
    if (!skipCc && BREVO_CC.length > 0) {
      payload.cc = BREVO_CC;
    }
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn('[Brevo Email Error]:', err);
    return null;
  }
}

// ========================================================
// 1. HEALTH & SYSTEM CHECK
// ========================================================
api.get('/health', async (c) => {
  try {
    const sql = getDb();
    const result = await sql`SELECT 1 as alive`;
    return c.json({ success: true, status: 'ok', database: 'connected', result });
  } catch (err: any) {
    return c.json({ success: false, status: 'degraded', error: err.message }, 500);
  }
});

// ========================================================
// 2. AUTHENTICATION & SESSIONS
// ========================================================
api.post('/public/login', async (c) => {
  try {
    let email = '';
    let password = '';
    try {
      const body = await c.req.json();
      email = (body.email || '').trim().toLowerCase();
      password = (body.password || '').trim();
    } catch {
      const raw = await c.req.text();
      try {
        const parsed = JSON.parse(raw);
        email = (parsed.email || '').trim().toLowerCase();
        password = (parsed.password || '').trim();
      } catch {
        const params = new URLSearchParams(raw);
        email = (params.get('email') || '').trim().toLowerCase();
        password = (params.get('password') || '').trim();
      }
    }

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400);
    }

    const sql = getDb();
    const rows = await sql`
      SELECT * FROM users 
      WHERE LOWER(email) = ${email} 
      ORDER BY (password IS NOT NULL) DESC, id ASC 
      LIMIT 1
    `;
    const user: any = rows[0];

    if (!user) {
      return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    const dbPass = (user.password || '').trim();
    const match = dbPass === password || dbPass.toLowerCase() === password.toLowerCase();
    if (!match) {
      return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    if (user.status && user.status.toLowerCase() === 'inactive') {
      return c.json({ success: false, message: 'Account is inactive. Contact administrator.' }, 403);
    }

    let permissions: string[] = ['All'];
    try {
      if (user.role) {
        const roleRows = await sql`SELECT * FROM roles WHERE LOWER("roleName") = LOWER(${user.role}) LIMIT 1`;
        if (roleRows[0]?.permissions) {
          permissions = typeof roleRows[0].permissions === 'string'
            ? JSON.parse(roleRows[0].permissions)
            : roleRows[0].permissions;
        }
      }
    } catch {}

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'Agent',
      status: user.status || 'Active',
      company: user.company || 'Get Set Flight',
      permissions
    };

    return c.json({
      success: true,
      user: safeUser,
      token: `neon_session_${user.id}_${Date.now()}`
    });
  } catch (err: any) {
    console.error('[API Login Error]:', err);
    return c.json({ success: false, message: err.message || 'Login failed' }, 500);
  }
});

// Admin OTP Login & Password Reset
api.post('/public/admin-login-otp', async (c) => {
  try {
    const { email } = await c.req.json();
    const normalized = (email || '').trim().toLowerCase();
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE LOWER(email) = ${normalized} LIMIT 1`;
    const user: any = rows[0];
    if (!user) return c.json({ success: false, message: 'Email not registered' }, 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO password_otps (email, otp, expires_at)
      VALUES (${normalized}, ${otp}, ${expiresAt})
    `;

    await sendBrevoEmail(
      normalized,
      `Your CRM Verification Code: ${otp}`,
      `<div style="font-family:sans-serif;padding:20px;border-radius:8px;background:#f8fafc;max-width:500px;margin:auto;">
        <h2 style="color:#1e3a5f;margin-bottom:10px;">CRM Verification Code</h2>
        <p>Use the following 6-digit one-time password to access your account:</p>
        <div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#2563eb;padding:12px;background:#eff6ff;border-radius:6px;text-align:center;margin:20px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:12px;">This code will expire in 10 minutes. If you did not request this, please disregard this email.</p>
      </div>`,
      true
    );

    return c.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/verify-otp', async (c) => {
  try {
    const { email, otp } = await c.req.json();
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM password_otps
      WHERE LOWER(email) = LOWER(${email}) AND otp = ${otp} AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1
    `;
    if (rows.length === 0) {
      return c.json({ success: false, message: 'Invalid or expired OTP' }, 400);
    }
    return c.json({ success: true, message: 'OTP verified' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/reset-password', async (c) => {
  try {
    const { email, password, otp } = await c.req.json();
    const sql = getDb();
    const otpRows = await sql`
      SELECT * FROM password_otps
      WHERE LOWER(email) = LOWER(${email}) AND otp = ${otp} AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1
    `;
    if (otpRows.length === 0) {
      return c.json({ success: false, message: 'Invalid or expired verification session' }, 400);
    }
    await sql`UPDATE users SET password = ${password}, modified = NOW() WHERE LOWER(email) = LOWER(${email})`;
    await sql`DELETE FROM password_otps WHERE LOWER(email) = LOWER(${email})`;
    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 3. LOGIN ACTIVITY & AUDIT
// ========================================================
api.get('/public/login-activity', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM login_activity ORDER BY id DESC LIMIT 100`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, data: [] });
  }
});

api.post('/public/login-activity', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    await sql`
      INSERT INTO login_activity ("userId", "userName", email, "ipAddress", device, "loginTime", "logoutTime", duration, status, created)
      VALUES (${b.userId || 0}, ${b.userName || ''}, ${b.email || ''}, ${b.ipAddress || 'Browser'}, ${b.device || 'Desktop'}, ${b.loginTime || ''}, ${b.logoutTime || ''}, ${b.duration || ''}, ${b.status || 'Success'}, ${b.created || new Date().toISOString()})
    `;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.put('/public/login-activity/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const b = await c.req.json();
    const sql = getDb();
    await sql`UPDATE login_activity SET "logoutTime" = ${b.logoutTime || ''}, duration = ${b.duration || ''} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 4. USERS MANAGEMENT
// ========================================================
api.get('/public/users', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, name, email, role, status, company, created, modified FROM users ORDER BY id ASC`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/users', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    const now = new Date().toISOString();
    const res = await sql`
      INSERT INTO users (name, email, password, role, status, company, created, modified)
      VALUES (${b.name}, ${b.email}, ${b.password || 'User@12345'}, ${b.role || 'Agent'}, ${b.status || 'Active'}, ${b.company || 'Get Set Flight'}, ${now}, ${now})
      RETURNING id, name, email, role, status, company
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.put('/public/users/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const b = await c.req.json();
    const sql = getDb();
    const now = new Date().toISOString();
    let query;
    if (b.password) {
      query = sql`UPDATE users SET name = ${b.name}, email = ${b.email}, password = ${b.password}, role = ${b.role}, status = ${b.status}, company = ${b.company}, modified = ${now} WHERE id = ${id} RETURNING id, name, email, role, status, company`;
    } else {
      query = sql`UPDATE users SET name = ${b.name}, email = ${b.email}, role = ${b.role}, status = ${b.status}, company = ${b.company}, modified = ${now} WHERE id = ${id} RETURNING id, name, email, role, status, company`;
    }
    const res = await query;
    return c.json({ success: true, data: res[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.delete('/public/users/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const sql = getDb();
    await sql`DELETE FROM users WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 5. ROLES
// ========================================================
api.get('/public/roles', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM roles ORDER BY id ASC`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 6. SITE BOOKINGS & WEBHOOK INGESTION
// ========================================================
api.get('/public/site-bookings', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM site_bookings ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Website Lead Webhook Endpoint
api.post('/webhook/site-bookings', async (c) => {
  try {
    const body = await c.req.json();
    const sql = getDb();
    const queryId = body.queryId || `WEB-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const inserted = await sql`
      INSERT INTO site_bookings (
        "queryId", name, email, phone, origin, destination, "travelDates",
        assignment, created, adults, children, infants, "cabinClass",
        passengers, "departDate", status, source, modified, company
      ) VALUES (
        ${queryId}, ${body.name || body.fullName || ''}, ${body.email || ''}, ${body.phone || ''},
        ${body.origin || body.from || ''}, ${body.destination || body.to || ''}, ${body.travelDates || ''},
        ${body.assignment || 'Unassigned'}, ${now}, ${body.adults || 1}, ${body.children || 0}, ${body.infants || 0},
        ${body.cabinClass || body.cabin || 'Economy'}, ${body.passengers || 1}, ${body.departDate || ''},
        ${body.status || 'New'}, ${body.source || 'Website Webhook'}, ${now}, ${body.company || 'Get Set Flight'}
      )
      ON CONFLICT ("queryId") DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        status = EXCLUDED.status,
        modified = EXCLUDED.modified
      RETURNING *
    `;

    // Real-time notification in CRM
    await sql`
      INSERT INTO crm_notifications ("targetRole", title, message, type, "queryId", "isRead", created, company)
      VALUES (
        'all',
        'New Website Booking Received',
        ${`Lead #${queryId} from ${body.name || 'Website'} (${body.origin || ''} -> ${body.destination || ''})`},
        'info',
        ${queryId},
        0,
        ${now},
        ${body.company || 'Get Set Flight'}
      )
    `;

    return c.json({ success: true, queryId, data: inserted[0] });
  } catch (err: any) {
    console.error('[Site Booking Webhook Error]:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/site-bookings', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    const queryId = b.queryId || `WEB-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const res = await sql`
      INSERT INTO site_bookings (
        "queryId", name, email, phone, origin, destination, "travelDates",
        assignment, created, adults, children, infants, "cabinClass",
        passengers, "departDate", status, source, modified, company
      ) VALUES (
        ${queryId}, ${b.name || ''}, ${b.email || ''}, ${b.phone || ''}, ${b.origin || ''}, ${b.destination || ''}, ${b.travelDates || ''},
        ${b.assignment || 'Unassigned'}, ${now}, ${b.adults || 1}, ${b.children || 0}, ${b.infants || 0}, ${b.cabinClass || 'Economy'},
        ${b.passengers || 1}, ${b.departDate || ''}, ${b.status || 'New'}, ${b.source || 'Website'}, ${now}, ${b.company || 'Get Set Flight'}
      )
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.put('/public/site-bookings/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const b = await c.req.json();
    const sql = getDb();
    const now = new Date().toISOString();
    const res = await sql`
      UPDATE site_bookings
      SET status = COALESCE(${b.status}, status),
          assignment = COALESCE(${b.assignment}, assignment),
          "assignedTo" = COALESCE(${b.assignedTo}, "assignedTo"),
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.delete('/public/site-bookings/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const sql = getDb();
    await sql`DELETE FROM site_bookings WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 7. BOOKINGS & AUTOMATED CLIENT EMAILS
// ========================================================
api.get('/public/bookings', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM bookings ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/bookings', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    const queryId = b.queryId || `GSF-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const res = await sql`
      INSERT INTO bookings (
        "queryId", "pnrNumber", "firstName", "lastName", email, phone,
        origin, destination, "departureDate", "returnDate", cabin,
        status, "grossAmount", "netAmount", profit, currency, "assignedTo",
        company, created, modified
      ) VALUES (
        ${queryId}, ${b.pnrNumber || ''}, ${b.firstName || ''}, ${b.lastName || ''}, ${b.email || ''}, ${b.phone || ''},
        ${b.origin || ''}, ${b.destination || ''}, ${b.departureDate || ''}, ${b.returnDate || ''}, ${b.cabin || 'Economy'},
        ${b.status || 'Pending'}, ${b.grossAmount || '0'}, ${b.netAmount || '0'}, ${b.profit || '0'}, ${b.currency || 'CAD'}, ${b.assignedTo || 'Unassigned'},
        ${b.company || 'Get Set Flight'}, ${now}, ${now}
      )
      RETURNING *
    `;

    // Send automated client email on Hold or Sold
    if (b.email && (b.status === 'Hold' || b.status === 'Sold')) {
      const isSold = b.status === 'Sold';
      const subject = isSold ? `Ticket Confirmed - Flight Booking #${queryId}` : `Booking on Hold - Reservation #${queryId}`;
      const html = `<div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:10px;max-width:600px;margin:auto;">
        <h2 style="color:${isSold ? '#059669' : '#d97706'};">${subject}</h2>
        <p>Dear <strong>${b.firstName || 'Client'}</strong>,</p>
        <p>${isSold ? 'Your ticket has been officially confirmed and issued.' : 'Your reservation has been placed on hold successfully.'}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px;color:#64748b;">PNR:</td><td style="font-weight:bold;">${b.pnrNumber || 'Pending'}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Route:</td><td style="font-weight:bold;">${b.origin || ''} &rarr; ${b.destination || ''}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Departure:</td><td>${b.departureDate || 'TBD'}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Amount:</td><td>${b.currency || 'CAD'} ${b.grossAmount || '0'}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Thank you for booking with ${b.company || 'Get Set Flight'}.</p>
      </div>`;
      sendBrevoEmail(b.email, subject, html);
    }

    return c.json({ success: true, data: res[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.put('/public/bookings/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const b = await c.req.json();
    const sql = getDb();
    const now = new Date().toISOString();
    const res = await sql`
      UPDATE bookings
      SET status = COALESCE(${b.status}, status),
          "pnrNumber" = COALESCE(${b.pnrNumber}, "pnrNumber"),
          "firstName" = COALESCE(${b.firstName}, "firstName"),
          "lastName" = COALESCE(${b.lastName}, "lastName"),
          email = COALESCE(${b.email}, email),
          phone = COALESCE(${b.phone}, phone),
          "grossAmount" = COALESCE(${b.grossAmount}, "grossAmount"),
          "netAmount" = COALESCE(${b.netAmount}, "netAmount"),
          profit = COALESCE(${b.profit}, profit),
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;

    // Send email on status change to Hold or Sold
    const updated = res[0];
    if (updated && updated.email && (updated.status === 'Hold' || updated.status === 'Sold')) {
      const isSold = updated.status === 'Sold';
      const subject = isSold ? `Ticket Confirmed - Flight Booking #${updated.queryId}` : `Booking on Hold - Reservation #${updated.queryId}`;
      const html = `<div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:10px;max-width:600px;margin:auto;">
        <h2 style="color:${isSold ? '#059669' : '#d97706'};">${subject}</h2>
        <p>Dear <strong>${updated.firstName || 'Client'}</strong>,</p>
        <p>${isSold ? 'Your flight ticket is confirmed with all details below:' : 'Your reservation has been placed on hold successfully:'}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px;color:#64748b;">PNR:</td><td style="font-weight:bold;">${updated.pnrNumber || 'N/A'}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Route:</td><td style="font-weight:bold;">${updated.origin || ''} &rarr; ${updated.destination || ''}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Departure:</td><td>${updated.departureDate || 'N/A'}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Thank you for booking with ${updated.company || 'Get Set Flight'}.</p>
      </div>`;
      sendBrevoEmail(updated.email, subject, html);
    }

    return c.json({ success: true, data: res[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.delete('/public/bookings/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const sql = getDb();
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 8. PAYMENT AUTHORIZATIONS & CLIENT PORTAL
// ========================================================
api.get('/public/payment-authorizations', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM payment_authorizations ORDER BY id DESC LIMIT 200`;
    return c.json(rows);
  } catch (err: any) {
    return c.json([]);
  }
});

api.get('/public/payment-auth/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const sql = getDb();
    const rows = await sql`SELECT * FROM payment_authorizations WHERE token = ${token} LIMIT 1`;
    if (rows.length === 0) return c.json({ success: false, message: 'Invalid or expired authorization link' }, 404);
    return c.json({ success: true, data: rows[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/payment-authorizations', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    const token = b.token || `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const queryId = b.queryId || `PAY-${Date.now().toString().slice(-6)}`;

    const res = await sql`
      INSERT INTO payment_authorizations (
        "queryId", token, "clientName", "firstName", "lastName",
        email, phone, amount, currency, "paymentType",
        "cardBrand", "maskedCardNumber", "cardNumber", cvv, "expiryDate",
        "reservationNumber", "billingAddress", "certificateHtml", "pdfBase64",
        "pdfUrl", "selfieImage", "insuranceSignature", "cardholderSignature",
        "ipAddress", "userAgent", status, company, notes, created, modified
      ) VALUES (
        ${queryId}, ${token}, ${b.clientName || b.name || ''}, ${b.firstName || ''}, ${b.lastName || ''},
        ${b.email || ''}, ${b.phone || ''}, ${b.amount || ''}, ${b.currency || 'CAD'}, ${b.paymentType || 'Credit Card'},
        ${b.cardBrand || ''}, ${b.maskedCardNumber || ''}, ${b.cardNumber || ''}, ${b.cvv || ''}, ${b.expiryDate || ''},
        ${b.reservationNumber || ''}, ${b.billingAddress || ''}, ${b.certificateHtml || ''}, ${b.pdfBase64 || ''},
        ${b.pdfUrl || ''}, ${b.selfieImage || ''}, ${b.insuranceSignature || ''}, ${b.cardholderSignature || ''},
        ${b.ipAddress || ''}, ${b.userAgent || ''}, ${b.status || 'Payment Authorized'}, ${b.company || 'Get Set Flight'},
        ${b.notes || ''}, ${now}, ${now}
      )
      RETURNING *
    `;

    // Live Notification
    await sql`
      INSERT INTO crm_notifications ("targetRole", title, message, type, "queryId", "isRead", created, company)
      VALUES (
        'all',
        'New Payment Authorization',
        ${`Authorization submitted for ${b.amount || ''} ${b.currency || 'CAD'} by ${b.clientName || b.name || 'Client'}`},
        'success',
        ${queryId},
        0,
        ${now},
        ${b.company || 'Get Set Flight'}
      )
    `;

    return c.json({ success: true, data: res[0], queryId, token });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.delete('/public/payment-authorizations/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const sql = getDb();
    await sql`DELETE FROM payment_authorizations WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 9. LIVE NOTIFICATIONS & SOUND TRIGGER
// ========================================================
api.get('/public/notifications', async (c) => {
  try {
    const company = c.req.query('company') || '';
    const sql = getDb();
    let rows;
    if (company) {
      rows = await sql`SELECT * FROM crm_notifications WHERE company = ${company} OR company IS NULL OR company = '' ORDER BY id DESC LIMIT 50`;
    } else {
      rows = await sql`SELECT * FROM crm_notifications ORDER BY id DESC LIMIT 50`;
    }
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, data: [] });
  }
});

api.put('/public/notifications/:id/read', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const sql = getDb();
    await sql`UPDATE crm_notifications SET "isRead" = 1 WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.put('/public/notifications/read-all', async (c) => {
  try {
    const sql = getDb();
    await sql`UPDATE crm_notifications SET "isRead" = 1`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 10. ATTENDANCE & BREAK MONITORS
// ========================================================
api.get('/public/break-logs', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM break_logs ORDER BY id DESC LIMIT 50`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, data: [] });
  }
});

api.post('/public/break-logs', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    const now = new Date().toISOString();
    await sql`
      INSERT INTO break_logs ("userId", "userName", "breakType", "startTime", "endTime", duration, status, date)
      VALUES (${b.userId || 0}, ${b.userName || ''}, ${b.breakType || 'Tea Break'}, ${b.startTime || now}, ${b.endTime || ''}, ${b.duration || ''}, ${b.status || 'Active'}, ${b.date || now.split('T')[0]})
    `;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.get('/public/attendance', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM attendance_records ORDER BY id DESC LIMIT 100`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, data: [] });
  }
});

api.post('/public/attendance', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    await sql`
      INSERT INTO attendance_records ("userId", "userName", date, "loginTime", "logoutTime", "totalHours", "ipAddress", status)
      VALUES (${b.userId}, ${b.userName}, ${b.date}, ${b.loginTime}, ${b.logoutTime || ''}, ${b.totalHours || ''}, ${b.ipAddress || ''}, ${b.status || 'Present'})
    `;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.get('/public/ip-whitelist', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM ip_whitelist ORDER BY id ASC`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, data: [] });
  }
});

// ========================================================
// 11. GENERAL EMAIL & ATTACHMENT UPLOAD
// ========================================================
api.post('/public/send-email', async (c) => {
  try {
    const { to, subject, html, text } = await c.req.json();
    const result = await sendBrevoEmail(to, subject, html || text);
    return c.json({ success: true, result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 12. ATTENDANCE SHEET, LEAVE BALANCES & QUERY STATUSES
// ========================================================
api.get('/public/attendance-sheet', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM attendance_sheet ORDER BY id DESC LIMIT 200`;
    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ data: [] });
  }
});

api.post('/public/attendance-sheet', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    const res = await sql`
      INSERT INTO attendance_sheet ("userId", "userName", date, status, notes)
      VALUES (${b.userId}, ${b.userName || ''}, ${b.date}, ${b.status || 'Present'}, ${b.notes || ''})
      RETURNING *
    `;
    return c.json({ data: res[0] });
  } catch (err: any) {
    return c.json({ data: null, error: err.message }, 500);
  }
});

api.get('/public/leave-balances', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM leave_balances ORDER BY id ASC`;
    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ data: [] });
  }
});

api.put('/public/leave-balances/:userId/:year', async (c) => {
  try {
    const userId = Number(c.req.param('userId'));
    const year = Number(c.req.param('year'));
    const b = await c.req.json();
    const sql = getDb();
    const res = await sql`
      UPDATE leave_balances
      SET "annualLeave" = COALESCE(${b.annualLeave}, "annualLeave"),
          "sickLeave" = COALESCE(${b.sickLeave}, "sickLeave"),
          "casualLeave" = COALESCE(${b.casualLeave}, "casualLeave")
      WHERE "userId" = ${userId} AND year = ${year}
      RETURNING *
    `;
    return c.json({ data: res[0] });
  } catch (err: any) {
    return c.json({ data: null, error: err.message }, 500);
  }
});

api.get('/public/query-statuses', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM query_statuses ORDER BY id ASC`;
    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ data: [] });
  }
});

api.post('/public/query-statuses', async (c) => {
  try {
    const b = await c.req.json();
    const sql = getDb();
    const res = await sql`
      INSERT INTO query_statuses (name, color, description, "order", status)
      VALUES (${b.name}, ${b.color || '#3b82f6'}, ${b.description || ''}, ${b.order || 0}, ${b.status || 'Active'})
      RETURNING *
    `;
    return c.json({ data: res[0] });
  } catch (err: any) {
    return c.json({ data: null, error: err.message }, 500);
  }
});

api.put('/public/query-statuses/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const b = await c.req.json();
    const sql = getDb();
    const res = await sql`
      UPDATE query_statuses
      SET name = COALESCE(${b.name}, name),
          color = COALESCE(${b.color}, color),
          description = COALESCE(${b.description}, description),
          "order" = COALESCE(${b.order}, "order"),
          status = COALESCE(${b.status}, status)
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ data: res[0] });
  } catch (err: any) {
    return c.json({ data: null, error: err.message }, 500);
  }
});

api.delete('/public/query-statuses/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const sql = getDb();
    await sql`DELETE FROM query_statuses WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/upload', async (c) => {
  try {
    const now = Date.now();
    return c.json({ success: true, path: `/uploads/file_${now}.png`, sizeBytes: 1024 });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post('/public/upload/delete', async (c) => {
  return c.json({ success: true });
});

api.get('/public/updates', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM updates ORDER BY id DESC LIMIT 50`;
    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ data: [] });
  }
});

api.get('/public/tests', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM tests ORDER BY id ASC`;
    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ data: [] });
  }
});

api.get('/public/payslip-requests', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM payslip_requests ORDER BY id DESC LIMIT 50`;
    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ data: [] });
  }
});

api.get('/public/check-email', async (c) => {
  try {
    const email = (c.req.query('email') || '').trim().toLowerCase();
    const sql = getDb();
    const rows = await sql`SELECT id FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
    return c.json({ exists: rows.length > 0 });
  } catch (err: any) {
    return c.json({ exists: false });
  }
});

// Mount routes on /api and /.netlify/functions/api
app.route('/api', api);
app.route('/.netlify/functions/api', api);

// Export Netlify AWS Lambda handler
export const handler = handle(app);
export default app;
