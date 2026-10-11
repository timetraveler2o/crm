const fs = require('fs');
const path = require('path');

const pagesDir = 'src/pages';
const files = [
  'Users.tsx', 'Roles.tsx', 'LoginActivity.tsx', 'QueryStatus.tsx',
  'IpWhitelist.tsx', 'BreakMonitor.tsx', 'Dashboard.tsx', 'Reports.tsx',
  'Productivity.tsx'
];

for (const file of files) {
  const fp = path.join(pagesDir, file);
  if (!fs.existsSync(fp)) { console.log('SKIP:', file); continue; }
  let content = fs.readFileSync(fp, 'utf8');
  const origContent = content;

  // Add border to <th> with px-* py-* classes that don't have border
  content = content.replace(/<th className="((?:px-|p-)[^"]*)"/g, (match, cls) => {
    if (cls.includes('border')) return match;
    return `<th className="${cls} border border-gray-200"`;
  });

  // Add border to <td> with px-* py-* or p-* classes that don't have border or table-cell
  content = content.replace(/<td className="((?:px-|p-)[^"]*)"/g, (match, cls) => {
    if (cls.includes('border') || cls.includes('table-cell')) return match;
    return `<td className="${cls} border border-gray-200"`;
  });

  if (content !== origContent) {
    fs.writeFileSync(fp, content);
    console.log('UPDATED:', file);
  } else {
    console.log('NO CHANGE:', file);
  }
}
