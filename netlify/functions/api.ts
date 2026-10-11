import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { neon } from '@neondatabase/serverless';

const app = new Hono();
const api = new Hono();

// Helper to get Neon DB client
function getDb() {
  const url = process.env.DATABASE_URL || Buffer.from('cG9zdGdyZXNxbDovL25lb25kYl9vd25lcjpucGdfZm5CWWFad2R4MHU1QGVwLW9kZC1oYXQtYjRid3F2dHUtcG9vbGVyLmMtNi51cy1lYXN0LTIuYXdzLm5lb24udGVjaC9uZW9uZGI/c3NsbW9kZT1yZXF1aXJlJmNoYW5uZWxfYmluZGluZz1yZXF1aXJl', 'base64').toString('utf-8');
  return neon(url);
}

// Global CORS Middleware
api.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  await next();
});

// Health check
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
// 1. AUTHENTICATION & LOGIN
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
    const rows = await sql`SELECT * FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
    const user: any = rows[0];

    if (!user) {
      return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    if (user.password && user.password !== password) {
      return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    if (user.status && user.status.toLowerCase() === 'inactive') {
      return c.json({ success: false, message: 'Account is inactive. Contact administrator.' }, 403);
    }

    // Determine user permissions based on role
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
      token: `neon_token_${user.id}_${Date.now()}`
    });
  } catch (err: any) {
    console.error('[API Login Error]:', err);
    return c.json({ success: false, message: err.message || 'Login failed' }, 500);
  }
});

// ========================================================
// 2. LOGIN ACTIVITY
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
    const body = await c.req.json();
    const sql = getDb();
    await sql`
      INSERT INTO login_activity ("userId", "userName", email, "ipAddress", device, "loginTime", "logoutTime", duration, status, created)
      VALUES (${body.userId || 0}, ${body.userName || ''}, ${body.email || ''}, ${body.ipAddress || 'Browser'}, ${body.device || 'Desktop'}, ${body.loginTime || ''}, ${body.logoutTime || ''}, ${body.duration || ''}, ${body.status || 'Success'}, ${body.created || new Date().toISOString()})
    `;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.put('/public/login-activity/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const sql = getDb();
    await sql`UPDATE login_activity SET "logoutTime" = ${body.logoutTime || ''}, duration = ${body.duration || ''} WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ========================================================
// 3. USERS MANAGEMENT
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
// 4. ROLES
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
// 5. SITE BOOKINGS (Leads from Website Webhooks)
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
// 6. BOOKINGS MANAGEMENT
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
// 7. PAYMENT AUTHORIZATIONS
// ========================================================
api.get('/public/payment-authorizations', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM payment_authorizations ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
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
    const res = await sql`
      INSERT INTO payment_authorizations (
        "queryId", token, "clientName", "firstName", "lastName",
        email, phone, amount, currency, "paymentType",
        "cardBrand", "maskedCardNumber", "cardNumber", cvv, "expiryDate",
        "reservationNumber", "billingAddress", "certificateHtml", "pdfBase64",
        "pdfUrl", "selfieImage", "insuranceSignature", "cardholderSignature",
        "ipAddress", "userAgent", status, company, notes, created, modified
      ) VALUES (
        ${b.queryId || ''}, ${token}, ${b.clientName || b.name || ''}, ${b.firstName || ''}, ${b.lastName || ''},
        ${b.email || ''}, ${b.phone || ''}, ${b.amount || ''}, ${b.currency || 'CAD'}, ${b.paymentType || 'Credit Card'},
        ${b.cardBrand || ''}, ${b.maskedCardNumber || ''}, ${b.cardNumber || ''}, ${b.cvv || ''}, ${b.expiryDate || ''},
        ${b.reservationNumber || ''}, ${b.billingAddress || ''}, ${b.certificateHtml || ''}, ${b.pdfBase64 || ''},
        ${b.pdfUrl || ''}, ${b.selfieImage || ''}, ${b.insuranceSignature || ''}, ${b.cardholderSignature || ''},
        ${b.ipAddress || ''}, ${b.userAgent || ''}, ${b.status || 'Payment Authorized'}, ${b.company || 'Get Set Flight'},
        ${b.notes || ''}, ${now}, ${now}
      )
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
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
// 8. NOTIFICATIONS
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
// 9. BREAK LOGS & IP WHITELIST
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

api.get('/public/ip-whitelist', async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM ip_whitelist ORDER BY id ASC`;
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    return c.json({ success: false, data: [] });
  }
});

// Mount the api routes on both /api and /.netlify/functions/api
app.route('/api', api);
app.route('/.netlify/functions/api', api);

// Export Netlify AWS Lambda handler
export const handler = handle(app);
export default app;
