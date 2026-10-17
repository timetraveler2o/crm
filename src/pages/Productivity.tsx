import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { BarChart3, Clock, Users, TrendingUp, Coffee, Download, FileText, PieChart as PieChartIcon, Info, Award, Timer, Briefcase, Sun, Moon, Calendar, CheckCircle, Send, AlertTriangle, CalendarClock, RefreshCw, XCircle, Filter, User, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useMemo } from 'react';

const SALES_STATUSES = ['Sold', 'Send to QC', 'Variance', 'Date Change', 'Schedule Change', 'Cancellation'] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  'Sold': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  'Send to QC': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Send },
  'Variance': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
  'Date Change': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: CalendarClock },
  'Schedule Change': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: RefreshCw },
  'Cancellation': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
};

const STATUS_HOURS: Record<string, { productive: number; breakH: number }> = {
  'Present':      { productive: 8, breakH: 1 },
  'Half Day':     { productive: 4, breakH: 1 },
  'Paid Leave':   { productive: 8, breakH: 0 },
  'Comp Off':     { productive: 8, breakH: 0 },
  'Non-Paid Leave': { productive: 0, breakH: 0 },
  'Leave':        { productive: 0, breakH: 0 },
  'Absent':       { productive: 0, breakH: 0 },
  'Week Off':     { productive: 0, breakH: 0 },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, color: 'from-blue-500 to-indigo-600' },
  { id: 'performance', label: 'Performance', icon: Award, color: 'from-emerald-500 to-teal-600' },
  { id: 'breaks', label: 'Break Hours', icon: Coffee, color: 'from-amber-500 to-orange-600' },
  { id: 'sellers', label: 'Top Sellers', icon: TrendingUp, color: 'from-purple-500 to-pink-600' },
  { id: 'daily', label: 'Daily Log', icon: Calendar, color: 'from-cyan-500 to-blue-600' },
];

export default function Productivity() {
  const [dateFilter, setDateFilter] = useState('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [perfUserFilter, setPerfUserFilter] = useState('');
  const [sellerUserFilter, setSellerUserFilter] = useState('');
  const { attendance: allAttendanceRecords, attendanceSheet, bookings: allBookings, users } = useCrmStore();
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();

  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;

  // Role-based access: Daily Log only for HR/Admin
  const userRole = currentUser?.role || '';
  const canViewLogs = ['Admin', 'HR (Human Resource)'].includes(userRole);
  const canExport = currentUser?.permissions?.includes('Export Data') || ['Admin', 'Manager', 'Operation Manager', 'HR (Human Resource)'].includes(userRole);

  // Visible tabs based on role
  const visibleTabs = useMemo(() => {
    if (canViewLogs) return TABS;
    return TABS.filter(t => t.id !== 'daily');
  }, [canViewLogs]);

  const companyUsers = useMemo(() => {
    return users.filter(u => {
      if (!u.company) return displayCompany === 'GSF';
      if (displayCompany === 'GSF') return u.company === 'Get Set Flight';
      if (displayCompany === 'LBT') return u.company === 'Look Book Ticket';
      if (displayCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
      return false;
    });
  }, [users, displayCompany]);

  const companyBookings = useMemo(() => {
    return allBookings.filter(b => {
      if (!b.company) return displayCompany === 'GSF';
      if (displayCompany === 'GSF') return b.company === 'Get Set Flight';
      if (displayCompany === 'LBT') return b.company === 'Look Book Ticket';
      if (displayCompany === 'travelo') return b.company === 'Traveloboom' || b.company === 'Traveloboom';
      return false;
    });
  }, [allBookings, displayCompany]);

  const userMap = useMemo(() => {
    const m: Record<number, string> = {};
    companyUsers.forEach(u => { m[u.id] = u.name; });
    return m;
  }, [companyUsers]);

  const filterByDate = (dateStr: string | undefined) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (dateFilter === 'daily') {
      return date.toDateString() === now.toDateString();
    } else if (dateFilter === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    } else if (dateFilter === 'monthly') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'custom') {
      if (customFrom && new Date(dateStr) < new Date(customFrom)) return false;
      if (customTo && new Date(dateStr) > new Date(customTo + 'T23:59:59')) return false;
      return true;
    }
    return true;
  };

  const companyUserIds = new Set(companyUsers.map(u => u.id));
  const filteredSheet = useMemo(() => attendanceSheet.filter(e => filterByDate(e.date) && companyUserIds.has(e.userId)), [attendanceSheet, dateFilter, customFrom, customTo, companyUserIds]);
  const filteredRecords = useMemo(() => allAttendanceRecords.filter(a => {
    if (!filterByDate(a.date)) return false;
    return companyUsers.some(u => u.name === a.userName || u.id === a.userId);
  }), [allAttendanceRecords, dateFilter, customFrom, customTo, companyUsers]);
  const bookings = useMemo(() => companyBookings.filter(b => filterByDate(b.created)), [companyBookings, dateFilter, customFrom, customTo]);

  const periodLabel = dateFilter === 'daily' ? 'today' : dateFilter === 'weekly' ? 'this week' : dateFilter === 'monthly' ? 'this month' : 'selected period';

  const parseHoursStr = (s: string): number => {
    if (!s) return 0;
    const hmMatch = s.match(/(\d+)h\s*(\d+)?m?/);
    if (hmMatch) return parseInt(hmMatch[1]) * 60 + parseInt(hmMatch[2] || '0');
    const colonMatch = s.match(/(\d+):(\d+)/);
    if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
    const numMatch = s.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) return parseFloat(numMatch[1]) * 60;
    return 0;
  };

  const useCheckInData = filteredRecords.length > 0;

  type PerfEntry = { Productive: number; Break: number; Total: number; records: number; shift: string };
  const userPerformanceMap: Record<string, PerfEntry> = {};

  if (useCheckInData) {
    filteredRecords.forEach(a => {
      const name = a.userName || `User ${a.userId}`;
      const totalMin = parseHoursStr(a.totalHours || '0h 0m');
      const breakMin = (a.breaks || []).reduce((s: number, b: any) => s + parseHoursStr(b.duration || '0'), 0);
      const productiveMin = Math.max(0, totalMin - breakMin);
      if (!userPerformanceMap[name]) userPerformanceMap[name] = { Productive: 0, Break: 0, Total: 0, records: 0, shift: 'Day' };
      userPerformanceMap[name].Productive += productiveMin / 60;
      userPerformanceMap[name].Break += breakMin / 60;
      userPerformanceMap[name].Total += totalMin / 60;
      userPerformanceMap[name].records += 1;
      if (a.loginTime) {
        const hour = parseInt(a.loginTime.split(':')[0] || '9');
        if (hour >= 18 || hour < 6) userPerformanceMap[name].shift = 'Night';
      }
    });
  } else {
    filteredSheet.forEach(entry => {
      const name = userMap[entry.userId];
      if (!name) return;
      const hours = STATUS_HOURS[entry.status] || { productive: 0, breakH: 0 };
      if (!userPerformanceMap[name]) userPerformanceMap[name] = { Productive: 0, Break: 0, Total: 0, records: 0, shift: 'Day' };
      userPerformanceMap[name].Productive += hours.productive;
      userPerformanceMap[name].Break += hours.breakH;
      userPerformanceMap[name].Total += hours.productive + hours.breakH;
      userPerformanceMap[name].records += 1;
    });
  }

  const userEntries = Object.values(userPerformanceMap);
  const activeCount = useCheckInData
    ? new Set(filteredRecords.map(a => a.userName)).size
    : new Set(filteredSheet.filter(e => ['Present', 'Half Day'].includes(e.status)).map(e => e.userId)).size;

  const totalProductiveH = userEntries.reduce((s, v) => s + v.Productive, 0);
  const totalBreakH = userEntries.reduce((s, v) => s + v.Break, 0);
  const totalH = userEntries.reduce((s, v) => s + v.Total, 0);
  const userCount = userEntries.length;
  const avgHours = userCount > 0 ? (totalProductiveH / userCount).toFixed(1) : '0';
  const avgBreakMin = userCount > 0 ? Math.round((totalBreakH * 60) / userCount) : 0;
  const productivityScore = totalH > 0 ? Math.round((totalProductiveH / totalH) * 100) : 0;

  const chartData = Object.entries(userPerformanceMap).map(([name, v]) => ({
    name: name.split(' ')[0],
    fullName: name,
    Productive: parseFloat(v.Productive.toFixed(1)),
    Break: parseFloat(v.Break.toFixed(1)),
    shift: v.shift,
  }));

  // Individual Performance with user filter
  const individualPerf = Object.entries(userPerformanceMap).map(([name, v]) => ({
    name,
    totalHours: v.Total,
    productiveHours: v.Productive,
    breakHours: v.Break,
    pct: v.Total > 0 ? Math.round((v.Productive / v.Total) * 100) : 0,
    records: v.records,
    shift: v.shift,
  })).filter(p => !perfUserFilter || p.name.toLowerCase().includes(perfUserFilter.toLowerCase()))
    .sort((a, b) => b.pct - a.pct);

  // Break hours data with date-by-date breakdown
  const breakData = Object.entries(userPerformanceMap).map(([name, v]) => ({
    name,
    breakHours: v.Break,
    breakMinutes: Math.round(v.Break * 60),
    productiveHours: v.Productive,
    totalHours: v.Total,
    records: v.records,
    breakPct: v.Total > 0 ? Math.round((v.Break / v.Total) * 100) : 0,
    shift: v.shift,
  })).sort((a, b) => b.breakHours - a.breakHours);

  // Break date-by-date breakdown
  const breakDateBreakdown = useMemo(() => {
    const log: Record<string, Record<string, { breakH: number; shift: string; status: string }>> = {};
    if (useCheckInData) {
      filteredRecords.forEach(a => {
        const name = a.userName || `User ${a.userId}`;
        const date = a.date || 'Unknown';
        if (!log[date]) log[date] = {};
        const breakMin = (a.breaks || []).reduce((s: number, b: any) => s + parseHoursStr(b.duration || '0'), 0);
        const hour = parseInt((a.loginTime || '09:00').split(':')[0]);
        const shift = (hour >= 18 || hour < 6) ? 'Night' : 'Day';
        log[date][name] = { breakH: breakMin / 60, shift, status: 'Present' };
      });
    } else {
      filteredSheet.forEach(entry => {
        const name = userMap[entry.userId];
        if (!name) return;
        const date = entry.date || 'Unknown';
        if (!log[date]) log[date] = {};
        const hours = STATUS_HOURS[entry.status] || { productive: 0, breakH: 0 };
        log[date][name] = { breakH: hours.breakH, shift: 'Day', status: entry.status };
      });
    }
    return Object.entries(log).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  }, [useCheckInData, filteredRecords, filteredSheet, userMap]);

  // Daily log
  const dailyLog = useMemo(() => {
    const log: Record<string, Record<string, { productive: number; break: number; status: string; shift: string }>> = {};
    if (useCheckInData) {
      filteredRecords.forEach(a => {
        const name = a.userName || `User ${a.userId}`;
        const date = a.date || 'Unknown';
        if (!log[date]) log[date] = {};
        const totalMin = parseHoursStr(a.totalHours || '0');
        const breakMin = (a.breaks || []).reduce((s: number, b: any) => s + parseHoursStr(b.duration || '0'), 0);
        const hour = parseInt((a.loginTime || '09:00').split(':')[0]);
        const shift = (hour >= 18 || hour < 6) ? 'Night' : 'Day';
        log[date][name] = { productive: (totalMin - breakMin) / 60, break: breakMin / 60, status: 'Present', shift };
      });
    } else {
      filteredSheet.forEach(entry => {
        const name = userMap[entry.userId];
        if (!name) return;
        const date = entry.date || 'Unknown';
        if (!log[date]) log[date] = {};
        const hours = STATUS_HOURS[entry.status] || { productive: 0, breakH: 0 };
        log[date][name] = { productive: hours.productive, break: hours.breakH, status: entry.status, shift: 'Day' };
      });
    }
    return Object.entries(log).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  }, [useCheckInData, filteredRecords, filteredSheet, userMap]);

  // Sales Status Breakdown
  const salesStatusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    SALES_STATUSES.forEach(s => { breakdown[s] = 0; });
    bookings.forEach(b => {
      if (SALES_STATUSES.includes(b.queryStatus as any)) {
        breakdown[b.queryStatus] = (breakdown[b.queryStatus] || 0) + 1;
      }
    });
    return breakdown;
  }, [bookings]);

  const totalSalesActions = Object.values(salesStatusBreakdown).reduce((s, v) => s + v, 0);

  // Top Sellers Data - sorted by GPM (highest first)
  const sellerData = bookings.reduce((acc: any, b) => {
    if (!b.addedBy) return acc;
    if (SALES_STATUSES.includes(b.queryStatus as any)) {
      if (!acc[b.addedBy]) acc[b.addedBy] = { amount: 0, gpm: 0, count: 0, sold: 0, qc: 0, variance: 0, dateChange: 0, scheduleChange: 0, cancellation: 0, gpmByCurr: {} as Record<string, number>, amountByCurr: {} as Record<string, number> };
      acc[b.addedBy].count += 1;
      if (b.queryStatus === 'Sold') acc[b.addedBy].sold += 1;
      if (b.queryStatus === 'Send to QC') acc[b.addedBy].qc += 1;
      if (b.queryStatus === 'Variance') acc[b.addedBy].variance += 1;
      if (b.queryStatus === 'Date Change') acc[b.addedBy].dateChange += 1;
      if (b.queryStatus === 'Schedule Change') acc[b.addedBy].scheduleChange += 1;
      if (b.queryStatus === 'Cancellation') acc[b.addedBy].cancellation += 1;
      let amount = 0;
      let gpm = 0;
      try {
        const pnrs = safeParsePnrDetails(b);
        amount = pnrs.reduce((sum: number, p: any) => sum + (Number(p.sell) || 0), 0);
        gpm = pnrs.reduce((sum: number, p: any) => sum + (Number(p.gpm) || 0), 0);
      } catch { amount = 0; gpm = 0; }
      const curr = (b.currency || 'CAD').toUpperCase();
      acc[b.addedBy].amount += amount;
      acc[b.addedBy].gpm += gpm;
      acc[b.addedBy].gpmByCurr[curr] = (acc[b.addedBy].gpmByCurr[curr] || 0) + gpm;
      acc[b.addedBy].amountByCurr[curr] = (acc[b.addedBy].amountByCurr[curr] || 0) + amount;
    }
    return acc;
  }, {});

  // Sort by GPM highest first
  const topSellers = Object.entries(sellerData)
    .map(([name, data]: any) => ({ name, amount: data.amount, gpm: data.gpm, count: data.count, sold: data.sold, qc: data.qc, variance: data.variance, dateChange: data.dateChange, scheduleChange: data.scheduleChange, cancellation: data.cancellation, gpmByCurr: data.gpmByCurr || {}, amountByCurr: data.amountByCurr || {} }))
    .filter(s => !sellerUserFilter || s.name.toLowerCase().includes(sellerUserFilter.toLowerCase()))
    .sort((a, b) => b.gpm - a.gpm);

  const totalTeamGPM = topSellers.reduce((s, v) => s + v.gpm, 0);
  const totalTeamRevenue = topSellers.reduce((s, v) => s + v.amount, 0);

  // Team GPM & Revenue by currency
  const teamGpmByCurr: Record<string, number> = {};
  const teamAmountByCurr: Record<string, number> = {};
  topSellers.forEach(s => {
    Object.entries(s.gpmByCurr || {}).forEach(([c, v]: any) => { teamGpmByCurr[c] = (teamGpmByCurr[c] || 0) + v; });
    Object.entries(s.amountByCurr || {}).forEach(([c, v]: any) => { teamAmountByCurr[c] = (teamAmountByCurr[c] || 0) + v; });
  });

  // Per-user booking counts for performance tab
  const userBookingCounts = useMemo(() => {
    const counts: Record<string, { total: number; sold: number; qc: number; variance: number; dateChange: number; scheduleChange: number; cancellation: number; gpm: number; amount: number }> = {};
    bookings.forEach(b => {
      if (!b.addedBy) return;
      if (!counts[b.addedBy]) counts[b.addedBy] = { total: 0, sold: 0, qc: 0, variance: 0, dateChange: 0, scheduleChange: 0, cancellation: 0, gpm: 0, amount: 0, gpmByCurr: {} as Record<string, number>, amountByCurr: {} as Record<string, number> };
      if (SALES_STATUSES.includes(b.queryStatus as any)) {
        counts[b.addedBy].total += 1;
        if (b.queryStatus === 'Sold') counts[b.addedBy].sold += 1;
        if (b.queryStatus === 'Send to QC') counts[b.addedBy].qc += 1;
        if (b.queryStatus === 'Variance') counts[b.addedBy].variance += 1;
        if (b.queryStatus === 'Date Change') counts[b.addedBy].dateChange += 1;
        if (b.queryStatus === 'Schedule Change') counts[b.addedBy].scheduleChange += 1;
        if (b.queryStatus === 'Cancellation') counts[b.addedBy].cancellation += 1;
        try {
          const pnrs = safeParsePnrDetails(b);
          const gpmVal = pnrs.reduce((sum: number, p: any) => sum + (Number(p.gpm) || 0), 0);
          const amtVal = pnrs.reduce((sum: number, p: any) => sum + (Number(p.sell) || 0), 0);
          const curr = (b.currency || 'CAD').toUpperCase();
          counts[b.addedBy].gpm += gpmVal;
          counts[b.addedBy].amount += amtVal;
          counts[b.addedBy].gpmByCurr[curr] = (counts[b.addedBy].gpmByCurr[curr] || 0) + gpmVal;
          counts[b.addedBy].amountByCurr[curr] = (counts[b.addedBy].amountByCurr[curr] || 0) + amtVal;
        } catch {}
      }
    });
    return counts;
  }, [bookings]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b', '#4ecdc4', '#45b7d1'];

  // Helper to format currency amounts
  const formatCurrencyAmounts = (byCurr: Record<string, number>) => {
    return Object.entries(byCurr).filter(([_, v]) => v > 0).map(([c, v]) => `$${v.toLocaleString()} ${c}`).join(' | ');
  };



  // Popular Routes
  const routeData = useMemo(() => {
    const acc: Record<string, { total: number; sold: number; qc: number; scheduleChange: number; dateChange: number; cancellation: number; variance: number; gpm: number; amount: number }> = {};
    bookings.forEach(b => {
      if (!SALES_STATUSES.includes(b.queryStatus as any)) return;
      const orig = (b.origin || '').trim().toUpperCase();
      const dest = (b.destination || '').trim().toUpperCase();
      if (!orig || !dest) return;
      const route = `${orig} - ${dest}`;
      if (!acc[route]) acc[route] = { total: 0, sold: 0, qc: 0, scheduleChange: 0, dateChange: 0, cancellation: 0, variance: 0, gpm: 0, amount: 0 };
      acc[route].total++;
      if (b.queryStatus === 'Sold') acc[route].sold++;
      if (b.queryStatus === 'Send to QC') acc[route].qc++;
      if (b.queryStatus === 'Schedule Change') acc[route].scheduleChange++;
      if (b.queryStatus === 'Date Change') acc[route].dateChange++;
      if (b.queryStatus === 'Cancellation') acc[route].cancellation++;
      if (b.queryStatus === 'Variance') acc[route].variance++;
      try {
        const pnrs = safeParsePnrDetails(b);
        const gpmVal = pnrs.reduce((sum: number, p: any) => sum + (Number(p.gpm) || 0), 0);
        const amtVal = pnrs.reduce((sum: number, p: any) => sum + (Number(p.sell) || 0), 0);
        acc[route].gpm += gpmVal;
        acc[route].amount += amtVal;
        const curr = (b.currency || 'CAD').toUpperCase();
        if (!acc[route].gpmByCurr) acc[route].gpmByCurr = {};
        if (!acc[route].amountByCurr) acc[route].amountByCurr = {};
        acc[route].gpmByCurr[curr] = (acc[route].gpmByCurr[curr] || 0) + gpmVal;
        acc[route].amountByCurr[curr] = (acc[route].amountByCurr[curr] || 0) + amtVal;
      } catch {}
    });
    return acc;
  }, [bookings]);

  const popularRoutes = Object.entries(routeData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);

  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const visibleRoutes = showAllRoutes ? popularRoutes : popularRoutes.slice(0, 15);

  // Break trend chart data (daily total break hours)
  const breakTrendData = useMemo(() => {
    return breakDateBreakdown.map(([date, users]) => {
      const totalBreak = Object.values(users).reduce((s, u) => s + u.breakH, 0);
      const userCount = Object.keys(users).length;
      return {
        date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        fullDate: date,
        totalBreak: parseFloat(totalBreak.toFixed(1)),
        avgBreak: userCount > 0 ? parseFloat((totalBreak / userCount).toFixed(2)) : 0,
        users: userCount,
      };
    }).reverse();
  }, [breakDateBreakdown]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
    } catch { return dateStr; }
  };

  const getExportFilename = (ext: string) => {
    const today = new Date().toISOString().split('T')[0];
    const period = dateFilter === 'custom' && customFrom && customTo
      ? `${customFrom}_to_${customTo}`
      : dateFilter === 'custom' ? today
      : dateFilter === 'daily' ? `daily_${today}`
      : dateFilter === 'weekly' ? `weekly_ending_${today}`
      : `monthly_${today.substring(0, 7)}`;
    return `Productivity_${period}.${ext}`;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Productivity Report — ${periodLabel}`, 14, 20);
    const tableData = individualPerf.map(p => [
      p.name,
      `${p.totalHours.toFixed(1)}h`,
      `${p.productiveHours.toFixed(1)}h`,
      `${p.breakHours.toFixed(1)}h`,
      `${p.pct}%`,
      String(p.records),
      p.shift
    ]);
    autoTable(doc, {
      head: [['User', 'Total Hours', 'Productive', 'Break', 'Score', 'Days', 'Shift']],
      body: tableData,
      startY: 30,
    });
    doc.save(getExportFilename('pdf'));
  };

  const handleExportCSV = () => {
    const headers = 'User,Total Hours,Productive Hours,Break Hours,Productivity Score,Days Working,Shift,GPM (CAD),Revenue (CAD),Sold,QC,Variance,Date Change,Schedule Change,Cancellation';
    const rows = individualPerf.map(p => {
      const stats = userBookingCounts[p.name] || { total: 0, sold: 0, qc: 0, variance: 0, dateChange: 0, scheduleChange: 0, cancellation: 0, gpm: 0, amount: 0 };
      return `${p.name},${p.totalHours.toFixed(1)}h,${p.productiveHours.toFixed(1)}h,${p.breakHours.toFixed(1)}h,${p.pct}%,${p.records},${p.shift},$${stats.gpm},$${stats.amount},${stats.sold},${stats.qc},${stats.variance},${stats.dateChange},${stats.scheduleChange},${stats.cancellation}`;
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getExportFilename('csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 size={20} className="text-white" />
            </div>
            Productivity Report
          </h1>
          <p className="text-gray-500 text-sm mt-1">Team productivity, performance & analytics</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Filter size={14} className="text-gray-400" />
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none cursor-pointer pr-6">
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={14} className="text-gray-400" />
            <input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setDateFilter('custom'); }} className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-[130px]" title="From Date" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setDateFilter('custom'); }} className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-[130px]" title="To Date" />
          </div>
          {canExport && (
            <>
              <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2"><Download size={16} /> CSV</button>
              <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2"><FileText size={16} /> PDF</button>
            </>
          )}
        </div>
      </div>

      {!useCheckInData && (filteredSheet.length > 0 || attendanceSheet.length > 0) && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-2 text-sm text-blue-700">
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <span>Hours calculated from attendance records (Present = 8h productive + 1h break). Live check-in/out data will override when available.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleTabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${isActive ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-[1.02]` : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'}`}>
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Users size={20} /></div></div>
          <p className="text-3xl font-bold">{activeCount}</p>
          <p className="text-blue-100 text-xs mt-1">Active {dateFilter === 'daily' ? 'Today' : 'This Period'}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Clock size={20} /></div></div>
          <p className="text-3xl font-bold">{avgHours}h</p>
          <p className="text-emerald-100 text-xs mt-1">Avg Productive Hours</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Coffee size={20} /></div></div>
          <p className="text-3xl font-bold">{avgBreakMin}m</p>
          <p className="text-amber-100 text-xs mt-1">Avg Break Time</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp size={20} /></div></div>
          <p className="text-3xl font-bold">{productivityScore}%</p>
          <p className="text-purple-100 text-xs mt-1">Productivity Score</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-green-500/20">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Award size={20} /></div></div>
          <p className="text-3xl font-bold">${totalTeamGPM.toLocaleString()}</p>
          <p className="text-green-100 text-xs mt-1">{Object.keys(teamGpmByCurr).length > 1 ? Object.entries(teamGpmByCurr).map(([c, v]) => `${c}: $${v.toLocaleString()}`).join(' | ') : `Total Team GPM (${Object.keys(teamGpmByCurr)[0] || 'CAD'})`}</p>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Sales Status Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SALES_STATUSES.map(status => {
              const config = STATUS_COLORS[status];
              const StatusIcon = config.icon;
              const count = salesStatusBreakdown[status] || 0;
              return (
                <div key={status} className={`rounded-xl p-4 border ${config.bg} ${config.border} transition-all hover:shadow-md`}>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIcon size={16} className={config.text} />
                    <span className={`text-xs font-semibold ${config.text}`}>{status}</span>
                  </div>
                  <p className={`text-2xl font-bold ${config.text}`}>{count}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{totalSalesActions > 0 ? `${Math.round((count / totalSalesActions) * 100)}%` : '0%'} of total</p>
                </div>
              );
            })}
          </div>

          {/* Total Sales + GPM Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
              <h3 className="font-semibold text-indigo-800 flex items-center gap-2"><TrendingUp size={16} /> Total Sales Activity</h3>
              <p className="text-xs text-indigo-500 mt-0.5">{periodLabel}</p>
              <p className="text-3xl font-bold text-indigo-700 mt-2">{totalSalesActions}</p>
              <p className="text-xs text-indigo-500">Total Bookings</p>
            </div>
            <div className="card p-5 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100">
              <h3 className="font-semibold text-emerald-800 flex items-center gap-2"><Award size={16} /> Total GPM Earned</h3>
              <p className="text-xs text-emerald-500 mt-0.5">{periodLabel} {Object.keys(teamGpmByCurr).length > 1 ? `(${Object.keys(teamGpmByCurr).join('/')})` : `(${Object.keys(teamGpmByCurr)[0] || 'CAD'})`}</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">${totalTeamGPM.toLocaleString()}</p>
              <p className="text-xs text-emerald-500">{Object.keys(teamGpmByCurr).length > 1 ? Object.entries(teamGpmByCurr).map(([c, v]) => `${c}: $${v.toLocaleString()}`).join(' | ') : 'Gross Profit Margin'}</p>
            </div>
            <div className="card p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
              <h3 className="font-semibold text-blue-800 flex items-center gap-2"><Briefcase size={16} /> Total Revenue</h3>
              <p className="text-xs text-blue-500 mt-0.5">{periodLabel} {Object.keys(teamAmountByCurr).length > 1 ? `(${Object.keys(teamAmountByCurr).join('/')})` : `(${Object.keys(teamAmountByCurr)[0] || 'CAD'})`}</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">${totalTeamRevenue.toLocaleString()}</p>
              <p className="text-xs text-blue-500">{Object.keys(teamAmountByCurr).length > 1 ? Object.entries(teamAmountByCurr).map(([c, v]) => `${c}: $${v.toLocaleString()}`).join(' | ') : 'Total Sold Amount'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><BarChart3 size={16} className="text-blue-500" /> Productive vs Break Hours</h3>
              <p className="text-xs text-gray-400 mb-4">Per team member — {periodLabel}</p>
              {chartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11 }} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any, name: any) => [`${v}h`, name]} labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName || ''} />
                      <Legend />
                      <Bar dataKey="Productive" fill="#10b981" radius={[4, 4, 0, 0]} name="Productive" />
                      <Bar dataKey="Break" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Break" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-gray-400">
                  <p className="text-sm font-medium">No attendance data for {periodLabel}</p>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><PieChartIcon size={16} className="text-purple-500" /> Popular Routes ({popularRoutes.length})</h3>
              <p className="text-xs text-gray-400 mb-4">All booking routes — {periodLabel} | Currency: {Object.keys(teamGpmByCurr).join(', ') || 'CAD'}</p>
              {popularRoutes.length > 0 && (
                <div className="mb-4 h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularRoutes.slice(0, 15).map(r => ({ name: r.name.length > 12 ? r.name.slice(0, 12) + '\u2026' : r.name, fullName: r.name, Bookings: r.total, GPM: r.gpm }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any, name: any) => [name === 'GPM' ? `$${v}` : v, name]} labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName || ''} />
                      <Legend />
                      <Bar dataKey="Bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="GPM" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {visibleRoutes.map((route, idx) => (
                  <div key={idx} className="rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setExpandedRoute(expandedRoute === route.name ? null : route.name)}>
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">#{idx + 1}</div>
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{route.name}</span>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {route.sold > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Sold: {route.sold}</span>}
                            {route.qc > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">QC: {route.qc}</span>}
                            {route.variance > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">Variance: {route.variance}</span>}
                            {route.scheduleChange > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold">Sched: {route.scheduleChange}</span>}
                            {route.dateChange > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">Date: {route.dateChange}</span>}
                            {route.cancellation > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Cancel: {route.cancellation}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-700">{route.total} bookings</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">GPM: ${route.gpm.toLocaleString()} {route.gpmByCurr && Object.keys(route.gpmByCurr).length > 1 ? Object.keys(route.gpmByCurr).join('/') : Object.keys(route.gpmByCurr || {})[0] || 'CAD'}</div>
                        </div>
                      </div>
                    </div>
                    {expandedRoute === route.name && (
                      <div className="px-3 pb-3 border-t border-gray-200 pt-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-white rounded-lg p-2 border border-gray-100"><p className="text-gray-500">Total Bookings</p><p className="font-bold text-gray-800">{route.total}</p></div>
                          <div className="bg-white rounded-lg p-2 border border-emerald-100"><p className="text-gray-500">Total GPM</p><p className="font-bold text-emerald-700">${route.gpm.toLocaleString()} {route.gpmByCurr && Object.keys(route.gpmByCurr).length > 1 ? Object.keys(route.gpmByCurr).join('/') : Object.keys(route.gpmByCurr || {})[0] || 'CAD'}</p></div>
                          <div className="bg-white rounded-lg p-2 border border-blue-100"><p className="text-gray-500">Revenue</p><p className="font-bold text-blue-700">${route.amount.toLocaleString()} {route.amountByCurr && Object.keys(route.amountByCurr).length > 1 ? Object.keys(route.amountByCurr).join('/') : Object.keys(route.amountByCurr || {})[0] || 'CAD'}</p></div>
                          <div className="bg-white rounded-lg p-2 border border-purple-100"><p className="text-gray-500">Variance</p><p className="font-bold text-purple-700">{route.variance}</p></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {popularRoutes.length > 15 && (
                  <button onClick={() => setShowAllRoutes(!showAllRoutes)} className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors">
                    {showAllRoutes ? '\u25b2 Show Less' : `\u25bc Show All ${popularRoutes.length} Routes`}
                  </button>
                )}
                {popularRoutes.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">No booking data for {periodLabel}.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1 max-w-xs">
              <Search size={14} className="text-gray-400" />
              <input type="text" placeholder="Filter by user name..." value={perfUserFilter} onChange={e => setPerfUserFilter(e.target.value)} className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-full" />
            </div>
            <div className="text-xs text-gray-500">{individualPerf.length} members | {periodLabel}</div>
          </div>

          {/* Performance Sales Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
              <p className="text-xs text-emerald-600 font-semibold mb-1">Total Sold</p>
              <p className="text-2xl font-bold text-emerald-700">{salesStatusBreakdown['Sold'] || 0}</p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <p className="text-xs text-blue-600 font-semibold mb-1">Send to QC</p>
              <p className="text-2xl font-bold text-blue-700">{salesStatusBreakdown['Send to QC'] || 0}</p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
              <p className="text-xs text-amber-600 font-semibold mb-1">Variance + Changes</p>
              <p className="text-2xl font-bold text-amber-700">{(salesStatusBreakdown['Variance'] || 0) + (salesStatusBreakdown['Date Change'] || 0) + (salesStatusBreakdown['Schedule Change'] || 0)}</p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
              <p className="text-xs text-red-600 font-semibold mb-1">Cancellations</p>
              <p className="text-2xl font-bold text-red-700">{salesStatusBreakdown['Cancellation'] || 0}</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg"><Award size={18} className="text-emerald-500" /> Individual Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">{periodLabel} — {individualPerf.length} team members | Includes sales activity, GPM, revenue ({Object.keys(teamGpmByCurr).join(', ') || 'CAD'})</p>
            </div>
            <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
              {individualPerf.map((p, idx) => {
                const bookingStats = userBookingCounts[p.name] || { total: 0, sold: 0, qc: 0, variance: 0, dateChange: 0, scheduleChange: 0, cancellation: 0, gpm: 0, amount: 0 };
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-white transition-all border border-gray-100 hover:border-blue-200 hover:shadow-sm">
                    <div className="flex items-center gap-1 min-w-[28px]">
                      {idx === 0 && <span className="text-xl">{String.fromCodePoint(0x1F947)}</span>}
                      {idx === 1 && <span className="text-xl">{String.fromCodePoint(0x1F948)}</span>}
                      {idx === 2 && <span className="text-xl">{String.fromCodePoint(0x1F949)}</span>}
                      {idx > 2 && <span className="text-sm font-bold text-gray-400 w-7 text-center">#{idx+1}</span>}
                    </div>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5">
                        <span className="font-semibold text-gray-900 truncate">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 ${p.shift === 'Night' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.shift === 'Night' ? <Moon size={8} /> : <Sun size={8} />} {p.shift}
                          </span>
                          <span className={`text-sm font-bold ml-2 px-2 py-0.5 rounded-full ${p.pct >= 80 ? 'text-emerald-700 bg-emerald-100' : p.pct >= 60 ? 'text-blue-700 bg-blue-100' : 'text-amber-700 bg-amber-100'}`}>{p.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full transition-all ${p.pct >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : p.pct >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`} style={{ width: `${p.pct}%` }}></div>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> {p.productiveHours.toFixed(1)}h productive</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> {p.breakHours.toFixed(1)}h break</span>
                        {p.records > 1 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {p.records} days</span>}
                      </div>
                      {/* Sales Activity Row */}
                      {bookingStats.total > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {bookingStats.sold > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Sold: {bookingStats.sold}</span>}
                          {bookingStats.qc > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">QC: {bookingStats.qc}</span>}
                          {bookingStats.variance > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">Variance: {bookingStats.variance}</span>}
                          {bookingStats.dateChange > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">Date Chg: {bookingStats.dateChange}</span>}
                          {bookingStats.scheduleChange > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold">Sched Chg: {bookingStats.scheduleChange}</span>}
                          {bookingStats.cancellation > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Cancel: {bookingStats.cancellation}</span>}
                        </div>
                      )}
                      {/* GPM & Revenue by Currency */}
                      {bookingStats.gpm > 0 && (
                        <div className="flex gap-3 mt-1.5 text-xs flex-wrap">
                          <span className="text-emerald-700 font-bold">GPM: {bookingStats.gpmByCurr && Object.keys(bookingStats.gpmByCurr).length > 1 ? formatCurrencyAmounts(bookingStats.gpmByCurr) : `$${bookingStats.gpm.toLocaleString()} ${Object.keys(bookingStats.gpmByCurr || {})[0] || 'CAD'}`}</span>
                          <span className="text-blue-700 font-semibold">Revenue: {bookingStats.amountByCurr && Object.keys(bookingStats.amountByCurr).length > 1 ? formatCurrencyAmounts(bookingStats.amountByCurr) : `$${bookingStats.amount.toLocaleString()} ${Object.keys(bookingStats.amountByCurr || {})[0] || 'CAD'}`}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500 min-w-[75px] flex-shrink-0">
                      <div className="font-bold text-gray-900 text-lg">{p.totalHours.toFixed(1)}h</div>
                      <div className="text-xs text-gray-400">total</div>
                      {bookingStats.total > 0 && <div className="text-xs text-purple-600 font-semibold mt-1">{bookingStats.total} tickets</div>}
                      {bookingStats.gpm > 0 && <div className="text-xs text-emerald-600 font-bold mt-0.5">${bookingStats.gpm.toLocaleString()}</div>}
                    </div>
                  </div>
                );
              })}
              {individualPerf.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="font-medium">No data for {periodLabel}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'breaks' && (
        <div className="space-y-6">
          {/* Break Hours Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Timer size={20} className="text-orange-600" /></div>
                <div><p className="text-2xl font-bold text-orange-700">{avgBreakMin}m</p><p className="text-xs text-orange-500">Avg Break / Person</p></div>
              </div>
            </div>
            <div className="card p-5 bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Coffee size={20} className="text-red-600" /></div>
                <div><p className="text-2xl font-bold text-red-700">{totalBreakH.toFixed(1)}h</p><p className="text-xs text-red-500">Total Break Hours</p></div>
              </div>
            </div>
            <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Briefcase size={20} className="text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-blue-700">{totalH > 0 ? Math.round((totalBreakH / totalH) * 100) : 0}%</p><p className="text-xs text-blue-500">Break vs Total Ratio</p></div>
              </div>
            </div>
            <div className="card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><Clock size={20} className="text-green-600" /></div>
                <div><p className="text-2xl font-bold text-green-700">{totalProductiveH.toFixed(1)}h</p><p className="text-xs text-green-500">Total Productive Hours</p></div>
              </div>
            </div>
          </div>

          {/* Break Trend Chart - Day by Day */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><BarChart3 size={16} className="text-orange-500" /> Daily Break Trend</h3>
            <p className="text-xs text-gray-400 mb-4">Average break hours per person, day by day — {periodLabel}</p>
            {breakTrendData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={breakTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'Hrs', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip formatter={(v: any, name: any) => [`${v}h`, name === 'avgBreak' ? 'Avg Break/Person' : 'Total Break']} />
                    <Legend />
                    <Line type="monotone" dataKey="avgBreak" stroke="#f59e0b" strokeWidth={2} name="Avg Break/Person" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="totalBreak" stroke="#ef4444" strokeWidth={2} name="Total Break" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <Coffee size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No break data for {periodLabel}</p>
              </div>
            )}
          </div>

          {/* Break chart - per person */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><Coffee size={16} className="text-amber-500" /> Break Hours by Person</h3>
            <p className="text-xs text-gray-400 mb-4">Sorted by break time — {periodLabel}</p>
            {breakData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakData.map(d => ({ name: d.name.split(' ')[0], fullName: d.name, Break: parseFloat(d.breakHours.toFixed(1)), Productive: parseFloat(d.productiveHours.toFixed(1)) }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any, name: any) => [`${v}h`, name]} labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName || ''} />
                    <Legend />
                    <Bar dataKey="Break" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Break Hours" />
                    <Bar dataKey="Productive" fill="#10b981" radius={[0, 4, 4, 0]} name="Productive Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <Coffee size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No break data for {periodLabel}</p>
              </div>
            )}
          </div>

          {/* Break Date-by-Date Breakdown Table */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={16} className="text-amber-500" /> Date-by-Date Break Report</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily break hours per agent with shift info — {periodLabel}</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {breakDateBreakdown.map(([date, users]) => (
                <div key={date} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center"><Calendar size={14} /></div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{formatDate(date)}</h4>
                      <p className="text-[10px] text-gray-400">{Object.keys(users).length} agents | Total: {Object.values(users).reduce((s, u) => s + u.breakH, 0).toFixed(1)}h break</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(users).map(([name, data]) => (
                      <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">{name[0]?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span className="text-amber-600 font-medium">{data.breakH.toFixed(1)}h break</span>
                            <span className={`px-1 py-0 rounded text-[9px] font-bold ${data.shift === 'Night' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                              {data.shift === 'Night' ? String.fromCodePoint(0x1F319) : String.fromCodePoint(0x2600, 0xFE0F)} {data.shift}
                            </span>
                            <span className={`text-[9px] px-1 rounded ${data.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{data.status}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${data.breakH > 1.5 ? 'text-red-600' : data.breakH > 1 ? 'text-amber-600' : 'text-green-600'}`}>
                          {Math.round(data.breakH * 60)}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {breakDateBreakdown.length === 0 && (
                <div className="text-center py-8 text-gray-500"><Coffee size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No break data for {periodLabel}</p></div>
              )}
            </div>
          </div>

          {/* Break Details Summary Table */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Coffee size={16} className="text-amber-500" /> Break Hours Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <th className="text-left px-4 py-3 text-xs font-bold text-amber-800 uppercase">Agent</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-800 uppercase">Shift</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-800 uppercase">Break Hours</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-800 uppercase">Break Min</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-800 uppercase">Productive</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-800 uppercase">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-800 uppercase">Break %</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-800 uppercase">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {breakData.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-amber-50/50 transition-colors">
                      <td className="px-4 py-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">{p.name[0]?.toUpperCase()}</div>
                          <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border border-gray-200">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold ${p.shift === 'Night' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.shift === 'Night' ? <Moon size={10} /> : <Sun size={10} />} {p.shift}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-700 border border-gray-200">{p.breakHours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-center text-gray-600 border border-gray-200">{p.breakMinutes}m</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-medium border border-gray-200">{p.productiveHours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-center text-gray-600 border border-gray-200">{p.totalHours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-center border border-gray-200">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.breakPct > 20 ? 'bg-red-100 text-red-700' : p.breakPct > 12 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{p.breakPct}%</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-sm border border-gray-200">{p.records}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {breakData.length === 0 && (
                <div className="text-center py-8 text-gray-500"><Coffee size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No break data for {periodLabel}</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sellers' && (
        <div className="space-y-6">
          {/* Seller Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1 max-w-xs">
              <Search size={14} className="text-gray-400" />
              <input type="text" placeholder="Filter by seller name..." value={sellerUserFilter} onChange={e => setSellerUserFilter(e.target.value)} className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-full" />
            </div>
            <div className="text-xs text-gray-500">Sorted by GPM (highest first) | {periodLabel} | Currency: {Object.keys(teamGpmByCurr).join(', ') || 'CAD'}</div>
          </div>

          {/* GPM Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
              <p className="text-xs text-emerald-600 font-semibold mb-1">Total Team GPM</p>
              <p className="text-2xl font-bold text-emerald-700">${totalTeamGPM.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-500">{Object.keys(teamGpmByCurr).join('/') || 'CAD'} | {periodLabel}</p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <p className="text-xs text-blue-600 font-semibold mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-700">${totalTeamRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-blue-500">{Object.keys(teamAmountByCurr).join('/') || 'CAD'} | {periodLabel}</p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
              <p className="text-xs text-purple-600 font-semibold mb-1">Total Sellers</p>
              <p className="text-2xl font-bold text-purple-700">{topSellers.length}</p>
              <p className="text-[10px] text-purple-500">Active agents with sales</p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
              <p className="text-xs text-amber-600 font-semibold mb-1">Total Tickets</p>
              <p className="text-2xl font-bold text-amber-700">{topSellers.reduce((s, v) => s + v.count, 0)}</p>
              <p className="text-[10px] text-amber-500">All sales statuses</p>
            </div>
          </div>

          {/* Sales Status Quick Summary */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SALES_STATUSES.map(status => {
              const config = STATUS_COLORS[status];
              const StatusIcon = config.icon;
              return (
                <div key={status} className={`rounded-lg p-3 border ${config.bg} ${config.border} text-center`}>
                  <StatusIcon size={14} className={`${config.text} mx-auto mb-1`} />
                  <p className={`text-lg font-bold ${config.text}`}>{salesStatusBreakdown[status] || 0}</p>
                  <p className="text-[9px] text-gray-500 font-medium">{status}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-purple-500" /> GPM Distribution</h3>
              <p className="text-xs text-gray-400 mb-4">By GPM earned ({Object.keys(teamGpmByCurr).join(', ') || 'CAD'}) — {periodLabel}</p>
              {topSellers.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topSellers.slice(0, 8)} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={90} fill="#8884d8" dataKey="gpm">
                        {topSellers.slice(0, 8).map((_entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-gray-400"><p className="text-sm font-medium">No sales data for {periodLabel}</p></div>
              )}
            </div>

            {/* Top Sellers List - sorted by GPM */}
            <div className="card">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2"><Award size={16} className="text-purple-500" /> Top Sellers Leaderboard</h2>
                <p className="text-xs text-gray-400 mt-0.5">{periodLabel} — Ranked by GPM earned ({Object.keys(teamGpmByCurr).join(', ') || 'CAD'}) | Shows all activity</p>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {topSellers.map((seller: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 transition-all border border-purple-100 hover:border-purple-200">
                    <div className="flex items-center justify-center min-w-[32px]">
                      {idx === 0 && <span className="text-2xl">{String.fromCodePoint(0x1F3C6)}</span>}
                      {idx === 1 && <span className="text-xl">{String.fromCodePoint(0x1F948)}</span>}
                      {idx === 2 && <span className="text-xl">{String.fromCodePoint(0x1F949)}</span>}
                      {idx > 2 && <span className="text-sm font-bold text-gray-400">#{idx+1}</span>}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {seller.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{seller.name}</p>
                      <p className="text-xs text-gray-500">{seller.count} total tickets</p>
                      {/* Status breakdown */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {seller.sold > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Sold: {seller.sold}</span>}
                        {seller.qc > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">QC: {seller.qc}</span>}
                        {seller.variance > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">Variance: {seller.variance}</span>}
                        {seller.dateChange > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">Date Chg: {seller.dateChange}</span>}
                        {seller.scheduleChange > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold">Sched Chg: {seller.scheduleChange}</span>}
                        {seller.cancellation > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Cancel: {seller.cancellation}</span>}
                      </div>
                    </div>
                    <div className="text-right min-w-[90px]">
                      <p className="font-bold text-emerald-700 text-lg">${seller.gpm.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-500 font-semibold">{Object.keys(seller.gpmByCurr || {}).length > 1 ? formatCurrencyAmounts(seller.gpmByCurr) : `GPM (${Object.keys(seller.gpmByCurr || {})[0] || 'CAD'})`}</p>
                      <p className="font-semibold text-blue-700 text-sm mt-1">${seller.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-blue-500">{Object.keys(seller.amountByCurr || {}).length > 1 ? formatCurrencyAmounts(seller.amountByCurr) : `Revenue (${Object.keys(seller.amountByCurr || {})[0] || 'CAD'})`}</p>
                    </div>
                  </div>
                ))}
                {topSellers.length === 0 && (
                  <div className="text-center py-8 text-gray-500"><p className="font-medium">No sales data for {periodLabel}.</p></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'daily' && canViewLogs && (
        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={16} className="text-cyan-500" /> Daily Attendance Log</h2>
              <p className="text-xs text-gray-400 mt-0.5">Date-by-date breakdown — {periodLabel} | Visible to HR & Admin only</p>
            </div>
            {dailyLog.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {dailyLog.map(([date, users]) => (
                  <div key={date} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex items-center justify-center"><Calendar size={14} /></div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{formatDate(date)}</h4>
                        <p className="text-[10px] text-gray-400">{Object.keys(users).length} staff</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(users).map(([name, data]) => (
                        <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">{name[0]?.toUpperCase()}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span className="text-emerald-600 font-medium">{data.productive.toFixed(1)}h</span>
                              <span className="text-amber-600">{data.break.toFixed(1)}h brk</span>
                              <span className={`px-1 py-0 rounded text-[9px] font-bold ${data.shift === 'Night' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>{data.shift}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${data.status === 'Present' ? 'bg-green-100 text-green-700' : data.status === 'Half Day' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {data.status === 'Present' ? 'P' : data.status === 'Half Day' ? 'HD' : data.status.charAt(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No daily data for {periodLabel}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
