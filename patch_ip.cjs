const fs = require('fs');
const path = 'src/pages/IpWhitelist.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /ips\.map\(ip => \(/,
  `[...ips].sort((a, b) => b.id - a.id).map(ip => (`
);

fs.writeFileSync(path, content);
