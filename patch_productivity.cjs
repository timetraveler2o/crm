const fs = require('fs');
const path = 'src/pages/Productivity.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add state for date filter
content = content.replace(
  /export default function Productivity\(\) \{/,
  `import { useState } from 'react';\nexport default function Productivity() {\n  const [dateFilter, setDateFilter] = useState('monthly');\n  const [customFrom, setCustomFrom] = useState('');\n  const [customTo, setCustomTo] = useState('');`
);

// Filter bookings and attendance based on date filter
content = content.replace(
  /const \{ attendance, bookings \} = useCrmStore\(\);/,
  `const { attendance: allAttendance, bookings: allBookings } = useCrmStore();
  
  const filterByDate = (dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (dateFilter === 'daily') {
      return date.toDateString() === now.toDateString();
    } else if (dateFilter === 'weekly') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return date >= weekAgo;
    } else if (dateFilter === 'monthly') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'custom') {
      if (customFrom && new Date(dateStr) < new Date(customFrom)) return false;
      if (customTo && new Date(dateStr) > new Date(customTo + 'T23:59:59')) return false;
      return true;
    }
    return true;
  };

  const attendance = allAttendance.filter(a => filterByDate(a.date));
  const bookings = allBookings.filter(b => filterByDate(b.created));`
);

// Add filter UI
content = content.replace(
  /<div className="flex gap-2">/,
  `<div className="flex flex-wrap gap-2 items-center">
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="select-field py-1.5 text-sm w-auto">
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateFilter === 'custom' && (
            <div className="flex gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input-field py-1.5 text-sm w-auto" />
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input-field py-1.5 text-sm w-auto" />
            </div>
          )}`
);

// Update Individual Performance table to show GPM
content = content.replace(
  /const sellerData = bookings\.reduce\(\(acc: any, b\) => \{[\s\S]*?\}, \{\}\);/,
  `const sellerData = bookings.reduce((acc: any, b) => {
    if (b.queryStatus === 'Sold') {
      if (!acc[b.addedBy]) acc[b.addedBy] = { amount: 0, gpm: 0, count: 0 };
      let amount = 0;
      let gpm = 0;
      try {
        const pnrs = JSON.parse(b.pnrDetails || '[]');
        amount = pnrs.reduce((sum: number, p: any) => sum + (Number(p.sell) || 0), 0);
        gpm = pnrs.reduce((sum: number, p: any) => sum + (Number(p.gpm) || 0), 0);
      } catch {
        amount = 0;
        gpm = 0;
      }
      acc[b.addedBy].amount += amount;
      acc[b.addedBy].gpm += gpm;
      acc[b.addedBy].count += 1;
    }
    return acc;
  }, {});`
);

content = content.replace(
  /const topSellers = Object\.entries\(sellerData\)[\s\S]*?\.slice\(0, 5\);/,
  `const topSellers = Object.entries(sellerData)
    .map(([name, data]: any) => ({ name, amount: data.amount, gpm: data.gpm, count: data.count }))
    .sort((a, b) => b.amount - a.amount);`
);

// Update Individual Performance Table UI
content = content.replace(
  /<div className="card">[\s\S]*?<h2 className="font-semibold text-gray-800">Individual Performance<\/h2>[\s\S]*?<\/div>/,
  `<div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Individual Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Agent</th>
                <th className="table-header text-center">Bookings</th>
                <th className="table-header text-right">Revenue</th>
                <th className="table-header text-right">GPM</th>
                <th className="table-header text-center">Productivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topSellers.map((seller, i) => {
                const agentAtt = attendance.filter(a => a.userName === seller.name);
                const totalMin = agentAtt.reduce((sum, a) => {
                  const match = a.totalHours.match(/(\\d+)h\\s*(\\d+)m/);
                  return sum + (match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0);
                }, 0);
                const breakMin = agentAtt.reduce((sum, a) => {
                  return sum + a.breaks.reduce((bSum, br) => {
                    const m = br.duration.match(/(\\d+)/);
                    return bSum + (m ? parseInt(m[1]) : 0);
                  }, 0);
                }, 0);
                const prodPct = totalMin > 0 ? Math.round(((totalMin - breakMin) / totalMin) * 100) : 0;

                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="table-cell font-medium text-gray-900">{seller.name}</td>
                    <td className="table-cell text-center">{seller.count}</td>
                    <td className="table-cell text-right font-medium text-emerald-600">$\{seller.amount.toLocaleString()}</td>
                    <td className="table-cell text-right font-medium text-blue-600">$\{seller.gpm.toLocaleString()}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: \`\${prodPct}%\` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{prodPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {topSellers.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No performance data for selected period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>`
);

fs.writeFileSync(path, content);
