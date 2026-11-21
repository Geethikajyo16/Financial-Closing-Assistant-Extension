'use strict';

const cds = require('@sap/cds');

/**
 * Seeds mock financial closing data relative to the current timestamp.
 * This ensures the escalation rules always fire in a demo environment.
 */
module.exports = async function seedData() {
  const db = await cds.connect.to('db');
  const { ClosingTasks, ClosingDocuments } = db.entities('stonebridge.closing');

  const now = new Date();
  const ts  = (offsetHours) => new Date(now.getTime() + offsetHours * 3600000).toISOString();

  // ── Mock Closing Tasks ───────────────────────────────────────────────────
  // T-002: IN_PROGRESS, scheduled end 3 hours ago (overdue) + downstream → Rule 3
  // T-003: OPEN, deadline 2.5 hours from now (< 4h) → Rule 2
  // T-005: BLOCKED, scheduled end 5 hours ago + downstream → Rule 3
  // T-010: OPEN, deadline 1.5 hours from now (< 4h) → Rule 2
  await INSERT.into(ClosingTasks).entries([
    {
      ID              : 'a1000001-0000-0000-0000-000000000001',
      taskRef         : 'T-001',
      description     : 'Accounts Receivable Reconciliation',
      legalEntity     : 'SBE-DE',
      status          : 'COMPLETED',
      scheduledEnd    : ts(-8),
      actualEnd       : ts(-8.25),
      periodEndDeadline: ts(6),
      hasDownstream   : false,
      downstreamRefs  : '',
      assignee        : 'Maria Schmidt'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000002',
      taskRef         : 'T-002',
      description     : 'Intercompany Elimination – SBE-DE to SBE-UK',
      legalEntity     : 'SBE-DE',
      status          : 'IN_PROGRESS',
      scheduledEnd    : ts(-3),         // overdue by 3 hours
      actualEnd       : null,
      periodEndDeadline: ts(6),
      hasDownstream   : true,
      downstreamRefs  : 'T-005, T-007',
      assignee        : 'Klaus Weber'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000003',
      taskRef         : 'T-003',
      description     : 'Fixed Asset Depreciation Run',
      legalEntity     : 'SBE-UK',
      status          : 'OPEN',
      scheduledEnd    : ts(1),
      actualEnd       : null,
      periodEndDeadline: ts(2.5),       // only 2.5 hours to deadline → Rule 2
      hasDownstream   : true,
      downstreamRefs  : 'T-006',
      assignee        : 'James Thornton'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000004',
      taskRef         : 'T-004',
      description     : 'Accruals Posting – Marketing Spend',
      legalEntity     : 'SBE-FR',
      status          : 'IN_PROGRESS',
      scheduledEnd    : ts(-1),
      actualEnd       : null,
      periodEndDeadline: ts(6),
      hasDownstream   : false,
      downstreamRefs  : '',
      assignee        : 'Sophie Leclerc'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000005',
      taskRef         : 'T-005',
      description     : 'Consolidation Journal Entries',
      legalEntity     : 'SBE-DE',
      status          : 'BLOCKED',
      scheduledEnd    : ts(-5),         // overdue by 5 hours + downstream → Rule 3
      actualEnd       : null,
      periodEndDeadline: ts(6),
      hasDownstream   : true,
      downstreamRefs  : 'T-008, T-009',
      assignee        : 'Klaus Weber'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000006',
      taskRef         : 'T-006',
      description     : 'Tax Provision Calculation',
      legalEntity     : 'SBE-UK',
      status          : 'OPEN',
      scheduledEnd    : ts(2),
      actualEnd       : null,
      periodEndDeadline: ts(6),
      hasDownstream   : false,
      downstreamRefs  : '',
      assignee        : 'James Thornton'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000007',
      taskRef         : 'T-007',
      description     : 'Profit Centre Reallocation',
      legalEntity     : 'SBE-DE',
      status          : 'BLOCKED',
      scheduledEnd    : ts(-2),
      actualEnd       : null,
      periodEndDeadline: ts(6),
      hasDownstream   : false,
      downstreamRefs  : '',
      assignee        : 'Anna Bauer'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000008',
      taskRef         : 'T-008',
      description     : 'Financial Statements Draft',
      legalEntity     : 'SBE-DE',
      status          : 'OPEN',
      scheduledEnd    : ts(3),
      actualEnd       : null,
      periodEndDeadline: ts(6),
      hasDownstream   : false,
      downstreamRefs  : '',
      assignee        : 'Maria Schmidt'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000009',
      taskRef         : 'T-009',
      description     : 'Group Reporting Package',
      legalEntity     : 'SBE-GROUP',
      status          : 'OPEN',
      scheduledEnd    : ts(4),
      actualEnd       : null,
      periodEndDeadline: ts(6),
      hasDownstream   : false,
      downstreamRefs  : '',
      assignee        : 'Chief Financial Officer'
    },
    {
      ID              : 'a1000001-0000-0000-0000-000000000010',
      taskRef         : 'T-010',
      description     : 'Bank Statement Reconciliation – EUR Account',
      legalEntity     : 'SBE-FR',
      status          : 'OPEN',
      scheduledEnd    : ts(-6),
      actualEnd       : null,
      periodEndDeadline: ts(1.5),       // only 1.5 hours to deadline → Rule 2
      hasDownstream   : true,
      downstreamRefs  : 'T-004, T-008',
      assignee        : 'Sophie Leclerc'
    }
  ]);

  // ── Mock Closing Documents ───────────────────────────────────────────────
  // FI-2024-003: Posting ERROR, €245,000 → Rule 1 (Critical)
  // FI-2024-007: Posting ERROR, €178,500 → Rule 1 (Critical)
  // FI-2024-010: Posting ERROR, €42,000  → below threshold, NOT escalated
  await INSERT.into(ClosingDocuments).entries([
    {
      ID             : 'b2000001-0000-0000-0000-000000000001',
      docRef         : 'FI-2024-001',
      legalEntity    : 'SBE-DE',
      documentType   : 'General Ledger Posting',
      amount         : 320000.00,
      currency       : 'EUR',
      postingStatus  : 'POSTED',
      errorReason    : '',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000002',
      docRef         : 'FI-2024-002',
      legalEntity    : 'SBE-UK',
      documentType   : 'Accounts Payable Invoice',
      amount         : 87500.00,
      currency       : 'EUR',
      postingStatus  : 'POSTED',
      errorReason    : '',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000003',
      docRef         : 'FI-2024-003',
      legalEntity    : 'SBE-DE',
      documentType   : 'Intercompany Transfer',
      amount         : 245000.00,
      currency       : 'EUR',
      postingStatus  : 'ERROR',
      errorReason    : 'Account assignment mismatch – profit centre SBE-DE-PROD not found in target company code',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000004',
      docRef         : 'FI-2024-004',
      legalEntity    : 'SBE-FR',
      documentType   : 'Revenue Accrual',
      amount         : 56000.00,
      currency       : 'EUR',
      postingStatus  : 'POSTED',
      errorReason    : '',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000005',
      docRef         : 'FI-2024-005',
      legalEntity    : 'SBE-UK',
      documentType   : 'Fixed Asset Posting',
      amount         : 410000.00,
      currency       : 'EUR',
      postingStatus  : 'POSTED',
      errorReason    : '',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000006',
      docRef         : 'FI-2024-006',
      legalEntity    : 'SBE-DE',
      documentType   : 'Accounts Receivable Clearing',
      amount         : 29800.00,
      currency       : 'EUR',
      postingStatus  : 'PENDING',
      errorReason    : '',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000007',
      docRef         : 'FI-2024-007',
      legalEntity    : 'SBE-FR',
      documentType   : 'Tax Posting',
      amount         : 178500.00,
      currency       : 'EUR',
      postingStatus  : 'ERROR',
      errorReason    : 'Tax code validation failed – FR-VAT-20 not configured for fiscal year 2024 in company code SBE-FR',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000008',
      docRef         : 'FI-2024-008',
      legalEntity    : 'SBE-UK',
      documentType   : 'Bank Reconciliation Entry',
      amount         : 125000.00,
      currency       : 'EUR',
      postingStatus  : 'POSTED',
      errorReason    : '',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000009',
      docRef         : 'FI-2024-009',
      legalEntity    : 'SBE-GROUP',
      documentType   : 'Elimination Entry',
      amount         : 530000.00,
      currency       : 'EUR',
      postingStatus  : 'POSTED',
      errorReason    : '',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    },
    {
      ID             : 'b2000001-0000-0000-0000-000000000010',
      docRef         : 'FI-2024-010',
      legalEntity    : 'SBE-DE',
      documentType   : 'Depreciation Run Entry',
      amount         : 42000.00,
      currency       : 'EUR',
      postingStatus  : 'ERROR',
      errorReason    : 'Asset class configuration error – asset class 1200 not assigned to depreciation area 01',
      postingDate    : new Date().toISOString().split('T')[0],
      accountingPeriod: '2024-01'
    }
  ]);

  console.log('✅ Mock closing data seeded successfully.');
};
