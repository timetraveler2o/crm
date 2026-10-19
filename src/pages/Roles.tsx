import { useState, useEffect, useRef, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS, Role } from '../types';
import { 
  Plus, Edit2, Trash2, X, Shield, ToggleLeft, ToggleRight, Save, 
  Loader2, CheckCircle, AlertCircle, History, Search, Filter, 
  Layers, Users, Check, Clock, UserCheck
} from 'lucide-react';
import { formatDateDMY, formatDateTimeDMY } from '../lib/utils';
import Pagination from '../components/Pagination';
import { useFilterPersistence, loadPageFilters } from '../lib/useFilterPersistence';

export const PERMISSION_GROUPS: { label: string; color: string; permissions: string[] }[] = [
  { 
    label: 'Core Management', 
    color: 'from-blue-500 to-indigo-600', 
    permissions: ['Role Management', 'User Management', 'Query Status Management', 'Booking Management', 'Site Bookings', 'Payment Authorization'] 
  },
  { 
    label: 'Booking Statuses', 
    color: 'from-emerald-500 to-teal-600', 
    permissions: ['Hold', 'Sold', 'Follow Up', 'New Query', 'Post Sale', 'Existing Booking', 'Callback'] 
  },
  { 
    label: 'Booking Actions', 
    color: 'from-purple-500 to-pink-600', 
    permissions: ['Send to QC', 'Date Change', 'Schedule Change', 'Cancellation', 'Closed Query', 'Variance'] 
  },
  { 
    label: 'System & Reports', 
    color: 'from-amber-500 to-orange-600', 
    permissions: ['Attendance', 'Edit Attendance', 'Reports', 'GPM Report', 'Login Activity', 'IP Whitelist', 'Export Data', 'Profile Edit', 'Payslip'] 
  },
  { 
    label: 'Monitoring & Updates', 
    color: 'from-cyan-500 to-blue-600', 
    permissions: ['Break Monitoring', 'View All Breaks', 'Updates Management'] 
  },
];

export default function Roles() {
  const { roles, addRole, updateRole, deleteRole, users, auditLogs, fetchAuditLogs, addAuditLog } = useCrmStore();
  const { currentUser } = useAuthStore();
  const savedFilters = useRef(loadPageFilters<any>('roles')).current;
  
  const [activeTab, setActiveTab] = useState<'roles' | 'audit'>('roles');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ 
    addedBy: '', 
    roleName: '', 
    permissions: [] as string[], 
    status: 'Active' as 'Active' | 'Inactive',
    company: 'Get Set Flight'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(savedFilters?.sortBy || 'id_asc');
  const [perPage, setPerPage] = useState(savedFilters?.perPage || 50);
  const [currentPage, setCurrentPage] = useState(savedFilters?.currentPage || 1);

  // Audit logs search and filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'All' | 'Role' | 'User'>('All');

  // Persist filters to sessionStorage
  useFilterPersistence('roles', { sortBy, perPage, currentPage });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Statistics
  const stats = useMemo(() => {
    const total = roles.length;
    const active = roles.filter(r => r.status === 'Active').length;
    const assignedUsers = users.length;
    return { total, active, assignedUsers, totalPerms: PERMISSIONS.length };
  }, [roles, users]);

  // Filtered & Sorted Roles
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return r.roleName.toLowerCase().includes(term) || (r.addedBy || '').toLowerCase().includes(term);
    }).sort((a, b) => {
      if (sortBy === 'id_asc') return a.id - b.id;
      if (sortBy === 'id_desc') return b.id - a.id;
      return a.roleName.localeCompare(b.roleName);
    });
  }, [roles, searchTerm, sortBy]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return (auditLogs || []).filter(log => {
      if (auditTypeFilter !== 'All' && log.targetType !== auditTypeFilter) return false;
      if (!auditSearch) return true;
      const s = auditSearch.toLowerCase();
      return (
        (log.action || '').toLowerCase().includes(s) ||
        (log.performedBy || '').toLowerCase().includes(s) ||
        (log.targetName || '').toLowerCase().includes(s) ||
        (log.details || '').toLowerCase().includes(s)
      );
    });
  }, [auditLogs, auditTypeFilter, auditSearch]);

  const canManageRoles = ['admin', 'super admin', 'superuser', 'hr', 'hr (human resource)'].includes((currentUser?.role || '').toLowerCase()) ||
    (currentUser?.permissions || []).includes('Role Management');

  const openAdd = () => {
    setEditId(null);
    setForm({ 
      addedBy: currentUser?.name || 'Admin', 
      roleName: '', 
      permissions: [], 
      status: 'Active',
      company: currentUser?.company || 'Get Set Flight'
    });
    setShowModal(true);
  };

  const openEdit = (r: Role) => {
    setEditId(r.id);
    const perms = Array.isArray(r.permissions) ? [...r.permissions] : [];
    setForm({ 
      addedBy: r.addedBy, 
      roleName: r.roleName, 
      permissions: perms, 
      status: r.status,
      company: r.company || 'Get Set Flight'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.roleName.trim()) {
      setToast({ type: 'error', message: 'Role name is required' });
      return;
    }
    setSaving(true);
    const now = new Date().toLocaleString('en-IN');
    const performedByName = `${currentUser?.name || 'Admin'} (${currentUser?.role || 'Admin'})`;
    const performedRole = currentUser?.role || 'Admin';

    try {
      if (editId) {
        const existingRole = roles.find(r => r.id === editId);
        const oldPerms = existingRole?.permissions || [];
        const addedPerms = form.permissions.filter(p => !oldPerms.includes(p));
        const removedPerms = oldPerms.filter(p => !form.permissions.includes(p));
        
        let details = `Updated role "${form.roleName}". Total permissions: ${form.permissions.length}.`;
        if (addedPerms.length > 0 || removedPerms.length > 0) {
          const parts: string[] = [];
          if (addedPerms.length > 0) parts.push(`Granted: [${addedPerms.join(', ')}]`);
          if (removedPerms.length > 0) parts.push(`Revoked: [${removedPerms.join(', ')}]`);
          details = parts.join('; ');
        }

        await updateRole(editId, form);
        
        // Log to audit trail
        await addAuditLog({
          timestamp: now,
          action: 'Role Permissions Updated',
          performedBy: performedByName,
          performedByRole: performedRole,
          targetType: 'Role',
          targetId: String(editId),
          targetName: form.roleName,
          details,
          changes: JSON.stringify({ old: oldPerms, new: form.permissions, added: addedPerms, removed: removedPerms })
        });

        setToast({ type: 'success', message: `Role "${form.roleName}" updated successfully` });
      } else {
        await addRole(form);

        // Log to audit trail
        await addAuditLog({
          timestamp: now,
          action: 'Role Created',
          performedBy: performedByName,
          performedByRole: performedRole,
          targetType: 'Role',
          targetName: form.roleName,
          details: `Created new role "${form.roleName}" with ${form.permissions.length} initial permissions.`,
          changes: JSON.stringify({ permissions: form.permissions })
        });

        setToast({ type: 'success', message: `Role "${form.roleName}" created successfully` });
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Save failed:', err);
      setToast({ type: 'error', message: err?.message || 'Failed to save role. Please try again.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const roleToDelete = roles.find(r => r.id === id);
    if (!roleToDelete) return;

    // Prevent deletion of protected admin role
    if (['admin', 'super admin'].includes(roleToDelete.roleName.toLowerCase())) {
      setToast({ type: 'error', message: 'System Admin role cannot be deleted' });
      setConfirmDeleteId(null);
      return;
    }

    try {
      await deleteRole(id);
      
      // Log to audit trail
      await addAuditLog({
        timestamp: new Date().toLocaleString('en-IN'),
        action: 'Role Deleted',
        performedBy: `${currentUser?.name || 'Admin'} (${currentUser?.role || 'Admin'})`,
        performedByRole: currentUser?.role || 'Admin',
        targetType: 'Role',
        targetId: String(id),
        targetName: roleToDelete.roleName,
        details: `Deleted role "${roleToDelete.roleName}".`,
        changes: JSON.stringify(roleToDelete)
      });

      setConfirmDeleteId(null);
      setToast({ type: 'success', message: `Role "${roleToDelete.roleName}" deleted` });
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield size={20} className="text-white" />
            </div>
            Roles & Permissions Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Configure role levels, custom roles, fine-grained access control, and review audit trail</p>
        </div>
        {canManageRoles && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
            <Plus size={16} /> Add Custom Role
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Roles</div>
            <div className="text-xl font-bold text-gray-900">{stats.total}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Check size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Active Roles</div>
            <div className="text-xl font-bold text-gray-900">{stats.active}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-purple-500">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Permissions Pool</div>
            <div className="text-xl font-bold text-gray-900">{stats.totalPerms}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Users with Roles</div>
            <div className="text-xl font-bold text-gray-900">{stats.assignedUsers}</div>
          </div>
        </div>
      </div>

      
      {/* 2FA Login OTP Security Control (Admin only) */}
      {isMasterAdmin && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isOtpEnabled 
            ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-blue-200' 
            : 'bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-amber-200'
        } shadow-xs`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isOtpEnabled ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
              }`}>
                <KeyRound size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Login Two-Factor Authentication (2FA OTP)</h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isOtpEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {isOtpEnabled ? '● 2FA Active (OTP Required)' : '○ Disabled (Direct Password Login)'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isOtpEnabled 
                    ? 'All users must verify a 6-digit OTP sent to their email when logging in.' 
                    : 'OTP is currently OFF. Users sign in instantly with their email and password without waiting for an email code.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleToggleLoginOtp}
                disabled={togglingOtp}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                  isOtpEnabled 
                    ? 'bg-white text-rose-600 border border-rose-300 hover:bg-rose-50' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/25'
                }`}
              >
                {togglingOtp ? (
                  <>
                    <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : isOtpEnabled ? (
                  <>
                    <span>Turn OFF Login OTP</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Turn ON Login OTP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield size={16} /> Roles & Access Matrix ({roles.length})
        </button>
        <button
          onClick={() => { setActiveTab('audit'); fetchAuditLogs(); }}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} /> Permission Audit Logs ({auditLogs?.length || 0})
        </button>
      </div>

      {/* TAB 1: Roles List */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search roles..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select-field text-xs py-1.5 w-auto">
                <option value="id_asc">ID (Oldest first)</option>
                <option value="id_desc">ID (Newest first)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b-2 border-gray-300">
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Role Name</th>
                    <th className="table-header">Added By</th>
                    <th className="table-header">Permissions Configured</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Last Modified</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRoles.slice((currentPage - 1) * perPage, currentPage * perPage).map((r, idx) => {
                    const perms = Array.isArray(r.permissions) ? r.permissions : [];
                    const isMasterAdmin = ['admin', 'super admin'].includes(r.roleName.toLowerCase());
                    const isSeniorConsultant = r.roleName.toLowerCase().includes('sr. travel') || r.roleName.toLowerCase().includes('senior travel');
                    const isConsultant = r.roleName.toLowerCase().includes('travel executive') || r.roleName.toLowerCase().includes('travel consultant') || r.roleName.toLowerCase() === 'agent';
                    
                    return (
                      <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="table-cell font-medium text-gray-400">{(currentPage - 1) * perPage + idx + 1}</td>
                        <td className="table-cell font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{r.roleName}</span>
                            {isMasterAdmin && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold uppercase">Super Access</span>
                            )}
                            {isSeniorConsultant && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Senior</span>
                            )}
                            {isConsultant && !isSeniorConsultant && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Standard</span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell text-sm text-gray-600">{r.addedBy || 'System'}</td>
                        <td className="table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                                {perms.length} Permissions Active
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {perms.slice(0, 5).map(p => (
                                <span key={p} className="inline-block bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                  {p}
                                </span>
                              ))}
                              {perms.length > 5 && (
                                <span className="text-[10px] text-gray-400 font-medium px-1">
                                  +{perms.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-gray-500">{formatDateDMY(r.modified || r.created)}</td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canManageRoles && (
                              <button 
                                onClick={() => openEdit(r)} 
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" 
                                title="Edit Role & Permissions"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canManageRoles && !isMasterAdmin && (
                              <button 
                                onClick={() => setConfirmDeleteId(r.id)} 
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" 
                                title="Delete Custom Role"
                              >
                                <Trash2 size={16} />
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

          <Pagination
            totalItems={filteredRoles.length}
            currentPage={currentPage}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}

      {/* TAB 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by admin, user, or action..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Filter Type:</span>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                {(['All', 'Role', 'User'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setAuditTypeFilter(t)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      auditTypeFilter === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden shadow-sm">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <History size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="font-semibold text-gray-700">No audit logs recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Changes made to roles or user permissions will appear here with full time and date stamps.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAuditLogs.map((log) => {
                  const isRole = log.targetType === 'Role';
                  return (
                    <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            log.action.includes('Created') ? 'bg-emerald-100 text-emerald-800' :
                            log.action.includes('Deleted') ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                            {isRole ? <Shield size={12} className="text-blue-500" /> : <UserCheck size={12} className="text-emerald-500" />}
                            {log.targetType}: <strong className="text-gray-900">{log.targetName}</strong>
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {log.timestamp || log.created}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-1">{log.details}</p>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Modified by: <strong className="text-gray-600">{log.performedBy}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / Add Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Role & Permissions' : 'Create Custom Role'}</h2>
                  <p className="text-xs text-gray-500">Configure role name and toggle access permissions</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role Name *</label>
                  <input 
                    value={form.roleName} 
                    onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))} 
                    className="input-field" 
                    placeholder="e.g. Travel Executive, Sr. Travel Executive, Operations..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select 
                    value={form.status} 
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} 
                    className="select-field"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-sm font-bold text-gray-900">
                      Permissions Configuration
                    </label>
                    <span className="text-xs text-blue-600 font-semibold">
                      {form.permissions.length} of {PERMISSIONS.length} permissions granted
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={selectAll} 
                      className="text-xs text-blue-700 hover:text-blue-900 font-bold px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Select All
                    </button>
                    <button 
                      type="button" 
                      onClick={deselectAll} 
                      className="text-xs text-red-600 hover:text-red-800 font-bold px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {PERMISSION_GROUPS.map(group => {
                    const activeCount = group.permissions.filter(p => form.permissions.includes(p)).length;
                    const allOn = activeCount === group.permissions.length;
                    return (
                      <div key={group.label} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className={`px-4 py-2.5 bg-gradient-to-r ${group.color} text-white flex items-center justify-between`}>
                          <span className="text-sm font-bold">{group.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">{activeCount}/{group.permissions.length}</span>
                            <button
                              type="button"
                              onClick={() => allOn ? deselectAllInGroup(group.permissions) : selectAllInGroup(group.permissions)}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors"
                            >
                              {allOn ? 'Deselect Group' : 'Select Group'}
                            </button>
                          </div>
                        </div>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                          {group.permissions.map(p => {
                            const isOn = form.permissions.includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => togglePerm(p)}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                                  isOn
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <span className="truncate mr-2">{p}</span>
                                {isOn ? (
                                  <ToggleRight size={22} className="text-emerald-600 flex-shrink-0" />
                                ) : (
                                  <ToggleLeft size={22} className="text-gray-400 flex-shrink-0" />
                                )}
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
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="btn-primary flex items-center gap-2 disabled:opacity-50 shadow-md"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving Role & Permissions...</>
                ) : (
                  <><Save size={16} /> Save Role</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Custom Role?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This action will permanently delete this role. Users assigned to this role will need to be reassigned.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(confirmDeleteId)} 
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
