const fs = require('fs');

// Replicate the parseCSV logic
function normalizeHeader(header) {
  return header.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

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
  queryId: ['query id', 'queryid', 'query_id', 'booking id', 'ref', 'reference', '#', 'sr', 'sr no', 'sno', 's no'],
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
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      for (const alias of aliases) {
        if (normalized === alias) { mapping[index] = field; return; }
      }
    }
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      for (const alias of aliases) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          mapping[index] = field; return;
        }
      }
    }
    mapping[index] = header.trim();
  });
  return mapping;
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

const text = fs.readFileSync('public/old-crm-data.csv', 'utf8');
const lines = text.split(/\r?\n/).filter(l => l.trim());
console.log('Total lines:', lines.length);

const rawHeaders = parseLine(lines[0]);
console.log('Headers:', rawHeaders);
console.log('Normalized headers:', rawHeaders.map(normalizeHeader));

const headerMapping = mapHeaders(rawHeaders);
console.log('Header mapping:', headerMapping);

// Parse all rows and check for issues
let errorCount = 0;
let sellValues = { empty: 0, zero: 0, nonZero: 0 };
for (let i = 1; i < lines.length; i++) {
  try {
    const values = parseLine(lines[i]);
    if (values.every(v => !v.trim())) continue;
    const row = {};
    values.forEach((val, idx) => {
      const field = headerMapping[idx] || 'col_' + idx;
      row[field] = val.trim().replace(/^"|"$/g, '');
    });
    const sell = row.sell || '';
    if (!sell) sellValues.empty++;
    else if (sell === '0') sellValues.zero++;
    else sellValues.nonZero++;
  } catch (err) {
    errorCount++;
    if (errorCount <= 3) console.log('Error at line', i+1, ':', err.message);
  }
}
console.log('Parse errors:', errorCount);
console.log('Sell values:', sellValues);
