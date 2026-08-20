/**
 * useDeSciXView — the shell's side of the app-facing view API.
 *
 * Publishes `window.DeSciX.view` (idempotently) and re-renders the shell when an
 * app asks for a different view. The app is loaded AFTER the layout is drawn, so
 * a one-shot read at mount would always miss a runtime request — hence a
 * subscription rather than a value.
 *
 * @returns {string} the view mode the shell should render right now
 */
import { useEffect, useState } from 'react';
import { getView, subscribeView, publishViewApi } from '../util/appView.js';

export function useDeSciXView() {
  const [view, setLocalView] = useState(() => {
    publishViewApi();
    return getView();
  });

  useEffect(() => {
    // Publish again on mount: the state initialiser runs once per component, but
    // this hook may be the first thing to mount in a fresh tree.
    publishViewApi();
    return subscribeView(setLocalView);
  }, []);

  return view;
}
