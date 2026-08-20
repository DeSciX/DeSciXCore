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

## 2. Input is text-only

`ask_question_to_app` takes no image, media, or file-upload parameter. The full parameter set is
`app_id`, `user_input`, the KB name(s), `doc_ids`, `file_id`, `ipdoc_file_id`,
`intelligence_level`, `model`, `max_output_tokens`, `temperature`, `thinking_budget`,
`previous_interaction_id`, `streaming`.

This is worth stating because the natural assumption — "there is a multimodal model underneath, so
I can send it a screenshot" — is wrong, and nothing on the surface says so. An app whose agent
needs to *see* something (a rendered canvas, a chart, a screenshot) cannot get that through this
API today. Design around it rather than discovering it late.

---

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

`mode: "create"` is different by design — an atomic first-claim-wins conditional create that
refuses rather than overwriting, for electing a single holder of a named resource (a lease, a
seat, an idempotency key).

---

## 4. Retrieval is vocabulary-sensitive, and fails quietly

Covered in depth in [local-dev.md](./local-dev.md) under KB sync, because it is as much a curation
concern as a calling one. The short version for callers: phrase queries in the source's own
vocabulary, pull `limit >= 3`, and **check `fileName`** — a confident, well-scored answer is not
evidence that the right document was retrieved.

---

## Scope of this page

Every claim above was executed against the live platform, not inferred from source or design
documents. Behaviour that is implemented but **not yet reachable on the deployed surface** is
deliberately absent: documenting a call the platform currently refuses would hand you an
instruction that errors, which is the defect this page exists to avoid.
