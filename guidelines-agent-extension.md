# Agent Extension Guidelines

Technical constraints and patterns for building an agent extension. Follow these throughout specification execution.

## Feature Flags

Two capabilities are gated by feature flags and must be checked before collecting requirements:

| Flag | Capability |
|---|---|
| `enable_agent_extension_mcp_server` | MCP tool integration — only add `tools` sections if `true` |
| `enable_agent_extension_n8n_hooks` | n8n hook configuration — only add `hooks` sections if `true` |

If a flag is `false`, omit the corresponding capability entirely from `extension.yaml` and do not add any related `requires` entries to `asset.yaml`, even if the base agent supports it.

**Fail closed:** a capability is enabled ONLY on an explicit `true`.

## Tech Stack

- Declarative YAML descriptors only (`extension.yaml`, `asset.yaml`) — no agent source code
- Generated via the `create-agent-extension` skill

## Key Constraints

- An extension **augments an already-deployed, extensible agent** — it MUST NOT modify the base agent's source code.
- Only declare capabilities the base agent actually supports. Never invent capabilities.
- The extension targets a specific base agent by `ordId` + `version`; `asset.yaml` `requires` MUST reference it.
- Tools are surfaced through MCP servers — only relevant when `enable_agent_extension_mcp_server = true`.
- Hooks are n8n workflows — only relevant when `enable_agent_extension_n8n_hooks = true`.

## Extension Structure

- One extension asset folder `assets/<asset-name>/` containing `extension.yaml` + `asset.yaml`
- `extension.yaml` `capabilityImplementations` includes only `instruction` when both feature flags are `false`
- Validate both YAML files are well-formed after creation

## Feature Flag Status for This Project

- `enable_agent_extension_mcp_server`: **false** — tools section MUST be omitted
- `enable_agent_extension_n8n_hooks`: **false** — hooks section MUST be omitted
- Only `instruction` capability is in scope for this extension
