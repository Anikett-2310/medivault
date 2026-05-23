import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Debug "mo:core/Debug";
import ExportTypes "../types/exports";
import Nat "mo:core/Nat";

module {
  /// Create a new ExportLogEntry and insert it into the map.
  public func logExport(
    caller : Principal,
    exportLogs : Map.Map<Text, ExportTypes.ExportLogEntry>,
    req : ExportTypes.LogExportRequest,
  ) : ExportTypes.ExportLogEntry {
    let id = debug_show(Time.now()) # "-" # caller.toText();
    let entry : ExportTypes.ExportLogEntry = {
      id;
      userId = caller;
      userRole = req.userRole;
      exportType = req.exportType;
      fileType = req.fileType;
      filtersApplied = req.filtersApplied;
      timestamp = Time.now();
      status = req.status;
      filename = req.filename;
      fileSizeBytes = req.fileSizeBytes;
      errorMessage = req.errorMessage;
    };
    exportLogs.add(id, entry);
    entry;
  };

  /// Return up to 100 of the caller's own log entries sorted newest-first.
  public func getMyExportLogs(
    caller : Principal,
    exportLogs : Map.Map<Text, ExportTypes.ExportLogEntry>,
  ) : [ExportTypes.ExportLogEntry] {
    let mine = exportLogs.entries()
      .filter(func((_, e)) { e.userId == caller })
      .map(func((_, e)) { e })
      .toArray();
    let sorted = mine.sort(
      func(a, b) { if (a.timestamp > b.timestamp) #less else if (a.timestamp < b.timestamp) #greater else #equal },
    );
    if (sorted.size() <= 100) sorted
    else Array.tabulate(Nat.min(100, sorted.size()), func(i : Nat) : ExportTypes.ExportLogEntry { sorted[i] });
  };

  /// Return ALL log entries sorted newest-first (admin use).
  public func getAllExportLogs(
    exportLogs : Map.Map<Text, ExportTypes.ExportLogEntry>,
  ) : [ExportTypes.ExportLogEntry] {
    let all = exportLogs.entries()
      .map(func((_, e)) { e })
      .toArray();
    all.sort<ExportTypes.ExportLogEntry>(
      func(a, b) { if (a.timestamp > b.timestamp) #less else if (a.timestamp < b.timestamp) #greater else #equal },
    );
  };

  /// Aggregated export analytics across the entire export log store.
  public func getExportAnalytics(
    exportLogs : Map.Map<Text, ExportTypes.ExportLogEntry>,
  ) : {
    totalExports : Nat;
    successCount : Nat;
    failureCount : Nat;
    exportsByRole : [(Text, Nat)];
    exportsByFormat : [(Text, Nat)];
    exportsByType : [(Text, Nat)];
  } {
    var successCount = 0;
    var failureCount = 0;
    let roleMap = Map.empty<Text, Nat>();
    let formatMap = Map.empty<Text, Nat>();
    let typeMap = Map.empty<Text, Nat>();

    exportLogs.values().forEach(func(e : ExportTypes.ExportLogEntry) {
      if (e.status == "success") { successCount += 1 } else { failureCount += 1 };

      let rolePrev = switch (roleMap.get(e.userRole)) { case (?n) n; case null 0 };
      roleMap.add(e.userRole, rolePrev + 1);

      let fmtPrev = switch (formatMap.get(e.fileType)) { case (?n) n; case null 0 };
      formatMap.add(e.fileType, fmtPrev + 1);

      let typPrev = switch (typeMap.get(e.exportType)) { case (?n) n; case null 0 };
      typeMap.add(e.exportType, typPrev + 1);
    });

    {
      totalExports = exportLogs.size();
      successCount;
      failureCount;
      exportsByRole = roleMap.entries().toArray();
      exportsByFormat = formatMap.entries().toArray();
      exportsByType = typeMap.entries().toArray();
    };
  };

  /// Delete the caller's own log entry by id. Returns true if deleted.
  public func deleteExportLog(
    caller : Principal,
    exportLogs : Map.Map<Text, ExportTypes.ExportLogEntry>,
    id : Text,
  ) : Bool {
    switch (exportLogs.get(id)) {
      case null false;
      case (?entry) {
        if (entry.userId == caller) {
          exportLogs.remove(id);
          true;
        } else {
          false;
        };
      };
    };
  };
};
