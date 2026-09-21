import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CustomerDashboard from './pages/CustomerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StationsPublic from './pages/StationsPublic';
import StationDetailPublic from './pages/StationDetailPublic';
import AdminStations from './pages/AdminStations';
import AdminDispensers from './pages/AdminDispensers';
import StaffInventory from './pages/StaffInventory';
import CustomerBooking from './pages/CustomerBooking';
import CustomerBookingsList from './pages/CustomerBookingsList';
import CustomerTransactions from './pages/CustomerTransactions';
import StaffBookings from './pages/StaffBookings';
import StaffMaintenance from './pages/StaffMaintenance';
import AdminAnalytics from './pages/AdminAnalytics';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import LivePumping from './pages/LivePumping';
import StationsMap from './pages/StationsMap';
import QRScanner from './pages/QRScanner';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/AdminLayout';
import AdminStaffCustomers from './pages/AdminStaffCustomers';
import AdminPricing from './pages/AdminPricing';
import AdminOperationsMap from './pages/AdminOperationsMap';
import AdminSupport from './pages/AdminSupport';
import StaffLayout from './components/StaffLayout';
import StaffShiftReport from './pages/StaffShiftReport';
import TripPlanner from './pages/TripPlanner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-slate-light)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-light)'
            }
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/stations" element={<StationsPublic />} />
          <Route path="/stations/map" element={<StationsMap />} />
          <Route path="/stations/:id" element={<StationDetailPublic />} />
          
          <Route path="/customer-dashboard" element={
            <ProtectedRoute roles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/customer/book" element={
            <ProtectedRoute roles={['customer']}>
              <CustomerBooking />
            </ProtectedRoute>
          } />

          <Route path="/customer/trip-planner" element={
            <ProtectedRoute roles={['customer', 'admin']}>
              <TripPlanner />
            </ProtectedRoute>
          } />

          <Route path="/customer/bookings" element={
            <ProtectedRoute roles={['customer']}>
              <CustomerBookingsList />
            </ProtectedRoute>
          } />

          <Route path="/customer/transactions" element={
            <ProtectedRoute roles={['customer']}>
              <CustomerTransactions />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute roles={['customer', 'staff', 'admin']}>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/checkout/:bookingId" element={
            <ProtectedRoute roles={['customer']}>
              <Checkout />
            </ProtectedRoute>
          } />

          <Route path="/live-pumping/:id" element={
            <ProtectedRoute roles={['customer']}>
              <LivePumping />
            </ProtectedRoute>
          } />

          <Route path="/scan" element={
            <ProtectedRoute roles={['customer']}>
              <QRScanner />
            </ProtectedRoute>
          } />
          
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />

          {/* Dedicated Staff Portal Routes */}
          <Route element={
            <ProtectedRoute roles={['staff', 'admin']}>
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/staff/bookings" element={<StaffBookings />} />
            <Route path="/staff/inventory" element={<StaffInventory />} />
            <Route path="/staff/maintenance" element={<StaffMaintenance />} />
            <Route path="/staff/shift-report" element={<StaffShiftReport />} />
          </Route>

          {/* Admin Portal Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin-dashboard" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/analytics" element={
              <ProtectedRoute roles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />

            <Route path="/admin/stations" element={
              <ProtectedRoute roles={['admin']}>
                <AdminStations />
              </ProtectedRoute>
            } />

            <Route path="/admin/stations/:id/dispensers" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDispensers />
              </ProtectedRoute>
            } />

            <Route path="/admin/inventory" element={
              <ProtectedRoute roles={['admin']}>
                <StaffInventory />
              </ProtectedRoute>
            } />

            <Route path="/admin/bookings" element={
              <ProtectedRoute roles={['admin']}>
                <StaffBookings />
              </ProtectedRoute>
            } />

            <Route path="/admin/maintenance" element={
              <ProtectedRoute roles={['admin']}>
                <StaffMaintenance />
              </ProtectedRoute>
            } />

            <Route path="/admin/staff-customers" element={
              <ProtectedRoute roles={['admin']}>
                <AdminStaffCustomers />
              </ProtectedRoute>
            } />

            <Route path="/admin/pricing" element={
              <ProtectedRoute roles={['admin']}>
                <AdminPricing />
              </ProtectedRoute>
            } />

            <Route path="/admin/operations-map" element={
              <ProtectedRoute roles={['admin']}>
                <AdminOperationsMap />
              </ProtectedRoute>
            } />

            <Route path="/admin/support" element={
              <ProtectedRoute roles={['admin']}>
                <AdminSupport />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
