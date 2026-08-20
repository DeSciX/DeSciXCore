# The App Shell API

What the DeSciX App Shell publishes to the app it hosts, and what it expects back.

Your app runs in an iframe inside the shell. The two are **same-origin on
purpose**, so the contract between them is plain JavaScript on `window` — no
postMessage bridge, no SDK import, no build step. From inside your app:

```js
window.parent.DeSciX          // the shell's service bus
window.DeSciX_Actions         // what YOU publish for the shell to call
```

Everything below is reachable from a plain `<script>` tag.

---

## `window.DeSciX` — what the shell gives you

Read it off your **parent** window. The bus is assembled in **two independent
steps**, which matters if your app loads early:

| Member | Published by | When |
|---|---|---|
| `view` | `useDeSciXView` | shell mount — **does not wait on Powch**, so a wallet-less app still gets to pick its layout |
| `powch`, `config` | `useDeSciXBridge` | only once a Powch bridge exists **and** the shell reaches `READY`; `DESCX_BRIDGE_READY` fires at that moment |

`DESCX_BRIDGE_READY` republishes `view` (the call is idempotent), so waiting for
the event gives you a complete bus:

```js
window.parent.addEventListener('DESCX_BRIDGE_READY', () => {
  const { powch, config, view } = window.parent.DeSciX;
});
```

**But do not gate `view` on that event.** In a shell with no Powch bridge mounted
the event never fires, while `view` has been working since mount. If all you need
is the layout, feature-detect instead of waiting:

```js
const view = window.parent.DeSciX?.view;   // undefined = shell too old, or not yet mounted
```

`undefined` is ambiguous by construction — it cannot tell you "shell too old" from
"not mounted yet". There is no version marker on the bus. If you must catch a very
early mount, poll briefly rather than waiting on an event that may never come.

### `DeSciX.view` — choose your layout

The shell defaults to **SplitView** (your app beside the chat panel). Say so if
you want something else:

```js
window.parent.DeSciX.view.set('CodeSite');   // your app gets the whole frame
window.parent.DeSciX.view.set('SplitView');  // your app beside chat (default)
window.parent.DeSciX.view.set('Chat');       // chat only
```

| Member | Signature | Notes |
|---|---|---|
| `set(mode)` | `(string) => string` | Throws on an unknown mode, naming the valid ones. Case-sensitive. |
| `get()` | `() => string` | The mode in effect now. |
| `subscribe(fn)` | `(fn) => unsubscribe` | Called on every change. |
| `MODES` | `{CODESITE, SPLITVIEW, CHAT}` | The string constants, so you never hand-type them. |
| `DEFAULT` | `string` | `SplitView`. |

Call it whenever you like — at boot, or later when your app changes what it is
doing. The shell re-renders. Your choice is reset when the user switches to a
different app, so it never leaks into someone else's.

**Reach through `window.parent`, not `window`.** Inside your iframe there is no
`window.DeSciX.view` — the bus lives on the shell's window. `window.DeSciX.view.set(...)`
from an embedded app throws `TypeError: Cannot read properties of undefined`.

**Do not import the view functions from the package.** `@descix/app-sdk` exports
`setView`, `resetView` and `publishViewApi`, but those are the **shell's** side of the
API. Imported into your app they mutate your own module copy of the state — same name,
same arguments, same return value, and **no effect on the shell whatsoever**. The working
path is `window.parent.DeSciX.view`; the import is a silent no-op.

**Who implements it:** the App Shell — the store on `descix.net` and the same bundle
under `descix serve`. A page that is not hosted by the shell has no `window.parent.DeSciX`
at all, so guard with `?.` if your app is also meant to run standalone outside the frame.

**One app at a time.** The view is a single shell-level value, not per-iframe. One
embedded app is the design; two contending for the layout will silently overwrite each
other, and the shell resets to `SplitView` on app switch.

### `DeSciX.powch` — identity and wallet

The shell relays these to Powch, which lives on a **different origin** and holds
passkeys and the wallet. Your app never talks to Powch directly and cannot read
its DOM — that isolation is the point.

```js
await window.parent.DeSciX.powch.login();
const address = window.parent.DeSciX.powch.getAddress();
const sig     = await window.parent.DeSciX.powch.signMessage('hello', address);
```

`login` · `logout` · `sign` · `signTransaction` · `signMessage` ·
`signTypedData` · `send` · `receive` · `open` · `isAuthenticated()` ·
`getAddress()`

### `DeSciX.config` — where you are

```js
const { env, shellOrigin, powchOrigin } = window.parent.DeSciX.config;
```

---

## `window.DeSciX_Actions` — what you give the shell

Publish functions on **your own** window and the shell's chat can call them. This
is how an AI-emitted action block reaches into your app:

```js
window.DeSciX_Actions = {
  highlightNode(id) { ... },
  runSimulation({ steps }) { ... },
};
```

The shell calls `iframe.contentWindow.DeSciX_Actions[name](args)` directly. It
also falls back to a bare `window[name]`, but a named object is clearer and keeps
your globals tidy.

---

## Calling the platform API

One relative POST, from whatever origin you are on:

```js
const res = await fetch('/apifront/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'app_records_query', params: { /* ... */ } }),
});
```

The credential is a **body field**, not a cookie and not a header, so there is no
`SameSite` problem, no credentialed CORS preflight, and nothing to configure. The
mesh authenticates the token and resolves your `community_id` from the app
registry; the browser origin is irrelevant to it.

---

## Why same-origin matters to you

`descix serve` puts the shell and your app on **one origin** — your app is served
through the gateway at `/p/<yourAppId>`, not on its own dev-server port. That is
what makes `window.parent.DeSciX` and `contentWindow.DeSciX_Actions` legal at
all; across origins the browser throws a `SecurityError` and both directions of
this contract die silently.

Same-origin is a **hard precondition**, and violating it fails opaquely — the error
names nothing about views or the shell. The verbatim text to grep for:

```
SecurityError: Blocked a frame with origin "https://localhost:5174" from accessing a cross-origin frame.
```

If you see that, you are loading your app from its own dev-server port instead of
through the gateway at `/p/<yourAppId>`. Open the gateway URL, not the app port.

**The full parent bus is exposed to your app on purpose.** A sandboxed iframe reaching
into its parent looks like something to harden — it is not. Platform API calls are
authorised server-side, and Powch is kept on a separate origin precisely so that
identity and wallet are *not* in what your app can reach. Exposing the rest of the App
Shell to app code is deliberate and load-bearing (CEO, 2026-08-20); "fixing" it severs
the API this document describes.

Two consequences for your app:

- Configure your framework's base path to `/p/<yourAppId>`. The gateway does not
  rewrite paths, so assets requested at `/` will 404.
- Powch is the deliberate exception and stays cross-origin. Use `DeSciX.powch`;
  do not try to reach Powch's frame yourself.

---

## Running it

```bash
cd my-app
descix serve            # your app, standalone, at https://localhost:<port>
descix serve --app <id> # from anywhere else
```

The shell asks its own origin what it is bound to
(`/__descix/app-binding.json`), so the same shell bundle boots as the store on
descix.net and as your app locally, with no rebuild and no config to hand-edit.
