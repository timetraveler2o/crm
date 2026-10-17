import { sqliteTable, integer, text, real, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";

export const attendanceRecords = sqliteTable("attendance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  userName: text("userName"),
  date: text("date"),
  loginTime: text("loginTime"),
  logoutTime: text("logoutTime"),
  totalHours: text("totalHours"),
  ipAddress: text("ipAddress"),
  location: text("location"),
  device: text("device"),
  os: text("os"),
  browser: text("browser"),
  status: text("status"),
  breaks: text("breaks") // JSON array
}, (table) => {
  return {
    userIdDateIdx: index("idx_attendance_userId_date").on(table.userId, table.date)
  };
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  queryId: text("queryId").unique(),
  addedBy: text("addedBy"),
  firstName: text("firstName"),
  lastName: text("lastName"),
  email: text("email"),
  phone: text("phone"),
  origin: text("origin"),
  destination: text("destination"),
  departureDate: text("departureDate"),
  returnDate: text("returnDate"),
  cabin: text("cabin"),
  adults: integer("adults"),
  children: integer("children"),
  infants: integer("infants"),
  queryStatus: text("queryStatus"),
  querySource: text("querySource"),
  remarks: text("remarks"),
  partialPayment: text("partialPayment"),
  pnr: text("pnr"),
  created: text("created"),
  modified: text("modified"),
  images: text("images"),
  pnrDetails: text("pnr_details"),
  tripType: text("trip_type"),
  currency: text("currency"),
  qcStatus: text("qc_status").default("NULL"),
  company: text("company").default("Get Set Flight"),
  qcNote: text("qcNote"),
  partialPaymentDates: text("partialPaymentDates").default(""),
  partialPaymentSent: text("partialPaymentSent").default(""),
  qcReviewedBy: text("qcReviewedBy").default("NULL"),
  qcReviewedAt: text("qcReviewedAt").default("NULL"),
  partialPaymentAmount: text("partialPaymentAmount").default("NULL"),
  partialPaymentDueDate: text("partialPaymentDueDate").default("NULL"),
  partialPaymentCleared: integer("partialPaymentCleared").default(0),
  partialPaymentClearedBy: text("partialPaymentClearedBy").default("NULL"),
  partialPaymentClearedDate: text("partialPaymentClearedDate").default("NULL"),
  partialPaymentReceived: text("partialPaymentReceived").default("NULL"),
  receivedAmount: text("receivedAmount").default(""),
  modificationHistory: text("modificationHistory").default("[]")
}, (table) => {
  return {
    queryIdIdx: index("idx_bookings_queryId").on(table.queryId)
  };
});

export const breakLogs = sqliteTable("break_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  type: text("type"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  duration: text("duration"),
  created: text("created"),
  company: text("company").default("Get Set Flight")
});

export const passwordOtps = sqliteTable("password_otps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expires: integer("expires").notNull(),
  created: text("created")
}, (table) => {
  return {
    emailIdx: index("idx_password_otps_email").on(table.email)
  };
});

export const payslipRequests = sqliteTable("payslip_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeName: text("employeeName").notNull(),
  employeeId: text("employeeId"),
  company: text("company").default("GSF"),
  requestedMonth: text("requestedMonth").notNull(),
  requestDate: text("requestDate"),
  status: text("status").default("Pending"),
  note: text("note"),
  reviewedBy: text("reviewedBy"),
  reviewedAt: text("reviewedAt"),
  createdBy: text("createdBy"),
  created: text("created")
}, (table) => {
  return {
    statusIdx: index("idx_payslip_requests_status").on(table.status)
  };
});

export const queryStatuses = sqliteTable("query_statuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  addedBy: text("addedBy"),
  name: text("name").notNull().unique(),
  bookings: integer("bookings").default(0),
  master: integer("master").default(0),
  status: text("status").default("Active"),
  created: text("created"),
  modified: text("modified"),
  company: text("company").default("Get Set Flight")
});

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  addedBy: text("addedBy"),
  roleName: text("roleName").notNull().unique(),
  permissions: text("permissions"), // JSON array
  status: text("status").default("Active"),
  created: text("created"),
  modified: text("modified"),
  company: text("company").default("Get Set Flight")
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  addedBy: text("addedBy"),
  image: text("image"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  gender: text("gender"),
  status: text("status").default("Active"),
  created: text("created"),
  modified: text("modified"),
  password: text("password"),
  aadharCard: text("aadharCard"),
  panCard: text("panCard"),
  resume: text("resume"),
  company: text("company").default("Get Set Flight"),
  amadeusCreds: text("amadeusCreds").default("[]"),
  emergencyNumber: text("emergencyNumber"),
  currentAddress: text("currentAddress"),
  permanentAddress: text("permanentAddress")
}, (table) => {
  return {
    emailIdx: index("idx_users_email").on(table.email)
  };
});

export const siteBookings = sqliteTable("site_bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  queryId: text("queryId").unique(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  origin: text("origin"),
  destination: text("destination"),
  travelDates: text("travelDates"),
  assignment: text("assignment"),
  created: text("created"),
  adults: integer("adults").default(0),
  children: integer("children").default(0),
  infants: integer("infants").default(0),
  cabinClass: text("cabinClass"),
  passengers: text("passengers"),
  departDate: text("departDate"),
  status: text("status").default("New"),
  source: text("source").default("Website Form"),
  modified: text("modified"),
  tripType: text("trip_type"),
  cabin: text("cabin"),
  departureDate: text("departure_date"),
  returnDate: text("return_date"),
  rawData: text("raw_data"),
  assignmentLog: text("assignment_log"),
  assignedTo: text("assignedTo"),
  company: text("company").default("Get Set Flight")
});

export const crmNotifications = sqliteTable("crm_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetRole: text("targetRole"),
  targetUserId: integer("targetUserId"),
  title: text("title"),
  message: text("message"),
  type: text("type").default("info"),
  bookingId: integer("bookingId"),
  queryId: text("queryId"),
  isRead: integer("isRead").default(0),
  createdBy: text("createdBy"),
  created: text("created"),
  company: text("company").default("Get Set Flight")
});

export const loginActivity = sqliteTable("login_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  userName: text("user_name"),
  loginTime: text("login_time"),
  logoutTime: text("logout_time"),
  duration: text("duration"),
  ipAddress: text("ip_address"),
  device: text("device"),
  status: text("status"),
  company: text("company").default("Get Set Flight")
});

// Added to prevent type errors in index.ts
export const buckets = {
  upload: {
    put: async () => {},
    get: async () => {}
  }
};

export const updates = sqliteTable('updates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  image: text('image'),
  addedBy: text('addedBy').notNull(),
  created: text('created').notNull(),
  modified: text('modified').notNull(),
  company: text('company').default('Get Set Flight'),
  category: text('category').default('General'),
  priority: text('priority').default('Normal'),
  createdBy: text('createdBy'),
  targetRoles: text('targetRoles').default('All'),
  isActive: integer('isActive').default(1)
});

export const attendanceSheet = sqliteTable('attendance_sheet', {
  userId: integer('userId').notNull(),
  date: text('date').notNull(),
  status: text('status'),
  logs: text('logs').default('[]')
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.date] })
  };
});

export const leaveBalances = sqliteTable('leave_balances', {
  userId: integer('userId').notNull(),
  year: integer('year').notNull(),
  casualLeave: integer('casualLeave').default(0),
  paidLeave: integer('paidLeave').default(0),
  sickLeave: integer('sickLeave').default(0),
  compOff: integer('compOff').default(0),
  logs: text('logs').default('[]'),
  paidLeaveUsed: integer('paidLeaveUsed').default(0),
  paidLeaveLeft: integer('paidLeaveLeft').default(0),
  month: integer('month').default(0)
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.year] })
  };
});

export const ipWhitelist = sqliteTable('ip_whitelist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ipAddress: text('ip_address'),
  description: text('description'),
  status: text('status'),
  addedBy: text('added_by'),
  created: text('created'),
  company: text('company').default('Get Set Flight')
});

export const clientVerifications = sqliteTable('client_verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookingId: integer('booking_id'),
  queryId: text('query_id'),
  token: text('token').notNull(),
  clientName: text('client_name'),
  clientEmail: text('client_email'),
  selfieImage: text('selfie_image'),
  selfieVerified: integer('selfie_verified').default(0),
  selfieAiResult: text('selfie_ai_result'),
  documentType: text('document_type'),
  documentImage: text('document_image'),
  documentVerified: integer('document_verified').default(0),
  documentAiResult: text('document_ai_result'),
  ipAddress: text('ip_address'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  userAgent: text('user_agent'),
  status: text('status').default('pending'),
  submittedAt: text('submitted_at'),
  created: text('created'),
  company: text('company').default('Get Set Flight'),
  reviewedBy: text('reviewed_by'),
  reviewStatus: text('review_status').default('pending'),
  reviewedAt: text('reviewed_at'),
  selfieImageBack: text('selfie_image_back'),
  rejectionReason: text('rejection_reason')
});

export const tests = sqliteTable('tests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').default(''),
  questions: text('questions').default('[]'),
  createdBy: text('createdBy'),
  createdByRole: text('createdByRole'),
  isActive: integer('isActive').default(1),
  duration: integer('duration').default(30),
  company: text('company').default('Get Set Flight'),
  department: text('department').default('all'),
  created: text('created'),
  modified: text('modified')
});

export const testResults = sqliteTable('test_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  testId: integer('testId').notNull(),
  testTitle: text('testTitle'),
  userId: integer('userId').notNull(),
  userName: text('userName'),
  userRole: text('userRole'),
  answers: text('answers').default('{}'),
  score: integer('score').default(0),
  totalQuestions: integer('totalQuestions').default(0),
  correctAnswers: integer('correctAnswers').default(0),
  wrongAnswers: integer('wrongAnswers').default(0),
  unanswered: integer('unanswered').default(0),
  percentage: real('percentage').default(0),
  company: text('company').default('Get Set Flight'),
  submittedAt: text('submittedAt')
});

export const notices = sqliteTable('notices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  image: text('image'),
  addedBy: text('addedBy'),
  company: text('company').default('Get Set Flight'),
  created: text('created'),
  modified: text('modified')
});

export const paymentAuthorizations = sqliteTable('payment_authorizations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  queryId: text('query_id'),
  token: text('token'),
  clientName: text('client_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  amount: text('amount'),
  currency: text('currency').default('CAD'),
  paymentType: text('payment_type').default('Credit Card'),
  cardBrand: text('card_brand'),
  maskedCardNumber: text('masked_card_number'),
  cardNumber: text('card_number'),
  cvv: text('cvv'),
  expiryDate: text('expiry_date'),
  reservationNumber: text('reservation_number'),
  billingAddress: text('billing_address'),
  certificateHtml: text('certificate_html'),
  pdfBase64: text('pdf_base64'),
  pdfUrl: text('pdf_url'),
  selfieImage: text('selfie_image'),
  insuranceSignature: text('insurance_signature'),
  cardholderSignature: text('cardholder_signature'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status').default('Payment Authorized'),
  company: text('company').default('Get Set Flight'),
  notes: text('notes'),
  created: text('created'),
  modified: text('modified')
});
