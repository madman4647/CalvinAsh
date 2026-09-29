import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import RequireRole from './components/RequireRole.jsx';
import HomeRedirect from './pages/HomeRedirect.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import SetPasswordPage from './pages/SetPasswordPage.jsx';
import StudentHome from './pages/home/StudentHome.jsx';
import CcaHome from './pages/home/CcaHome.jsx';
import PanelistHome from './pages/home/PanelistHome.jsx';
import SenateHome from './pages/home/SenateHome.jsx';
import StudentImportPage from './pages/senate/StudentImportPage.jsx';
import CcaCreatePage from './pages/senate/CcaCreatePage.jsx';
import PanelistManagementPage from './pages/cca/PanelistManagementPage.jsx';

// Dynamically imported (and only ever rendered in dev, see below) so the
// gallery page is never fetched by a production build.
const ComponentGalleryPage = lazy(() => import('./pages/ComponentGalleryPage.jsx'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />

          <Route path="/student" element={<RequireRole role="student"><StudentHome /></RequireRole>} />

          <Route path="/cca" element={<RequireRole role="cca"><CcaHome /></RequireRole>} />
          <Route path="/cca/panelists" element={<RequireRole role="cca"><PanelistManagementPage /></RequireRole>} />

          <Route path="/panelist" element={<RequireRole role="panelist"><PanelistHome /></RequireRole>} />

          <Route path="/senate" element={<RequireRole role="senate"><SenateHome /></RequireRole>} />
          <Route path="/senate/students/import" element={<RequireRole role="senate"><StudentImportPage /></RequireRole>} />
          <Route path="/senate/ccas" element={<RequireRole role="senate"><CcaCreatePage /></RequireRole>} />

          {/* /gallery is development-only: dynamically imported and only ever
              rendered when import.meta.env.DEV is true, so it's never
              fetched by (and effectively unreachable in) a production build. */}
          {import.meta.env.DEV && (
            <Route
              path="/gallery"
              element={(
                <Suspense fallback={null}>
                  <ComponentGalleryPage />
                </Suspense>
              )}
            />
          )}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
