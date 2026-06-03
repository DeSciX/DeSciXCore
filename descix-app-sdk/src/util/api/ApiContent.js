/**
 * ApiContent - Content analytics
 *
 * Client-side content events (page views, app/IPDoc opens, etc.) are emitted to
 * the GTM dataLayer, which forwards them to GA4. This is the canonical V2 analytics
 * path for browser-originated events (DeSciX/CLAUDE.md "Analytics & Event Tracking";
 * ga4EventService.js documents that client-side events go through the GTM dataLayer
 * while the server module handles backend-originated events). The deprecated
 * sharded-counter `log_content_event` server command was removed (WS-V1-PURGE Phase 2,
 * audit #14).
 *
 * Architectural rule: `app_id` is the sole product identifier. `community_id` is
 * NEVER an event parameter — it is derivable from Products/{app_id} and belongs in
 * BigQuery dimension joins, not event rows. Any community_id passed in is dropped here.
 */

export async function logContentEvent(params) {
  try {
    if (typeof window === 'undefined') return { success: false, error: 'no window' };

    // Drop community_id (forbidden in GA4 event params — app_id is the sole product id).
    const { community_id, event_type, ...rest } = params || {};

    // GA4 custom event names are snake_case (max 40 chars). The legacy event_type
    // (e.g. 'PAGE_VIEW', 'IPDOC_OPEN') becomes the GA4 event name, lowercased.
    const eventName = (event_type || 'content_event').toString().toLowerCase().slice(0, 40);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...rest,
      client_ts: Date.now(),
      referrer: rest.referrer || document.referrer,
      path: rest.path || window.location.pathname,
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging content event:', error);
    return { success: false, error: error.message };
  }
}
