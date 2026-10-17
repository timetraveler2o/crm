import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, User, QueryStatus, Booking, SiteBooking, AttendanceRecord, BreakRecord, AttendanceSheetEntry, AttendanceStatus, LeaveBalance } from '../types';
import { client } from '../lib/api';

import { useAuthStore } from './authStore';


// Universal booking normalizer ensuring both camelCase and snake_case properties are populated
export const normalizeBooking = (b: any): any => {
  if (!b) return b;
  const pnrDetails = b.pnrDetails !== undefined ? b.pnrDetails : (b.pnr_details !== undefined ? b.pnr_details : '[]');
  const tripType = b.tripType !== undefined ? b.tripType : (b.trip_type !== undefined ? b.trip_type : 'One Way');
  const qcStatus = b.qcStatus !== undefined ? b.qcStatus : (b.qc_status !== undefined ? b.qc_status : 'NULL');
  return {
    ...b,
    pnrDetails,
    pnr_details: pnrDetails,
    tripType,
    trip_type: tripType,
    qcStatus,
    qc_status: qcStatus,
  };
};

interface CrmState {
  roles: Role[];
  users: User[];
  queryStatuses: QueryStatus[];
  bookings: Booking[];
  siteBookings: SiteBooking[];
  attendance: AttendanceRecord[];
  attendanceSheet: AttendanceSheetEntry[];
  leaveBalances: LeaveBalance[];
  isLoading: boolean;
  error: string | null;

  // Active break timer
  activeBreak: { type: string; startTime: number } | null;

  // Actions
  fetchData: () => Promise<void>;
  
  // Role actions
  addRole: (role: Omit<Role, 'id' | 'created' | 'modified'>) => Promise<void>;
  updateRole: (id: number, data: Partial<Role>) => Promise<void>;
  deleteRole: (id: number) => Promise<void>;

  // User actions
  addUser: (user: Omit<User, 'id' | 'created' | 'modified'>) => Promise<void>;
  updateUser: (id: number, data: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;

  // Query Status actions
  addQueryStatus: (qs: Omit<QueryStatus, 'id' | 'created' | 'modified'>) => Promise<void>;
  updateQueryStatus: (id: number, data: Partial<QueryStatus>) => Promise<void>;
  deleteQueryStatus: (id: number) => Promise<void>;

  // Booking actions
  addBooking: (booking: Omit<Booking, 'id' | 'queryId' | 'created' | 'modified'>) => Promise<void>;
  updateBooking: (id: number, data: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: number) => Promise<void>;

  // Site Booking actions
  addSiteBooking: (data: Partial<any>) => Promise<void>;
  assignSiteBooking: (id: number, agent: string) => Promise<void>;
  updateSiteBooking: (id: number, data: Partial<any>) => Promise<void>;
  deleteSiteBooking: (id: number) => Promise<void>;

  // Break actions
  startBreak: (type: string) => void;
  endBreak: () => void;

  // Attendance Sheet actions
  setAttendanceEntry: (userId: number, date: string, status: AttendanceStatus | null, logEntry?: string) => Promise<void>;
  removeAttendanceEntry: (userId: number, date: string, logEntry?: string) => Promise<void>;

  // Leave Balance actions
  updateLeaveBalance: (userId: number, year: number, data: Partial<LeaveBalance>, logEntry?: string) => Promise<void>;
}

export const useCrmStore = create<CrmState>()(persist((set, get) => ({
  roles: [],
  auditLogs: [],
  users: [],
  queryStatuses: [],
  bookings: [],
  siteBookings: [],
  attendance: [],
  attendanceSheet: [],
  leaveBalances: [],
  isLoading: false,
  error: null,
  activeBreak: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    const safeJson = async (p: Promise<Response>) => {
      try {
        const res = await p;
        if (!res.ok) return { data: [] };
        const json = await res.json();
        if (Array.isArray(json)) return { data: json };
        return json || { data: [] };
      } catch {
        return { data: [] };
      }
    };

    try {
      const [users, roles, bookings, sheet, balances, qs, sb, att] = await Promise.all([
        safeJson(client.api.fetch('/api/public/users')),
        safeJson(client.api.fetch('/api/public/roles')),
        safeJson(client.api.fetch('/api/public/bookings')),
        safeJson(client.api.fetch('/api/public/attendance-sheet')),
        safeJson(client.api.fetch('/api/public/leave-balances')),
        safeJson(client.api.fetch('/api/public/query-statuses')),
        safeJson(client.api.fetch('/api/public/site-bookings')),
        safeJson(client.api.fetch('/api/public/attendance')),
        safeJson(client.api.fetch('/api/public/audit-logs')),
      ]);

      const currentSb = get().siteBookings;
      const newSbData = Array.isArray(sb) ? sb : (sb?.data || []);
      
      // Check for new site bookings
      if (currentSb.length > 0 && newSbData.length > currentSb.length) {
        const newBookings = newSbData.filter((n: any) => !currentSb.find(c => c.id === n.id));
        newBookings.forEach((b: any) => {
          useAuthStore.getState().addNotification({
            title: 'New Website Lead',
            message: `New lead ${b.queryId} received from website`,
            type: 'info'
          });
        });
      }

      // Check for new assignments for current user
      const currentUser = useAuthStore.getState().currentUser;
      if (currentUser && currentSb.length > 0) {
        newSbData.forEach((n: any) => {
          const old = currentSb.find(c => c.id === n.id);
          if (old && old.assignment !== n.assignment && n.assignment === currentUser.name) {
            useAuthStore.getState().addNotification({
              title: 'New Lead Assigned',
              message: `Lead ${n.queryId} has been assigned to you`,
              type: 'success'
            });
          }
        });
      }

      // ── QC Notification Detection ──
      const currentBookings = get().bookings;
      const newBookingsData = bookings.data || [];
      if (currentUser && currentBookings.length > 0) {
        const roleLower = (currentUser.role || '').toLowerCase();
        const isSupervisor = ['admin', 'super admin', 'superuser', 'operation manager', 'manager', 'supervisor'].includes(roleLower);
        const isAgent = ['agent', 'travel consultant', 'senior travel consultant'].includes(roleLower);

        newBookingsData.forEach((nb: any) => {
          const ob = currentBookings.find((c: any) => c.id === nb.id);
          if (!ob) return;

          // Booking changed TO "Send to QC" → notify supervisors/managers
          if (ob.queryStatus !== 'Send to QC' && nb.queryStatus === 'Send to QC' && isSupervisor) {
            useAuthStore.getState().addNotification({
              title: 'New QC Submission',
              message: `${nb.addedBy || 'Agent'} sent booking ${nb.queryId} to QC for review`,
              type: 'warning'
            });
          }

          // Booking changed FROM "Send to QC" to "Sold" (QC Accepted) → notify the agent
          if (ob.queryStatus === 'Send to QC' && nb.queryStatus === 'Sold' && isAgent && nb.addedBy === currentUser.name) {
            useAuthStore.getState().addNotification({
              title: 'QC Accepted',
              message: `Your booking ${nb.queryId} has been accepted by QC!`,
              type: 'success'
            });
          }

          // Booking changed FROM "Send to QC" to "Follow Up" (QC Rejected) → notify the agent
          if (ob.queryStatus === 'Send to QC' && nb.queryStatus === 'Follow Up' && isAgent && nb.addedBy === currentUser.name) {
            useAuthStore.getState().addNotification({
              title: 'QC Rejected',
              message: `Your booking ${nb.queryId} was rejected by QC. Please review and correct.`,
              type: 'error'
            });
          }
        });
      }

      // Parse amadeusCreds JSON for each user
      const parsedUsers = (users.data || []).map((u: any) => ({
        ...u,
        amadeusCreds: (() => {
          if (Array.isArray(u.amadeusCreds)) return u.amadeusCreds;
          if (typeof u.amadeusCreds === 'string') {
            try { return JSON.parse(u.amadeusCreds); } catch { return []; }
          }
          return [];
        })()
      }));

      set({
        users: parsedUsers,
        roles: roles.data || [],
        auditLogs: auditRes?.data || [],
        bookings: (bookings.data || []).map(normalizeBooking),
        attendanceSheet: sheet.data || [],
        leaveBalances: balances.data || [],
        queryStatuses: qs.data || [],
        siteBookings: sb.data || [],
        attendance: att.data || [],
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      set({ error: err.message, isLoading: false });
    }
  },


  fetchAuditLogs: async () => {
    try {
      const res = await client.api.fetch('/api/public/audit-logs');
      if (res.ok) {
        const d = await res.json();
        set({ auditLogs: d.data || [] });
      }
    } catch (e) {
      console.warn('Failed to fetch audit logs:', e);
    }
  },

  addAuditLog: async (log) => {
    try {
      const res = await client.api.fetch('/api/public/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.data) {
          set((s) => ({ auditLogs: [d.data, ...s.auditLogs] }));
        }
      }
    } catch (e) {
      console.warn('Failed to save audit log:', e);
    }
  },

  addRole: async (role) => {
    try {
      const res = await client.api.fetch('/api/public/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const roleData = {
        ...data.data,
        permissions: Array.isArray(data.data.permissions) ? data.data.permissions : (typeof data.data.permissions === 'string' ? (() => { try { return JSON.parse(data.data.permissions); } catch { return []; } })() : [])
      };
      set((s) => ({ roles: [...s.roles, roleData] }));
    } catch (err) {
      console.error('Failed to add role:', err);
      throw err;
    }
  },
  updateRole: async (id, data) => {
    try {
      const res = await client.api.fetch(`/api/public/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const updated = await res.json();
      if (updated.data) {
        const roleData = {
          ...updated.data,
          permissions: Array.isArray(updated.data.permissions) ? updated.data.permissions : (typeof updated.data.permissions === 'string' ? (() => { try { return JSON.parse(updated.data.permissions); } catch { return []; } })() : [])
        };
        set((s) => ({ roles: s.roles.map((r) => (r.id === id ? roleData : r)) }));
      }
    } catch (err) {
      console.error('Failed to update role:', err);
      throw err;
    }
  },
  deleteRole: async (id) => {
    try {
      const res = await client.api.fetch(`/api/public/roles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      set((s) => ({ roles: s.roles.filter((r) => r.id !== id) }));
    } catch (err) {
      console.error('Failed to delete role:', err);
      throw err;
    }
  },

  addUser: async (user) => {
    try {
      // Stringify amadeusCreds for backend storage
      const payload = { ...user, amadeusCreds: JSON.stringify(user.amadeusCreds || []) };
      const res = await client.api.fetch('/api/public/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const parsed = { ...data.data, amadeusCreds: (() => { try { return JSON.parse(data.data.amadeusCreds || '[]'); } catch { return []; } })() };
      set((s) => ({ users: [parsed, ...s.users] }));
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  },
  updateUser: async (id, data) => {
    try {
      // Stringify amadeusCreds for backend storage if present
      const payload = data.amadeusCreds !== undefined
        ? { ...data, amadeusCreds: JSON.stringify(data.amadeusCreds) }
        : data;
      const res = await client.api.fetch(`/api/public/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const updated = await res.json();
      if (updated.data) {
        const parsed = { ...updated.data, amadeusCreds: (() => { try { return JSON.parse(updated.data?.amadeusCreds || '[]'); } catch { return []; } })() };
        set((s) => ({ users: s.users.map((u) => (u.id === id ? parsed : u)) }));
      } else {
        // If backend doesn't return full data, update locally with the sent data
        const localAmadeus = data.amadeusCreds !== undefined ? data.amadeusCreds : undefined;
        set((s) => ({
          users: s.users.map((u) => {
            if (u.id !== id) return u;
            const merged = { ...u, ...data };
            if (localAmadeus !== undefined) merged.amadeusCreds = localAmadeus as any;
            return merged;
          })
        }));
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err; // Re-throw so callers can catch it
    }
  },
  deleteUser: async (id) => {
    try {
      await client.api.fetch(`/api/public/users/${id}`, { method: 'DELETE' });
      set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  },

  addQueryStatus: async (qs) => {
    try {
      const res = await client.api.fetch('/api/public/query-statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qs),
      });
      const data = await res.json();
      set((s) => ({ queryStatuses: [...s.queryStatuses, data.data] }));
    } catch (err) {
      console.error('Failed to add query status:', err);
    }
  },
  updateQueryStatus: async (id, data) => {
    try {
      const res = await client.api.fetch(`/api/public/query-statuses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set((s) => ({ queryStatuses: s.queryStatuses.map((qs) => (qs.id === id ? updated.data : qs)) }));
    } catch (err) {
      console.error('Failed to update query status:', err);
    }
  },
  deleteQueryStatus: async (id) => {
    try {
      await client.api.fetch(`/api/public/query-statuses/${id}`, { method: 'DELETE' });
      set((s) => ({ queryStatuses: s.queryStatuses.filter((qs) => qs.id !== id) }));
    } catch (err) {
      console.error('Failed to delete query status:', err);
    }
  },

  addBooking: async (booking) => {
    try {
      const res = await client.api.fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to save booking (${res.status})`);
      }
      const data = await res.json();
      if (data.data) {
        set((s) => ({ bookings: [normalizeBooking(data.data), ...s.bookings] }));
      } else {
        throw new Error('Failed to save booking - no data returned');
      }
    } catch (err) {
      console.error('Failed to add booking:', err);
      throw err;
    }
  },
  updateBooking: async (id, data) => {
    try {
      const res = await client.api.fetch(`/api/public/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to update booking (${res.status})`);
      }
      const updated = await res.json();
      if (updated.data) {
        const norm = normalizeBooking(updated.data);
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? norm : b)) }));
        return norm;
      } else {
        // Backend returned success but no data — update local state with the sent data
        const mergedData = normalizeBooking({ ...get().bookings.find(b => b.id === id), ...data, id, modified: new Date().toISOString() });
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? mergedData : b)) }));
        return mergedData;
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
      throw err;
    }
  },
  deleteBooking: async (id) => {
    try {
      // Get the booking first to find images
      const state = get();
      const booking = state.bookings.find(b => b.id === id);
      
      await client.api.fetch(`/api/public/bookings/${id}`, { method: 'DELETE' });
      set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) }));
      
      // Clean up images from storage
      if (booking?.images) {
        const imagePaths = typeof booking?.images === 'string' ? booking.images.split(',').filter(Boolean) : (Array.isArray(booking?.images) ? booking.images : []);
        for (const path of imagePaths) {
          try {
            await client.api.fetch('/api/public/upload/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path })
            });
          } catch { /* ignore cleanup errors */ }
        }
      }
    } catch (err) {
      console.error('Failed to delete booking:', err);
    }
  },

  addSiteBooking: async (data) => {
    try {
      const res = await client.api.fetch('/api/public/site-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      if (created.data) {
        set((s) => ({ siteBookings: [created.data, ...s.siteBookings] }));
      }
    } catch (err) {
      console.error('Failed to add site booking:', err);
    }
  },

  assignSiteBooking: async (id, agent) => {
    try {
      const res = await client.api.fetch(`/api/public/site-bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: agent }),
      });
      const updated = await res.json();
      set((s) => {
        const sb = s.siteBookings.find(b => b.id === id);
        if (sb && agent !== 'Unassigned') {
          // Auto-create a booking for the agent with correct company
          const newBooking = {
            queryId: sb.queryId,
            addedBy: agent,
            firstName: sb.name.split(' ')[0] || '',
            lastName: sb.name.split(' ').slice(1).join(' ') || '',
            email: sb.email,
            phone: sb.phone,
            origin: sb.origin,
            destination: sb.destination,
            departureDate: sb.travelDates.split(' to ')[0] || '',
            returnDate: sb.travelDates.split(' to ')[1] || '',
            cabin: 'Economy',
            adults: 1,
            children: 0,
            infants: 0,
            queryStatus: 'Follow Up',
            querySource: 'Website',
            remarks: JSON.stringify([{ text: 'Assigned from Site Bookings', addedBy: 'System', date: new Date().toLocaleString() }]),
            partialPayment: 'No',
            tripType: sb.travelDates.includes('to') ? 'Round Trip' : 'One Way',
            currency: 'USD',
            pnr: '',
            pnrDetails: '[]',
            images: '',
            company: sb.company || 'Get Set Flight'
          };
          // We call addBooking but since it's async, we just fire it
          client.api.fetch('/api/public/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooking),
          }).then(r => r.json()).then(d => {
            set((state) => ({ bookings: [d.data, ...state.bookings] }));
          });
        }
        return {
          siteBookings: s.siteBookings.map(b => b.id === id ? updated.data : b)
        };
      });
    } catch (err) {
      console.error('Failed to assign site booking:', err);
    }
  },

  deleteSiteBooking: async (id) => {
    try {
      await client.api.fetch(`/api/public/site-bookings/${id}`, { method: 'DELETE' });
      set((s) => ({
        siteBookings: s.siteBookings.filter(b => b.id !== id)
      }));
    } catch (err) {
      console.error('Failed to delete site booking:', err);
    }
  },

  updateSiteBooking: async (id, data) => {
    try {
      const res = await client.api.fetch(`/api/public/site-bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set((s) => ({
        siteBookings: s.siteBookings.map(b => b.id === id ? { ...b, ...updated.data } : b)
      }));
    } catch (err) {
      console.error('Failed to update site booking:', err);
    }
  },

  startBreak: (type) => {
    set({ activeBreak: { type, startTime: Date.now() } });
    // In real app, call API to log break start
  },
  endBreak: () => {
    set({ activeBreak: null });
    // In real app, call API to log break end
  },

  setAttendanceEntry: async (userId, date, status, logEntry) => {
    // Save previous state for rollback on error
    const previousSheet = get().attendanceSheet;
    try {
      if (status === null) {
        // Optimistic remove
        set((s) => ({
          attendanceSheet: s.attendanceSheet.filter((e) => !(e.userId === userId && e.date === date))
        }));
        const res = await client.api.fetch('/api/public/attendance-sheet', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, date, logEntry }),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return;
      }
      // Optimistic update
      set((s) => ({
        attendanceSheet: [
          ...s.attendanceSheet.filter((e) => !(e.userId === userId && e.date === date)),
          { userId, date, status }
        ],
      }));
      const res = await client.api.fetch('/api/public/attendance-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, status, logEntry }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      set((s) => ({
        attendanceSheet: [
          ...s.attendanceSheet.filter((e) => !(e.userId === userId && e.date === date)),
          data.data,
        ],
      }));
    } catch (err) {
      console.error('Failed to set attendance:', err);
      // Rollback to previous state on error
      set({ attendanceSheet: previousSheet });
    }
  },
  removeAttendanceEntry: async (userId, date, logEntry) => {
    const previousSheet = get().attendanceSheet;
    try {
      set((s) => ({
        attendanceSheet: s.attendanceSheet.filter((e) => !(e.userId === userId && e.date === date))
      }));
      const res = await client.api.fetch('/api/public/attendance-sheet', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, logEntry }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
    } catch (err) {
      console.error('Failed to remove attendance:', err);
      // Rollback on error
      set({ attendanceSheet: previousSheet });
    }
  },

  updateLeaveBalance: async (userId, year, data, logEntry) => {
    const previousBalances = get().leaveBalances;
    try {
      const res = await client.api.fetch('/api/public/leave-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, year, ...data, logEntry }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const result = await res.json();
      const existingIndex = get().leaveBalances.findIndex(lb => lb.userId === userId && lb.year === year);
      if (existingIndex >= 0) {
        set((s) => ({
          leaveBalances: s.leaveBalances.map((lb) =>
            lb.userId === userId && lb.year === year ? result.data : lb
          ),
        }));
      } else {
        // New entry - add to the array
        set((s) => ({
          leaveBalances: [...s.leaveBalances, result.data],
        }));
      }
    } catch (err) {
      console.error('Failed to update leave balance:', err);
      // Rollback on error
      set({ leaveBalances: previousBalances });
    }
  }
}), {
  name: 'crm-storage',
  partialize: (state) => ({ activeBreak: state.activeBreak }),
}));
