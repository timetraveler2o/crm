# crm

# TraveloBoom CRM & Operations Management System

A full-featured enterprise Travel & Flights Operations CRM built with React 18, TypeScript, Tailwind CSS, Node.js/Express, Neon PostgreSQL, and Brevo Transactional Email.

## ✨ Core Features

- ✈️ **Bookings Management**: Real-time status workflows (Hold, Sold, Cancelled, Refunded, QC, Pending), search, filters, and client details.
- 💳 **Payment Authorizations**: Electronic signature capture, multi-card authorizations, certificate generation, secure client-facing authorization portal, and role-based permissions (Admin, Super Admin, Manager).
- 🔗 **Real-time Webhook Hub**: High-speed webhook listeners capturing website leads and booking submissions into Neon PostgreSQL.
- 🔔 **Live Notification Center**: Sound-enabled alerts with audio notification (`notification.wav`), live polling, and unread badge counters.
- 📧 **Automated Client Notifications**: Brevo integration sending branded confirmation tickets and hold notices automatically upon status changes.
- 📊 **Agent Productivity & Reporting**: Performance analytics, break monitors, login activity tracking, and IP whitelist security.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Zustand
- **Backend**: Node.js, Express, Drizzle ORM, Neon Serverless PostgreSQL
- **Email Service**: Brevo API
- **Database**: Neon Cloud PostgreSQL

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or pnpm

### 2. Environment Setup
Copy the example environment files and configure your credentials:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### 3. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### 4. Run Development Servers
```bash
# Frontend
npm run dev

# Backend (in separate terminal)
cd backend
npm run dev # or npx tsx src/index.ts
```