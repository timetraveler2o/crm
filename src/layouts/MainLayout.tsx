import ErrorBoundary from '../components/ErrorBoundary';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCrmStore } from '../store/crmStore';
import { useThemeStore, THEMES, type ThemeName } from '../store/themeStore';
import Avatar from '../components/Avatar';
import { COMPANIES, getCompanyInfo, type CompanyId } from '../types';
const RN_LOGO = '/logo.png';
import {
  LayoutDashboard, Shield, Users, ListChecks, Plane, Globe,
  Clock, BarChart3, Bell, User, LogOut, Menu, X, ChevronDown,
  Timer, Settings, FileBarChart, Activity, Lock, ArrowLeft, Palette,
  Megaphone, AlertTriangle, Phone, ClipboardList, Receipt, CreditCard
} from 'lucide-react';

// Sound utility
const playSound = (src: string) => {
  try {
    const audio = new Audio(src);
    audio.volume = 0.7;
    audio.play().catch(() => {});
    return audio;
  } catch { return null; }
};

// Permission required for each nav route
const ROUTE_PERMISSION_MAP: Record<string, string | null> = {
  '/dashboard': null,
  '/roles': 'Role Management',
  '/users': 'User Management',
  '/query-status': 'Query Status Management',
  '/bookings': 'Booking Management',
  '/site-bookings': 'Booking Management',
  '/payment-authorizations': 'Payment Authorization',
  '/attendance': 'Attendance',
  '/productivity': 'Attendance',
  '/break-monitor': 'Attendance',
  '/reports': 'Reports',
  '/login-activity': 'Login Activity',
  '/ip-whitelist': 'IP Whitelist',
  '/updates': null,
  '/payslip': null,
};

const allNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/roles', icon: Shield, label: 'Roles' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/query-status', icon: ListChecks, label: 'Query Status' },
  { to: '/bookings', icon: Plane, label: 'Bookings' },
  { to: '/site-bookings', icon: Globe, label: 'Site Bookings' },
  { to: '/payment-authorizations', icon: CreditCard, label: 'Payment Auth' },
  { to: '/attendance', icon: Clock, label: 'Attendance' },
  { to: '/productivity', icon: BarChart3, label: 'Productivity' },
  { to: '/break-monitor', icon: Timer, label: 'Break Monitor' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/login-activity', icon: Activity, label: 'Check Login' },
  { to: '/ip-whitelist', icon: Lock, label: 'IP Whitelist' },
  { to: '/updates', icon: Megaphone, label: 'Updates' },
  { to: '/payslip', icon: Receipt, label: 'Salary Slip' },
];

// Pages that show notification badges
const BADGE_PAGES = ['/dashboard', '/bookings', '/site-bookings', '/payment-authorizations', '/updates', '/query-status', '/attendance', '/productivity', '/break-monitor', '/reports', '/login-activity', '/ip-whitelist', '/roles', '/users'];

export default function MainLayout() {
  // On mobile, sidebar starts closed; on desktop starts open
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { currentUser, logout, notifications, markNotificationRead, markAllRead, clearAllNotifications, deleteNotification, unreadCount, getCompanyNotifications, fetchNotifications } = useAuthStore();
  const { fetchData, siteBookings, bookings, activeBreak } = useCrmStore();
  const { currentTheme, setTheme } = useThemeStore();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const unread = unreadCount();

  // Periodic background sync for CRM notifications (live sync every 10s)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // === Break Monitoring Popup ===
  const [breakAlert, setBreakAlert] = useState<{ show: boolean; message: string } | null>(null);
  const breakAlertFiredRef = useRef(false);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);

  // === Callback Reminder Popup ===
  const [callbackReminders, setCallbackReminders] = useState<any[]>([]);
  const [dismissedCallbacks, setDismissedCallbacks] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('dismissed_callbacks_today');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toISOString().split('T')[0]) {
          return new Set(parsed.ids);
        }
      }
    } catch {}
    return new Set();
  });

  // Check for callback reminders
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const myName = currentUser?.name || '';
    
    const callbackBookings = (Array.isArray(bookings) ? bookings : []).filter((b: any) => {
      if (b.queryStatus !== 'Call Back') return false;
      if (!b.callbackDate) return false;
      if (b.callbackDate !== today) return false;
      if (b.addedBy !== myName) return false;
      if (dismissedCallbacks.has(b.id)) return false;
      // If callbackTime is set, only show notification at/after that time
      if (b.callbackTime && typeof b.callbackTime === 'string' && b.callbackTime.includes(':')) {
        const [h, m] = b.callbackTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          if (currentHour < h || (currentHour === h && currentMin < m)) return false;
        }
      }
      return true;
    });

    setCallbackReminders(callbackBookings);
  }, [bookings, currentUser, dismissedCallbacks]);

  // Re-check callback reminders every minute for time-based ones
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const myName = currentUser?.name || '';
      
      const callbackBookings = (Array.isArray(bookings) ? bookings : []).filter((b: any) => {
        if (b.queryStatus !== 'Call Back') return false;
        if (!b.callbackDate) return false;
        if (b.callbackDate !== today) return false;
        if (b.addedBy !== myName) return false;
        if (dismissedCallbacks.has(b.id)) return false;
        if (b.callbackTime) {
          const [h, m] = b.callbackTime.split(':').map(Number);
          if (currentHour < h || (currentHour === h && currentMin < m)) return false;
        }
        return true;
      });

      setCallbackReminders(callbackBookings);
    }, 60000); // check every 60 seconds
    return () => clearInterval(interval);
  }, [bookings, currentUser, dismissedCallbacks]);

  const dismissCallback = (id: number) => {
    const newDismissed = new Set(dismissedCallbacks);
    newDismissed.add(id);
    setDismissedCallbacks(newDismissed);
    localStorage.setItem('dismissed_callbacks_today', JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      ids: Array.from(newDismissed)
    }));
  };

  const dismissAllCallbacks = () => {
    const newDismissed = new Set(dismissedCallbacks);
    callbackReminders.forEach((b: any) => newDismissed.add(b.id));
    setDismissedCallbacks(newDismissed);
    localStorage.setItem('dismissed_callbacks_today', JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      ids: Array.from(newDismissed)
    }));
  };

  useEffect(() => {
    if (!activeBreak) {
      breakAlertFiredRef.current = false;
      setBreakAlert(null);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeBreak.startTime) / 1000);
      // Fire once when break exceeds 1 hour (3600 seconds)
      if (elapsed >= 3600 && !breakAlertFiredRef.current) {
        breakAlertFiredRef.current = true;
        setBreakAlert({ show: true, message: `Break time exceeded 1 hour! (${activeBreak.type} break)` });
        breakAudioRef.current = playSound('/sounds/alert-ascending.mp3');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeBreak]);

  const dismissBreakAlert = useCallback(() => {
    setBreakAlert(null);
    if (breakAudioRef.current) {
      breakAudioRef.current.pause();
      breakAudioRef.current = null;
    }
  }, []);

  // === Notification Sounds (mixkit-software-interface-start-2574) ===
  const prevNotifCountRef = useRef(notifications.length);
  useEffect(() => {
    if (notifications.length > prevNotifCountRef.current) {
      const newest = notifications[0];
      if (newest) {
        const title = (newest.title || '').toLowerCase();
        // QC-specific sounds are already handled by addNotification in authStore
        const isQC = title.includes('qc') || title.includes('sent to qc');
        if (!isQC) {
          playSound('/sounds/notification.wav');
        }
      }
    }
    prevNotifCountRef.current = notifications.length;
  }, [notifications.length]);

  // 12-hour auto-logout check
  useEffect(() => {
    const { checkAutoLogout } = useAuthStore.getState();
    // Check immediately on mount
    if (checkAutoLogout()) {
      navigate('/');
      return;
    }
    // Check every 60 seconds
    const interval = setInterval(() => {
      if (checkAutoLogout()) {
        navigate('/');
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Track screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar when resizing to mobile
      if (mobile && sidebarOpen) setSidebarOpen(false);
      // Auto-open sidebar when resizing to desktop
      if (!mobile && !sidebarOpen) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const { activeCompany, setActiveCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();
  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;
  const companyInfo = getCompanyInfo(displayCompany);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter nav items based on user permissions
  const userPermissions = currentUser?.permissions || [];
  const roleLower = (currentUser?.role || '').toLowerCase();
  const isFullAccess = roleLower === 'admin' || roleLower === 'super admin' || roleLower === 'superuser' || roleLower === 'manager' || roleLower === 'operation manager' || roleLower === 'hr (human resource)' || roleLower === 'hr' || roleLower === 'it (information tech)' || roleLower === 'it';

  const navItems = allNavItems.filter(item => {
    const requiredPerm = ROUTE_PERMISSION_MAP[item.to];
    const isAgentRole = roleLower === 'agent';
    if (isAgentRole && ['/site-bookings', '/productivity'].includes(item.to)) return false;
    
    // Payment Authorization permission: Default for Admin, Super Admin, Manager. Lower roles (Supervisor, Agent) require explicit permission.
    if (item.to === '/payment-authorizations') {
      const isPaymentDefaultRole = ['admin', 'super admin', 'superuser', 'manager', 'operation manager'].includes(roleLower);
      if (isPaymentDefaultRole) return true;
      return userPermissions.includes('Payment Authorization');
    }

    if (requiredPerm === null) return true;
    if (isFullAccess) return true;
    return userPermissions.includes(requiredPerm);
  });

  // Calculate badge counts for sidebar items based on new/unread items
  const getCompanyFilter = (items: any[]) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      if (!item) return false;
      const company = item.company;
      if (!company) return displayCompany === 'GSF';
      if (displayCompany === 'GSF') return company === 'Get Set Flight';
      if (displayCompany === 'LBT') return company === 'Look Book Ticket';
      if (displayCompany === 'travelo') return company === 'Traveloboom';
      return false;
    });
  };

  // Track seen counts in localStorage
  const getSeenCount = (key: string): number => {
    try { return parseInt(localStorage.getItem(`badge_seen_${key}_${displayCompany}`) || '0', 10); } catch { return 0; }
  };
  const setSeenCount = (key: string, count: number) => {
    localStorage.setItem(`badge_seen_${key}_${displayCompany}`, String(count));
  };

  const companySiteBookings = getCompanyFilter(siteBookings);
  const companyBookings = getCompanyFilter(bookings);
  
  // Badge counts: show count of new items since last visit
  // Uses localStorage to track "seen" counts that reduce when page is visited
  const badgeCounts: Record<string, number> = {};
  
  const sbNewCount = companySiteBookings.filter(sb => sb.status === 'New' && (!sb.assignment || sb.assignment === 'Unassigned')).length;
  if (sbNewCount > 0) badgeCounts['/site-bookings'] = sbNewCount;
  
  // Bookings: track total count vs seen count to reduce badge when visited
  const totalBookingsCount = companyBookings.length;
  const seenBookingsCount = getSeenCount('bookings');
  const newBookingsBadge = totalBookingsCount - seenBookingsCount;
  if (newBookingsBadge > 0) badgeCounts['/bookings'] = newBookingsBadge;

  // Mark bookings as seen when on bookings page
  useEffect(() => {
    if (location.pathname === '/bookings') {
      setSeenCount('bookings', totalBookingsCount);
    }
    if (location.pathname === '/site-bookings') {
      // Site bookings badge is status-based, no need to track
    }
    if (location.pathname === '/updates') {
      markAllRead();
    }
  }, [location.pathname, totalBookingsCount]);

  const companyNotifications = Array.isArray(getCompanyNotifications()) ? getCompanyNotifications() : [];
  if (unread > 0) badgeCounts['/updates'] = unread;

  // Payment authorizations live badge count
  const paymentAuthUnread = companyNotifications.filter(n => {
    if (!n || n.read) return false;
    const title = String(n.title || '').toLowerCase();
    return title.includes('payment') || title.includes('💳');
  }).length;
  if (paymentAuthUnread > 0) badgeCounts['/payment-authorizations'] = paymentAuthUnread;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setProfileOpen(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const isNotDashboard = location.pathname !== '/dashboard';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 transition-all duration-300 z-30`
      } border-r border-gray-800 text-white flex flex-col`} style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        <div 
          className="p-3 sm:p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => { navigate('/dashboard'); if (isMobile) setSidebarOpen(false); }}
          title="Go to Dashboard"
        >
          <div className="bg-white p-1 rounded-lg shadow-sm flex items-center justify-center" style={{width:'40px', height:'40px'}}>
            <img 
              src={companyInfo.logo} 
              alt={companyInfo.name} 
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = RN_LOGO; }}
            />
          </div>
          {(sidebarOpen || isMobile) && <span className="text-xs font-bold text-white tracking-wide leading-tight">{companyInfo.short}<br/><span className="text-[10px] font-normal opacity-70">{companyInfo.name}</span></span>}
          {/* Mobile close button */}
          {isMobile && sidebarOpen && (
            <button onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }} className="ml-auto p-1 hover:bg-white/10 rounded-lg">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const badge = badgeCounts[to];
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => { if (isMobile) setSidebarOpen(false); }}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active text-white' : 'hover:text-white'} relative`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#fff' : 'var(--sidebar-text)',
                  backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                })}
              >
                <Icon size={18} />
                {(sidebarOpen || isMobile) && <span>{label}</span>}
                {badge && badge > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {!sidebarOpen && !isMobile && badge && badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-gray-800" />
                )}
              </NavLink>
            );
          })}
        </nav>
        {/* Mobile: close sidebar on nav click */}

        {/* User at bottom */}
        {(sidebarOpen || isMobile) && currentUser && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Avatar src={currentUser?.image} name={currentUser?.name || 'User'} className="w-8 h-8" textSize="text-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.role || 'Staff'}</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="border-b h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 z-20" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              <Menu size={20} />
            </button>
            {isNotDashboard && (
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Go Back">
                <ArrowLeft size={20} />
              </button>
            )}
            {/* Company switcher for Admin/HR/IT */}
            {isMultiAdmin && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
                {COMPANIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCompany(c.id as CompanyId)}
                    className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all ${
                      activeCompany === c.id 
                        ? 'bg-white shadow text-blue-700 border border-blue-200' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title={c.name}
                  >
                    {c.short}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Picker */}
            <div className="relative" ref={themeRef}>
              <button 
                onClick={() => { setShowThemePicker(!showThemePicker); setNotifOpen(false); setProfileOpen(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Change Theme"
              >
                <Palette size={20} />
              </button>
              {showThemePicker && (
                <div className="fixed sm:absolute inset-x-0 sm:inset-x-auto bottom-0 sm:bottom-auto sm:right-0 sm:mt-2 w-full sm:w-[480px] bg-white rounded-t-xl sm:rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 max-h-[75vh] overflow-y-auto animate-slideUp sm:animate-fadeIn">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">Choose CRM Color Theme</h3>
                      <p className="text-[11px] text-gray-500">Select your preferred color palette</p>
                    </div>
                    <button onClick={() => setShowThemePicker(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700"><X size={18} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.entries(THEMES) as [ThemeName, typeof THEMES[ThemeName]][]).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => { setTheme(key); setShowThemePicker(false); }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all active:scale-95 text-left ${
                          currentTheme === key ? 'border-blue-600 bg-blue-50/70 shadow-sm font-semibold' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        title={theme.label}
                      >
                        <div className="w-6 h-6 rounded-lg shadow-sm border border-black/10 flex-shrink-0" style={{ background: theme.preview }} />
                        <span className="text-xs text-gray-800 truncate">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 relative"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-white text-[10px] text-white font-bold flex items-center justify-center px-1 shadow-lg">{unread > 99 ? '99+' : unread}</span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed sm:absolute inset-x-0 sm:inset-x-auto bottom-0 sm:bottom-auto sm:right-0 sm:mt-2 w-full sm:w-80 bg-white rounded-t-xl sm:rounded-lg shadow-lg border border-gray-100 py-2 z-50 animate-slideUp sm:animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <div className="flex gap-2 sm:gap-3 items-center">
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                      <button onClick={clearAllNotifications} className="text-xs text-red-600 hover:underline">Clear all</button>
                      <button onClick={() => setNotifOpen(false)} className="sm:hidden p-1 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {companyNotifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                    ) : (
                      companyNotifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 group relative ${!n.read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                n.type === 'info' ? 'bg-blue-500' : 
                                n.type === 'success' ? 'bg-green-500' : 
                                n.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <p className={`text-sm ${!n.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{n.created}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-200/50 opacity-60 group-hover:opacity-100 transition-opacity"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
              >
                <Avatar src={currentUser?.image} name={currentUser?.name || 'User'} className="w-8 h-8" textSize="text-xs" />
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                  </div>
                  <button 
                    onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <User size={16} /> Profile
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6" style={{ backgroundColor: 'var(--content-bg, #f9fafb)', backgroundImage: 'var(--bg-image, none)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat' }}>
          <ErrorBoundary viewName="Page View">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Theme picker mobile overlay */}
      {showThemePicker && isMobile && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowThemePicker(false)} />
      )}
      {/* Notification mobile overlay */}
      {notifOpen && isMobile && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setNotifOpen(false)} />
      )}

      {/* Break Alert Popup */}
      {breakAlert?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={dismissBreakAlert}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-bounce-once" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">⏰ Break Time Alert!</h3>
              <p className="text-base text-gray-600 mb-6">{breakAlert.message}</p>
              <p className="text-sm text-red-500 font-semibold mb-4">Please return to work immediately.</p>
              <button 
                onClick={dismissBreakAlert}
                className="btn-primary px-8 py-3 text-base"
              >
                ✕ Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Callback Reminder Popup */}
      {callbackReminders.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4" onClick={dismissAllCallbacks}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-[scaleIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/20 rounded-full"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full"></div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Phone size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold">📞 Callback Reminder</h3>
                <p className="text-white/80 text-sm mt-1">{callbackReminders.length} client{callbackReminders.length > 1 ? 's' : ''} to call back{callbackReminders[0]?.callbackTime ? ` (scheduled ${callbackReminders[0].callbackTime})` : ' today'}</p>
              </div>
            </div>
            
            {/* Callback List */}
            <div className="p-5 max-h-[50vh] overflow-y-auto space-y-4">
              {callbackReminders.map((booking: any) => {
                // Parse remarks to get the latest remark
                let latestRemark = booking.callbackRemark || '';
                if (!latestRemark && booking.remarks) {
                  try {
                    const remarks = JSON.parse(booking.remarks);
                    if (Array.isArray(remarks) && remarks.length > 0) {
                      latestRemark = remarks[remarks.length - 1].text;
                    }
                  } catch {
                    latestRemark = booking.remarks;
                  }
                }
                
                return (
                  <div key={booking.id} className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-gray-900">{booking.firstName} {booking.lastName}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">{booking.queryId}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">📧</span>
                            <span className="text-gray-600 truncate">{booking.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">📱</span>
                            <span className="text-gray-600">{booking.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">✈️</span>
                            <span className="text-gray-600">{booking.origin} → {booking.destination}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">📅</span>
                            <span className="text-gray-600">{booking.departureDate || 'N/A'}</span>
                          </div>
                          {booking.callbackTime && (
                            <div className="flex items-center gap-1.5 col-span-2">
                              <span className="text-gray-400">⏰</span>
                              <span className="text-indigo-600 font-semibold">Scheduled at {booking.callbackTime}</span>
                            </div>
                          )}
                        </div>
                        {latestRemark && (
                          <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-xs font-semibold text-yellow-700 mb-0.5">💬 What to discuss:</p>
                            <p className="text-sm text-yellow-900">{latestRemark}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => dismissCallback(booking.id)}
                        className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => dismissCallback(booking.id)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                      >
                        Snooze
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
              <button
                onClick={dismissAllCallbacks}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Dismiss All Reminders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Are you sure you want to quit?</h3>
              <p className="text-sm text-gray-500 mb-6">You will be logged out of the CRM system.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)} 
                  className="flex-1 btn-secondary py-2.5"
                >
                  No
                </button>
                <button 
                  onClick={confirmLogout} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
