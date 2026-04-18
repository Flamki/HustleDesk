import React, { Suspense, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { ToastProvider } from './components/ui/Toast';
import { StartupEnvGuard } from './components/system/StartupEnvGuard';
import { validateEnvironment } from './utils/envValidation';
import { RouteLoader } from './components/system/RouteLoader';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { CheckEmailPage } from './pages/CheckEmailPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { Home } from './pages/public/Home';
import { Features } from './pages/public/Features';
import { Pricing } from './pages/public/Pricing';
import { FreelancerCrm } from './pages/public/FreelancerCrm';
import { ProposalGenerator } from './pages/public/ProposalGenerator';
import { TimeTracking } from './pages/public/TimeTracking';
import { ClientPortal } from './pages/public/ClientPortal';
import { PortfolioBuilderPublic } from './pages/public/PortfolioBuilderPublic';
import { LinkInBioPublic } from './pages/public/LinkInBioPublic';

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
const PublicSitePage = React.lazy(async () => {
  const m = await import('./pages/PublicSitePage');
  return { default: m.PublicSitePage };
});
const UnsubscribePage = React.lazy(async () => {
  const m = await import('./pages/UnsubscribePage');
  return { default: m.UnsubscribePage };
});

const env = validateEnvironment();
if (env.warnings.length > 0) {
  console.warn('Environment warnings:', env.warnings);
}

const RootLayout: React.FC = () => {
  const shouldRedirectLegacyHost =
    typeof window !== 'undefined' &&
    String(window.location.hostname || '').toLowerCase() === 'hustle-desk-flamkis-projects.vercel.app';

  useEffect(() => {
    if (!shouldRedirectLegacyHost) return;

    const target = `https://getsolodesk.com${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, [shouldRedirectLegacyHost]);

  if (shouldRedirectLegacyHost) {
    return <RouteLoader label="Redirecting..." />;
  }

  if (!env.ok) {
    return <StartupEnvGuard errors={env.errors} warnings={env.warnings} />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProfileProvider>
            <Suspense fallback={<RouteLoader label="Loading..." />}>
              <Outlet />
            </Suspense>
            <Analytics />
          </ProfileProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'features', element: <Features /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'freelancer-crm', element: <FreelancerCrm /> },
      { path: 'proposal-generator', element: <ProposalGenerator /> },
      { path: 'time-tracking', element: <TimeTracking /> },
      { path: 'client-portal', element: <ClientPortal /> },
      { path: 'portfolio-builder', element: <PortfolioBuilderPublic /> },
      { path: 'link-in-bio', element: <LinkInBioPublic /> },

      { path: 'signup', element: <SignupPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'auth/check-email', element: <CheckEmailPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: 'unsubscribe', element: <UnsubscribePage /> },
      { path: 'share/time/:token', element: <SharedTimeReportPage /> },
      { path: 'share/time-entry/:token', element: <SharedTimeEntryPage /> },
      { path: 'w/:slug', element: <PublicSitePage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: 'app', element: <Navigate to="/app/dashboard" replace /> },
          { path: 'app/dashboard', element: <DashboardPage /> },
          { path: 'app/jobs', element: <JobsPage /> },
          { path: 'app/jobs/new', element: <AddJobPage /> },
          { path: 'app/time', element: <TimeTrackerPage /> },
          { path: 'app/proposals/generate/:jobId', element: <ProposalGeneratorPage /> },
          { path: 'app/profile', element: <ProfilePage /> },
          { path: 'app/analytics', element: <AnalyticsPage /> },
          { path: 'app/clients', element: <ClientsPage /> },
          { path: 'app/templates', element: <TemplatesPage /> },
          { path: 'app/marketing', element: <EmailMarketingPage /> },
          { path: 'app/marketing/website', element: <MarketingWebsitePage /> },
          { path: 'app/marketing/website/portfolio', element: <Navigate to="/app/marketing" replace /> },
          { path: 'app/marketing/website/link-in-bio', element: <Navigate to="/app/marketing" replace /> },
          { path: 'app/updates', element: <UpdatesPage /> },
          { path: 'app/settings', element: <SettingsPage /> },
          { path: 'app/help', element: <HelpPage /> },
        ],
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

export default routes;
