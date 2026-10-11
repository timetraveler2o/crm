// ===== DATE FORMATTING UTILITY =====
// Format dates as DD-MM-YYYY across the entire website

/**
 * Format any date string/object to DD-MM-YYYY format
 */
export function formatDateDMY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '—';
  try {
    let d: Date;
    if (typeof dateInput === 'string') {
      // Handle various formats
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // YYYY-MM-DD
        const [y, m, day] = dateInput.split('-');
        return `${day}-${m}-${y}`;
      }
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
        return dateInput; // Already DD-MM-YYYY
      }
      d = new Date(dateInput);
    } else {
      d = dateInput;
    }
    if (isNaN(d.getTime())) return dateInput?.toString() || '—';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateInput?.toString() || '—';
  }
}

/**
 * Format date with time: DD-MM-YYYY, HH:MM AM/PM
 */
export function formatDateTimeDMY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return dateInput?.toString() || '—';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hr = d.getHours();
    const min = d.getMinutes().toString().padStart(2, '0');
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr % 12 || 12;
    return `${day}-${month}-${year}, ${hr12}:${min} ${ampm}`;
  } catch {
    return dateInput?.toString() || '—';
  }
}

// ===== COMPANY BRANDING COLORS =====
export const COMPANY_BRAND_COLORS = {
  fdi: {
    primary: '#0d9488', // teal-600
    secondary: '#14b8a6', // teal-500
    bg: '#f0fdfa', // teal-50
    border: '#99f6e4', // teal-200
    gradient: 'from-teal-600 to-teal-700',
    name: 'Get Set Flight',
  },
  emt: {
    primary: '#dc2626', // red-600 (crimson)
    secondary: '#ef4444', // red-500
    bg: '#fef2f2', // red-50
    border: '#fecaca', // red-200
    gradient: 'from-red-600 to-red-700',
    name: 'Look Book Ticket',
  },
  travelo: {
    primary: '#7c3aed', // violet-600 (indigo purple)
    secondary: '#8b5cf6', // violet-500
    bg: '#f5f3ff', // violet-50
    border: '#ddd6fe', // violet-200
    gradient: 'from-violet-600 to-indigo-700',
    name: 'Traveloboom',
  },
} as const;

export type CompanyBrandId = keyof typeof COMPANY_BRAND_COLORS;

export function getCompanyBrand(companyId: string) {
  return COMPANY_BRAND_COLORS[companyId as CompanyBrandId] || COMPANY_BRAND_COLORS.fdi;
}
