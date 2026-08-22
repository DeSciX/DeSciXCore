# The App Shell API

What the DeSciX App Shell publishes to the app it hosts, and what it expects back.

Your app runs in an iframe inside the shell. The two are **same-origin on
purpose**, so the contract between them is plain JavaScript — no postMessage
bridge, no build step. Include `DeSciXAppSDK.js` (the scaffold ships it) and you get:

```js
DeSciX                        // the shell's service bus
window.DeSciX_Actions         // what YOU publish for the shell to call
```

Everything below is reachable from a plain `<script>` tag.

**You never write `window.parent.` or `window.top.`** The shell publishes its bus on
its own window, so the correct frame level depends on how deeply your app happens to
be embedded — one level down in the ordinary case, more when nested, and *neither* when
the shell is itself embedded in an outer page. Your code cannot know that and should
not have to. `DeSciXAppSDK.js` detects it on every access; you just say `DeSciX.…`.

---

## `DeSciX` — what the shell gives you

The bus is assembled in **two independent steps**, which matters if your app loads
early:

| Member | Published by | When |
|---|---|---|
| `view` | `publishViewApi()` — called by `useDeSciXBridge` (shell-wide) and again by `useDeSciXView` | at shell mount — **does not wait on Powch**, so a wallet-less app still gets to pick its layout |
| `chat` | `publishChatApi()`, called by `CodeSiteWidget` | its mount, **ungated by `enableChat`** — so `chat` is on the bus even on a face that will never render a chat pane |
| `powch`, `config` | `useDeSciXBridge`, by direct assignment | once a Powch bridge exists **and** the shell reaches `READY`; `DESCX_BRIDGE_READY` fires at that moment |
| `AppData`, `Api`, `call`, `AppContext`, `loginWithSessionToken`, `registerSessionExpiryCallback` | the SDK's `AppContext.jsx`, by direct assignment at `READY` | with the shell's session |
| `bridge` | the bus itself | the moment any member above is published |

`useDeSciXBridge` and `AppContext` are not mounted by the host site directly — they arrive
with `AppShell`, which every shell renders (`App.jsx` → `AppShell` → `AppProvider` →
`useDeSciXBridge`). Searching a shell's own source for those names finds nothing and proves
nothing; the mount is one level inside the component it imports.

Note that only `view` and `chat` go through `publishBridgeMember`. The others are assigned
onto `window.DeSciX` directly, and `AppContext.jsx` **replaces** the bus object with a
spread-merged literal when the shell reaches `READY`. Two consequences for an app: those
members do not fire `descix:bridge-ready`, and a reference to the bus captured before
`READY` is not the object the shell ends up using. Read `DeSciX` at the point of use.

### Readiness — never poll

Every publication announces itself with a **`descix:bridge-ready`** event on the
shell window, and leaves a synchronously-readable marker. So an app that starts
early hears the event; an app that starts late reads the marker. Neither polls:

```js
const { mode, members, version } = await DeSciX.ready();
if (mode === 'standalone') {
  // No shell above this page. `ready()` resolves rather than hanging, so you can
  // take whatever path your app supports on its own.
}
```

`DeSciX.ready()` is the whole of it: it resolves immediately when the bus is already
published, and otherwise waits for the shell's announcement on the window that owns
it. You never attach the listener yourself, and never name the window it fires on.

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

Members can also go **away**. When the host backing one unmounts it is deleted from
the bus, so `members()` and `has()` shrink as well as grow, and a handle you cached
in a variable outlives the thing that served it. Read members off the bus at the
point of use rather than hoisting them at boot.

### Which face is hosting you — what is actually on the bus

Which members exist depends on which face of the shell is hosting you, and presence and
capability are **separate questions** that do not move together.

Measured on the running shells, anonymous (no sign-in), 2026-08-21T17:58Z:

| Face | `Object.keys(DeSciX)` | `view` | `chat` |
|---|---|---|---|
| App subdomain, standalone (`egpt-godsworld.dev.descix.net`) | `Api, AppContext, AppData, bridge, call, chat, config, loginWithSessionToken, powch, registerSessionExpiryCallback, view` (11) | present | present (`typeof 'object'`) |
| Apex store (`dev.descix.net`) | the same **minus `chat`** (10) | present | **absent** |

`view` is present on **both**, including the standalone face, because `useDeSciXBridge`
publishes it shell-wide — not `AppWidget`. `chat` is the member that varies: it is published
by `CodeSiteWidget`, so it exists only where a CodeSite panel has mounted.

**Presence is still not capability.** `view.available()` reports whether any host has
SUBSCRIBED, and subscription comes from `useDeSciXView`, which only `AppWidget` mounts — so a
face showing `view` on the bus can still have nothing listening, and `set()` will return your
mode while the screen does not move. Treat `available()` as the only answer, and read it at
the moment of use.

And measured, on the same two faces and also anonymous: **`view.available()` is `false` on
BOTH** — published, with zero subscribers, on the app subdomain and on the apex store alike.
So the anonymous default for every public face today is *`view` is on the bus and nothing is
listening*. An app that skips the check because the member is obviously there gets exactly the
silent no-op this section warns about.

It does become true: view switching has been observed working after sign-in (chat icon →
SplitView), which is what `AppWidget` mounting looks like from outside. That observation is
human, not instrumented — the post-sign-in state sits behind a passkey — so treat "capability
arrives with an authenticated session that has opened an app" as the shape, and
`available()` at the moment of use as the answer.

**The two members are not equally honest about it, and this is the difference that
should shape your code:**

- `chat.sendMedia()` tells you **afterwards** — it resolves `{ delivered: false, reason }`
  and logs. You can check the result.
- `view.set()` **cannot** tell you afterwards — it returns the mode you asked for
  whether or not anything is listening, so a post-hoc check is impossible by
  construction.

So: for chat you *may* check the return; for view you **must** check `available()`
**before** you rely on the layout changing.

### Standalone is an INITIAL VIEW, not a reduced mode

There is ONE App Shell. The platform site and a developer's app mount the same
`@descix/app-sdk/AppShell`, and a developer's shell can be embedded inside the platform's
— they are the same object, nested.

**Standalone selects what the shell opens ON.** In standalone the initial view is your
app's CodeSite instead of the store. That is all "no chrome" ever meant: *no store chrome
in the initial view*. It does not mean chrome is gone for good, and it does not remove
platform capability — every platform view, Powch included, stays reachable by navigation.
One pre-built bundle boots as the store on `descix.net` and as your app under
`descix serve`, because the served binding is read before the shell mounts.

This is why capability appears to "arrive": at the standalone initial view nothing
view-aware has subscribed yet, so `view.available()` reads `false`; open an app and the
subscribing container mounts. Same shell, later view.

**Standalone means MANAGED — a shell is present and the app is actively declaring
itself.** The opposite case is an app with NO shell above it at all: that is **UNMANAGED**,
not standalone.

**What "no other views showing" means for the nav bar — both facts, stated plainly.**
The intent, in the CEO's words: *"no chrome in the initial view. which is a reference to
the initial view not being the platform store mode."* The as-built: `TopNavBar` renders
unconditionally (`App.jsx:118`), and it hides the STORE nav items in standalone via
`showsStoreChrome()` (`TopNavBar.jsx:46`, one owner in `util/standaloneShell.js`). So the
initial view is your app rather than the store, with a nav bar present and its store items
suppressed. Both of those are true today; neither is a reading of the other.

⚠️ **Naming collision, live today:** `bridgeResolver.js` returns the literal
`mode: 'standalone'` for the UNMANAGED case (no bus on any ancestor, `bus: null`,
`hops: -1`). That literal is the unmanaged condition wearing the managed condition's name.
Branch on it for "is there a shell at all?" — never read it as "am I in standalone view?",
which is a different question with a different answer.

### `DeSciX.view` — choose your layout

The shell defaults to **SplitView** (your app beside the chat panel). Say so if
you want something else:

```js
DeSciX.view.set('CodeSite');   // your app gets the whole frame
DeSciX.view.set('SplitView');  // your app beside chat (default)
DeSciX.view.set('Chat');       // chat only
```

| Member | Signature | Notes |
|---|---|---|
| `set(mode)` | `(string) => string` | Throws on an unknown mode, naming the valid ones. Case-sensitive. |
| `get()` | `() => string` | The mode in effect now. |
| `subscribe(fn)` | `(fn) => unsubscribe` | Called on every change. |
| `available()` | `() => boolean` | **Check this.** Is a host actually listening? |
| `MODES` | `{CODESITE, SPLITVIEW, CHAT}` | The string constants, so you never hand-type them. |
| `DEFAULT` | `string` | `SplitView`. |

**`set()` returning your mode does not mean the screen changed.** Wherever the
publishing host is mounted but nothing has subscribed, `set()` validates, updates the
value, notifies an empty subscriber list, and hands back the mode you asked for while
nothing moves (see the bus table above). `available()` is the honest answer; it
reports whether anything is listening:

```js
const view = DeSciX.view;
if (view.available()) view.set('CodeSite');
else console.warn('this host does not implement view switching');
```

Call it whenever you like — at boot, or later when your app changes what it is
doing. The shell re-renders. Your choice is reset when the user switches to a
different app, so it never leaks into someone else's.

**Say `DeSciX.view`, never a frame level.** The bus lives on the shell's window, not
yours — but which window that is depends on your embedding depth, so `DeSciXAppSDK.js`
resolves it for you at every access. Hard-coding `window.parent.DeSciX.view` breaks
the moment your app is nested one level deeper; hard-coding `window.top.DeSciX.view`
breaks the moment the shell is itself embedded in an outer page.

**Do not import the view functions from the package.** `@descix/app-sdk` exports
`setView`, `resetView` and `publishViewApi`, but those are the **shell's** side of the
API. Imported into your app they mutate your own module copy of the state — same name,
same arguments, same return value, and **no effect on the shell whatsoever**. The working
path is `DeSciX.view`; the import is a silent no-op.

**Who implements it:** the App Shell — the store on `descix.net` and the same bundle
under `descix serve`. A page that is not hosted by the shell resolves as
`DeSciX.mode === 'standalone'`, where `DeSciX.view` is `null` and says so by name — so
check `DeSciX.mode` (or `await DeSciX.ready()`) if your app is also meant to run
outside the frame.

**One app at a time.** The view is a single shell-level value, not per-iframe. One
embedded app is the design; two contending for the layout will silently overwrite each
other, and the shell resets to `SplitView` on app switch.

### `DeSciX.chat` — show the model something

Your app can hand an **image or video** into the conversation, so the model can
*look at* what your app is displaying rather than read a description of it:

```js
const shot = myCanvas.toDataURL('image/png').split(',')[1];   // RAW base64, no data: prefix

const { delivered, reason } = await DeSciX.chat.sendMedia(
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
await DeSciX.powch.login();
const address = DeSciX.powch.getAddress();
const sig     = await DeSciX.powch.signMessage('hello', address);
```

`login` · `logout` · `sign` · `signTransaction` · `signMessage` ·
`signTypedData` · `send` · `receive` · `open` · `isAuthenticated()` ·
`getAddress()`

### `DeSciX.config` — where you are

```js
const { env, shellOrigin, powchOrigin } = DeSciX.config;
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
what makes the `DeSciX` bus and `contentWindow.DeSciX_Actions` legal at all;
across origins the browser refuses the reach and both directions of this contract
die.

Same-origin is a **hard precondition**. `DeSciXAppSDK.js` catches the browser's refusal
rather than letting it take your app down, so the symptom is not a `SecurityError` in
your code but a shell that is simply *not found*:

```js
DeSciX.mode          // 'standalone' — even though you ARE inside the shell's iframe
DeSciX.view          // null, with a console.error naming the situation
```

If you see `'standalone'` where you expected `'shell'`, you are loading your app from
its own dev-server port instead of through the gateway at `/p/<yourAppId>`. Open the
gateway URL, not the app port.

(You may still see the browser's own message in the console, which names nothing about
views or the shell. The verbatim text to grep for:
`SecurityError: Blocked a frame with origin "https://localhost:5174" from accessing a cross-origin frame.`)

**The full shell bus is exposed to your app on purpose.** A sandboxed iframe reaching
into its host looks like something to harden — it is not. Platform API calls are
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
