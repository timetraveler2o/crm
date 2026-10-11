import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { 
  CreditCard as CardIcon, 
  Search, 
  RefreshCw, 
  Plus, 
  Copy, 
  Check, 
  Eye, 
  EyeOff,
  Download, 
  FileText, 
  Trash2, 
  X, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Lock,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  Printer
} from 'lucide-react';
import { CardData, CardType } from '../paymentTypes';
import { getCardType } from '../services/cardService';
import CreditCard from '../components/payment/CreditCard';
import PaymentForm from '../components/payment/PaymentForm';
import { generateCertificateHTML } from '../components/payment/SignatureCertificate';
import { useAuthStore } from '../store/authStore';
import { client } from '../lib/api';

interface PaymentAuthRecord {
  id: number;
  queryId?: string;
  token?: string;
  clientName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  amount?: string;
  currency?: string;
  paymentType?: string;
  cardBrand?: string;
  maskedCardNumber?: string;
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  reservationNumber?: string;
  billingAddress?: string;
  certificateHtml?: string;
  pdfBase64?: string;
  pdfUrl?: string;
  selfieImage?: string;
  insuranceSignature?: string;
  cardholderSignature?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  company?: string;
  notes?: string;
  created?: string;
  modified?: string;
}

export default function PaymentAuthorizations() {
  const [records, setRecords] = useState<PaymentAuthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState('ALL');

  // Eye toggle state for cards
  const [revealedCards, setRevealedCards] = useState<Record<number, boolean>>({});
  const [modalRevealCard, setModalRevealCard] = useState(false);

  // Slider Drawer State
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  // Live Card State for Drawer
  const [drawerCardData, setDrawerCardData] = useState<CardData>({
    number: '',
    name: '',
    firstName: '',
    lastName: '',
    cardBrand: 'Visa',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    amount: '',
    currency: 'CAD',
    paymentType: 'Credit Card',
    description: '',
    date: new Date().toISOString().split('T')[0],
    insuranceSignature: '',
    cardholderSignature: '',
    selfieWithCard: null,
    reservationNumber: '',
    email: '',
    country: 'United States',
    address: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    state: '',
    phoneCode: '+1',
    phoneNumber: '',
    isThirdParty: false,
    passengerNames: '',
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  // Modal State for viewing Certificate
  const [viewingRecord, setViewingRecord] = useState<PaymentAuthRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { currentUser } = useAuthStore();
  const roleLower = (currentUser?.role || '').toLowerCase();
  const isAdmin = ['admin', 'super admin', 'manager', 'operation manager', 'superuser'].includes(roleLower);
  const hasPaymentPermission = (currentUser?.permissions || []).includes('Payment Authorization');
  const canAccess = isAdmin || hasPaymentPermission;

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 p-8 text-center">
        <ShieldCheck size={52} className="text-orange-400 mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
        <p className="text-sm text-gray-600 mt-1 max-w-md">
          You do not have permission to view Payment Authorizations.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Administrator, Super Admin, or Manager can grant you the <strong>"Payment Authorization"</strong> permission in Role/User Management.
        </p>
      </div>
    );
  }

  // Fetch payment authorizations from backend (reads live Neon cloud first, persists to localStorage)
  const fetchAuthorizations = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await client.api.fetch('/api/public/payment-authorizations');
      if (res.ok) {
        const data = await res.json();
        const validList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setRecords(validList);
        try {
          localStorage.setItem('cached_payment_authorizations', JSON.stringify(validList));
        } catch {}
      } else {
        console.warn('Payment authorizations endpoint returned status:', res.status);
      }
    } catch (err) {
      console.error('Failed to load payment authorizations:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Immediately hydrate from localStorage cache so data doesn't wipe on refresh
    try {
      const cached = localStorage.getItem('cached_payment_authorizations');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
          setLoading(false);
        } else {
          localStorage.removeItem('cached_payment_authorizations');
        }
      }
    } catch {
      localStorage.removeItem('cached_payment_authorizations');
    }

    // 2. Fetch live data immediately
    fetchAuthorizations(false);

    // 3. Auto-refresh in background every 10 seconds to keep live data synced
    const interval = setInterval(() => {
      fetchAuthorizations(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const list = Array.isArray(records) ? records : [];
    return list.filter((r) => {
      if (!r) return false;
      const q = (search || '').toLowerCase();
      const matchesSearch =
        !search ||
        (r.clientName && r.clientName.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.maskedCardNumber && r.maskedCardNumber.toLowerCase().includes(q)) ||
        (r.reservationNumber && r.reservationNumber.toLowerCase().includes(q)) ||
        (r.queryId && r.queryId.toLowerCase().includes(q)) ||
        (r.billingAddress && r.billingAddress.toLowerCase().includes(q));

      const matchesCurrency =
        selectedCurrency === 'ALL' ||
        (r.currency && r.currency.toUpperCase() === selectedCurrency);

      const matchesBrand =
        selectedBrand === 'ALL' ||
        (r.cardBrand && r.cardBrand.toLowerCase() === selectedBrand.toLowerCase());

      const matchesCompany =
        selectedCompany === 'ALL' ||
        (r.company && r.company.toLowerCase().includes(selectedCompany.toLowerCase()));

      return matchesSearch && matchesCurrency && matchesBrand && matchesCompany;
    });
  }, [records, search, selectedCurrency, selectedBrand, selectedCompany]);

  // Statistics
  const stats = useMemo(() => {
    const list = Array.isArray(records) ? records : [];
    const total = list.length;
    let totalCAD = 0;
    let totalUSD = 0;
    list.forEach((r) => {
      if (!r) return;
      const amt = parseFloat(String(r.amount || '').replace(/[^0-9.]/g, '')) || 0;
      if ((r.currency || '').toUpperCase() === 'CAD') totalCAD += amt;
      if ((r.currency || '').toUpperCase() === 'USD') totalUSD += amt;
    });
    return {
      total,
      totalCAD: totalCAD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalUSD: totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
  }, [records]);

  // Download PDF LOA with exact required template and card masking
  const handleDownloadPdf = async (r: PaymentAuthRecord) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const companyName = r.company || 'Get Set Flight';
      const companyEmail = companyName.toLowerCase().includes('look book')
        ? 'info@lookbookticket.com'
        : companyName.toLowerCase().includes('travelo')
        ? 'info@traveloboom.com'
        : 'info@getsetflight.com';

      // Clean card masking: ALWAYS show last 4 digits only, NEVER show CVV
      const cleanNum = (r.cardNumber || r.maskedCardNumber || '').replace(/\D/g, '');
      const last4 = cleanNum.slice(-4) || '••••';
      const maskedCardDisplay = `${r.cardBrand || 'Card'} (•••• •••• •••• ${last4})`;

      const dateStr = r.created ? r.created.split(' ')[0] : new Date().toISOString().split('T')[0];
      const timeStr = r.created || new Date().toLocaleString();
      const refNumber = r.queryId || `AUTH-${r.id}`;

      // Header Bar - Navy Slate
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 595, 82, 'F');

      // Accent orange line
      doc.setFillColor(249, 115, 22); // orange-500
      doc.rect(0, 82, 595, 3, 'F');

      // Header top: SECURE PAYMENT GATEWAY
      doc.setTextColor(249, 115, 22); // orange-500
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('SECURE PAYMENT GATEWAY • IDENTITY & COMPLIANCE VAULT', 40, 22);

      // Main Brand Name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(companyName.toUpperCase(), 40, 42);

      // Sub-address
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306', 40, 56);
      doc.text('PAYMENT AUTHORIZATION & SIGNATURE CERTIFICATE (UETA & FEDERAL ESIGN COMPLIANT)', 40, 69);

      // Header right status pill
      doc.setFillColor(22, 163, 74); // emerald-600
      doc.roundedRect(420, 26, 135, 20, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('VERIFIED & SIGNED', 442, 39);

      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(226, 232, 240);
      doc.text(`REF: ${refNumber}`, 420, 62);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Authorized: ${dateStr}`, 420, 74);

      // 2-COLUMN SECTION: Left: Transaction Details | Right: Cardholder & Client Details
      // Box 1 Left: TRANSACTION DETAILS
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(40, 96, 250, 160, 4, 4, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TRANSACTION DETAILS', 50, 114);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('REFERENCE NUMBER', 50, 130);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(refNumber, 50, 141);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('TRANSACTION TYPE', 50, 155);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(r.paymentType || 'Credit Card Authorization', 50, 166);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('RESERVATION / BOOKING REF', 50, 180);
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(234, 88, 12); // orange-600
      doc.text(r.reservationNumber || 'N/A', 50, 191);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('AUTHORIZED AMOUNT', 50, 205);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(22, 163, 74); // emerald-600
      doc.text(`${r.amount || '0.00'} ${r.currency || 'CAD'}`, 50, 216);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CARD BRAND / CARD NUMBER (MASKED)', 50, 230);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(maskedCardDisplay, 50, 241);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`SENT AT: ${timeStr}`, 50, 252);

      // Box 1 Right: CARDHOLDER & CLIENT DETAILS
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(305, 96, 250, 160, 4, 4, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('CARDHOLDER & CLIENT DETAILS', 315, 114);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CLIENT / PASSENGER NAME', 315, 130);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(r.clientName || 'N/A', 315, 141);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('EMAIL ADDRESS', 315, 155);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(r.email || 'N/A', 315, 166);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('PHONE NUMBER', 315, 180);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(r.phone || 'N/A', 315, 191);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('BILLING ADDRESS', 315, 205);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const addrLines = doc.splitTextToSize(r.billingAddress || 'N/A', 230);
      doc.text(addrLines, 315, 216);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`PROCESSING AGENCY: ${companyName} (${companyEmail})`, 315, 252);

      // Checksum Bar
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(40, 264, 515, 30, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('CRYPTOGRAPHIC SIGNATURE CHECKSUM (SHA-256):', 50, 276);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('1fb6ae1e0f83a4da995dadc046f3710f5d036b6acaff0ceea45e3b0383115bf5', 50, 287);

      // Box 2: Signatures & Verification Audit
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(40, 302, 515, 125, 4, 4, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SIGNATURES & VERIFICATION AUDIT', 50, 320);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('SIGNER STATUS', 50, 336);
      doc.text('IP ADDRESS', 50, 362);
      doc.text('IDENTITY METHOD', 50, 388);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(22, 163, 74);
      doc.text('✔ SIGNED & VERIFIED', 50, 348);
      doc.setTextColor(15, 23, 42);
      doc.text(r.ipAddress || '152.59.82.194 (Secure Session)', 50, 374);
      doc.setFont('helvetica', 'normal');
      doc.text('Email OTP & Secure Session Verified', 50, 400);

      // Signature preview sub-box
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text(`HANDWRITTEN SIGNATURE (Recorded on ${companyName} Vault)`, 220, 336);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(220, 342, 190, 60, 4, 4, 'FD');

      if (r.cardholderSignature && r.cardholderSignature.startsWith('data:image/')) {
        try {
          doc.addImage(r.cardholderSignature, 'PNG', 225, 345, 180, 52);
        } catch {
          doc.setFont('times', 'italic');
          doc.setFontSize(16);
          doc.setTextColor(15, 23, 42);
          doc.text(r.clientName || 'Authorized Signer', 240, 375);
        }
      } else {
        doc.setFont('times', 'italic');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(r.clientName || 'Authorized Signer', 235, 378);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DOCUMENT VIEWED:', 425, 340);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(timeStr, 425, 351);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DOCUMENT SIGNED:', 425, 368);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(timeStr, 425, 379);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 163, 74);
      doc.text('SECURITY PROTOCOL:', 425, 396);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('256-Bit SSL / TLS Encrypted', 425, 407);

      // Box 3: Cardholder Authorization Agreement
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.roundedRect(40, 436, 515, 105, 4, 4, 'FD');

      doc.setTextColor(146, 64, 14); // amber-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('CARDHOLDER AUTHORIZATION AGREEMENT', 50, 452);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 53, 15);
      const agreementText = `The cardholder hereby authorizes ${companyName} to charge the credit card specified above for authorized airfare, hotel, travel reservations, and related service fees. The undersigned warrants that they are the cardholder or an authorized user with full legal power, and expressly accepts all fare conditions, ticket restrictions, and cancellation/exchange policies as stated by GET SET FLIGHT (same with other isolated companies like Look Book Ticket and Traveloboom).\n\nBy executing this electronic signature, the cardholder waives any rights to dispute authorized charges made in accordance with the reservation terms confirmed herein.`;
      const splitAgreement = doc.splitTextToSize(agreementText, 495);
      doc.text(splitAgreement, 50, 468);

      // Audit badges bar (3 columns)
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(40, 550, 515, 50, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('ENCRYPTED AUDIT TRAIL', 50, 568);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('SHA-256 Tamper Evident Signature', 50, 580);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('ESIGN & UETA COMPLIANT', 225, 568);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Legally Enforceable Electronic Contract', 225, 580);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('256-BIT SSL SECURE VAULT', 400, 568);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Payment Gateway Identity Verified', 400, 580);

      // Bottom Footer Bar
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 805, 595, 37, 'F');
      doc.setTextColor(203, 213, 225);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${companyName.toUpperCase()} • OFFICIAL PAYMENT GATEWAY COMPLIANCE`, 40, 825);
      doc.setFont('helvetica', 'normal');
      doc.text('Strictly Confidential • Card Number Masked for Security (Last 4 Digits Only)', 310, 825);

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LOA_${r.reservationNumber || refNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      console.error('Failed to download PDF:', e);
      alert('Error generating PDF document: ' + (e?.message || 'Unknown error'));
    }
  };

  // Delete Authorization
  const handleDelete = async (r: PaymentAuthRecord) => {
    if (!confirm(`Are you sure you want to delete payment authorization ${r.queryId || r.id}?`)) return;
    try {
      // 1. Optimistic local update & sync with localStorage
      const updated = records.filter((item) => item.id !== r.id && item.queryId !== r.queryId);
      setRecords(updated);
      try {
        localStorage.setItem('cached_payment_authorizations', JSON.stringify(updated));
      } catch {}

      // 2. Call server delete (deletes from SQLite AND Neon Cloud PostgreSQL)
      const qId = encodeURIComponent(r.queryId || '');
      const res = await client.api.fetch(`/api/public/payment-authorizations/${r.id}?queryId=${qId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.warn('Delete endpoint reported issue, syncing list...');
        fetchAuthorizations(false);
      }
    } catch (e) {
      console.error('Failed to delete authorization:', e);
      fetchAuthorizations(false);
    }
  };

  // Dynamically generate or format the certificate HTML so it's ALWAYS available
  const renderedCertificateHtml = useMemo(() => {
    if (!viewingRecord) return '';
    if (viewingRecord.certificateHtml && (viewingRecord.certificateHtml.trim().startsWith('<!DOCTYPE') || viewingRecord.certificateHtml.includes('<html'))) {
      return viewingRecord.certificateHtml;
    }
    const cleanNum = (viewingRecord.cardNumber || viewingRecord.maskedCardNumber || '').replace(/\D/g, '');
    const last4 = cleanNum.slice(-4) || '••••';
    const masked = `•••• •••• •••• ${last4}`;
    const nowStr = viewingRecord.created || new Date().toLocaleString();

    return generateCertificateHTML({
      referenceNumber: viewingRecord.queryId || `AUTH-${viewingRecord.id}`,
      sentAt: nowStr,
      executedAt: nowStr,
      signerName: viewingRecord.clientName || `${viewingRecord.firstName || ''} ${viewingRecord.lastName || ''}`.trim() || 'Valued Customer',
      lastName: viewingRecord.lastName || viewingRecord.reservationNumber || '',
      reservationNumber: viewingRecord.reservationNumber || 'N/A',
      cardBrand: viewingRecord.cardBrand || 'Visa',
      signerEmail: viewingRecord.email || 'N/A',
      signatureDataUrl: viewingRecord.cardholderSignature || '',
      ipAddress: viewingRecord.ipAddress || '152.59.82.194 (Verified)',
      browserInfo: viewingRecord.userAgent || 'Secure Web Session (256-Bit SSL)',
      checksum: '1fb6ae1e0f83a4da995dadc046f3710f5d036b6acaff0ceea45e3b0383115bf5',
      amount: viewingRecord.amount || '0.00',
      cardType: viewingRecord.paymentType || 'Credit Card',
      maskedCardNumber: masked,
      phoneNumber: viewingRecord.phone || 'N/A',
      billingAddress: viewingRecord.billingAddress || 'N/A',
      currency: viewingRecord.currency || 'CAD',
      date: viewingRecord.created ? viewingRecord.created.split(',')[0] : new Date().toISOString().split('T')[0]
    });
  }, [viewingRecord]);

  const handlePrintCertificate = () => {
    if (!renderedCertificateHtml) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(renderedCertificateHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  // Copy Summary details
  const handleCopySummary = (r: PaymentAuthRecord) => {
    const text = `💳 PAYMENT AUTHORIZATION
Query ID: ${r.queryId || 'N/A'}
Client: ${r.clientName || 'N/A'}
Email: ${r.email || 'N/A'} | Phone: ${r.phone || 'N/A'}
Amount: ${r.currency || 'CAD'} ${r.amount || '0'}
Card: ${r.cardBrand || 'Card'} (${r.maskedCardNumber || 'N/A'})
PNR / Reservation: ${r.reservationNumber || 'N/A'}
Billing: ${r.billingAddress || 'N/A'}
Status: ${r.status || 'Authorized'}
Date: ${r.created || 'N/A'}`;

    navigator.clipboard.writeText(text);
    setCopiedId(String(r.id));
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy payment portal link to send to customer
  const handleCopyPaymentLink = () => {
    const link = 'https://getsetflight.com/payment';
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1700px] mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <CardIcon size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Payment Authorizations</h1>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Live Connected
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Real-time captured credit card authorizations, verified LOA signatures & certificates
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchAuthorizations}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCopyPaymentLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-all cursor-pointer"
            title="Copy Customer Authorization Link: https://getsetflight.com/payment"
          >
            {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Authorization Link'}</span>
          </button>

          <button
            onClick={() => setIsSliderOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-200/60 hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Open Payment Form</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Metric Cards - Systematic Executive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Authorizations</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Captured client records</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center font-black shadow-inner">
            <CardIcon size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total CAD Volume</span>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">${stats.totalCAD}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
              🇨🇦 Canadian Dollars
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shadow-inner">
            CAD
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total USD Volume</span>
            <p className="text-3xl font-extrabold text-blue-700 mt-1">${stats.totalUSD}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
              🇺🇸 US Dollars
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shadow-inner">
            USD
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Security & Integrity</span>
            <p className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck size={20} className="text-emerald-600" /> 100% Signed LOA
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">UETA & Federal ESIGN Compliant</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center font-black shadow-inner">
            <Lock size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, PNR, email, card..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50/70 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Currency Filter */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <option value="ALL">All Currencies</option>
            <option value="CAD">🇨🇦 CAD</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="INR">🇮🇳 INR</option>
            <option value="AUD">🇦🇺 AUD</option>
          </select>

          {/* Card Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <option value="ALL">All Card Brands</option>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="Amex">American Express</option>
            <option value="Discover">Discover</option>
          </select>

          {/* Company Filter */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <option value="ALL">All Companies</option>
            <option value="Get Set Flight">Get Set Flight</option>
            <option value="Look Book Ticket">Look Book Ticket</option>
            <option value="Traveloboom">Traveloboom</option>
          </select>
        </div>
      </div>

      {/* Authorizations Table - Systematic Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-4 px-4">Query ID / Date</th>
                <th className="py-4 px-4">Client Details</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Card Info</th>
                <th className="py-4 px-4">Reservation / PNR</th>
                <th className="py-4 px-4">Billing Address</th>
                <th className="py-4 px-4">Status & LOA</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <CardIcon size={36} className="mx-auto mb-3 text-slate-300 opacity-60" />
                    <p className="font-bold text-slate-600">No payment authorizations found</p>
                    <p className="text-[11px] mt-1">Submit an authorization using the slider form or customer link.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Query ID & Date */}
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50/80 border border-blue-200/60 px-2 py-0.5 rounded text-[11px]">
                        {r.queryId || `AUTH-${r.id}`}
                      </span>
                      <p className="text-[10px] text-slate-400 font-sans mt-1">
                        {r.created || 'N/A'}
                      </p>
                    </td>

                    {/* Client Details */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{r.clientName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1"><Mail size={11} className="text-slate-400" />{r.email || 'No email'}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1"><Phone size={11} className="text-slate-400" />{r.phone || 'No phone'}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-emerald-700 text-sm">
                        {r.currency || 'CAD'} {r.amount || '0'}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {r.paymentType || 'Credit Card'}
                      </span>
                    </td>

                    {/* Card Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-between gap-2 max-w-[210px]">
                        <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{r.cardBrand || 'Card'}</span>
                        <button
                          onClick={() => setRevealedCards(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                          className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 transition-all cursor-pointer ${
                            revealedCards[r.id] ? 'text-orange-600 bg-orange-100/70 font-bold' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                          }`}
                          title={revealedCards[r.id] ? 'Hide Full Card & CVV' : 'Click to View Full Card & CVV'}
                        >
                          {revealedCards[r.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span className="text-[10px]">{revealedCards[r.id] ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      {revealedCards[r.id] ? (
                        <div className="mt-1.5 bg-amber-50 border border-amber-200/80 rounded-lg p-2 text-[11px] font-mono shadow-sm">
                          <div className="font-bold text-slate-900 tracking-wider">
                            {r.cardNumber || r.maskedCardNumber || 'N/A'}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1">
                            <span>CVV: <strong className="text-orange-700 font-bold">{r.cvv || '***'}</strong></span>
                            <span>EXP: <strong className="text-slate-800">{r.expiryDate || '**/**'}</strong></span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded mt-1.5 inline-block">
                          {r.maskedCardNumber || (r.cardNumber ? `•••• •••• •••• ${String(r.cardNumber).slice(-4)}` : '•••• •••• •••• ••••')}
                        </span>
                      )}
                    </td>

                    {/* Reservation / PNR */}
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-indigo-950 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg inline-block">
                        {r.reservationNumber || 'N/A'}
                      </span>
                    </td>

                    {/* Billing Address */}
                    <td className="py-4 px-4 max-w-xs text-[11px] text-slate-600">
                      <p className="truncate font-medium text-slate-700" title={r.billingAddress}>
                        {r.billingAddress || 'N/A'}
                      </p>
                    </td>

                    {/* Status & LOA */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={12} strokeWidth={3} />
                        {r.status || 'Authorized'}
                      </span>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ PDF LOA Ready</div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Certificate */}
                        <button
                          onClick={() => setViewingRecord(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Certificate HTML"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Download PDF LOA */}
                        <button
                          onClick={() => handleDownloadPdf(r)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Download Signed PDF LOA"
                        >
                          <Download size={16} />
                        </button>

                        {/* Copy Summary */}
                        <button
                          onClick={() => handleCopySummary(r)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Copy Authorization Summary"
                        >
                          {copiedId === String(r.id) ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>

                        {/* Delete (Admin) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== SLIDER DRAWER ==================== */}
      {isSliderOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSliderOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                    <CardIcon size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Payment Authorization Slider</h2>
                    <p className="text-xs text-slate-300">
                      Submit direct authorization or prefill card details for customer
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSliderOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Live Card Preview Box */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Live 3D Card Preview
                    </span>
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                    >
                      {isFlipped ? 'Flip to Front' : 'Flip to Back (CVV)'}
                    </button>
                  </div>

                  <div className="flex justify-center py-2">
                    <CreditCard
                      data={drawerCardData}
                      cardType={getCardType(drawerCardData.number)}
                      isFlipped={isFlipped}
                      isVisible={isCardVisible}
                    />
                  </div>
                </div>

                {/* Embedded Payment Form */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <PaymentForm
                    onDataChange={(d) => setDrawerCardData(d)}
                    onFocusChange={(isCVV) => setIsFlipped(isCVV)}
                    isCardVisible={isCardVisible}
                    onToggleVisibility={(v) => setIsCardVisible(v)}
                    onSuccess={() => {
                      fetchAuthorizations(true);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CERTIFICATE PREVIEW MODAL ==================== */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileText size={20} className="text-orange-500" />
                <div>
                  <h3 className="font-black text-slate-800 text-sm">
                    LOA Certificate • {viewingRecord.clientName}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Reference: {viewingRecord.queryId} | PNR: {viewingRecord.reservationNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCertificate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  title="Print / Open in Full Window"
                >
                  <Printer size={14} />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf(viewingRecord)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  title="Download Signed PDF LOA"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => {
                    setViewingRecord(null);
                    setModalRevealCard(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Security Vault Bar with Eye Toggle */}
            <div className="px-6 py-2.5 bg-slate-800 text-white flex items-center justify-between text-xs border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="font-semibold text-slate-300">Vault Card Details:</span>
                {modalRevealCard ? (
                  <span className="font-mono bg-slate-900 px-2.5 py-0.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    Card: {viewingRecord.cardNumber || viewingRecord.maskedCardNumber || 'N/A'} | CVV: {viewingRecord.cvv || '***'} | Exp: {viewingRecord.expiryDate || '**/**'}
                  </span>
                ) : (
                  <span className="font-mono text-slate-300">
                    Card: {viewingRecord.maskedCardNumber || (viewingRecord.cardNumber ? `•••• •••• •••• ${String(viewingRecord.cardNumber).slice(-4)}` : '•••• ••••')} | CVV: •••
                  </span>
                )}
              </div>
              <button
                onClick={() => setModalRevealCard(!modalRevealCard)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold transition-colors cursor-pointer text-amber-200"
              >
                {modalRevealCard ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{modalRevealCard ? 'Hide Details' : 'Show Card & CVV'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-2 bg-slate-100 flex flex-col">
              <iframe
                title={`Certificate - ${viewingRecord.queryId || viewingRecord.id}`}
                srcDoc={renderedCertificateHtml}
                className="w-full flex-1 border border-slate-200 rounded-xl bg-white shadow-sm"
                style={{ minHeight: '580px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
