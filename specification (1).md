# Specification

> **Guidelines**: Read [guidelines.md](./guidelines.md) before executing ANY tasks below.

Check off items as completed.

## Solution Setup

- [x] Create asset directory: `mkdir -p assets/financial-closing-escalation-agent-extension/`
- [x] Invoke `setup-solution` skill to create `solution.yaml` and
      `assets/financial-closing-escalation-agent-extension/asset.yaml`
- [x] Validate `solution.yaml` and `asset.yaml` exist and are well-formed

## Asset Implementation

- [x] Execute `specification/financial-closing-escalation-agent-extension/specification.md`
      (all items)

## Feature Flag Summary

| Flag | Value | Impact |
|------|-------|--------|
| `enable_agent_extension_mcp_server` | `false` | No MCP tools — instruction-only extension |
| `enable_agent_extension_n8n_hooks` | `false` | No n8n hooks |

## Base Agent

| Field | Value |
|-------|-------|
| Title | Financial Closing Assistant |
| ordId | `sap.agtcloass:agent:financial-closing-assistant:v1` |
| Version | `1.0.0` |
| Capability | `default` — instruction supported, tools additions enabled (gated by flag), pre/post hooks supported (gated by flag) |

## Extension Scope

This extension delivers **one asset**:

| Asset | Type | Capabilities |
|-------|------|-------------|
| `financial-closing-escalation-agent-extension` | Agent Extension (Joule) | Instruction only |

The instruction adds to the Financial Closing Assistant:
1. **Rule 1 — Critical**: Posting errors > €100,000 → "Critical – Immediate Action Required"
2. **Rule 2 — Urgent**: Incomplete tasks < 4 hours to deadline → "Urgent – Deadline Imminent"
3. **Rule 3 — Flag**: Overdue tasks blocking downstream → "Flag – Schedule Risk"
4. **Priority ordering**: Critical → Urgent → Flag; multiple rules applied per item
5. **Read-only advisory mode**: No financial transactions; all outputs advisory only
6. **Existing capabilities preserved**: Standard Financial Closing Assistant behaviour unchanged
