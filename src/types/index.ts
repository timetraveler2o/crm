// Auth Types
export interface AmadeusCredential {
  id: string; // unique identifier for this credential entry
  amadousId: string;
  username: string;
  officeId: string;
}

export interface User {
  id: number;
  addedBy: string;
  image?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  status: 'Active' | 'Inactive';
  created: string;
  modified: string;
  password?: string;
  aadharCard?: string;
  panCard?: string;
  resume?: string;
  company?: string; // Get Set Flight | Look Book Ticket | Traveloboom
  amadeusCreds?: AmadeusCredential[]; // Amadeus login credentials
  emergencyNumber?: string;
  currentAddress?: string;
  permanentAddress?: string;
  permissions?: string[]; // Custom or overridden permissions
}

// Company definitions
export const COMPANIES = [
  { id: 'GSF', name: 'Get Set Flight', emailDomain: 'getsetflight.com', altDomain: '', logo: '/logo.png', short: 'GSF' },
  { id: 'LBT', name: 'Look Book Ticket', emailDomain: 'lookbookticket.com', altDomain: '', logo: 'https://lookbookticket.com/logo.png', short: 'LBT' },
  { id: 'travelo', name: 'Traveloboom', emailDomain: 'traveloboom.com', altDomain: '', logo: 'https://traveloboom.com/traveloboom_logo_v4.png', short: 'TBM' },
] as const;

export type CompanyId = 'GSF' | 'LBT' | 'travelo';

export function getCompanyFromEmail(email: string): CompanyId {
  const lower = email.toLowerCase();
  if (lower.includes('@lookbookticket.com')) return 'LBT';
  if (lower.includes('@traveloboom.com')) return 'travelo';
  return 'GSF'; // default
}

export function getCompanyInfo(companyId: CompanyId) {
  return COMPANIES.find(c => c.id === companyId) || COMPANIES[0];
}

export interface Role {
  id: number;
  addedBy: string;
  roleName: string;
  permissions: string[];
  status: 'Active' | 'Inactive';
  created: string;
  modified: string;
}


export interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  performedBy: string;
  performedByRole?: string;
  targetType: 'Role' | 'User' | 'Permission';
  targetId?: string;
  targetName: string;
  details: string;
  changes?: string;
  created: string;
}

export const STANDARD_ROLES = [
  'Admin',
  'Supervisor',
  'Sr. Travel Executive',
  'Travel Executive'
] as const;

export interface QueryStatus {
  id: number;
  addedBy: string;
  name: string;
  bookings: number;
  master: boolean;
  status: 'Active' | 'Inactive';
  created: string;
  modified: string;
}

export interface Booking {
  id: number;
  queryId: string;
  addedBy: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  cabin: 'Economy' | 'Business' | 'Premium' | 'Premium Economy' | 'First Class';
  adults: number;
  children: number;
  infants: number;
  queryStatus: string;
  querySource: string;
  remarks: string;
  partialPayment: 'Yes' | 'No';
  partialPaymentDueDate?: string; // YYYY-MM-DD - when payment is due
  partialPaymentCleared?: boolean; // true when dues are cleared
  partialPaymentClearedBy?: string; // who cleared the dues
  partialPaymentClearedDate?: string; // when dues were cleared
  partialPaymentAmount?: string; // outstanding amount
  receivedAmount?: string; // amount received from client so far
  callbackDate?: string; // YYYY-MM-DD - when to call back the client
  callbackRemark?: string; // What to discuss during callback
  pnr: string;
  pnrDetails?: string;
  pnr_details?: string;
  tripType?: string;
  currency?: string;
  images?: string;
  created: string;
  modified: string;
  company?: string;
  qcStatus?: string; // null | 'Pending QC' | 'QC Approved' | 'QC Rejected'
  qcNote?: string;
  qcReviewedBy?: string; // who accepted/rejected QC
  qcReviewedAt?: string; // when QC was reviewed
  modificationHistory?: string; // JSON array of modification records
}

export const SUPPLIERS = ['INTER', 'SKY', 'ONKAR', 'RIYA (IXC)', 'CVFR', 'MONDEE', 'MMT', 'INDIGO', 'TBO', 'Airline Website', 'Goibibo', 'Easemytrip', 'MMT Website', 'Fixed Departures'] as const;
export type SupplierName = typeof SUPPLIERS[number];

export const PAYMENT_METHODS = ['Pax Card', 'Cheque', 'Third Party Card', 'Company Card'] as const;
export type PaymentMethodName = typeof PAYMENT_METHODS[number];

export interface PnrDetail {
  pnr: string;
  firstName: string;
  lastName: string;
  airline: string;
  supplier: string;
  paymentMethod: string;
  cost: number;
  sell: number;
  fee: number;
  mco: number;
  gpm: number;
}

export interface RemarkEntry {
  text: string;
  addedBy: string;
  date: string;
}

export interface SiteBooking {
  id: number;
  queryId: string;
  name: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  travelDates: string;
  assignment: string;
  assignedTo?: string;
  assignmentLog?: string; // JSON array of {agent, date, action}
  created: string;
  adults?: number;
  children?: number;
  infants?: number;
  tripType?: string;
  cabin?: string;
  departDate?: string;
  returnDate?: string;
  company?: string;
}

export interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  date: string;
  loginTime: string;
  logoutTime: string;
  totalHours: string;
  ipAddress: string;
  location: string;
  device: string;
  os: string;
  browser: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave';
  breaks: BreakRecord[];
}

export type AttendanceStatus = 'Present' | 'Half Day' | 'Paid Leave' | 'Non-Paid Leave' | 'Absent' | 'Comp Off' | 'Week Off';

export interface AttendanceSheetEntry {
  userId: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string; bg: string; short: string }[] = [
  { value: 'Present', label: 'Present', color: '#16a34a', bg: '#dcfce7', short: 'P' },
  { value: 'Half Day', label: 'Half Day', color: '#d97706', bg: '#fef3c7', short: 'HD' },
  { value: 'Paid Leave', label: 'Paid Leave', color: '#7c3aed', bg: '#ede9fe', short: 'PL' },
  { value: 'Non-Paid Leave', label: 'Non-Paid Leave', color: '#ea580c', bg: '#ffedd5', short: 'NP' },
  { value: 'Absent', label: 'Absent', color: '#dc2626', bg: '#fee2e2', short: 'A' },
  { value: 'Comp Off', label: 'Comp Off', color: '#0d9488', bg: '#ccfbf1', short: 'CO' },
  { value: 'Week Off', label: 'Week Off', color: '#4b5563', bg: '#f3f4f6', short: 'WO' },
];

export interface LeaveBalance {
  userId: number;
  year: number;
  casualLeave: number;   // CL allocation (legacy, kept for compat)
  paidLeave: number;     // PL allocation - manually set by HR/Admin
  paidLeaveUsed: number; // PL used - manually set by HR/Admin (override auto-calc)
  sickLeave: number;     // SL allocation (legacy, kept for compat)
  compOff: number;       // CO allocation (earned, shown in attendance only)
}

export const LEAVE_TYPES = [
  { key: 'paidLeave' as const, label: 'Paid Leave', short: 'PL', color: '#7c3aed', bg: '#ede9fe' },
];

// Comp Off is only tracked in attendance sheet, not shown in leave balance
export const LEAVE_TYPES_ALL = [
  { key: 'paidLeave' as const, label: 'Paid Leave', short: 'PL', color: '#7c3aed', bg: '#ede9fe' },
  { key: 'compOff' as const, label: 'Comp Off', short: 'CO', color: '#0d9488', bg: '#ccfbf1' },
];

export interface BreakRecord {
  id: number;
  type: 'Lunch' | 'Dinner' | 'Tea' | 'On Call' | 'Meeting' | 'Personal';
  startTime: string;
  endTime: string;
  duration: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created: string;
  company?: CompanyId; // Company-specific notifications (fdi/emt/travelo)
}

export interface LoginActivity {
  id: number;
  userId: number;
  userName: string;
  loginTime: string;
  logoutTime: string;
  duration: string;
  ipAddress: string;
  device: string;
  status: 'Active' | 'Logged Out' | 'Expired';
}

export interface IpWhitelist {
  id: number;
  ipAddress: string;
  description: string;
  status: 'Active' | 'Inactive';
  addedBy: string;
  created: string;
}

export type SortOrder = 'id_asc' | 'id_desc' | 'sort_asc' | 'sort_desc';
export type PerPage = 25 | 50 | 100;

export const PERMISSIONS = [
  'Role Management',
  'User Management',
  'Query Status Management',
  'Booking Management',
  'Payment Authorization',
  'Attendance',
  'Edit Attendance',
  'Reports',
  'Login Activity',
  'IP Whitelist',
  'Export Data',
  'Profile Edit',
  'Hold',
  'Sold',
  'Follow Up',
  'New Query',
  'Post Sale',
  'Schedule Change',
  'Cancellation',
  'Send to QC',
  'Date Change',
  'Closed Query',
  'Variance',
  'Existing Booking',
  'Callback',
  'Break Monitoring',
  'View All Breaks',
  'Updates Management',
  'Site Bookings',
  'GPM Report',
  'Payslip',
];

export const QUERY_STATUSES = [
  'New Query',
  'Follow Up',
  'Hold',
  'Sold',
  'Post Sale',
  'Schedule Change',
  'Send to QC',
  'Date Change',
  'Variance',
  'Cancellation',
  'Closed Query',
  'Call Back',
];

// Statuses that show partial payment data
export const PARTIAL_PAYMENT_STATUSES = ['Sold', 'Send to QC', 'Variance', 'Date Change', 'Hold', 'Cancellation'];

export const QUERY_SOURCES = [
  'Facebook',
  'Whatsapp',
  'Interact',
  'Lead Form',
  'Call',
  'Repeat',
  'Referral',
  'Website',
  'Email',
  'Instagram',
  'Tawk.to',
];

export const CABINS = ['Economy', 'Premium Economy', 'Business', 'First Class'] as const;

export const ROLE_NAMES = [
  'Admin',
  'Supervisor',
  'Sr. Travel Executive',
  'Travel Executive'
];

export const COMPANY_NAMES = ['Get Set Flight', 'Look Book Ticket', 'Traveloboom'] as const;
export type CompanyName = typeof COMPANY_NAMES[number];

export const COMPANY_EMAIL_SUFFIXES: Record<string, string> = {
  'Get Set Flight': '@getsetflight.com',
  'Look Book Ticket': '@lookbookticket.com',
  'Traveloboom': '@traveloboom.com',
};

export const BREAK_TYPES = [
  'Lunch',
  'Dinner',
  'Tea',
  'On Call',
  'Meeting',
  'Personal',
] as const;
