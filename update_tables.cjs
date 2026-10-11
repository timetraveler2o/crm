const fs = require('fs');
const path = require('path');

const pagesDir = 'src/pages';
const files = [
  'Users.tsx', 'Roles.tsx', 'LoginActivity.tsx', 'QueryStatus.tsx',
  'IpWhitelist.tsx', 'BreakMonitor.tsx', 'Dashboard.tsx', 'Reports.tsx',
  'Productivity.tsx', 'Attendance.tsx'
];

for (const file of files) {
  const fp = path.join(pagesDir, file);
  if (!fs.existsSync(fp)) { console.log('SKIP:', file); continue; }
  let content = fs.readFileSync(fp, 'utf8');
  let changed = false;

  // Update <table> elements that don't already have border-collapse
  const origContent = content;
  content = content.replace(/<table className="([^"]*)"/g, (match, cls) => {
    if (cls.includes('border-collapse')) return match; // already has it
    return `<table className="${cls} border-collapse border border-gray-200"`;
  });

  // Update <thead> elements to add border-b-2
  content = content.replace(/<thead className="([^"]*)"/g, (match, cls) => {
    if (cls.includes('border-b-2')) return match;
    return `<thead className="${cls} border-b-2 border-gray-300"`;
  });

  // Replace divide-y divide-gray-50 or divide-y divide-gray-100 in tbody
  content = content.replace(/<tbody className="divide-y divide-gray-(?:50|100)">/g, '<tbody>');

  if (content !== origContent) {
    fs.writeFileSync(fp, content);
    console.log('UPDATED:', file);
    changed = true;
  } else {
    console.log('NO CHANGE:', file);
  }
}
