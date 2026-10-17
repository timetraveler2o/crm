import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCrmStore } from '../store/crmStore';
import { useAuthStore } from '../store/authStore';
import { BREAK_TYPES } from '../types';
import { client } from '../lib/api';
import { Timer, Play, Square, Coffee, Phone, Users2, Utensils, Clock, Sandwich, History, Trash2, Download, Upload, Printer, AlertTriangle, Activity, BarChart3, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const breakIcons: Record<string, any> = {
  'Lunch': Utensils,
  'Dinner': Sandwich,
  'Tea': Coffee,
  'On Call': Phone,
  'Meeting': Users2,
  'Personal': Clock,
};

const TOTAL_BREAK_ALLOWANCE = 3600; // 1 hour = 3600 seconds
const MAX_SINGLE_BREAK_DURATION = 5400; // 1 hour 30 minutes = max per single break session
const SHIFT_DURATION = 9 * 3600; // 9 hours shift

// Shift boundaries: Night 20:00-05:00, Morning 05:00-14:00, Evening 14:00-20:00
function getCurrentShiftBoundary(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const h = now.getHours();
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (h >= 20) {
    // Night shift started today at 20:00, ends tomorrow at 05:00
    const start = new Date(today); start.setHours(20, 0, 0, 0);
    const end = new Date(tomorrow); end.setHours(5, 0, 0, 0);
    return { start, end, label: 'Night Shift (8 PM - 5 AM)' };
  } else if (h < 5) {
    // Night shift started yesterday at 20:00, ends today at 05:00
    const start = new Date(yesterday); start.setHours(20, 0, 0, 0);
    const end = new Date(today); end.setHours(5, 0, 0, 0);
    return { start, end, label: 'Night Shift (8 PM - 5 AM)' };
  } else if (h >= 5 && h < 14) {
    const start = new Date(today); start.setHours(5, 0, 0, 0);
    const end = new Date(today); end.setHours(14, 0, 0, 0);
    return { start, end, label: 'Morning Shift (5 AM - 2 PM)' };
  } else {
    const start = new Date(today); start.setHours(14, 0, 0, 0);
    const end = new Date(today); end.setHours(20, 0, 0, 0);
    return { start, end, label: 'Evening Shift (2 PM - 8 PM)' };
  }
}

export default function BreakMonitor() {
  const { activeBreak, startBreak, endBreak, users, attendance: allAttendanceRecords } = useCrmStore();
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();
  const [elapsed, setElapsed] = useState(0);
  const [breakLogs, setBreakLogs] = useState<any[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const alertedLimitRef = useRef(false);
  // Track which shift the email was already sent for — prevents re-sending on break end/start cycles
  const emailSentForShiftRef = useRef<string>('');
  const [breakPeriod, setBreakPeriod] = useState<string>('today');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAgentReport, setShowAgentReport] = useState(true);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const filteredLogs = useMemo(() => {
    let logs = breakLogs.filter(log => companyUserIds.has(log.userId));
    // Agent filter
    if (agentFilter) {
      const agentUser = companyUsers.find(u => u.name === agentFilter);
      if (agentUser) {
        logs = logs.filter(log => log.userId === agentUser.id);
      }
    }
    const now = new Date();
    if (breakPeriod !== 'all') {
      let fromDate = new Date();
      if (breakPeriod === 'today') fromDate.setHours(0, 0, 0, 0);
      else if (breakPeriod === 'yesterday') {
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(fromDate);
        endOfDay.setHours(23, 59, 59, 999);
        logs = logs.filter(log => {
          const d = new Date(log.startTime);
          return d >= fromDate && d <= endOfDay;
        });
        return logs;
      }
      else if (breakPeriod === 'week') fromDate.setDate(fromDate.getDate() - 7);
      else if (breakPeriod === '1month') fromDate.setMonth(fromDate.getMonth() - 1);
      else if (breakPeriod === '3month') fromDate.setMonth(fromDate.getMonth() - 3);
      else if (breakPeriod === '6month') fromDate.setMonth(fromDate.getMonth() - 6);
      logs = logs.filter(log => new Date(log.startTime) >= fromDate);
    }
    return logs;
  }, [breakLogs, companyUserIds, breakPeriod, agentFilter, companyUsers]);

  // Calculate current shift's total break time used (shift-based reset)
  const currentShift = useMemo(() => getCurrentShiftBoundary(), [elapsed]);
  const todayUsedBreakSeconds = useMemo(() => {
    const { start, end } = currentShift;
    return breakLogs
      .filter(log => {
        if (log.userId !== currentUser?.id) return false;
        const logStart = new Date(log.startTime);
        return logStart >= start && logStart < end && log.endTime; // only completed breaks within current shift
      })
      .reduce((total, log) => {
        const s = new Date(log.startTime).getTime();
        const e = new Date(log.endTime).getTime();
        return total + Math.floor((e - s) / 1000);
      }, 0);
  }, [breakLogs, currentUser?.id, currentShift]);

  // Remaining break time for today
  const remainingBreakSeconds = Math.max(0, TOTAL_BREAK_ALLOWANCE - todayUsedBreakSeconds - (activeBreak ? elapsed : 0));

  const fetchBreakLogs = async () => {
    try {
      const res = await client.api.fetch('/api/public/break-logs');
      const { data } = await res.json();
      const logs = data || [];
      setBreakLogs(logs);
      
      // Sync activeBreak with backend
      if (currentUser) {
        const activeLog = logs.find((l: any) => l.userId === currentUser.id && !l.endTime);
        if (activeLog && !activeBreak) {
          startBreak(activeLog.type);
          // We need to update the startTime in store to match the backend log
          useCrmStore.setState({ activeBreak: { type: activeLog.type, startTime: new Date(activeLog.startTime).getTime() } });
        } else if (!activeLog && activeBreak) {
          endBreak();
          setElapsed(0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch break logs:', err);
    }
  };

  useEffect(() => {
    fetchBreakLogs();
  }, []);

  // Auto-reset break at shift boundary (not midnight)
  useEffect(() => {
    const checkShiftEnd = setInterval(() => {
      const { end } = getCurrentShiftBoundary();
      const now = new Date();
      // If now >= shift end, auto-end any active break
      if (now >= end) {
        if (activeBreak) {
          handleEndBreak();
        }
        fetchBreakLogs(); // refresh logs for new shift
      }
    }, 5000); // check every 5 seconds
    return () => clearInterval(checkShiftEnd);
  }, [activeBreak]);

  useEffect(() => {
    if (activeBreak) {
      timerRef.current = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - activeBreak.startTime) / 1000);
        setElapsed(currentElapsed);

        // Check if break crosses shift boundary
        const { end: shiftEnd } = getCurrentShiftBoundary();
        const now = new Date();
        if (now >= shiftEnd) {
          // Shift ended during break - auto end
          handleEndBreak();
          return;
        }

        // AUTO-STOP: Single break session exceeds max 1 hour 30 minutes
        if (currentElapsed >= MAX_SINGLE_BREAK_DURATION) {
          sendBreakAlert('exceeded the maximum 1 hour 30 minute single break limit — break auto-stopped');
          handleEndBreak();
          return;
        }

        // Alert ONLY when total break time exceeds the daily allowance (1 hour)
        // Email sends ONCE per shift — never resets when break ends
        const totalBreakNow = todayUsedBreakSeconds + currentElapsed;
        const { start: shiftStart } = getCurrentShiftBoundary();
        const shiftKey = shiftStart.toISOString();
        if (totalBreakNow >= TOTAL_BREAK_ALLOWANCE && !alertedLimitRef.current && emailSentForShiftRef.current !== shiftKey) {
          alertedLimitRef.current = true;
          emailSentForShiftRef.current = shiftKey;
          sendBreakAlert('exceeded the 1-hour daily break limit');
        }
      }, 1000);
    } else {
      setElapsed(0);
      // DO NOT reset alertedLimitRef here — email should only send once per shift
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeBreak]);

  const sendBreakAlert = async (reason: string) => {
    if (!currentUser) return;
    const { addNotification } = useAuthStore.getState();
    addNotification({
      title: `⚠️ Break Limit Exceeded`,
      message: `${currentUser.name} has ${reason} during ${activeBreak?.type} break`,
      type: 'warning'
    });
    // Send email ONLY to Supervisors, Managers, and HR — not to the agent
    const supervisorRoles = ['Supervisor', 'Manager', 'Operation Manager', 'Admin', 'HR (Human Resource)'];
    const supervisors = companyUsers.filter(u => supervisorRoles.includes(u.role) && u.status === 'Active' && u.id !== currentUser.id);
    const supervisorEmails = supervisors.map(s => s.email).filter(Boolean);
    if (supervisorEmails.length === 0) return;

    const companyLabel = displayCompany === 'GSF' ? 'Get Set Flight' : displayCompany === 'LBT' ? 'Look Book Ticket' : 'Traveloboom';
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const dateStr = nowIST.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = nowIST.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const totalUsedMin = Math.ceil((todayUsedBreakSeconds + elapsed) / 60);
    const allowedMin = Math.floor(TOTAL_BREAK_ALLOWANCE / 60);
    const overMin = totalUsedMin - allowedMin;

    const emailHtml = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">⚠️ Break Limit Alert</h1>
          <p style="color:#fecaca;margin:6px 0 0;font-size:13px">${companyLabel} — Break Monitoring System</p>
        </div>
        <div style="padding:28px 32px;background:#fff">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:10px 16px;background:#fef2f2;border-radius:8px 8px 0 0;font-weight:600;color:#991b1b;font-size:14px">Employee</td><td style="padding:10px 16px;background:#fef2f2;border-radius:8px 8px 0 0;font-size:14px;color:#1f2937">${currentUser.name}</td></tr>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151;font-size:13px">Break Type</td><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#4b5563">${activeBreak?.type || 'General'}</td></tr>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151;font-size:13px">Date & Time</td><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#4b5563">${dateStr} at ${timeStr}</td></tr>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151;font-size:13px">Total Break Used</td><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#dc2626;font-weight:700">${totalUsedMin} minutes</td></tr>
            <tr><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151;font-size:13px">Allowed Limit</td><td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#4b5563">${allowedMin} minutes per shift</td></tr>
            <tr><td style="padding:10px 16px;font-weight:600;color:#374151;font-size:13px">Over Limit By</td><td style="padding:10px 16px;font-size:13px;color:#dc2626;font-weight:700">${overMin > 0 ? overMin : 0} minutes</td></tr>
          </table>
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;border-radius:6px;margin-bottom:20px">
            <p style="margin:0;color:#991b1b;font-size:13px;font-weight:600">Action Required</p>
            <p style="margin:6px 0 0;color:#7f1d1d;font-size:12px">This employee has exceeded the daily break allowance. Please follow up and ensure compliance with company break policy.</p>
          </div>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#9ca3af;font-size:11px">This is an automated alert from the ${companyLabel} CRM Break Monitoring System.</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:11px">© ${new Date().getFullYear()} Get Set Flight — All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      for (const email of supervisorEmails) {
        await client.api.fetch('/api/public/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `⚠️ Break Limit Exceeded — ${currentUser.name} | ${companyLabel}`,
            html: emailHtml
          })
        });
      }
    } catch (err) {
      console.error('Failed to send break alert email:', err);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStartBreak = async (type: string) => {
    startBreak(type);
    try {
      await client.api.fetch('/api/public/break-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          type,
          startTime: new Date().toISOString(),
          created: new Date().toLocaleString()
        })
      });
      fetchBreakLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndBreak = async () => {
    // Even if !activeBreak, we should try to end any active log on backend
    const currentStartTime = activeBreak?.startTime || Date.now();
    const durationSec = Math.floor((Date.now() - currentStartTime) / 1000);
    const duration = formatTime(durationSec);
    
    if (activeBreak) {
      endBreak();
      setElapsed(0);
    }
    
    try {
      // Fetch latest logs to ensure we have the active log
      const res = await client.api.fetch('/api/public/break-logs');
      const { data } = await res.json();
      const latestLogs = data || [];
      const activeLog = latestLogs.find((l: any) => l.userId === currentUser?.id && !l.endTime);
      
      if (activeLog) {
        const realDurationSec = Math.floor((Date.now() - new Date(activeLog.startTime).getTime()) / 1000);
        const realDuration = formatTime(realDurationSec);
        await client.api.fetch(`/api/public/break-logs/${activeLog.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endTime: new Date().toISOString(),
            duration: realDuration
          })
        });
        fetchBreakLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm('Are you sure you want to delete selected logs?')) return;
    try {
      for (const id of selectedLogs) {
        await client.api.fetch(`/api/public/break-logs/${id}`, { method: 'DELETE' });
      }
      setSelectedLogs([]);
      fetchBreakLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL logs? This cannot be undone.')) return;
    try {
      for (const log of visibleLogs) {
        await client.api.fetch(`/api/public/break-logs/${log.id}`, { method: 'DELETE' });
      }
      setSelectedLogs([]);
      fetchBreakLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const canViewAll = ['Admin', 'Manager', 'HR', 'HR (Human Resource)', 'IT', 'IT (Information Tech)', 'Operation Manager', 'Supervisor'].includes(currentUser?.role || '') || (currentUser?.permissions || []).includes('View All Breaks');
  const canDelete = ['Admin', 'HR (Human Resource)', 'IT', 'IT (Information Tech)'].includes(currentUser?.role || '');
  const visibleLogs = useMemo(() => {
    let logs = canViewAll ? filteredLogs : filteredLogs.filter(l => l.userId === currentUser?.id);
    if (agentFilter) {
      const matchUser = companyUsers.find(u => u.name === agentFilter);
      if (matchUser) logs = logs.filter(l => l.userId === matchUser.id);
    }
    return logs.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [canViewAll, filteredLogs, currentUser?.id, agentFilter, companyUsers]);

  // Active breaks across the company (for HR/Admin/Manager/Supervisor view)
  // Use server data to detect truly active breaks (no endTime) + check stale breaks
  const activeBreaksInCompany = useMemo(() => {
    const now = Date.now();
    return breakLogs
      .filter(log => !log.endTime && companyUserIds.has(log.userId))
      .map(log => {
        const user = users.find(u => u.id === log.userId);
        const startTime = new Date(log.startTime).getTime();
        const elapsedSec = Math.floor((now - startTime) / 1000);
        // Flag stale breaks (more than 2 hours with no end - likely a glitch)
        const isStale = elapsedSec > 7200;
        return {
          ...log,
          userName: user?.name || 'Unknown',
          elapsedSec,
          type: log.type,
          isStale,
        };
      });
  }, [breakLogs, companyUserIds, users, elapsed]); // elapsed triggers re-render

  // Force stop break for admin/supervisor
  const handleForceStopBreak = async (logId: number, userId: number) => {
    if (!confirm('Are you sure you want to force-stop this break?')) return;
    try {
      const log = breakLogs.find(l => l.id === logId);
      if (!log) return;
      const durationSec = Math.floor((Date.now() - new Date(log.startTime).getTime()) / 1000);
      const duration = formatTime(durationSec);
      await client.api.fetch(`/api/public/break-logs/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          duration
        })
      });
      // If this was the current user's break, also clear local state
      if (userId === currentUser?.id && activeBreak) {
        endBreak();
        setElapsed(0);
      }
      fetchBreakLogs();
    } catch (err) {
      console.error('Failed to force stop break:', err);
      alert('Failed to stop break. Please try again.');
    }
  };

  // Per-agent break report data — computed from break logs and attendance records
  const agentBreakReport = useMemo(() => {
    const now = new Date();
    let fromDate = new Date();
    if (breakPeriod === 'today') fromDate.setHours(0, 0, 0, 0);
    else if (breakPeriod === 'yesterday') {
      fromDate.setDate(fromDate.getDate() - 1);
      fromDate.setHours(0, 0, 0, 0);
    }
    else if (breakPeriod === 'week') fromDate.setDate(fromDate.getDate() - 7);
    else if (breakPeriod === '1month') fromDate.setMonth(fromDate.getMonth() - 1);
    else if (breakPeriod === '3month') fromDate.setMonth(fromDate.getMonth() - 3);
    else if (breakPeriod === '6month') fromDate.setMonth(fromDate.getMonth() - 6);
    else fromDate = new Date(0); // all time

    // Filter logs by period and company
    const periodLogs = breakLogs.filter(log => {
      if (!companyUserIds.has(log.userId)) return false;
      const logDate = new Date(log.startTime);
      if (breakPeriod === 'yesterday') {
        const endOfDay = new Date(fromDate);
        endOfDay.setHours(23, 59, 59, 999);
        return logDate >= fromDate && logDate <= endOfDay;
      }
      return logDate >= fromDate;
    });

    // Group by userId
    const userBreakMap: Record<number, { breakCount: number; totalBreakSec: number; breaks: { type: string; startTime: string; endTime: string; durationSec: number }[] }> = {};
    periodLogs.forEach(log => {
      if (!userBreakMap[log.userId]) userBreakMap[log.userId] = { breakCount: 0, totalBreakSec: 0, breaks: [] };
      userBreakMap[log.userId].breakCount++;
      let dur = 0;
      if (log.endTime) {
        dur = Math.floor((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000);
      } else {
        dur = Math.floor((Date.now() - new Date(log.startTime).getTime()) / 1000);
      }
      userBreakMap[log.userId].totalBreakSec += dur;
      userBreakMap[log.userId].breaks.push({ type: log.type, startTime: log.startTime, endTime: log.endTime || '', durationSec: dur });
    });

    // Get attendance data for login/logout times
    const periodAttendance = allAttendanceRecords.filter(a => {
      if (!companyUserIds.has(a.userId)) return false;
      if (!a.date) return false;
      const aDate = new Date(a.date);
      if (breakPeriod === 'yesterday') {
        const endOfDay = new Date(fromDate);
        endOfDay.setHours(23, 59, 59, 999);
        return aDate >= fromDate && aDate <= endOfDay;
      }
      return aDate >= fromDate;
    });

    // Build login/logout map per user
    const loginMap: Record<number, { loginTime: string; logoutTime: string; totalHours: string; daysActive: number }> = {};
    periodAttendance.forEach(a => {
      if (!loginMap[a.userId]) loginMap[a.userId] = { loginTime: '', logoutTime: '', totalHours: '0h 0m', daysActive: 0 };
      // Take the latest login/logout
      if (a.loginTime) loginMap[a.userId].loginTime = a.loginTime;
      if (a.logoutTime) loginMap[a.userId].logoutTime = a.logoutTime;
      if (a.totalHours) loginMap[a.userId].totalHours = a.totalHours;
      loginMap[a.userId].daysActive++;
    });

    // Build final report
    const report = companyUsers
      .filter(u => u.status === 'Active' && (u.role?.includes('Agent') || u.role === 'Agent' || ['Travel Consultant', 'Sales Executive', 'Telecaller'].includes(u.role || '') || userBreakMap[u.id]))
      .map(u => {
        const breakData = userBreakMap[u.id] || { breakCount: 0, totalBreakSec: 0, breaks: [] };
        const attendance = loginMap[u.id] || { loginTime: '-', logoutTime: '-', totalHours: '0h 0m', daysActive: 0 };
        const SHIFT_HOURS = 9;
        const totalShiftSec = SHIFT_HOURS * 3600 * Math.max(attendance.daysActive, 1);
        const activeWorkingSec = Math.max(0, totalShiftSec - breakData.totalBreakSec);
        const breakPct = totalShiftSec > 0 ? Math.round((breakData.totalBreakSec / totalShiftSec) * 100) : 0;
        const productivePct = totalShiftSec > 0 ? Math.round((activeWorkingSec / totalShiftSec) * 100) : 0;

        return {
          id: u.id,
          name: u.name,
          loginTime: attendance.loginTime || '-',
          logoutTime: attendance.logoutTime || '-',
          totalHours: attendance.totalHours || '-',
          daysActive: attendance.daysActive,
          breakCount: breakData.breakCount,
          totalBreakSec: breakData.totalBreakSec,
          activeWorkingSec,
          breakPct,
          productivePct,
          breaks: breakData.breaks,
        };
      })
      .filter(r => r.breakCount > 0 || r.daysActive > 0)
      .sort((a, b) => b.breakCount - a.breakCount);

    return report;
  }, [breakLogs, allAttendanceRecords, companyUsers, companyUserIds, breakPeriod]);

  // Chart data for agent break report
  const agentChartData = useMemo(() => {
    return agentBreakReport.slice(0, 15).map(r => ({
      name: r.name.split(' ')[0],
      fullName: r.name,
      Breaks: r.breakCount,
      'Break Min': Math.round(r.totalBreakSec / 60),
      'Active Hours': parseFloat((r.activeWorkingSec / 3600).toFixed(1)),
    }));
  }, [agentBreakReport]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export CSV with enhanced data (total break per day per user)
  const exportCSV = () => {
    // Build per-user per-day aggregation
    const userDayMap: Record<string, { total: number; count: number; entries: any[] }> = {};
    visibleLogs.forEach(log => {
      const user = users.find(u => u.id === log.userId);
      const dateStr = new Date(log.startTime).toLocaleDateString();
      const key = `${user?.name || 'Unknown'}|${dateStr}`;
      if (!userDayMap[key]) userDayMap[key] = { total: 0, count: 0, entries: [] };
      if (log.endTime) {
        const dur = Math.floor((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000);
        userDayMap[key].total += dur;
      }
      userDayMap[key].count++;
      userDayMap[key].entries.push(log);
    });

    const headers = ['Date', 'Employee', 'Type', 'Start Time', 'End Time', 'Duration', 'Total Day Break', 'Exceeded'];
    const rows = visibleLogs.map(log => {
      const user = users.find(u => u.id === log.userId);
      const dateStr = new Date(log.startTime).toLocaleDateString();
      const key = `${user?.name || 'Unknown'}|${dateStr}`;
      const dayTotal = userDayMap[key]?.total || 0;
      const exceeded = dayTotal > TOTAL_BREAK_ALLOWANCE ? 'Yes' : 'No';
      return [
        dateStr,
        user?.name || 'Unknown',
        log.type,
        new Date(log.startTime).toLocaleTimeString(),
        log.endTime ? new Date(log.endTime).toLocaleTimeString() : 'Active',
        log.duration || '-',
        formatTime(dayTotal),
        exceeded
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Break_Logs_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 2) { alert('CSV is empty'); return; }

    const headerRow = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const colMap: Record<string, number> = {};
    headerRow.forEach((h, i) => {
      if (h.includes('date')) colMap['date'] = i;
      if (h.includes('employee') || h.includes('name') || h.includes('user')) colMap['employee'] = i;
      if (h.includes('type') || h.includes('break')) colMap['type'] = i;
      if (h.includes('start')) colMap['start'] = i;
      if (h.includes('end')) colMap['end'] = i;
      if (h.includes('duration')) colMap['duration'] = i;
    });

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
      const dateStr = cols[colMap['date'] ?? 0] || '';
      const employeeName = cols[colMap['employee'] ?? 1] || '';
      const type = cols[colMap['type'] ?? 2] || 'Personal';
      const startStr = cols[colMap['start'] ?? 3] || '';
      const endStr = cols[colMap['end'] ?? 4] || '';
      const duration = cols[colMap['duration'] ?? 5] || '';

      const matchedUser = companyUsers.find(u => u.name.toLowerCase() === employeeName.toLowerCase());
      if (!matchedUser) continue;

      const startTime = (() => { try { const d = startStr ? new Date(`${dateStr} ${startStr}`) : new Date(); return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); } catch { return new Date().toISOString(); } })();
      const endTime = (() => { try { if (!endStr || endStr === 'Active') return ''; const d = new Date(`${dateStr} ${endStr}`); return isNaN(d.getTime()) ? '' : d.toISOString(); } catch { return ''; } })();

      try {
        await client.api.fetch('/api/public/break-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: matchedUser.id, type, startTime, endTime: endTime || undefined, duration: duration || undefined, created: dateStr })
        });
        imported++;
      } catch {}
    }

    alert(`Imported ${imported} break log entries`);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchBreakLogs();
  };

  // Break usage percentage for progress ring
  const totalUsedToday = todayUsedBreakSeconds + (activeBreak ? elapsed : 0);
  const usagePercent = Math.min((totalUsedToday / TOTAL_BREAK_ALLOWANCE) * 100, 100);
  const isOvertime = totalUsedToday > TOTAL_BREAK_ALLOWANCE;

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-pulse">
          <AlertTriangle size={20} />
          <div>
            <p className="font-semibold text-sm">You are offline</p>
            <p className="text-xs text-red-600">Break actions will resume when you're back online. Your active break timer continues locally.</p>
          </div>
        </div>
      )}
      <div>
        <h1 className="page-title">Break Monitor</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your breaks — 1 hour allowance per shift • {currentShift.label}</p>
      </div>

      {/* Timer Card */}
      <div className="card p-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        {activeBreak && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 animate-pulse" style={{ animationDuration: '3s' }} />
        )}
        <div className="relative z-10">
          {activeBreak ? (
            <>
              {/* Active Break Timer */}
              <div className="w-28 h-28 rounded-full mx-auto mb-6 relative">
                {/* Circular progress ring */}
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" strokeWidth="6" fill="none" className="stroke-gray-200" />
                  <circle cx="50" cy="50" r="45" strokeWidth="6" fill="none"
                    className={`transition-all duration-500 ${isOvertime ? 'stroke-red-500' : usagePercent > 75 ? 'stroke-amber-500' : 'stroke-emerald-500'}`}
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - usagePercent / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Timer size={32} className={`${isOvertime ? 'text-red-600' : 'text-emerald-600'} animate-pulse`} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1 font-medium">On <span className="text-blue-600">{activeBreak.type}</span> Break</p>
              <p className={`text-3xl sm:text-5xl font-bold font-mono tracking-wider mb-3 transition-colors ${isOvertime ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(elapsed)}
              </p>

              {/* Break Allowance Bar with remaining time */}
              <div className="max-w-md mx-auto mb-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className={isOvertime ? 'text-red-600 font-bold' : 'text-gray-500'}>
                    Today's Break ({formatTime(totalUsedToday)} used)
                  </span>
                  <span className={`font-semibold ${isOvertime ? 'text-red-600 animate-pulse' : remainingBreakSeconds < 600 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {isOvertime 
                      ? `⚠️ OVER by ${formatTime(totalUsedToday - TOTAL_BREAK_ALLOWANCE)}` 
                      : `${formatTime(remainingBreakSeconds)} remaining`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isOvertime ? 'bg-gradient-to-r from-red-500 to-red-600' 
                        : usagePercent > 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                        : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">1 hour break allowance per shift • {currentShift.label} • Resets at shift boundary</p>
              </div>

              <button onClick={handleEndBreak} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-base rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95">
                <Square size={18} /> End Break
              </button>
            </>
          ) : (
            <>
              {/* Not on break - show daily summary */}
              <div className="w-24 h-24 rounded-full mx-auto mb-4 relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" strokeWidth="6" fill="none" className="stroke-gray-200" />
                  <circle cx="50" cy="50" r="45" strokeWidth="6" fill="none"
                    className={`${totalUsedToday > TOTAL_BREAK_ALLOWANCE ? 'stroke-red-400' : totalUsedToday > TOTAL_BREAK_ALLOWANCE * 0.75 ? 'stroke-amber-400' : 'stroke-emerald-400'}`}
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(totalUsedToday / TOTAL_BREAK_ALLOWANCE, 1))}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Timer size={28} className="text-emerald-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Start a Break</p>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {totalUsedToday > 0 
                  ? `Today: ${formatTime(totalUsedToday)} used · ${formatTime(remainingBreakSeconds)} remaining`
                  : '1 hour break available today'
                }
              </p>
              <p className="text-lg text-gray-700 mb-6">Select your break type to start the timer</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-2xl mx-auto">
                {BREAK_TYPES.map(type => {
                  const Icon = breakIcons[type] || Coffee;
                  return (
                    <button
                      key={type}
                      onClick={() => handleStartBreak(type)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Icon size={20} className="text-gray-500 group-hover:text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">{type}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Active Breaks - visible to HR/Admin/Manager/Supervisor */}
      {canViewAll && activeBreaksInCompany.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-amber-600 animate-pulse" />
              <h2 className="font-semibold text-gray-800">Live Active Breaks</h2>
              <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{activeBreaksInCompany.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {activeBreaksInCompany.map(ab => {
              const Icon = breakIcons[ab.type] || Coffee;
              const overBreak = ab.elapsedSec > 1800;
              return (
                <div key={ab.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  overBreak ? 'border-red-200 bg-red-50 animate-pulse' : 'border-amber-200 bg-amber-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${overBreak ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <Icon size={18} className={overBreak ? 'text-red-600' : 'text-amber-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ab.userName}</p>
                    <p className="text-xs text-gray-500">{ab.type} Break</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-bold ${overBreak ? 'text-red-600' : 'text-amber-700'}`}>
                      {formatTime(ab.elapsedSec)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(ab.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Force stop button for admin/supervisor */}
                  {(canDelete || ['Admin', 'Manager', 'Supervisor', 'Operation Manager'].includes(currentUser?.role || '')) && (
                    <button
                      onClick={() => handleForceStopBreak(ab.id, ab.userId)}
                      className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded-lg transition-all shadow-sm"
                      title="Force stop this break"
                    >
                      <Square size={10} className="inline mr-0.5" /> Stop
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Break Report - Per Person */}
      {canViewAll && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-800">Agent Break Report</h2>
              <span className="ml-2 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{agentBreakReport.length}</span>
            </div>
            <button onClick={() => setShowAgentReport(!showAgentReport)} className="text-xs text-indigo-600 font-medium hover:underline">
              {showAgentReport ? 'Hide' : 'Show'} Report
            </button>
          </div>
          {showAgentReport && (
            <div className="p-4 space-y-4">
              {/* Chart */}
              {agentChartData.length > 0 && (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''} />
                      <Legend />
                      <Bar dataKey="Break Min" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Break (min)" />
                      <Bar dataKey="Active Hours" fill="#10b981" radius={[4, 4, 0, 0]} name="Active (hrs)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Agent</th>
                      <th className="text-center px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Login</th>
                      <th className="text-center px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Logout</th>
                      <th className="text-center px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Total Hours</th>
                      <th className="text-center px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Breaks</th>
                      <th className="text-center px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Break Duration</th>
                      <th className="text-center px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Active Time</th>
                      <th className="text-center px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Break %</th>
                      <th className="px-3 py-2.5 text-xs font-bold text-indigo-800 uppercase border border-gray-200">Productivity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentBreakReport.map((agent) => (
                      <tr key={agent.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                        <td className="px-3 py-2.5 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {agent.name[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 text-xs">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600 border border-gray-200">{agent.loginTime}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600 border border-gray-200">{agent.logoutTime}</td>
                        <td className="px-3 py-2.5 text-center text-xs font-medium text-gray-700 border border-gray-200">{agent.totalHours}</td>
                        <td className="px-3 py-2.5 text-center border border-gray-200">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${agent.breakCount > 6 ? 'bg-red-100 text-red-700' : agent.breakCount > 3 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {agent.breakCount}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs font-mono font-medium text-amber-700 border border-gray-200">
                          {formatTime(agent.totalBreakSec)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs font-mono font-medium text-emerald-700 border border-gray-200">
                          {Math.floor(agent.activeWorkingSec / 3600)}h {Math.floor((agent.activeWorkingSec % 3600) / 60)}m
                        </td>
                        <td className="px-3 py-2.5 text-center border border-gray-200">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${agent.breakPct > 15 ? 'bg-red-100 text-red-700' : agent.breakPct > 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {agent.breakPct}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border border-gray-200">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 min-w-[80px]">
                            <div
                              className={`h-2.5 rounded-full transition-all ${agent.productivePct >= 85 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : agent.productivePct >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`}
                              style={{ width: `${Math.min(agent.productivePct, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 text-center">{agent.productivePct}%</p>
                        </td>
                      </tr>
                    ))}
                    {agentBreakReport.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">
                          <User size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No agent break data found for selected period</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <History size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Break History</h2>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm w-full sm:w-auto" style={{ maxWidth: '100%' }}>
              {[{k:'today',l:'Today'},{k:'yesterday',l:'Yesterday'},{k:'week',l:'Week'},{k:'1month',l:'1M'},{k:'3month',l:'3M'},{k:'6month',l:'6M'},{k:'all',l:'All'}].map(p => (
                <button key={p.k} onClick={() => setBreakPeriod(p.k)} className={`px-2.5 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap ${breakPeriod === p.k ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{p.l}</button>
              ))}
            </div>
            {canViewAll && (
              <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">All Agents</option>
                {companyUsers.sort((a, b) => a.name.localeCompare(b.name)).map(u => (
                  <option key={u.id} value={u.name}>{u.name} {u.status === 'Inactive' ? '(Inactive)' : ''}</option>
                ))}
              </select>
            )}
            {canViewAll && (
              <>
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
                <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Upload size={14} /> Import CSV
                </button>
                <button onClick={exportCSV} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => window.print()} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Printer size={14} /> PDF
                </button>
              </>
            )}
            {canDelete && (
              <>
                {selectedLogs.length > 0 && (
                  <button onClick={handleDeleteSelected} className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1">
                    <Trash2 size={14} /> Delete Selected ({selectedLogs.length})
                  </button>
                )}
                {visibleLogs.length > 0 && (
                  <button onClick={handleDeleteAll} className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1">
                    <Trash2 size={14} /> Delete All
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b-2 border-gray-300">
              <tr>
                {canDelete && (
                  <th className="px-4 py-3 text-left w-10 border border-gray-200">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedLogs.length === visibleLogs.length && visibleLogs.length > 0}
                      onChange={(e) => setSelectedLogs(e.target.checked ? visibleLogs.map(l => l.id) : [])}
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left border border-gray-200">Date</th>
                {canViewAll && <th className="px-4 py-3 text-left border border-gray-200">Employee</th>}
                <th className="px-4 py-3 text-left border border-gray-200">Type</th>
                <th className="px-4 py-3 text-left border border-gray-200">Start Time</th>
                <th className="px-4 py-3 text-left border border-gray-200">End Time</th>
                <th className="px-4 py-3 text-left border border-gray-200">Duration</th>
                <th className="px-4 py-3 text-left border border-gray-200">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={canViewAll ? 8 : 6} className="p-8 text-center text-gray-500">No break history found</td>
                </tr>
              ) : (
                visibleLogs.map(log => {
                  const user = users.find(u => u.id === log.userId);
                  const isActive = !log.endTime;
                  const logElapsed = isActive ? Math.floor((Date.now() - new Date(log.startTime).getTime()) / 1000) : 0;
                  return (
                    <tr key={log.id} className={`hover:bg-gray-50/50 ${isActive ? 'bg-amber-50/30' : ''}`}>
                      {canDelete && (
                        <td className="px-4 py-3 border border-gray-200">
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
                      <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                        {new Date(log.startTime).toLocaleDateString()}
                      </td>
                      {canViewAll && (
                        <td className="px-4 py-3 font-medium text-gray-900 border border-gray-200">{user?.name || 'Unknown'}</td>
                      )}
                      <td className="px-4 py-3 border border-gray-200">
                        <span className="badge bg-blue-50 text-blue-700">{log.type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                        {new Date(log.startTime).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                        {log.endTime ? new Date(log.endTime).toLocaleTimeString() : <span className="text-amber-500 font-semibold animate-pulse">{formatTime(logElapsed)}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium border border-gray-200">
                        {log.duration || (isActive ? formatTime(logElapsed) : '-')}
                      </td>
                      <td className="px-4 py-3 border border-gray-200">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 animate-pulse">
                            <Activity size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
