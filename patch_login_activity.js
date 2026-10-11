const fs = require('fs');
const path = 'src/pages/LoginActivity.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add state for filters
content = content.replace(
  /const \[selectedLogs, setSelectedLogs\] = useState<number\[\]>\(\[\]\);/,
  `const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('All Users');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');`
);

// Replace hardcoded filters
content = content.replace(
  /<input type="text" placeholder="Search name, email, IP\.\.\." className="input-field pl-9" \/>/,
  `<input type="text" placeholder="Search name, email, IP..." className="input-field pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />`
);

content = content.replace(
  /<select className="select-field"><option>All Users<\/option><\/select>/,
  `<select className="select-field" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option>All Users</option>
            {Array.from(new Set(logs.map(l => l.userName))).map(u => <option key={u} value={u}>{u}</option>)}
          </select>`
);

content = content.replace(
  /<select className="select-field"><option>All Status<\/option><\/select>/,
  `<select className="select-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>`
);

content = content.replace(
  /<input type="date" className="input-field" \/>/g,
  (match, offset, string) => {
    if (offset < string.indexOf('To Date')) {
      return `<input type="date" className="input-field" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />`;
    } else {
      return `<input type="date" className="input-field" value={toDate} onChange={(e) => setToDate(e.target.value)} />`;
    }
  }
);

// Filter and sort logs
content = content.replace(
  /<tbody>[\s\S]*?{logs\.map\(\(log\) => \(/,
  `<tbody>
              {logs
                .filter(l => {
                  if (searchQuery && !l.userName.toLowerCase().includes(searchQuery.toLowerCase()) && !l.ipAddress.includes(searchQuery)) return false;
                  if (userFilter !== 'All Users' && l.userName !== userFilter) return false;
                  if (statusFilter !== 'All Status' && l.status !== statusFilter) return false;
                  if (fromDate && new Date(l.loginTime) < new Date(fromDate)) return false;
                  if (toDate && new Date(l.loginTime) > new Date(toDate + 'T23:59:59')) return false;
                  return true;
                })
                .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())
                .map((log) => (`
);

fs.writeFileSync(path, content);
