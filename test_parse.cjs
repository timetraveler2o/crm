const fs = require('fs');
const csvText = fs.readFileSync('public/old-crm-data.csv', 'utf8');

const FIELD_ALIASES = {
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
  queryId: ['query id', 'queryid', 'query_id', 'booking id', 'ref', 'reference', '#', 'sr', 'sr no', 'sno', 's no', 'quer id'],
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

function normalizeHeader(header) {
  return header.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

function mapHeaders(headers) {
  const mapping = {};
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (!normalized) return;
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(normalized) || field.toLowerCase() === normalized) {
        mapping[index] = field;
        return;
      }
    }
    mapping[index] = header.trim();
  });
  return mapping;
}

const lines = csvText.split(/\r?\n/).filter(line => line.trim());
const parseLine = (line) => {
  const result = [];
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
console.log('Headers:', rawHeaders);
console.log('Mapping:', headerMapping);

const rows = [];
for (let i = 1; i < 3; i++) {
  const values = parseLine(lines[i]);
  const row = {};
  rawHeaders.forEach((header, index) => {
    const mappedField = headerMapping[index] || header;
    row[mappedField] = values[index] || '';
    row[header] = values[index] || ''; // Keep original header as fallback
  });
  rows.push(row);
}
console.log('Rows:', rows);
