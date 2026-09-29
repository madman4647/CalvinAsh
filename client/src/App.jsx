import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import StudentDashboard from './pages/student/StudentDashboard';
import CCAListPage from './pages/student/CCAListPage';
import ApplicationFormPage from './pages/student/ApplicationFormPage';
import MyApplicationsPage from './pages/student/MyApplicationsPage';
import ApplicationDetailPage from './pages/student/ApplicationDetailPage';
import RankingsPage from './pages/student/RankingsPage';
import CommonQuestionsPage from './pages/student/CommonQuestionsPage';
import AllocationResultPage from './pages/student/AllocationResultPage';
import RulesPage from './pages/student/RulesPage';
import HostelDashboard from './pages/student/HostelDashboard';
import HostelApplyPage from './pages/student/HostelApplyPage';

import CommitteeDashboard from './pages/committee/CommitteeDashboard';
import FormEditorPage from './pages/committee/FormEditorPage';
import ApplicantListPage from './pages/committee/ApplicantListPage';
import ApplicantDetailPage from './pages/committee/ApplicantDetailPage';

import CouncilDashboard from './pages/council/CouncilDashboard';
import CommitteeApplicationsPage from './pages/council/CommitteeApplicationsPage';
import AllApplicationsPage from './pages/council/AllApplicationsPage';
import StudentOverviewPage from './pages/council/StudentOverviewPage';
import AllocationPage from './pages/council/AllocationPage';
import ExportPage from './pages/council/ExportPage';
import AdminSettingsPage from './pages/council/AdminSettingsPage';
import CommonQuestionsEditorPage from './pages/council/CommonQuestionsEditorPage';
import BulkMailPage from './pages/council/BulkMailPage';

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: 'var(--ch-ink)', color: '#fff', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0 #1A1A1A', fontFamily: "'Nunito', sans-serif", fontWeight: 700 },
          success: { style: { background: '#166534', color: '#fff' } },
          error: { style: { background: '#991b1b', color: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/ccas" element={<CCAListPage />} />
          <Route path="/student/apply/:committeeId" element={<ApplicationFormPage />} />
          <Route path="/student/applications" element={<MyApplicationsPage />} />
          <Route path="/student/applications/:applicationId" element={<ApplicationDetailPage />} />
          <Route path="/student/rankings" element={<RankingsPage />} />
          <Route path="/student/common-questions" element={<CommonQuestionsPage />} />
          <Route path="/student/allocation" element={<AllocationResultPage />} />
          <Route path="/student/rules" element={<RulesPage />} />
          <Route path="/student/hostel" element={<HostelDashboard />} />
          <Route path="/student/hostel/apply" element={<HostelApplyPage />} />
        </Route>

        <Route element={<ProtectedRoute role="committee" />}>
          <Route path="/committee/dashboard" element={<CommitteeDashboard />} />
          <Route path="/committee/form" element={<FormEditorPage />} />
          <Route path="/committee/applications" element={<ApplicantListPage />} />
          <Route path="/committee/applications/:applicationId" element={<ApplicantDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute role="council" />}>
          <Route path="/council/dashboard" element={<CouncilDashboard />} />
          <Route path="/council/committees" element={<CouncilDashboard />} />
          <Route path="/council/committees/:committeeId" element={<CommitteeApplicationsPage />} />
          <Route path="/council/applications" element={<AllApplicationsPage />} />
          <Route path="/council/applications/student/:studentId" element={<StudentOverviewPage />} />
          <Route path="/council/allocate" element={<AllocationPage />} />
          <Route path="/council/export" element={<ExportPage />} />
          <Route path="/council/settings" element={<AdminSettingsPage />} />
          <Route path="/council/common-questions" element={<CommonQuestionsEditorPage />} />
          <Route path="/council/bulk-mail" element={<BulkMailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
