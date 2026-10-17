import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Roles from './pages/Roles';
import UsersPage from './pages/Users';
import QueryStatusPage from './pages/QueryStatus';
import Bookings from './pages/Bookings';
import SiteBookings from './pages/SiteBookings';
import Attendance from './pages/Attendance';
import Productivity from './pages/Productivity';
import BreakMonitor from './pages/BreakMonitor';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import LoginActivity from './pages/LoginActivity';
import IpWhitelist from './pages/IpWhitelist';
import AddBooking from './pages/AddBooking';
import Updates from './pages/Updates';
import ClientVerification from './pages/ClientVerification';
import Payslip from './pages/Payslip';
import PaymentAuthorizations from './pages/PaymentAuthorizations';
import PublicPayment from './pages/PublicPayment';
// WhatsApp removed from CRM

// Map permissions to route paths
export const PERMISSION_ROUTE_MAP: Record<string, string[]> = {
  'Role Management': ['/roles'],
  'User Management': ['/users'],
  'Query Status Management': ['/query-status'],
  'Booking Management': ['/bookings', '/bookings/add', '/bookings/edit'],
  'Site Bookings': ['/site-bookings'],
  'Payment Authorization': ['/payment-authorizations'],
  'Attendance': ['/attendance'],
  'Break Monitoring': ['/break-monitor'],
  'Reports': ['/reports'],
  'GPM Report': ['/reports'],
  'Login Activity': ['/login-activity'],
  'IP Whitelist': ['/ip-whitelist'],
  'Updates Management': ['/updates'],
  'Payslip': ['/payslip'],
};

export function hasPermissionForRoute(permissions: string[], path: string): boolean {
  if (path === '/dashboard' || path === '/profile') return true;
  
  // Specific fallback checks
  if (path === '/site-bookings' && (permissions.includes('Site Bookings') || permissions.includes('Booking Management'))) return true;
  if (path === '/break-monitor' && (permissions.includes('Break Monitoring') || permissions.includes('Attendance'))) return true;
  if (path === '/productivity' && (permissions.includes('Attendance') || permissions.includes('Reports') || permissions.includes('GPM Report'))) return true;
  if (path === '/updates' && (permissions.includes('Updates Management') || permissions.includes('Notice Board'))) return true;

  for (const [perm, routes] of Object.entries(PERMISSION_ROUTE_MAP)) {
    if (routes.some(r => path === r || path.startsWith(r + '/')) && permissions.includes(perm)) {
      return true;
    }
  }
  return false;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isChecking } = useAuthStore();
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PermissionRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const { currentUser } = useAuthStore();
  const roleLower = (currentUser?.role || '').toLowerCase();
  
  // ONLY Admin and Super Admin have unrestricted bypass access
  const isSuperOrAdmin = ['admin', 'super admin', 'superuser'].includes(roleLower);
  if (isSuperOrAdmin) {
    return <>{children}</>;
  }

  // HR can manage Roles and Users by default
  const isHr = ['hr', 'hr (human resource)'].includes(roleLower);
  if (isHr && (path === '/roles' || path === '/users')) {
    return <>{children}</>;
  }
  
  const permissions = currentUser?.permissions || [];
  if (!hasPermissionForRoute(permissions, path)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function App() {
  const { setChecking, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Custom auth uses persisted Zustand state - no EdgeSpark session needed
    setChecking(false);
    
    // Data privacy protection - removed copy restriction per user request
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary viewName="CRM Application">
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/payment" element={<PublicPayment />} />
        <Route path="/verify/:token" element={<ClientVerification />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="roles" element={<PermissionRoute path="/roles"><Roles /></PermissionRoute>} />
          <Route path="users" element={<PermissionRoute path="/users"><UsersPage /></PermissionRoute>} />
          <Route path="query-status" element={<PermissionRoute path="/query-status"><QueryStatusPage /></PermissionRoute>} />
          <Route path="bookings" element={<PermissionRoute path="/bookings"><Bookings /></PermissionRoute>} />
          <Route path="bookings/add" element={<PermissionRoute path="/bookings/add"><AddBooking /></PermissionRoute>} />
          <Route path="bookings/edit/:id" element={<PermissionRoute path="/bookings/edit"><AddBooking /></PermissionRoute>} />
          <Route path="site-bookings" element={<PermissionRoute path="/site-bookings"><SiteBookings /></PermissionRoute>} />
          <Route path="attendance" element={<PermissionRoute path="/attendance"><Attendance /></PermissionRoute>} />
          <Route path="productivity" element={<PermissionRoute path="/productivity"><Productivity /></PermissionRoute>} />
          <Route path="break-monitor" element={<PermissionRoute path="/break-monitor"><BreakMonitor /></PermissionRoute>} />
          <Route path="profile" element={<Profile />} />
          <Route path="reports" element={<PermissionRoute path="/reports"><Reports /></PermissionRoute>} />
          <Route path="login-activity" element={<PermissionRoute path="/login-activity"><LoginActivity /></PermissionRoute>} />
          <Route path="ip-whitelist" element={<PermissionRoute path="/ip-whitelist"><IpWhitelist /></PermissionRoute>} />
          <Route path="updates" element={<Updates />} />
          <Route path="payslip" element={<Payslip />} />
          <Route path="payment-authorizations" element={<PaymentAuthorizations />} />

        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
