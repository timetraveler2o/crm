import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { ROLE_NAMES, PERMISSIONS } from '../types';
import { PERMISSION_GROUPS } from './Roles';
import { COMPANIES } from '../types';
import type { AmadeusCredential } from '../types';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';
import { Plus, Edit2, Trash2, X, Search, Download, Lock, Loader2, Upload, FileText, Printer, Camera, UserCheck, UserX, Eye, EyeOff, Globe, Shield, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { uploadFile, uploadImage, getImageUrl, API_BASE_URL } from '../lib/api';
import { formatDateDMY } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFilterPersistence, loadPageFilters } from '../lib/useFilterPersistence';

// Force-download helper: fetch blob and trigger download
async function forceDownload(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, roles, addAuditLog } = useCrmStore();

  const availableRoles = useMemo(() => {
    const dynamicRoles = (roles || []).filter(r => r.status === 'Active').map(r => r.roleName);
    return Array.from(new Set([...ROLE_NAMES, ...dynamicRoles]));
  }, [roles]);

  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<typeof users[0] | null>(null);
  const [userPermsList, setUserPermsList] = useState<string[]>([]);
  const [savingUserPerms, setSavingUserPerms] = useState(false);
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showAmadeusViewModal, setShowAmadeusViewModal] = useState(false);
  const [viewAmadeusUser, setViewAmadeusUser] = useState<typeof users[0] | null>(null);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [passwordUserName, setPasswordUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    addedBy: 'Admin',
    name: '',
    role: 'Travel Consultant',
    email: '',
    phone: '',
    emergencyNumber: '',
    currentAddress: '',
    permanentAddress: '',
    gender: 'Male' as any,
    status: 'Active' as any,
    password: '',
    company: 'Get Set Flight',
    aadharCard: '',
    panCard: '',
    image: '',
    amadeusCreds: [] as AmadeusCredential[]
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const savedFilters = useRef(loadPageFilters<any>('users')).current;
  const [filters, setFilters] = useState(savedFilters?.filters || { name: '', email: '', phone: '', role: '', gender: '', status: '', fromDate: '', toDate: '' });
  const [sortBy, setSortBy] = useState(savedFilters?.sortBy || 'id_asc');
  const [perPage, setPerPage] = useState(savedFilters?.perPage || 50);
  const [currentPage, setCurrentPage] = useState(savedFilters?.currentPage || 1);

  // Persist filters to sessionStorage
  useFilterPersistence('users', { filters, sortBy, perPage, currentPage });

  // Check if current user can manage passwords
  const canManagePasswords = ['Admin', 'Supervisor', 'Manager', 'Operation Manager', 'HR (Human Resource)'].includes(currentUser?.role || '');

  const canManagePermissions = ['admin', 'super admin', 'superuser', 'hr', 'hr (human resource)'].includes((currentUser?.role || '').toLowerCase()) ||
    (currentUser?.permissions || []).includes('User Management');

  const openManageUserPermissions = (u: typeof users[0]) => {
    setSelectedUserForPerms(u);
    if (u.permissions && Array.isArray(u.permissions) && u.permissions.length > 0) {
      setUserPermsList([...u.permissions]);
    } else {
      const roleObj = (roles || []).find(r => r.roleName.toLowerCase() === (u.role || '').toLowerCase());
      const rolePerms = roleObj && Array.isArray(roleObj.permissions) ? roleObj.permissions : [];
      setUserPermsList([...rolePerms]);
    }
    setShowPermissionsModal(true);
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUserForPerms) return;
    setSavingUserPerms(true);
    try {
      const now = new Date().toLocaleString('en-IN');
      const performedByName = `${currentUser?.name || 'Admin'} (${currentUser?.role || 'Admin'})`;
      const performedRole = currentUser?.role || 'Admin';

      const roleObj = (roles || []).find(r => r.roleName.toLowerCase() === (selectedUserForPerms.role || '').toLowerCase());
      const rolePerms = roleObj && Array.isArray(roleObj.permissions) ? roleObj.permissions : [];

      const oldPerms = (selectedUserForPerms.permissions && selectedUserForPerms.permissions.length > 0)
        ? selectedUserForPerms.permissions
        : rolePerms;
      const addedPerms = userPermsList.filter(p => !oldPerms.includes(p));
      const removedPerms = oldPerms.filter(p => !userPermsList.includes(p));

      let details = `Updated permissions for user "${selectedUserForPerms.name}" (${selectedUserForPerms.role}). Total active: ${userPermsList.length}.`;
      if (addedPerms.length > 0 || removedPerms.length > 0) {
        const parts: string[] = [];
        if (addedPerms.length > 0) parts.push(`Granted: [${addedPerms.join(', ')}]`);
        if (removedPerms.length > 0) parts.push(`Revoked: [${removedPerms.join(', ')}]`);
        details = parts.join('; ');
      }

      await updateUser(selectedUserForPerms.id, {
        permissions: userPermsList,
        modified: now
      });

      await addAuditLog({
        timestamp: now,
        action: 'User Permissions Modified',
        performedBy: performedByName,
        performedByRole: performedRole,
        targetType: 'User',
        targetId: String(selectedUserForPerms.id),
        targetName: selectedUserForPerms.name,
        details,
        changes: JSON.stringify({ old: oldPerms, new: userPermsList, added: addedPerms, removed: removedPerms })
      });

      if (currentUser?.id === selectedUserForPerms.id) {
        useAuthStore.setState({
          currentUser: {
            ...currentUser,
            permissions: userPermsList
          }
        });
      }

      setShowPermissionsModal(false);
    } catch (e: any) {
      alert('Failed to update permissions: ' + (e?.message || 'Error'));
    }
    setSavingUserPerms(false);
  };


  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;

  const companyUsers = users.filter(u => {
    if (!u.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return u.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return u.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
    return false;
  });

  const filtered = companyUsers.filter(u => {
    if (filters.name && !u.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.email && !u.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.phone && !u.phone.includes(filters.phone)) return false;
    if (filters.role && u.role !== filters.role) return false;
    if (filters.gender && u.gender !== filters.gender) return false;
    if (filters.status && u.status !== filters.status) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'id_asc') return a.id - b.id;
    if (sortBy === 'id_desc') return b.id - a.id;
    return 0;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({
      addedBy: currentUser?.name || 'Admin',
      name: '',
      role: 'Travel Consultant',
      email: '',
      phone: '',
      emergencyNumber: '',
      currentAddress: '',
      permanentAddress: '',
      gender: 'Male',
      status: 'Active',
      password: '',
      company: 'Get Set Flight',
      aadharCard: '',
      panCard: '',
      image: '',
      amadeusCreds: []
    });
    setShowModal(true);
  };

  const openEdit = (u: typeof users[0]) => {
    setEditId(u.id);
    setForm({
      addedBy: u.addedBy,
      name: u.name,
      role: u.role,
      email: u.email,
      phone: u.phone,
      emergencyNumber: u.emergencyNumber || '',
      currentAddress: u.currentAddress || '',
      permanentAddress: u.permanentAddress || '',
      gender: u.gender,
      status: u.status,
      password: '',
      company: (u as any).company || 'Get Set Flight',
      aadharCard: u.aadharCard || '',
      panCard: u.panCard || '',
      image: u.image || '',
      amadeusCreds: u.amadeusCreds || []
    });
    setShowModal(true);
  };

  const openChangePassword = (u: typeof users[0]) => {
    setPasswordUserId(u.id);
    setPasswordUserName(u.name);
    setNewUserPassword('');
    setPasswordSuccess('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editId) {
      const { password, ...rest } = form;
      const updateData = password ? { ...rest, password } : rest;
      updateUser(editId, updateData);
    } else {
      if (!form.password) return;
      addUser(form);
    }
    setShowModal(false);
  };

  // Auto email suffix based on company selection
  const handleCompanyChange = (company: string) => {
    const emailSuffixes: Record<string, string> = {
      'Get Set Flight': '@getsetflight.com',
      'Look Book Ticket': '@lookbookticket.com',
      'Traveloboom': '@Traveloboom.com',
    };
    const suffix = emailSuffixes[company] || '@getsetflight.com';
    const currentEmail = form.email;
    // Only suggest suffix if email is empty or just has a suffix already
    const emailBase = currentEmail.includes('@') ? currentEmail.split('@')[0] : currentEmail;
    setForm(f => ({ ...f, company, email: emailBase ? `${emailBase}${suffix}` : '' }));
  };

  const handlePasswordUpdate = async () => {
    if (!passwordUserId || !newUserPassword) return;
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newUserPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    try {
      await updateUser(passwordUserId, { password: newUserPassword });
      setPasswordSuccess('Password updated successfully');
      setNewUserPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      setPasswordError('Failed to update password');
    }
  };

  const exportCSV = () => {
    const headers = ['ID','Added By','Name','Role','Email','Phone','Emergency Phone','Current Address','Permanent Address','Gender','Status','Created','Modified','Aadhar Card','PAN Card'];
    const rows = filtered.map(u => [
      u.id, u.addedBy, u.name, u.role, u.email, u.phone,
      u.emergencyNumber || '',
      u.currentAddress || '',
      u.permanentAddress || '',
      u.gender, u.status, u.created, u.modified,
      u.aadharCard ? 'Yes' : 'No',
      u.panCard ? 'Yes' : 'No'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url; a.download = `Users_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const headers = ['ID','Added By','Name','Role','Email','Phone','Emergency No','Status','Aadhar','PAN'];
    const rows = filtered.map(u => [
      u.id, u.addedBy, u.name, u.role, u.email, u.phone,
      u.emergencyNumber || '—',
      u.status,
      u.aadharCard ? 'Yes' : 'No',
      u.panCard ? 'Yes' : 'No'
    ]);
    autoTable(doc, {
      head: [headers],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      theme: 'grid'
    });
    const today = new Date().toISOString().split('T')[0];
    doc.save(`Users_${today}.pdf`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'aadharCard' | 'panCard' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(type);
    try {
      const path = await uploadFile(file);
      setForm(f => ({ ...f, [type]: path }));
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
    } finally {
      setUploadingDoc(null);
    }
  };

  const DocumentField = ({ label, type, value, icon: Icon }: { label: string, type: 'aadharCard' | 'panCard' | 'resume', value: string, icon: any }) => {
    const [resolvedUrl, setResolvedUrl] = useState('');
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
      if (value) {
        if (value.startsWith('http') || value.startsWith('data:')) {
          setResolvedUrl(value);
        } else {
          setResolving(true);
          getImageUrl(value).then(url => {
            setResolvedUrl(url || '');
            setResolving(false);
          }).catch(() => setResolving(false));
        }
      } else {
        setResolvedUrl('');
      }
    }, [value]);

    const handleView = (e: React.MouseEvent) => {
      e.preventDefault();
      if (resolvedUrl) {
        window.open(resolvedUrl, '_blank');
      }
    };

    const handleDownload = (e: React.MouseEvent) => {
      e.preventDefault();
      if (resolvedUrl) {
        forceDownload(resolvedUrl, `${label.replace(/\s/g, '-').toLowerCase()}.${value.includes('.pdf') ? 'pdf' : 'jpg'}`);
      }
    };

    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Icon size={16} /> {label}
          </label>
          {value && (
            <div className="flex items-center gap-2">
              {resolving ? (
                <Loader2 size={12} className="animate-spin text-gray-400" />
              ) : (
                <>
                  <button onClick={handleView} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Eye size={12} /> View
                  </button>
                  <button onClick={handleDownload} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                    <Download size={12} /> Download
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={value ? "File uploaded" : "No file chosen"} 
            disabled 
            className="input-field text-sm bg-white" 
          />
          <label className="btn-secondary whitespace-nowrap cursor-pointer">
            {uploadingDoc === type ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="hidden sm:inline ml-2">Upload</span>
            <input 
              type="file" 
              className="hidden" 
              accept={type === 'resume' ? ".pdf,.doc,.docx" : "image/*,.pdf"} 
              onChange={(e) => handleFileUpload(e, type)} 
              disabled={!!uploadingDoc} 
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage CRM users ({filtered.length} total)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> CSV
          </button>
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> PDF
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <input placeholder="Name" value={filters.name} onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))} className="input-field" />
          <input placeholder="Email" value={filters.email} onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))} className="input-field" />
          <input placeholder="Phone" value={filters.phone} onChange={(e) => setFilters(f => ({ ...f, phone: e.target.value }))} className="input-field" />
          <select value={filters.role} onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))} className="select-field">
            <option value="">All Roles</option>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.gender} onChange={(e) => setFilters(f => ({ ...f, gender: e.target.value }))} className="select-field">
            <option value="">All Genders</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="select-field">
            <option value="">All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <input type="date" value={filters.fromDate} onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value }))} className="input-field" placeholder="From Date" />
          <input type="date" value={filters.toDate} onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value }))} className="input-field" placeholder="To Date" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field">
            <option value="id_asc">ID (asc)</option>
            <option value="id_desc">ID (desc)</option>
          </select>
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} className="select-field">
            <option value={30}>30 Per Page</option>
            <option value={50}>50 Per Page</option>
            <option value={100}>100 Per Page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Added By</th>
                <th className="table-header">Name</th>
                <th className="table-header">Role</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Status</th>
                <th className="table-header">Created</th>
                <th className="table-header">Modified</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((currentPage - 1) * perPage, currentPage * perPage).map((u, idx) => (
                <tr key={u.id} className={`hover:bg-gray-50/50 ${u.status === 'Inactive' ? 'opacity-60 bg-red-50/30' : ''}`}>
                  <td className="table-cell font-medium">{(currentPage - 1) * perPage + idx + 1}</td>
                  <td className="table-cell text-xs text-gray-500">{u.addedBy}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.image} name={u.name} className="w-7 h-7" />
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="table-cell"><span className="badge bg-blue-50 text-blue-700">{u.role}</span></td>
                  <td className="table-cell text-xs">{u.email}</td>
                  <td className="table-cell text-xs">{u.phone}</td>
                  <td className="table-cell">
                    <span className={`badge ${u.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{u.status}</span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{formatDateDMY(u.created)}</td>
                  <td className="table-cell text-xs text-gray-500">{formatDateDMY(u.modified)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 size={14} /></button>
                      {canManagePermissions && (
                        <button onClick={() => openManageUserPermissions(u)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600" title="Manage Custom Permissions">
                          <Shield size={14} />
                        </button>
                      )}
                      {canManagePasswords && (
                        <button onClick={() => openChangePassword(u)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Change Password"><Lock size={14} /></button>
                      )}
                      {/* Activate / Deactivate toggle */}
                      {(['Admin', 'HR (Human Resource)', 'IT', 'IT (Information Tech)'].includes(currentUser?.role || '')) && (
                        <button
                          onClick={() => {
                            const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
                            if (confirm(`${newStatus === 'Inactive' ? 'Deactivate' : 'Activate'} user ${u.name}?`)) {
                              updateUser(u.id, { status: newStatus, modified: new Date().toLocaleString() });
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${u.status === 'Active' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'}`}
                          title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.status === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                      {(['Admin', 'HR (Human Resource)', 'IT', 'IT (Information Tech)'].includes(currentUser?.role || '')) && (
                      <button onClick={() => { if (confirm('Delete this user?')) deleteUser(u.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        totalItems={filtered.length}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editId ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Profile Image Upload */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar src={form.image} name={form.name || 'User'} className="w-16 h-16" textSize="text-xl" />
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                    {uploadingImage ? (
                      <Loader2 size={14} className="text-white animate-spin" />
                    ) : (
                      <Camera size={14} className="text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingImage(true);
                          try {
                            const path = await uploadImage(file);
                            if (path) {
                              // Store the R2 path (not presigned URL) so Avatar can resolve fresh URLs each time
                              setForm(f => ({ ...f, image: path }));
                            }
                          } catch (err) {
                            console.error('Profile upload failed:', err);
                          }
                          setUploadingImage(false);
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                  <p className="text-xs text-gray-400">Click camera icon to upload</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} className="select-field">
                    {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select
                  value={form.company}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="select-field"
                >
                  <option value="Get Set Flight">✈️ Get Set Flight</option>
                  <option value="Look Book Ticket">🌍 Look Book Ticket</option>
                  <option value="Traveloboom">🏠 Traveloboom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder={
                  form.company === 'Look Book Ticket' ? 'name@lookbookticket.com' : 
                  form.company === 'Traveloboom' ? 'name@Traveloboom.com' : 'name@getsetflight.com'
                } />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="Primary phone number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Number</label>
                  <input value={form.emergencyNumber} onChange={(e) => setForm(f => ({ ...f, emergencyNumber: e.target.value }))} className="input-field" placeholder="Emergency contact number" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                <textarea rows={2} value={form.currentAddress} onChange={(e) => setForm(f => ({ ...f, currentAddress: e.target.value }))} className="input-field" placeholder="Present / current residential address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                <textarea rows={2} value={form.permanentAddress} onChange={(e) => setForm(f => ({ ...f, permanentAddress: e.target.value }))} className="input-field" placeholder="Permanent home address" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value as any }))} className="select-field">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))} className="select-field">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {!editId && '*'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder={editId ? "Leave blank to keep current" : "Set password"} />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Documents</h3>
                <div className="space-y-3">
                  <DocumentField label="Aadhar Card" type="aadharCard" value={form.aadharCard} icon={FileText} />
                  <DocumentField label="PAN Card" type="panCard" value={form.panCard} icon={FileText} />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Lock size={18} /> Change Password
              </h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">Setting new password for: <strong>{passwordUserName}</strong></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <div className="relative">
                  <input 
                    type={showUserPassword ? 'text' : 'password'} 
                    value={newUserPassword} 
                    onChange={(e) => setNewUserPassword(e.target.value)} 
                    className="input-field pr-10" 
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">{passwordSuccess}</div>
              )}
            </div>\n            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handlePasswordUpdate} className="btn-primary" disabled={!newUserPassword || newUserPassword.length < 6}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
