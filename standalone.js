'use strict';

/**
 * Standalone Express server — bypasses CAP/SQLite entirely.
 * Implements the same chat and escalation endpoints using pure in-memory data.
 */
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ── Serve static UI ─────────────────────────────────────────────────────────
const uiPath = path.join(__dirname, '../app/closing-ui');
app.use('/closing-ui', express.static(uiPath));
app.get('/', (_, res) => res.redirect('/closing-ui/index.html'));

// ── Mock data (timestamps relative to now) ──────────────────────────────────
function buildData() {
  const now = new Date();
  const ts  = h => new Date(now.getTime() + h * 3600000).toISOString();
  const today = now.toISOString().split('T')[0];

  const tasks = [
    { ID:'t1', taskRef:'T-001', description:'Accounts Receivable Reconciliation', legalEntity:'SBE-DE', status:'COMPLETED', scheduledEnd:ts(-8), actualEnd:ts(-8.25), periodEndDeadline:ts(6), hasDownstream:false, downstreamRefs:'', assignee:'Maria Schmidt' },
    { ID:'t2', taskRef:'T-002', description:'Intercompany Elimination – SBE-DE to SBE-UK', legalEntity:'SBE-DE', status:'IN_PROGRESS', scheduledEnd:ts(-3), actualEnd:null, periodEndDeadline:ts(6), hasDownstream:true, downstreamRefs:'T-005, T-007', assignee:'Klaus Weber' },
    { ID:'t3', taskRef:'T-003', description:'Fixed Asset Depreciation Run', legalEntity:'SBE-UK', status:'OPEN', scheduledEnd:ts(1), actualEnd:null, periodEndDeadline:ts(2.5), hasDownstream:true, downstreamRefs:'T-006', assignee:'James Thornton' },
    { ID:'t4', taskRef:'T-004', description:'Accruals Posting – Marketing Spend', legalEntity:'SBE-FR', status:'IN_PROGRESS', scheduledEnd:ts(-1), actualEnd:null, periodEndDeadline:ts(6), hasDownstream:false, downstreamRefs:'', assignee:'Sophie Leclerc' },
    { ID:'t5', taskRef:'T-005', description:'Consolidation Journal Entries', legalEntity:'SBE-DE', status:'BLOCKED', scheduledEnd:ts(-5), actualEnd:null, periodEndDeadline:ts(6), hasDownstream:true, downstreamRefs:'T-008, T-009', assignee:'Klaus Weber' },
    { ID:'t6', taskRef:'T-006', description:'Tax Provision Calculation', legalEntity:'SBE-UK', status:'OPEN', scheduledEnd:ts(2), actualEnd:null, periodEndDeadline:ts(6), hasDownstream:false, downstreamRefs:'', assignee:'James Thornton' },
    { ID:'t7', taskRef:'T-007', description:'Profit Centre Reallocation', legalEntity:'SBE-DE', status:'BLOCKED', scheduledEnd:ts(-2), actualEnd:null, periodEndDeadline:ts(6), hasDownstream:false, downstreamRefs:'', assignee:'Anna Bauer' },
    { ID:'t8', taskRef:'T-008', description:'Financial Statements Draft', legalEntity:'SBE-DE', status:'OPEN', scheduledEnd:ts(3), actualEnd:null, periodEndDeadline:ts(6), hasDownstream:false, downstreamRefs:'', assignee:'Maria Schmidt' },
    { ID:'t9', taskRef:'T-009', description:'Group Reporting Package', legalEntity:'SBE-GROUP', status:'OPEN', scheduledEnd:ts(4), actualEnd:null, periodEndDeadline:ts(6), hasDownstream:false, downstreamRefs:'', assignee:'Chief Financial Officer' },
    { ID:'t10', taskRef:'T-010', description:'Bank Statement Reconciliation – EUR Account', legalEntity:'SBE-FR', status:'OPEN', scheduledEnd:ts(-6), actualEnd:null, periodEndDeadline:ts(1.5), hasDownstream:true, downstreamRefs:'T-004, T-008', assignee:'Sophie Leclerc' }
  ];

  const docs = [
    { ID:'d1', docRef:'FI-2024-001', legalEntity:'SBE-DE', documentType:'General Ledger Posting', amount:320000, currency:'EUR', postingStatus:'POSTED', errorReason:'', postingDate:today },
    { ID:'d2', docRef:'FI-2024-002', legalEntity:'SBE-UK', documentType:'Accounts Payable Invoice', amount:87500, currency:'EUR', postingStatus:'POSTED', errorReason:'', postingDate:today },
    { ID:'d3', docRef:'FI-2024-003', legalEntity:'SBE-DE', documentType:'Intercompany Transfer', amount:245000, currency:'EUR', postingStatus:'ERROR', errorReason:'Account assignment mismatch – profit centre SBE-DE-PROD not found in target company code', postingDate:today },
    { ID:'d4', docRef:'FI-2024-004', legalEntity:'SBE-FR', documentType:'Revenue Accrual', amount:56000, currency:'EUR', postingStatus:'POSTED', errorReason:'', postingDate:today },
    { ID:'d5', docRef:'FI-2024-005', legalEntity:'SBE-UK', documentType:'Fixed Asset Posting', amount:410000, currency:'EUR', postingStatus:'POSTED', errorReason:'', postingDate:today },
    { ID:'d6', docRef:'FI-2024-006', legalEntity:'SBE-DE', documentType:'Accounts Receivable Clearing', amount:29800, currency:'EUR', postingStatus:'PENDING', errorReason:'', postingDate:today },
    { ID:'d7', docRef:'FI-2024-007', legalEntity:'SBE-FR', documentType:'Tax Posting', amount:178500, currency:'EUR', postingStatus:'ERROR', errorReason:'Tax code validation failed – FR-VAT-20 not configured for fiscal year 2024 in company code SBE-FR', postingDate:today },
    { ID:'d8', docRef:'FI-2024-008', legalEntity:'SBE-UK', documentType:'Bank Reconciliation Entry', amount:125000, currency:'EUR', postingStatus:'POSTED', errorReason:'', postingDate:today },
    { ID:'d9', docRef:'FI-2024-009', legalEntity:'SBE-GROUP', documentType:'Elimination Entry', amount:530000, currency:'EUR', postingStatus:'POSTED', errorReason:'', postingDate:today },
    { ID:'d10', docRef:'FI-2024-010', legalEntity:'SBE-DE', documentType:'Depreciation Run Entry', amount:42000, currency:'EUR', postingStatus:'ERROR', errorReason:'Asset class configuration error – asset class 1200 not assigned to depreciation area 01', postingDate:today }
  ];

  return { tasks, docs };
}

// ── Escalation engine ────────────────────────────────────────────────────────
function runEscalationRules() {
  const { tasks, docs } = buildData();
  const now = new Date();
  const fourHoursMs = 4 * 3600000;
  const HIGH_VALUE  = 100000;
  const escalations = [];

  // Rule 1 — Critical
  for (const d of docs) {
    if (d.postingStatus === 'ERROR' && d.amount > HIGH_VALUE) {
      escalations.push({
        type:'CRITICAL', priority:1, ref:d.docRef, entityType:'Document',
        legalEntity:d.legalEntity, amount:d.amount, currency:d.currency,
        reason:`Posting error on ${d.docRef} (${d.documentType}): ${d.errorReason}`,
        threshold:`Amount ${fmt(d.amount,d.currency)} exceeds the €100,000 threshold`,
        recommendation:[
          `Immediately review ${d.docRef} in the Financial Closing Cockpit.`,
          `Contact the responsible accountant for ${d.legalEntity} to resolve the error.`,
          `Confirm correction and re-post before the period-end deadline.`,
          `Notify the financial controller if unresolved within 30 minutes.`
        ]
      });
    }
  }

  // Rule 2 — Urgent
  for (const t of tasks) {
    if ((t.status === 'OPEN' || t.status === 'IN_PROGRESS') && t.periodEndDeadline) {
      const dl   = new Date(t.periodEndDeadline);
      const rem  = dl - now;
      if (rem > 0 && rem < fourHoursMs) {
        const hrs  = Math.floor(rem / 3600000);
        const mins = Math.round((rem % 3600000) / 60000);
        escalations.push({
          type:'URGENT', priority:2, ref:t.taskRef, entityType:'Task',
          legalEntity:t.legalEntity,
          reason:`Task ${t.taskRef} "${t.description}" is incomplete with less than 4 hours to the period-end deadline.`,
          threshold:`${hrs}h ${mins}m remaining before deadline (${fmtDate(dl)})`,
          recommendation:[
            `Immediately contact assignee ${t.assignee||'unassigned'} to confirm progress.`,
            `Escalate to the finance team lead if completion is not achievable within the hour.`,
            `Assess whether downstream tasks can begin in parallel to reduce delay.`
          ]
        });
      }
    }
  }

  // Rule 3 — Flag
  for (const t of tasks) {
    if (['OPEN','IN_PROGRESS','BLOCKED'].includes(t.status) && t.scheduledEnd && t.hasDownstream) {
      const sch = new Date(t.scheduledEnd);
      if (sch < now) {
        const overdueMin = Math.round((now - sch) / 60000);
        escalations.push({
          type:'FLAG', priority:3, ref:t.taskRef, entityType:'Task',
          legalEntity:t.legalEntity,
          reason:`Task ${t.taskRef} "${t.description}" is overdue by ${overdueMin} minutes and blocking: ${t.downstreamRefs}.`,
          threshold:`Scheduled completion was ${fmtDate(sch)} — now ${overdueMin} min overdue`,
          recommendation:[
            `Review current status with assignee ${t.assignee||'unassigned'}.`,
            `Notify owners of dependent tasks (${t.downstreamRefs}) about the delay.`,
            `Consider reassigning or providing additional resources.`
          ]
        });
      }
    }
  }

  escalations.sort((a,b) => a.priority - b.priority || a.ref.localeCompare(b.ref));
  return { escalations, tasks, docs };
}

function fmt(amount, currency='EUR') {
  return new Intl.NumberFormat('de-DE',{style:'currency',currency}).format(amount);
}
function fmtDate(d) {
  return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(d));
}

function buildReport(escalations) {
  if (!escalations.length) return '✅ No escalation issues detected. All closing tasks and documents are within acceptable thresholds.';
  const g = { CRITICAL:[], URGENT:[], FLAG:[] };
  for (const e of escalations) g[e.type].push(e);
  let r = `# Stonebridge Equipment Group — Closing Escalation Report\nGenerated: ${new Date().toLocaleString('en-GB')}\n\n`;
  if (g.CRITICAL.length) {
    r += `## 🔴 Critical – Immediate Action Required (${g.CRITICAL.length})\n\n`;
    for (const e of g.CRITICAL) { r += `### ${e.ref} | ${e.legalEntity}\n**Reason:** ${e.reason}\n**Threshold:** ${e.threshold}\n**Recommended Actions:**\n`; e.recommendation.forEach((x,i)=>r+=`${i+1}. ${x}\n`); r+='\n'; }
  }
  if (g.URGENT.length) {
    r += `## 🟠 Urgent – Deadline Imminent (${g.URGENT.length})\n\n`;
    for (const e of g.URGENT) { r += `### ${e.ref} | ${e.legalEntity}\n**Reason:** ${e.reason}\n**Threshold:** ${e.threshold}\n**Recommended Actions:**\n`; e.recommendation.forEach((x,i)=>r+=`${i+1}. ${x}\n`); r+='\n'; }
  }
  if (g.FLAG.length) {
    r += `## 🟡 Flag – Schedule Risk (${g.FLAG.length})\n\n`;
    for (const e of g.FLAG) { r += `### ${e.ref} | ${e.legalEntity}\n**Reason:** ${e.reason}\n**Threshold:** ${e.threshold}\n**Recommended Actions:**\n`; e.recommendation.forEach((x,i)=>r+=`${i+1}. ${x}\n`); r+='\n'; }
  }
  r += `**Total Issues: ${escalations.length}** | Critical: ${g.CRITICAL.length} | Urgent: ${g.URGENT.length} | Flag: ${g.FLAG.length}\n\n`;
  r += `*All recommendations are advisory. No changes have been made to any financial system.*`;
  return r;
}

// ── Chat session store ───────────────────────────────────────────────────────
const sessions = {};

function chat(sessionId, message) {
  if (!sessions[sessionId]) sessions[sessionId] = [];
  sessions[sessionId].push({ role:'user', content:message });

  const { escalations, tasks, docs } = runEscalationRules();
  const msg = message.toLowerCase();
  let reply = '';

  // Write-action refusal
  if (/\b(post|re-post|repost|correct|complete|approve|modify|update|change|fix|submit)\b/.test(msg) &&
      /\b(document|task|entry|posting|schedule|invoice|fi-)\b/.test(msg)) {
    reply = `I'm sorry, but I'm unable to perform that action. I operate in **strictly read-only advisory mode**.\n\nI cannot:\n- Post or correct financial documents\n- Complete or approve closing tasks\n- Modify the closing schedule\n\nAll my recommendations are advisory. No changes have been made to any financial system.\n\n**What I can do:** I can tell you exactly what needs to be fixed and who should do it. Would you like the recommended next steps for this item?`;
  }
  // High-value posting errors (Prompt 1)
  else if (/high.value|failed to post|posting error|failed.*post|documents.*fail|error.*post|post.*error|critical.*doc|critical.*post/i.test(msg)) {
    const critical = escalations.filter(e => e.type === 'CRITICAL');
    if (!critical.length) {
      reply = `✅ **No high-value posting errors detected.**\n\nAll closing documents with posting errors are below the €100,000 threshold and do not require immediate escalation.`;
    } else {
      reply = `I have identified **${critical.length} high-value document(s) that failed to post** and are classified as **🔴 Critical – Immediate Action Required**:\n\n`;
      for (const e of critical) {
        reply += `---\n### ${e.ref} | ${e.legalEntity}\n`;
        reply += `**Amount:** ${fmt(e.amount, e.currency)}\n`;
        reply += `**Type:** ${docs.find(d=>d.docRef===e.ref)?.documentType||''}\n`;
        reply += `**Error Reason:** ${docs.find(d=>d.docRef===e.ref)?.errorReason||''}\n`;
        reply += `**Why Critical:** ${e.threshold}\n\n`;
        reply += `**Recommended Actions:**\n`;
        e.recommendation.forEach((r,i) => { reply += `${i+1}. ${r}\n`; });
        reply += '\n';
      }
      reply += `*All recommendations are advisory. No changes have been made to any financial system.*`;
    }
  }
  // Specific document lookup (Prompt 2)
  else if (/fi-2024-\d+/i.test(msg)) {
    const docRef = msg.match(/fi-2024-\d+/i)[0].toUpperCase();
    const doc    = docs.find(d => d.docRef.toUpperCase() === docRef);
    if (!doc) {
      reply = `I could not find document **${docRef}** in the current closing period data. Please verify the reference number.`;
    } else {
      const esc = escalations.filter(e => e.ref === doc.docRef);
      reply = `## Document ${doc.docRef} — Status Report\n\n`;
      reply += `| Field | Value |\n|---|---|\n`;
      reply += `| **Document Type** | ${doc.documentType} |\n`;
      reply += `| **Legal Entity** | ${doc.legalEntity} |\n`;
      reply += `| **Amount** | ${fmt(doc.amount, doc.currency)} |\n`;
      reply += `| **Posting Status** | ${doc.postingStatus} |\n`;
      if (doc.errorReason) reply += `| **Error Reason** | ${doc.errorReason} |\n`;
      reply += `| **Posting Date** | ${doc.postingDate} |\n\n`;

      if (esc.length) {
        reply += `### 🔴 Escalation Status\n`;
        for (const e of esc) {
          reply += `**Classification:** ${e.type === 'CRITICAL' ? '🔴 Critical – Immediate Action Required' : e.type === 'URGENT' ? '🟠 Urgent – Deadline Imminent' : '🟡 Flag – Schedule Risk'}\n\n`;
          reply += `**Reason:** ${e.reason}\n\n`;
          reply += `**Threshold:** ${e.threshold}\n\n`;
          reply += `**Recommended Actions:**\n`;
          e.recommendation.forEach((r,i) => { reply += `${i+1}. ${r}\n`; });
        }
      } else {
        reply += `### ✅ No Escalation\nThis document does not currently trigger any escalation rules.`;
      }
      reply += `\n\n*All recommendations are advisory. No changes have been made to any financial system.*`;
    }
  }
  // Full report
  else if (/report|summary|all issue|show all|overview|escalation/i.test(msg)) {
    reply = buildReport(escalations);
  }
  // Urgent/deadline
  else if (/urgent|deadline|hours|imminent/i.test(msg)) {
    const urgent = escalations.filter(e => e.type === 'URGENT');
    if (!urgent.length) {
      reply = `✅ No tasks are currently within the 4-hour deadline warning window.`;
    } else {
      reply = `**${urgent.length} task(s) are classified as 🟠 Urgent – Deadline Imminent:**\n\n`;
      for (const e of urgent) {
        reply += `**${e.ref}** (${e.legalEntity}) — ${e.threshold}\n${e.reason}\n\n`;
        reply += `Next step: ${e.recommendation[0]}\n\n`;
      }
      reply += `*All recommendations are advisory. No changes have been made to any financial system.*`;
    }
  }
  // Flag/overdue
  else if (/flag|overdue|block|schedule|downstream/i.test(msg)) {
    const flags = escalations.filter(e => e.type === 'FLAG');
    if (!flags.length) {
      reply = `✅ No overdue tasks with downstream blocking detected.`;
    } else {
      reply = `**${flags.length} task(s) are classified as 🟡 Flag – Schedule Risk:**\n\n`;
      for (const e of flags) {
        reply += `**${e.ref}** (${e.legalEntity}) — ${e.threshold}\n${e.reason}\n\n`;
        reply += `Next step: ${e.recommendation[0]}\n\n`;
      }
      reply += `*All recommendations are advisory. No changes have been made to any financial system.*`;
    }
  }
  // Task lookup
  else if (/t-\d+/i.test(msg)) {
    const taskRef = msg.match(/t-\d+/i)[0].toUpperCase();
    const task    = tasks.find(t => t.taskRef.toUpperCase() === taskRef);
    if (!task) {
      reply = `I could not find task **${taskRef}**. Please verify the task reference.`;
    } else {
      const esc = escalations.filter(e => e.ref === task.taskRef);
      reply = `## Task ${task.taskRef} — Status Report\n\n`;
      reply += `| Field | Value |\n|---|---|\n`;
      reply += `| **Description** | ${task.description} |\n`;
      reply += `| **Legal Entity** | ${task.legalEntity} |\n`;
      reply += `| **Status** | ${task.status} |\n`;
      reply += `| **Assignee** | ${task.assignee||'Unassigned'} |\n`;
      if (task.downstreamRefs) reply += `| **Downstream Tasks** | ${task.downstreamRefs} |\n`;
      reply += '\n';
      if (esc.length) {
        for (const e of esc) {
          reply += `**Escalation:** ${e.type === 'CRITICAL' ? '🔴 Critical' : e.type === 'URGENT' ? '🟠 Urgent' : '🟡 Flag'}\n`;
          reply += `**Reason:** ${e.reason}\n`;
          reply += `**Threshold:** ${e.threshold}\n\n`;
          reply += `**Recommended Actions:**\n`;
          e.recommendation.forEach((r,i) => { reply += `${i+1}. ${r}\n`; });
        }
      } else {
        reply += `✅ No escalation triggered for this task.`;
      }
      reply += `\n\n*All recommendations are advisory. No changes have been made to any financial system.*`;
    }
  }
  // Recommended next steps
  else if (/recommend|next step|what should|action|priorit/i.test(msg)) {
    const g = { CRITICAL:[], URGENT:[], FLAG:[] };
    for (const e of escalations) g[e.type].push(e);
    reply = `## Prioritised Action Plan\n\n`;
    reply += `**🔴 1. Critical — Resolve First (${g.CRITICAL.length} issue${g.CRITICAL.length!==1?'s':''})**\n`;
    reply += g.CRITICAL.length ? g.CRITICAL.map(e=>`• **${e.ref}**: ${e.recommendation[0]}`).join('\n') : '• No critical issues at this time.';
    reply += `\n\n**🟠 2. Urgent — Within the Next Hour (${g.URGENT.length} issue${g.URGENT.length!==1?'s':''})**\n`;
    reply += g.URGENT.length ? g.URGENT.map(e=>`• **${e.ref}**: ${e.recommendation[0]}`).join('\n') : '• No urgent issues at this time.';
    reply += `\n\n**🟡 3. Flag — Monitor & Mitigate (${g.FLAG.length} issue${g.FLAG.length!==1?'s':''})**\n`;
    reply += g.FLAG.length ? g.FLAG.map(e=>`• **${e.ref}**: ${e.recommendation[0]}`).join('\n') : '• No schedule flags at this time.';
    reply += `\n\n*All recommendations are advisory. No changes have been made to any financial system.*`;
  }
  // Default
  else {
    const total = escalations.length;
    const g = { CRITICAL:[], URGENT:[], FLAG:[] };
    for (const e of escalations) g[e.type].push(e);
    reply = `I am the **Stonebridge Financial Closing Assistant** operating in read-only advisory mode.\n\nCurrently I have identified **${total} escalation issue${total!==1?'s':''}**:\n🔴 ${g.CRITICAL.length} Critical · 🟠 ${g.URGENT.length} Urgent · 🟡 ${g.FLAG.length} Flag\n\nYou can ask me:\n- "Show me all high-value documents that failed to post"\n- "Which tasks are approaching the deadline?"\n- "What tasks are overdue and blocking others?"\n- "What is the status of FI-2024-003?"\n- "Tell me about task T-002"\n- "Generate the full escalation report"`;
  }

  sessions[sessionId].push({ role:'assistant', content:reply });
  return reply;
}

// ── REST endpoints (OData-compatible for the existing UI) ────────────────────
app.get('/api/closing/ClosingTasks',    (_, res) => res.json({ value: buildData().tasks }));
app.get('/api/closing/ClosingDocuments',(_, res) => res.json({ value: buildData().docs  }));

app.post('/api/closing/generateEscalationReport', (_, res) => {
  const { escalations } = runEscalationRules();
  res.json({ value: buildReport(escalations) });
});

app.post('/api/closing/chat', (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error:'sessionId and message required' });
  res.json({ value: chat(sessionId, message) });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4004;
app.listen(PORT, () => console.log(`✅ Closing Assistant running at http://localhost:${PORT}`));
