const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add countryCode to form state
content = content.replace(
  /phone: '',/g,
  "phone: '', countryCode: '+1',"
);

content = content.replace(
  /phone: b\.phone,/g,
  "phone: b.phone?.split('-')[1] || b.phone || '', countryCode: b.phone?.includes('-') ? b.phone.split('-')[0] : '+1',"
);

// Update handleSave to combine countryCode and phone
content = content.replace(
  /const bookingData = \{/,
  `const bookingData = {
      ...form,
      phone: \`\${form.countryCode}-\${form.phone}\`,`
);

// Update phone input UI
content = content.replace(
  /<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Phone \*<\/label>\s*<input\s*value=\{form\.phone\}\s*onChange=\{\(e\) => \{\s*let val = e\.target\.value\.replace\(\/\\D\/g, ''\)\.slice\(0, 10\);\s*setForm\(\{\.\.\.form, phone: val\}\);\s*\}\}\s*className="input-field py-2\.5 text-base"\s*placeholder="10 digit number"\s*maxLength=\{10\}\s*\/>\s*<\/div>/,
  `<div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <div className="flex gap-2">
                      <select 
                        value={form.countryCode} 
                        onChange={(e) => setForm({...form, countryCode: e.target.value})}
                        className="select-field w-24 py-2.5"
                      >
                        {COUNTRY_CODES.map((c, i) => (
                          <option key={i} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input 
                        value={form.phone} 
                        onChange={(e) => {
                          let val = e.target.value.replace(/\\D/g, '').slice(0, 10);
                          setForm({...form, phone: val});
                        }} 
                        className="input-field py-2.5 text-base flex-1" 
                        placeholder="10 digit number"
                        maxLength={10}
                      />
                    </div>
                  </div>`
);

fs.writeFileSync(path, content);
