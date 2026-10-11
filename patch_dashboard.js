const fs = require('fs');
const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const filteredStatuses = STATUS_ORDER[\s\S]*?\.filter\(\(qs\): qs is NonNullable<typeof qs> => qs != null\);/,
  `const filteredStatuses = STATUS_ORDER.map((name, index) => {
    const existing = queryStatuses.find(qs => qs.name === name);
    return existing || { id: \`temp-\${index}\`, name, color: '#000' };
  });`
);

fs.writeFileSync(path, content);
