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
| `chat` | `CodeSiteWidget` | shell mount, wherever a CodeSite panel is rendered |
| `powch`, `config` | `useDeSciXBridge` | only once a Powch bridge exists **and** the shell reaches `READY`; `DESCX_BRIDGE_READY` fires at that moment |
| `bridge` | the bus itself | the moment any member above is published |

### Readiness — never poll

Every publication announces itself with a **`descix:bridge-ready`** event on the
shell window, and leaves a synchronously-readable marker. So an app that starts
early hears the event; an app that starts late reads the marker. Neither polls:

```js
const top = window.parent;
function whenBridgeReady(fn) {
  if (top.DeSciX?.bridge?.ready) return fn(top.DeSciX);
  top.addEventListener('descix:bridge-ready', () => fn(top.DeSciX), { once: true });
}
```

`bridge` carries `version` (a number, bumped when the bus shape changes),
`ready`, `members()` and `has(name)` — so "shell too old" is now distinguishable
from "not mounted yet" instead of both showing up as `undefined`.

**Ready is not the same as capable.** Readiness tells you the bus exists. Whether
a member can actually *do* anything is a separate, **live** question each member
answers for itself via `available()` — a chat pane can be closed long after the
bridge went ready. Ask at the moment of use, not at boot.

Do not confuse this with `DESCX_BRIDGE_READY`, which is Powch's signal and fires
only once a Powch bridge exists. In a shell with no Powch mounted that event never
fires, while `view` and `chat` have been working since mount. Gate on
`descix:bridge-ready`; gate on `DESCX_BRIDGE_READY` only for `powch`/`config`.

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
| `available()` | `() => boolean` | **Check this.** Is a host actually listening? |
| `MODES` | `{CODESITE, SPLITVIEW, CHAT}` | The string constants, so you never hand-type them. |
| `DEFAULT` | `string` | `SplitView`. |

**`set()` returning your mode does not mean the screen changed.** Some hosts render
the app frame without a view-aware container and subscribe to nothing; there,
`set()` validates, updates the value, notifies an empty subscriber list, and hands
back the mode you asked for while nothing moves. `available()` is the honest answer
— it reports whether anything is listening:

```js
const view = window.parent.DeSciX.view;
if (view.available()) view.set('CodeSite');
else console.warn('this host does not implement view switching');
```

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

### `DeSciX.chat` — show the model something

Your app can hand an **image or video** into the conversation, so the model can
*look at* what your app is displaying rather than read a description of it:

```js
const shot = myCanvas.toDataURL('image/png').split(',')[1];   // RAW base64, no data: prefix

const { delivered, reason } = await window.parent.DeSciX.chat.sendMedia(
  { mime_type: 'image/png', data: shot, label: 'flyby' },
  { note: 'What do you see at the centre of this frame?' }
);
```

| Member | Signature | Notes |
|---|---|---|
| `sendMedia(media, opts?)` | `=> Promise<{delivered, reason?, contribution?}>` | See below. |
| `available()` | `() => boolean` | Is the chat pane mounted **right now**? |

**`media`** — supply **exactly one** of:

- `data` — raw base64 bytes. **Not** a `data:` URL; strip the prefix and pass
  `mime_type` separately.
- `asset_ref` — a path in your app's own asset space (or a `gs://` URI), uploaded
  via `descix app media-upload`. The server resolves it to bytes for you.

plus `mime_type` (required), and optionally `label`, `truncated` (set it when *you*
shortened a capture, so the model is told it is seeing a prefix), and `track` (an
opaque provenance bag, ferried verbatim).

**`opts`** — `disposition` is `'stage'` by default: the attachment rides into the
next turn the user types, which is what an attachment usually wants. Use `'send'`
to submit it immediately as its own turn and have the model react without further
typing — that costs one metered turn per call. `note` is model-visible text sent
alongside the media.

**Errors split two ways, deliberately.** A malformed attachment **throws** — that
is a bug at your call site and you want it loudly. A closed chat pane **does not
throw**; it resolves `{ delivered: false, reason }` and logs, because a running app
should not be killed by something the user did to a panel. Check `delivered`.

**Limits are enforced by the server, not here**, so they are stated in exactly one
place and cannot drift: today, up to 8 attachments per turn, 8 MiB each, 16 MiB per
turn, images (`png/jpeg/webp/heic/heif/gif/bmp/tiff`) and video
(`mp4/mpeg/mpg/mov/avi/flv/webm/wmv/3gpp`). **Oversized media is rejected, never
truncated** — a prefix of an MP4 is a corrupt file, not a shorter one. Anything
inadmissible is refused by name.

**Media persists in the thread.** On a later turn the model still remembers what it
was shown, so do not resend the same frame. Media tokens are billed as input tokens.

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
