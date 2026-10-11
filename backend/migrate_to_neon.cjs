require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || '';
const sql = neon(DATABASE_URL);

const tables = [
  `CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "userName" TEXT,
    date TEXT,
    "loginTime" TEXT,
    "logoutTime" TEXT,
    "totalHours" TEXT,
    "ipAddress" TEXT,
    location TEXT,
    device TEXT,
    os TEXT,
    browser TEXT,
    status TEXT,
    breaks TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS attendance_sheet (
    "userId" INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT,
    logs TEXT DEFAULT '[]',
    PRIMARY KEY ("userId", date)
  )`,

  `CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    "queryId" TEXT UNIQUE,
    "addedBy" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    email TEXT,
    phone TEXT,
    origin TEXT,
    destination TEXT,
    "departureDate" TEXT,
    "returnDate" TEXT,
    cabin TEXT,
    adults INTEGER,
    children INTEGER,
    infants INTEGER,
    "queryStatus" TEXT,
    "querySource" TEXT,
    remarks TEXT,
    "partialPayment" TEXT,
    pnr TEXT,
    created TEXT,
    modified TEXT,
    images TEXT,
    pnr_details TEXT,
    trip_type TEXT,
    currency TEXT,
    qc_status TEXT DEFAULT 'NULL',
    company TEXT DEFAULT 'Get Set Flight',
    "qcNote" TEXT,
    "partialPaymentDates" TEXT DEFAULT '',
    "partialPaymentSent" TEXT DEFAULT '',
    "qcReviewedBy" TEXT DEFAULT 'NULL',
    "qcReviewedAt" TEXT DEFAULT 'NULL',
    "partialPaymentAmount" TEXT DEFAULT 'NULL',
    "partialPaymentDueDate" TEXT DEFAULT 'NULL',
    "partialPaymentCleared" INTEGER DEFAULT 0,
    "partialPaymentClearedBy" TEXT DEFAULT 'NULL',
    "partialPaymentClearedDate" TEXT DEFAULT 'NULL',
    "partialPaymentReceived" TEXT DEFAULT 'NULL',
    "receivedAmount" TEXT DEFAULT '',
    "modificationHistory" TEXT DEFAULT '[]'
  )`,

  `CREATE TABLE IF NOT EXISTS break_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type TEXT,
    start_time TEXT,
    end_time TEXT,
    duration TEXT,
    created TEXT,
    company TEXT DEFAULT 'Get Set Flight'
  )`,

  `CREATE TABLE IF NOT EXISTS client_verifications (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER,
    query_id TEXT,
    token TEXT NOT NULL,
    client_name TEXT,
    client_email TEXT,
    selfie_image TEXT,
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
    selfie_image_back TEXT,
    rejection_reason TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS crm_notifications (
    id SERIAL PRIMARY KEY,
    "targetRole" TEXT,
    "targetUserId" INTEGER,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    "bookingId" INTEGER,
    "queryId" TEXT,
    "isRead" INTEGER DEFAULT 0,
    "createdBy" TEXT,
    created TEXT,
    company TEXT DEFAULT 'Get Set Flight'
  )`,

  `CREATE TABLE IF NOT EXISTS ip_whitelist (
    id SERIAL PRIMARY KEY,
    ip_address TEXT,
    description TEXT,
    status TEXT,
    added_by TEXT,
    created TEXT,
    company TEXT DEFAULT 'Get Set Flight'
  )`,

  `CREATE TABLE IF NOT EXISTS leave_balances (
    "userId" INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "casualLeave" INTEGER DEFAULT 0,
    "paidLeave" INTEGER DEFAULT 0,
    "sickLeave" INTEGER DEFAULT 0,
    "compOff" INTEGER DEFAULT 0,
    logs TEXT DEFAULT '[]',
    "paidLeaveUsed" INTEGER DEFAULT 0,
    "paidLeaveLeft" INTEGER DEFAULT 0,
    month INTEGER DEFAULT 0,
    PRIMARY KEY ("userId", year)
  )`,

  `CREATE TABLE IF NOT EXISTS login_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_name TEXT,
    login_time TEXT,
    logout_time TEXT,
    duration TEXT,
    ip_address TEXT,
    device TEXT,
    status TEXT,
    company TEXT DEFAULT 'Get Set Flight'
  )`,

  `CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    "addedBy" TEXT,
    company TEXT DEFAULT 'Get Set Flight',
    created TEXT,
    modified TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS password_otps (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires BIGINT NOT NULL,
    created TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS payslip_requests (
    id SERIAL PRIMARY KEY,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT,
    company TEXT DEFAULT 'GSF',
    "requestedMonth" TEXT NOT NULL,
    "requestDate" TEXT,
    status TEXT DEFAULT 'Pending',
    note TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TEXT,
    "createdBy" TEXT,
    created TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS query_statuses (
    id SERIAL PRIMARY KEY,
    "addedBy" TEXT,
    name TEXT NOT NULL,
    bookings INTEGER DEFAULT 0,
    master INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created TEXT,
    modified TEXT,
    company TEXT DEFAULT 'Get Set Flight'
  )`,

  `CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    "addedBy" TEXT,
    "roleName" TEXT NOT NULL,
    permissions TEXT,
    status TEXT DEFAULT 'Active',
    created TEXT,
    modified TEXT,
    company TEXT DEFAULT 'Get Set Flight'
  )`,

  `CREATE TABLE IF NOT EXISTS site_bookings (
    id SERIAL PRIMARY KEY,
    "queryId" TEXT UNIQUE,
    name TEXT,
    email TEXT,
    phone TEXT,
    origin TEXT,
    destination TEXT,
    "travelDates" TEXT,
    assignment TEXT,
    created TEXT,
    adults INTEGER DEFAULT 0,
    children INTEGER DEFAULT 0,
    infants INTEGER DEFAULT 0,
    "cabinClass" TEXT,
    passengers TEXT,
    "departDate" TEXT,
    status TEXT DEFAULT 'New',
    source TEXT DEFAULT 'Website Form',
    modified TEXT,
    trip_type TEXT,
    cabin TEXT,
    departure_date TEXT,
    return_date TEXT,
    raw_data TEXT,
    assignment_log TEXT,
    "assignedTo" TEXT,
    company TEXT DEFAULT 'Get Set Flight'
  )`,

  `CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    "testId" INTEGER NOT NULL,
    "testTitle" TEXT,
    "userId" INTEGER NOT NULL,
    "userName" TEXT,
    "userRole" TEXT,
    answers TEXT DEFAULT '{}',
    score INTEGER DEFAULT 0,
    "totalQuestions" INTEGER DEFAULT 0,
    "correctAnswers" INTEGER DEFAULT 0,
    "wrongAnswers" INTEGER DEFAULT 0,
    unanswered INTEGER DEFAULT 0,
    percentage REAL DEFAULT 0,
    company TEXT DEFAULT 'Get Set Flight',
    "submittedAt" TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    questions TEXT DEFAULT '[]',
    "createdBy" TEXT,
    "createdByRole" TEXT,
    "isActive" INTEGER DEFAULT 1,
    duration INTEGER DEFAULT 30,
    company TEXT DEFAULT 'Get Set Flight',
    department TEXT DEFAULT 'all',
    created TEXT,
    modified TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS updates (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    "addedBy" TEXT NOT NULL,
    created TEXT NOT NULL,
    modified TEXT NOT NULL,
    company TEXT DEFAULT 'Get Set Flight',
    category TEXT DEFAULT 'General',
    priority TEXT DEFAULT 'Normal',
    "createdBy" TEXT,
    "targetRoles" TEXT DEFAULT 'All',
    "isActive" INTEGER DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "addedBy" TEXT,
    image TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    gender TEXT,
    status TEXT DEFAULT 'Active',
    created TEXT,
    modified TEXT,
    password TEXT,
    "aadharCard" TEXT,
    "panCard" TEXT,
    resume TEXT,
    company TEXT DEFAULT 'Get Set Flight',
    "amadeusCreds" TEXT DEFAULT '[]'
  )`
];

async function migrate() {
  console.log('Connecting to Neon PostgreSQL...');
  for (const tableSql of tables) {
    const tableName = tableSql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    process.stdout.write(`Creating table ${tableName}... `);
    await sql.query(tableSql);
    console.log('OK');
  }

  // Check tables in Neon
  const res = await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('\nMigration complete! Total tables in Neon:', res.length);
  console.log(res.map(r => r.table_name).join(', '));
}

migrate().catch(console.error);
