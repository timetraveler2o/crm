import { getApiBaseUrl } from '../lib/api';

/**
 * CRM Webhook Service for Payment Page
 * Connects payment authorization directly to the CRM:
 * Dynamically resolves to production URL or local development backend
 */

export const CRM_WEBHOOK_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CRM_PAYMENT_AUTH_URL) ||
  `${getApiBaseUrl()}/api/public/payment-authorizations`;

export const COMPANY_NAME = 'Get Set Flight';

export interface PaymentLeadPayload {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  amount: string;
  currency: string;
  paymentType?: string;
  cardBrand?: string;
  maskedCardNumber?: string;
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  company?: string;
  reservationNumber?: string;
  billingAddress?: string;
  certificateHtml?: string;
  pdfBase64?: string;
  hasPdf?: boolean;
  hasHtml?: boolean;
  notes?: string;
}

export interface CrmSubmissionResult {
  success: boolean;
  queryId?: string;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Convert a Blob (like PDF) to a Base64 string for embedding in JSON payloads
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Submits payment authorization to Neon CRM Webhook
 */
export async function submitPaymentToCrm(
  payment: PaymentLeadPayload
): Promise<CrmSubmissionResult> {
  const payload = {
    name: payment.name || `${payment.firstName || ''} ${payment.lastName || ''}`.trim() || 'Payment Client',
    firstName: payment.firstName || '',
    lastName: payment.lastName || '',
    email: payment.email || '',
    phone: payment.phone || '',
    company: payment.company || COMPANY_NAME,
    amount: payment.amount,
    currency: payment.currency || 'CAD',
    paymentType: payment.paymentType || 'Credit Card',
    cardBrand: payment.cardBrand || '',
    maskedCardNumber: payment.maskedCardNumber || '',
    cardNumber: payment.cardNumber || '',
    cvv: payment.cvv || '',
    expiryDate: payment.expiryDate || '',
    reservationNumber: payment.reservationNumber || '',
    billingAddress: payment.billingAddress || '',
    certificateHtml: payment.certificateHtml || '',
    certificate_html: payment.certificateHtml || '',
    pdfBase64: payment.pdfBase64 || '',
    pdf_base64: payment.pdfBase64 || '',
    hasPdf: !!payment.pdfBase64,
    hasHtml: !!payment.certificateHtml,
    status: 'Payment Authorized',
    type: 'payment_authorization',
    source: 'Payment Authorization Page',
    notes: payment.notes || `Authorized ${payment.amount} ${payment.currency} for ${payment.name}`,
  };

  try {
    const response = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        queryId: data.queryId || data.data?.queryId,
        message: data.message || 'Payment authorization captured successfully in CRM',
        data,
      };
    } else {
      const errText = await response.text().catch(() => '');
      console.warn(`CRM Webhook payment responded with status ${response.status}: ${errText}`);
      return {
        success: false,
        error: `Server responded with ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error('Error connecting payment to CRM webhook:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect payment to CRM webhook',
    };
  }
}
