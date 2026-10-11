const fs = require('fs');
const path = 'src/pages/Productivity.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<div className="card">\s*<div className="p-4 border-b border-gray-100">\s*<h2 className="font-semibold text-gray-800 flex items-center gap-2"><BarChart3 size=\{16\} \/> Individual Performance<\/h2>\s*<\/div>\s*<div className="p-4 space-y-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);/,
  `<div className="card lg:col-span-2">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><BarChart3 size={16} /> Individual Performance</h2>
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
        </div>
      </div>
    </div>
  );`
);

fs.writeFileSync(path, content);
