import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getMySqlPool(): mysql.Pool | null {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const user = process.env.DB_USER || process.env.MYSQL_USER || '';
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE || '';

  if (!database || !user) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      dateStrings: true,
    });
    console.log(`[Hostinger MySQL] Pool created for database: ${database} at ${host}:${port}`);
  }

  return pool;
}

export async function initMySqlTables(): Promise<void> {
  const p = getMySqlPool();
  if (!p) return;

  const queries = [
    `CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      addedBy VARCHAR(255),
      roleName VARCHAR(255) NOT NULL,
      permissions LONGTEXT,
      status VARCHAR(50) DEFAULT 'Active',
      created VARCHAR(100),
      modified VARCHAR(100),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      addedBy VARCHAR(255),
      image LONGTEXT,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100),
      gender VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Active',
      created VARCHAR(100),
      modified VARCHAR(100),
      password VARCHAR(255),
      aadharCard LONGTEXT,
      panCard LONGTEXT,
      resume LONGTEXT,
      company VARCHAR(100) DEFAULT 'Get Set Flight',
      amadeusCreds LONGTEXT,
      permissions LONGTEXT,
      INDEX idx_user_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS query_statuses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      addedBy VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      bookings INT DEFAULT 0,
      master INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Active',
      created VARCHAR(100),
      modified VARCHAR(100),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      queryId VARCHAR(100) UNIQUE,
      addedBy VARCHAR(255),
      firstName VARCHAR(255),
      lastName VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(100),
      origin VARCHAR(100),
      destination VARCHAR(100),
      departureDate VARCHAR(100),
      returnDate VARCHAR(100),
      cabin VARCHAR(100),
      adults INT DEFAULT 1,
      children INT DEFAULT 0,
      infants INT DEFAULT 0,
      queryStatus VARCHAR(100),
      querySource VARCHAR(100),
      remarks LONGTEXT,
      partialPayment VARCHAR(100),
      pnr VARCHAR(100),
      created VARCHAR(100),
      modified VARCHAR(100),
      images LONGTEXT,
      pnr_details LONGTEXT,
      trip_type VARCHAR(100),
      currency VARCHAR(50),
      qc_status VARCHAR(50) DEFAULT 'NULL',
      company VARCHAR(100) DEFAULT 'Get Set Flight',
      qcNote LONGTEXT,
      partialPaymentDates LONGTEXT,
      partialPaymentSent LONGTEXT,
      qcReviewedBy VARCHAR(255) DEFAULT 'NULL',
      qcReviewedAt VARCHAR(100) DEFAULT 'NULL',
      partialPaymentAmount VARCHAR(100) DEFAULT 'NULL',
      partialPaymentDueDate VARCHAR(100) DEFAULT 'NULL',
      partialPaymentCleared INT DEFAULT 0,
      partialPaymentClearedBy VARCHAR(255) DEFAULT 'NULL',
      partialPaymentClearedDate VARCHAR(100) DEFAULT 'NULL',
      partialPaymentReceived VARCHAR(100) DEFAULT 'NULL',
      receivedAmount VARCHAR(100) DEFAULT '',
      modificationHistory LONGTEXT,
      INDEX idx_query_id (queryId),
      INDEX idx_booking_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS site_bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      queryId VARCHAR(100) UNIQUE,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(100),
      origin VARCHAR(100),
      destination VARCHAR(100),
      travelDates VARCHAR(100),
      assignment VARCHAR(255),
      created VARCHAR(100),
      adults INT DEFAULT 0,
      children INT DEFAULT 0,
      infants INT DEFAULT 0,
      cabinClass VARCHAR(100),
      passengers LONGTEXT,
      departDate VARCHAR(100),
      status VARCHAR(100) DEFAULT 'New',
      source VARCHAR(100) DEFAULT 'Website Form',
      modified VARCHAR(100),
      trip_type VARCHAR(100),
      cabin VARCHAR(100),
      departure_date VARCHAR(100),
      return_date VARCHAR(100),
      raw_data LONGTEXT,
      assignment_log LONGTEXT,
      assignedTo VARCHAR(255),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS payment_authorizations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      queryId VARCHAR(100),
      query_id VARCHAR(100),
      token VARCHAR(255),
      clientName VARCHAR(255),
      client_name VARCHAR(255),
      firstName VARCHAR(255),
      first_name VARCHAR(255),
      lastName VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(100),
      amount VARCHAR(100),
      currency VARCHAR(50) DEFAULT 'CAD',
      paymentType VARCHAR(100) DEFAULT 'Credit Card',
      cardBrand VARCHAR(100),
      maskedCardNumber VARCHAR(100),
      cardNumber VARCHAR(100),
      card_number VARCHAR(100),
      cvv VARCHAR(50),
      expiryDate VARCHAR(100),
      expiry_date VARCHAR(100),
      reservationNumber VARCHAR(100),
      billingAddress LONGTEXT,
      certificateHtml LONGTEXT,
      pdfBase64 LONGTEXT,
      pdfUrl LONGTEXT,
      selfieImage LONGTEXT,
      insuranceSignature LONGTEXT,
      cardholderSignature LONGTEXT,
      ipAddress VARCHAR(100),
      userAgent LONGTEXT,
      status VARCHAR(100) DEFAULT 'Payment Authorized',
      company VARCHAR(100) DEFAULT 'Get Set Flight',
      notes LONGTEXT,
      created VARCHAR(100),
      modified VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS client_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT,
      query_id VARCHAR(100),
      token VARCHAR(255) NOT NULL,
      client_name VARCHAR(255),
      client_email VARCHAR(255),
      selfie_image LONGTEXT,
      selfie_verified INT DEFAULT 0,
      selfie_ai_result LONGTEXT,
      document_type VARCHAR(100),
      document_image LONGTEXT,
      document_verified INT DEFAULT 0,
      document_ai_result LONGTEXT,
      ip_address VARCHAR(100),
      latitude VARCHAR(100),
      longitude VARCHAR(100),
      user_agent LONGTEXT,
      status VARCHAR(100) DEFAULT 'pending',
      submitted_at VARCHAR(100),
      created VARCHAR(100),
      company VARCHAR(100) DEFAULT 'Get Set Flight',
      reviewed_by VARCHAR(255),
      review_status VARCHAR(100) DEFAULT 'pending',
      reviewed_at VARCHAR(100),
      selfie_image_back LONGTEXT,
      rejection_reason LONGTEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS crm_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      targetRole VARCHAR(100),
      targetUserId INT,
      title VARCHAR(255),
      message LONGTEXT,
      type VARCHAR(50) DEFAULT 'info',
      bookingId INT,
      queryId VARCHAR(100),
      isRead INT DEFAULT 0,
      createdBy VARCHAR(255),
      created VARCHAR(100),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS attendance_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      userName VARCHAR(255),
      date VARCHAR(100),
      loginTime VARCHAR(100),
      logoutTime VARCHAR(100),
      totalHours VARCHAR(100),
      ipAddress VARCHAR(100),
      location VARCHAR(255),
      device VARCHAR(255),
      os VARCHAR(255),
      browser VARCHAR(255),
      status VARCHAR(50),
      breaks LONGTEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS attendance_sheet (
      userId INT NOT NULL,
      date VARCHAR(100) NOT NULL,
      status VARCHAR(50),
      logs LONGTEXT,
      PRIMARY KEY (userId, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS leave_balances (
      userId INT NOT NULL,
      year INT NOT NULL,
      casualLeave INT DEFAULT 0,
      paidLeave INT DEFAULT 0,
      sickLeave INT DEFAULT 0,
      compOff INT DEFAULT 0,
      logs LONGTEXT,
      paidLeaveUsed INT DEFAULT 0,
      paidLeaveLeft INT DEFAULT 0,
      month INT DEFAULT 0,
      PRIMARY KEY (userId, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS login_activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      user_name VARCHAR(255),
      login_time VARCHAR(100),
      logout_time VARCHAR(100),
      duration VARCHAR(100),
      ip_address VARCHAR(100),
      device VARCHAR(255),
      status VARCHAR(50),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS break_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      type VARCHAR(100),
      start_time VARCHAR(100),
      end_time VARCHAR(100),
      duration VARCHAR(100),
      created VARCHAR(100),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS updates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content LONGTEXT NOT NULL,
      image LONGTEXT,
      addedBy VARCHAR(255) NOT NULL,
      created VARCHAR(100) NOT NULL,
      modified VARCHAR(100) NOT NULL,
      company VARCHAR(100) DEFAULT 'Get Set Flight',
      category VARCHAR(100) DEFAULT 'General',
      priority VARCHAR(100) DEFAULT 'Normal',
      createdBy VARCHAR(255),
      targetRoles VARCHAR(255) DEFAULT 'All',
      isActive INT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS system_settings (
      \`key\` VARCHAR(150) PRIMARY KEY,
      \`value\` LONGTEXT NOT NULL,
      updatedBy VARCHAR(255),
      updatedAt VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      timestamp VARCHAR(100) NOT NULL,
      action VARCHAR(255) NOT NULL,
      performedBy VARCHAR(255) NOT NULL,
      performedByRole VARCHAR(100) DEFAULT '',
      targetType VARCHAR(100) NOT NULL,
      targetId VARCHAR(100) DEFAULT '',
      targetName VARCHAR(255) NOT NULL,
      details LONGTEXT NOT NULL,
      changes LONGTEXT,
      created VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS password_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(50) NOT NULL,
      expires BIGINT NOT NULL,
      created VARCHAR(100),
      INDEX idx_otp_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS ip_whitelist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip_address VARCHAR(100),
      description VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Active',
      added_by VARCHAR(255),
      created VARCHAR(100),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS payslip_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employeeName VARCHAR(255) NOT NULL,
      employeeId VARCHAR(100),
      company VARCHAR(100) DEFAULT 'GSF',
      requestedMonth VARCHAR(100) NOT NULL,
      requestDate VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      note LONGTEXT,
      reviewedBy VARCHAR(255),
      reviewedAt VARCHAR(100),
      createdBy VARCHAR(255),
      created VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS tests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description LONGTEXT,
      questions LONGTEXT,
      createdBy VARCHAR(255),
      createdByRole VARCHAR(100),
      isActive INT DEFAULT 1,
      created VARCHAR(100),
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS test_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testId INT NOT NULL,
      userId INT NOT NULL,
      userName VARCHAR(255),
      score INT DEFAULT 0,
      totalQuestions INT DEFAULT 0,
      percentage REAL DEFAULT 0,
      answers LONGTEXT,
      completedAt VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content LONGTEXT NOT NULL,
      priority VARCHAR(50) DEFAULT 'Normal',
      category VARCHAR(100) DEFAULT 'General',
      audience VARCHAR(100) DEFAULT 'All',
      author VARCHAR(255) NOT NULL,
      authorRole VARCHAR(100),
      created VARCHAR(100) NOT NULL,
      expiresAt VARCHAR(100),
      isActive INT DEFAULT 1,
      company VARCHAR(100) DEFAULT 'Get Set Flight'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  for (const q of queries) {
    try {
      await p.query(q);
    } catch (err: any) {
      console.warn('[Hostinger MySQL Init Notice]:', err.message);
    }
  }
  console.log('[Hostinger MySQL] All CRM tables verified successfully in Hostinger MySQL.');
}

export function isMySqlActive(): boolean {
  return !!(process.env.DB_NAME && (process.env.DB_USER || process.env.MYSQL_USER));
}

export async function queryMySql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getMySqlPool();
  if (!p) return [];
  const [rows] = await p.query(sql, params);
  return rows as T[];
}

export async function executeMySql(sql: string, params: any[] = []): Promise<any> {
  const p = getMySqlPool();
  if (!p) return null;
  const [result] = await p.execute(sql, params);
  return result;
}

export async function findUserInMySql(email: string): Promise<any | null> {
  const p = getMySqlPool();
  if (!p) return null;
  try {
    const [rows]: any = await p.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email.trim().toLowerCase()]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err: any) {
    console.warn('[Hostinger MySQL findUser Notice]:', err.message);
    return null;
  }
}

