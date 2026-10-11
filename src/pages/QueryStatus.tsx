import { useState, useRef } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Edit2, X, Download, Upload, Trash2 } from 'lucide-react';
import { formatDateDMY } from '../lib/utils';
import Pagination from '../components/Pagination';
import { useFilterPersistence, loadPageFilters } from '../lib/useFilterPersistence';

export default function QueryStatusPage() {
  const { queryStatuses, addQueryStatus, updateQueryStatus, deleteQueryStatus } = useCrmStore();
  const savedFilters = useRef(loadPageFilters<any>('queryStatus')).current;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ addedBy: 'Admin', name: '', bookings: 0, master: true, status: 'Active' as 'Active' | 'Inactive' });
  const [sortBy, setSortBy] = useState(savedFilters?.sortBy || 'id_asc');
  const [currentPage, setCurrentPage] = useState(savedFilters?.currentPage || 1);
  const [perPage, setPerPage] = useState(savedFilters?.perPage || 50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist filters to sessionStorage
  useFilterPersistence('queryStatus', { sortBy, currentPage, perPage });

  const sorted = [...queryStatuses].sort((a, b) => {
    if (sortBy === 'id_asc') return a.id - b.id;
    if (sortBy === 'id_desc') return b.id - a.id;
    return 0;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ addedBy: 'Admin', name: '', bookings: 0, master: true, status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (qs: typeof queryStatuses[0]) => {
    setEditId(qs.id);
    setForm({ addedBy: qs.addedBy, name: qs.name, bookings: qs.bookings, master: qs.master, status: qs.status });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editId) {
      updateQueryStatus(editId, form);
    } else {
      addQueryStatus(form);
    }
    setShowModal(false);
  };

  const { currentUser } = useAuthStore();
  const canExport = currentUser?.permissions?.includes('Export Data') || ['Admin', 'Manager', 'Operation Manager', 'HR (Human Resource)'].includes(currentUser?.role || '');

  const exportCSV = () => {
    const headers = ['ID','Added By','Name','Bookings','Master','Status','Created','Modified'];
    const rows = sorted.map(qs => [qs.id,qs.addedBy,qs.name,qs.bookings,qs.master,qs.status,qs.created,qs.modified]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url; a.download = `Query_Statuses_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Mock import logic
    alert("Import functionality would process: " + file.name);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Query Statuses</h1>
          <p className="text-gray-500 text-sm mt-1">Manage query status categories</p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2">
                <Upload size={16} /> Import
              </button>
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
                <Download size={16} /> Export
              </button>
            </>
          )}
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Query Status
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field w-auto">
          <option value="id_asc">ID (asc)</option>
          <option value="id_desc">ID (desc)</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Added By</th>
                <th className="table-header">Name</th>
                <th className="table-header">Booking(s)</th>
                <th className="table-header">Master</th>
                <th className="table-header">Status</th>
                <th className="table-header">Created</th>
                <th className="table-header">Modified</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice((currentPage - 1) * perPage, currentPage * perPage).map((qs) => (
                <tr key={qs.id} className="hover:bg-gray-50/50">
                  <td className="table-cell font-medium">{qs.id}</td>
                  <td className="table-cell">{qs.addedBy}</td>
                  <td className="table-cell font-semibold text-gray-900">{qs.name}</td>
                  <td className="table-cell">{qs.bookings}</td>
                  <td className="table-cell">{qs.master ? 'Yes' : 'No'}</td>
                  <td className="table-cell">
                    <span className={`badge ${qs.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {qs.status}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{formatDateDMY(qs.created)}</td>
                  <td className="table-cell text-xs text-gray-500">{formatDateDMY(qs.modified)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(qs)} className="p-1 hover:bg-gray-100 rounded text-blue-600">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => {
                        if (confirm('Are you sure you want to delete this status?')) {
                          deleteQueryStatus(qs.id);
                        }
                      }} className="p-1 hover:bg-gray-100 rounded text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        totalItems={sorted.length}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editId ? 'Edit Query Status' : 'Add Query Status'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Name</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value as any})} className="select-field">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
