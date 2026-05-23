import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserTypes "../types/users";
import ExportTypes "../types/exports";
import ExportLogsLib "../lib/exportLogs";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, UserTypes.UserProfile>,
  exportLogs : Map.Map<Text, ExportTypes.ExportLogEntry>,
) {
  /// Log an export action performed by the caller.
  public shared ({ caller }) func logExport(
    req : ExportTypes.LogExportRequest,
  ) : async ExportTypes.ExportLogEntry {
    ExportLogsLib.logExport(caller, exportLogs, req);
  };

  /// Return the caller's own export log history (newest-first, max 100).
  public query ({ caller }) func getMyExportLogs() : async [ExportTypes.ExportLogEntry] {
    ExportLogsLib.getMyExportLogs(caller, exportLogs);
  };

  /// Return ALL export log entries — admin only.
  public query ({ caller }) func getAllExportLogs() : async [ExportTypes.ExportLogEntry] {
    switch (users.get(caller)) {
      case null Runtime.trap("Unauthorized");
      case (?profile) {
        if (profile.role != #Admin) Runtime.trap("Unauthorized");
        ExportLogsLib.getAllExportLogs(exportLogs);
      };
    };
  };

  /// Aggregated export analytics — available to any authenticated user.
  public query ({ caller }) func getExportAnalytics() : async {
    totalExports : Nat;
    successCount : Nat;
    failureCount : Nat;
    exportsByRole : [(Text, Nat)];
    exportsByFormat : [(Text, Nat)];
    exportsByType : [(Text, Nat)];
  } {
    ignore (accessControlState, caller);
    ExportLogsLib.getExportAnalytics(exportLogs);
  };

  /// Delete a specific export log entry owned by the caller.
  public shared ({ caller }) func deleteExportLog(id : Text) : async Bool {
    ExportLogsLib.deleteExportLog(caller, exportLogs, id);
  };
};
