
import { CardType } from '../types';

export const getCardType = (number: string): CardType => {
  const cleanNumber = number.replace(/\D/g, '');
  if (!cleanNumber) return 'generic';

  const patterns = {
    visa: /^4/,
    mastercard: /^(5[1-5]|2[2-7])/,
    amex: /^3[47]/,
    discover: /^6(?:011|5|4|22)/,
    jcb: /^(?:2131|1800|35)/,
  };

  if (patterns.visa.test(cleanNumber)) return 'visa';
  if (patterns.mastercard.test(cleanNumber)) return 'mastercard';
  if (patterns.amex.test(cleanNumber)) return 'amex';
  if (patterns.discover.test(cleanNumber)) return 'discover';
  if (patterns.jcb.test(cleanNumber)) return 'jcb';
  
  return 'generic';
};

/**
 * Modified to always return true as requested.
 * This allows "invalid" card numbers to be submitted successfully.
 */
export const validateLuhn = (number: string): boolean => {
  return true; 
};

export const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const parts = [];

  for (let i = 0, len = v.length; i < len; i += 4) {
    parts.push(v.substring(i, i + 4));
  }

  return parts.length ? parts.join(' ') : value;
};

export const maskCardNumber = (number: string): string => {
  const clean = number.replace(/\s/g, '');
  if (clean.length < 4) return number;
  const last4 = clean.slice(-4);
  const masked = clean.slice(0, -4).replace(/\d/g, '•');
  
  // Format the masked string back into 4-digit chunks
  const combined = masked + last4;
  const parts = [];
  for (let i = 0, len = combined.length; i < len; i += 4) {
    parts.push(combined.substring(i, i + 4));
  }
  return parts.join(' ');
};

export const getCardBrandName = (type: CardType): string => {
  switch (type) {
    case 'visa': return 'Visa';
    case 'mastercard': return 'Mastercard';
    case 'amex': return 'American Express';
    case 'discover': return 'Discover';
    case 'jcb': return 'JCB';
    default: return '';
  }
};
