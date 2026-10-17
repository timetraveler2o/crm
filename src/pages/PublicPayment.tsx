import React, { useState, useEffect } from 'react';
import { 
  CreditCard as CardIcon, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Download, 
  Check, 
  Eye, 
  EyeOff, 
  ChevronRight,
  Printer
} from 'lucide-react';
import CreditCard from '../components/payment/CreditCard';
import PaymentForm from '../components/payment/PaymentForm';
import { CardData, CardType } from '../paymentTypes';
import { getCardType } from '../services/cardService';
import logo from '../assets/logo.png';

export default function PublicPayment() {
  const [submittedQueryId, setSubmittedQueryId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Live Card State for real-time visual reflection
  const [cardData, setCardData] = useState<CardData>({
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

  // Pre-fill from URL query parameters (e.g. ?queryId=...&name=...&amount=...&currency=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const name = sp.get('name') || sp.get('clientName') || '';
      const email = sp.get('email') || '';
      const phone = sp.get('phone') || '';
      const amount = sp.get('amount') || '';
      const currency = sp.get('currency') || '';
      const reservation = sp.get('reservationNumber') || sp.get('pnr') || sp.get('queryId') || '';

      if (name || email || phone || amount || reservation) {
        const parts = name.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        setCardData(prev => ({
          ...prev,
          name: name || prev.name,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: email || prev.email,
          phoneNumber: phone || prev.phoneNumber,
          amount: amount || prev.amount,
          currency: (currency && ['CAD', 'USD', 'INR', 'AUD'].includes(currency.toUpperCase())) ? currency.toUpperCase() : prev.currency,
          reservationNumber: reservation || prev.reservationNumber,
        }));
      }
    }
  }, []);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  const cardType: CardType = getCardType(cardData.number);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Company Branding */}
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://getsetflight.com/get_set_flight_logo.png'; }}
              alt="Get Set Flight Logo" 
              className="h-10 w-auto max-w-[140px] object-contain drop-shadow" 
            />
            <div className="border-l border-slate-700 pl-3">
              <p className="text-xs font-black tracking-wider text-slate-200 uppercase">
                Get Set Flight
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Official Cardholder Payment Authorization
              </p>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-bold text-[11px]">
              <ShieldCheck size={14} /> 256-Bit SSL Encrypted
            </span>
            <span className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-full font-medium text-[11px]">
              <Lock size={12} /> UETA & ESIGN Compliant
            </span>
          </div>

        </div>
      </header>

      {/* Hero Notice Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 py-2.5 px-4 text-center text-xs font-bold text-white shadow-md">
        🔒 Official Secure Payment Gateway · Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306
      </div>

      {/* Main Form Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        
        {/* Intro Card */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 inline-block mb-3">
            Credit Card Authorization Form
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Complete Your Flight Booking Authorization
          </h1>
          <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
            Please review and fill out your payment details below to authorize your ticketing. This form is encrypted and securely verified by Get Set Flight.
          </p>
        </div>

        {/* Dynamic Interactive Card Display */}
        <div className="mb-10 flex flex-col items-center">
          <div className="w-full max-w-md transform hover:scale-[1.02] transition-transform duration-300">
            <CreditCard 
              cardData={cardData} 
              isFlipped={isFlipped} 
              cardType={cardType} 
              isCardVisible={isCardVisible} 
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Live interactive card preview • Card details are securely encrypted
          </p>
        </div>

        {/* The Formal Payment Form Component */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 text-slate-800">
          <PaymentForm 
            onDataChange={(d) => setCardData(d)}
            onFocusChange={(flipped) => setIsFlipped(flipped)}
            isCardVisible={isCardVisible}
            onToggleVisibility={(v) => setIsCardVisible(v)}
            onSuccess={(queryId) => {
              setSubmittedQueryId(queryId || 'GSF-AUTH-SUCCESS');
              setIsSuccess(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>

        {/* Corporate Legal Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-400">
            Get Set Flight · Official Payment Authorization Portal
          </p>
          <p>
            Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306
          </p>
          <p className="text-[11px] text-slate-600">
            Compliant with UETA (Uniform Electronic Transactions Act) & Federal ESIGN Regulations.
          </p>
        </footer>

      </main>

    </div>
  );
}
