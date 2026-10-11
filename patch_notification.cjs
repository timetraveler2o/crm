const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /addNotification\(\{ title: editId \? 'Booking Updated' : 'Booking Created', message: `Booking for \$\{form\.firstName\} \$\{form\.lastName\} \$\{editId \? 'updated' : 'created'\} successfully`, type: 'success' \}\);/,
  `if (form.queryStatus === 'Send to QC') {
      addNotification({ title: 'Sent to QC', message: \`Booking for \${form.firstName} \${form.lastName} sent to QC successfully\`, type: 'info' });
    } else {
      addNotification({ title: editId ? 'Booking Updated' : 'Booking Created', message: \`Booking for \${form.firstName} \${form.lastName} \${editId ? 'updated' : 'created'} successfully\`, type: 'success' });
    }`
);

fs.writeFileSync(path, content);
