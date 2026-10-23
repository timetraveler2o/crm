import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

async function exportSqliteToMySql() {
  const client = createClient({ url: 'file:sqlite.db' });
  
  // List of tables to export
  const tables = [
    'roles',
    'users',
    'query_statuses',
    'bookings',
    'site_bookings',
    'payment_authorizations',
    'client_verifications',
    'crm_notifications',
    'attendance_records',
    'attendance_sheet',
    'leave_balances',
    'login_activity',
    'break_logs',
    'updates',
    'system_settings',
    'audit_logs',
    'password_otps',
    'ip_whitelist',
    'payslip_requests',
    'tests',
    'test_results',
    'notices'
  ];

  let sqlDump = `-- =========================================================================
-- Get Set Flight CRM - Complete Database Dump for Hostinger MySQL
-- Generated automatically: ${new Date().toISOString()}
-- Safe to import into Hostinger MySQL (Does NOT touch any WordPress tables)
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

`;

  // Schema creation definitions for MySQL
  const schemas = {
    roles: `CREATE TABLE IF NOT EXISTS \`roles\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`addedBy\` VARCHAR(255),
  \`roleName\` VARCHAR(255) NOT NULL UNIQUE,
  \`permissions\` LONGTEXT,
  \`status\` VARCHAR(50) DEFAULT 'Active',
  \`created\` VARCHAR(100),
  \`modified\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    users: `CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`addedBy\` VARCHAR(255),
  \`image\` LONGTEXT,
  \`name\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(100),
  \`gender\` VARCHAR(50),
  \`status\` VARCHAR(50) DEFAULT 'Active',
  \`created\` VARCHAR(100),
  \`modified\` VARCHAR(100),
  \`password\` VARCHAR(255),
  \`aadharCard\` LONGTEXT,
  \`panCard\` LONGTEXT,
  \`resume\` LONGTEXT,
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight',
  \`amadeusCreds\` LONGTEXT,
  \`permissions\` LONGTEXT,
  \`emergencyNumber\` VARCHAR(100),
  \`currentAddress\` LONGTEXT,
  \`permanentAddress\` LONGTEXT,
  INDEX \`idx_user_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    query_statuses: `CREATE TABLE IF NOT EXISTS \`query_statuses\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`addedBy\` VARCHAR(255),
  \`name\` VARCHAR(255) NOT NULL UNIQUE,
  \`bookings\` INT DEFAULT 0,
  \`master\` INT DEFAULT 0,
  \`status\` VARCHAR(50) DEFAULT 'Active',
  \`created\` VARCHAR(100),
  \`modified\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    bookings: `CREATE TABLE IF NOT EXISTS \`bookings\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`queryId\` VARCHAR(100) UNIQUE,
  \`addedBy\` VARCHAR(255),
  \`firstName\` VARCHAR(255),
  \`lastName\` VARCHAR(255),
  \`email\` VARCHAR(255),
  \`phone\` VARCHAR(100),
  \`origin\` VARCHAR(100),
  \`destination\` VARCHAR(100),
  \`departureDate\` VARCHAR(100),
  \`returnDate\` VARCHAR(100),
  \`cabin\` VARCHAR(100),
  \`adults\` INT DEFAULT 1,
  \`children\` INT DEFAULT 0,
  \`infants\` INT DEFAULT 0,
  \`queryStatus\` VARCHAR(100),
  \`querySource\` VARCHAR(100),
  \`remarks\` LONGTEXT,
  \`partialPayment\` VARCHAR(100),
  \`pnr\` VARCHAR(100),
  \`created\` VARCHAR(100),
  \`modified\` VARCHAR(100),
  \`images\` LONGTEXT,
  \`pnr_details\` LONGTEXT,
  \`trip_type\` VARCHAR(100),
  \`currency\` VARCHAR(50),
  \`qc_status\` VARCHAR(50) DEFAULT 'NULL',
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight',
  \`qcNote\` LONGTEXT,
  \`partialPaymentDates\` LONGTEXT,
  \`partialPaymentSent\` LONGTEXT,
  \`qcReviewedBy\` VARCHAR(255) DEFAULT 'NULL',
  \`qcReviewedAt\` VARCHAR(100) DEFAULT 'NULL',
  \`partialPaymentAmount\` VARCHAR(100) DEFAULT 'NULL',
  \`partialPaymentDueDate\` VARCHAR(100) DEFAULT 'NULL',
  \`partialPaymentCleared\` INT DEFAULT 0,
  \`partialPaymentClearedBy\` VARCHAR(255) DEFAULT 'NULL',
  \`partialPaymentClearedDate\` VARCHAR(100) DEFAULT 'NULL',
  \`partialPaymentReceived\` VARCHAR(100) DEFAULT 'NULL',
  \`receivedAmount\` VARCHAR(100) DEFAULT '',
  \`modificationHistory\` LONGTEXT,
  INDEX \`idx_query_id\` (\`queryId\`),
  INDEX \`idx_booking_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    site_bookings: `CREATE TABLE IF NOT EXISTS \`site_bookings\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`queryId\` VARCHAR(100) UNIQUE,
  \`name\` VARCHAR(255),
  \`email\` VARCHAR(255),
  \`phone\` VARCHAR(100),
  \`origin\` VARCHAR(100),
  \`destination\` VARCHAR(100),
  \`travelDates\` VARCHAR(100),
  \`assignment\` VARCHAR(255),
  \`created\` VARCHAR(100),
  \`adults\` INT DEFAULT 0,
  \`children\` INT DEFAULT 0,
  \`infants\` INT DEFAULT 0,
  \`cabinClass\` VARCHAR(100),
  \`passengers\` LONGTEXT,
  \`departDate\` VARCHAR(100),
  \`status\` VARCHAR(100) DEFAULT 'New',
  \`source\` VARCHAR(100) DEFAULT 'Website Form',
  \`modified\` VARCHAR(100),
  \`trip_type\` VARCHAR(100),
  \`cabin\` VARCHAR(100),
  \`departure_date\` VARCHAR(100),
  \`return_date\` VARCHAR(100),
  \`raw_data\` LONGTEXT,
  \`assignment_log\` LONGTEXT,
  \`assignedTo\` VARCHAR(255),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    payment_authorizations: `CREATE TABLE IF NOT EXISTS \`payment_authorizations\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`query_id\` VARCHAR(100),
  \`token\` VARCHAR(255),
  \`client_name\` VARCHAR(255),
  \`first_name\` VARCHAR(255),
  \`last_name\` VARCHAR(255),
  \`email\` VARCHAR(255),
  \`phone\` VARCHAR(100),
  \`amount\` VARCHAR(100),
  \`currency\` VARCHAR(50) DEFAULT 'CAD',
  \`payment_type\` VARCHAR(100) DEFAULT 'Credit Card',
  \`card_brand\` VARCHAR(100),
  \`masked_card_number\` VARCHAR(100),
  \`card_number\` VARCHAR(100),
  \`cvv\` VARCHAR(50),
  \`expiry_date\` VARCHAR(100),
  \`reservation_number\` VARCHAR(100),
  \`billing_address\` LONGTEXT,
  \`certificate_html\` LONGTEXT,
  \`pdf_base64\` LONGTEXT,
  \`pdf_url\` LONGTEXT,
  \`selfie_image\` LONGTEXT,
  \`insurance_signature\` LONGTEXT,
  \`cardholder_signature\` LONGTEXT,
  \`ip_address\` VARCHAR(100),
  \`user_agent\` LONGTEXT,
  \`status\` VARCHAR(100) DEFAULT 'Payment Authorized',
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight',
  \`notes\` LONGTEXT,
  \`created\` VARCHAR(100),
  \`modified\` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    client_verifications: `CREATE TABLE IF NOT EXISTS \`client_verifications\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`booking_id\` INT,
  \`query_id\` VARCHAR(100),
  \`token\` VARCHAR(255) NOT NULL,
  \`client_name\` VARCHAR(255),
  \`client_email\` VARCHAR(255),
  \`selfie_image\` LONGTEXT,
  \`selfie_image_back\` LONGTEXT,
  \`selfie_verified\` INT DEFAULT 0,
  \`selfie_ai_result\` LONGTEXT,
  \`document_type\` VARCHAR(100),
  \`document_image\` LONGTEXT,
  \`document_verified\` INT DEFAULT 0,
  \`document_ai_result\` LONGTEXT,
  \`ip_address\` VARCHAR(100),
  \`latitude\` VARCHAR(100),
  \`longitude\` VARCHAR(100),
  \`user_agent\` LONGTEXT,
  \`status\` VARCHAR(100) DEFAULT 'pending',
  \`submitted_at\` VARCHAR(100),
  \`created\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight',
  \`reviewed_by\` VARCHAR(255),
  \`review_status\` VARCHAR(100) DEFAULT 'pending',
  \`reviewed_at\` VARCHAR(100),
  \`rejection_reason\` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    crm_notifications: `CREATE TABLE IF NOT EXISTS \`crm_notifications\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`targetRole\` VARCHAR(100),
  \`targetUserId\` INT,
  \`title\` VARCHAR(255),
  \`message\` LONGTEXT,
  \`type\` VARCHAR(50) DEFAULT 'info',
  \`bookingId\` INT,
  \`queryId\` VARCHAR(100),
  \`isRead\` INT DEFAULT 0,
  \`createdBy\` VARCHAR(255),
  \`created\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    attendance_records: `CREATE TABLE IF NOT EXISTS \`attendance_records\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`userId\` INT NOT NULL,
  \`userName\` VARCHAR(255),
  \`date\` VARCHAR(100),
  \`loginTime\` VARCHAR(100),
  \`logoutTime\` VARCHAR(100),
  \`totalHours\` VARCHAR(100),
  \`ipAddress\` VARCHAR(100),
  \`location\` VARCHAR(255),
  \`device\` VARCHAR(255),
  \`os\` VARCHAR(255),
  \`browser\` VARCHAR(255),
  \`status\` VARCHAR(50),
  \`breaks\` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    attendance_sheet: `CREATE TABLE IF NOT EXISTS \`attendance_sheet\` (
  \`userId\` INT NOT NULL,
  \`date\` VARCHAR(100) NOT NULL,
  \`status\` VARCHAR(50),
  \`logs\` LONGTEXT,
  PRIMARY KEY (\`userId\`, \`date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    leave_balances: `CREATE TABLE IF NOT EXISTS \`leave_balances\` (
  \`userId\` INT NOT NULL,
  \`year\` INT NOT NULL,
  \`casualLeave\` INT DEFAULT 0,
  \`paidLeave\` INT DEFAULT 0,
  \`sickLeave\` INT DEFAULT 0,
  \`compOff\` INT DEFAULT 0,
  \`logs\` LONGTEXT,
  \`paidLeaveUsed\` INT DEFAULT 0,
  \`paidLeaveLeft\` INT DEFAULT 0,
  \`month\` INT DEFAULT 0,
  PRIMARY KEY (\`userId\`, \`year\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    login_activity: `CREATE TABLE IF NOT EXISTS \`login_activity\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT,
  \`user_name\` VARCHAR(255),
  \`login_time\` VARCHAR(100),
  \`logout_time\` VARCHAR(100),
  \`duration\` VARCHAR(100),
  \`ip_address\` VARCHAR(100),
  \`device\` VARCHAR(255),
  \`status\` VARCHAR(50),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    break_logs: `CREATE TABLE IF NOT EXISTS \`break_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT,
  \`type\` VARCHAR(100),
  \`start_time\` VARCHAR(100),
  \`end_time\` VARCHAR(100),
  \`duration\` VARCHAR(100),
  \`created\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    updates: `CREATE TABLE IF NOT EXISTS \`updates\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`content\` LONGTEXT NOT NULL,
  \`image\` LONGTEXT,
  \`addedBy\` VARCHAR(255) NOT NULL,
  \`created\` VARCHAR(100) NOT NULL,
  \`modified\` VARCHAR(100) NOT NULL,
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight',
  \`category\` VARCHAR(100) DEFAULT 'General',
  \`priority\` VARCHAR(100) DEFAULT 'Normal',
  \`createdBy\` VARCHAR(255),
  \`targetRoles\` VARCHAR(255) DEFAULT 'All',
  \`isActive\` INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    system_settings: `CREATE TABLE IF NOT EXISTS \`system_settings\` (
  \`key\` VARCHAR(150) PRIMARY KEY,
  \`value\` LONGTEXT NOT NULL,
  \`updatedBy\` VARCHAR(255),
  \`updatedAt\` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    audit_logs: `CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`timestamp\` VARCHAR(100) NOT NULL,
  \`action\` VARCHAR(255) NOT NULL,
  \`performedBy\` VARCHAR(255) NOT NULL,
  \`performedByRole\` VARCHAR(100) DEFAULT '',
  \`targetType\` VARCHAR(100) NOT NULL,
  \`targetId\` VARCHAR(100) DEFAULT '',
  \`targetName\` VARCHAR(255) NOT NULL,
  \`details\` LONGTEXT NOT NULL,
  \`changes\` LONGTEXT,
  \`created\` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    password_otps: `CREATE TABLE IF NOT EXISTS \`password_otps\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`email\` VARCHAR(255) NOT NULL,
  \`otp\` VARCHAR(50) NOT NULL,
  \`expires\` BIGINT NOT NULL,
  \`created\` VARCHAR(100),
  INDEX \`idx_otp_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    ip_whitelist: `CREATE TABLE IF NOT EXISTS \`ip_whitelist\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`ip_address\` VARCHAR(100),
  \`description\` VARCHAR(255),
  \`status\` VARCHAR(50) DEFAULT 'Active',
  \`added_by\` VARCHAR(255),
  \`created\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    payslip_requests: `CREATE TABLE IF NOT EXISTS \`payslip_requests\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`employeeName\` VARCHAR(255) NOT NULL,
  \`employeeId\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'GSF',
  \`requestedMonth\` VARCHAR(100) NOT NULL,
  \`requestDate\` VARCHAR(100),
  \`status\` VARCHAR(50) DEFAULT 'Pending',
  \`note\` LONGTEXT,
  \`reviewedBy\` VARCHAR(255),
  \`reviewedAt\` VARCHAR(100),
  \`createdBy\` VARCHAR(255),
  \`created\` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    tests: `CREATE TABLE IF NOT EXISTS \`tests\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` LONGTEXT,
  \`questions\` LONGTEXT,
  \`createdBy\` VARCHAR(255),
  \`createdByRole\` VARCHAR(100),
  \`isActive\` INT DEFAULT 1,
  \`created\` VARCHAR(100),
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    test_results: `CREATE TABLE IF NOT EXISTS \`test_results\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`testId\` INT NOT NULL,
  \`userId\` INT NOT NULL,
  \`userName\` VARCHAR(255),
  \`score\` INT DEFAULT 0,
  \`totalQuestions\` INT DEFAULT 0,
  \`percentage\` REAL DEFAULT 0,
  \`answers\` LONGTEXT,
  \`completedAt\` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    notices: `CREATE TABLE IF NOT EXISTS \`notices\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`content\` LONGTEXT NOT NULL,
  \`priority\` VARCHAR(50) DEFAULT 'Normal',
  \`category\` VARCHAR(100) DEFAULT 'General',
  \`audience\` VARCHAR(100) DEFAULT 'All',
  \`author\` VARCHAR(255) NOT NULL,
  \`authorRole\` VARCHAR(100),
  \`created\` VARCHAR(100) NOT NULL,
  \`expiresAt\` VARCHAR(100),
  \`isActive\` INT DEFAULT 1,
  \`company\` VARCHAR(100) DEFAULT 'Get Set Flight'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  };

  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
  }

  for (const table of tables) {
    if (schemas[table]) {
      sqlDump += `-- -----------------------------------------------------\n`;
      sqlDump += `-- Table structure for \`${table}\`\n`;
      sqlDump += `-- -----------------------------------------------------\n`;
      sqlDump += `${schemas[table]}\n\n`;
    }

    try {
      const res = await client.execute(`SELECT * FROM "${table}"`);
      if (res.rows && res.rows.length > 0) {
        sqlDump += `-- Dumping data for table \`${table}\` (${res.rows.length} rows)\n`;
        const columns = res.columns.map(c => `\`${c}\``).join(', ');
        
        for (const row of res.rows) {
          const values = res.columns.map(c => escapeSql(row[c])).join(', ');
          sqlDump += `INSERT INTO \`${table}\` (${columns}) VALUES (${values}) ON DUPLICATE KEY UPDATE id=id;\n`;
        }
        sqlDump += `\n`;
      }
    } catch (e) {
      console.log(`Notice: table ${table} could not be dumped: ${e.message}`);
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  sqlDump += `-- End of dump\n`;

  const outputPath = path.join(process.cwd(), 'hostinger_crm_data.sql');
  fs.writeFileSync(outputPath, sqlDump, 'utf8');
  console.log(`✅ MySQL dump successfully created at: ${outputPath} (${sqlDump.length} bytes)`);

  const rootOutputPath = path.join(process.cwd(), '..', 'hostinger_crm_data.sql');
  fs.writeFileSync(rootOutputPath, sqlDump, 'utf8');
}

exportSqliteToMySql();
