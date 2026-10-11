import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Notification, CompanyId } from '../types';
import { getCompanyFromEmail } from '../types';
import { client, API_BASE_URL } from '../lib/api';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 hours in ms

interface AuthState {
  isAuthenticated: boolean;
  isChecking: boolean;
  currentUser: (User & { permissions?: string[] }) | null;
  notifications: Notification[];
  activeCompany: CompanyId; // Company context for admins switching between companies
  loginTimestamp: number | null; // Timestamp when user logged in (for 12-hour auto-logout)
  login: (email: string, password: string) => Promise<boolean>;
  loginWithUserData: (userData: any) => void;
  logout: () => Promise<void>;
  checkAutoLogout: () => boolean; // Returns true if session expired
  updateProfile: (data: Partial<User>) => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'created' | 'read'>) => void;
  markNotificationRead: (id: number) => void;
  markAllRead: () => void;
  clearAllNotifications: () => void;
  unreadCount: () => number;
  getCompanyNotifications: () => Notification[];
  checkSession: () => Promise<void>;
  setChecking: (value: boolean) => void;
  setActiveCompany: (company: CompanyId) => void;
  getUserCompany: () => CompanyId;
  isMultiCompanyAdmin: () => boolean;
  fetchNotifications: () => Promise<void>;
}

const defaultNotifications: Notification[] = [
  { id: 1, title: 'New Booking', message: 'New booking #QRY-10234 received from website', type: 'info', read: false, created: '18 Feb 2026 / 09:30 PM' },
  { id: 2, title: 'Payment Received', message: 'Payment of ₹45,000 received for QRY-10220', type: 'success', read: false, created: '18 Feb 2026 / 08:15 PM' },
  { id: 3, title: 'Callback Due', message: '5 callbacks pending for today', type: 'warning', read: true, created: '18 Feb 2026 / 07:00 PM' },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isChecking: false,
      currentUser: null,
      notifications: [],
      activeCompany: 'GSF',
      loginTimestamp: null,
      
      setChecking: (value) => set({ isChecking: value }),

      setActiveCompany: (company) => set({ activeCompany: company }),

      getUserCompany: () => {
        const { currentUser } = get();
        if (!currentUser) return 'GSF';
        return getCompanyFromEmail(currentUser.email);
      },

      isMultiCompanyAdmin: () => {
        const { currentUser } = get();
        if (!currentUser) return false;
        const role = (currentUser.role || '').toLowerCase();
        return ['admin', 'super admin', 'superuser', 'hr (human resource)', 'hr', 'it (information tech)', 'it'].includes(role);
      },

      login: async (email, password) => {
        try {
          set({ isChecking: true });
          const trimmedEmail = email.trim().toLowerCase();
          const trimmedPassword = password.trim();
          
          const res = await client.api.fetch('/api/public/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
          });
          
          let data: any = {};
          try {
            data = await res.json();
          } catch {
            set({ isChecking: false });
            return { success: false, message: 'Server connection error. Please try again.' } as any;
          }
          
          if (!res.ok || !data.success) {
            console.error('Login failed:', data.message || 'Unknown error');
            set({ isChecking: false });
            return { success: false, message: data.message || 'Invalid email or password' } as any;
          }

          // Block inactive users from logging in
          if (data.user?.status === 'Inactive') {
            console.error('Login blocked: User account is inactive');
            set({ isChecking: false });
            return { success: false, message: 'Account is inactive. Please contact administrator.' } as any;
          }

          const userCompany = getCompanyFromEmail(data.user.email);
          const loginTime = new Date().toISOString();
          set({
            isAuthenticated: true,
            isChecking: false,
            currentUser: data.user,
            activeCompany: userCompany,
            loginTimestamp: Date.now(),
          });

          // Record login activity with check-in time
          try {
            const deviceInfo = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
            await client.api.fetch('/api/public/login-activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                userName: data.user.name,
                email: data.user.email,
                ipAddress: 'Browser',
                device: deviceInfo,
                loginTime,
                logoutTime: '',
                duration: '',
                status: 'Success',
                created: new Date().toLocaleString()
              })
            });
          } catch (err) {
            console.error('Failed to record login activity:', err);
          }

          return true;
        } catch (err) {
          console.error('Login failed:', err);
          set({ isChecking: false });
          return false;
        }
      },

      loginWithUserData: (userData: any) => {
        const userCompany = getCompanyFromEmail(userData.email);
        set({
          isAuthenticated: true,
          isChecking: false,
          currentUser: userData,
          activeCompany: userCompany,
          loginTimestamp: Date.now(),
        });
      },

      logout: async () => {
        // Record logout time in login-activity before clearing state
        const { currentUser } = get();
        if (currentUser) {
          try {
            const logoutTime = new Date().toISOString();
            // Find latest login-activity for this user and update logout time
            const res = await fetch(`${API_BASE_URL}/api/public/login-activity`);
            const { data: logs } = await res.json();
            const latestLog = (logs || []).filter((l: any) => l.userId === currentUser.id && !l.logoutTime)
              .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))[0];
            if (latestLog) {
              const loginTimeMs = new Date(latestLog.loginTime).getTime();
              const durationMs = Date.now() - loginTimeMs;
              const hours = Math.floor(durationMs / 3600000);
              const mins = Math.floor((durationMs % 3600000) / 60000);
              const duration = `${hours}h ${mins}m`;
              await fetch(`${API_BASE_URL}/api/public/login-activity/${latestLog.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoutTime, duration })
              });
            }
          } catch (err) {
            console.error('Failed to record logout activity:', err);
          }
        }
        set({ isAuthenticated: false, currentUser: null, loginTimestamp: null });
      },

      checkAutoLogout: () => {
        const { loginTimestamp, isAuthenticated, currentUser } = get();
        if (!isAuthenticated || !loginTimestamp) return false;
        const elapsed = Date.now() - loginTimestamp;
        if (elapsed >= TWELVE_HOURS_MS) {
          // 12 hours passed - auto logout with logout time recording
          if (currentUser) {
            const logoutTime = new Date().toISOString();
            const hours = Math.floor(elapsed / 3600000);
            const mins = Math.floor((elapsed % 3600000) / 60000);
            const duration = `${hours}h ${mins}m`;
            // Best effort - update login-activity asynchronously
            fetch(`${API_BASE_URL}/api/public/login-activity`).then(res => res.json()).then(({ data: logs }) => {
              const latestLog = (logs || []).filter((l: any) => l.userId === currentUser.id && !l.logoutTime)
                .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))[0];
              if (latestLog) {
                fetch(`${API_BASE_URL}/api/public/login-activity/${latestLog.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ logoutTime, duration, status: 'Auto-Logout' })
                }).catch(() => {});
              }
            }).catch(() => {});
          }
          set({ isAuthenticated: false, currentUser: null, loginTimestamp: null });
          return true;
        }
        return false;
      },

      checkSession: async () => {
        // No-op for custom auth, rely on persisted state
        set({ isChecking: false });
      },

      updateProfile: async (data) => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        try {
          const res = await client.api.fetch(`/api/public/users/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const updated = await res.json();
          // Keep permissions when updating profile
          set({ currentUser: { ...updated.data, permissions: currentUser.permissions } });
        } catch (err) {
          console.error('Failed to update profile:', err);
        }
      },

      addNotification: (n) => {
        const { activeCompany, getUserCompany, isMultiCompanyAdmin } = get();
        const company = (n as any).company || (isMultiCompanyAdmin() ? activeCompany : getUserCompany());
        const newNotification = { ...n, id: Date.now(), created: new Date().toLocaleString(), read: false, company };
        set((state) => ({ notifications: [newNotification, ...state.notifications] }));
        
        // Play sound based on notification type/title (uses mixkit-software-interface-start-2574)
        try {
          const title = (n.title || '').toLowerCase();
          
          // QC-specific sounds
          if (title.includes('qc accepted')) {
            const audio = new Audio('/sounds/qc-accepted.wav');
            audio.volume = 0.8;
            audio.play().catch(() => {});
          } else if (title.includes('qc rejected')) {
            const audio = new Audio('/sounds/qc-rejected.wav');
            audio.volume = 0.8;
            audio.play().catch(() => {});
          } else if (title.includes('sent to qc') || title.includes('qc submission') || title.includes('new qc')) {
            const audio = new Audio('/sounds/qc-send.wav');
            audio.volume = 0.8;
            audio.play().catch(() => {});
          } else {
            // Default CRM notification sound (mixkit-software-interface-start-2574)
            const audio = new Audio('/sounds/notification.wav');
            audio.volume = 0.8;
            audio.play().catch(() => {});
          }
        } catch (err) {
          console.error('Failed to play notification sound:', err);
        }
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
        client.api.fetch(`/api/public/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
        client.api.fetch('/api/public/notifications/read-all', { method: 'PUT' }).catch(() => {});
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      unreadCount: () => {
        const { notifications, activeCompany } = get();
        return notifications.filter(n => !n.read && (!n.company || n.company === activeCompany)).length;
      },

      getCompanyNotifications: () => {
        const { notifications, activeCompany } = get();
        return notifications.filter(n => !n.company || n.company === activeCompany);
      },

      fetchNotifications: async () => {
        try {
          const { activeCompany, notifications: currentNotifs } = get();
          const res = await client.api.fetch(`/api/public/notifications?company=${encodeURIComponent(activeCompany || '')}`);
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const mapped = json.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              message: item.message,
              type: item.type || 'info',
              read: Boolean(item.isRead),
              created: item.created,
              company: item.company || 'Get Set Flight',
              queryId: item.queryId
            }));

            // Check if there are newly arrived unread notifications
            const prevIds = new Set(currentNotifs.map(n => n.id));
            const hasNewArrivals = mapped.some(n => !prevIds.has(n.id) && !n.read);
            if (hasNewArrivals) {
              try {
                const audio = new Audio('/sounds/notification.wav');
                audio.volume = 0.8;
                audio.play().catch(() => {});
              } catch {}
            }

            set({ notifications: mapped });
          }
        } catch (err) {
          console.warn('[NOTIFS] Background fetch notice:', err);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated, 
        currentUser: state.currentUser,
        notifications: state.notifications,
        activeCompany: state.activeCompany,
        loginTimestamp: state.loginTimestamp,
      }),
    }
  )
);
