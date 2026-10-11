const fs = require('fs');
const path = 'src/pages/AddBooking.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldComponent = `function CountryCodeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase().trim();
    return COUNTRY_CODES.filter(c => {
      const countryName = (c as any).country?.toLowerCase() || '';
      const codeLabel = c.label.toLowerCase();
      const codeOnly = c.code.toLowerCase();
      return codeLabel.includes(q) || codeOnly.includes(q) || countryName.includes(q);
    });
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = COUNTRY_CODES.find(c => c.label === value) || COUNTRY_CODES.find(c => c.code === value);

  return (
    <div ref={ref} className="relative min-w-[90px] max-w-[100px]" style={{ zIndex: open ? 999 : 'auto' }}>
      <button type="button" onClick={() => { setOpen(!open); setSearch(''); }} className="bg-gray-50 border-r border-gray-200 px-2 py-2.5 text-xs font-medium text-gray-700 focus:outline-none w-full text-left flex items-center gap-1 h-full hover:bg-gray-100 transition-colors">
        {selected ? <><span className="text-base leading-none">{selected.flag}</span> <span className="text-[11px] font-semibold">{selected.code}</span></> : <span>+1</span>}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl w-64 max-h-72 overflow-hidden" style={{ zIndex: 9999 }}>
          <div className="sticky top-0 p-2 border-b border-gray-100 bg-white">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
              placeholder="Search country or code..."
              autoFocus
            />
          </div>
          <div ref={scrollRef} className="max-h-56 overflow-y-auto">
            {/* Priority divider */}
            {!search.trim() && (
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 sticky top-0">Frequently Used</div>
            )}
            {filtered.map((c, i) => {
              const isPriority = PRIORITY_COUNTRY_CODES.some(p => p.label === c.label);
              const showOtherDivider = !search.trim() && i === PRIORITY_COUNTRY_CODES.length && !isPriority;
              return (
                <div key={\`\${c.label}-\${i}\`}>
                  {showOtherDivider && (
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 sticky top-0">All Countries</div>
                  )}
                  <button
                    type="button"
                    onClick={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                    className={\`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center gap-2 transition-colors \${c.code === value && c.label === selected?.label ? 'bg-blue-50 font-semibold text-blue-700' : ''}\`}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="font-semibold">{c.code}</span>
                    <span className="text-gray-400 text-[10px] ml-auto">{(c as any).country || c.label.match(/\\(([^)]+)\\)/)?.[1] || ''}</span>
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No country found</p>}
          </div>
        </div>
      )}
    </div>
  );
}`;

const newComponent = `function CountryCodeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-gray-50 border-r border-gray-200 px-2 py-2.5 text-xs font-medium text-gray-700 focus:outline-none min-w-[110px] max-w-[120px] h-full hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <optgroup label="Frequently Used">
        {PRIORITY_COUNTRY_CODES.map((c, i) => (
          <option key={\`priority-\${c.code}-\${i}\`} value={c.code}>
            {c.flag} {c.code} {c.country ? \`(\${c.country})\` : ''}
          </option>
        ))}
      </optgroup>
      <optgroup label="All Countries">
        {OTHER_COUNTRY_CODES.map((c, i) => (
          <option key={\`other-\${c.code}-\${i}\`} value={c.code}>
            {c.flag} {c.code} {c.country ? \`(\${c.country})\` : ''}
          </option>
        ))}
      </optgroup>
    </select>
  );
}`;

content = content.replace(oldComponent, newComponent);
fs.writeFileSync(path, content);
console.log('Patched CountryCodeSelect');
