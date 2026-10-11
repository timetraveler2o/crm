const fs = require('fs');
const path = 'src/pages/Bookings.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add filteredOldCRMData
const filteredOldCRMDataStr = `
  const filteredOldCRMData = oldCRMData.filter(b => {
    if (filters.queryId && !(b.queryId || '').toLowerCase().includes(filters.queryId.toLowerCase())) return false;
    if (filters.firstName && !(b.firstName || '').toLowerCase().includes(filters.firstName.toLowerCase())) return false;
    if (filters.lastName && !(b.lastName || '').toLowerCase().includes(filters.lastName.toLowerCase())) return false;
    if (filters.email && !(b.email || '').toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.phone && !(b.phone || '').includes(filters.phone)) return false;
    if (filters.origin && !(b.origin || '').toLowerCase().includes(filters.origin.toLowerCase())) return false;
    if (filters.destination && !(b.destination || '').toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (selectedAgents.length > 0 && !selectedAgents.includes(b.addedBy)) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(b.queryStatus)) return false;
    if (filters.querySource && b.querySource !== filters.querySource) return false;
    if (filters.pnr && !(b.pnr || '').toLowerCase().includes(filters.pnr.toLowerCase())) return false;
    if (filters.fromDate && b.created) {
      const createdDate = new Date(b.created).toISOString().split('T')[0];
      if (createdDate < filters.fromDate) return false;
    }
    if (filters.toDate && b.created) {
      const createdDate = new Date(b.created).toISOString().split('T')[0];
      if (createdDate > filters.toDate) return false;
    }
    return true;
  });
`;

// Insert after filtered
content = content.replace('const filtered = bookings.filter(b => {', filteredOldCRMDataStr + '\n  const filtered = bookings.filter(b => {');

// Replace oldCRMData.length with filteredOldCRMData.length in the table header
content = content.replace('Old CRM Data ({oldCRMData.length} records)', 'Old CRM Data ({filteredOldCRMData.length} records)');

// Replace oldCRMData.slice with filteredOldCRMData.slice
content = content.replace('oldCRMData.slice((oldCRMPage - 1) * oldCRMPerPage, oldCRMPage * oldCRMPerPage).map', 'filteredOldCRMData.slice((oldCRMPage - 1) * oldCRMPerPage, oldCRMPage * oldCRMPerPage).map');

// Replace oldCRMData.length === 0 with filteredOldCRMData.length === 0
content = content.replace('oldCRMData.length === 0 ? (', 'filteredOldCRMData.length === 0 ? (');

// Replace totalItems={oldCRMData.length} with totalItems={filteredOldCRMData.length}
content = content.replace('totalItems={oldCRMData.length}', 'totalItems={filteredOldCRMData.length}');

fs.writeFileSync(path, content);
console.log('Patched oldCRMData filtering');
