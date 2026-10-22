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
  // UNMANAGED: no shell above this page at all. `ready()` resolves rather than
  // hanging, so you can take whatever path your app supports on its own.
}
```

**Read that `mode` carefully — the literal is misnamed and it is the one trap in this
API.** `mode: 'standalone'` here means **UNMANAGED**: there is no shell above you. It does
NOT mean "the shell opened on my app", which is the managed standalone view described
below and is a completely different situation. The name is a known collision, filed for
rename; until it changes, read this value as *"is there a shell at all?"* and nothing more.

**`DeSciX.mode` is real — and knowing WHICH `DeSciX` you are holding is the whole trick.**
Two different objects wear that name:

| You are holding | What it is | Has `mode`? |
|---|---|---|
| `DeSciX` in YOUR page (from `DeSciXAppSDK.js`) | the app-side SDK object | **yes** — a live getter: `'shell'` when a readable shell bus is above you, `'standalone'` when your page is the top window, `'embedded-no-bridge'` when your page is framed but no ancestor carries a readable bus |
| the shell's own `window.DeSciX` | the bus `appBridge` publishes (`view`, `chat`, `bridge`, `powch`, …) | no — the bus carries members, not a mode |

As an app author you hold the first one, so `DeSciX.mode` reads correctly and
`await DeSciX.ready()` resolves a `mode` field with the same meaning. Both are the SAME
misnamed literal described above: `'standalone'` there means UNMANAGED — no shell found —
never "the shell opened on my app".

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
`@descix/app-sdk/AppShell`, one shell document per origin, never nested: the shell at
`descix.net` and the shell at `<appId>.descix.net` are siblings, and neither frames the other.

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

⚠️ **Naming collision, live today — and you meet it in `ready()`.** The `mode` field that
`await DeSciX.ready()` resolves to (and the same field on the object `resolveBridge()`
returns, `{ window, bus, hops, mode }`) carries the literal `'standalone'` for the
**UNMANAGED** case: `bus: null`, `hops: -1`, no shell anywhere above. That is the unmanaged
condition wearing the managed condition's name. Branch on it for *"is there a shell at
all?"* — never for *"am I in standalone view?"*, which is a different question with a
different answer. Filed for rename; do not write `mode: 'unmanaged'` anywhere until it
ships.

### `DeSciX.view` — choose your layout

The shell starts in the view your site's `share.json` declares as `default_view`
(README, "default_view"), painted from the first frame, and in **SplitView** (your app
beside the chat panel) when it declares none. Change it at any time:

```js
DeSciX.view.set('CodeSite');   // your app gets the whole frame
DeSciX.view.set('SplitView');  // your app beside chat (default)
DeSciX.view.set('Chat');       // chat only
DeSciX.view.set('NoChrome');   // no shell chrome; your app fills the viewport
```

`NoChrome` is a shell view: the shell drops its top bar, padding and chat inside the
browser tab, which is the way to a chromeless phone view. Browser full screen is the separate
Fullscreen API; the CodeSite iframe delegates it (`allow="fullscreen"`), so your app may call
`element.requestFullscreen()` on top of any view where the browser supports it (iPhone Safari
does not).

| Member | Signature | Notes |
|---|---|---|
| `set(mode)` | `(string) => string` | Throws on an unknown mode, naming the valid ones. Case-sensitive. |
| `get()` | `() => string` | The mode in effect now. |
| `subscribe(fn)` | `(fn) => unsubscribe` | Called on every change. |
| `available()` | `() => boolean` | **Check this.** Is a host actually listening? |
| `MODES` | `{CODESITE, SPLITVIEW, CHAT, NOCHROME}` | The string constants, so you never hand-type them. |
| `DEFAULT` | `string` | `SplitView`: the start view when the site declares no `default_view`. |

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
doing. The shell re-renders. Your choice is reset to the shell's starting view when the
user switches to a different app, so it never leaks into someone else's.

**Say `DeSciX.view`, never a frame level.** The bus lives on the shell's window, not
yours — but which window that is depends on your embedding depth, so `DeSciXAppSDK.js`
resolves it for you at every access. Hard-coding `window.parent.DeSciX.view` breaks
the moment your app is nested one level deeper; hard-coding `window.top.DeSciX.view`
breaks the moment the shell is itself embedded in an outer page.

**Do not import the view functions from the package.** `@descix/app-sdk` exports
`setView`, `resetView`, `seedView`, `initialViewFor` and `publishViewApi`, but those are the **shell's** side of the
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
| `setContext(bag)`, `clearContext(revision?)`, `getContext()` | | Page context; use `DeSciX.setChatContext` (below). |

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

### `DeSciX.setChatContext` — tell the chat what the page has open

So a reader can ask the chat about the page in front of them (its sources, the passage they
selected) without leaving it, the page tells the chat pane what it has open:

```js
const { outcome, reason } = DeSciX.setChatContext({
  sourceUrl: location.href,
  data: {
    title: 'The EGPT paper',
    kbNames: ['Corpus', 'Sources'],
    docId: 'corpus:3e1d5aa3',
    sources: [{ title: 'Rota, Combinatorial Theory', url: 'https://example.org/rota' }],
  },
  script: "chat.button('Explain this page', () => chat.ask('Explain this page.'));",
});
```

| Field | Type | Limit | Required | What happens to it |
|---|---|---|---|---|
| `sourceUrl` | string | 2048 chars | yes | names the page to the model and in script errors |
| `data` | JSON object | 32000 chars as JSON | no | the keys below are read; the rest goes to the model as page data |
| `script` | string (JavaScript) | 64000 chars | no | run by the chat pane with `(chat, data)` |

The `data` keys the platform reads (`CHAT_CONTEXT_DATA`), each optional:

| Key | Type | Limit | Sent as |
|---|---|---|---|
| `title` | string | 200 chars | shown in the pane: `Reading: <title>` |
| `kbNames` | string[] | 8 names, 128 chars each | `knowledgebase_names`: the knowledge bases each turn searches; the first one's instructions shape the reply |
| `docId` | string | 256 chars | `doc_ids`: the document's whole text is added to each turn; a document that cannot be loaded refuses the turn |

**The script** runs in the chat pane's window: the shell, on the same origin as your page. It
receives `chat`, with exactly these members (`CHAT_SCRIPT_API`), and `data`:

| Member | What it does |
|---|---|
| `root` | the element the script draws into; emptied before each run |
| `button(label, onClick)` | appends a button to `root`; a throw or rejection in `onClick` is shown in the pane |
| `ask(text)` | submits a chat turn with `text`, as if the reader typed it (one metered turn) |
| `report(error)` | shows an error in the pane, naming `sourceUrl` |
| `sourceUrl`, `data` | the context it was set with |

It calls the platform through the shell's own `DeSciX` (`DeSciX.call(...)`), exactly as your page
does. Powch stays on its own origin: the script reaches it only through `DeSciX.powch`, whose wallet
acts prompt the user. The script runs each time a new context arrives and each time the pane
opens with one, so draw from scratch.

**Outcomes** (`CHAT_CONTEXT_OUTCOMES`): `attached` (stored; when the pane is closed, `reason` says
it shows when the pane opens), `cleared`, `unavailable` (no readable shell, no `chat` member, or a
shell older than `@descix/app-sdk` 0.7.0; `bridge` and `reason` say which), `refused` (the
shell's `chat.setContext` threw). A malformed argument throws `CHAT_CONTEXT_INVALID`, naming the
field and the rule it broke.

**Whose context it is.** The shell stamps the context with the app whose face is mounted and
reads it back only for that app. It drops it when the app or its site changes, when the CodeSite
unmounts, and when the page that set it unloads (`pagehide`; a newer context is left alone).
`DeSciX.clearChatContext()` drops it explicitly.

**Opening the pane.** `DeSciX.requestView('SplitView')` shows the chat beside your page. When
the view is already `SplitView` and the reader hid the pane with its toggle, that request
changes nothing.

On the bus the members are `DeSciX.chat.setContext(bag)`, `DeSciX.chat.clearContext(revision?)`
and `DeSciX.chat.getContext()`; `DeSciX.setChatContext` is the wrapper that resolves the shell and
reports an outcome.

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

**Where the frames are.** Deployed, the store at `https://descix.net/` frames your site
same-origin at `https://descix.net/prod/<yourAppId>/site/index.html`. Your app's own host,
`https://<yourAppId>.descix.net/`, is a sibling instance of the same shell bundle (it does not
frame the store, and the store does not frame it) and frames the same site bytes same-origin at
`https://<yourAppId>.descix.net/prod/<yourAppId>/site/index.html`. Locally, `descix serve` puts
the shell and your app on one origin, serving your site through the gateway at `/p/<yourAppId>`.
In every case Powch is a cross-origin iframe that the shell renders as its sidebar, one level
under the shell, and nothing inside your frame runs a second shell. Your app reaches the shell
through the `window.DeSciX` bus that `resolveBridge()` finds by walking up the parent windows
(`DeSciXAppSDK.js` `resolveBridge`; `PowchClient._findShellBridge`,
`src/powch/PowchClient.js:61-63`): direct JavaScript, never `postMessage`. The only
`postMessage` traffic is between the shell and Powch. One engine fact follows from Powch being
cross-origin: WebKit (Safari, and every browser on iOS and iPadOS) refuses to CREATE a passkey in
a document that is not same-origin with all its ancestors, so a new Powch account on iOS cannot
be created in the sidebar frame; signing in with an existing passkey works there. New account on
iOS is therefore a top-level Powch step: the Powch iframe's sandbox allows popups so it can open
Powch's own page (`src/powch/PowchClient.js`).

Same-origin is what makes the `DeSciX` bus and `contentWindow.DeSciX_Actions` legal at
all; across origins the browser refuses the reach and both directions of this contract die.

Same-origin is a **hard precondition**. `DeSciXAppSDK.js` catches the browser's refusal
rather than letting it take your app down, so the symptom is not a `SecurityError` in
your code but a shell that is simply *not found*:

```js
DeSciX.mode          // 'embedded-no-bridge' — framed, but no ancestor's bus is readable
DeSciX.view          // null, with a console.error naming the situation
```

`DeSciX.mode` is resolved on every read by `resolveBridge()` (`src/util/bridgeResolver.js`,
inlined in `DeSciXAppSDK.js`) and takes one of three values:

- `'shell'` — a readable `window.DeSciX` bus was found on this window or an ancestor.
- `'standalone'` — no bus was found and this page is the top window: there is no shell.
- `'embedded-no-bridge'` — no bus was found and this page is framed: the frame above is
  cross-origin (unreadable) or carries no shell. The resolver cannot tell those apart.

If you see `'embedded-no-bridge'` under `descix serve`, your app is being framed from a
different origin than the shell: you are loading it from its own dev-server port instead of
through the gateway at `/p/<yourAppId>`. Open the gateway URL, not the app port. If you see
`'standalone'`, you opened your site's URL directly in a tab, with no shell above it.

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

- Every URL your build emits is page-relative (`./images/logo.png`, never
  `/images/logo.png`; app-developer runbook §7.2). The same bundle is served at
  `/prod/<yourAppId>/site/` when deployed and at `/p/<yourAppId>/` under `descix serve`
  (`/p/` exists only on the local gateway), and the gateway does not rewrite paths, so a
  root-absolute URL 404s in both.
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
