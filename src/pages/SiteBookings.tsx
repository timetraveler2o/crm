import { useState, useRef, useEffect } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { Search, UserCheck, X, Download, Upload, ArrowLeft, Clock, CheckCircle, AlertCircle, Printer, Trash2, Eye, Globe, Plane, Users as UsersIcon, Calendar, Mail, Phone, MapPin, CheckSquare, Square, Copy, Check, Send } from 'lucide-react';
import Pagination from '../components/Pagination';
import { formatDateDMY } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { client, API_BASE_URL } from '../lib/api';
import { useFilterPersistence, loadPageFilters } from '../lib/useFilterPersistence';

// IST timestamp helper
const formatLogDateTime = () => {
  const utc = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const d = new Date(utc.getTime() + istOffset);
  const day = d.getUTCDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = months[d.getUTCMonth()];
  const yr = d.getUTCFullYear();
  const hr = d.getUTCHours();
  const min = d.getUTCMinutes().toString().padStart(2, '0');
  const sec = d.getUTCSeconds().toString().padStart(2, '0');
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  return `${day} ${mon} ${yr}, ${hr12}:${min}:${sec} ${ampm}`;
};

export default function SiteBookings() {
  const { siteBookings, assignSiteBooking, users, updateSiteBooking, deleteSiteBooking, addSiteBooking, fetchData } = useCrmStore();
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany, addNotification } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;

  const companySiteBookings = siteBookings.filter(sb => {
    if (!sb.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return sb.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return sb.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return sb.company === 'Traveloboom' || sb.company === 'Traveloboom';
    return false;
  });

  const savedFilters = useRef(loadPageFilters<any>('siteBookings')).current;
  const [filters, setFilters] = useState(savedFilters?.filters || { queryId: '', name: '', email: '', phone: '', origin: '', destination: '', fromDate: '', toDate: '' });
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [sortBy, setSortBy] = useState(savedFilters?.sortBy || 'id_desc');
  const [perPage, setPerPage] = useState(savedFilters?.perPage || 50);
  const [currentPage, setCurrentPage] = useState(savedFilters?.currentPage || 1);

  // Persist filters to sessionStorage
  useFilterPersistence('siteBookings', { filters, sortBy, perPage, currentPage });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [showLogModal, setShowLogModal] = useState<number | null>(null);
  const [viewDetail, setViewDetail] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const filtered = companySiteBookings.filter(sb => {
    if (filters.queryId && !(sb.queryId || '').toLowerCase().includes(filters.queryId.toLowerCase())) return false;
    if (filters.name && !(sb.name || '').toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.email && !(sb.email || '').toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.phone && !(sb.phone || '').includes(filters.phone)) return false;
    if (filters.origin && !(sb.origin || '').toLowerCase().includes(filters.origin.toLowerCase())) return false;
    if (filters.destination && !(sb.destination || '').toLowerCase().includes(filters.destination.toLowerCase())) return false;
    return true;
  }).sort((a, b) => sortBy === 'id_desc' ? b.id - a.id : a.id - b.id);

  const agents = users.filter(u => {
    if (u.status !== 'Active' || !['Agent', 'Travel Consultant', 'Senior Travel Consultant', 'Supervisor'].includes(u.role)) return false;
    if (!u.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return u.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return u.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
    return false;
  }).map(u => u.name);
  const roleLower = (currentUser?.role || '').toLowerCase();
  const isAdmin = ['admin', 'super admin', 'superuser'].includes(roleLower);
  const canExport = isAdmin || currentUser?.permissions?.includes('Export Data') || ['Manager', 'Operation Manager', 'HR (Human Resource)', 'HR'].includes(currentUser?.role || '');
  const canView = isAdmin || currentUser?.permissions?.includes('Booking Management') || ['Manager', 'Operation Manager', 'HR (Human Resource)', 'HR', 'Supervisor'].includes(currentUser?.role || '');
  const canEdit = isAdmin || ['Manager', 'Operation Manager', 'HR (Human Resource)', 'HR', 'Supervisor'].includes(currentUser?.role || '');
  const canDelete = isAdmin || ['HR (Human Resource)', 'HR', 'IT', 'IT (Information Tech)'].includes(currentUser?.role || '');

  if (!canView) {
    return (<div className="flex flex-col items-center justify-center h-64 text-gray-500"><p>You do not have permission to view site bookings.</p></div>);
  }

  const getAssignmentLog = (sb: any): string[] => {
    if (!sb.assignmentLog) return [];
    try { return JSON.parse(sb.assignmentLog); } catch { return []; }
  };

  const handleAssign = async (sbId: number, agentName: string) => {
    const sb = siteBookings.find(s => s.id === sbId);
    if (!sb) return;
    const existingLog = getAssignmentLog(sb);
    const now = formatLogDateTime();
    const newEntry = `${now} — Assigned to: ${agentName} (by ${currentUser?.name || 'Admin'})`;
    const newLog = JSON.stringify([...existingLog, newEntry]);
    
    await assignSiteBooking(sbId, agentName);
    await updateSiteBooking(sbId, { assignment: agentName, assignmentLog: newLog, modified: now });
    
    try {
      const nameParts = (sb.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await client.api.fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addedBy: agentName, firstName, lastName,
          email: sb.email || '', phone: sb.phone || '',
          origin: extractIata(sb.origin || (sb as any).departure || ''),
          destination: extractIata(sb.destination || ''),
          departureDate: sb.departDate || '',
          returnDate: sb.returnDate || '',
          cabin: sb.cabin || (sb as any).cabinClass || 'Economy',
          adults: sb.adults || 1, children: sb.children || 0, infants: sb.infants || 0,
          queryStatus: 'New Query', querySource: 'Website',
          remarks: JSON.stringify([{ text: `Converted from site lead ${sb.queryId}`, addedBy: currentUser?.name || 'System', date: now }]),
          tripType: sb.tripType || 'One Way',
          company: sb.company || 'Get Set Flight',
        }),
      });
    } catch (err) {
      console.error('Failed to auto-create booking from site lead:', err);
    }
    
    setShowAssign(null);
    setAssignTo('');
    fetchData();
  };

  const handleUnassign = async (sbId: number) => {
    const sb = siteBookings.find(s => s.id === sbId);
    if (!sb) return;
    const existingLog = getAssignmentLog(sb);
    const now = formatLogDateTime();
    const newEntry = `${now} — Unassigned by: ${currentUser?.name || 'Admin'}`;
    const newLog = JSON.stringify([...existingLog, newEntry]);
    await updateSiteBooking(sbId, { assignment: 'Unassigned', assignmentLog: newLog, modified: now });
  };

  const handleDelete = async (id: number) => {
    await deleteSiteBooking(id);
    setConfirmDelete(null);
  };

  const exportCSV = () => {
    const headers = ['Query ID','Name','Email','Phone','Origin','Destination','Depart Date','Return Date','Assignment','Created'];
    const rows = filtered.map(sb => [sb.queryId,sb.name,sb.email,sb.phone,sb.origin || '',sb.destination || '',sb.departDate || '',sb.returnDate || '',sb.assignment,sb.created]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v||'').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Site_Bookings_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          alert('CSV file is empty or has no data rows');
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
        const fieldMap: Record<string, string> = {
          'query id': 'queryId', 'queryid': 'queryId',
          'name': 'name', 'client name': 'name', 'customer': 'name',
          'email': 'email', 'e-mail': 'email',
          'phone': 'phone', 'contact': 'phone', 'mobile': 'phone',
          'origin': 'origin', 'from': 'origin', 'departure': 'origin',
          'destination': 'destination', 'to': 'destination', 'arrival': 'destination',
          'depart date': 'departDate', 'departure date': 'departDate', 'departuredate': 'departDate',
          'return date': 'returnDate', 'returndate': 'returnDate',
          'travel dates': 'travelDates',
          'assignment': 'assignment', 'assigned to': 'assignment',
          'status': 'status',
          'cabin': 'cabin', 'cabin class': 'cabin', 'class': 'cabin',
          'adults': 'adults', 'adult': 'adults',
          'children': 'children', 'child': 'children',
          'infants': 'infants', 'infant': 'infants',
          'trip type': 'tripType', 'triptype': 'tripType',
          'source': 'source',
          'company': 'company',
        };

        const mappedHeaders = headers.map(h => fieldMap[h] || h);
        let count = 0;

        for (let i = 1; i < lines.length; i++) {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (const char of lines[i]) {
            if (char === '"') { inQuotes = !inQuotes; continue; }
            if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
            current += char;
          }
          values.push(current.trim());

          const row: any = {};
          mappedHeaders.forEach((field, idx) => {
            if (values[idx] !== undefined) row[field] = values[idx];
          });

          const comp = row.company || (displayCompany === 'LBT' ? 'Look Book Ticket' : displayCompany === 'travelo' ? 'Traveloboom' : 'Get Set Flight');
          const prefix = comp === 'Look Book Ticket' ? 'LBT' : comp === 'Traveloboom' ? 'TBM' : 'GSF';
          const newQueryId = row.queryId || `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

          const siteBookingData = {
            queryId: newQueryId,
            name: row.name || 'Website Lead',
            email: row.email || '',
            phone: row.phone || '',
            origin: row.origin || '',
            destination: row.destination || '',
            departDate: row.departDate || '',
            travelDates: row.travelDates || row.departDate || '',
            returnDate: row.returnDate || '',
            assignment: row.assignment || 'Unassigned',
            status: row.status || 'New',
            cabin: row.cabin || 'Economy',
            adults: Number(row.adults) || 1,
            children: Number(row.children) || 0,
            infants: Number(row.infants) || 0,
            tripType: row.tripType || 'One Way',
            source: row.source || 'CSV Import',
            company: comp,
            created: formatLogDateTime(),
            modified: formatLogDateTime(),
          };

          if (siteBookingData.name || siteBookingData.email || siteBookingData.phone) {
            await addSiteBooking(siteBookingData);
            count++;
          }
        }

        addNotification({
          title: 'Import Complete',
          message: `Successfully imported ${count} site booking leads from ${file.name}`,
          type: 'success',
        });
        fetchData();
      } catch (err: any) {
        console.error('Site bookings import error:', err);
        alert('Failed to parse CSV file. Please check format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const logEntry = showLogModal ? siteBookings.find(s => s.id === showLogModal) : null;
  const logItems = logEntry ? getAssignmentLog(logEntry) : [];

  // Parse remarks JSON
  const parseRemarks = (remarks: string | undefined): any[] => {
    if (!remarks) return [];
    try { return JSON.parse(remarks); } catch { return []; }
  };

  // Extract IATA code or clean location name properly without truncation
  const extractIata = (val: string | undefined): string => {
    if (!val) return '—';
    const trimmed = val.trim();
    if (!trimmed) return '—';
    // 1. Bracket pattern [XXX] or (XXX)
    const bracketMatch = trimmed.match(/[\[\(]([A-Za-z]{3})[\]\)]/);
    if (bracketMatch) return bracketMatch[1].toUpperCase();
    // 2. Pure 3-letter IATA code
    if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
    // 3. Prefix pattern like "DFW - Dallas/Fort Worth" or "YYZ: Toronto"
    const prefixMatch = trimmed.match(/^([A-Za-z]{3})\s*[\-:\/|]/);
    if (prefixMatch) return prefixMatch[1].toUpperCase();
    // 4. Postfix pattern like "Toronto - YYZ" or "London / LHR"
    const postfixMatch = trimmed.match(/[\-:\/|]\s*([A-Za-z]{3})$/);
    if (postfixMatch) return postfixMatch[1].toUpperCase();
    // 5. Look for standalone 3-letter uppercase code
    const standaloneMatch = trimmed.match(/\b([A-Z]{3})\b/);
    if (standaloneMatch) return standaloneMatch[1];
    // 6. Return clean city/airport name without truncating
    const clean = trimmed.split(' - ')[0].trim();
    return clean || trimmed;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Go Back"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="page-title">Site Bookings</h1>
            <p className="text-gray-500 text-sm mt-1">Leads from your website ({filtered.length} total)</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && canDelete && (
            <button onClick={() => setConfirmBulkDelete(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-colors">
              <Trash2 size={16} /> Delete ({selectedIds.size})
            </button>
          )}
          {canExport && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2"><Upload size={16} /> Import</button>
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2"><Download size={16} /> CSV</button>
              <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2"><Printer size={16} /> PDF</button>
            </>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <input placeholder="Query ID" value={filters.queryId} onChange={(e) => setFilters(f => ({ ...f, queryId: e.target.value }))} className="input-field" />
          <input placeholder="Name" value={filters.name} onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))} className="input-field" />
          <input placeholder="Email" value={filters.email} onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))} className="input-field" />
          <input placeholder="Phone" value={filters.phone} onChange={(e) => setFilters(f => ({ ...f, phone: e.target.value }))} className="input-field" />
          <input placeholder="Origin" value={filters.origin} onChange={(e) => setFilters(f => ({ ...f, origin: e.target.value }))} className="input-field" />
          <input placeholder="Destination" value={filters.destination} onChange={(e) => setFilters(f => ({ ...f, destination: e.target.value }))} className="input-field" />
          <input type="date" value={filters.fromDate} onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value }))} className="input-field" />
          <input type="date" value={filters.toDate} onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value }))} className="input-field" />
        </div>
        <div className="flex gap-3 mt-3">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field w-auto">
            <option value="id_asc">ID (asc)</option>
            <option value="id_desc">ID (desc)</option>
          </select>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="select-field w-auto">
            <option value={30}>30 Per Page</option>
            <option value={50}>50 Per Page</option>
            <option value={100}>100 Per Page</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="table-header w-10">
                  <button
                    onClick={() => {
                      const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
                      const allSelected = pageItems.every(sb => selectedIds.has(sb.id));
                      const newSet = new Set(selectedIds);
                      if (allSelected) { pageItems.forEach(sb => newSet.delete(sb.id)); } else { pageItems.forEach(sb => newSet.add(sb.id)); }
                      setSelectedIds(newSet);
                    }}
                    className="p-0.5 hover:bg-blue-50 rounded"
                  >
                    {(() => {
                      const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
                      const allSel = pageItems.length > 0 && pageItems.every(sb => selectedIds.has(sb.id));
                      const someSel = pageItems.some(sb => selectedIds.has(sb.id));
                      return allSel ? <CheckSquare size={15} className="text-blue-600" /> : someSel ? <CheckSquare size={15} className="text-blue-300" /> : <Square size={15} className="text-gray-400" />;
                    })()}
                  </button>
                </th>
                <th className="table-header">S.No</th>
                <th className="table-header">Query ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Route</th>
                <th className="table-header">Travel</th>
                <th className="table-header">Assignment</th>
                <th className="table-header">Created</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((currentPage - 1) * perPage, currentPage * perPage).map((sb, i) => {
                const isAssigned = sb.assignment && sb.assignment !== 'Unassigned';
                return (
                  <tr key={sb.id} className={`transition-colors ${isAssigned ? 'bg-emerald-200 border-l-4 border-l-emerald-700 hover:bg-emerald-300' : 'hover:bg-gray-50/50'}`}>
                    <td className="table-cell w-10">
                      <button onClick={() => { const newSet = new Set(selectedIds); if (newSet.has(sb.id)) newSet.delete(sb.id); else newSet.add(sb.id); setSelectedIds(newSet); }} className="p-0.5 hover:bg-blue-50 rounded">
                        {selectedIds.has(sb.id) ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} className="text-gray-300" />}
                      </button>
                    </td>
                    <td className="table-cell font-medium text-gray-500">{(currentPage - 1) * perPage + i + 1}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => setViewDetail(sb)}
                        className="text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Click to view details"
                      >
                        {sb.queryId}
                        <Eye size={11} className="opacity-60" />
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-sm">{sb.name}</div>
                      <div className="text-[11px] text-gray-400">{sb.email}</div>
                    </td>
                    <td className="table-cell text-xs text-gray-600">{sb.phone}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <span className="text-emerald-700">{extractIata(sb.origin)}</span>
                        <Plane size={10} className="text-gray-400 rotate-90" />
                        <span className="text-blue-700">{extractIata(sb.destination)}</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-gray-600">{formatDateDMY(sb.departDate) || sb.travelDates || '—'}</td>
                    <td className="table-cell">
                      {showAssign === sb.id ? (
                        <div className="flex items-center gap-1">
                          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="select-field py-1 text-xs w-28">
                            <option value="">Select</option>
                            {agents.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <button onClick={() => assignTo && handleAssign(sb.id, assignTo)} className="text-green-600 hover:text-green-800" disabled={!assignTo}><UserCheck size={14} /></button>
                          <button onClick={() => setShowAssign(null)} className="text-red-600 hover:text-red-800"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isAssigned ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                            {isAssigned ? sb.assignment : 'Unassigned'}
                          </span>
                          {canEdit && (
                            <button onClick={() => { setShowAssign(sb.id); setAssignTo(isAssigned ? sb.assignment : ''); }} className="text-blue-500 hover:text-blue-700 ml-1" title={isAssigned ? 'Reassign' : 'Assign'}>
                              <UserCheck size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="table-cell text-[11px] text-gray-500">{formatDateDMY(sb.created)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {/* Eye - View Detail */}
                        <button onClick={() => setViewDetail(sb)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors" title="View Details">
                          <Eye size={15} />
                        </button>
                        {/* Log */}
                        <button onClick={() => setShowLogModal(sb.id)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 hover:text-purple-700 transition-colors" title="Assignment History">
                          <Clock size={15} />
                          {getAssignmentLog(sb).length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 rounded-full text-[8px] text-white flex items-center justify-center">{getAssignmentLog(sb).length}</span>
                          )}
                        </button>
                        {/* Delete */}
                        {canDelete && (
                          <button onClick={() => setConfirmDelete(sb.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== DETAIL VIEW MODAL ===== */}
      {viewDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={18} className="opacity-80" />
                    <span className="text-blue-200 text-xs font-medium">WEBSITE LEAD</span>
                  </div>
                  <h2 className="text-xl font-bold">{viewDetail.queryId}</h2>
                  <p className="text-blue-100 text-sm mt-0.5">{viewDetail.company || 'Get Set Flight'}</p>
                </div>
                <button onClick={() => setViewDetail(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><X size={20} /></button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-160px)] space-y-5">
              {/* Passenger Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-1"><UsersIcon size={12} /> Passenger</h3>
                  <p className="font-bold text-gray-900 text-lg">{viewDetail.name || '—'}</p>
                  <div className="mt-2 space-y-1.5">
                    {viewDetail.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-gray-400" />{viewDetail.email}</div>}
                    {viewDetail.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={13} className="text-gray-400" />{viewDetail.phone}</div>}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-1"><Plane size={12} /> Flight Details</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-600">{extractIata(viewDetail.origin)}</p>
                      <p className="text-[10px] text-gray-400">ORIGIN</p>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="h-[2px] flex-1 bg-gray-200"></div>
                      <Plane size={14} className="text-gray-400 mx-1 rotate-90" />
                      <div className="h-[2px] flex-1 bg-gray-200"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-blue-600">{extractIata(viewDetail.destination)}</p>
                      <p className="text-[10px] text-gray-400">DESTINATION</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400">Depart:</span> <span className="font-medium">{viewDetail.departDate || viewDetail.travelDates || '—'}</span></div>
                    <div><span className="text-gray-400">Return:</span> <span className="font-medium">{viewDetail.returnDate || '—'}</span></div>
                    <div><span className="text-gray-400">Trip:</span> <span className="font-medium">{viewDetail.tripType || '—'}</span></div>
                    <div><span className="text-gray-400">Cabin:</span> <span className="font-medium">{viewDetail.cabin || viewDetail.cabinClass || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Passengers & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{viewDetail.adults || 0}</p>
                  <p className="text-[10px] text-blue-500 font-medium">ADULTS</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">{viewDetail.children || 0}</p>
                  <p className="text-[10px] text-purple-500 font-medium">CHILDREN</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-pink-700">{viewDetail.infants || 0}</p>
                  <p className="text-[10px] text-pink-500 font-medium">INFANTS</p>
                </div>
              </div>

              {/* Assignment & Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${viewDetail.assignment && viewDetail.assignment !== 'Unassigned' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {viewDetail.assignment && viewDetail.assignment !== 'Unassigned' ? `✅ Assigned: ${viewDetail.assignment}` : '⏳ Unassigned'}
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${viewDetail.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  Status: {viewDetail.status || 'New'}
                </div>
                <div className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600">
                  Source: {viewDetail.source || 'Website'}
                </div>
              </div>

              {/* Remarks */}
              {viewDetail.remarks && (() => {
                const items = parseRemarks(viewDetail.remarks);
                return items.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-amber-600 uppercase mb-2">Remarks</h3>
                    {items.map((r: any, i: number) => (
                      <div key={i} className="text-sm text-gray-700 mb-1">
                        <p className="whitespace-pre-wrap">{r.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">— {r.addedBy}, {r.date}</p>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Timestamps */}
              <div className="flex gap-4 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                <span>Created: {viewDetail.created}</span>
                <span>Modified: {viewDetail.modified}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              {canEdit && !viewDetail.assignment || viewDetail.assignment === 'Unassigned' ? (
                <button onClick={() => { setViewDetail(null); setShowAssign(viewDetail.id); }} className="btn-primary flex-1">Assign to Agent</button>
              ) : (
                <button onClick={() => setViewDetail(null)} className="btn-primary flex-1">Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-600" /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Site Booking?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary py-2.5">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-600" /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete {selectedIds.size} Booking{selectedIds.size > 1 ? 's' : ''}?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone. All selected site bookings will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmBulkDelete(false)} className="flex-1 btn-secondary py-2.5">Cancel</button>
                <button onClick={async () => { for (const id of selectedIds) { await deleteSiteBooking(id); } setSelectedIds(new Set()); setConfirmBulkDelete(false); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Yes, Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        totalItems={filtered.length}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
      />

      {/* Assignment Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Clock size={18} /> Assignment History</h2>
              <button onClick={() => setShowLogModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {logItems.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No assignment history yet</p>
              ) : (
                <div className="space-y-3">
                  {logItems.map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 text-[10px] font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 flex-1">{entry}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100"><button onClick={() => setShowLogModal(null)} className="btn-secondary w-full">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
