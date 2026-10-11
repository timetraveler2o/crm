$content = @"

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
"@

$path = 'c:\Users\rahul\Downloads\source_code (3)\backend\src\db\schema.ts'
Add-Content -Path $path -Value $content -Encoding UTF8
