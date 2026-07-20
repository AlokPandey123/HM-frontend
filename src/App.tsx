import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Patients } from './pages/Patients';
import { OPD } from './pages/OPD';
import { TestBooking } from './pages/TestBooking';
import { MedicineView } from './pages/MedicineView';
import { Billing } from './pages/Billing';
import { Returns } from './pages/Returns';
import { RegularCheckup } from './pages/RegularCheckup';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated() ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="patients" element={<Patients />} />
          <Route path="opd" element={<OPD />} />
          <Route path="tests" element={<TestBooking />} />
          <Route path="medicine" element={<MedicineView />} />
          <Route path="billing" element={<Billing />} />
          <Route path="returns" element={<Returns />} />
          <Route path="regular-checkup" element={<RegularCheckup />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
