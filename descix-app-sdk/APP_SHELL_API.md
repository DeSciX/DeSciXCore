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

Read it off your **parent** window. It appears when the shell is ready; listen
for `DESCX_BRIDGE_READY` on the parent if you need to wait.

```js
window.parent.addEventListener('DESCX_BRIDGE_READY', () => {
  const { powch, config, view } = window.parent.DeSciX;
});
```

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
