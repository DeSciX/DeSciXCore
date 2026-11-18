/**
 * The shell's setAppEvent (AppContext; window.DeSciX.AppContext.setAppEvent; AppData's registered
 * dispatcher). The event is handled later, by the state machine's effect; a SESSION_EXPIRED ends the
 * session's send tickets NOW (util/sessionGeneration.js), so an answer sent before it and arriving
 * before the state machine resets the shell is not adopted.
 */
import { AppContextEvent } from './AppData.jsx';
import { endSession } from './sessionGeneration.js';

/**
 * @param {(update: (prev: object) => object) => void} setEventState - AppContext's appEvent state setter
 * @returns {(event: string|{type: string, payload?: unknown}, payload?: unknown) => void}
 */
export function createSetAppEvent(setEventState) {
  if (typeof setEventState !== 'function') throw new TypeError('createSetAppEvent: the appEvent state setter is required');
  return (newEvent, payloadArg) => {
    if (typeof newEvent === 'string') {
      // Two-argument syntax: setAppEvent('EVENT_NAME', payload)
      newEvent = { type: newEvent, payload: payloadArg };
    } else if (typeof newEvent !== 'object' || !newEvent?.type) {
      console.error('AppContext: ERROR setAppEvent called with invalid event:', JSON.stringify(newEvent));
      return;
    }
    if (newEvent.type === AppContextEvent.SESSION_EXPIRED) endSession();
    setEventState((prev) => ({
      type: newEvent.type,
      id: (prev?.id ?? 0) + 1,
      payload: newEvent.payload,
    }));
  };
}
