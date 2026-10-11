const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldMapping = `        origin: (row.origin || row['SECTORS'] || '').split('-')[0]?.trim() || '',
        destination: (row.origin || row['SECTORS'] || '').split('-')[1]?.trim() || '',`;

const newMapping = `        origin: row.origin || row['ORIGIN'] || (row['SECTORS'] || '').split('-')[0]?.trim() || '',
        destination: row.destination || row['DESTINATION'] || (row['SECTORS'] || '').split('-')[1]?.trim() || '',`;

content = content.replace(oldMapping, newMapping);
fs.writeFileSync(path, content);
console.log('Patched oldCRMData mapping');
