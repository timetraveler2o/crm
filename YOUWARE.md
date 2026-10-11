# Get Set Flight CRM

## Project Overview

A comprehensive Travel Agency CRM (Customer Relationship Management) system built for Get Set Flight. This system manages bookings, queries, users, roles, attendance, and productivity tracking.

## Project Status

- **Project Type**: React + TypeScript Modern Web Application (CRM)
- **Brand**: Get Set Flight (logo: /https://getsetflight.com/get_set_flight_logo.png)
- **Entry Point**: `src/main.tsx`
- **Build System**: Vite 7.0.0
- **Styling System**: Tailwind CSS 3.4.17
- **State Management**: Zustand with localStorage persistence
- **Routing**: React Router DOM
- **Backend URL**: https://staging--9vdhe1kq8h08dggn11ch.youbase.cloud

## Key Implementations

### Email System (Brevo — May 2026)
- Backend uses **Brevo (Sendinblue) Transactional Email API** (REST POST to `https://api.brevo.com/v3/smtp/email`)
- API key: Set via `BREVO_API_KEY` in environment variables
- SMTP Server: smtp-relay.brevo.com, Port: 587, Login: Configured via environment variables
- Sender: `info@getsetflight.com` (name: "Get Set Flight")
- CC on all client emails: `info@getsetflight.com`, `booking@getsetflight.com`
- OTP/password-reset emails skip CC for privacy (`skipCc: true`)
- Frontend shows both "Send Email" (Brevo) and "Open Email App" (mailto) buttons
- Auto-email on booking status change: Hold, Sold, Post Sale, Send to QC, Cancellation, Follow Up, Date Change
- OTP email for forgot password flow AND admin OTP login flow
- Admin login: validates email → offers Password or OTP method → sends 6-digit OTP via Brevo
- Error shows exact Brevo error message for debugging

### Bookings
- AirportInput custom component: free text accepted, IATA autocomplete from airports.ts
- Filter bar: 12+ filters with active filter count badge and tag chips
- Date range filter included
- Smart export filenames include filter values
- **Filter Persistence (June 2026)**: Bookings filters persist ONLY within bookings flow (edit/add → back). When navigating to Dashboard or any other page, filters auto-clear for fresh start. Uses `crm_bookings_internal_nav` sessionStorage flag to detect internal vs external navigation.
- **Filter Persistence (June 2026)**: All booking filters (status, agent, text fields, sort, page, perPage) are persisted to sessionStorage via `useFilterPersistence` hook. When user applies a filter (Sold, Send to QC, Follow Up, Hold, etc.), edits a booking, and navigates back, filters are fully restored. "Clear All" button also clears persisted state. Dashboard URL-param navigation properly overrides saved filters.

### Productivity Page (Rebuilt July 2026)
- Uses attendanceSheet data when attendanceRecords (check-in/out) is empty
- Standard hours: Present=8h productive+1h break, Half Day=4h+1h break
- **All currency in CAD ($)** — not INR
- **Top Sellers**: Sorted by GPM (highest first), shows GPM earned per user in CAD, sold count, variance, date change, schedule change, send to QC, cancellation — with user filter
- **Break Hours**: Date-by-date breakdown showing daily break hours per agent, shift info, comparison trend graph (LineChart), per-person bar chart, summary table
- **Performance**: Individual performance with user filter, shows productivity %, GPM, revenue (CAD), all sales statuses (Sold, QC, Variance, Date Change, Schedule Change, Cancellation) per user, daily/weekly/monthly filter
- **Daily Log**: Hidden from Agents, Supervisors, Managers, IT — only visible to HR & Admin
- **Overview**: Shows total GPM (CAD), total revenue (CAD), all sales status cards, popular routes with GPM in CAD, productive vs break chart
- **Popular Routes**: Shows all booking routes with GPM and revenue in CAD, expandable details

### Themes
- 27+ themes including modern ones: cyberpunk, nordic, glassmorphism, coral, mint, obsidian, volcano
- Theme picker: 480px wide with 8-column grid

### Query Sources
- Facebook, Whatsapp, Interact, Lead Form, Call, Repeat, Referral, Website, Email, Instagram, Tawk.to


## Features Implemented

### Core Modules
1. **Login Page** — Email/password authentication with demo credentials
2. **Dashboard** — Query status overview cards with counts
3. **Roles Management** — CRUD operations with permission management
4. **Users Management** — Full user CRUD with filters (role, gender, status, date range)
5. **Query Status Management** — Add/edit query statuses
6. **Bookings** — Full booking management with add/edit/search/CSV export
7. **Site Bookings** — Website leads with agent assignment
8. **Attendance** — Login/logout hours, IP tracking, location, device, OS, browser info
9. **Productivity Report** — Individual performance metrics with progress bars
10. **Break Monitor** — Real-time break timer (Lunch, Dinner, Tea, On Call, Meeting, Personal)
11. **Profile** — User profile management
12. **Notifications** — Bell notification dropdown with read/unread, company-filtered (FDI/EMT/Travelo separate)

### Recent Updates (March 2026)
- **DD-MM-YYYY Date Format**: All dates across the website use DD-MM-YYYY format via `formatDateDMY()` utility
- **Pagination**: Default 50 per page with 30/50/100 options + numbered page navigation on Bookings, SiteBookings, Users, Roles, LoginActivity, QueryStatus
- **Select/Bulk Delete**: Bookings and SiteBookings support select all/individual + bulk delete with confirmation
- **Color-coded Exports (May 2026)**: Attendance/leave balance PDF & Excel exports use color-coded cells (green=present/remaining, red=absent/overused, amber=used, blue=allocation). Uses ExcelJS (dynamic import) for professional Excel output with formatted tables, colored headers, percentage coloring. PDF uses jsPDF + autoTable with colored status cells.
- **Attendance Percentage Fix (May 2026)**: % = goodDays / elapsedCalendarDays × 100. Good days = Present + Half Day (full day!) + Week Off + Comp Off + Paid Leave. Bad days = Absent + Non-Paid Leave + Blank/unmarked. Denominator: past months = full calendar days (30/31), current month = days up to today, future months = 0%. Half Day counts as FULL day. Blank unmarked past days reduce %. 100% only if ALL elapsed days are marked with good statuses.
- **Owner Hidden**: Ramit (owner) is hidden from attendance and leave balance views.
- **Staff/Agent Sections**: Attendance grid separates Staff (HR, IT, Manager, Supervisor, etc.) from Agents.
- **Leave Balance Simplified**: Shows only Allocated, Used, Left columns. Manual edit by HR/Admin only saves directly. Completely independent from attendance sheet — never auto-counts from attendance entries. Year selector with prev/next navigation. Monthly auto-allocation (1 PL per month).
- **Leave Balance Fix (May 2026)**: Leave balance is 100% INDEPENDENT from attendance sheet. Default allocated = 0 for new entries. Used count only changes via manual HR/Admin edit. All values (Allocated, Used, Left) are click-to-edit by HR/Admin. Has year + month selector navigation. Future months show 0/0/0 (no data yet). Current and past months show actual DB data.
- **Break Email Fix (May 2026)**: Email sends ONCE per shift when 60-min break limit is reached. Uses emailSentForShiftRef with shift-boundary key. Does NOT reset when break ends — prevents duplicate emails.
- **Logs Fix (May 2026)**: Backend parses logEntry JSON before storing (prevents double-serialization). Frontend normalizeLogEntry() handles both old string entries and new object entries for backward compatibility. Shows proper user names, actions, timestamps.
- **Deleted Logs History (May 2026)**: Updates page now has "Deleted Logs" button (visible to managers/admins). Deleting an update soft-deletes it (isActive=0) instead of hard delete. Deleted updates can be viewed, restored, or permanently removed from the Deleted Logs History modal. Backend endpoints: DELETE soft-deletes, GET /deleted fetches soft-deleted, PUT /:id/restore restores, DELETE /:id/permanent hard-deletes.
- **Document Upload Fix (May 2026)**: AddBooking supports all file types (images, PDFs, docs, xlsx, csv, txt). Images get compressed before upload, documents upload directly via uploadFile(). Preview shows file type icons for non-images. Download button added. Documents open in new tab on click.
- **Brevo Email API (May 2026)**: Migrated from Resend to Brevo. Auto-email on booking status change (Hold, Sold, Post Sale, Send to QC, Cancellation, Follow Up, Date Change). CC to info@getsetflight.com and booking@getsetflight.com.
- **Admin OTP Login (May 2026)**: Admin emails get multi-step login (email → method selection → password OR OTP). OTP sent via Brevo, stored in password_otps table, verified server-side.
- **Password Visibility Toggle (May 2026)**: Eye/EyeOff toggle buttons on all password fields (Login, Profile, Users password change modal).
- **Forgot Password (May 2026)**: OTP sent via Brevo email, stored in password_otps DB table, verified server-side, then password reset.
- **Cell Dropdown Positioning (May 2026)**: First 2 rows show dropdown below cell, rest show above to prevent overflow.
- **Logs (May 2026)**: Shows proper user names (not 'System'), avatar initials, sorted newest first with date/time.
- **Query Status Upload (May 2026)**: Upload/images available for ALL statuses. PNR validation non-blocking (optional).
- **SiteBookings Assigned Rows**: Dark emerald green highlight (bg-emerald-100/70 + border-l-4 border-l-emerald-600) for assigned rows
- **Supervisor Assign**: Supervisors can assign site booking forms to agents
- **Company-separated Notifications**: Notifications are tagged with company and filtered by active company context
- **Company-branded Email Templates**: Separate email templates per company (FDI=teal, EMT=crimson red, Travelo=indigo purple) in `src/lib/emailTemplates.ts`
- **Smart Data Import**: Enhanced CSV import with field mapping, validation, and company auto-detection in `src/lib/dataImport.ts`
- **Call Back Status (June 2026)**: Added "Call Back" to QUERY_STATUSES. When selected in Add Booking form, shows a date picker for callback date. On that date, a reminder popup appears on the main screen for the agent who created the booking. Popup shows client name, phone, email, route, and discussion notes. Dismissed callbacks stored in localStorage per-day. Data stored as `callbackDate` and `callbackRemark` fields on booking.
- **Amadeus Login Credentials (June 2026)**: Users now have an `amadeusCreds` field (JSON array stored as TEXT in DB). Each credential entry contains: Amadeus ID, Username, and Office ID. Multiple credentials per user supported. Admin/Manager/Supervisor/HR/IT can add/edit/remove credentials in the Users modal. ALL users (including Agents) can view and edit their own credentials on the Profile page. Users table shows an "Amadeus" column with badge count + click-to-view modal. Stored in `users.amadeusCreds` column. Type: `AmadeusCredential[]` with fields `{id, amadousId, username, officeId}`.
- **Verification Link Sent Animation (June 2026)**: Enhanced the verification link modal. When "Send Link to Client Email" is clicked, shows an animated success overlay with checkmark that auto-disappears after 5 seconds, revealing the Copy Link and Regenerate Link buttons underneath.
- **Tests & Assessments Module (June 2026)**: Full MCQ test system. Admin/HR/IT can create/edit/delete tests with multiple questions (options A-D, correct answer selection). Agents can take tests (one attempt per test). Scoring: +1 correct, -1 wrong, 0 unanswered. Timer-based tests. Results visible to Admin/HR/IT/Manager/Supervisor. Google Forms-style UI with animations. **Data stored in backend database** (`tests` and `test_results` tables) — visible to ALL users across all devices in real-time with 15-second polling. Backend endpoints: GET/POST/PUT/DELETE `/api/public/tests`, GET/POST/DELETE `/api/public/test-results`. Route: `/tests`. Sidebar icon: ClipboardList.

### Utility Files
- `src/lib/utils.ts` — formatDateDMY(), formatDateTimeDMY(), COMPANY_BRAND_COLORS
- `src/lib/emailTemplates.ts` — Company-specific email HTML templates (FDI=teal, EMT=crimson, Travelo=indigo)
- `src/lib/dataImport.ts` — Smart CSV parsing with field alias mapping
- `src/lib/useFilterPersistence.ts` — Filter persistence hook (sessionStorage). Saves/restores page filter state across navigation. Used on Bookings, SiteBookings, Users, Roles, QueryStatus, LoginActivity.
- `src/components/Pagination.tsx` — Reusable pagination (30/50/100 per page, default 50)

### Navigation Pattern
- **Filter Persistence**: All list pages save filter state to sessionStorage via `useFilterPersistence` hook. Filters are restored on remount.
- **Back Navigation**: Detail/edit pages use `navigate(-1)` with fallback to parent list path. This preserves browser history so going back returns to the filtered list view.
- **URL Params**: Dashboard links to `/bookings?status=X` override sessionStorage filters on the Bookings page.

### Demo Credentials
- Email: rahul@getsetflight.com
- Password: admin123

## Architecture

### Authentication
- Custom email/password auth (not EdgeSpark built-in auth)
- All backend routes use `/api/public/*` prefix to bypass EdgeSpark auth middleware
- Frontend login uses native `fetch()` for the login endpoint only
- All other API calls use `client.api.fetch()` from EdgeSpark client
- Passwords stored as plain text, compared with trim() and case-insensitive email matching
- Frontend trims and lowercases email before sending to backend
- Backend normalizes email to lowercase on user creation
- Backend skips password update if empty string is sent (prevents accidental password clearing)
- Zustand with persist middleware handles session state

### Directory Structure
```
src/
├── App.tsx           — Router setup with protected routes
├── main.tsx          — Entry point
├── index.css         — Tailwind + custom component styles
├── assets/           — Logo and static assets
├── layouts/
│   └── MainLayout.tsx — Sidebar + header layout
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Roles.tsx
│   ├── Users.tsx
│   ├── QueryStatus.tsx
│   ├── Bookings.tsx
│   ├── SiteBookings.tsx
│   ├── Attendance.tsx
│   ├── Productivity.tsx
│   ├── BreakMonitor.tsx
│   └── Profile.tsx
├── store/
│   ├── authStore.ts   — Auth, profile, notifications
│   └── crmStore.ts    — All CRM data (roles, users, bookings, etc.)
└── types/
    └── index.ts       — All TypeScript interfaces & constants
```

### Responsive Design (April 2026)
- **Full cross-device support**: Android, iOS, Windows, macOS, Linux — phones, tablets, desktops
- **PWA meta tags** in index.html: mobile-web-app-capable, viewport-fit=cover, theme-color, format-detection, tap-highlight
- **CSS safe-area insets**: env(safe-area-inset-*) for notched/punch-hole phones
- **Mobile sidebar**: Off-canvas drawer (slides from left) with overlay backdrop, auto-closes on navigation
- **Desktop sidebar**: Collapsible to icon-only mode
- **Bottom sheet pattern**: Theme picker and notifications use full-width bottom sheets on mobile
- **Touch targets**: Minimum 44px on mobile for all interactive elements
- **Input zoom prevention**: Font-size 16px on mobile inputs to prevent iOS auto-zoom
- **Responsive grids**: All pages use breakpoint-aware grids (grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 etc.)
- **Responsive padding**: p-3 sm:p-4 lg:p-6 pattern throughout
- **Responsive text**: Text sizes scale with breakpoints (text-lg sm:text-xl lg:text-2xl etc.)
- **Filter bars**: Use responsive grid layouts instead of hardcoded widths
- **Tables**: Mobile-compact styles with horizontal scrolling
- **Modals**: Full-width on mobile, constrained on desktop
- **Airport dropdown**: Responsive min-width (min-w-[200px] sm:min-w-[320px] max-w-[90vw])
- **Touch optimizations**: -webkit-overflow-scrolling: touch, touch-action: manipulation, disabled tap-highlight
- **Slide animations**: Mobile panels use CSS slide-in-left / slide-out-left keyframes

### QC Notification Sounds (April 2026)
- **3 distinct WAV sounds** in `public/sounds/`: qc-send.wav, qc-accepted.wav, qc-rejected.wav
- **qc-send.wav**: Ascending C5→E5→G5 chime — plays when agent sends booking to QC
- **qc-accepted.wav**: Triumphant C5→E5→G5→C6 — plays when QC is accepted
- **qc-rejected.wav**: Descending G4→E4→C4 — plays when QC is rejected
- **Sound routing**: authStore.addNotification() plays QC sounds based on notification title
- **Polling detection**: crmStore.fetchData() detects QC status changes for real-time cross-user notifications
  - Supervisors get "New QC Submission" when any booking changes to "Send to QC"
  - Agents get "QC Accepted"/"QC Rejected" when their booking's QC status changes
- **Duplicate prevention**: MainLayout.tsx skips generic sound for QC notifications (authStore already handles them)

### Partial Payment System (May 2026)
- **Dashboard Partial Payment Box**: Amber gradient card showing count of bookings with partial payment in Sold, Send to QC, Variance, Date Change statuses (unclearable). Clicking navigates to `/bookings?partialPayment=Yes`.
- **Payment Due Date Calendar**: When partial payment = Yes in AddBooking/Bookings, a date picker appears to set payment due date + outstanding amount field.
- **Auto Payment Reminder Email**: On save with partial payment + due date, automated professional email sent to client (via Brevo) with outstanding balance details. Also sends internal reminder to managers/supervisors.
- **Clear Dues**: Only Admin, Manager, Operation Manager, Supervisor, Super Admin can mark dues as cleared in the booking view modal. Shows cleared-by and date.
- **GPM Report Defaults (May 2026)**: Defaults to "1M" (this month) instead of "All". Removed Hold and Schedule Change from GPM status filters.
- **Backend endpoint**: `/api/public/send-payment-reminder` — sends client payment reminder + manager notification emails.
- **Booking type extended**: `partialPaymentDueDate`, `partialPaymentCleared`, `partialPaymentClearedBy`, `partialPaymentClearedDate`, `partialPaymentAmount` fields added.
- **PARTIAL_PAYMENT_STATUSES**: Exported constant `['Sold', 'Send to QC', 'Variance', 'Date Change']` in types/index.ts.

### Design Decisions
- Dark navy sidebar with Get Set Flight branding
- Clean white content area with card-based layouts
- Gradient accent colors for status cards
- Zustand with persist middleware for data persistence
- All data is demo/mock data stored in localStorage

### Supplier Management (April 2026)
- **SUPPLIERS constant**: `['INTER', 'SKY BIRD', 'OMKAR', 'RIYA (IXC)', 'CVFR', 'MONDEE']` in `src/types/index.ts`
- **PnrDetail.supplier**: string field added to PnrDetail interface
- **Role-based visibility**: Only Supervisor/Manager/Admin/Operation Manager can see and edit the Supplier dropdown in PNR tables. Agents see all other PNR columns (PNR, Name, Airline, Sell, Cost, Fee, MCO, GPM) but NOT Supplier.
- **Agent-restricted Query Statuses**: Agents CANNOT see 'Sold', 'Date Change', 'Variance', 'Cancellation', 'Post Sale', 'Schedule Change' in the Query Status dropdown. Only Admin, Supervisor, Manager, HR can select these statuses.
- **QC Flow**: When supervisor opens a "Send to QC" booking, they get a full editable PNR table with Supplier dropdown. Accept saves all changes (including supplier) and moves to Sold. Reject moves to Follow Up.
- **Bookings Filter**: Supplier dropdown filter appears for supervisors+ only, filters bookings by supplier assigned in PNR details
- **Exports**: Both CSV and PDF include SUPPLIER column for all export roles
- **View Modal**: PNR details table in view modal shows Supplier column only for supervisors+

### Client Verification System (June 2026)
- **Database Table**: `client_verifications` stores verification records per booking
- **DB Columns Added**: `selfie_image_back` (for back selfie), `rejection_reason` (for reject reason)
- **Backend API Endpoints**:
  - POST `/api/public/verification/generate` - Generate unique verification link
  - GET `/api/public/verification/:token` - Validate token (public)
  - POST `/api/public/verification/:token/submit` - Submit verification (public, multi-photo)
  - POST `/api/public/verification/ai-check` - AI image analysis (NVIDIA + Gemini)
  - GET `/api/public/verification/booking/:bookingId` - Get records (internal)
  - PUT `/api/public/verification/:id/review` - Approve/reject (sends email to client automatically)
  - PUT `/api/public/verification/:token/ai-result` - Store AI analysis
  - POST `/api/public/verification/:id/send-email` - Manually send verification status email to client
  - POST `/api/public/verification/send-link-email` - Send verification link via email to client
- **Multi-Photo Logic**:
  - Selfie with Card: 2 photos (front selfie + back selfie with card visible)
  - Passport: 2 photos (front page + back page)
  - Driving License: 1 photo
  - Green Card: 1 photo
  - ID Proof/National ID: 1 photo
- **Camera Fix**: Resolved black screen by waiting for 'playing' event, using `onLoadedMetadata`/`onPlaying` callbacks, proper stream cleanup, fallback constraints
- **AI Integration**: NVIDIA AI (deepfake/AI-generated detection) + Gemini AI (OCR, face+card detection, document validation)
- **Public Verification Page**: `/verify/:token` route (outside auth), camera-only capture (no file uploads)
- **CRM Integration**:
  - Green "Verify" button in Booking View Modal header
  - Eye button for verification records with full image preview + download
  - "Send Link to Client Email" button in verification link popup
  - "Send Status Email to Client" button in verification view modal
  - Verification data shown in edit form (AddBooking) with image preview + download
- **Role-Based Access**: Only Admin, Super Admin, Manager, Operation Manager, Supervisor can approve/reject verifications
- **Email Notifications** (via Brevo):
  - On verification submit: Email notification to team (info@ + booking@)
  - On approve: Professional approval email to client with CC to team
  - On reject: Professional rejection email to client with resubmission instructions + CC to team
  - Manual send: "Send Status Email" button allows re-sending status emails
  - Verification link email: Professional email with link + instructions sent to client
- **CRM Notifications**: All verification events (approve, reject, send email, generate link) trigger CRM notifications visible in bell icon
- **Security**: API keys stored server-side only, client sees only "Trusted Secure" branding
- **Guide Images**: `/selfie-guide.png`, `/document-guide.png` show clients how to take photos


### Payslip / Payroll Module (June 2026)
- **Route**: `/payslip` - accessible to all roles
- **Nav Item**: "Salary Slip" with Receipt icon in sidebar
- **Companies**: FDI, EMT, Travelo with logos and shared address (WorldTech Square 3rd Floor, Sector 83, Punjab 160055)
- **Features (June 2026 Major Update)**:
  - Dashboard: stats filtered by selected company, recent payslips table, activity log
  - Generate Payslip: employee search FILTERED BY COMPANY, template selector, all fields (Employee Name, ID, Designation, Department, Bank Name, Bank A/C Number, Joining Date, Pay Period, Pay Date, Total Working Days, Paid Days, LOP Days, Leaves, Paid Leaves)
  - Earnings: Basic, HRA, Special Allowance, Medical Allowance, Leave Encashment, Incentives, Reimbursements (all editable, add/remove)
  - Deductions: TDS, EPF, Professional Tax (₹200 default), Conveyance Charges, Advance, Loan, Recovery (all editable, add/remove)
  - Preview: Professional payslip layout matching ClearTax-style reference (dark header, grid employee info, salary details box, earnings/deductions split table, net pay box, amount in words, notes)
  - PDF Download: jsPDF professional PDF with company logo, proper alignment, all employee/bank details, salary breakdown, INR formatting
  - Email: Brevo API email with professional HTML template, salary details table, company branding
  - Agent Requests: agents can request 1/2/3/6 month payslips, HR/IT/Admin approve/reject with sound notifications
  - Salary Templates: 5 presets (Sales Executive, Sr. Sales Executive, Manager, IT Staff, HR Staff) with all earnings/deductions
  - Bulk Generation: select company-filtered employees + template → PREVIEW ALL with edit option → then Confirm & Generate
  - Experience Letter: Professional editable certificate with company letterhead, proper content, reference number, PDF download
  - Reports: CSV export of payslips and requests with all fields
  - Attendance Integration: auto-fills Total Working Days (calendar days - Sundays), Paid Days (Present + Half Day×0.5 + Paid Leave + Comp Off), LOP Days, Leaves, Paid Leaves from attendance sheet
  - Company Switching: Changing company dropdown resets employee selection and filters employee list by company
  - Notification Sounds: plays sound on payslip generate, download, email send, and request
  - Editable Generated Slips: View → Edit button → modify fields → Save
  - Delete payslips from dashboard
  - Currency Fix: Uses Intl.NumberFormat('en-IN') for proper ₹ formatting (no glitches)
- **Access**: HR, IT, Admin can generate/download/email/edit/delete; Agents can only view/request (no download)
- **Data Persistence**: Payslip requests now stored in database (`payslip_requests` table) with live sync every 10s. Payslips/templates/experience letters still localStorage.
- **Partial Payment Statuses**: Updated to include 'Hold' and 'Cancellation' alongside Sold, Send to QC, Variance, Date Change (Dashboard box updated)

### July 2026 Updates
- **Salary Slip Logos**: FDI → `/gsf-logo.png` (from getsetflight.com), EMT → `/lbt-logo.png` (from lookbookticket.com), Travelo → `/tbm-logo.png` (from Traveloboom.com)
- **Payslip Requests DB**: Migrated from localStorage to database table `payslip_requests` with API endpoints (GET/POST/PUT/DELETE at `/api/public/payslip-requests`). Auto-polls every 10s for live sync. Admin/HR/IT see all requests in real-time.
- **QC Reviewer Tracking**: `qcReviewedBy` and `qcReviewedAt` columns added to bookings table. When supervisor accepts/rejects QC, their name/timestamp is saved. Shows in View Details and Edit form with green badge.
- **Partial Payment Recovery**: View details now shows Received amount + Outstanding calculation. Admins can update received amount. CSV/PDF exports include per-agent recovery summary with totals (Agent, Total Selling, Total Received, Total To Recover, Grand Total).

- **Partial Payment Recovery**: View details now shows Received amount + Outstanding calculation. Admins can update received amount. CSV/PDF exports include per-agent recovery summary with totals (Agent, Total Selling, Total Received, Total To Recover, Grand Total).

### July 2026 Updates (Batch 2)
- **Partial Payment Columns in Table**: Added "Received" and "Pending" columns in the bookings list table view. Shows real-time received amount and auto-calculated pending amount.
- **Partial Payment Edit Form**: Both Bookings inline edit and AddBooking edit form now show Total Amount, Received Amount, Amount Pending (auto-calculated), and Due Date fields when Partial Payment = Yes.
- **receivedAmount Field**: Added `receivedAmount` to Booking interface. Stored in DB. Backward-compatible with old `partialPaymentReceived` field.
- **Attendance - Inactive Users Hidden**: Attendance sheet and Leave Balance now ALWAYS filter out inactive users (regardless of admin role). Only active users appear in attendance grid.
- **Users Default Filter**: Users page now defaults to showing ALL users (Active + Inactive). Inactive users appear with faded/red-tinted rows. Admins can filter by status. Inactive users cannot login but all their data (attendance, bookings) remains intact and shows when re-activated.
- **Payslip Requests Visibility**: Fixed payslip request visibility - `isAdmin` now includes 'supervisor' role. HR, Admin, IT, Manager, Supervisor all see incoming agent requests in real-time (10s polling).
- **Suppliers Extended**: Added 'Airline Website', 'Goibibo', 'Easemytrip', 'MMT Website', 'Fixed Departures' to SUPPLIERS array.
- **QC Modification History**: `modificationHistory` column added to bookings table (JSON array). Tracks every QC accept/reject with: action, who modified, when, old status, new status, PNR changes, notes. Also tracks regular booking edits (status changes, payment amount changes).
- **Modification History Display**: View Details modal shows full modification history with color-coded entries (green=accepted, red=rejected, indigo=modified), timestamps, change details.
- **Build**: Sourcemaps disabled to prevent OOM in sandbox builds.
- **Payslip Email Fix (July 2026)**: Salary slip email now routes through backend `/api/public/send-email` endpoint (Brevo server-side) instead of direct frontend Brevo API call (which failed due to CORS). Professional HTML email template with full salary breakdown, earnings/deductions tables, company branding and logo.
- **Payslip PDF Logo (July 2026)**: Company logo now loaded dynamically and embedded in salary slip PDF downloads (top-right corner). Uses canvas to convert image to base64 for jsPDF. Gracefully degrades if logo fails to load.
