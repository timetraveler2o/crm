const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /onChange=\{\(event\) => setQueryOrigin\(event\.target\.value\)\}/g,
  "onChange={(event) => { setQueryOrigin(event.target.value); setForm({...form, origin: event.target.value.toUpperCase()}); }}"
);

content = content.replace(
  /onChange=\{\(event\) => setQueryDestination\(event\.target\.value\)\}/g,
  "onChange={(event) => { setQueryDestination(event.target.value); setForm({...form, destination: event.target.value.toUpperCase()}); }}"
);

fs.writeFileSync(path, content);
