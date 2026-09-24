import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppHeader } from './components/AppHeader.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { PlannedPage } from './pages/PlannedPage.jsx';
import { TodayPage } from './pages/TodayPage.jsx';
import { WorkoutPage } from './pages/WorkoutPage.jsx';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen label="Preparing your workout" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/workout/:sessionId" element={<WorkoutPage />} />
          <Route
            path="/summary/:sessionId"
            element={<PlannedPage title="Workout Summary" description="A detailed result breakdown is planned for the next development increment." />}
          />
          <Route
            path="/history"
            element={<PlannedPage title="Workout History" description="Saved-session browsing is planned for the next development increment." />}
          />
          <Route
            path="/progress"
            element={<PlannedPage title="Progress" description="Training totals and accuracy trends are planned for the next development increment." />}
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
