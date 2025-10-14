// Google Analytics 4 (GA4) Utility Functions
// Track user behavior and feature usage

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

// Initialize GA4
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Generic event tracking
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// User authentication events
export const trackSignUp = (method: string) => {
  event({
    action: 'sign_up',
    category: 'auth',
    label: method, // 'google', 'email'
  });
};

export const trackLogin = (method: string) => {
  event({
    action: 'login',
    category: 'auth',
    label: method,
  });
};

export const trackLogout = () => {
  event({
    action: 'logout',
    category: 'auth',
  });
};

// Idea events
export const trackIdeaCreated = (symbol: string, ideaType: string) => {
  event({
    action: 'idea_created',
    category: 'ideas',
    label: `${symbol}_${ideaType}`,
  });
};

export const trackIdeaViewed = (ideaId: string, symbol: string) => {
  event({
    action: 'idea_viewed',
    category: 'ideas',
    label: `${ideaId}_${symbol}`,
  });
};

export const trackIdeaLiked = (ideaId: string) => {
  event({
    action: 'idea_liked',
    category: 'engagement',
    label: ideaId,
  });
};

export const trackIdeaFollowed = (ideaId: string) => {
  event({
    action: 'idea_followed',
    category: 'engagement',
    label: ideaId,
  });
};

// Portfolio events
export const trackPositionAdded = (symbol: string, source: string) => {
  event({
    action: 'position_added',
    category: 'portfolio',
    label: `${symbol}_${source}`, // 'manual', 'csv', 'idea'
  });
};

export const trackPositionExited = (symbol: string, profitLoss: number) => {
  event({
    action: 'position_exited',
    category: 'portfolio',
    label: symbol,
    value: profitLoss,
  });
};

export const trackCSVImport = (rowCount: number, broker: string) => {
  event({
    action: 'csv_imported',
    category: 'portfolio',
    label: broker, // 'zerodha', 'icici', 'standard'
    value: rowCount,
  });
};

// Screener events
export const trackScreenerViewed = (screenerType: string) => {
  event({
    action: 'screener_viewed',
    category: 'screener',
    label: screenerType, // '50ma', '200ma', 'supertrend', 'volume'
  });
};

export const trackScreenerConvertedToIdea = (symbol: string, screenerType: string) => {
  event({
    action: 'screener_converted',
    category: 'screener',
    label: `${symbol}_${screenerType}`,
  });
};

// Analysis events
export const trackAnalysisViewed = (symbol: string, analysisType: string) => {
  event({
    action: 'analysis_viewed',
    category: 'analysis',
    label: `${symbol}_${analysisType}`, // 'technical', 'fundamental', 'investor'
  });
};

export const trackInvestorAnalysisOpened = (symbol: string) => {
  event({
    action: 'investor_analysis_opened',
    category: 'analysis',
    label: symbol,
  });
};

// Account events
export const trackAccountCreated = (accountName: string) => {
  event({
    action: 'account_created',
    category: 'accounts',
    label: accountName,
  });
};

export const trackAccountSwitched = (accountName: string) => {
  event({
    action: 'account_switched',
    category: 'accounts',
    label: accountName,
  });
};

// Alert/Notification events
export const trackAlertConfigured = (alertType: string, enabled: boolean) => {
  event({
    action: 'alert_configured',
    category: 'alerts',
    label: `${alertType}_${enabled ? 'enabled' : 'disabled'}`,
  });
};

export const trackNotificationClicked = (notificationType: string) => {
  event({
    action: 'notification_clicked',
    category: 'engagement',
    label: notificationType, // 'entry', 'target', 'stoploss'
  });
};

// Feature usage tracking
export const trackFeatureUsed = (featureName: string, details?: string) => {
  event({
    action: 'feature_used',
    category: 'features',
    label: details ? `${featureName}_${details}` : featureName,
  });
};

// Search events
export const trackSearch = (query: string, results: number) => {
  event({
    action: 'search',
    category: 'search',
    label: query,
    value: results,
  });
};

// Theme events
export const trackThemeChanged = (theme: string) => {
  event({
    action: 'theme_changed',
    category: 'settings',
    label: theme, // 'light', 'dark', 'system'
  });
};

// Error tracking
export const trackError = (errorMessage: string, errorLocation: string) => {
  event({
    action: 'error_occurred',
    category: 'errors',
    label: `${errorLocation}: ${errorMessage}`,
  });
};

// Time tracking
export const trackTimeSpent = (pageName: string, seconds: number) => {
  event({
    action: 'time_spent',
    category: 'engagement',
    label: pageName,
    value: seconds,
  });
};

// Export events
export const trackDataExported = (exportType: string) => {
  event({
    action: 'data_exported',
    category: 'data',
    label: exportType, // 'csv', 'pdf'
  });
};
