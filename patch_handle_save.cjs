const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const bookingData = \{\s*\.\.\.form,\s*remarks: JSON\.stringify\(finalRemarks\),\s*pnr: validPnrs\.map\(p => p\.pnr\)\.join\(','\),\s*pnrDetails: JSON\.stringify\(pnrDetails\),\s*images: images\.join\(','\)\s*\};/,
  `const bookingData = {
      ...form,
      adults: Number(form.adults) || 0,
      children: Number(form.children) || 0,
      infants: Number(form.infants) || 0,
      remarks: JSON.stringify(finalRemarks),
      pnr: validPnrs.map(p => p.pnr).join(','),
      pnrDetails: JSON.stringify(pnrDetails.map(p => ({
        ...p,
        cost: Number(p.cost) || 0,
        sell: Number(p.sell) || 0,
        fee: Number(p.fee) || 0,
        mco: Number(p.mco) || 0,
        gpm: Number(p.gpm) || 0
      }))),
      images: images.join(',')
    };`
);

fs.writeFileSync(path, content);
