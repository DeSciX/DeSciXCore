/**
 * ApiContent - Content analytics
 */

import { makeCommandRequestJSON } from '../AppData.jsx';

export async function logContentEvent(params) {
  try {
    const data = await makeCommandRequestJSON('log_content_event', {
      ...params,
      client_ts: Date.now(),
      referrer: params.referrer || document.referrer,
      path: params.path || window.location.pathname,
    }, true);
    return data;
  } catch (error) {
    console.error('Error logging content event:', error);
    return { success: false, error: error.message };
  }
}
