/**
 * Company-specific email templates for FDI, EMT, and Travelo
 * Each company has its own branding, colors, and signature
 */

import { COMPANY_BRAND_COLORS, type CompanyBrandId } from './utils';

interface BookingData {
  firstName?: string;
  lastName?: string;
  email?: string;
  queryId?: string;
  origin?: string;
  destination?: string;
  queryStatus?: string;
  departureDate?: string;
  returnDate?: string;
  airline?: string;
  totalAmount?: string | number;
  pnr?: string;
  passengers?: number;
  [key: string]: any;
}

// ===== COMPANY TEMPLATE CONFIGS =====
const COMPANY_TEMPLATES = {
  fdi: {
    companyName: 'Get Set Flight',
    tagline: 'Your Trusted Flight Booking Partner',
    website: 'www.getsetflight.com',
    email: 'info@getsetflight.com',
    phone: '+91-XXXXXXXXXX',
    primaryColor: '#0d9488',   // teal-600
    secondaryColor: '#14b8a6', // teal-500
    bgColor: '#f0fdfa',        // teal-50
    borderColor: '#99f6e4',    // teal-200
    logoUrl: 'https://getsetflight.com/get_set_flight_logo.png',
  },
  emt: {
    companyName: 'Look Book Ticket',
    tagline: 'Fast, Easy & Stress-Free Bookings',
    website: 'www.lookbookticket.com',
    email: 'info@lookbookticket.com',
    phone: '1-888-343-0072',
    primaryColor: '#dc2626',   // red-600 (crimson)
    secondaryColor: '#ef4444', // red-500
    bgColor: '#fef2f2',        // red-50
    borderColor: '#fecaca',    // red-200
    logoUrl: 'https://lookbookticket.com/logo.png',
  },
  travelo: {
    companyName: 'Traveloboom',
    tagline: 'Book Cheap Flights Worldwide',
    website: 'www.traveloboom.com',
    email: 'info@traveloboom.com',
    phone: '+91-XXXXXXXXXX',
    primaryColor: '#7c3aed',   // violet-600 (indigo purple)
    secondaryColor: '#8b5cf6', // violet-500
    bgColor: '#f5f3ff',        // violet-50
    borderColor: '#ddd6fe',    // violet-200
    logoUrl: 'https://traveloboom.com/traveloboom_logo_v4.png',
  },
} as const;

/**
 * Build branded HTML email template per company
 */
export function buildEmailHTML(companyId: CompanyBrandId, booking: BookingData): string {
  const t = COMPANY_TEMPLATES[companyId] || COMPANY_TEMPLATES.fdi;
  const name = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Valued Customer';
  const from = booking.origin || '—';
  const to = booking.destination || '—';
  const status = booking.queryStatus || '—';
  const queryId = booking.queryId || '—';
  const pnr = booking.pnr || '—';
  const dep = booking.departureDate || '—';
  const ret = booking.returnDate || '—';
  const airline = booking.airline || '—';
  const pax = booking.passengers || 1;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${t.primaryColor},${t.secondaryColor});padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">${t.companyName}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">${t.tagline}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#374151;margin:0 0 16px;">Dear <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#4b5563;margin:0 0 20px;line-height:1.6;">
        Here is an update regarding your booking. Please find the details below:
      </p>

      <!-- Booking Details Table -->
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid ${t.borderColor};margin-bottom:20px;">
        <tr style="background:${t.bgColor};">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};width:40%;">Query ID</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:700;border-bottom:1px solid ${t.borderColor};">${queryId}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Route</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid ${t.borderColor};">✈ ${from} → ${to}</td>
        </tr>
        <tr style="background:${t.bgColor};">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Status</td>
          <td style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderColor};"><span style="background:${t.primaryColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${status}</span></td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Airline</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid ${t.borderColor};">${airline}</td>
        </tr>
        <tr style="background:${t.bgColor};">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">PNR</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:700;border-bottom:1px solid ${t.borderColor};">${pnr}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Departure</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid ${t.borderColor};">${dep}</td>
        </tr>
        <tr style="background:${t.bgColor};">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Return</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid ${t.borderColor};">${ret}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;">Passengers</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;">${pax}</td>
        </tr>
      </table>

      <p style="font-size:14px;color:#4b5563;margin:0 0 6px;line-height:1.6;">
        If you have any questions, feel free to reach out to us.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:${t.bgColor};padding:20px 32px;border-top:1px solid ${t.borderColor};text-align:center;">
      <p style="font-size:13px;color:${t.primaryColor};font-weight:700;margin:0 0 4px;">${t.companyName}</p>
      <p style="font-size:12px;color:#6b7280;margin:0 0 2px;">${t.website} | ${t.email}</p>
      <p style="font-size:11px;color:#9ca3af;margin:8px 0 0;">This is an automated notification. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build mailto link per company
 */
export function buildCompanyMailtoLink(companyId: CompanyBrandId, booking: BookingData): string {
  const t = COMPANY_TEMPLATES[companyId] || COMPANY_TEMPLATES.fdi;
  const name = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Customer';
  const from = booking.origin || '';
  const to = booking.destination || '';
  const status = booking.queryStatus || '';
  const queryId = booking.queryId || '';

  const subject = `${t.companyName} — Your Flight ${from} → ${to} — Update`;
  const body = `Dear ${name},\n\nRegarding your booking (${queryId}) — ${from} → ${to}.\n\nStatus: ${status}\n\nBest Regards,\n${t.companyName} Team\n${t.website}\n${t.email}`;

  return `mailto:${booking.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Get email payload to send to backend with company info
 */
export function getEmailPayload(companyId: CompanyBrandId, booking: BookingData) {
  const t = COMPANY_TEMPLATES[companyId] || COMPANY_TEMPLATES.fdi;
  return {
    to: booking.email,
    bookingData: booking,
    company: companyId,
    companyName: t.companyName,
    template: {
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      bgColor: t.bgColor,
      borderColor: t.borderColor,
      companyName: t.companyName,
      tagline: t.tagline,
      website: t.website,
      contactEmail: t.email,
      logoUrl: t.logoUrl,
    },
    html: buildEmailHTML(companyId, booking),
  };
}

/**
 * Build professional payment reminder email for clients with outstanding dues
 */
export function buildPaymentReminderHTML(companyId: CompanyBrandId, booking: BookingData & { dueDate?: string; outstandingAmount?: string }): string {
  const t = COMPANY_TEMPLATES[companyId] || COMPANY_TEMPLATES.fdi;
  const name = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Valued Customer';
  const queryId = booking.queryId || '—';
  const from = booking.origin || '—';
  const to = booking.destination || '—';
  const dueDate = booking.dueDate || '—';
  const amount = booking.outstandingAmount || 'pending';
  const dep = booking.departureDate || '—';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${t.primaryColor},${t.secondaryColor});padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">${t.companyName}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">${t.tagline}</p>
    </div>

    <!-- Alert Banner -->
    <div style="background:#fef2f2;border-bottom:2px solid #fecaca;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:15px;color:#dc2626;font-weight:700;">⚠️ Payment Reminder — Outstanding Balance Due</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#374151;margin:0 0 16px;">Dear <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#4b5563;margin:0 0 20px;line-height:1.6;">
        We hope this email finds you well. This is a friendly reminder that you have an <strong>outstanding balance</strong> on your booking. We kindly request you to clear your pending dues at your earliest convenience.
      </p>

      <!-- Booking Details Table -->
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid ${t.borderColor};margin-bottom:20px;">
        <tr style="background:${t.bgColor};">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};width:40%;">Booking Reference</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:700;border-bottom:1px solid ${t.borderColor};">${queryId}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Route</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid ${t.borderColor};">✈ ${from} → ${to}</td>
        </tr>
        <tr style="background:${t.bgColor};">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Travel Date</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid ${t.borderColor};">${dep}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid ${t.borderColor};">Outstanding Amount</td>
          <td style="padding:10px 14px;font-size:14px;color:#dc2626;font-weight:700;border-bottom:1px solid ${t.borderColor};">${amount}</td>
        </tr>
        <tr style="background:#fef2f2;">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;">Payment Due Date</td>
          <td style="padding:10px 14px;font-size:14px;color:#dc2626;font-weight:700;">${dueDate}</td>
        </tr>
      </table>

      <div style="background:linear-gradient(135deg,#fef9c3,#fde68a);border:1px solid #fbbf24;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">⏰ Please ensure payment is made by the due date to avoid any service interruption.</p>
      </div>

      <p style="font-size:14px;color:#4b5563;margin:0 0 16px;line-height:1.6;">
        If you have already made the payment, please disregard this email. For any questions or assistance with payment options, please don't hesitate to contact us.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="mailto:${t.email}?subject=Payment%20for%20Booking%20${queryId}" style="background:${t.primaryColor};color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">Contact Us About Payment</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:${t.bgColor};padding:20px 32px;border-top:1px solid ${t.borderColor};text-align:center;">
      <p style="font-size:13px;color:${t.primaryColor};font-weight:700;margin:0 0 4px;">${t.companyName}</p>
      <p style="font-size:12px;color:#6b7280;margin:0 0 2px;">${t.website} | ${t.email}</p>
      <p style="font-size:11px;color:#9ca3af;margin:8px 0 0;">This is an automated payment reminder. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build manager/supervisor payment reminder notification email
 */
export function buildManagerPaymentReminderHTML(companyId: CompanyBrandId, booking: BookingData & { dueDate?: string; outstandingAmount?: string; agentName?: string }): string {
  const t = COMPANY_TEMPLATES[companyId] || COMPANY_TEMPLATES.fdi;
  const clientName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Client';
  const queryId = booking.queryId || '—';
  const from = booking.origin || '—';
  const to = booking.destination || '—';
  const dueDate = booking.dueDate || '—';
  const amount = booking.outstandingAmount || 'pending';
  const agentName = booking.agentName || '—';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">⚠️ Payment Collection Required</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">${t.companyName} — Internal Reminder</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:14px;color:#374151;margin:0 0 16px;">A client has an outstanding payment that requires attention:</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
        <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Client</td><td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:700;border-bottom:1px solid #e5e7eb;">${clientName}</td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Booking ID</td><td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;">${queryId}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Route</td><td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;">✈ ${from} → ${to}</td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Agent</td><td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;">${agentName}</td></tr>
        <tr style="background:#fef2f2;"><td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Outstanding Amount</td><td style="padding:10px 14px;font-size:14px;color:#dc2626;font-weight:700;border-bottom:1px solid #e5e7eb;">${amount}</td></tr>
        <tr style="background:#fef2f2;"><td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:600;">Due Date</td><td style="padding:10px 14px;font-size:14px;color:#dc2626;font-weight:700;">${dueDate}</td></tr>
      </table>
      <p style="font-size:13px;color:#4b5563;margin:0;line-height:1.6;">Please follow up with the client to collect the outstanding payment. An automated reminder has also been sent to the client's email.</p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">Internal notification — ${t.companyName}</p>
    </div>
  </div>
</body>
</html>`;
}

export { COMPANY_TEMPLATES };
