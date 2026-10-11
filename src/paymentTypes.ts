export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'generic';

export interface CardData {
  // Payment Info
  number: string;
  name: string;
  firstName: string;
  lastName: string;
  cardBrand: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  amount: string;
  currency: 'CAD' | 'USD' | 'AUD' | 'INR';
  paymentType: string;
  description: string;
  date: string;
  
  // Signatures & Media
  insuranceSignature: string;
  cardholderSignature: string;
  selfieWithCard: File | null;
  
  // Reservation Info
  reservationNumber: string;
  
  // Billing & Contact Info
  email: string;
  country: string;
  address: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  state: string;
  phoneCode: string;
  phoneNumber: string;
  
  isThirdParty: boolean;
  passengerNames: string;
  
  insuranceDeclined: boolean;
  agreed: boolean;
}

export interface FormStatus {
  submitting: boolean;
  success: boolean;
  error: string | null;
}
