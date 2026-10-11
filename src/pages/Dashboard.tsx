import { useCrmStore } from '../store/crmStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  XCircle, CalendarClock, Send, Ban, UserCheck,
  ShoppingCart, Pause, TrendingUp, Users, Plus, GitCompare,
  Star, RefreshCw, ArrowRight, Plane, Clock, Activity,
  BarChart3, Zap, Target, Award, X as XIcon, Megaphone,
  DollarSign, Download, ChevronDown, Check, FileText, CreditCard
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getCompanyInfo } from '../types';
import { client } from '../lib/api';

const statusIcons: Record<string, any> = {
  'New Query': Star,
  'Closed Query': XCircle,
  'Date Change': CalendarClock,
  'Send to QC': Send,
  'Cancellation': Ban,
  'Follow Up': UserCheck,
  'Variance': GitCompare,
  'Sold': ShoppingCart,
  'Hold': Pause,
  'Post Sale': RefreshCw,
  'Schedule Change': CalendarClock,
};

const statusGradients: Record<string, string> = {
  'New Query': 'from-sky-400 via-sky-500 to-blue-600',
  'Follow Up': 'from-blue-500 via-blue-600 to-blue-700',
  'Hold': 'from-amber-400 via-orange-500 to-orange-600',
  'Closed Query': 'from-gray-400 via-gray-500 to-gray-600',
  'Send to QC': 'from-cyan-400 via-cyan-500 to-cyan-600',
  'Variance': 'from-indigo-400 via-indigo-500 to-indigo-600',
  'Sold': 'from-emerald-400 via-emerald-500 to-emerald-600',
  'Date Change': 'from-purple-400 via-purple-500 to-purple-600',
  'Cancellation': 'from-red-400 via-red-500 to-red-600',
  'Post Sale': 'from-teal-400 via-teal-500 to-teal-600',
  'Schedule Change': 'from-violet-400 via-violet-500 to-violet-600',
};

const statusBadgeColors: Record<string, string> = {
  'New Query': 'bg-sky-100 text-sky-700 border border-sky-200',
  'Sold': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Hold': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Cancellation': 'bg-red-100 text-red-700 border border-red-200',
  'Variance': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  'Follow Up': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Send to QC': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  'Post Sale': 'bg-teal-100 text-teal-700 border border-teal-200',
  'Schedule Change': 'bg-violet-100 text-violet-700 border border-violet-200',
  'Date Change': 'bg-purple-100 text-purple-700 border border-purple-200',
  'Closed Query': 'bg-gray-100 text-gray-700 border border-gray-200',
};

// All statuses to show on dashboard
const ALL_STATUSES = ['New Query', 'Follow Up', 'Hold', 'Closed Query', 'Send to QC', 'Variance', 'Sold', 'Date Change', 'Cancellation', 'Post Sale', 'Schedule Change'];

// Partial payment statuses to show in the box
const PARTIAL_PAYMENT_SHOW_STATUSES = ['Sold', 'Send to QC', 'Variance', 'Date Change', 'Hold', 'Cancellation'];

export default function Dashboard() {
  const { queryStatuses, bookings, users } = useCrmStore();
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();
  const navigate = useNavigate();
  const [showGPM, setShowGPM] = useState(false);
  const [selectedGPMUsers, setSelectedGPMUsers] = useState<string[]>([]);
  const [gpmDropdownOpen, setGpmDropdownOpen] = useState(false);
  const gpmDropdownRef = useRef<HTMLDivElement>(null);
  const [gpmDateFrom, setGpmDateFrom] = useState('');
  const [gpmDateTo, setGpmDateTo] = useState('');
  const [gpmPeriod, setGpmPeriod] = useState<string>('1month');
  const [gpmStatusFilter, setGpmStatusFilter] = useState<string[]>([]);

  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;

  // Updates notification banners
  const [updates, setUpdates] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_updates') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await client.api.fetch('/api/public/updates');
        const data = await res.json();
        if (data?.data) setUpdates(data.data.filter((u: any) => u.isActive === 1).sort((a: any, b: any) => b.id - a.id));
      } catch {}
    })();
  }, []);

  const dismissUpdate = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    setDismissedIds(prev => {
      const newDismissed = [...prev, id];
      localStorage.setItem('dismissed_updates', JSON.stringify(newDismissed));
      return newDismissed;
    });
  };

  const companyName = displayCompany === 'GSF' ? 'Get Set Flight' : displayCompany === 'LBT' ? 'Look Book Ticket' : 'Traveloboom';
  const userRole = currentUser?.role || '';
  const visibleUpdates = updates.filter(u => {
    if (dismissedIds.includes(u.id)) return false;
    // Check company targeting
    const targets = (u.targetRoles || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    if (targets.length === 0 || targets.includes('All')) return true;
    // Check if any target matches current company
    const companyTargets = targets.filter((t: string) => t.startsWith('All '));
    const roleTargets = targets.filter((t: string) => !t.startsWith('All '));
    let companyMatch = companyTargets.length === 0; // if no company targets, show to all
    if (companyTargets.includes('All FDI') && displayCompany === 'GSF') companyMatch = true;
    if (companyTargets.includes('All EMT') && displayCompany === 'LBT') companyMatch = true;
    if (companyTargets.includes('All Travelo') && displayCompany === 'travelo') companyMatch = true;
    // Check role targeting
    let roleMatch = roleTargets.length === 0; // if no role targets, show to all
    if (roleTargets.includes('Agent') && userRole === 'Agent') roleMatch = true;
    if (roleTargets.includes('Supervisor') && userRole === 'Supervisor') roleMatch = true;
    if (roleTargets.includes('Manager') && (userRole === 'Manager' || userRole === 'Operation Manager')) roleMatch = true;
    if (roleTargets.includes('Admin') && (userRole === 'Admin' || userRole === 'Super Admin')) roleMatch = true;
    // If both company and role targets exist, both must match
    if (companyTargets.length > 0 && roleTargets.length > 0) return companyMatch && roleMatch;
    // If only company targets, match company
    if (companyTargets.length > 0) return companyMatch;
    // If only role targets, match role
    if (roleTargets.length > 0) return roleMatch;
    // Also check legacy company field
    if (u.company && u.company !== 'All') {
      if (u.company !== companyName) return false;
    }
    return true;
  });
  const companyInfo = getCompanyInfo(displayCompany);

  // Site bookings (forms) count for today
  const { siteBookings } = useCrmStore();
  const todayStr = new Date().toLocaleDateString('en-CA');
  const companySiteBookings = siteBookings.filter(sb => {
    if (!sb.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return sb.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return sb.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return sb.company === 'Traveloboom' || sb.company === 'Traveloboom';
    return false;
  });
  const todayForms = companySiteBookings.filter(sb => sb.created && sb.created.startsWith(todayStr)).length;

  // Filter users by company
  const companyUsers = users.filter(u => {
    if (!u.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return u.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return u.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
    return false;
  });

  // Filter bookings based on role and company
  const isAgent = currentUser?.role === 'Agent';
  const companyBookings = bookings.filter(b => {
    if (!b.company) return displayCompany === 'GSF';
    if (displayCompany === 'GSF') return b.company === 'Get Set Flight';
    if (displayCompany === 'LBT') return b.company === 'Look Book Ticket';
    if (displayCompany === 'travelo') return b.company === 'Traveloboom' || b.company === 'Traveloboom';
    return false;
  });

  const visibleBookings = isAgent 
    ? companyBookings.filter(b => b.addedBy === currentUser?.name)
    : companyBookings;

  // Close GPM dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gpmDropdownRef.current && !gpmDropdownRef.current.contains(e.target as Node)) {
        setGpmDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // GPM Data: role-based
  const roleLower = (currentUser?.role || '').toLowerCase();
  const isGPMFullAccess = ['admin', 'super admin', 'superuser', 'operation manager', 'manager', 'hr (human resource)', 'hr', 'it (information tech)', 'it', 'supervisor'].includes(roleLower);
  const isGPMAgent = roleLower === 'agent';

  const gpmBookings = useMemo(() => {
    const gpmStatuses = ['Sold', 'Send to QC', 'Variance', 'Date Change', 'Cancellation', 'Schedule Change'];
    let filtered = companyBookings.filter(b => gpmStatuses.includes(b.queryStatus));
    if (isGPMAgent) {
      filtered = filtered.filter(b => b.addedBy === currentUser?.name);
    }
    if (selectedGPMUsers.length > 0) {
      filtered = filtered.filter(b => selectedGPMUsers.includes(b.addedBy || ''));
    }
    if (gpmStatusFilter.length > 0) {
      filtered = filtered.filter(b => gpmStatusFilter.includes(b.queryStatus));
    }
    // Date filtering
    const now = new Date();
    let fromDate = gpmDateFrom;
    let toDate = gpmDateTo;
    if (gpmPeriod !== 'all' && !fromDate) {
      const d = new Date();
      if (gpmPeriod === 'day') d.setDate(d.getDate() - 1);
      else if (gpmPeriod === 'week') d.setDate(d.getDate() - 7);
      else if (gpmPeriod === '1month') d.setMonth(d.getMonth() - 1);
      else if (gpmPeriod === '3month') d.setMonth(d.getMonth() - 3);
      else if (gpmPeriod === '6month') d.setMonth(d.getMonth() - 6);
      else if (gpmPeriod === '1year') d.setFullYear(d.getFullYear() - 1);
      fromDate = d.toISOString().split('T')[0];
    }
    if (fromDate) {
      filtered = filtered.filter(b => {
        const cDate = b.created ? new Date(b.created).toISOString().split('T')[0] : '';
        return cDate >= fromDate;
      });
    }
    if (toDate) {
      filtered = filtered.filter(b => {
        const cDate = b.created ? new Date(b.created).toISOString().split('T')[0] : '';
        return cDate <= toDate;
      });
    }
    return filtered;
  }, [companyBookings, isGPMAgent, currentUser?.name, selectedGPMUsers, gpmStatusFilter, gpmDateFrom, gpmDateTo, gpmPeriod]);

  const gpmAgentNames = useMemo(() => {
    const agents = new Set(companyBookings.filter(b => ['Sold', 'Send to QC', 'Variance', 'Date Change', 'Cancellation', 'Schedule Change'].includes(b.queryStatus)).map(b => b.addedBy || ''));
    return Array.from(agents).filter(Boolean).sort();
  }, [companyBookings]);

  const toggleGPMUser = (name: string) => {
    setSelectedGPMUsers(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  // GPM Summary per user
  const gpmSummary = useMemo(() => {
    const map: Record<string, { count: number; totalGPM: number; totalSell: number; totalCost: number }> = {};
    gpmBookings.forEach(b => {
      const agent = b.addedBy || 'Unknown';
      if (!map[agent]) map[agent] = { count: 0, totalGPM: 0, totalSell: 0, totalCost: 0 };
      map[agent].count++;
      try {
        const pnrs = JSON.parse(b.pnrDetails || '[]');
        pnrs.forEach((p: any) => {
          map[agent].totalGPM += Number(p.gpm) || 0;
          map[agent].totalSell += Number(p.sell) || 0;
          map[agent].totalCost += Number(p.cost) || 0;
        });
      } catch {}
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.totalGPM - a.totalGPM);
  }, [gpmBookings]);

  // GPM export
  const exportGPM = () => {
    const headers = ['Agent', 'PNR', 'Origin', 'Destination', 'Date', 'Airlines', 'Status', 'Source', 'TKT', 'Partial', 'Cost', 'Sell', 'Fee', 'GPM', 'Currency', 'Company'];
    const rows: string[][] = [];
    gpmBookings.forEach(b => {
      try {
        const pnrs = JSON.parse(b.pnrDetails || '[]');
        if (pnrs.length === 0) {
          rows.push([b.addedBy || '', '', b.origin || '', b.destination || '', b.departureDate || '', b.airline || '', b.queryStatus || '', b.querySource || '', '', '', '', '', '', '', '', b.company || '']);
        }
        pnrs.forEach((p: any) => {
          rows.push([b.addedBy || '', p.pnr || '', b.origin || '', b.destination || '', b.departureDate || '', p.airline || b.airline || '', b.queryStatus || '', b.querySource || '', p.ticket || '', String(p.partial || ''), String(p.cost || ''), String(p.sell || ''), String(p.fee || ''), String(p.gpm || ''), p.currency || '', b.company || '']);
        });
      } catch {
        rows.push([b.addedBy || '', '', b.origin || '', b.destination || '', b.departureDate || '', b.airline || '', b.queryStatus || '', b.querySource || '', '', '', '', '', '', '', '', b.company || '']);
      }
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GPM_Report_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Build status cards - combine stored queryStatuses with default list
  const statusCards = ALL_STATUSES.map((name, index) => {
    const existing = queryStatuses.find(qs => qs.name === name);
    return existing || { id: `temp-${index}`, name, color: '#000' };
  });

  // Helper to extract IATA code from stored value
  const getIata = (val: string) => {
    if (!val) return '';
    // Check for bracket pattern [XXX]
    const bracketMatch = val.match(/\[([A-Z]{3})\]/);
    if (bracketMatch) return bracketMatch[1];
    // If already a short code (3 letters), return as-is
    const trimmed = val.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;
    // Split by " - " first
    const dashPart = trimmed.split(' - ')[0].trim();
    if (/^[A-Z]{3}$/.test(dashPart)) return dashPart;
    // Try to extract first 3-letter uppercase word
    const codeMatch = trimmed.match(/\b([A-Z]{3})\b/);
    if (codeMatch) return codeMatch[1];
    // Fallback: first word
    return dashPart.split(/[\s,]/)[0].slice(0, 6);
  };

  // Sort bookings by most recent first (newest id first)
  const recentBookings = [...visibleBookings].sort((a, b) => b.id - a.id).slice(0, 8);

  // Stats
  const totalBookings = visibleBookings.length;
  const soldCount = visibleBookings.filter(b => b.queryStatus === 'Sold').length;
  const followUpCount = visibleBookings.filter(b => b.queryStatus === 'Follow Up').length;
  const newQueryCount = visibleBookings.filter(b => b.queryStatus === 'New Query').length;
  const conversionRate = totalBookings > 0 ? Math.round((soldCount / totalBookings) * 100) : 0;
  const pendingCount = visibleBookings.filter(b => ['Follow Up', 'Hold', 'New Query'].includes(b.queryStatus)).length;
  const partialPaymentCount = visibleBookings.filter(b => b.partialPayment === 'Yes' && PARTIAL_PAYMENT_SHOW_STATUSES.includes(b.queryStatus) && !(b as any).partialPaymentCleared).length;

  // Today's bookings (unused - removed TODAY card)
  // const today = new Date().toLocaleDateString('en-CA');
  // const todayBookings = visibleBookings.filter(b => b.created && b.created.startsWith(today)).length;

  return (
    <div className="space-y-6">
      {/* Updates Notification Banners - clickable to navigate */}
      {visibleUpdates.length > 0 && (
        <div className="space-y-2">
          {visibleUpdates.slice(0, 3).map(update => (
            <div key={update.id} className="relative bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border border-indigo-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/updates')}>
              <button
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => dismissUpdate(update.id, e)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all z-20 shadow-sm border border-gray-200 hover:border-red-200"
                title="Dismiss"
                type="button"
              >
                <XIcon size={14} strokeWidth={2.5} />
              </button>
              <div className="flex items-start gap-3 pr-8">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Megaphone size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm">{update.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{update.content?.replace(/<[^>]*>/g, '').slice(0, 200)}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-indigo-500 font-medium">{update.createdBy || update.addedBy}</span>
                    <span className="text-[10px] text-gray-400">{update.created}</span>
                    {update.priority === 'Urgent' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Urgent</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">✈️</span> Welcome, {currentUser?.name?.split(' ')[0] || 'Agent'}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/bookings?add=true')} className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg">
          <Plus size={16} /> New Booking
        </button>
        <button onClick={() => setShowGPM(!showGPM)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${showGPM ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'}`}>
          <DollarSign size={16} /> GPM Report
        </button>
      </div>

      {/* Hero Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        {/* Forms (today's site bookings) */}
        <div className="card p-3 sm:p-4 bg-gradient-to-br from-rose-500 to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => navigate('/site-bookings')}>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <FileText size={16} className="opacity-80 sm:w-[18px] sm:h-[18px]" />
            <span className="text-[10px] sm:text-xs opacity-70 font-medium">FORMS</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{todayForms}</p>
          <p className="text-xs opacity-80 mt-1">Today's Forms</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => navigate('/bookings')}>
          <div className="flex items-center justify-between mb-2">
            <Plane size={18} className="opacity-80" />
            <span className="text-xs opacity-70 font-medium">TOTAL</span>
          </div>
          <p className="text-3xl font-bold">{totalBookings}</p>
          <p className="text-xs opacity-80 mt-1">All Bookings</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => navigate('/bookings?status=Sold')}>
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart size={18} className="opacity-80" />
            <span className="text-xs opacity-70 font-medium">SOLD</span>
          </div>
          <p className="text-3xl font-bold">{soldCount}</p>
          <p className="text-xs opacity-80 mt-1">Confirmed</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-sky-500 to-sky-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => navigate('/bookings?status=New+Query')}>
          <div className="flex items-center justify-between mb-2">
            <Star size={18} className="opacity-80" />
            <span className="text-xs opacity-70 font-medium">NEW</span>
          </div>
          <p className="text-3xl font-bold">{newQueryCount}</p>
          <p className="text-xs opacity-80 mt-1">New Queries</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-orange-500 to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => navigate('/bookings?status=Follow+Up')}>
          <div className="flex items-center justify-between mb-2">
            <Clock size={18} className="opacity-80" />
            <span className="text-xs opacity-70 font-medium">FOLLOW UP</span>
          </div>
          <p className="text-3xl font-bold">{followUpCount}</p>
          <p className="text-xs opacity-80 mt-1">Pending</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-violet-500 to-violet-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <Target size={18} className="opacity-80" />
            <span className="text-xs opacity-70 font-medium">RATE</span>
          </div>
          <p className="text-3xl font-bold">{conversionRate}%</p>
          <p className="text-xs opacity-80 mt-1">Conversion</p>
        </div>
        {['Admin', 'Manager', 'HR', 'HR (Human Resource)', 'Operation Manager'].includes(currentUser?.role || '') ? (
          <div className="card p-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => navigate('/users')}>
            <div className="flex items-center justify-between mb-2">
              <Users size={18} className="opacity-80" />
              <span className="text-xs opacity-70 font-medium">USERS</span>
            </div>
            <p className="text-3xl font-bold">{companyUsers.filter(u => u.status === 'Active').length}</p>
            <p className="text-xs opacity-80 mt-1">Active Agents</p>
          </div>
        ) : (
          <div className="card p-4 bg-gradient-to-br from-pink-500 to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => navigate('/bookings?status=New+Query')}>
            <div className="flex items-center justify-between mb-2">
              <Zap size={18} className="opacity-80" />
              <span className="text-xs opacity-70 font-medium">PENDING</span>
            </div>
            <p className="text-3xl font-bold">{pendingCount}</p>
            <p className="text-xs opacity-80 mt-1">Needs Action</p>
          </div>
        )}
      </div>

      {/* Partial Payment Box */}
      <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/bookings?partialPayment=Yes')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <CreditCard size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Partial Payments</h3>
              <p className="text-sm text-gray-500">Outstanding dues from Sold, Send to QC, Variance, Date Change, Hold & Cancellation</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-700">{partialPaymentCount}</p>
            <p className="text-xs font-semibold text-amber-600">Pending Dues</p>
          </div>
        </div>
      </div>

      {/* Query Status Cards */}
      {showGPM && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" /> GPM Report
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Period Buttons */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {[{k:'day',l:'Day'},{k:'week',l:'Week'},{k:'1month',l:'1M'},{k:'3month',l:'3M'},{k:'6month',l:'6M'},{k:'1year',l:'1Y'},{k:'all',l:'All'}].map(p => (
                  <button key={p.k} onClick={() => { setGpmPeriod(p.k); setGpmDateFrom(''); setGpmDateTo(''); }} className={`px-2.5 py-1 text-xs font-semibold transition-all ${gpmPeriod === p.k ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{p.l}</button>
                ))}
              </div>
              {/* Date Range */}
              <input type="date" value={gpmDateFrom} onChange={e => { setGpmDateFrom(e.target.value); setGpmPeriod('all'); }} className="px-2 py-1 border border-gray-200 rounded-lg text-xs" />
              <input type="date" value={gpmDateTo} onChange={e => { setGpmDateTo(e.target.value); setGpmPeriod('all'); }} className="px-2 py-1 border border-gray-200 rounded-lg text-xs" />
              {/* Status Filter */}
              <div className="flex flex-wrap rounded-lg border border-gray-200 overflow-hidden">
                {['Sold','Send to QC','Variance','Date Change','Cancellation','Schedule Change'].map(s => (
                  <button key={s} onClick={() => setGpmStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} className={`px-2 py-1 text-[10px] font-semibold transition-all ${gpmStatusFilter.includes(s) ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>{s}</button>
                ))}
              </div>
              {/* Multi-select user filter */}
              {!isGPMAgent && (
                <div className="relative" ref={gpmDropdownRef}>
                  <button onClick={() => setGpmDropdownOpen(!gpmDropdownOpen)} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-300 transition-colors min-w-[160px]">
                    <Users size={14} className="text-gray-500" />
                    <span className="text-gray-700 truncate">{selectedGPMUsers.length === 0 ? 'All Agents' : `${selectedGPMUsers.length} selected`}</span>
                    <ChevronDown size={14} className="text-gray-400 ml-auto" />
                  </button>
                  {gpmDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100">
                        <button onClick={() => setSelectedGPMUsers([])} className="text-xs text-blue-600 hover:underline">Clear All</button>
                      </div>
                      {gpmAgentNames.map(name => (
                        <div key={name} onClick={() => toggleGPMUser(name)} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${selectedGPMUsers.includes(name) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                            {selectedGPMUsers.includes(name) && <Check size={10} className="text-white" />}
                          </div>
                          <span className="text-sm text-gray-700">{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={exportGPM} className="btn-secondary flex items-center gap-1 text-xs">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* GPM Summary - 5 boxes only */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-semibold">Total Bookings</p>
              <p className="text-2xl font-bold text-emerald-700">{gpmBookings.length}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-600 font-semibold">Total Sell</p>
              <p className="text-2xl font-bold text-blue-700">${gpmSummary.reduce((s, u) => s + u.totalSell, 0).toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
              <p className="text-xs text-purple-600 font-semibold">Total Cost</p>
              <p className="text-2xl font-bold text-purple-700">${gpmSummary.reduce((s, u) => s + u.totalCost, 0).toLocaleString()}</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
              <p className="text-xs text-teal-600 font-semibold">Total GPM</p>
              <p className="text-2xl font-bold text-teal-700">${gpmSummary.reduce((s, u) => s + u.totalGPM, 0).toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-amber-600 font-semibold">Agents</p>
              <p className="text-2xl font-bold text-amber-700">{gpmSummary.length}</p>
            </div>
          </div>

          {/* Agent GPM Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-bold text-emerald-800 uppercase">Agent</th>
                  <th className="text-center px-3 py-2 text-xs font-bold text-emerald-800 uppercase">Sold</th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-emerald-800 uppercase">Sell</th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-emerald-800 uppercase">Cost</th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-emerald-800 uppercase">GPM</th>
                </tr>
              </thead>
              <tbody>
                {gpmSummary.map((agent, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-3 py-2 font-semibold text-gray-900 border border-gray-200">{agent.name}</td>
                    <td className="px-3 py-2 text-center text-gray-600 border border-gray-200">{agent.count}</td>
                    <td className="px-3 py-2 text-right text-blue-700 font-medium border border-gray-200">${agent.totalSell.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-gray-600 border border-gray-200">${agent.totalCost.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-emerald-700 font-bold border border-gray-200">${agent.totalGPM.toLocaleString()}</td>
                  </tr>
                ))}
                {gpmSummary.length > 0 && (
                  <tr className="bg-emerald-50 font-bold">
                    <td className="px-3 py-2 text-emerald-800 border border-gray-200">Total</td>
                    <td className="px-3 py-2 text-center text-emerald-800 border border-gray-200">{gpmSummary.reduce((s, u) => s + u.count, 0)}</td>
                    <td className="px-3 py-2 text-right text-blue-800 border border-gray-200">${gpmSummary.reduce((s, u) => s + u.totalSell, 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-gray-800 border border-gray-200">${gpmSummary.reduce((s, u) => s + u.totalCost, 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-emerald-800 border border-gray-200">${gpmSummary.reduce((s, u) => s + u.totalGPM, 0).toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {gpmSummary.length === 0 && (
              <div className="p-8 text-center text-gray-400">No sold bookings found.</div>
            )}
          </div>
        </div>
      )}

      {/* Query Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={22} className="text-blue-500" />
            Query Status Overview
          </h2>
          <button onClick={() => navigate('/bookings')} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {statusCards.map((qs) => {
            const Icon = statusIcons[qs.name] || Activity;
            const gradient = statusGradients[qs.name] || 'from-gray-400 via-gray-500 to-gray-600';
            const actualCount = visibleBookings.filter(b => b.queryStatus === qs.name).length;
            const pct = totalBookings > 0 ? Math.round((actualCount / totalBookings) * 100) : 0;
            
            return (
              <div
                key={qs.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden relative"
                onClick={() => navigate(`/bookings?status=${encodeURIComponent(qs.name)}`)}
              >
                {/* Background gradient accent */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
                <div className="flex items-center justify-between mb-3 mt-1">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{actualCount}</p>
                    <p className="text-xs font-semibold text-gray-500">{pct}%</p>
                  </div>
                </div>
                <p className="text-base text-gray-800 font-bold leading-tight">{qs.name}</p>
                {/* Progress bar */}
                <div className="mt-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${gradient} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity & Recent Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Stats */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Award size={18} className="text-purple-500" />
            Quick Stats
          </h2>
          <div className="card p-4 space-y-3">
            {[
              { label: 'Sold Bookings', value: soldCount, total: totalBookings, color: 'bg-emerald-500' },
              { label: 'Follow Ups Needed', value: pendingCount, total: totalBookings, color: 'bg-orange-500' },
              { label: 'New Queries', value: newQueryCount, total: totalBookings, color: 'bg-sky-500' },
              { label: 'Closed', value: visibleBookings.filter(b => b.queryStatus === 'Closed Query').length, total: totalBookings, color: 'bg-gray-500' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-medium">{stat.label}</span>
                  <span className="text-xs font-bold text-gray-900">{stat.value}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${stat.color} rounded-full transition-all`}
                    style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold text-blue-700">{conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Plane size={18} className="text-blue-500" />
              Recent Bookings
            </h2>
            <button onClick={() => navigate('/bookings')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50/80 border-b-2 border-gray-300">
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Query ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Route</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Agent</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell text-center text-gray-400 py-8">
                      No bookings yet. <button onClick={() => navigate('/bookings?add=true')} className="text-blue-600 hover:underline">Add your first booking</button>
                    </td>
                  </tr>
                ) : recentBookings.map((b, i) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/bookings?view=${b.id}`)}
                  >
                    <td className="table-cell font-medium text-gray-400 text-xs">{i + 1}</td>
                    <td className="table-cell text-blue-600 font-semibold text-sm">{b.queryId}</td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900 text-sm">{b.firstName} {b.lastName}</div>
                      <div className="text-xs text-gray-400">{b.querySource}</div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <span className="text-blue-700">{getIata(b.origin)}</span>
                        <span className="text-gray-300 text-xs">✈</span>
                        <span className="text-blue-700">{getIata(b.destination)}</span>
                      </div>
                      <div className="text-xs text-gray-400">{b.departureDate}</div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${statusBadgeColors[b.queryStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {b.queryStatus}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{b.addedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
