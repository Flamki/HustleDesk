/**
 * Analytics tracking utility
 * Provides integration points for analytics services (Google Analytics, Mixpanel, Amplitude, etc.)
 */

import { logger } from './logger';

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp?: number;
};

export type AnalyticsConfig = {
  enabled: boolean;
  debug: boolean;
  providers?: {
    googleAnalytics?: { measurementId: string };
    mixpanel?: { token: string };
    amplitude?: { apiKey: string };
  };
};

class Analytics {
  private config: AnalyticsConfig;
  private userId: string | null = null;

  constructor() {
    this.config = {
      enabled: import.meta.env.PROD,
      debug: !import.meta.env.PROD,
    };
  }

  /**
   * Initialize analytics
   */
  init(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.debug) {
      logger.info('Analytics initialized', { config: this.config });
    }

    // Integration point: Initialize analytics providers
    // Example: if (config.providers?.googleAnalytics) { gtag('config', config.providers.googleAnalytics.measurementId); }
  }

  /**
   * Set user identity for analytics
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    this.userId = userId;

    if (!this.config.enabled) {
      if (this.config.debug) {
        logger.debug('Analytics: User identified', { userId, traits });
      }
      return;
    }

    // Integration point: Set user in analytics providers
    // Example: if (window.gtag) { gtag('set', 'user_id', userId); }
    // Example: if (window.mixpanel) { mixpanel.identify(userId); mixpanel.people.set(traits); }
    // Example: if (window.amplitude) { amplitude.getInstance().setUserId(userId); }

    if (this.config.debug) {
      logger.info('Analytics: User identified', { userId, traits });
    }
  }

  /**
   * Reset user identity (on logout)
   */
  reset(): void {
    this.userId = null;

    if (!this.config.enabled) {
      if (this.config.debug) {
        logger.debug('Analytics: User reset');
      }
      return;
    }

    // Integration point: Reset user in analytics providers
    // Example: if (window.mixpanel) { mixpanel.reset(); }
    // Example: if (window.amplitude) { amplitude.getInstance().setUserId(null); amplitude.getInstance().regenerateDeviceId(); }

    if (this.config.debug) {
      logger.info('Analytics: User reset');
    }
  }

  /**
   * Track an event
   */
  track(event: string | AnalyticsEvent, properties?: Record<string, unknown>): void {
    const eventData: AnalyticsEvent = typeof event === 'string' 
      ? { name: event, properties, userId: this.userId || undefined, timestamp: Date.now() }
      : { ...event, userId: event.userId || this.userId || undefined, timestamp: event.timestamp || Date.now() };

    if (!this.config.enabled) {
      if (this.config.debug) {
        logger.debug('Analytics: Event tracked', eventData);
      }
      return;
    }

    // Integration point: Send event to analytics providers
    // Example: if (window.gtag) { gtag('event', eventData.name, eventData.properties); }
    // Example: if (window.mixpanel) { mixpanel.track(eventData.name, eventData.properties); }
    // Example: if (window.amplitude) { amplitude.getInstance().logEvent(eventData.name, eventData.properties); }

    if (this.config.debug) {
      logger.info('Analytics: Event tracked', eventData);
    }
  }

  /**
   * Track page view
   */
  page(pageName?: string, properties?: Record<string, unknown>): void {
    const pageData = {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      ...properties,
    };

    if (!this.config.enabled) {
      if (this.config.debug) {
        logger.debug('Analytics: Page view', { pageName, ...pageData });
      }
      return;
    }

    // Integration point: Track page view in analytics providers
    // Example: if (window.gtag) { gtag('config', measurementId, { page_path: pageData.path, page_title: pageData.title }); }
    // Example: if (window.mixpanel) { mixpanel.track_pageview(); }
    // Example: if (window.amplitude) { amplitude.getInstance().logEvent('Page Viewed', pageData); }

    if (this.config.debug) {
      logger.info('Analytics: Page view', { pageName, ...pageData });
    }
  }

  /**
   * Pre-defined event tracking helpers
   * 
   * Note: Event names use snake_case convention (e.g., 'user_signup').
   * This matches Google Analytics 4 recommended event naming.
   * If your analytics provider prefers different naming (camelCase, Title Case),
   * you can customize the event names in the implementation of your onEvent handler.
   */
  
  // Authentication events
  trackSignup(method: string, properties?: Record<string, unknown>): void {
    this.track('user_signup', { method, ...properties });
  }

  trackLogin(method: string, properties?: Record<string, unknown>): void {
    this.track('user_login', { method, ...properties });
  }

  trackLogout(properties?: Record<string, unknown>): void {
    this.track('user_logout', properties);
  }

  // Job-related events
  trackJobCreated(jobId: string, properties?: Record<string, unknown>): void {
    this.track('job_created', { jobId, ...properties });
  }

  trackJobStatusChanged(jobId: string, status: string, properties?: Record<string, unknown>): void {
    this.track('job_status_changed', { jobId, status, ...properties });
  }

  // Time tracking events
  trackTimeEntryCreated(entryId: string, duration: number, properties?: Record<string, unknown>): void {
    this.track('time_entry_created', { entryId, duration, ...properties });
  }

  // Billing events
  trackSubscriptionStarted(plan: string, properties?: Record<string, unknown>): void {
    this.track('subscription_started', { plan, ...properties });
  }

  trackSubscriptionCancelled(plan: string, properties?: Record<string, unknown>): void {
    this.track('subscription_cancelled', { plan, ...properties });
  }

  // Marketing events
  trackCampaignSent(campaignId: string, recipients: number, properties?: Record<string, unknown>): void {
    this.track('campaign_sent', { campaignId, recipients, ...properties });
  }

  trackSiteCreated(siteType: string, properties?: Record<string, unknown>): void {
    this.track('site_created', { siteType, ...properties });
  }

  // Feature usage events
  trackFeatureUsed(feature: string, properties?: Record<string, unknown>): void {
    this.track('feature_used', { feature, ...properties });
  }

  // Error tracking in analytics
  trackError(error: Error, properties?: Record<string, unknown>): void {
    this.track('error_occurred', { 
      errorMessage: error.message,
      errorName: error.name,
      ...properties,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export class for testing
export { Analytics };
