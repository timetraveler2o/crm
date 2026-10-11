import React from 'react';
import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../types';
import { Download, ChevronLeft, ChevronRight, CalendarDays, Users, Eye, Filter, Paintbrush, X, CheckCircle2, UserCheck, Undo2, Wallet, Pencil, Save, XCircle, Printer, History } from 'lucide-react';
import { useState, useMemo, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EDIT_ROLES = ['Admin', 'HR (Human Resource)'];
const STAFF_ROLES = ['Admin', 'HR (Human Resource)', 'IT (Information Tech)', 'Manager', 'Supervisor', 'Operation Manager', 'Ticketing', 'Accountant'];
const OWNER_NAME = 'Ramit';

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

type TabType = 'attendance' | 'leave';

// Normalize log entries: handle both old double-serialized string entries and new object entries
const normalizeLogEntry = (entry: any): { updatedBy: string; updatedAt: string; action: string } => {
  if (typeof entry === 'string') {
    try {
      const parsed = JSON.parse(entry);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
      return { action: entry, updatedBy: 'System', updatedAt: 'N/A' };
    } catch {
      return { action: entry, updatedBy: 'System', updatedAt: 'N/A' };
    }
  }
  if (typeof entry === 'object' && entry !== null) return entry;
  return { action: String(entry), updatedBy: 'System', updatedAt: 'N/A' };
};

export default function Attendance() {
  const { users, attendanceSheet, setAttendanceEntry, leaveBalances, updateLeaveBalance } = useCrmStore();
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();

  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;

  const companyUsers = useMemo(() => {
    return users.filter(u => {
      // Hide owner
      if (u.name.toLowerCase().startsWith(OWNER_NAME.toLowerCase())) return false;
      if (!u.company) return displayCompany === 'GSF';
      if (displayCompany === 'GSF') return u.company === 'Get Set Flight';
      if (displayCompany === 'LBT') return u.company === 'Look Book Ticket';
      if (displayCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
      return false;
    });
  }, [users, displayCompany]);

  const canEdit = currentUser ? (EDIT_ROLES.includes(currentUser.role)) : false;
  const isAgent = currentUser?.role === 'Agent';
  const canExport = currentUser?.permissions?.includes('Export Data') || ['Admin', 'Operation Manager', 'HR (Human Resource)'].includes(currentUser?.role || '');
  const canMarkAttendance = currentUser ? EDIT_ROLES.includes(currentUser.role) : false;

  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [viewMode, setViewMode] = useState<'all' | 'my'>(isAgent ? 'my' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarking, setIsMarking] = useState(false);
  const [selectedBrush, setSelectedBrush] = useState<AttendanceStatus | null>(null);
  const [editCell, setEditCell] = useState<{ userId: number; date: string } | null>(null);
  const [undoStack, setUndoStack] = useState<{ userId: number; date: string; prevStatus: AttendanceStatus | null }[]>([]);
  const [markAllDate, setMarkAllDate] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [editingLeave, setEditingLeave] = useState<number | null>(null);
  const [editLeaveData, setEditLeaveData] = useState<{ allocated?: number; used?: number }>({});
  const [leaveSearch, setLeaveSearch] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customExportFrom, setCustomExportFrom] = useState('');
  const [customExportTo, setCustomExportTo] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<any[]>([]);
  const [logTitle, setLogTitle] = useState('');

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayName = (day: number) => {
    const d = new Date(year, month, day);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  };
  const isSunday = (day: number) => new Date(year, month, day).getDay() === 0;

  // Separate staff and agents
  const allFilteredUsers = useMemo(() => {
    let filtered = companyUsers.filter(u => u.status === 'Active');
    if (viewMode === 'my' && currentUser) {
      filtered = filtered.filter(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
      if (filtered.length === 0) {
        filtered = [{ id: currentUser.id, addedBy: '', name: currentUser.name, role: currentUser.role, email: currentUser.email, phone: currentUser.phone, gender: currentUser.gender, status: 'Active' as const, created: '', modified: '' }];
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return filtered;
  }, [companyUsers, viewMode, currentUser, searchQuery, canEdit]);

  const staffUsers = useMemo(() => allFilteredUsers.filter(u => STAFF_ROLES.includes(u.role)), [allFilteredUsers]);
  const agentUsers = useMemo(() => allFilteredUsers.filter(u => !STAFF_ROLES.includes(u.role)), [allFilteredUsers]);

  const leaveActiveUsers = useMemo(() => {
    let filtered = companyUsers.filter(u => u.status === 'Active');
    if (viewMode === 'my' && currentUser) {
      filtered = filtered.filter(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
      if (filtered.length === 0) {
        filtered = [{ id: currentUser.id, addedBy: '', name: currentUser.name, role: currentUser.role, email: currentUser.email, phone: currentUser.phone, gender: currentUser.gender, status: 'Active' as const, created: '', modified: '' }];
      }
    }
    if (leaveSearch.trim()) {
      const q = leaveSearch.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
    }
    return filtered;
  }, [companyUsers, leaveSearch, viewMode, currentUser, canEdit]);

  const sheetMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    attendanceSheet.forEach(e => { map[`${e.userId}-${e.date}`] = e.status; });
    return map;
  }, [attendanceSheet]);

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const getStatus = (userId: number, day: number): AttendanceStatus | null => sheetMap[`${userId}-${getDateStr(day)}`] || null;
  const getStatusConfig = (status: AttendanceStatus | null) => {
    if (!status) return null;
    return ATTENDANCE_STATUSES.find(s => s.value === status) || null;
  };

  // FIXED: Accurate attendance percentage - starts from 0% 
  // Only counts MARKED days. If nothing is marked, returns 0%.
  // Numerator: Present + Half Day (0.5) + Week Off + Comp Off + Paid Leave
  // Attendance % Logic (Production-grade):
  // GOOD days (count as 1 full day each): Present, Half Day, Week Off, Comp Off, Paid Leave
  // BAD days (reduce %): Absent, Non-Paid Leave, Blank/unmarked past days
  // Formula: % = goodDays / totalElapsedDays × 100
  // Denominator: Past month = all calendar days | Current month = days 1..today | Future month = 0%
  // 100% = every elapsed day is marked as a good status (no absent/non-paid/blank)
  const getAttendancePercentage = (userId: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Future month → 0%
    if (year > currentYear || (year === currentYear && month > currentMonth)) return 0;
    
    // Determine how many calendar days to evaluate
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    // Past month: use full month days | Current month: days up to today
    const elapsedDays = (year === currentYear && month === currentMonth)
      ? Math.min(now.getDate(), totalDaysInMonth)
      : totalDaysInMonth;
    
    if (elapsedDays <= 0) return 0;
    
    // Build a map of date → status for this user & month
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const entries = attendanceSheet.filter(e => e.userId === userId && e.date.startsWith(monthStr));
    const statusMap: Record<number, string> = {};
    entries.forEach(e => {
      const dayNum = parseInt(e.date.split('-')[2], 10);
      if (dayNum >= 1 && dayNum <= elapsedDays) {
        statusMap[dayNum] = e.status;
      }
    });
    
    // Count good days: Present, Half Day (full day!), Week Off, Comp Off, Paid Leave
    let goodDays = 0;
    for (let d = 1; d <= elapsedDays; d++) {
      const status = statusMap[d];
      if (status === 'Present' || status === 'Half Day' || status === 'Week Off' || status === 'Comp Off' || status === 'Paid Leave') {
        goodDays += 1; // Half Day counts as FULL day for attendance %
      }
      // Absent, Non-Paid Leave, or blank/unmarked → 0 (doesn't add to goodDays)
    }
    
    const pct = Math.round((goodDays / elapsedDays) * 100);
    return Math.min(Math.max(pct, 0), 100);
  };

  const getUserSummary = (userId: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const entries = attendanceSheet.filter(e => e.userId === userId && e.date.startsWith(monthStr));
    const counts: Record<string, number> = {};
    entries.forEach(e => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return counts;
  };

  // FIXED: Leave balance is COMPLETELY independent from attendance sheet
  // Only HR/Admin can manually update - no auto-counting from attendance at all
  // No connection to paid leave marking in attendance sheet

  // Cell click handler
  const handleCellClick = useCallback(async (userId: number, day: number) => {
    if (!canEdit) return;
    const dateStr = getDateStr(day);
    if (isMarking && selectedBrush) {
      const prevStatus = sheetMap[`${userId}-${dateStr}`] || null;
      const logEntry = JSON.stringify({ updatedBy: currentUser?.name, updatedAt: formatLogDateTime(), action: `Changed from ${prevStatus || 'None'} to ${selectedBrush}` });
      try {
        await setAttendanceEntry(userId, dateStr, selectedBrush, logEntry);
        setUndoStack(prev => [...prev, { userId, date: dateStr, prevStatus }]);
        const config = ATTENDANCE_STATUSES.find(s => s.value === selectedBrush);
        const userName = users.find(u => u.id === userId)?.name || 'User';
        showToast(`${userName} — ${day} ${monthNames[month].slice(0, 3)} → ${config?.label || selectedBrush}`);
      } catch { showToast('Failed to update.', 'info'); }
    } else {
      setEditCell(prev => (prev?.userId === userId && prev?.date === dateStr) ? null : { userId, date: dateStr });
    }
  }, [canEdit, isMarking, selectedBrush, sheetMap, month, year, users, currentUser]);

  const handleStatusSelect = async (status: AttendanceStatus | null) => {
    if (editCell) {
      const prevStatus = sheetMap[`${editCell.userId}-${editCell.date}`] || null;
      const logEntry = JSON.stringify({ updatedBy: currentUser?.name, updatedAt: formatLogDateTime(), action: `Changed from ${prevStatus || 'None'} to ${status || 'None'}` });
      try {
        await setAttendanceEntry(editCell.userId, editCell.date, status as any, logEntry);
        setUndoStack(prev => [...prev, { userId: editCell.userId, date: editCell.date, prevStatus }]);
        setEditCell(null);
        showToast(status ? 'Attendance updated' : 'Attendance cleared');
      } catch { showToast('Failed to update.', 'info'); }
    }
  };

  const handleMarkAll = (day: number, status: AttendanceStatus) => {
    const dateStr = getDateStr(day);
    const batch: typeof undoStack = [];
    const logEntry = JSON.stringify({ updatedBy: currentUser?.name, updatedAt: formatLogDateTime(), action: `Bulk marked as ${status}` });
    allFilteredUsers.forEach(user => {
      const prev = sheetMap[`${user.id}-${dateStr}`] || null;
      batch.push({ userId: user.id, date: dateStr, prevStatus: prev });
      setAttendanceEntry(user.id, dateStr, status, logEntry);
    });
    setUndoStack(prev => [...prev, ...batch]);
    setMarkAllDate(null);
    showToast(`All ${allFilteredUsers.length} employees marked as ${status} for ${day} ${monthNames[month].slice(0, 3)}`);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const logEntry = JSON.stringify({ updatedBy: currentUser?.name, updatedAt: formatLogDateTime(), action: `Undone to ${last.prevStatus || 'None'}` });
    if (last.prevStatus) { setAttendanceEntry(last.userId, last.date, last.prevStatus, logEntry); }
    else { setAttendanceEntry(last.userId, last.date, null as any, logEntry); }
    setUndoStack(prev => prev.slice(0, -1));
    showToast('Undone last change', 'info');
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const markPresent = async () => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    await setAttendanceEntry(currentUser.id, today, 'Present');
    showToast('Marked Present for today');
  };

  const getSummary = () => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const activeUserIds = new Set(allFilteredUsers.map(u => u.id));
    const monthEntries = attendanceSheet.filter(e => e.date.startsWith(monthStr) && activeUserIds.has(e.userId));
    const counts: Record<string, number> = {};
    ATTENDANCE_STATUSES.forEach(s => { counts[s.value] = 0; });
    monthEntries.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
    return counts;
  };
  const summary = getSummary();

  // Professional Colorful Excel Export using ExcelJS (dynamic import)
  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    const statusLabels: Record<string, string> = {};
    const statusColors: Record<string, { bg: string; text: string }> = {};
    ATTENDANCE_STATUSES.forEach(s => { 
      statusLabels[s.value] = s.short;
      statusColors[s.short] = { bg: s.bg.replace('#', ''), text: s.color.replace('#', '') };
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Get Set Flight CRM';
    const ws = wb.addWorksheet('Attendance', { views: [{ state: 'frozen', ySplit: 4, xSplit: 3 }] });

    // Title row
    const titleRow = ws.addRow([`Attendance Sheet — ${monthNames[month]} ${year}`]);
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF2563EB' } };
    ws.mergeCells(1, 1, 1, dates.length + 8);

    // Info row
    const infoRow = ws.addRow([`Company: ${displayCompany?.toUpperCase() || 'ALL'} | Generated: ${new Date().toLocaleDateString('en-GB')} | Employees: ${allFilteredUsers.length}`]);
    infoRow.getCell(1).font = { size: 9, color: { argb: 'FF6B7280' } };
    ws.mergeCells(2, 1, 2, dates.length + 8);

    // Empty row
    ws.addRow([]);

    // Header row
    const headers = ['S.No', 'Employee', 'Role', ...dates.map(d => `${d}`), 'P', 'A', 'NP', 'L', '%'];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data rows
    allFilteredUsers.forEach((user, idx) => {
      const counts = getUserSummary(user.id);
      const pct = getAttendancePercentage(user.id);
      const rowData: (string | number)[] = [idx + 1, user.name, user.role];
      dates.forEach(day => {
        const s = getStatus(user.id, day);
        rowData.push(s ? (statusLabels[s] || s) : (isSunday(day) ? 'WO' : '-'));
      });
      rowData.push(counts['Present'] || 0);
      rowData.push(counts['Absent'] || 0);
      rowData.push(counts['Non-Paid Leave'] || 0);
      rowData.push((counts['Paid Leave'] || 0) + (counts['Comp Off'] || 0));
      rowData.push(`${pct}%`);

      const row = ws.addRow(rowData);
      row.eachCell((cell, colNum) => {
        cell.font = { size: 8 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        
        // Alternate row color
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }

        // Color status cells
        if (colNum > 3 && colNum <= 3 + dates.length) {
          const val = String(cell.value);
          if (statusColors[val]) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + statusColors[val].bg.replace('#','') } };
            cell.font = { bold: true, size: 8, color: { argb: 'FF' + statusColors[val].text.replace('#','') } };
          } else if (val === 'WO') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            cell.font = { size: 8, color: { argb: 'FF6B7280' } };
          }
        }

        // Name column left-aligned
        if (colNum === 2 || colNum === 3) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.font = { size: 9, bold: colNum === 2 };
        }

        // Summary columns coloring
        const summaryStart = 4 + dates.length;
        if (colNum === summaryStart) { cell.font = { bold: true, size: 9, color: { argb: 'FF16A34A' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; }
        if (colNum === summaryStart + 1) { cell.font = { bold: true, size: 9, color: { argb: 'FFDC2626' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; }
        if (colNum === summaryStart + 2) { cell.font = { bold: true, size: 9, color: { argb: 'FFEA580C' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } }; }
        if (colNum === summaryStart + 3) { cell.font = { bold: true, size: 9, color: { argb: 'FF7C3AED' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } }; }
        // Percentage column
        if (colNum === summaryStart + 4) {
          cell.font = { bold: true, size: 9, color: { argb: pct >= 90 ? 'FF16A34A' : pct >= 75 ? 'FFD97706' : 'FFDC2626' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pct >= 90 ? 'FFDCFCE7' : pct >= 75 ? 'FFFEF3C7' : 'FFFEE2E2' } };
        }
      });
    });

    // Set column widths
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 22;
    ws.getColumn(3).width = 16;
    for (let i = 4; i <= 3 + dates.length; i++) ws.getColumn(i).width = 4;
    ws.getColumn(4 + dates.length).width = 6;
    ws.getColumn(5 + dates.length).width = 6;
    ws.getColumn(6 + dates.length).width = 6;
    ws.getColumn(7 + dates.length).width = 6;
    ws.getColumn(8 + dates.length).width = 7;

    // Download
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `attendance_${monthNames[month].toLowerCase()}_${year}.xlsx`);
  };

  // Professional PDF Export with colors
  const exportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a3');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(`Attendance Sheet — ${monthNames[month]} ${year}`, 14, 12);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Company: ${displayCompany?.toUpperCase() || 'ALL'} | Generated: ${new Date().toLocaleDateString('en-GB')} | Total: ${allFilteredUsers.length} employees`, 14, 17);

    const statusLabels: Record<string, string> = {};
    ATTENDANCE_STATUSES.forEach(s => { statusLabels[s.value] = s.short; });

    const headers = ['#', 'Employee', 'Role', ...dates.map(d => `${d}`), 'P', 'A', 'NP', 'L', '%'];
    const rows = allFilteredUsers.map((user, idx) => {
      const counts = getUserSummary(user.id);
      const row: string[] = [String(idx + 1), user.name, user.role];
      dates.forEach(day => {
        const s = getStatus(user.id, day);
        row.push(s ? (statusLabels[s] || '-') : (isSunday(day) ? 'WO' : '-'));
      });
      row.push(String(counts['Present'] || 0));
      row.push(String(counts['Absent'] || 0));
      row.push(String(counts['Non-Paid Leave'] || 0));
      row.push(String((counts['Paid Leave'] || 0) + (counts['Comp Off'] || 0)));
      row.push(`${getAttendancePercentage(user.id)}%`);
      return row;
    });

    const statusColorMap: Record<string, { fill: number[]; text: number[] }> = {
      'P': { fill: [220, 252, 231], text: [22, 163, 74] },
      'HD': { fill: [254, 243, 199], text: [180, 83, 9] },
      'PL': { fill: [237, 233, 254], text: [124, 58, 237] },
      'NP': { fill: [255, 237, 213], text: [234, 88, 12] },
      'A': { fill: [254, 226, 226], text: [220, 38, 38] },
      'CO': { fill: [204, 251, 241], text: [13, 148, 136] },
      'WO': { fill: [243, 244, 246], text: [75, 85, 99] },
    };

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 20,
      styles: { fontSize: 5, cellPadding: 1, halign: 'center', lineWidth: 0.1, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 5 },
      columnStyles: { 0: { cellWidth: 6 }, 1: { halign: 'left', cellWidth: 22 }, 2: { halign: 'left', cellWidth: 16 } },
      margin: { top: 10, right: 5, bottom: 10, left: 5 },
      theme: 'grid',
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const col = data.column.index;
          const cellText = data.cell.raw;
          if (col >= 3 && col < 3 + dates.length) {
            const colors = statusColorMap[cellText];
            if (colors) {
              data.cell.styles.fillColor = colors.fill;
              data.cell.styles.textColor = colors.text;
              data.cell.styles.fontStyle = 'bold';
            }
          }
          // Percentage column
          if (col === headers.length - 1) {
            const pctVal = parseInt(cellText);
            if (pctVal >= 90) { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [22, 163, 74]; }
            else if (pctVal >= 75) { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [180, 83, 9]; }
            else { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [220, 38, 38]; }
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.row.index % 2 === 0 && !statusColorMap[cellText] && col >= 3 && col < 3 + dates.length) {
            data.cell.styles.fillColor = [249, 250, 251];
          }
        }
      },
    });

    // Legend
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFontSize(7);
    doc.setTextColor(100);
    let lx = 14;
    ATTENDANCE_STATUSES.forEach(s => {
      doc.text(`${s.short} = ${s.label}`, lx, finalY + 6);
      lx += 30;
    });

    doc.save(`attendance_${monthNames[month].toLowerCase()}_${year}.pdf`);
  };

  // Leave Balance - FIXED: Completely independent from attendance sheet
  // All values are manually set by HR/Admin - no auto-counting
  // For new months/years where no entry exists: defaults to 0 used, 0 allocated
  // HR/Admin can update allocated and used manually
  const getLeaveData = (userId: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Future months: show 0/0/0 (no data exists yet)
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return { allocated: 0, used: 0, left: 0 };
    }
    
    const balance = leaveBalances.find(lb => lb.userId === userId && lb.year === year);
    // For current and past months: show actual DB data
    const allocated = balance?.paidLeave ?? 0;
    // Used is ONLY from manual HR entry - never auto-counted from attendance
    const used = balance?.paidLeaveUsed ?? 0;
    const left = allocated - used;
    return { allocated, used, left };
  };

  // Leave edit handlers - FIXED: Actually saves and updates properly
  const startEditLeave = (userId: number) => {
    const data = getLeaveData(userId);
    setEditingLeave(userId);
    setEditLeaveData({ allocated: data.allocated, used: data.used });
  };

  const saveEditLeave = async () => {
    if (editingLeave !== null) {
      const allocated = editLeaveData.allocated ?? 0;
      const used = editLeaveData.used ?? 0;
      const logEntry = JSON.stringify({ updatedBy: currentUser?.name, updatedAt: formatLogDateTime(), action: `Updated: Allocated=${allocated}, Used=${used}, Left=${allocated - used}` });
      await updateLeaveBalance(editingLeave, year, { paidLeave: allocated, paidLeaveUsed: used }, logEntry);
      showToast('Leave balance updated successfully');
      setEditingLeave(null);
      setEditLeaveData({});
    }
  };

  const cancelEditLeave = () => { setEditingLeave(null); setEditLeaveData({}); };

  // Leave Excel Export - Colorful with ExcelJS (dynamic import)
  const exportLeaveExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Get Set Flight CRM';
    const ws = wb.addWorksheet('Leave Balance', { views: [{ state: 'frozen', ySplit: 4, xSplit: 2 }] });

    // Title
    const titleRow = ws.addRow([`Leave Balance Report — Year ${year}`]);
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF7C3AED' } };
    ws.mergeCells(1, 1, 1, 7);

    // Info
    const infoRow = ws.addRow([`Company: ${displayCompany?.toUpperCase() || 'ALL'} | Generated: ${new Date().toLocaleDateString('en-GB')}`]);
    infoRow.getCell(1).font = { size: 9, color: { argb: 'FF6B7280' } };
    ws.mergeCells(2, 1, 2, 7);

    ws.addRow([]);

    // Header
    const headers = ['S.No', 'Employee', 'Role', 'Allocated', 'Used', 'Left', 'Status'];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data rows
    leaveActiveUsers.forEach((user, idx) => {
      const data = getLeaveData(user.id);
      const status = data.left < 0 ? 'OVERUSED' : data.left === 0 ? 'FULLY USED' : 'AVAILABLE';
      const row = ws.addRow([idx + 1, user.name, user.role, data.allocated, data.used, data.left, status]);
      
      row.eachCell((cell, colNum) => {
        cell.font = { size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        if (idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        if (colNum === 2) { cell.alignment = { horizontal: 'left' }; cell.font = { bold: true, size: 9 }; }
        if (colNum === 3) cell.alignment = { horizontal: 'left' };
        if (colNum === 4) { cell.font = { bold: true, size: 10, color: { argb: 'FF2563EB' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; }
        if (colNum === 5) { cell.font = { bold: true, size: 10, color: { argb: 'FFD97706' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; }
        if (colNum === 6) { 
          const val = data.left;
          cell.font = { bold: true, size: 10, color: { argb: val > 0 ? 'FF16A34A' : val < 0 ? 'FFDC2626' : 'FF6B7280' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: val > 0 ? 'FFDCFCE7' : val < 0 ? 'FFFEE2E2' : 'FFF3F4F6' } };
        }
        if (colNum === 7) {
          const txt = String(cell.value);
          if (txt === 'OVERUSED') { cell.font = { bold: true, size: 9, color: { argb: 'FFDC2626' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; }
          else if (txt === 'AVAILABLE') { cell.font = { bold: true, size: 9, color: { argb: 'FF16A34A' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; }
          else { cell.font = { bold: true, size: 9, color: { argb: 'FF6B7280' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; }
        }
      });
    });

    // Column widths
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 24;
    ws.getColumn(3).width = 20;
    ws.getColumn(4).width = 12;
    ws.getColumn(5).width = 10;
    ws.getColumn(6).width = 10;
    ws.getColumn(7).width = 14;

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `leave_balance_${year}.xlsx`);
  };

  // Leave PDF Export
  const exportLeavePDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237);
    doc.text(`Leave Balance Report — ${year}`, 14, 12);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Company: ${displayCompany?.toUpperCase() || 'ALL'} | Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 17);

    const headers = ['#', 'Employee', 'Role', 'Allocated', 'Used', 'Left', 'Status'];
    const rows = leaveActiveUsers.map((user, idx) => {
      const data = getLeaveData(user.id);
      const status = data.left < 0 ? 'OVERUSED' : data.left === 0 ? 'FULLY USED' : 'AVAILABLE';
      return [String(idx + 1), user.name, user.role, String(data.allocated), String(data.used), String(data.left), status];
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2.5, halign: 'center' },
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 10 }, 1: { halign: 'left', cellWidth: 45 }, 2: { halign: 'left', cellWidth: 35 } },
      theme: 'grid',
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const col = data.column.index;
          if (col === 3) { data.cell.styles.fillColor = [219, 234, 254]; data.cell.styles.textColor = [37, 99, 235]; data.cell.styles.fontStyle = 'bold'; }
          if (col === 4) { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [180, 83, 9]; data.cell.styles.fontStyle = 'bold'; }
          if (col === 5) {
            const val = parseInt(data.cell.raw);
            if (val > 0) { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [22, 163, 74]; }
            else if (val < 0) { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [220, 38, 38]; }
            else { data.cell.styles.fillColor = [243, 244, 246]; data.cell.styles.textColor = [107, 114, 128]; }
            data.cell.styles.fontStyle = 'bold';
          }
          if (col === 6) {
            const txt = data.cell.raw;
            if (txt === 'OVERUSED') { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [220, 38, 38]; }
            else if (txt === 'AVAILABLE') { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [22, 163, 74]; }
            else { data.cell.styles.fillColor = [243, 244, 246]; data.cell.styles.textColor = [107, 114, 128]; }
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.row.index % 2 === 0 && col < 3) { data.cell.styles.fillColor = [249, 250, 251]; }
        }
      },
    });
    doc.save(`leave_balance_${year}.pdf`);
  };

  const viewLogs = (userId: number, type: 'attendance' | 'leave', dateOrYear: string | number) => {
    if (type === 'attendance') {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const userEntries = attendanceSheet.filter(e => e.userId === userId && e.date.startsWith(monthStr));
      const allLogs: any[] = [];
      userEntries.forEach(e => {
        const logsField = (e as any)?.logs;
        if (!logsField) return;
        try {
          const parsed = JSON.parse(logsField);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => allLogs.push(normalizeLogEntry(item)));
          } else if (typeof parsed === 'object' && parsed !== null) {
            allLogs.push(normalizeLogEntry(parsed));
          }
        } catch {
          try {
            const single = JSON.parse(`[${logsField}]`);
            single.forEach((item: any) => allLogs.push(normalizeLogEntry(item)));
          } catch { /* ignore parse errors */ }
        }
      });
      // Sort by date descending (newest first)
      allLogs.sort((a, b) => {
        const dateA = a.updatedAt || '';
        const dateB = b.updatedAt || '';
        return dateB.localeCompare(dateA);
      });
      setSelectedLogs(allLogs);
      const userName = users.find(u => u.id === userId)?.name || 'User';
      setLogTitle(`Attendance Logs — ${userName} — ${monthNames[month]} ${year}`);
    } else {
      const balance = leaveBalances.find(lb => lb.userId === userId && lb.year === dateOrYear);
      const logsField = (balance as any)?.logs || '[]';
      let parsedLogs: any[] = [];
      try {
        const parsed = JSON.parse(logsField);
        if (Array.isArray(parsed)) parsedLogs = parsed.map(normalizeLogEntry);
        else if (typeof parsed === 'object' && parsed !== null) parsedLogs = [normalizeLogEntry(parsed)];
      } catch {
        try { parsedLogs = JSON.parse(`[${logsField}]`).map(normalizeLogEntry); } catch { parsedLogs = []; }
      }
      parsedLogs.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      setSelectedLogs(parsedLogs);
      const userName = users.find(u => u.id === userId)?.name || 'User';
      setLogTitle(`Leave Balance Logs — ${userName} — ${dateOrYear}`);
    }
    setShowLogsModal(true);
  };

  const _ProgressBar = ({ used, total }: { used: number; total: number; color?: string }) => {
    const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const isOver = used > total;
    return (
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isOver ? '#dc2626' : '#7c3aed' }} />
      </div>
    );
  };

  // Render attendance table section
  const renderAttendanceSection = (title: string, userList: typeof allFilteredUsers, sectionColor: string) => {
    if (userList.length === 0) return null;
    return (
      <div className="mb-6">
        <div className={`px-4 py-2 rounded-t-xl font-semibold text-sm text-white`} style={{ backgroundColor: sectionColor }}>
          {title} ({userList.length})
        </div>
        <div className="overflow-x-auto overflow-y-auto border border-t-0 rounded-b-xl" style={{ maxHeight: '55vh' }}>
          <table className="w-full border-collapse table-fixed" style={{ minWidth: `${dates.length * 36 + 320}px` }}>
            <thead className="sticky top-0 z-30">
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-40 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b border-r border-gray-200 w-[180px] min-w-[180px]">Employee</th>
                {dates.map(day => {
                  const sun = isSunday(day);
                  return (
                    <th key={day} className={`px-0 py-1.5 text-center border-b border-gray-200 w-[34px] min-w-[34px] max-w-[34px] ${sun ? 'bg-red-50' : ''}`}>
                      <div className={`text-[10px] font-medium ${sun ? 'text-red-500' : 'text-gray-400'}`}>{getDayName(day)}</div>
                      <div className={`text-xs font-bold ${sun ? 'text-red-600' : 'text-gray-700'}`}>{day}</div>
                      {canEdit && !isMarking && (
                        <button onClick={(e) => { e.stopPropagation(); setMarkAllDate(markAllDate === day ? null : day); }} className="mt-0.5 text-[8px] text-gray-300 hover:text-blue-500" title={`Mark all for ${day}`}>
                          <UserCheck size={10} className="mx-auto" />
                        </button>
                      )}
                      {markAllDate === day && (
                        <div className="absolute z-50 mt-1 bg-white rounded-xl shadow-2xl border p-2 min-w-[150px] left-1/2 -translate-x-1/2">
                          <div className="text-[10px] text-gray-500 font-semibold mb-1.5">Mark All — {day} {monthNames[month].slice(0, 3)}</div>
                          {ATTENDANCE_STATUSES.map(s => (
                            <button key={s.value} onClick={(e) => { e.stopPropagation(); handleMarkAll(day, s.value); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left">
                              <div className="w-5 h-4 rounded text-[8px] font-bold flex items-center justify-center border" style={{ backgroundColor: s.bg, color: s.color, borderColor: s.color + '40' }}>{s.short}</div>
                              <span className="text-xs text-gray-700">{s.label}</span>
                            </button>
                          ))}
                          <button onClick={(e) => { e.stopPropagation(); setMarkAllDate(null); }} className="w-full mt-1 text-[10px] text-gray-400 py-1">Cancel</button>
                        </div>
                      )}
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center border-b border-l text-xs font-semibold text-emerald-600 min-w-[36px]">P</th>
                <th className="px-2 py-2 text-center border-b text-xs font-semibold text-red-500 min-w-[36px]">A</th>
                <th className="px-2 py-2 text-center border-b text-xs font-semibold text-blue-500 min-w-[36px]">L</th>
                <th className="px-2 py-2 text-center border-b text-xs font-semibold text-violet-500 min-w-[46px]">%</th>
                <th className="px-2 py-2 text-center border-b text-xs font-semibold text-gray-500 min-w-[36px]">Logs</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((user, idx) => {
                const userCounts = getUserSummary(user.id);
                const pct = getAttendancePercentage(user.id);
                return (
                  <tr key={user.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                    <td className="sticky left-0 z-10 px-3 py-1.5 border-b border-r border-gray-100 text-xs font-medium" style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold truncate">{user.name}</div>
                          <div className="text-[10px] text-gray-400">{user.role}</div>
                        </div>
                      </div>
                    </td>
                    {dates.map(day => {
                      const status = getStatus(user.id, day);
                      const config = getStatusConfig(status);
                      const sun = isSunday(day);
                      const dateStr = getDateStr(day);
                      const isEditing = editCell?.userId === user.id && editCell?.date === dateStr;
                      return (
                    <td key={day} className={`px-0 py-1 text-center border-b border-gray-100 relative w-[34px] min-w-[34px] max-w-[34px] ${canEdit ? 'cursor-pointer' : ''} ${sun && !config ? 'bg-red-50/50' : ''} ${isMarking && selectedBrush && canEdit ? 'hover:ring-2 hover:ring-amber-400 hover:ring-inset hover:rounded' : ''}`} onClick={() => handleCellClick(user.id, day)}>
                          {config ? (
                            <div className={`mx-auto w-[28px] h-[22px] rounded flex items-center justify-center text-[9px] font-bold border flex-shrink-0 ${canEdit ? 'hover:scale-110 hover:shadow-md' : ''}`} style={{ backgroundColor: config.bg, color: config.color, borderColor: config.color + '40' }} title={config.label}>{config.short}</div>
                          ) : (
                            <div className={`mx-auto w-[28px] h-[22px] rounded flex items-center justify-center text-gray-300 text-[9px] flex-shrink-0 ${canEdit ? 'hover:bg-gray-100' : ''}`}>—</div>
                          )}
                          {isEditing && !isMarking && (
                            <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setEditCell(null); }} />
                          )}
                          {isEditing && !isMarking && (
                            <div className="fixed z-[9999] bg-white rounded-xl shadow-2xl border p-3 w-[200px]" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                              <div className="text-[11px] text-gray-500 font-semibold mb-2">Select Status</div>
                              <div className="flex flex-col gap-1">
                                {ATTENDANCE_STATUSES.map(s => (
                                  <button key={s.value} onClick={(e) => { e.stopPropagation(); handleStatusSelect(s.value); }} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors ${status === s.value ? 'bg-gray-100 ring-1 ring-gray-300' : ''}`}>
                                    <div className="w-6 h-5 rounded text-[9px] font-bold flex items-center justify-center border flex-shrink-0" style={{ backgroundColor: s.bg, color: s.color, borderColor: s.color + '40' }}>{s.short}</div>
                                    <span className="text-sm text-gray-700">{s.label}</span>
                                  </button>
                                ))}
                                <button onClick={(e) => { e.stopPropagation(); handleStatusSelect(null); }} className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-red-50 text-red-600 mt-1 border border-red-100">
                                  <XCircle size={14} /><span className="text-sm">Clear</span>
                                </button>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setEditCell(null); }} className="w-full mt-2 text-xs text-gray-400 py-1.5 border-t hover:text-gray-600">Cancel</button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center border-b border-l text-xs font-bold text-emerald-600">{userCounts['Present'] || 0}</td>
                    <td className="px-2 py-1.5 text-center border-b text-xs font-bold text-red-500">{userCounts['Absent'] || 0}</td>
                    <td className="px-2 py-1.5 text-center border-b text-xs font-bold text-blue-500">{(userCounts['Paid Leave'] || 0) + (userCounts['Non-Paid Leave'] || 0) + (userCounts['Comp Off'] || 0)}</td>
                    <td className="px-2 py-1.5 text-center border-b">
                      <span className={`text-xs font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                    </td>
                    <td className="px-2 py-1.5 text-center border-b">
                      <button onClick={() => viewLogs(user.id, 'attendance', '')} className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="View Logs"><History size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-fade-in ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          <CheckCircle2 size={16} />{toast.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('attendance')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'attendance' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
          <CalendarDays size={16} /> Attendance Sheet
        </button>
        <button onClick={() => setActiveTab('leave')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'leave' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
          <Wallet size={16} /> Leave Balance
        </button>
      </div>

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="page-title flex items-center gap-2"><CalendarDays size={22} className="text-blue-600" /> Attendance Sheet</h1>
              <p className="text-gray-500 text-sm mt-1">{canEdit ? (isMarking ? '🎨 Marking mode — click cells to mark' : 'Click cells to edit attendance') : '🔒 View-only'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isAgent && (
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${viewMode === 'all' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}><Users size={13} /> All</button>
                  <button onClick={() => setViewMode('my')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${viewMode === 'my' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}><Eye size={13} /> My</button>
                </div>
              )}
              {viewMode === 'all' && (
                <div className="relative">
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-9 !py-1.5 text-xs w-36" />
                </div>
              )}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow"><ChevronLeft size={16} /></button>
                <span className="px-2 py-1 text-sm font-semibold min-w-[130px] text-center">{monthNames[month]} {year}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow"><ChevronRight size={16} /></button>
              </div>
              {canEdit && (
                <>
                  {undoStack.length > 0 && <button onClick={handleUndo} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600" title="Undo"><Undo2 size={16} /></button>}
                  <button onClick={() => { setIsMarking(!isMarking); setSelectedBrush(null); setEditCell(null); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${isMarking ? 'bg-amber-500 text-white shadow-lg ring-2 ring-amber-300' : 'bg-blue-600 text-white hover:bg-blue-700 shadow'}`}>
                    {isMarking ? <><X size={14} /> Stop</> : <><Paintbrush size={14} /> Mark</>}
                  </button>
                </>
              )}
              {canMarkAttendance && (
                <>
                  <button onClick={markPresent} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"><CheckCircle2 size={14} /> Present</button>
                  <button onClick={exportExcel} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"><Download size={14} /> Excel</button>
                  <button onClick={exportPDF} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"><Printer size={14} /> PDF</button>
                </>
              )}
            </div>
          </div>

          {/* Marking toolbar */}
          {canEdit && isMarking && (
            <div className="card p-3 border-2 border-amber-300 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-2"><Paintbrush size={14} className="text-amber-600" /><span className="text-xs font-bold text-amber-800">Select status then click cells:</span></div>
              <div className="flex flex-wrap gap-2">
                {ATTENDANCE_STATUSES.map(s => (
                  <button key={s.value} onClick={() => setSelectedBrush(selectedBrush === s.value ? null : s.value)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-semibold ${selectedBrush === s.value ? 'ring-2 ring-offset-1 scale-105 shadow-lg' : 'hover:scale-102 hover:shadow'}`} style={{ backgroundColor: selectedBrush === s.value ? s.color : s.bg, color: selectedBrush === s.value ? '#fff' : s.color, borderColor: s.color }}>
                    <span className="text-sm">{s.short}</span><span>{s.label}</span>
                    {selectedBrush === s.value && <CheckCircle2 size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {ATTENDANCE_STATUSES.map(s => (
              <div key={s.value} className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: s.bg, borderColor: s.color + '30' }}>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-5 h-4 rounded text-[8px] font-bold flex items-center justify-center border" style={{ backgroundColor: s.bg, color: s.color, borderColor: s.color + '40' }}>{s.short}</div>
                  <p className="text-lg font-bold" style={{ color: s.color }}>{summary[s.value] || 0}</p>
                </div>
                <p className="text-[9px] font-medium mt-0.5" style={{ color: s.color + 'cc' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Attendance Grid - Staff Section */}
          <div className="card overflow-hidden">
            {renderAttendanceSection('Staff / Management', staffUsers, '#2563eb')}
            {renderAttendanceSection('Agents', agentUsers, '#7c3aed')}
            {allFilteredUsers.length === 0 && <div className="p-12 text-center text-gray-400 text-sm">No employees found</div>}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 px-1">
            <span>{allFilteredUsers.length} employees • {monthNames[month]} {year} ({daysInMonth} days)</span>
            <span>% = Attended Days / Days Elapsed × 100 | Blank past days reduce % | Half Day = 0.5</span>
          </div>
        </>
      )}

      {/* LEAVE BALANCE TAB */}
      {activeTab === 'leave' && (
        <>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="page-title flex items-center gap-2"><Wallet size={22} className="text-purple-600" /> Leave Balance</h1>
              <p className="text-gray-500 text-sm mt-1">{canEdit ? '✏️ Click any value to edit • All fields are manually editable' : '🔒 View-only'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search..." value={leaveSearch} onChange={e => setLeaveSearch(e.target.value)} className="input-field pl-9 !py-1.5 text-xs w-44" />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-md hover:bg-white hover:shadow"><ChevronLeft size={16} /></button>
                <span className="px-3 py-1 text-sm font-semibold min-w-[60px] text-center">{year}</span>
                <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-md hover:bg-white hover:shadow"><ChevronRight size={16} /></button>
              </div>
              {canExport && (
                <>
                  <button onClick={exportLeaveExcel} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"><Download size={14} /> Excel</button>
                  <button onClick={exportLeavePDF} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"><Printer size={14} /> PDF</button>
                </>
              )}
            </div>
          </div>

          {/* Month Tabs Calendar */}
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-gray-600">Month Navigation — Year {year}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
              {monthNames.map((mName, mIdx) => {
                const isCurrentMonth = mIdx === new Date().getMonth() && year === new Date().getFullYear();
                const isSelected = mIdx === month;
                return (
                  <button key={mIdx} onClick={() => setMonth(mIdx)} className={`px-2 py-2 rounded-lg text-xs font-semibold transition-all ${isSelected ? 'bg-purple-600 text-white shadow-lg scale-105' : isCurrentMonth ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600 border border-gray-200'}`}>
                    {mName.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-[10px] text-gray-400 text-center">
              Viewing: <span className="font-semibold text-purple-600">{monthNames[month]} {year}</span> • {(() => { const now = new Date(); const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth()); return isFuture ? 'Future month — no data available yet' : 'Leave data per year • Click values to edit manually'; })()}
            </div>
          </div>

          {/* Leave Balance Table - Fully Editable */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-blue-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 border-b min-w-[200px]">Employee</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 border-b min-w-[100px]">
                      <div className="flex items-center justify-center gap-1">Allocated {canEdit && <Pencil size={10} className="text-blue-400" />}</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 border-b min-w-[100px]">
                      <div className="flex items-center justify-center gap-1">Used {canEdit && <Pencil size={10} className="text-amber-400" />}</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 border-b min-w-[100px]">
                      <div className="flex items-center justify-center gap-1">Left {canEdit && <Pencil size={10} className="text-emerald-400" />}</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 border-b min-w-[60px]">Status</th>
                    {canEdit && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 border-b min-w-[80px]">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaveActiveUsers.map((user, idx) => {
                    const data = getLeaveData(user.id);
                    const isEditingRow = editingLeave === user.id;
                    const liveAllocated = isEditingRow ? (editLeaveData.allocated ?? data.allocated) : data.allocated;
                    const liveUsed = isEditingRow ? (editLeaveData.used ?? data.used) : data.used;
                    const liveLeft = liveAllocated - liveUsed;
                    const statusLabel = liveLeft < 0 ? 'OVERUSED' : liveLeft === 0 ? 'FULLY USED' : 'AVAILABLE';
                    const statusColor = liveLeft < 0 ? 'text-red-600 bg-red-50' : liveLeft === 0 ? 'text-gray-600 bg-gray-100' : 'text-emerald-600 bg-emerald-50';
                    return (
                      <tr key={user.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-purple-50/30 transition-colors ${isEditingRow ? 'ring-2 ring-inset ring-purple-300 bg-purple-50/20' : ''}`}>
                        <td className="px-4 py-2.5 border-b text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{user.name}</div>
                              <div className="text-[10px] text-gray-400">{user.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center border-b">
                          {isEditingRow ? (
                            <input type="number" min={0} max={99} value={editLeaveData.allocated ?? data.allocated} onChange={e => { const v = e.target.value === '' ? 0 : parseInt(e.target.value); setEditLeaveData(p => ({ ...p, allocated: isNaN(v) ? 0 : v })); }} className="w-16 text-center text-xs font-semibold rounded-md border-2 border-blue-300 bg-blue-50 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400" autoFocus />
                          ) : (
                            <div className={`inline-flex items-center gap-1 ${canEdit ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-lg' : ''}`} onClick={() => canEdit && startEditLeave(user.id)}>
                              <span className="text-sm font-bold text-blue-600">{data.allocated}</span>
                              {canEdit && <Pencil size={10} className="text-blue-300 opacity-0 group-hover:opacity-100" />}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center border-b">
                          {isEditingRow ? (
                            <input type="number" min={0} max={99} value={editLeaveData.used ?? data.used} onChange={e => { const v = e.target.value === '' ? 0 : parseInt(e.target.value); setEditLeaveData(p => ({ ...p, used: isNaN(v) ? 0 : v })); }} className="w-16 text-center text-xs font-semibold rounded-md border-2 border-amber-300 bg-amber-50 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                          ) : (
                            <div className={`inline-flex items-center gap-1 ${canEdit ? 'cursor-pointer hover:bg-amber-50 px-2 py-1 rounded-lg' : ''}`} onClick={() => canEdit && startEditLeave(user.id)}>
                              <span className="text-sm font-semibold text-amber-600">{data.used}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center border-b">
                          {isEditingRow ? (
                            <input type="number" min={-99} max={99} value={liveLeft} onChange={e => { const v = e.target.value === '' ? 0 : parseInt(e.target.value); if (!isNaN(v)) { const newUsed = (editLeaveData.allocated ?? data.allocated) - v; setEditLeaveData(p => ({ ...p, used: Math.max(0, newUsed) })); } }} className="w-16 text-center text-xs font-semibold rounded-md border-2 border-emerald-300 bg-emerald-50 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                          ) : (
                            <div className={`inline-flex items-center gap-1 ${canEdit ? 'cursor-pointer hover:bg-emerald-50 px-2 py-1 rounded-lg' : ''}`} onClick={() => canEdit && startEditLeave(user.id)}>
                              <span className={`text-sm font-bold ${liveLeft < 0 ? 'text-red-600' : liveLeft === 0 ? 'text-gray-500' : 'text-emerald-600'}`}>{liveLeft}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center border-b">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-2.5 text-center border-b">
                            {isEditingRow ? (
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={saveEditLeave} className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors" title="Save"><Save size={14} /></button>
                                <button onClick={cancelEditLeave} className="p-1.5 rounded-md bg-red-100 text-red-500 hover:bg-red-200 transition-colors" title="Cancel"><XCircle size={14} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => startEditLeave(user.id)} className="p-1.5 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Edit"><Pencil size={14} /></button>
                                <button onClick={() => viewLogs(user.id, 'leave', year)} className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Logs"><History size={14} /></button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {leaveActiveUsers.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400">No employees found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Balance Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-3 text-center border-l-4 border-l-blue-500">
              <p className="text-[10px] text-gray-500 font-medium">Total Allocated</p>
              <p className="text-xl font-bold text-blue-600">{leaveActiveUsers.reduce((sum, u) => sum + getLeaveData(u.id).allocated, 0)}</p>
            </div>
            <div className="card p-3 text-center border-l-4 border-l-amber-500">
              <p className="text-[10px] text-gray-500 font-medium">Total Used</p>
              <p className="text-xl font-bold text-amber-600">{leaveActiveUsers.reduce((sum, u) => sum + getLeaveData(u.id).used, 0)}</p>
            </div>
            <div className="card p-3 text-center border-l-4 border-l-emerald-500">
              <p className="text-[10px] text-gray-500 font-medium">Total Left</p>
              <p className="text-xl font-bold text-emerald-600">{leaveActiveUsers.reduce((sum, u) => sum + getLeaveData(u.id).left, 0)}</p>
            </div>
            <div className="card p-3 text-center border-l-4 border-l-purple-500">
              <p className="text-[10px] text-gray-500 font-medium">Employees</p>
              <p className="text-xl font-bold text-purple-600">{leaveActiveUsers.length}</p>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 px-1 flex items-center justify-between">
            <span>{leaveActiveUsers.length} employees • {monthNames[month]} {year} • Manual update only (independent from attendance)</span>
            <span className="text-purple-500 font-medium">⚡ All values are live-editable</span>
          </div>
        </>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><History size={18} className="text-blue-600" />{logTitle}</h3>
              <button onClick={() => setShowLogsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {selectedLogs.length > 0 ? (
                <div className="space-y-2">
                  {selectedLogs.map((log, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                            {(log.updatedBy || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">{log.updatedBy || 'Unknown'}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded-full border">{log.updatedAt || 'N/A'}</span>
                      </div>
                      <p className="text-sm text-gray-700 pl-8 font-medium">{log.action || 'No details'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <History size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>No logs found for this period.</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t bg-gray-50 text-center text-xs text-gray-400">
              {selectedLogs.length} log entries found
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
