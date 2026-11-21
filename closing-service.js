'use strict';

const cds = require('@sap/cds');

// ─── In-Memory Data Store (bypasses SQLite) ─────────────────────────────────
// Relative to now so escalation rules always fire in demo
function buildMockData() {
  const now = new Date();
  const ts  = (offsetHours) => new Date(now.getTime() + offsetHours * 3600000).toISOString();
  const today = now.toISOString().split('T')[0];

  const tasks = [
    {
      ID: 'task-0001', taskRef: 'T-001', description: 'Accounts Receivable Reconciliation',
      legalEntity: 'SBE-DE', status: 'COMPLETED',
      scheduledEnd: ts(-8), actualEnd: ts(-8.25), periodEndDeadline: ts(6),
      hasDownstream: false, downstreamRefs: '', assignee: 'Maria Schmidt'
    },
    {
      ID: 'task-0002', taskRef: 'T-002', description: 'Intercompany Elimination – SBE-DE to SBE-UK',
      legalEntity: 'SBE-DE', status: 'IN_PROGRESS',
      scheduledEnd: ts(-3), actualEnd: null, periodEndDeadline: ts(6),
      hasDownstream: true, downstreamRefs: 'T-005, T-007', assignee: 'Klaus Weber'
    },
    {
      ID: 'task-0003', taskRef: 'T-003', description: 'Fixed Asset Depreciation Run',
      legalEntity: 'SBE-UK', status: 'OPEN',
      scheduledEnd: ts(1), actualEnd: null, periodEndDeadline: ts(2.5),
      hasDownstream: true, downstreamRefs: 'T-006', assignee: 'James Thornton'
    },
    {
      ID: 'task-0004', taskRef: 'T-004', description: 'Accruals Posting – Marketing Spend',
      legalEntity: 'SBE-FR', status: 'IN_PROGRESS',
      scheduledEnd: ts(-1), actualEnd: null, periodEndDeadline: ts(6),
      hasDownstream: false, downstreamRefs: '', assignee: 'Sophie Leclerc'
    },
    {
      ID: 'task-0005', taskRef: 'T-005', description: 'Consolidation Journal Entries',
      legalEntity: 'SBE-DE', status: 'BLOCKED',
      scheduledEnd: ts(-5), actualEnd: null, periodEndDeadline: ts(6),
      hasDownstream: true, downstreamRefs: 'T-008, T-009', assignee: 'Klaus Weber'
    },
    {
      ID: 'task-0006', taskRef: 'T-006', description: 'Tax Provision Calculation',
      legalEntity: 'SBE-UK', status: 'OPEN',
      scheduledEnd: ts(2), actualEnd: null, periodEndDeadline: ts(6),
      hasDownstream: false, downstreamRefs: '', assignee: 'James Thornton'
    },
    {
      ID: 'task-0007', taskRef: 'T-007', description: 'Profit Centre Reallocation',
      legalEntity: 'SBE-DE', status: 'BLOCKED',
      scheduledEnd: ts(-2), actualEnd: null, periodEndDeadline: ts(6),
      hasDownstream: false, downstreamRefs: '', assignee: 'Anna Bauer'
    },
    {
      ID: 'task-0008', taskRef: 'T-008', description: 'Financial Statements Draft',
      legalEntity: 'SBE-DE', status: 'OPEN',
      scheduledEnd: ts(3), actualEnd: null, periodEndDeadline: ts(6),
      hasDownstream: false, downstreamRefs: '', assignee: 'Maria Schmidt'
    },
    {
      ID: 'task-0009', taskRef: 'T-009', description: 'Group Reporting Package',
      legalEntity: 'SBE-GROUP', status: 'OPEN',
      scheduledEnd: ts(4), actualEnd: null, periodEndDeadline: ts(6),
      hasDownstream: false, downstreamRefs: '', assignee: 'Chief Financial Officer'
    },
    {
      ID: 'task-0010', taskRef: 'T-010', description: 'Bank Statement Reconciliation – EUR Account',
      legalEntity: 'SBE-FR', status: 'OPEN',
      scheduledEnd: ts(-6), actualEnd: null, periodEndDeadline: ts(1.5),
      hasDownstream: true, downstreamRefs: 'T-004, T-008', assignee: 'Sophie Leclerc'
    }
  ];

  const docs = [
    {
      ID: 'doc-0001', docRef: 'FI-2024-001', legalEntity: 'SBE-DE',
      documentType: 'General Ledger Posting', amount: 320000.00, currency: 'EUR',
      postingStatus: 'POSTED', errorReason: '', postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0002', docRef: 'FI-2024-002', legalEntity: 'SBE-UK',
      documentType: 'Accounts Payable Invoice', amount: 87500.00, currency: 'EUR',
      postingStatus: 'POSTED', errorReason: '', postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0003', docRef: 'FI-2024-003', legalEntity: 'SBE-DE',
      documentType: 'Intercompany Transfer', amount: 245000.00, currency: 'EUR',
      postingStatus: 'ERROR',
      errorReason: 'Account assignment mismatch – profit centre SBE-DE-PROD not found in target company code',
      postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0004', docRef: 'FI-2024-004', legalEntity: 'SBE-FR',
      documentType: 'Revenue Accrual', amount: 56000.00, currency: 'EUR',
      postingStatus: 'POSTED', errorReason: '', postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0005', docRef: 'FI-2024-005', legalEntity: 'SBE-UK',
      documentType: 'Fixed Asset Posting', amount: 410000.00, currency: 'EUR',
      postingStatus: 'POSTED', errorReason: '', postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0006', docRef: 'FI-2024-006', legalEntity: 'SBE-DE',
      documentType: 'Accounts Receivable Clearing', amount: 29800.00, currency: 'EUR',
      postingStatus: 'PENDING', errorReason: '', postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0007', docRef: 'FI-2024-007', legalEntity: 'SBE-FR',
      documentType: 'Tax Posting', amount: 178500.00, currency: 'EUR',
      postingStatus: 'ERROR',
      errorReason: 'Tax code validation failed – FR-VAT-20 not configured for fiscal year 2024 in company code SBE-FR',
      postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0008', docRef: 'FI-2024-008', legalEntity: 'SBE-UK',
      documentType: 'Bank Reconciliation Entry', amount: 125000.00, currency: 'EUR',
      postingStatus: 'POSTED', errorReason: '', postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0009', docRef: 'FI-2024-009', legalEntity: 'SBE-GROUP',
      documentType: 'Elimination Entry', amount: 530000.00, currency: 'EUR',
      postingStatus: 'POSTED', errorReason: '', postingDate: today, accountingPeriod: '2024-01'
    },
    {
      ID: 'doc-0010', docRef: 'FI-2024-010', legalEntity: 'SBE-DE',
      documentType: 'Depreciation Run Entry', amount: 42000.00, currency: 'EUR',
      postingStatus: 'ERROR',
      errorReason: 'Asset class configuration error – asset class 1200 not assigned to depreciation area 01',
      postingDate: today, accountingPeriod: '2024-01'
    }
  ];

  return { tasks, docs };
}

// Global in-memory stores
let TASKS = [];
let DOCS  = [];
const CHAT_HISTORY = {}; // sessionId -> messages[]

module.exports = cds.service.impl(async function () {

  // Initialize mock data
  const data = buildMockData();
  TASKS = data.tasks;
  DOCS  = data.docs;

  // ─── Override Entity READ handlers (in-memory) ─────────────────────────

  this.on('READ', 'ClosingTasks', () => TASKS);
  this.on('READ', 'ClosingDocuments', () => DOCS);
  this.on('READ', 'ChatMessages', (req) => {
    const sessionId = req.query?.where?.sessionId;
    if (sessionId) {
      return (CHAT_HISTORY[sessionId] || []);
    }
    return Object.values(CHAT_HISTORY).flat();
  });

  // ─── Escalation Engine ─────────────────────────────────────────────────

  function runEscalationRules() {
    const now = new Date();
    const fourHoursMs    = 4 * 60 * 60 * 1000;
    const HIGH_VALUE_THRESHOLD = 100000;

    const escalations = [];

    // Rule 1: High-Value Posting Errors
    for (const doc of DOCS) {
      if (doc.postingStatus === 'ERROR' && Math.abs(doc.amount) > HIGH_VALUE_THRESHOLD) {
        escalations.push({
          type       : 'CRITICAL',
          label      : 'Critical – Immediate Action Required',
          priority   : 1,
          ref        : doc.docRef,
          entityType : 'Document',
          legalEntity: doc.legalEntity,
          amount     : doc.amount,
          currency   : doc.currency,
          reason     : `Posting error on document ${doc.docRef} (${doc.documentType}): ${doc.errorReason}`,
          threshold  : `Amount ${formatCurrency(doc.amount, doc.currency)} exceeds €100,000 threshold`,
          recommendation: [
            `Immediately review document ${doc.docRef} in the Financial Closing Cockpit.`,
            `Engage the responsible accountant for ${doc.legalEntity} to resolve the posting error.`,
            `Confirm correction and re-post before the period-end deadline.`,
            `Notify the financial controller if the error cannot be resolved within 30 minutes.`
          ]
        });
      }
    }

    // Rule 2: Close Deadline Proximity (< 4 hours)
    for (const task of TASKS) {
      if ((task.status === 'OPEN' || task.status === 'IN_PROGRESS') && task.periodEndDeadline) {
        const deadline  = new Date(task.periodEndDeadline);
        const remaining = deadline - now;
        if (remaining > 0 && remaining < fourHoursMs) {
          const hrs  = Math.floor(remaining / 3600000);
          const mins = Math.round((remaining % 3600000) / 60000);
          escalations.push({
            type       : 'URGENT',
            label      : 'Urgent – Deadline Imminent',
            priority   : 2,
            ref        : task.taskRef,
            entityType : 'Task',
            legalEntity: task.legalEntity,
            reason     : `Task ${task.taskRef} "${task.description}" is incomplete with less than 4 hours to the period-end deadline.`,
            threshold  : `${hrs}h ${mins}m remaining before deadline (${formatDate(deadline)})`,
            recommendation: [
              `Immediately contact the assignee (${task.assignee || 'unassigned'}) to confirm progress.`,
              `Escalate to the finance team lead if the task cannot be completed within the next hour.`,
              `Assess whether any downstream tasks can begin in parallel to reduce delay.`
            ]
          });
        }
      }
    }

    // Rule 3: Overdue Tasks with Downstream Blocking
    for (const task of TASKS) {
      if (['OPEN', 'IN_PROGRESS', 'BLOCKED'].includes(task.status) && task.scheduledEnd && task.hasDownstream) {
        const scheduledEnd = new Date(task.scheduledEnd);
        if (scheduledEnd < now) {
          const overdueMin = Math.round((now - scheduledEnd) / 60000);
          const downstream = task.downstreamRefs || 'unknown';
          escalations.push({
            type       : 'FLAG',
            label      : 'Flag – Schedule Risk',
            priority   : 3,
            ref        : task.taskRef,
            entityType : 'Task',
            legalEntity: task.legalEntity,
            reason     : `Task ${task.taskRef} "${task.description}" is overdue by ${overdueMin} minutes and is blocking downstream tasks: ${downstream}.`,
            threshold  : `Scheduled completion was ${formatDate(scheduledEnd)} — now ${overdueMin} min overdue`,
            recommendation: [
              `Review the current status with assignee ${task.assignee || 'unassigned'}.`,
              `Notify owners of dependent tasks (${downstream}) about the potential delay.`,
              `Consider reassigning the task or providing additional resources.`,
              `Update the closing schedule to reflect the revised completion forecast.`
            ]
          });
        }
      }
    }

    // Sort: Critical (1) → Urgent (2) → Flag (3)
    escalations.sort((a, b) => a.priority - b.priority || a.ref.localeCompare(b.ref));
    return escalations;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  }

  function buildReportText(escalations) {
    if (escalations.length === 0) {
      return '✅ No escalation issues detected. All closing tasks and documents are within acceptable thresholds.';
    }

    const groups = { CRITICAL: [], URGENT: [], FLAG: [] };
    for (const e of escalations) groups[e.type]?.push(e);

    let r = `# Stonebridge Equipment Group — Closing Escalation Report\nGenerated: ${new Date().toLocaleString('en-GB')}\n\n---\n\n`;

    if (groups.CRITICAL.length) {
      r += `## 🔴 Critical – Immediate Action Required (${groups.CRITICAL.length})\n\n`;
      for (const e of groups.CRITICAL) {
        r += `### ${e.ref} | ${e.legalEntity}\n**Reason:** ${e.reason}\n\n**Threshold:** ${e.threshold}\n\n**Recommended Actions:**\n`;
        e.recommendation.forEach((rec, i) => { r += `${i + 1}. ${rec}\n`; });
        r += `\n---\n\n`;
      }
    }

    if (groups.URGENT.length) {
      r += `## 🟠 Urgent – Deadline Imminent (${groups.URGENT.length})\n\n`;
      for (const e of groups.URGENT) {
        r += `### ${e.ref} | ${e.legalEntity}\n**Reason:** ${e.reason}\n\n**Threshold:** ${e.threshold}\n\n**Recommended Actions:**\n`;
        e.recommendation.forEach((rec, i) => { r += `${i + 1}. ${rec}\n`; });
        r += `\n---\n\n`;
      }
    }

    if (groups.FLAG.length) {
      r += `## 🟡 Flag – Schedule Risk (${groups.FLAG.length})\n\n`;
      for (const e of groups.FLAG) {
        r += `### ${e.ref} | ${e.legalEntity}\n**Reason:** ${e.reason}\n\n**Threshold:** ${e.threshold}\n\n**Recommended Actions:**\n`;
        e.recommendation.forEach((rec, i) => { r += `${i + 1}. ${rec}\n`; });
        r += `\n---\n\n`;
      }
    }

    r += `**Total Issues: ${escalations.length}** | Critical: ${groups.CRITICAL.length} | Urgent: ${groups.URGENT.length} | Flag: ${groups.FLAG.length}\n`;
    return r;
  }

  // ─── Action: generateEscalationReport ─────────────────────────────────

  this.on('generateEscalationReport', () => {
    const escalations = runEscalationRules();
    return buildReportText(escalations);
  });

  // ─── Action: chat ──────────────────────────────────────────────────────

  this.on('chat', async (req) => {
    const { sessionId, message } = req.data;

    if (!CHAT_HISTORY[sessionId]) CHAT_HISTORY[sessionId] = [];

    // Save user message
    CHAT_HISTORY[sessionId].push({
      ID: `${sessionId}-${Date.now()}`, sessionId,
      role: 'user', content: message, timestamp: new Date().toISOString()
    });

    // Build context and messages
    const escalations  = runEscalationRules();
    const systemContext = buildSystemContext(escalations);
    const history       = CHAT_HISTORY[sessionId].slice(-16);

    const messages = [
      { role: 'system', content: systemContext },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    // Try AI, fall back to rule-based
    const aiResponse = await callAI(messages);

    // Save assistant reply
    CHAT_HISTORY[sessionId].push({
      ID: `${sessionId}-${Date.now()}-r`, sessionId,
      role: 'assistant', content: aiResponse, timestamp: new Date().toISOString()
    });

    return aiResponse;
  });

  // ─── AI Integration ───────────────────────────────────────────────────

  function buildSystemContext(escalations) {
    const report     = buildReportText(escalations);
    const taskList   = TASKS.map(t =>
      `- ${t.taskRef}: ${t.description} | Status: ${t.status} | Entity: ${t.legalEntity} | Assignee: ${t.assignee || 'N/A'}`
    ).join('\n');
    const docList    = DOCS.map(d =>
      `- ${d.docRef}: ${d.documentType} | ${formatCurrency(d.amount, d.currency)} | Status: ${d.postingStatus}${d.errorReason ? ' | ' + d.errorReason : ''}`
    ).join('\n');

    return `You are the Stonebridge Equipment Group Financial Closing Assistant.
Help the finance team understand and act on period-end closing escalations.
READ-ONLY mode — you MUST NOT post, complete, approve, or modify anything.
All recommendations are advisory only.

## Current Escalation Report
${report}

## Closing Tasks
${taskList}

## Closing Documents
${docList}

Respond clearly and concisely. Reference specific task/document numbers when relevant.`;
  }

  async function callAI(messages) {
    try {
      const aiCoreUrl = process.env.AICORE_SERVICE_URL;
      const aiToken   = process.env.AICORE_TOKEN;

      if (!aiCoreUrl || !aiToken) {
        return generateRuleBasedResponse(messages);
      }

      const { default: fetch } = await import('node-fetch');
      const res = await fetch(
        `${aiCoreUrl}/v2/inference/deployments/${process.env.AICORE_DEPLOYMENT_ID}/chat/completions`,
        {
          method : 'POST',
          headers: {
            'Content-Type'    : 'application/json',
            'Authorization'   : `Bearer ${aiToken}`,
            'AI-Resource-Group': process.env.AICORE_RESOURCE_GROUP || 'default'
          },
          body: JSON.stringify({ model: 'gpt-4', messages, temperature: 0.3, max_tokens: 1000 })
        }
      );

      if (!res.ok) return generateRuleBasedResponse(messages);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || generateRuleBasedResponse(messages);
    } catch {
      return generateRuleBasedResponse(messages);
    }
  }

  function generateRuleBasedResponse(messages) {
    const userMsg    = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const systemMsg  = messages[0]?.content || '';
    const escalations = runEscalationRules();
    const groups     = { CRITICAL: [], URGENT: [], FLAG: [] };
    for (const e of escalations) groups[e.type]?.push(e);

    // Critical / posting errors
    if (/critical|posting.?error|high.?value|document.*error|fi-2024/i.test(userMsg)) {
      if (groups.CRITICAL.length === 0) return '✅ There are currently no critical posting errors above the €100,000 threshold.';
      let reply = `I have identified **${groups.CRITICAL.length} Critical** posting error(s) requiring immediate action:\n\n`;
      groups.CRITICAL.forEach(e => {
        reply += `**${e.ref}** (${e.legalEntity}) — ${formatCurrency(e.amount, e.currency)}\n`;
        reply += `Reason: ${e.reason}\n`;
        reply += `Next step: ${e.recommendation[0]}\n\n`;
      });
      return reply;
    }

    // Urgent / deadline
    if (/urgent|deadline|hours|imminent|time.?sensitive/i.test(userMsg)) {
      if (groups.URGENT.length === 0) return '✅ No tasks are currently within the 4-hour deadline warning threshold.';
      let reply = `I have identified **${groups.URGENT.length} Urgent** task(s) with the deadline approaching:\n\n`;
      groups.URGENT.forEach(e => {
        reply += `**${e.ref}** (${e.legalEntity}) — ${e.threshold}\n`;
        reply += `${e.reason}\n`;
        reply += `Next step: ${e.recommendation[0]}\n\n`;
      });
      return reply;
    }

    // Flag / overdue / blocked
    if (/flag|overdue|block|schedule.?risk|downstream/i.test(userMsg)) {
      if (groups.FLAG.length === 0) return '✅ No tasks are currently overdue with downstream dependencies blocked.';
      let reply = `I have identified **${groups.FLAG.length} Flag(s)** for schedule risk:\n\n`;
      groups.FLAG.forEach(e => {
        reply += `**${e.ref}** (${e.legalEntity}) — ${e.threshold}\n`;
        reply += `${e.reason}\n`;
        reply += `Next step: ${e.recommendation[0]}\n\n`;
      });
      return reply;
    }

    // Full report / summary / all issues
    if (/report|summary|all.?issue|show.?all|overview|escalation/i.test(userMsg)) {
      return buildReportText(escalations);
    }

    // Next steps / recommendations
    if (/recommend|next.?step|what.?should|action|priorit/i.test(userMsg)) {
      return `Based on the current escalation analysis, here is the prioritized action plan for your finance team:

**🔴 1. Critical — Resolve First (${groups.CRITICAL.length} issue${groups.CRITICAL.length !== 1 ? 's' : ''})**
${groups.CRITICAL.length ? groups.CRITICAL.map(e => `• ${e.ref}: ${e.recommendation[0]}`).join('\n') : '• No critical issues at this time.'}

**🟠 2. Urgent — Within the Next Hour (${groups.URGENT.length} issue${groups.URGENT.length !== 1 ? 's' : ''})**
${groups.URGENT.length ? groups.URGENT.map(e => `• ${e.ref}: ${e.recommendation[0]}`).join('\n') : '• No urgent issues at this time.'}

**🟡 3. Flag — Monitor & Mitigate (${groups.FLAG.length} issue${groups.FLAG.length !== 1 ? 's' : ''})**
${groups.FLAG.length ? groups.FLAG.map(e => `• ${e.ref}: ${e.recommendation[0]}`).join('\n') : '• No schedule flags at this time.'}

All recommendations are advisory. I cannot make changes on your behalf.`;
    }

    // Task / document lookup
    const taskMatch = userMsg.match(/t-0*(\d+)/i);
    if (taskMatch) {
      const ref  = `T-${taskMatch[1].padStart(3, '0')}`;
      const task = TASKS.find(t => t.taskRef.toUpperCase() === ref.toUpperCase());
      if (task) {
        const esc = escalations.filter(e => e.ref === task.taskRef);
        let reply = `**Task ${task.taskRef}** — ${task.description}\n`;
        reply += `Entity: ${task.legalEntity} | Status: ${task.status} | Assignee: ${task.assignee || 'Unassigned'}\n`;
        if (esc.length) {
          reply += `\nEscalations:\n`;
          esc.forEach(e => { reply += `• **${e.label}**: ${e.reason}\n`; });
        } else {
          reply += `\nNo escalation triggered for this task.`;
        }
        return reply;
      }
    }

    const docMatch = userMsg.match(/fi-2024-0*(\d+)/i);
    if (docMatch) {
      const ref = `FI-2024-${docMatch[1].padStart(3, '0')}`;
      const doc = DOCS.find(d => d.docRef.toUpperCase() === ref.toUpperCase());
      if (doc) {
        const esc = escalations.filter(e => e.ref === doc.docRef);
        let reply = `**Document ${doc.docRef}** — ${doc.documentType}\n`;
        reply += `Entity: ${doc.legalEntity} | Amount: ${formatCurrency(doc.amount, doc.currency)} | Status: ${doc.postingStatus}\n`;
        if (doc.errorReason) reply += `Error: ${doc.errorReason}\n`;
        if (esc.length) {
          reply += `\n**${esc[0].label}**: ${esc[0].reason}\n`;
          reply += `\nRecommended actions:\n`;
          esc[0].recommendation.forEach((r, i) => { reply += `${i + 1}. ${r}\n`; });
        }
        return reply;
      }
    }

    // Default greeting
    const totalIssues = escalations.length;
    return `I am the **Stonebridge Financial Closing Assistant** operating in read-only mode.

Currently I have identified **${totalIssues} escalation issue${totalIssues !== 1 ? 's' : ''}**:
🔴 ${groups.CRITICAL.length} Critical · 🟠 ${groups.URGENT.length} Urgent · 🟡 ${groups.FLAG.length} Flag

You can ask me:
- **"Generate the full escalation report"** — complete prioritized summary
- **"Show me all critical issues"** — posting errors > €100,000
- **"Which tasks are approaching the deadline?"** — < 4 hours remaining
- **"What tasks are overdue and blocking others?"** — schedule risk flags
- **"What are the recommended next steps?"** — prioritized action plan
- **"Tell me about T-002"** or **"FI-2024-003"** — specific item details`;
  }
});
