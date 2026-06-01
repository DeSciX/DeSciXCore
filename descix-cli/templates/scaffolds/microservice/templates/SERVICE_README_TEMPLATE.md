# {Service Name} Service

## Overview

{One paragraph description of what this service does and when to use it.
Include the key use cases, benefits, and target users.
This section is critical for tell_me_how discovery - be descriptive about WHEN to use this service.}

## Onboarding — Canonical Mesh Microservice Setup

Run this sequence ONCE to stand up a microservice that can call the mesh
(Core Tools like `query_knowledge_base`, or other services' tools) over the
`/apifront` broker:

```bash
descix app create   -c {community} -a {app}     # create the app (or hydrate an existing one)
descix app init      -a {community}-{app}        # scaffold site/ kb/ microservice/
descix app set-port  -a {community}-{app} -p {port}   # assign the microservice's loopback port in workspace.json
descix microservice register                     # register the service manifest with the Core gateway
descix microservice register-delegate            # provision the SERVICE_KEY that signs mesh calls  <-- REQUIRED for loopback auth
```

> **Loopback calls failing with HTTP 401?** Your service has no provisioned
> delegate key. The pre-stored `OWNER_SIGNATURE` fallback is NOT a valid mesh
> credential. Run **`descix microservice register-delegate`** — it generates an
> EC key pair, registers the public key with Core, and writes `SERVICE_KEY` into
> `dev-overrides.json`. The scaffold `mcpClient` automatically signs every mesh
> call with that key (`utils.SERVICE_KEY` → `Signer`). This is THE canonical
> mesh-authentication step. If unsure: `descix tell-me-how "my service gets 401 on a loopback call"`.

## Prerequisites

- {Any setup requirements}
- {Required permissions or app purchases}
- {Environment configuration}

## Available Commands

### {command_name}

**Description:** {Detailed description of what this command does}

**Use when:** {Specific scenarios when this command should be used. This helps tell_me_how match user questions to the right tool.}

**Prerequisites:**
- {What must be true before calling this command}
- {Required prior steps or configurations}

**Parameters:**
- `param1` (required, string): {Description of this parameter}
- `param2` (optional, number): {Description with default value if any}
- `param3` (optional, object): {Description of nested structure}

**Example Request:**
```json
{
  "command": "{command_name}",
  "params": {
    "param1": "example_value",
    "param2": 42
  }
}
```

**Example Response:**
```json
{
  "status": "OK",
  "message": {
    "result_field": "value",
    "another_field": 123
  }
}
```

**Errors:**
- `{ERROR_CODE}`: {When this error occurs and how to fix it}

---

### {another_command_name}

**Description:** {Description}

**Use when:** {Scenarios}

**Prerequisites:**
- {Requirements}

**Parameters:**
- `param1` (required, string): {Description}

**Example Request:**
```json
{
  "command": "{another_command_name}",
  "params": {
    "param1": "value"
  }
}
```

---

## Common Workflows

### Workflow: {Workflow Name}

{Description of a common multi-step process using this service's commands}

1. **Step 1:** Call `{first_command}` to {action}
2. **Step 2:** Call `{second_command}` to {action}
3. **Step 3:** Verify with `{third_command}`

**Example:**
```bash
# Using the CLI
descix service call {command_name} --param1 value

# Or via tell_me_how
tell_me_how("I want to {describe the workflow goal}")
```

## Integration with Other Services

{Describe how this service works with other DeSciX services}

- **RAG Integration:** {If this service uses knowledge bases}
- **Token Economy:** {If this service interacts with tokenomics}
- **Other Services:** {Any service-to-service communication}

## Troubleshooting

### Common Errors

**Error: `{Error message}`**
- **Cause:** {Why this happens}
- **Solution:** {How to fix it}

**Error: `{Another error}`**
- **Cause:** {Why this happens}
- **Solution:** {How to fix it}

### Getting Help

If you encounter issues:
1. Use `tell_me_how` to find related documentation
2. Check the app's knowledge base for detailed guides
3. Contact community support

---

## Service Metadata

| Field | Value |
|-------|-------|
| Service Name | {service_name} |
| Version | {version} |
| Community | {community_id} |
| App | {app_id} |
| Commands | {command_count} |

---

*This README is vectorized for `tell_me_how` discovery. Keep it up to date with your service's capabilities.*
