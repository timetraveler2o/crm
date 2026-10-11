/**
 * Smart Data Import Utility
 * Parses CSV/PDF data and arranges it systematically according to CRM structure
 */

import { formatDateDMY } from './utils';

interface ParsedRow {
  [key: string]: string;
}

// Common CRM field mappings for various import formats
const FIELD_ALIASES: Record<string, string[]> = {
  firstName: ['first name', 'firstname', 'first_name', 'fname', 'given name', 'passenger name', 'pax name', 'name', 'client name', 'customer name', 'customer'],
  lastName: ['last name', 'lastname', 'last_name', 'lname', 'surname', 'family name'],
  email: ['email', 'email address', 'e-mail', 'mail', 'email id'],
  phone: ['phone', 'phone number', 'mobile', 'contact', 'tel', 'telephone', 'cell', 'mobile number', 'ctc', 'contact number'],
  origin: ['origin', 'from', 'departure city', 'from city', 'dep city'],
  destination: ['destination', 'to', 'arrival', 'arrival city', 'to city', 'arr city', 'dest'],
  departureDate: ['departure date', 'dep date', 'travel date', 'date of departure', 'outbound date', 'date', 'travel dates', 'dates', 'date of travel'],
  returnDate: ['return date', 'ret date', 'return', 'inbound date', 'date of return'],
  airline: ['airline', 'carrier', 'flight carrier', 'airline name', 'airlines'],
  queryStatus: ['status', 'query status', 'booking status', 'query_status'],
  pnr: ['pnr', 'booking ref', 'booking reference', 'confirmation', 'record locator'],
  passengers: ['passengers', 'pax', 'no of pax', 'travellers', 'number of passengers', 'pax count'],
  totalAmount: ['amount', 'total', 'total amount', 'price', 'fare'],
  cost: ['cost', 'total cost', 'buying', 'buy price', 'our cost'],
  sell: ['sell', 'selling', 'sell price', 'selling price', 'selling cost'],
  gpm: ['gpm', 'gross profit', 'profit', 'margin'],
  querySource: ['source', 'query source', 'lead source', 'channel'],
  queryId: ['query id', 'queryid', 'query_id', 'quer id', 'booking id', 'ref', 'reference', '#', 'sr', 'sr no', 'sno', 's no'],
  company: ['company', 'company name', 'brand'],
  addedBy: ['added by', 'agent', 'created by', 'user', 'assigned to', 'agent name'],
  remarks: ['remarks', 'notes', 'comment', 'comments', 'remark'],
  route: ['route', 'sector', 'flight route', 'sectors'],
  departure: ['departure'],
  partialPayment: ['partial payment', 'partial'],
  currency: ['currency', 'curr'],
  fee: ['fee', 'issuance', 'issuance fee', 'service fee'],
  ticket: ['ticket', 'tickets', 'ticket count'],
};

/**
 * Normalize a header string for matching
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Map imported headers to CRM field names
 */
function mapHeaders(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    
    // Skip empty headers
    if (!normalized) return;
    
    // Direct match first
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(normalized) || field.toLowerCase() === normalized) {
        mapping[index] = field;
        return;
      }
    }
    
    // Exact word match for short headers like '#', 'source', 'date'
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      for (const alias of aliases) {
        if (normalized === alias) {
          mapping[index] = field;
          return;
        }
      }
    }
    
    // Fuzzy match - check if header contains alias
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      for (const alias of aliases) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          mapping[index] = field;
          return;
        }
      }
    }
    
    // Keep original header as fallback
    mapping[index] = header.trim();
  });
  
  return mapping;
}

/**
 * Parse CSV string into structured data
 */
export function parseCSV(csvText: string): { headers: string[]; rows: ParsedRow[]; mappedFields: string[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [], mappedFields: [] };
  
  // Parse CSV considering quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const rawHeaders = parseLine(lines[0]);
  const headerMapping = mapHeaders(rawHeaders);
  const mappedFields = Object.values(headerMapping);
  
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every(v => !v.trim())) continue; // Skip empty rows
    
    const row: ParsedRow = {};
    values.forEach((val, idx) => {
      const field = headerMapping[idx] || `col_${idx}`;
      let value = val.trim().replace(/^"|"$/g, '');
      
      // Auto-format dates to DD-MM-YYYY
      if (['departureDate', 'returnDate', 'created', 'modified'].includes(field)) {
        const formatted = formatDateDMY(value);
        if (formatted !== '—') value = formatted;
      }
      
      row[field] = value;
    });
    
    // Handle route field -> split into origin/destination
    if (row.route && !row.origin) {
      const routeParts = row.route.split(/\s*[-→>]+\s*/);
      if (routeParts.length >= 2) {
        row.origin = routeParts[0].trim();
        row.destination = routeParts[routeParts.length - 1].trim();
      } else {
        row.origin = row.route;
      }
    }
    
    // Auto-detect company if not present
    if (!row.company) {
      const email = row.email || '';
      if (email.includes('lookbookticket')) row.company = 'Look Book Ticket';
      else if (email.includes('traveloboom')) row.company = 'Traveloboom';
      else row.company = 'Get Set Flight';
    }
    
    rows.push(row);
  }
  
  return { headers: mappedFields, rows, mappedFields };
}

/**
 * Validate and clean imported data
 */
export function validateImportData(rows: ParsedRow[]): { valid: ParsedRow[]; errors: string[] } {
  const valid: ParsedRow[] = [];
  const errors: string[] = [];
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 because header is row 1
    const issues: string[] = [];
    
    // Check required fields
    if (!row.firstName && !row.lastName) {
      issues.push('Missing passenger name');
    }
    
    // Validate email format if present
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      issues.push(`Invalid email: ${row.email}`);
    }
    
    // Validate and normalize phone
    if (row.phone) {
      row.phone = row.phone.replace(/[^\d+\-\s()]/g, '');
    }
    
    // Normalize passengers count
    if (row.passengers) {
      const pax = parseInt(row.passengers);
      row.passengers = isNaN(pax) ? '1' : String(pax);
    }
    
    if (issues.length > 0) {
      errors.push(`Row ${rowNum}: ${issues.join(', ')}`);
    }
    
    valid.push(row);
  });
  
  return { valid, errors };
}

/**
 * Generate import summary
 */
export function getImportSummary(rows: ParsedRow[]): {
  totalRows: number;
  companies: Record<string, number>;
  statuses: Record<string, number>;
  hasEmail: number;
  hasPhone: number;
} {
  const companies: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  let hasEmail = 0;
  let hasPhone = 0;
  
  rows.forEach(row => {
    const company = row.company || 'Unknown';
    companies[company] = (companies[company] || 0) + 1;
    
    const status = row.queryStatus || 'Not Set';
    statuses[status] = (statuses[status] || 0) + 1;
    
    if (row.email) hasEmail++;
    if (row.phone) hasPhone++;
  });
  
  return { totalRows: rows.length, companies, statuses, hasEmail, hasPhone };
}
