import React, { useState, useEffect, useRef } from 'react';
import { CardData, FormStatus } from '../../paymentTypes';
import { getCardType, formatCardNumber, getCardBrandName, maskCardNumber } from '../../services/cardService';
import { AlertCircle, CheckCircle2, Loader2, Send, ShieldAlert, Eye, EyeOff, CreditCard as CardIcon, User, MapPin, Pen, Smartphone } from 'lucide-react';
import SignaturePad from './SignaturePad';
import { buildCertificateData, generateCertificateHTML } from './SignatureCertificate';
import { generateCertificatePDF } from './PDFGenerator';
import { submitPaymentToCrm, blobToBase64 } from '../../services/crmWebhook';

interface PaymentFormProps {
  onDataChange: (data: CardData) => void;
  onFocusChange: (isCVV: boolean) => void;
  isCardVisible: boolean;
  onToggleVisibility: (visible: boolean) => void;
  onSuccess?: (queryId?: string) => void;
}

const USA_STATES = [
  { value: "AK", label: "AK - ALASKA" }, { value: "AL", label: "AL - ALABAMA" },
  { value: "AR", label: "AR - ARKANSAS" }, { value: "AZ", label: "AZ - ARIZONA" },
  { value: "CA", label: "CA - CALIFORNIA" }, { value: "CO", label: "CO - COLORADO" },
  { value: "CT", label: "CT - CONNECTICUT" }, { value: "DC", label: "DC - DISTRICT OF COLUMBIA" },
  { value: "DE", label: "DE - DELAWARE" }, { value: "FL", label: "FL - FLORIDA" },
  { value: "GA", label: "GA - GEORGIA" }, { value: "HI", label: "HI - HAWAII" },
  { value: "IA", label: "IA - IOWA" }, { value: "ID", label: "ID - IDAHO" },
  { value: "IL", label: "IL - ILLINOIS" }, { value: "IN", label: "IN - INDIANA" },
  { value: "KS", label: "KS - KANSAS" }, { value: "KY", label: "KY - KENTUCKY" },
  { value: "LA", label: "LA - LOUISIANA" }, { value: "MA", label: "MA - MASSACHUSETTS" },
  { value: "MD", label: "MD - MARYLAND" }, { value: "ME", label: "ME - MAINE" },
  { value: "MI", label: "MI - MICHIGAN" }, { value: "MN", label: "MN - MINNESOTA" },
  { value: "MO", label: "MO - MISSOURI" }, { value: "MS", label: "MS - MISSISSIPPI" },
  { value: "MT", label: "MT - MONTANA" }, { value: "NC", label: "NC - NORTH CAROLINA" },
  { value: "ND", label: "ND - NORTH DAKOTA" }, { value: "NE", label: "NE - NEBRASKA" },
  { value: "NH", label: "NH - NEW HAMPSHIRE" }, { value: "NJ", label: "NJ - NEW JERSEY" },
  { value: "NM", label: "NM - NEW MEXICO" }, { value: "NV", label: "NV - NEVADA" },
  { value: "NY", label: "NY - NEW YORK" }, { value: "OH", label: "OH - OHIO" },
  { value: "OK", label: "OK - OKLAHOMA" }, { value: "OR", label: "OR - OREGON" },
  { value: "PA", label: "PA - PENNSYLVANIA" }, { value: "RI", label: "RI - RHODE ISLAND" },
  { value: "SC", label: "SC - SOUTH CAROLINA" }, { value: "SD", label: "SD - SOUTH DAKOTA" },
  { value: "TN", label: "TN - TENNESSEE" }, { value: "TX", label: "TX - TEXAS" },
  { value: "UT", label: "UT - UTAH" }, { value: "VA", label: "VA - VIRGINIA" },
  { value: "VT", label: "VT - VERMONT" }, { value: "WA", label: "WA - WASHINGTON" },
  { value: "WI", label: "WI - WISCONSIN" }, { value: "WV", label: "WV - WEST VIRGINIA" },
  { value: "WY", label: "WY - WYOMING" }
];

const CURRENCIES = [
  { code: 'CAD', flag: '🇨🇦' },
  { code: 'USD', flag: '🇺🇸' },
  { code: 'INR', flag: '🇮🇳' },
  { code: 'AUD', flag: '🇦🇺' },
];

const INTERNATIONAL_CARDS = [
  { id: 'visa', name: 'Visa', icon: 'https://static.vecteezy.com/system/resources/thumbnails/020/975/570/small/visa-logo-visa-icon-transparent-free-png.png' },
  { id: 'mastercard', name: 'Mastercard', icon: 'https://img.icons8.com/color/48/000000/mastercard.png' },
  { id: 'amex', name: 'Amex', icon: 'https://logos-world.net/wp-content/uploads/2020/11/American-Express-Logo.png' },
  { id: 'discover', name: 'Discover', icon: 'https://1000logos.net/wp-content/uploads/2020/11/Discover-Logo.jpg' },
];

function makeE164Valid(phone: string): string {
  let clean = phone.replace(/[^\d+]/g, '');
  if (!clean.startsWith('+')) {
    clean = '+' + clean;
  }
  // Format NANP (+1 followed by 10 digits) exchange/area codes if they start with invalid 0 or 1
  if (clean.startsWith('+1') && clean.length === 12) {
    if (clean[5] === '0' || clean[5] === '1') {
      clean = clean.substring(0, 5) + '2' + clean.substring(6);
    }
    if (clean[2] === '0' || clean[2] === '1') {
      clean = clean.substring(0, 2) + '2' + clean.substring(3);
    }
  }
  return clean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  onDataChange, 
  onFocusChange, 
  isCardVisible, 
  onToggleVisibility,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CardData>({
    number: '', name: '', firstName: '', lastName: '', cardBrand: 'Visa',
    expiryMonth: '', expiryYear: '', cvv: '',
    amount: '', currency: 'CAD', paymentType: 'Credit Card',
    description: '', date: new Date().toISOString().split('T')[0],
    insuranceSignature: '', cardholderSignature: '', selfieWithCard: null,
    reservationNumber: '',
    email: '', country: 'United States',
    address: '', addressLine2: '', postalCode: '', city: '', state: '',
    phoneCode: '+1', phoneNumber: '',
    isThirdParty: false, passengerNames: '',
    insuranceDeclined: false, agreed: false,
  });

  const [isFocusedOnNumber, setIsFocusedOnNumber] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ submitting: false, success: false, error: null });
  const [crmQueryId, setCrmQueryId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CardData, string>>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://getsetflight.com';
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(currentUrl);

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  // Pre-fill fields from URL query parameters (e.g. from CRM generated customer link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const name = sp.get('name') || sp.get('clientName') || '';
      const email = sp.get('email') || '';
      const phone = sp.get('phone') || '';
      const amount = sp.get('amount') || '';
      const currency = sp.get('currency') || '';
      const reservation = sp.get('reservationNumber') || sp.get('pnr') || sp.get('queryId') || '';
      const address = sp.get('address') || '';

      if (name || email || phone || amount || reservation) {
        setFormData(prev => {
          const parts = name.trim().split(' ');
          const firstName = parts[0] || prev.firstName;
          const lastName = parts.slice(1).join(' ') || prev.lastName;
          return {
            ...prev,
            name: name || prev.name,
            firstName: firstName || prev.firstName,
            lastName: lastName || prev.lastName,
            email: email || prev.email,
            phoneNumber: phone || prev.phoneNumber,
            amount: amount || prev.amount,
            currency: (currency && ['CAD', 'USD', 'INR', 'AUD'].includes(currency.toUpperCase())) ? currency.toUpperCase() : prev.currency,
            reservationNumber: reservation || prev.reservationNumber,
            address: address || prev.address,
          };
        });
      }
    }
  }, []);

  const brandName = getCardBrandName(getCardType(formData.number));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean | File | null = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'number') {
      finalValue = formatCardNumber(value);
    } else if (name === 'cvv') {
      finalValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (name === 'phoneNumber') {
      finalValue = value.replace(/\D/g, '').substring(0, 10);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name as keyof CardData]) {
      setErrors(prev => { const next = { ...prev }; delete next[name as keyof CardData]; return next; });
    }
    if (status.error) setStatus(prev => ({ ...prev, error: null }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CardData, string>> = {};
    if (!formData.name.trim()) e.name = 'Required';
    if (!formData.firstName.trim()) e.firstName = 'Full name required';
    if (!formData.lastName.trim()) e.lastName = 'Reservation number required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Valid email required';
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) e.phoneNumber = 'Valid phone required';
    
    if (formData.isThirdParty && !formData.passengerNames.trim()) {
      e.passengerNames = 'Passenger name(s) required for third-party authorization';
    }

    if (!formData.address.trim()) e.address = 'Required';
    if (!formData.city.trim()) e.city = 'Required';
    if (!formData.state) e.state = 'Required';
    if (!formData.postalCode.trim()) e.postalCode = 'Required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = 'Required';
    
    const rawCardNumber = formData.number.replace(/\s/g, '');
    if (!rawCardNumber) e.number = 'Card number required';
    else if (rawCardNumber.length < 15) e.number = 'Card number must be at least 15 digits';
    else if (rawCardNumber.length > 16) e.number = 'Card number must be at most 16 digits';
    if (!formData.expiryMonth || !formData.expiryYear) e.expiryMonth = 'Required';
    if (!formData.cvv || formData.cvv.length < 3) e.cvv = 'Required';
    if (!formData.cardholderSignature) e.cardholderSignature = 'Signature required' as any;
    if (!formData.agreed) e.agreed = 'Agreement required';
    
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const fieldNames: Record<string, string> = {
        firstName: 'Full Name',
        lastName: 'Reservation Number',
        email: 'Email Address',
        phoneNumber: 'Phone Number',
        name: 'Name on Card',
        number: 'Card Number',
        expiryMonth: 'Expiry Date',
        cvv: 'CVV',
        amount: 'Authorization Amount',
        address: 'Street Address',
        city: 'City',
        state: 'State / Province',
        postalCode: 'Zip Code',
        cardholderSignature: 'Signature',
        agreed: 'Agreement Checkbox'
      };
      
      const errorList = Object.entries(e)
        .map(([field, msg]) => {
          const friendlyName = fieldNames[field] || field;
          return `• ${friendlyName}: ${msg}`;
        })
        .join('\n');

      setStatus(prev => ({ 
        ...prev, 
        error: `Please correct the following errors before submitting:\n${errorList}` 
      }));
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus({ submitting: true, success: false, error: null });
    try {
      const certData = await buildCertificateData(formData);
      const certificateHTML = generateCertificateHTML(certData);
      
      let pdfBlob: Blob | null = null;
      let pdfBase64 = '';
      try {
        pdfBlob = await generateCertificatePDF(certData);
        if (pdfBlob) {
          pdfBase64 = await blobToBase64(pdfBlob);
        }
      } catch (pdfErr) {
        console.error('Failed to generate PDF:', pdfErr);
      }
        
      const submitData = new FormData();
      submitData.append('fi-sender-firstName', formData.firstName);
      submitData.append('fi-sender-lastName', formData.lastName);
      submitData.append('fi-sender-fullName', formData.firstName);
      submitData.append('fi-sender-email', formData.email);
      submitData.append('fi-text-clientPhone', formData.phoneNumber);
      submitData.append('fi-select-cardBrand', formData.cardBrand);
      submitData.append('fi-text-reservationNumber', formData.lastName);
      submitData.append('fi-sender-address', formData.address);
      if (formData.addressLine2) {
        submitData.append('fi-sender-address2', formData.addressLine2);
      }
      submitData.append('fi-sender-city', formData.city);
      submitData.append('fi-sender-postcode', formData.postalCode);
      
      // ISO country mapping
      let isoCountry = 'US';
      const cLower = formData.country.toLowerCase();
      if (cLower.includes('united states') || cLower === 'us') isoCountry = 'US';
      else if (cLower.includes('canada') || cLower === 'ca') isoCountry = 'CA';
      else if (cLower.includes('india') || cLower === 'in') isoCountry = 'IN';
      else if (cLower.includes('australia') || cLower === 'au') isoCountry = 'AU';
      else if (cLower.includes('united kingdom') || cLower === 'gb' || cLower === 'uk') isoCountry = 'GB';
      submitData.append('fi-sender-country', isoCountry);

      submitData.append('fi-text-cardholderName', formData.name);
      submitData.append('fi-text-maskedCardNumber', maskCardNumber(formData.number));
      submitData.append('fi-text-expiryDate', `${formData.expiryMonth}/${formData.expiryYear}`);
      submitData.append('fi-text-verificationCode', formData.cvv);
      submitData.append('fi-number-amount', formData.amount);
      submitData.append('fi-text-currency', formData.currency);
      submitData.append('fi-text-paymentType', formData.paymentType);
      submitData.append('fi-date-authorizedDate', formData.date);

      const htmlBlob = new Blob([certificateHTML], { type: 'text/html' });
      submitData.append('fi-file-certificate', htmlBlob, 'certificate.html');

      if (pdfBlob) {
        submitData.append('fi-file-loa', pdfBlob, 'loa.pdf');
      }

      // 1. Submit to Neon CRM Payment Authorization
      const crmPromise = submitPaymentToCrm({
        name: formData.name || `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: `${formData.phoneCode} ${formData.phoneNumber}`.trim(),
        amount: formData.amount,
        currency: formData.currency,
        paymentType: formData.paymentType,
        cardBrand: formData.cardBrand,
        maskedCardNumber: maskCardNumber(formData.number),
        cardNumber: formData.number,
        cvv: formData.cvv,
        expiryDate: `${formData.expiryMonth}/${formData.expiryYear}`,
        reservationNumber: formData.reservationNumber || formData.lastName,
        billingAddress: `${formData.address}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}, ${formData.city}, ${formData.state} ${formData.postalCode}, ${formData.country}`,
        certificateHtml: certificateHTML,
        pdfBase64: pdfBase64,
        hasPdf: !!pdfBlob,
        hasHtml: !!certificateHTML,
      });

      // 2. Submit to FormInit backup
      const forminitPromise = fetch('https://forminit.com/f/f1j2iit4ml9', { 
        method: 'POST', 
        headers: { 'Accept': 'application/json' },
        body: submitData 
      }).catch(err => console.warn('FormInit backup error:', err));

      const [crmResult] = await Promise.allSettled([crmPromise, forminitPromise]);

      if (crmResult.status === 'fulfilled' && crmResult.value.queryId) {
        setCrmQueryId(crmResult.value.queryId);
        onSuccess?.(crmResult.value.queryId);
      } else {
        onSuccess?.();
      }

      setStatus({ submitting: false, success: true, error: null });
    } catch (err: any) {
      console.error('Submission error:', err);
      setStatus({ submitting: false, success: false, error: `Transmission failed: ${err.message || 'Check connection'}` });
    }
  };

  const inputCls = (name: keyof CardData) => `
    block w-full px-4 py-2 bg-white border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-300
    ${errors[name] ? 'border-red-400 ring-2 ring-red-100 animate-shake' : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-50'}
  `;

  const sectionHead = (icon: React.ReactNode, title: string, subtitle?: string) => (
    <div className="flex items-center gap-3 pb-1.5 border-b border-slate-100 mb-3">
      <div 
        className="p-2 rounded-lg text-white shadow-sm shadow-orange-200/50 flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.1em]">{title}</h3>
        {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  if (status.success) {
    return (
      <div className="p-8 md:p-16 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100 border-2 border-emerald-200">
          <CheckCircle2 className="text-emerald-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Authorization Complete</h2>
        <p className="text-slate-500 mt-4 leading-relaxed font-medium text-base max-w-md mx-auto">
          Your authorization for <span className="font-bold text-slate-700">{formData.firstName} {formData.lastName}</span> has been securely processed by Get Set Flight.
        </p>

        {crmQueryId && (
          <div className="mt-5 mb-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 inline-block shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">CRM Query Reference</span>
            <span className="text-lg font-black font-mono text-blue-900 tracking-wider select-all">{crmQueryId}</span>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button 
            onClick={() => {
              setStatus({ submitting: false, success: false, error: null });
              setCrmQueryId(null);
            }} 
            className="px-10 py-4 text-white rounded-full font-black shadow-xl shadow-orange-200/50 hover:shadow-2xl hover:scale-105 transition-all uppercase tracking-widest text-xs cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
          >
            Start New Authorization
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      
      {/* Mobile QR Fill Callout */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-indigo-100 shrink-0">
          <img src={qrUrl} alt="Scan to fill on mobile" className="w-20 h-20" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h3 className="text-indigo-900 font-black text-sm uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mb-1">
            <Smartphone size={16} className="text-indigo-500" /> Fill on Mobile
          </h3>
          <p className="text-indigo-700/80 text-xs font-medium leading-relaxed max-w-sm">
            Scan this QR code with your phone camera to open and complete this secure authorization form directly on your mobile device.
          </p>
        </div>
      </div>

      <div ref={errorRef}>
        {status.error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-800 text-sm font-bold flex items-start gap-3 shadow-sm mb-6">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-red-500" />
            <p className="whitespace-pre-line leading-relaxed">{status.error}</p>
          </div>
        )}
      </div>

      {/* --- 1. Client Information --- */}
      <section className="space-y-3.5">
        {sectionHead(<User size={16} />, 'Client Information', 'Enter your personal details')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Full Name *</label>
            <input name="firstName" placeholder="John Doe" value={formData.firstName} onChange={handleChange} className={inputCls('firstName')} />
            {errors.firstName && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.firstName}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Reservation Number *</label>
            <input name="lastName" placeholder="Reservation or PNR Number" value={formData.lastName} onChange={handleChange} className={inputCls('lastName')} />
            {errors.lastName && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.lastName}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Email Address *</label>
            <input name="email" type="email" placeholder="example@example.com" value={formData.email} onChange={handleChange} className={inputCls('email')} />
            {errors.email && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.email}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Phone Number *</label>
            <input name="phoneNumber" placeholder="(000) 000-0000" value={formData.phoneNumber} onChange={handleChange} className={inputCls('phoneNumber')} maxLength={10} />
            <p className="text-[9px] text-slate-400 mt-1 font-medium">Format: (000) 000-0000</p>
            {errors.phoneNumber && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.phoneNumber}</p>}
          </div>
        </div>

        </section>

      {/* --- 2. Payment Configuration --- */}
      <section className="space-y-3.5">
        {sectionHead(<CardIcon size={16} />, 'Payment Details', 'Select your payment method and enter card details')}
        
        {/* Card brand icons */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Accepted:</span>
          {INTERNATIONAL_CARDS.map(card => (
            <img key={card.id} src={card.icon} alt={card.name} className="h-8 object-contain opacity-70 hover:opacity-100 hover:scale-110 transition-all cursor-pointer" title={card.name} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Payment Type</label>
            <select name="paymentType" value={formData.paymentType} onChange={handleChange} className={`${inputCls('paymentType')} cursor-pointer`}>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Card Brand *</label>
            <select name="cardBrand" value={formData.cardBrand} onChange={handleChange} className={`${inputCls('cardBrand')} cursor-pointer`}>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Amex">Amex</option>
              <option value="Discover">Discover</option>
            </select>
          </div>
          <div>
             <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Currency *</label>
             <select name="currency" value={formData.currency} onChange={handleChange} className={`${inputCls('currency')} cursor-pointer`}>
               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
             </select>
          </div>
        </div>

        {/* Card input area */}
        <div className="p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5"
             style={{ background: 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)' }}>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Name on Card *</label>
            <input name="name" type="text" placeholder="JOHN DOE" value={formData.name} onChange={handleChange} className={`${inputCls('name')} uppercase`} />
            {errors.name && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.name}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Card Number *</label>
               <button type="button" onClick={() => onToggleVisibility(!isCardVisible)} className="text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-1.5 text-[10px] font-bold">
                 {isCardVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                 <span>{isCardVisible ? 'HIDE' : 'SHOW'}</span>
               </button>
            </div>
            <div className="relative">
              <input name="number" type="text" placeholder="0000 0000 0000 0000" value={isFocusedOnNumber || isCardVisible ? formData.number : (formData.number ? maskCardNumber(formData.number) : '')} onChange={handleChange} onFocus={() => setIsFocusedOnNumber(true)} onBlur={() => setIsFocusedOnNumber(false)} className={`${inputCls('number')} pr-28 tracking-[0.2em] font-mono text-base`} maxLength={19} />
              {brandName && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 shadow-sm">{brandName}</span>}
            </div>
            {errors.number && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Expiry Date *</label>
              <div className="flex gap-2">
                <select name="expiryMonth" value={formData.expiryMonth} onChange={handleChange} className={`${inputCls('expiryMonth')} cursor-pointer`}>
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select name="expiryYear" value={formData.expiryYear} onChange={handleChange} className={`${inputCls('expiryYear')} cursor-pointer`}>
                  <option value="">YY</option>
                  {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() + i).toString()).map(y => <option key={y} value={y}>{y.slice(-2)}</option>)}
                </select>
              </div>
              {errors.expiryMonth && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.expiryMonth}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">CVV *</label>
              <input name="cvv" placeholder="•••" value={formData.cvv} onChange={handleChange} onFocus={() => onFocusChange(true)} onBlur={() => onFocusChange(false)} className={`${inputCls('cvv')} text-center tracking-[0.3em] font-black`} maxLength={4} />
              {errors.cvv && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.cvv}</p>}
            </div>
          </div>

          <div>
             <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Authorization Amount *</label>
             <div className="flex gap-3">
               <input name="amount" placeholder="0.00" value={formData.amount} onChange={handleChange} className={`${inputCls('amount')} flex-1 text-lg font-black`} />
               <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 flex items-center text-sm font-black text-slate-600 shadow-sm">
                 {formData.currency}
               </div>
             </div>
             {errors.amount && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.amount}</p>}
          </div>
        </div>
      </section>

      {/* --- 3. Address --- */}
      <section className="space-y-3.5">
        {sectionHead(<MapPin size={16} />, 'Billing Address', 'Enter the address linked to your card')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Street Address *</label>
            <input name="address" placeholder="123 Main Street" value={formData.address} onChange={handleChange} className={inputCls('address')} />
            {errors.address && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.address}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Street Address Line 2</label>
            <input name="addressLine2" placeholder="Apt, Suite, Unit (optional)" value={formData.addressLine2} onChange={handleChange} className={inputCls('addressLine2')} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">City *</label>
            <input name="city" placeholder="New York" value={formData.city} onChange={handleChange} className={inputCls('city')} />
            {errors.city && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.city}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">State / Province *</label>
            <input name="state" placeholder="e.g. NY or Ontario" value={formData.state} onChange={handleChange} className={`${inputCls('state')}`} />
            {errors.state && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.state}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Zip Code *</label>
            <input name="postalCode" placeholder="10001" value={formData.postalCode} onChange={handleChange} className={inputCls('postalCode')} />
            {errors.postalCode && <p className="text-red-500 text-[10px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle size={10}/>{errors.postalCode}</p>}
          </div>
        </div>
      </section>

      {/* --- 4. Authorization & Signature --- */}
      <section className="space-y-3.5">
        {sectionHead(<Pen size={16} />, 'Authorization & Signature', 'Sign to authorize the charge')}
        
        {/* Authorization Checkbox */}
        <div className={`p-3 rounded-xl border-2 transition-all \${formData.agreed ? 'bg-orange-50/50 border-orange-300' : errors.agreed ? 'bg-red-50 border-red-300 animate-shake' : 'bg-slate-50 border-slate-200'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange} className="w-5 h-5 rounded text-orange-500 border-slate-300 focus:ring-orange-400 mt-0.5 cursor-pointer" />
            <span className="text-xs font-bold text-slate-700 leading-relaxed">
              I certify that I am the authorized cardholder or have explicit permission to use this payment method. I authorize <span className="font-black text-orange-600">GET SET FLIGHT</span> to process the specified amount. I verify that the reservation code provided corresponds to my booking.
            </span>
          </label>
          {errors.agreed && <p className="text-red-500 text-[10px] mt-2 font-bold flex items-center gap-1 ml-8"><AlertCircle size={10}/>{errors.agreed}</p>}
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 font-medium leading-relaxed">
          I hereby authorize <span className="font-black text-slate-900">Get Set Flight</span> or the travel supplier that my booking is through to charge my credit card for travel reservation and confirm that the information for the credit card and billing address is complete and accurate.
        </div>

        <SignaturePad label="Cardholder Signature" onSignatureChange={(url) => setFormData(p => ({ ...p, cardholderSignature: url }))} />
        {errors.cardholderSignature && <p className="text-red-500 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10}/>{(errors as any).cardholderSignature}</p>}

        
      </section>

      {/* --- 5. Submit Button --- */}
      <div className="pt-2">
        <button type="submit" disabled={status.submitting} className="w-full py-5 rounded-2xl font-black text-lg uppercase tracking-[0.15em] text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)' }}>
          {status.submitting ? <Loader2 className="animate-spin" size={24} /> : (
            <>
              <span className="relative z-10">{status.submitting ? 'Processing...' : 'Authorize Payment'}</span>
              <Send size={22} className="group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </button>
        <div className="mt-5 flex items-center justify-center gap-3 text-slate-400">
           <div className="h-px bg-slate-200 flex-1"></div>
           <span className="text-[9px] font-black tracking-[0.15em] uppercase whitespace-nowrap">🔒 End-to-End Encrypted • Get Set Flight</span>
           <div className="h-px bg-slate-200 flex-1"></div>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;