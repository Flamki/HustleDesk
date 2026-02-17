# Error Tracking Integration Guide

Guide for integrating error tracking services (Sentry, Rollbar, Datadog, etc.) with HustleDesk.

## Overview

HustleDesk has built-in error tracking hooks that make it easy to integrate with popular error tracking services. The integration points are designed to be:

- **Service-agnostic**: Works with any error tracking service
- **Zero-overhead**: No performance impact when disabled
- **Privacy-focused**: No PII logged by default
- **Easy to configure**: Single initialization point

## Integration Architecture

```
┌─────────────────────────────────────────────┐
│         Application Code                     │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│    Error Tracking Layer (errorTracking.ts)  │
│  - captureException()                        │
│  - captureMessage()                          │
│  - setUser()                                 │
│  - addBreadcrumb()                          │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│    Your Error Tracking Service              │
│    (Sentry / Rollbar / Datadog / etc.)     │
└─────────────────────────────────────────────┘
```

## Quick Start

### 1. Choose Your Service

Popular options:
- **Sentry** (Recommended) - Full-featured, great UI
- **Rollbar** - Simple setup, good for small teams
- **Datadog** - Enterprise monitoring suite
- **Bugsnag** - Mobile-friendly
- **TrackJS** - JavaScript-focused

### 2. Install SDK

```bash
# Sentry
npm install @sentry/react

# Rollbar
npm install rollbar

# Datadog
npm install @datadog/browser-rum

# Bugsnag
npm install @bugsnag/js @bugsnag/plugin-react
```

### 3. Configure Environment Variable

```env
# .env.local
VITE_ERROR_TRACKING_DSN=https://your-dsn@service.com/project
VITE_APP_VERSION=1.0.0
```

## Integration Examples

### Sentry Integration (Recommended)

**Install**:
```bash
npm install @sentry/react
```

**Configure in `src/index.tsx` or `App.tsx`**:
```typescript
import * as Sentry from '@sentry/react';
import { errorTracker } from './utils/errorTracking';

// Initialize Sentry
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_ERROR_TRACKING_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0, // All errors
    beforeSend(event, hint) {
      // Filter out noisy errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }
      return event;
    },
  });
}

// Connect error tracker to Sentry
errorTracker.init({
  enabled: import.meta.env.PROD,
  onError: (error, metadata) => {
    Sentry.captureException(error, {
      level: metadata.severity === 'fatal' ? 'fatal' : 'error',
      user: metadata.userId ? { id: metadata.userId } : undefined,
      tags: metadata.tags,
      extra: metadata.extra,
      fingerprint: metadata.fingerprint,
    });
  },
  beforeSend: (error, metadata) => {
    // Filter errors before sending
    return true; // or false to skip
  },
});
```

**Wrap App with Error Boundary**:
```typescript
import { ErrorBoundary } from '@sentry/react';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {/* Your app */}
    </ErrorBoundary>
  );
}
```

### Rollbar Integration

**Install**:
```bash
npm install rollbar
```

**Configure**:
```typescript
import Rollbar from 'rollbar';
import { errorTracker } from './utils/errorTracking';

const rollbar = new Rollbar({
  accessToken: import.meta.env.VITE_ROLLBAR_TOKEN,
  environment: import.meta.env.MODE,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: import.meta.env.VITE_APP_VERSION,
      },
    },
  },
});

errorTracker.init({
  enabled: import.meta.env.PROD,
  onError: (error, metadata) => {
    rollbar.error(error, {
      userId: metadata.userId,
      tags: metadata.tags,
      ...metadata.extra,
    });
  },
});
```

### Datadog RUM Integration

**Install**:
```bash
npm install @datadog/browser-rum
```

**Configure**:
```typescript
import { datadogRum } from '@datadog/browser-rum';
import { errorTracker } from './utils/errorTracking';

datadogRum.init({
  applicationId: import.meta.env.VITE_DATADOG_APP_ID,
  clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'hustledesk',
  env: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
});

errorTracker.init({
  enabled: import.meta.env.PROD,
  onError: (error, metadata) => {
    datadogRum.addError(error, {
      userId: metadata.userId,
      ...metadata.tags,
      ...metadata.extra,
    });
  },
});
```

## Backend Integration

### Server-Side Error Tracking

**Configure in `server/api/_shared/errorHandling.js`**:

```javascript
// For Sentry
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// Update trackError function
export const trackError = (error, metadata = {}) => {
  serverLogger.error('Error tracked', metadata, error);
  
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: metadata,
      tags: {
        component: metadata.component || 'api',
        endpoint: metadata.url,
      },
    });
  }
};
```

## Best Practices

### 1. Error Filtering

Don't send every error - filter noise:

```typescript
errorTracker.init({
  beforeSend: (error, metadata) => {
    // Skip known browser extensions
    if (error.message.includes('chrome-extension://')) {
      return false;
    }
    
    // Skip ResizeObserver errors
    if (error.message.includes('ResizeObserver')) {
      return false;
    }
    
    // Skip network errors from cancelled requests
    if (error.name === 'AbortError') {
      return false;
    }
    
    return true;
  },
});
```

### 2. User Context

Set user context after authentication:

```typescript
// In AuthContext after successful login
import { errorTracker } from '../utils/errorTracking';

useEffect(() => {
  if (user) {
    errorTracker.setUser(user.id, {
      email: user.email,
      plan: user.subscription?.plan,
    });
  } else {
    errorTracker.reset();
  }
}, [user]);
```

### 3. Breadcrumbs

Add breadcrumbs for context:

```typescript
import { errorTracker } from '../utils/errorTracking';

// Before important operations
errorTracker.addBreadcrumb('Job created', 'user_action', {
  jobId: newJob.id,
  status: newJob.status,
});

errorTracker.addBreadcrumb('API call started', 'http', {
  url: '/api/jobs',
  method: 'POST',
});
```

### 4. Error Severity

Use appropriate severity levels:

```typescript
// Fatal - app can't continue
errorTracker.captureException(error, { severity: 'fatal' });

// Error - something broke but app continues
errorTracker.captureException(error, { severity: 'error' });

// Warning - potentially problematic
errorTracker.captureException(error, { severity: 'warning' });

// Info - just FYI
errorTracker.captureMessage('User completed onboarding', { severity: 'info' });
```

### 5. Release Tracking

Track releases for better error attribution:

```typescript
// Set version in error tracker
errorTracker.init({
  release: import.meta.env.VITE_APP_VERSION,
});

// Update version in package.json before each release
// Use semantic versioning: 1.2.3
```

## Privacy & Security

### 1. Redact Sensitive Data

```typescript
errorTracker.init({
  beforeSend: (error, metadata) => {
    // Remove sensitive data from metadata
    if (metadata.extra?.password) {
      delete metadata.extra.password;
    }
    if (metadata.extra?.creditCard) {
      delete metadata.extra.creditCard;
    }
    return true;
  },
});
```

### 2. Disable in Development

Error tracking should only run in production:

```typescript
errorTracker.init({
  enabled: import.meta.env.PROD, // Only in production
});
```

### 3. GDPR Compliance

Allow users to opt-out:

```typescript
// Check user preference before initializing
const userConsent = localStorage.getItem('analytics-consent');

errorTracker.init({
  enabled: import.meta.env.PROD && userConsent === 'true',
});
```

## Testing

### Test Error Tracking

```typescript
// Add a test error button (development only)
function TestErrorButton() {
  const triggerError = () => {
    throw new Error('Test error from button click');
  };
  
  return (
    <button onClick={triggerError}>
      Trigger Test Error
    </button>
  );
}
```

### Verify Integration

1. Trigger a test error
2. Check error tracking dashboard
3. Verify error appears with correct context
4. Verify user info is captured
5. Verify breadcrumbs are present

## Monitoring Checklist

- [ ] Error tracking service account created
- [ ] SDK installed and configured
- [ ] DSN/API key added to environment variables
- [ ] Error tracking initialized in app
- [ ] User context set after login
- [ ] Breadcrumbs added for key actions
- [ ] Error filtering configured
- [ ] Sensitive data redaction in place
- [ ] Release tracking configured
- [ ] Test error triggered and verified
- [ ] Team invited to error tracking dashboard
- [ ] Alert rules configured
- [ ] Integration tested in staging
- [ ] Documentation updated with service details

## Alert Configuration

### Recommended Alerts

1. **High Error Rate**: > 10 errors per minute
2. **New Error Type**: First occurrence of new error
3. **Critical Error**: Any error with "fatal" severity
4. **User Impact**: Error affecting > 100 users
5. **Regression**: Error rate increases > 200%

### Alert Channels

- Email for P2 issues
- Slack for P1 issues
- PagerDuty for P0 issues

## Troubleshooting

### Errors Not Appearing

1. Check DSN is correct
2. Verify production mode is enabled
3. Check network tab for outgoing requests
4. Verify no ad blockers are interfering
5. Check console for integration errors

### Too Many Errors

1. Add error filtering
2. Increase sample rate
3. Group similar errors
4. Silence known issues

### Missing Context

1. Add more breadcrumbs
2. Include relevant metadata
3. Set user context earlier
4. Add custom tags

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Rollbar Documentation](https://docs.rollbar.com/)
- [Datadog RUM Guide](https://docs.datadoghq.com/real_user_monitoring/)
- [Error Tracking Best Practices](https://blog.sentry.io/error-monitoring-best-practices/)

---

**Last Updated**: 2026-02-17
**Maintained By**: HustleDesk Team
