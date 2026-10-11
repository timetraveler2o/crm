import { useState, useEffect, useMemo, useRef } from 'react';
import { Download, FileText, RefreshCw, Search, Trash2 } from 'lucide-react';
import { client } from '../lib/api';
import { LoginActivity as LoginActivityType } from '../types';
import { useAuthStore } from '../store/authStore';
import { useCrmStore } from '../store/crmStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTimeDMY, formatDateDMY } from '../lib/utils';
import Pagination from '../components/Pagination';
import { useFilterPersistence, loadPageFilters } from '../lib/useFilterPersistence';

export default function LoginActivity() {
  const savedFilters = useRef(loadPageFilters<any>('loginActivity')).current;
  const [logs, setLogs] = useState<LoginActivityType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState(savedFilters?.searchQuery || '');
  const [userFilter, setUserFilter] = useState(savedFilters?.userFilter || 'All Users');
  const [statusFilter, setStatusFilter] = useState(savedFilters?.statusFilter || 'All Status');
  const [fromDate, setFromDate] = useState(savedFilters?.fromDate || '');
  const [toDate, setToDate] = useState(savedFilters?.toDate || '');
  const [currentPage, setCurrentPage] = useState(savedFilters?.currentPage || 1);
  const [perPage, setPerPage] = useState(savedFilters?.perPage || 50);

  // Persist filters to sessionStorage
  useFilterPersistence('loginActivity', { searchQuery, userFilter, statusFilter, fromDate, toDate, currentPage, perPage });
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();
  const { users } = useCrmStore();

  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;

  const companyUsers = useMemo(() => {
    return users.filter(u => {
      if (!u.company) return displayCompany === 'GSF';
      if (displayCompany === 'GSF') return u.company === 'Get Set Flight';
      if (displayCompany === 'LBT') return u.company === 'Look Book Ticket';
      if (displayCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
      return false;
    });
  }, [users, displayCompany]);

  const companyUserIds = useMemo(() => new Set(companyUsers.map(u => u.id)), [companyUsers]);

  const canExport = currentUser?.permissions?.includes('Export Data') || ['Admin', 'Manager', 'Operation Manager', 'HR (Human Resource)'].includes(currentUser?.role || '');
  const canDelete = ['Admin', 'Manager', 'IT'].includes(currentUser?.role || '');

  // Apply all filters to logs
  const filteredLogs = useMemo(() => {
    let result = logs;
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.userName || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.ipAddress || '').toLowerCase().includes(q) ||
        (l.device || '').toLowerCase().includes(q)
      );
    }
    // User filter
    if (userFilter && userFilter !== 'All Users') {
      result = result.filter(l => l.userName === userFilter);
    }
    // Status filter - check both login status and active/logout status
    if (statusFilter && statusFilter !== 'All Status') {
      if (statusFilter === 'Active') {
        result = result.filter(l => !l.logoutTime);
      } else if (statusFilter === 'Logged Out') {
        result = result.filter(l => !!l.logoutTime);
      } else {
        result = result.filter(l => l.status === statusFilter);
      }
    }
    // Date range filters
    if (fromDate) {
      result = result.filter(l => {
        try {
          const d = new Date(l.loginTime).toISOString().split('T')[0];
          return d >= fromDate;
        } catch { return true; }
      });
    }
    if (toDate) {
      result = result.filter(l => {
        try {
          const d = new Date(l.loginTime).toISOString().split('T')[0];
          return d <= toDate;
        } catch { return true; }
      });
    }
    return result;
  }, [logs, searchQuery, userFilter, statusFilter, fromDate, toDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/public/login-activity');
      const { data } = await res.json();
      setLogs((data || []).filter((log: any) => companyUserIds.has(log.userId)).sort((a: any, b: any) => {
        // Sort newest first (Z to A) - by id descending
        return (b.id || 0) - (a.id || 0);
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteSelected = async () => {
    if (!confirm('Are you sure you want to delete selected logs?')) return;
    try {
      for (const id of selectedLogs) {
        await client.api.fetch(`/api/public/login-activity/${id}`, { method: 'DELETE' });
      }
      setSelectedLogs([]);
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL logs? This cannot be undone.')) return;
    try {
      for (const log of logs) {
        await client.api.fetch(`/api/public/login-activity/${log.id}`, { method: 'DELETE' });
      }
      setSelectedLogs([]);
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Login Activity Report', 14, 20);
    
    const tableData = logs.map(l => [
      l.userName,
      l.ipAddress,
      l.device,
      l.loginTime,
      l.logoutTime || 'Active',
      l.duration || '-',
      l.status
    ]);

    autoTable(doc, {
      head: [['User', 'IP Address', 'Device', 'Login', 'Logout', 'Duration', 'Status']],
      body: tableData,
      startY: 30,
    });

    doc.save('login-activity.pdf');
  };

  const handleExportCSV = () => {
    const headers = ['User,IP Address,Device,Login Time,Logout Time,Duration,Status'];
    const rows = logs.map(l => `${l.userName},${l.ipAddress},${l.device},${l.loginTime},${l.logoutTime || 'Active'},${l.duration || '-'},${l.status}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Login_Activity_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Login Activity</h1>
          <p className="text-gray-500 text-sm mt-1">Track all login sessions, IP addresses, and device information</p>
        </div>
        <div className="flex gap-2">
          {canDelete && (
            <>
              {selectedLogs.length > 0 && (
                <button onClick={handleDeleteSelected} className="btn-danger flex items-center gap-2"><Trash2 size={16} /> Delete Selected</button>
              )}
              {logs.length > 0 && (
                <button onClick={handleDeleteAll} className="btn-danger flex items-center gap-2"><Trash2 size={16} /> Delete All</button>
              )}
            </>
          )}
          <button onClick={fetchLogs} className="btn-secondary"><RefreshCw size={16} /></button>
          {canExport && (
            <>
              <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2"><Download size={16} /> CSV</button>
              <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2"><FileText size={16} /> PDF</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Active Sessions</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{logs.filter(l => !l.logoutTime).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Today's Logins</p>
          <p className="text-2xl font-bold mt-1">{logs.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Logged Out</p>
          <p className="text-2xl font-bold mt-1 text-orange-600">{logs.filter(l => !!l.logoutTime).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">{logs.length}</p>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search name, email, IP..." className="input-field pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select className="select-field" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
              <option>All Users</option>
              {Array.from(new Set(logs.map(l => l.userName))).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="select-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All Status</option>
              <option value="Active">Active</option>
              <option value="Logged Out">Logged Out</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input type="date" className="input-field" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input type="date" className="input-field" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-100 border-b-2 border-gray-300">
              <tr>
                {canDelete && (
                  <th className="text-left p-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedLogs.length === logs.length && logs.length > 0}
                      onChange={(e) => setSelectedLogs(e.target.checked ? logs.map(l => l.id) : [])}
                    />
                  </th>
                )}
                <th className="text-left p-4 text-sm font-medium text-gray-500">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">IP Address</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Device</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Login Time</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Logout Time</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Duration</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice((currentPage - 1) * perPage, currentPage * perPage).map((log, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {canDelete && (
                    <td className="p-4 border border-gray-200">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedLogs.includes(log.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLogs([...selectedLogs, log.id]);
                          else setSelectedLogs(selectedLogs.filter(id => id !== log.id));
                        }}
                      />
                    </td>
                  )}
                  <td className="p-4 text-sm font-medium text-gray-900 border border-gray-200">{log.userName}</td>
                  <td className="p-4 text-sm text-gray-600 font-mono border border-gray-200">{log.ipAddress}</td>
                  <td className="p-4 text-sm text-gray-600 border border-gray-200">{log.device}</td>
                  <td className="p-4 text-sm text-gray-600 border border-gray-200">{formatDateTimeDMY(log.loginTime)}</td>
                  <td className="p-4 text-sm text-gray-600 border border-gray-200">{log.logoutTime ? formatDateTimeDMY(log.logoutTime) : <span className="text-green-500 font-medium">Active</span>}</td>
                  <td className="p-4 text-sm text-gray-600 font-mono border border-gray-200">{log.duration || '-'}</td>
                  <td className="p-4 border border-gray-200">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      !log.logoutTime ? 'bg-green-100 text-green-700' :
                      log.status === 'Success' ? 'bg-blue-100 text-blue-700' : 
                      log.status === 'Failed' ? 'bg-red-100 text-red-700' : 
                      log.status === 'Auto-Logout' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {!log.logoutTime ? 'Active' : log.status === 'Auto-Logout' ? 'Auto-Logout' : 'Logged Out'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} className="p-8 text-center text-gray-500">No login activity found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={filteredLogs.length}
          currentPage={currentPage}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </div>
  );
}