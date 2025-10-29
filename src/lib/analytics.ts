// Google Analytics 4 integration

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const initGA = (measurementId: string) => {
  if (typeof window === 'undefined' || !measurementId) return;

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
};

export const trackPageView = (path: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
  });
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Custom event tracking
export const trackArticleView = (articleId: string, title: string) => {
  trackEvent('article_view', 'engagement', title, 1);
};

export const trackArticleShare = (articleId: string, title: string, platform: string) => {
  trackEvent('article_share', 'social', `${title} - ${platform}`, 1);
};

export const trackCommentPosted = (articleId: string) => {
  trackEvent('comment_posted', 'engagement', articleId, 1);
};

export const trackSubscriptionStarted = (planName: string) => {
  trackEvent('subscription_started', 'conversion', planName, 1);
};

export const trackSearch = (query: string) => {
  trackEvent('search_performed', 'engagement', query, 1);
};
