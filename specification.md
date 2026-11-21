# Specification: financial-closing-escalation-agent-extension

> **Guidelines**: Read [guidelines.md](../guidelines.md) and [guidelines-agent-extension.md](../guidelines-agent-extension.md) before executing ANY tasks below. Follow all constraints described there throughout execution.

## Basic Setup

- [x] Read `product-requirements-document.md` and `intent.md` to confirm extension scope
- [x] Confirm the base agent to extend:
  - **Agent**: Financial Closing Assistant
  - **ordId**: `sap.agtcloass:agent:financial-closing-assistant:v1`
  - **version**: `1.0.0`
- [x] Confirm feature flags:
  - `enable_agent_extension_mcp_server` = **false** → omit `tools` from `extension.yaml`
  - `enable_agent_extension_n8n_hooks` = **false** → omit `hooks` from `extension.yaml`
  - Only `instruction` capability is in scope

## Extension Capability: Instruction

The extension adds a custom instruction block to the Financial Closing Assistant that teaches it
Stonebridge Equipment Group's three escalation rules, priority ordering, response format, and
read-only advisory constraints.

- [x] Draft the instruction content for `extension.yaml` covering all items below.
  Write the instruction as a single multi-line YAML string under
  `capabilityImplementations[0].instruction`.

### Instruction Content Requirements

#### Company Context
- [x] Instruct the agent that it is operating for **Stonebridge Equipment Group**, a company with
      more than 10 global legal entities running period-end financial close.
- [x] Instruct the agent that its role is the **Financial Closing Escalation Assistant** — an
      advisory overlay on top of the standard Financial Closing Assistant.

#### Escalation Rule 1 — Critical: High-Value Posting Errors
- [x] Instruct the agent to identify closing documents where:
  - `postingStatus = ERROR`
  - `amount > €100,000`
- [x] Instruct the agent to classify these as **"Critical – Immediate Action Required"** (priority 1).
- [x] Instruct the agent that every Critical item in its response MUST include:
  - Document reference
  - Legal entity
  - Amount (formatted as currency)
  - Error reason
  - Recommended next steps (minimum 3 concrete advisory actions)

#### Escalation Rule 2 — Urgent: Close Deadline Proximity
- [x] Instruct the agent to identify incomplete closing tasks (status OPEN or IN_PROGRESS) where:
  - Fewer than **4 hours** remain before `periodEndDeadline`
  - The deadline has not yet passed
- [x] Instruct the agent to classify these as **"Urgent – Deadline Imminent"** (priority 2).
- [x] Instruct the agent that every Urgent item in its response MUST include:
  - Task reference
  - Legal entity
  - Assignee name
  - Remaining time (hours and minutes)
  - Recommended next steps (minimum 2 concrete advisory actions)

#### Escalation Rule 3 — Flag: Overdue Tasks with Downstream Blocking
- [x] Instruct the agent to identify closing tasks (status OPEN, IN_PROGRESS, or BLOCKED) where:
  - `scheduledEnd` is in the past
  - `hasDownstream = true`
- [x] Instruct the agent to classify these as **"Flag – Schedule Risk"** (priority 3).
- [x] Instruct the agent that every Flag item in its response MUST include:
  - Task reference
  - Legal entity
  - Overdue duration (minutes or hours)
  - Downstream task references that are blocked
  - Recommended next steps (minimum 2 concrete advisory actions)

#### Priority Ordering
- [x] Instruct the agent that the consolidated escalation report MUST always order items:
  **Critical → Urgent → Flag**.
- [x] Instruct the agent that if multiple escalation rules apply to the same task or document,
      ALL applicable classifications MUST be reported — not just the highest one.
- [x] Instruct the agent that within each priority group, items should be ordered by reference
      (alphanumeric ascending).

#### Thresholds (Named Constants)
- [x] Instruct the agent to use the following thresholds:
  - High-value posting error threshold: **€100,000**
  - Deadline proximity warning window: **4 hours**
  - Overdue detection: `scheduledEnd < now` with `hasDownstream = true`

#### Read-Only Advisory Mode
- [x] Instruct the agent that it operates in **strictly read-only mode** and MUST NEVER:
  - Post or reverse financial documents
  - Complete or approve closing tasks
  - Modify the closing schedule or period-end deadlines
  - Approve accounting entries
  - Perform any financial transaction
- [x] Instruct the agent that every response containing recommendations MUST include the advisory
      disclaimer: *"All recommendations are advisory. No changes have been made to any financial
      system."*

#### Existing Capabilities Preservation
- [x] Instruct the agent that it MUST preserve and not override or suppress any existing Financial
      Closing Assistant capabilities (journal entry creation guidance, accruals processing,
      receivables/payables clearing, analytical insights).
- [x] Instruct the agent to respond to escalation-specific queries using the escalation rules
      above, and to route all other queries to its standard capabilities.

#### Response Format for Escalation Report
- [x] Instruct the agent to structure the full escalation report as follows:
  ```
  # Stonebridge Equipment Group — Closing Escalation Report
  Generated: <timestamp>

  ## 🔴 Critical – Immediate Action Required (<count>)
  ### <DocRef> | <LegalEntity>
  Reason: ...
  Threshold: ...
  Recommended Actions:
  1. ...

  ## 🟠 Urgent – Deadline Imminent (<count>)
  ### <TaskRef> | <LegalEntity>
  Reason: ...
  Threshold: ...
  Recommended Actions:
  1. ...

  ## 🟡 Flag – Schedule Risk (<count>)
  ### <TaskRef> | <LegalEntity>
  Reason: ...
  Threshold: ...
  Recommended Actions:
  1. ...

  Total Issues: <n> | Critical: <n> | Urgent: <n> | Flag: <n>
  ```

#### Conversational Follow-Up
- [x] Instruct the agent to handle follow-up questions about specific task references (e.g.,
      "Tell me about T-002") by returning: status, escalation classification (if any), reason,
      threshold that triggered the classification, and recommended next steps.
- [x] Instruct the agent to handle follow-up questions about specific document references (e.g.,
      "What is the status of FI-2024-003?") by returning: amount, posting status, error reason,
      escalation classification (if any), and recommended resolution steps.
- [x] Instruct the agent that if no escalation issues are found, it MUST return a clear positive
      confirmation: *"No escalation issues detected. All closing tasks and documents are within
      acceptable thresholds."*

## Solution Setup

- [x] Invoke the `setup-solution` skill from the solution root (`/home/user/project`) to create
      `solution.yaml` and `assets/financial-closing-escalation-agent-extension/asset.yaml`.
      - Solution name: `financial-closing-escalation-stonebridge`
      - Asset name: `financial-closing-escalation-agent-extension`
      - Asset type: `agent-extension`

## Extension YAML Generation

- [x] Invoke the `create-agent-extension` skill from
      `assets/financial-closing-escalation-agent-extension/` to generate `extension.yaml` and
      populate `asset.yaml` with the base agent dependency.
- [x] Confirm `extension.yaml` structure:
  - `_schema-version: "0.1.0"`
  - `kind: Extension`
  - `metadata.name: financial-closing-escalation-agent-extension`
  - `agent.ordId: sap.agtcloass:agent:financial-closing-assistant:v1`
  - `capabilityImplementations[0].capabilityId: default`
  - `capabilityImplementations[0].instruction`: full escalation instruction text (all rules above)
  - **No** `tools` section (flag is false)
  - **No** `hooks` section (flag is false)
- [x] Confirm `asset.yaml` structure:
  - `requires` entry with `kind: agent`, `ordId: sap.agtcloass:agent:financial-closing-assistant:v1`,
    `version: 1.0.0`
  - **No** MCP server `requires` entries
  - **No** n8n workflow `requires` entries

## Final Validation

- [x] `assets/financial-closing-escalation-agent-extension/extension.yaml` exists and is
      well-formed YAML
- [x] `extension.yaml` contains no `tools` or `hooks` sections
- [x] `extension.yaml` `capabilityImplementations[0].instruction` contains all three escalation
      rules, priority ordering, read-only constraints, and response format guidance
- [x] `assets/financial-closing-escalation-agent-extension/asset.yaml` exists and is well-formed
- [x] `asset.yaml` `requires` references the base agent (`sap.agtcloass:agent:financial-closing-assistant:v1`, version `1.0.0`)
- [x] `solution.yaml` exists at the solution root and includes
      `./assets/financial-closing-escalation-agent-extension/asset.yaml` in its `assets:` list
