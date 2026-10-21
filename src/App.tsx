import { MotionConfig } from 'framer-motion';
import { Route, Routes } from 'react-router-dom';
import { AppBackground } from './components/AppBackground';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RoomCreatePage } from './pages/RoomCreatePage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { RoomsPage } from './pages/RoomsPage';
import { SchedulePage } from './pages/SchedulePage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ToastProvider>
          <AppBackground />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="rooms" element={<RoomsPage />} />
                <Route path="rooms/new" element={<RoomCreatePage />} />
                <Route path="rooms/:id" element={<RoomDetailPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
