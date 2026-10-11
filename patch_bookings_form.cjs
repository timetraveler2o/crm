const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

// Change default currency to CAD
content = content.replace(/currency: 'USD'/g, "currency: 'CAD'");
content = content.replace(/currency: b\.currency \|\| 'USD'/g, "currency: b.currency || 'CAD'");

// Change adults, children, infants to allow empty string
content = content.replace(/adults: 1, children: 0, infants: 0/g, "adults: '' as any, children: '' as any, infants: '' as any");
content = content.replace(/adults: b\.adults, children: b\.children, infants: b\.infants/g, "adults: b.adults || '', children: b.children || '', infants: b.infants || ''");

// Change PNR details default to empty strings
content = content.replace(/cost: 0, sell: 0, fee: 0, mco: 0, gpm: 0/g, "cost: '' as any, sell: '' as any, fee: '' as any, mco: '' as any, gpm: '' as any");

// Update input fields to handle empty strings
content = content.replace(/value=\{form\.adults\} onChange=\{\(e\) => setForm\(\{\.\.\.form, adults: Number\(e\.target\.value\)\}\)\}/g, "value={form.adults} onChange={(e) => setForm({...form, adults: e.target.value})} placeholder=\"0\"");
content = content.replace(/value=\{form\.children\} onChange=\{\(e\) => setForm\(\{\.\.\.form, children: Number\(e\.target\.value\)\}\)\}/g, "value={form.children} onChange={(e) => setForm({...form, children: e.target.value})} placeholder=\"0\"");
content = content.replace(/value=\{form\.infants\} onChange=\{\(e\) => setForm\(\{\.\.\.form, infants: Number\(e\.target\.value\)\}\)\}/g, "value={form.infants} onChange={(e) => setForm({...form, infants: e.target.value})} placeholder=\"0\"");

// Update PNR input fields
content = content.replace(/value=\{p\.sell\} onChange=\{\(e\) => updatePnr\(i, 'sell', Number\(e\.target\.value\)\)\}/g, "value={p.sell} onChange={(e) => updatePnr(i, 'sell', e.target.value)} placeholder=\"0\"");
content = content.replace(/value=\{p\.cost\} onChange=\{\(e\) => updatePnr\(i, 'cost', Number\(e\.target\.value\)\)\}/g, "value={p.cost} onChange={(e) => updatePnr(i, 'cost', e.target.value)} placeholder=\"0\"");
content = content.replace(/value=\{p\.fee\} onChange=\{\(e\) => updatePnr\(i, 'fee', Number\(e\.target\.value\)\)\}/g, "value={p.fee} onChange={(e) => updatePnr(i, 'fee', e.target.value)} placeholder=\"0\"");
content = content.replace(/value=\{p\.mco\} onChange=\{\(e\) => updatePnr\(i, 'mco', Number\(e\.target\.value\)\)\}/g, "value={p.mco} onChange={(e) => updatePnr(i, 'mco', e.target.value)} placeholder=\"0\"");
content = content.replace(/value=\{p\.gpm\} onChange=\{\(e\) => updatePnr\(i, 'gpm', Number\(e\.target\.value\)\)\}/g, "value={p.gpm} onChange={(e) => updatePnr(i, 'gpm', e.target.value)} placeholder=\"0\"");

fs.writeFileSync(path, content);
