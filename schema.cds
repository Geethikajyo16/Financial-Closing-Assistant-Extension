namespace stonebridge.closing;

using { cuid, managed } from '@sap/cds/common';

/**
 * Closing Tasks – represents period-end tasks in the closing cockpit.
 * Used for deadline proximity checks and overdue detection.
 */
entity ClosingTasks {
  key ID               : UUID;
      taskRef          : String(20);  // Human-readable reference, e.g. T-001
      description      : String(200);
      legalEntity      : String(10);
      status           : String(20);  // OPEN, IN_PROGRESS, COMPLETED, BLOCKED
      scheduledEnd     : DateTime;    // When the task should be completed
      actualEnd        : DateTime;    // Null if not yet completed
      periodEndDeadline: DateTime;    // Official period-end close deadline
      hasDownstream    : Boolean;     // Whether downstream tasks depend on this
      downstreamRefs   : String(500); // Comma-separated task refs
      assignee         : String(100);
}

/**
 * Closing Documents – represents posted/failed financial documents.
 * Used for high-value posting error detection.
 */
entity ClosingDocuments {
  key ID             : UUID;
      docRef         : String(20);   // e.g. FI-20240101-001
      legalEntity    : String(10);
      documentType   : String(50);
      amount         : Decimal(18,2);
      currency       : String(3);
      postingStatus  : String(20);   // POSTED, ERROR, PENDING
      errorReason    : String(500);
      postingDate    : Date;
      accountingPeriod: String(7);   // e.g. 2024-01
}

/**
 * Chat Messages – stores the conversation history for the assistant.
 */
entity ChatMessages : cuid {
      sessionId      : String(50);
      role           : String(10);   // user | assistant
      content        : LargeString;
      timestamp      : DateTime;
}
