using { stonebridge.closing as db } from '../db/schema';

service ClosingService @(path:'/api/closing') {

  // Read-only access to closing data
  @readonly entity ClosingTasks     as projection on db.ClosingTasks;
  @readonly entity ClosingDocuments as projection on db.ClosingDocuments;

  // Actions
  action generateEscalationReport() returns LargeString;
  action chat(sessionId: String, message: String) returns LargeString;

  // Chat history (read + create)
  entity ChatMessages as projection on db.ChatMessages;
}
