const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update mapping
const oldMapping = `        pnrDetails: JSON.stringify([{
          pnr: row.pnr || row['PNR'] || '',
          ticket: row['TICKET'] || '',
          partial: row['PARTIAL PAYMENT'] || '',
          cost: row['OUR COST'] || '',
          sell: row['SELLING COST'] || '',
          fee: row['ISSUANCE'] || '',
          gpm: row['GPM'] || '',
          currency: row['CURRENCY'] || 'CAD',
        }]),`;

const newMapping = `        pnrDetails: JSON.stringify([{
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

content = content.replace(oldMapping, newMapping);

// Update table headers
const oldHeaders = `                  <th className="table-header">Cost</th>
                  <th className="table-header">Sell</th>
                  <th className="table-header">GPM</th>`;

const newHeaders = `                  <th className="table-header">Cost</th>
                  <th className="table-header">Sell</th>
                  <th className="table-header">MCO</th>
                  <th className="table-header">GPM</th>`;

content = content.replace(oldHeaders, newHeaders);

// Update table cells
const oldCells = `                      <td className="table-cell text-xs">{p.cost || '-'}</td>
                      <td className="table-cell text-xs">{p.sell || '-'}</td>
                      <td className="table-cell text-xs font-semibold text-emerald-700">{typeof p.gpm === 'number' ? parseFloat(p.gpm.toFixed(2)) : (p.gpm || '-')}</td>`;

const newCells = `                      <td className="table-cell text-xs">{p.cost || '-'}</td>
                      <td className="table-cell text-xs">{p.sell || '-'}</td>
                      <td className="table-cell text-xs">{p.mco || '-'}</td>
                      <td className="table-cell text-xs font-semibold text-emerald-700">{typeof p.gpm === 'number' ? parseFloat(p.gpm.toFixed(2)) : (p.gpm || '-')}</td>`;

content = content.replace(oldCells, newCells);

fs.writeFileSync(path, content);
console.log('Patched oldCRMData table');
