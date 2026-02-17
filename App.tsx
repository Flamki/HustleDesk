
import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { CheckEmailPage } from './pages/CheckEmailPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { RouteLoader } from './components/system/RouteLoader';

// Route-level code splitting keeps initial load fast and makes refresh feel instant.
const DashboardPage = React.lazy(async () => {
  const m = await import('./pages/DashboardPage');
  return { default: m.DashboardPage };
});
const AddJobPage = React.lazy(async () => {
  const m = await import('./pages/AddJobPage');
  return { default: m.AddJobPage };
});
const JobsPage = React.lazy(async () => {
  const m = await import('./pages/JobsPage');
  return { default: m.JobsPage };
});
const TimeTrackerPage = React.lazy(async () => {
  const m = await import('./pages/TimeTrackerPage');
  return { default: m.TimeTrackerPage };
});
const ProposalGeneratorPage = React.lazy(async () => {
  const m = await import('./pages/ProposalGeneratorPage');
  return { default: m.ProposalGeneratorPage };
});
const ProfilePage = React.lazy(async () => {
  const m = await import('./pages/ProfilePage');
  return { default: m.ProfilePage };
});
const AnalyticsPage = React.lazy(async () => {
  const m = await import('./pages/AnalyticsPage');
  return { default: m.AnalyticsPage };
});
const ClientsPage = React.lazy(async () => {
  const m = await import('./pages/ClientsPage');
  return { default: m.ClientsPage };
});
const TemplatesPage = React.lazy(async () => {
  const m = await import('./pages/TemplatesPage');
  return { default: m.TemplatesPage };
});
const UpdatesPage = React.lazy(async () => {
  const m = await import('./pages/UpdatesPage');
  return { default: m.UpdatesPage };
});
const SettingsPage = React.lazy(async () => {
  const m = await import('./pages/SettingsPage');
  return { default: m.SettingsPage };
});
const HelpPage = React.lazy(async () => {
  const m = await import('./pages/HelpPage');
  return { default: m.HelpPage };
});
const SharedTimeReportPage = React.lazy(async () => {
  const m = await import('./pages/SharedTimeReportPage');
  return { default: m.SharedTimeReportPage };
});
const SharedTimeEntryPage = React.lazy(async () => {
  const m = await import('./pages/SharedTimeEntryPage');
  return { default: m.SharedTimeEntryPage };
});
const EmailMarketingPage = React.lazy(async () => {
  const m = await import('./pages/EmailMarketingPage');
  return { default: m.EmailMarketingPage };
});
const MarketingWebsitePage = React.lazy(async () => {
  const m = await import('./pages/MarketingWebsitePage');
  return { default: m.MarketingWebsitePage };
});
const WebsiteAnalyticsPage = React.lazy(async () => {
  const m = await import('./pages/WebsiteAnalyticsPage');
  return { default: m.WebsiteAnalyticsPage };
});
const PublicSitePage = React.lazy(async () => {
  const m = await import('./pages/PublicSitePage');
  return { default: m.PublicSitePage };
});
const UnsubscribePage = React.lazy(async () => {
  const m = await import('./pages/UnsubscribePage');
  return { default: m.UnsubscribePage };
});

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
            <Suspense fallback={<RouteLoader label="Loading…" />}>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/check-email" element={<CheckEmailPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/share/time/:token" element={<SharedTimeReportPage />} />
              <Route path="/share/time-entry/:token" element={<SharedTimeEntryPage />} />
              <Route path="/w/:slug" element={<PublicSitePage />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                  <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/app/dashboard" element={<DashboardPage />} />
                  <Route path="/app/jobs" element={<JobsPage />} />
                  <Route path="/app/jobs/new" element={<AddJobPage />} />
                  <Route path="/app/time" element={<TimeTrackerPage />} />
                  <Route path="/app/proposals/generate/:jobId" element={<ProposalGeneratorPage />} />
                  <Route path="/app/profile" element={<ProfilePage />} />
                  
                  {/* Analytics & Insights */}
                  <Route path="/app/analytics" element={<AnalyticsPage />} />
                  <Route path="/app/clients" element={<ClientsPage />} />
                  
                  {/* System */}
                  <Route path="/app/templates" element={<TemplatesPage />} />
                  <Route path="/app/marketing" element={<EmailMarketingPage />} />
                  <Route path="/app/marketing/website" element={<MarketingWebsitePage />} />
                  <Route path="/app/marketing/website/analytics" element={<WebsiteAnalyticsPage />} />
                  <Route path="/app/updates" element={<UpdatesPage />} />
                  <Route path="/app/settings" element={<SettingsPage />} />
                  <Route path="/app/help" element={<HelpPage />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
