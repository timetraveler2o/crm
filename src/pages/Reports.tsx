import { safeParsePnrDetails } from '../lib/utils';
import { useState, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { Download, FileText, RefreshCw, TrendingUp, Users, ShoppingCart, Target, BarChart3, Plane, Award, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_COLORS: Record<string, string> = {
  'New Query': '#0ea5e9',
  'Follow Up': '#3b82f6',
  'Hold': '#f59e0b',
  'Sold': '#10b981',
  'Cancellation': '#ef4444',
  'Variance': '#6366f1',
  'Send to QC': '#06b6d4',
  'Date Change': '#8b5cf6',
  'Closed Query': '#6b7280',
  'Post Sale': '#14b8a6',
  'Schedule Change': '#7c3aed',
};

const CHART_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1'];

const SUPPLIERS = ['INTER', 'SKY', 'ONKAR', 'RIYA (IXC)', 'CVFR', 'MONDEE', 'Other'];

export default function Reports() {
  const { bookings, users } = useCrmStore();
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'trends' | 'suppliers'>('overview');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const canExport = currentUser?.permissions?.includes('Export Data') || ['Admin', 'Manager', 'Operation Manager', 'HR (Human Resource)'].includes(currentUser?.role || '');

  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;

  const companyBookings = bookings.filter(b => {
    if (!b.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return b.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return b.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return b.company === 'Traveloboom' || b.company === 'Traveloboom';
    return false;
  });

  // Filter by period
  const now = new Date();
  const filteredBookings = companyBookings.filter(b => {
    if (!b.created) return true;
    const date = new Date(b.created);
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    } else if (period === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (period === 'year') {
      return date.getFullYear() === now.getFullYear();
    } else if (period === 'custom') {
      if (customFrom && date < new Date(customFrom)) return false;
      if (customTo && date > new Date(customTo + 'T23:59:59')) return false;
      return true;
    }
    return true;
  });

  const companyUsers = users.filter(u => {
    if (!u.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return u.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return u.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
    return false;
  });

  // Calculate stats
  const totalBookings = filteredBookings.length;
  const soldBookings = filteredBookings.filter(b => b.queryStatus === 'Sold').length;
  const totalUsers = companyUsers.filter(u => u.status === 'Active').length;
  const conversionRate = totalBookings > 0 ? Math.round((soldBookings / totalBookings) * 100) : 0;
  const newQueries = filteredBookings.filter(b => b.queryStatus === 'New Query').length;
  const followUps = filteredBookings.filter(b => b.queryStatus === 'Follow Up').length;
  const pending = filteredBookings.filter(b => ['Hold', 'Follow Up', 'New Query'].includes(b.queryStatus)).length;
  const postSale = filteredBookings.filter(b => b.queryStatus === 'Post Sale').length;
  const sendToQC = filteredBookings.filter(b => b.queryStatus === 'Send to QC').length;
  const variance = filteredBookings.filter(b => b.queryStatus === 'Variance').length;
  const dateChange = filteredBookings.filter(b => b.queryStatus === 'Date Change').length;
  const scheduleChange = filteredBookings.filter(b => b.queryStatus === 'Schedule Change').length;
  const cancellation = filteredBookings.filter(b => b.queryStatus === 'Cancellation').length;

  // Status chart data (sorted by count)
  const statusData = Object.entries(filteredBookings.reduce((acc, b) => {
    acc[b.queryStatus] = (acc[b.queryStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>))
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#6b7280' }));

  // Agent Leaderboard - Full stats: Sold, Send to QC, Variance, Date Change, Schedule Change, Cancellation, GPM
  const leaderboardData = useMemo(() => {
    return Object.entries(filteredBookings.reduce((acc, b) => {
      if (!acc[b.addedBy]) acc[b.addedBy] = { total: 0, sold: 0, sendToQC: 0, variance: 0, dateChange: 0, scheduleChange: 0, cancellation: 0, gpm: 0 };
      acc[b.addedBy].total++;
      if (b.queryStatus === 'Sold') {
        acc[b.addedBy].sold++;
        try {
          const pnrs: any[] = safeParsePnrDetails(b);
          pnrs.forEach((p: any) => { acc[b.addedBy].gpm += Number(p.gpm) || 0; });
        } catch {}
      }
      if (b.queryStatus === 'Send to QC') acc[b.addedBy].sendToQC++;
      if (b.queryStatus === 'Variance') acc[b.addedBy].variance++;
      if (b.queryStatus === 'Date Change') acc[b.addedBy].dateChange++;
      if (b.queryStatus === 'Schedule Change') acc[b.addedBy].scheduleChange++;
      if (b.queryStatus === 'Cancellation') acc[b.addedBy].cancellation++;
      return acc;
    }, {} as Record<string, { total: number; sold: number; sendToQC: number; variance: number; dateChange: number; scheduleChange: number; cancellation: number; gpm: number }>))
      .sort((a, b) => b[1].sold - a[1].sold || b[1].gpm - a[1].gpm)
      .slice(0, 10)
      .map(([name, stats]) => ({
        name: name.split(' ')[0],
        fullName: name,
        total: stats.total,
        sold: stats.sold,
        sendToQC: stats.sendToQC,
        variance: stats.variance,
        dateChange: stats.dateChange,
        scheduleChange: stats.scheduleChange,
        cancellation: stats.cancellation,
        gpm: Math.round(stats.gpm),
        rate: stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0
      }));
  }, [filteredBookings]);

  // Supplier tracking data
  const supplierData = useMemo(() => {
    const supplierMap: Record<string, { count: number; sold: number; gpm: number; commission: number }> = {};
    SUPPLIERS.forEach(s => { supplierMap[s] = { count: 0, sold: 0, gpm: 0, commission: 0 }; });
    filteredBookings.forEach(b => {
      let supplier = (b as any).supplier || 'Other';
      if (['SKYBIRD', 'SKY BIRD', 'Skybird'].includes(supplier)) supplier = 'SKY';
      const key = SUPPLIERS.includes(supplier) ? supplier : 'Other';
      if (!supplierMap[key]) supplierMap[key] = { count: 0, sold: 0, gpm: 0, commission: 0 };
      supplierMap[key].count++;
      if (b.queryStatus === 'Sold') {
        supplierMap[key].sold++;
        try {
          const pnrs: any[] = safeParsePnrDetails(b);
          pnrs.forEach((p: any) => {
            supplierMap[key].gpm += Number(p.gpm) || 0;
            supplierMap[key].commission += Number(p.fee) || 0;
          });
        } catch {}
      }
    });
    return Object.entries(supplierMap)
      .map(([name, data]) => ({ name, ...data }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.sold - a.sold);
  }, [filteredBookings]);

  // Source distribution
  const sourceData = Object.entries(filteredBookings.reduce((acc, b) => {
    const src = b.querySource || 'Unknown';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Daily trend with real data from bookings
  const trendDays = period === 'week' ? 7 : 14;
  const trendData = Array.from({ length: trendDays }, (_, i) => {
    const d = new Date(now.getTime() - (trendDays - 1 - i) * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayBookings = companyBookings.filter(b => {
      if (!b || !b.created) return false;
      try {
        const bd = new Date(b.created);
        if (isNaN(bd.getTime())) return false;
        return bd.toISOString().split('T')[0] === dateStr;
      } catch {
        return false;
      }
    });
    let dayGpm = 0;
    dayBookings.filter(b => b.queryStatus === 'Sold').forEach(b => {
      try {
        const pnrs: any[] = safeParsePnrDetails(b);
        pnrs.forEach((p: any) => { dayGpm += Number(p.gpm) || 0; });
      } catch {}
    });
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bookings: dayBookings.length,
      sold: dayBookings.filter(b => b.queryStatus === 'Sold').length,
      gpm: Math.round(dayGpm),
    };
  });

  const exportCSV = () => {
    const headers = ['ID', 'Status', 'Agent', 'Date', 'Origin', 'Destination', 'Source', 'Supplier'];
    const rows = filteredBookings.map(b => [b.queryId, b.queryStatus, b.addedBy, b.created, b.origin, b.destination, b.querySource, (b as any).supplier || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url; a.download = `Reports_${period}_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('CRM Reports & Analytics', 14, 22);
    doc.setFontSize(10);
    doc.text(`Period: ${period} | Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 36,
      head: [['ID', 'Status', 'Agent', 'Date', 'Origin', 'Destination', 'Supplier']],
      body: filteredBookings.map(b => [b.queryId, b.queryStatus, b.addedBy, b.created, b.origin, b.destination, (b as any).supplier || '-']),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`reports_${period}.pdf`);
  };

  const statCards = [
    { label: 'Total Bookings', value: totalBookings, icon: Plane, gradient: 'from-blue-500 to-blue-700' },
    { label: 'Sold / Confirmed', value: soldBookings, icon: ShoppingCart, gradient: 'from-emerald-500 to-emerald-700' },
    { label: 'New Queries', value: newQueries, icon: Activity, gradient: 'from-sky-500 to-sky-700' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Target, gradient: 'from-violet-500 to-violet-700' },
    { label: 'Follow Ups', value: followUps, icon: RefreshCw, gradient: 'from-orange-500 to-orange-700' },
    { label: 'Active Agents', value: totalUsers, icon: Users, gradient: 'from-purple-500 to-purple-700' },
    { label: 'Pending Actions', value: pending, icon: TrendingUp, gradient: 'from-amber-500 to-amber-700' },
    { label: 'Post Sale', value: postSale, icon: Award, gradient: 'from-teal-500 to-teal-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            Reports & Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Business intelligence and performance metrics</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {(['week', 'month', 'year', 'custom'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'Custom'}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input-field py-1.5 text-sm w-auto" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input-field py-1.5 text-sm w-auto" />
            </div>
          )}
          {canExport && (
            <>
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm py-1.5"><Download size={14} /> CSV</button>
              <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 text-sm py-1.5"><FileText size={14} /> PDF</button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl p-3 bg-gradient-to-br ${card.gradient} text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer`}>
            <card.icon size={16} className="opacity-80 mb-2" />
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-[10px] opacity-80 mt-0.5 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {(['overview', 'agents', 'trends', 'suppliers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'suppliers' ? 'Suppliers' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Bar Chart */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-500" />
              Bookings by Status
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source Distribution Pie */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-purple-500" />
              Bookings by Source
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="45%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Agent Leaderboard Table - Full Stats */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Agent Leaderboard
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Sold, Send to QC, Variance, Date Change, Schedule Change, Cancellation + GPM</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase">Agent</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-emerald-700 uppercase">Sold</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-cyan-700 uppercase">QC</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-indigo-700 uppercase">Variance</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-purple-700 uppercase">Date Chg</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-violet-700 uppercase">Sch Chg</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-red-700 uppercase">Cancel</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-green-700 uppercase">GPM ($)</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-gray-700 uppercase">Total</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-gray-700 uppercase">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((agent, i) => (
                    <tr key={agent.fullName} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-3 border border-gray-200">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold text-white ${
                          i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-blue-200 !text-blue-700'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3 border border-gray-200 font-medium text-gray-900">{agent.fullName}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 font-bold text-emerald-600">{agent.sold}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 font-medium text-cyan-600">{agent.sendToQC}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 font-medium text-indigo-600">{agent.variance}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 font-medium text-purple-600">{agent.dateChange}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 font-medium text-violet-600">{agent.scheduleChange}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 font-medium text-red-600">{agent.cancellation}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 font-bold text-green-700">${agent.gpm}</td>
                      <td className="px-3 py-3 text-center border border-gray-200 text-gray-600">{agent.total}</td>
                      <td className="px-3 py-3 text-center border border-gray-200">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${agent.rate >= 30 ? 'bg-emerald-100 text-emerald-700' : agent.rate >= 15 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {agent.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboardData.length === 0 && (
                    <tr><td colSpan={11} className="text-center py-8 text-gray-400">No agent data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent Performance Chart */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={16} className="text-purple-500" />
              Agent Performance Chart
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="sold" name="Sold" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="sendToQC" name="Send to QC" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="variance" name="Variance" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cancellation" name="Cancellation" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {/* Supplier Analytics */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Plane size={16} className="text-blue-500" />
                Supplier Analytics & Commission Tracking
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">INTER, SKY, ONKAR, RIYA (IXC), CVFR, MONDEE — Bookings, Sold & Commission</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gradient-to-r from-sky-50 to-blue-50 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase">Supplier</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase">Total Bookings</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-emerald-700 uppercase">Sold</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-green-700 uppercase">GPM ($)</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-purple-700 uppercase">Commission ($)</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase">Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierData.length > 0 ? supplierData.map((s, idx) => (
                    <tr key={s.name} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                            {s.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border border-gray-200 font-medium">{s.count}</td>
                      <td className="px-4 py-3 text-center border border-gray-200 font-bold text-emerald-600">{s.sold}</td>
                      <td className="px-4 py-3 text-center border border-gray-200 font-bold text-green-700">${s.gpm.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center border border-gray-200 font-bold text-purple-700">${s.commission.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center border border-gray-200">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.count > 0 && (s.sold / s.count) >= 0.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.count > 0 ? Math.round((s.sold / s.count) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        <p className="font-medium">No supplier data available</p>
                        <p className="text-xs mt-1">Supplier tracking will appear when bookings have a supplier assigned</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Chart */}
          {supplierData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-4">Supplier Revenue Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplierData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="sold" name="Sold" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="gpm" name="GPM ($)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="commission" name="Commission ($)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Booking Trends ({period === 'week' ? 'Last 7 Days' : 'Last 14 Days'})
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="bookings" name="Total" stroke="#3b82f6" fill="url(#colorBookings)" strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="sold" name="Sold" stroke="#10b981" fill="url(#colorSold)" strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="gpm" name="GPM ($)" stroke="#8b5cf6" fill="none" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status breakdown table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Status Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b-2 border-gray-300">
                  <tr>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Count</th>
                    <th className="table-header text-right">%</th>
                    <th className="table-header">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {statusData.map((row) => (
                    <tr key={row.name} className="hover:bg-gray-50/50">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.fill }} />
                          <span className="font-medium text-sm">{row.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-right font-bold">{row.value}</td>
                      <td className="table-cell text-right text-gray-500 text-sm">
                        {totalBookings > 0 ? `${Math.round((row.value / totalBookings) * 100)}%` : '0%'}
                      </td>
                      <td className="table-cell">
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden w-full max-w-[120px]">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ width: `${totalBookings > 0 ? (row.value / totalBookings) * 100 : 0}%`, backgroundColor: row.fill }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {statusData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="table-cell text-center text-gray-400 py-6">No data for selected period</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
