import Principal "mo:core/Principal";
import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import ActivityTypes "../types/activity";
import MedTypes "../types/medicines";
import ExportTypes "../types/exports";
import AuditLib "../lib/audit";
import ReportDataLib "../lib/reportData";

mixin (
  accessControlState : AccessControl.AccessControlState,
  activityEvents : Map.Map<Text, ActivityTypes.ActivityEvent>,
  medicines : Map.Map<Text, MedTypes.Medicine>,
  doseLogs : Map.Map<Text, MedTypes.DoseLog>,
  reminders : Map.Map<Text, MedTypes.Reminder>,
  exportLogsStore : Map.Map<Text, ExportTypes.ExportLogEntry>,
) {
  /// Paginated, filterable audit log search. Any authenticated caller.
  public shared query ({ caller }) func searchAuditLog(
    params : AuditLib.AuditSearchQuery,
  ) : async [AuditLib.ActivityEventView] {
    ignore (accessControlState, caller);
    AuditLib.searchAuditLog(activityEvents, params);
  };

  /// All events attributed to a specific actor/principal. Any authenticated caller.
  public shared query ({ caller }) func getAuditEventsByActor(
    actorId : Text,
  ) : async [AuditLib.ActivityEventView] {
    ignore (accessControlState, caller);
    AuditLib.getAuditEventsByActor(activityEvents, actorId);
  };

  /// Structured lifecycle workflow chain for a medicine.
  public shared query ({ caller }) func getWorkflowChain(
    medicineId : Text,
  ) : async AuditLib.WorkflowChain {
    ignore (accessControlState, caller);
    // Build raw chain from activity events
    let chain = AuditLib.getWorkflowChain(activityEvents, medicineId);
    // Enrich with medicine name if the record exists
    let enrichedMedicine : ?{ id : Text; name : Text } = switch (medicines.get(medicineId)) {
      case (?m) ?{ id = m.id; name = m.name };
      case null null;
    };
    { chain with medicine = enrichedMedicine };
  };

  /// Generate structured report preview data — role-aware.
  public shared query ({ caller }) func getReportData(
    reportType : Text,
  ) : async ReportDataLib.ReportData {
    ignore accessControlState;
    ReportDataLib.getReportData(
      caller,
      reportType,
      medicines,
      doseLogs,
      reminders,
      activityEvents,
      exportLogsStore,
    );
  };
};
