# Calling the Platform API: what trips people up

The platform surface is broadly self-describing — unknown parameters are refused with the
accepted list, so a wrong guess costs one round trip rather than a silent wrong answer. What
follows is the set of things that are **not** guessable, each measured against the live platform
rather than read off a design doc.

---

## 1. The same concept has three parameter names

There is one idea — "which knowledge base" — and three spellings of it, depending on which command
you are calling. This is the single most common round-trip tax on the surface, and three separate
seats hit it independently in one day.

| Command family | Names the KB as | Notes |
|---|---|---|
| `app_records_put` / `_get` / `_query` / `_delete` | `kb_id` | The records surface calls it a *record collection*; it behaves like a table name. |
| `query_knowledge_base` | `kb_id`, or `kb_ids` for several | Retrieval — raw chunks. |
| `ask_question_to_app` | `knowledgebase_name`, or `knowledgebase_names` | Answering — synthesized and cited. **`kb_id` is rejected here**, not ignored. |

The rejection is deliberate and helpful: it names the parameter you should have used. It is still
a round trip, so check the table first.

```
ask_question_to_app: unknown parameter 'kb_id' (did you mean 'knowledgebase_name'?).
Accepted parameters: app_id, knowledgebase_name, knowledgebase_names, user_input, ...
Rejected at the execute_remote_command gateway boundary — the parameter was NOT
applied, and no default was substituted.
```

Note what that error gives you: the correction (`did you mean`), the full accepted set, and an
explicit statement that **nothing was written and no default was substituted**. You can act on it
without guessing what half-happened.

**Unknown parameters are refused everywhere, with the accepted set in the error.** That is the
surface's most useful property: you can probe it. It also means a parameter you read about
somewhere but that the schema does not declare will fail loudly rather than be silently dropped —
so trust the error, not the prose.

---

## 2. Sending images and video

`ask_question_to_app` takes a `media` array — images and video for the model to **look at** on
this turn. Each entry supplies **exactly one** of `data` (raw base64, no `data:` URL prefix) or
`asset_ref` (an object in *this app's* own GCS asset space). Declaring both is refused: which one
did you mean?

```jsonc
{
  "app_id": "my-app",
  "user_input": "What colour sequence does this show?",
  "media": [
    { "mime_type": "video/mp4", "asset_ref": "probe.mp4", "label": "probe clip" }
  ]
}
```

**Accepted today:** images (`png`, `jpeg`, `webp`, `heic`, `heif`, `gif`, `bmp`, `tiff`) and video
(`mp4`, `mpeg`, `mpg`, `mov`, `avi`, `x-flv`, `webm`, `wmv`, `3gpp`).

**Audio and PDF are refused on purpose, not by oversight.** The provider accepts them with a
structurally identical shape, but they have not been live-measured on this surface, and the
platform does not ship capabilities it has not observed working. The refusal names them
explicitly so you can tell a scope boundary from a typo.

**The server is the single validation authority.** The client stages a contribution; every rule
above — accepted MIME types, size limits, `data` XOR `asset_ref`, asset resolution — is enforced
server-side. None of it lives in the browser bundle, and that is deliberate rather than a gap: the
package that owns the contract depends on `googleapis` and must never be pulled into a browser
build. If you go looking in the shipped client for `mime_type` or `asset_ref` you will not find
them, and finding nothing there is the correct result, not evidence of a missing check.

**Limits:** 8 attachments per turn, 8 MiB each, 16 MiB per turn. Oversized media is **rejected,
not truncated** — you will know. Media tokens bill as input tokens.

**Do not resend media on follow-up turns.** It persists in the conversation thread: continue with
`previous_interaction_id` and the model still has it. Resending costs you the tokens twice.

**`asset_ref` resolves server-side, and that is the whole point.** A `gs://` URI is a DeSciX-side
reference, never a provider one — the provider rejects GCS URIs outright, so the platform reads
the bytes for you. Upload with `descix app media-upload` (or `get_asset_upload_token`). If the
object is not there you get an error that names the exact path it looked at:

```
[chatMedia] could not read media asset "probe.mp4" for app "my-app":
Asset not found at gs://descix-assets-public/dev/my-app/assets/probe.mp4.
Upload it first with `descix app media-upload`.
```

## 3. Writes merge per FIELD, so send only the keys you own

`app_records_put` in its default `upsert` mode is a **field-level merge**, not a record
replacement. A put carrying `{file_id, status}` changes `status` and leaves every other field on
that record intact.

This matters most for the common case of transitioning someone else's record — marking a message
read, setting a disposition, updating a lease:

```jsonc
// Correct: touches one field, preserves the sender's text, timestamps, and everything else
{ "file_id": "msg-...", "status": "read" }

// Unnecessary, and destructive if you reconstruct the record imperfectly:
// re-putting the WHOLE record just to change one field
```

**Send only the keys you own.** Defensively re-putting a whole record is how a reader overwrites
an author's content with its own reconstruction of it.

**A record's `status` tells you what the last writer wrote, not what anyone has read.** If you
send a record with `status: "unread"`, that value is *your own default* — it is evidence of
nothing about delivery or attention. The positive signal is the flip to `read`, which only the
recipient performs. If you need to know a message landed, look for that flip, or for the
recipient's own subsequent record referring to it. Absence of a flip is not absence of a reader,
and presence of `unread` is not proof anyone was told.

`mode: "create"` is different by design — an atomic first-claim-wins conditional create that
refuses rather than overwriting, for electing a single holder of a named resource (a lease, a
seat, an idempotency key).

---

## 4. Scoping a search to one document

`query_knowledge_base` takes `file_filter` to restrict a search to a single source.

**It takes the retrievable file id, not the human-readable file name.** The id is opaque and
looks like `corpus:ce66a173…`. You do not have to construct it: every result row carries it as
`file_path`, and every citation returns a ready-made `read_command` containing the correct
`file_filter`. **Copy the id the citation gave you** — never type the filename.

```jsonc
{ "app_id": "unk-beast", "kb_id": "DevX-Evangelist",
  "query": "intake and triage", "file_filter": "corpus:ce66a173…" }
```

Passing the display `file_name` instead returns empty or 404s, and the platform warns about
exactly this mistake in its own retrieval notes. If a scoped search comes back empty, check that
first before concluding the document is missing.

## 5. Retrieval is vocabulary-sensitive, and fails quietly

Covered in depth in [local-dev.md](./local-dev.md) under KB sync, because it is as much a curation
concern as a calling one. The short version for callers: phrase queries in the source's own
vocabulary, pull `limit >= 3`, and **check `fileName`** — a confident, well-scored answer is not
evidence that the right document was retrieved.

---

## How the claims on this page were verified

Every statement here was executed against the live platform. Two techniques did most of the work
and are worth stealing:

**Send a deliberately wrong value and read which layer complains.** When you cannot test a
parameter properly — no fixture, no real asset — you can still find out whether it exists. Passing
a nonsense `asset_ref` returned `MEDIA_ASSET_UNREADABLE` naming the exact path it looked at: the
parameter was *accepted* and the handler *ran*. An undeclared parameter fails completely
differently, with `unknown parameter` and the accepted set. The two errors come from different
layers, and which layer answers is the measurement.

**Check the artifact that actually executes, not the one you changed.** A fix can be merged and
still unreachable; today one sat on the main branch for roughly five hours before a deploy carried
it. Code present in a shipped bundle proves it shipped, not that it works. So the order that holds
is: merged → deployed → shipped → working, and each arrow is a real gap somebody has to cross.

## Scope of this page

Every claim above was executed against the live platform, not inferred from source or design
documents — including the two newest sections, whose behaviour was merged for hours before it was
actually reachable. Behaviour that is implemented but **not yet reachable on the deployed
surface** stays out of this page: documenting a call the platform currently refuses would hand you
an instruction that errors, which is the defect this page exists to avoid.

One consequence worth knowing as a reader: **a merge is not a deploy.** If something here does
not work for you, it is worth checking whether your environment has taken the deploy that carries
it, before concluding the doc is wrong.
