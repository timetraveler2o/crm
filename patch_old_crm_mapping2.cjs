const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldMapping = `        pnrDetails: JSON.stringify([{
          pnr: row.pnr || row['PNR'] || '',
          ticket: row['TICKET'] || '',
          partial: row['PARTIAL PAYMENT'] || '',
          cost: row['OUR COST'] || '',
          sell: row['SELLING COST'] || '',
          fee: row['FEE'] || '',
          mco: row['MCO'] || row['ISSUANCE'] || '',
          gpm: row['GPM'] || '',
          currency: row['CURRENCY'] || 'CAD',
        }]),`;

const newMapping = `        pnrDetails: JSON.stringify([{
          pnr: row.pnr || row['PNR'] || '',
          ticket: row.ticket || row['TICKET'] || '',
          partial: row.partialPayment || row['PARTIAL PAYMENT'] || '',
          cost: row.cost || row['OUR COST'] || '',
          sell: row.sell || row['SELLING COST'] || '',
          fee: row.fee || row['FEE'] || '',
          mco: row.fee || row['ISSUANCE'] || '',
          gpm: row.gpm || row['GPM'] || '',
          currency: row.currency || row['CURRENCY'] || 'CAD',
        }]),`;

content = content.replace(oldMapping, newMapping);
fs.writeFileSync(path, content);
console.log('Patched oldCRMData mapping 2');
