const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<td className="table-cell font-medium text-blue-600">\{b\.queryId\}<\/td>/,
  `<td className="table-cell">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => openView(b)}>{b.queryId}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openView(b)} className="p-1 text-gray-400 hover:text-blue-600" title="View Details"><Eye size={14} /></button>
                        <button onClick={() => openEdit(b)} className="p-1 text-gray-400 hover:text-blue-600" title="Edit"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  </td>`
);

content = content.replace(
  /<tr key=\{b\.id\} className="hover:bg-gray-50\/50">/,
  `<tr key={b.id} className="hover:bg-gray-50/50 group">`
);

fs.writeFileSync(path, content);
