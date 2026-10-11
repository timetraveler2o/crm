import { useState, useEffect, useRef } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../types';
import { Plus, Edit2, Trash2, X, Shield, ToggleLeft, ToggleRight, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDateDMY } from '../lib/utils';
import Pagination from '../components/Pagination';
import { useFilterPersistence, loadPageFilters } from '../lib/useFilterPersistence';

const PERMISSION_GROUPS: { label: string; color: string; permissions: string[] }[] = [
  { label: 'Core Management', color: 'from-blue-500 to-indigo-600', permissions: ['Role Management', 'User Management', 'Query Status Management', 'Booking Management', 'Payment Authorization'] },
  { label: 'Booking Statuses', color: 'from-emerald-500 to-teal-600', permissions: ['Hold', 'Sold', 'Follow Up', 'New Query', 'Post Sale', 'Existing Booking', 'Callback'] },
  { label: 'Booking Actions', color: 'from-purple-500 to-pink-600', permissions: ['Send to QC', 'Date Change', 'Schedule Change', 'Cancellation', 'Closed Query', 'Variance'] },
  { label: 'System & Reports', color: 'from-amber-500 to-orange-600', permissions: ['Attendance', 'Edit Attendance', 'Reports', 'Login Activity', 'IP Whitelist', 'Export Data', 'Profile Edit'] },
  { label: 'Monitoring & Updates', color: 'from-cyan-500 to-blue-600', permissions: ['Break Monitoring', 'View All Breaks', 'Updates Management', 'Site Bookings', 'GPM Report'] },
];

export default function Roles() {
  const { roles, addRole, updateRole, deleteRole } = useCrmStore();
  const { currentUser } = useAuthStore();
  const savedFilters = useRef(loadPageFilters<any>('roles')).current;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ addedBy: '', roleName: '', permissions: [] as string[], status: 'Active' as 'Active' | 'Inactive' });
  const [sortBy, setSortBy] = useState(savedFilters?.sortBy || 'id_asc');
  const [perPage, setPerPage] = useState(savedFilters?.perPage || 50);
  const [currentPage, setCurrentPage] = useState(savedFilters?.currentPage || 1);

  // Persist filters to sessionStorage
  useFilterPersistence('roles', { sortBy, perPage, currentPage });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const sorted = [...roles].sort((a, b) => {
    if (sortBy === 'id_asc') return a.id - b.id;
    if (sortBy === 'id_desc') return b.id - a.id;
    return 0;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ addedBy: 'Admin', roleName: '', permissions: [], status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (r: typeof roles[0]) => {
    setEditId(r.id);
    const perms = Array.isArray(r.permissions) ? [...r.permissions] : [];
    setForm({ addedBy: r.addedBy, roleName: r.roleName, permissions: perms, status: r.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.roleName.trim()) {
      setToast({ type: 'error', message: 'Role name is required' });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateRole(editId, form);
        setToast({ type: 'success', message: `Role "${form.roleName}" updated with ${form.permissions.length} permissions` });
      } else {
        await addRole(form);
        setToast({ type: 'success', message: `Role "${form.roleName}" created successfully` });
      }
      setShowModal(false);
    } catch (err) {
      console.error('Save failed:', err);
      setToast({ type: 'error', message: 'Failed to save role. Please try again.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      setConfirmDeleteId(null);
      setToast({ type: 'success', message: 'Role deleted' });
    } catch {
      setToast({ type: 'error', message: 'Failed to delete role' });
    }
  };

  const togglePerm = (p: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter(x => x !== p)
        : [...f.permissions, p]
    }));
  };

  const selectAllInGroup = (perms: string[]) => {
    setForm(f => ({ ...f, permissions: [...new Set([...f.permissions, ...perms])] }));
  };

  const deselectAllInGroup = (perms: string[]) => {
    setForm(f => ({ ...f, permissions: f.permissions.filter(x => !perms.includes(x)) }));
  };

  const selectAll = () => setForm(f => ({ ...f, permissions: [...PERMISSIONS] }));
  const deselectAll = () => setForm(f => ({ ...f, permissions: [] }));

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield size={20} className="text-white" />
            </div>
            Roles & Permissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage user roles and permissions ({roles.length} roles)</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Role
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select-field w-auto">
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
                <th className="table-header">Role Name</th>
                <th className="table-header">Permissions</th>
                <th className="table-header">Status</th>
                <th className="table-header">Created</th>
                <th className="table-header">Modified</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice((currentPage - 1) * perPage, currentPage * perPage).map(r => {
                const perms = Array.isArray(r.permissions) ? r.permissions : [];
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="table-cell font-medium">{r.id}</td>
                    <td className="table-cell">{r.addedBy}</td>
                    <td className="table-cell font-semibold text-gray-900">{r.roleName}</td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {perms.length > 0 ? perms.map(p => (
                          <span key={p} className="inline-block bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium">{p}</span>
                        )) : <span className="text-gray-400 text-xs">No permissions</span>}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{r.status}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{formatDateDMY(r.created)}</td>
                    <td className="table-cell text-xs text-gray-500">{formatDateDMY(r.modified)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                        {(['Admin', 'HR (Human Resource)', 'IT', 'IT (Information Tech)'].includes(currentUser?.role || '')) && (
                        <button onClick={() => setConfirmDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
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

      <Pagination
        totalItems={sorted.length}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
      />

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Role' : 'Add New Role'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-200"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                  <input value={form.roleName} onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))} className="input-field" placeholder="Enter role name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="select-field">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-800">
                    Permissions ({form.permissions.length} / {PERMISSIONS.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">Select All</button>
                    <button type="button" onClick={deselectAll} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50">Clear All</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {PERMISSION_GROUPS.map(group => {
                    const activeCount = group.permissions.filter(p => form.permissions.includes(p)).length;
                    const allOn = activeCount === group.permissions.length;
                    return (
                      <div key={group.label} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className={`px-4 py-2.5 bg-gradient-to-r ${group.color} text-white flex items-center justify-between`}>
                          <span className="text-sm font-bold">{group.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{activeCount}/{group.permissions.length}</span>
                            <button
                              type="button"
                              onClick={() => allOn ? deselectAllInGroup(group.permissions) : selectAllInGroup(group.permissions)}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors"
                            >
                              {allOn ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        </div>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {group.permissions.map(p => {
                            const isOn = form.permissions.includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => togglePerm(p)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                                  isOn
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium'
                                    : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                                }`}
                              >
                                {isOn ? <ToggleRight size={18} className="text-emerald-600 flex-shrink-0" /> : <ToggleLeft size={18} className="text-gray-400 flex-shrink-0" />}
                                <span className="truncate">{p}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Role</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Role?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">Cancel</button>
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
