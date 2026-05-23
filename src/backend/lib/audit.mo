import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Text "mo:core/Text";
import ActivityTypes "../types/activity";
import Order "mo:core/Order";

module {
  public type ActivityEvent = ActivityTypes.ActivityEvent;
  public type ActivityEventView = ActivityTypes.ActivityEventView;
  public type ActivityEventType = ActivityTypes.ActivityEventType;
  public type ActivityActorRole = ActivityTypes.ActivityActorRole;
  public type ActivityMap = Map.Map<Text, ActivityEvent>;

  public type AuditSearchQuery = {
    searchText : ?Text;
    role : ?Text;
    eventType : ?Text;
    severity : ?Text;
    fromTimestamp : ?Int;
    toTimestamp : ?Int;
    offset : Nat;
    limit : Nat;
  };

  public type WorkflowStage = {
    stageType : Text;
    events : [ActivityEventView];
    status : Text;
    actorRole : Text;
  };

  public type WorkflowChain = {
    medicine : ?{ id : Text; name : Text };
    stages : [WorkflowStage];
  };

  /// Derive a severity label from an activity event type and its metadata.
  public func deriveSeverity(eventType : ActivityEventType, metadata : ?Text) : Text {
    switch (eventType) {
      // Critical
      case (#ConsentRevoked or #RoleChanged or #SystemAlert) "critical";
      // Alert
      case (#DoseMarkedTaken) {
        // If metadata contains onTime=false → alert; otherwise info
        switch (metadata) {
          case (?m) {
            if (m.contains(#text "onTime\":\"false")) "alert"
            else if (m.contains(#text "\"onTime\":false")) "alert"
            else if (m.contains(#text "isOnTime\":\"false")) "alert"
            else if (m.contains(#text "\"isOnTime\":false")) "alert"
            else "info";
          };
          case null "info";
        };
      };
      case (#PatientAdherenceViewed) "alert";
      case (#EcosystemSyncStats) {
        switch (metadata) {
          case (?m) {
            if (m.contains(#text "error")) "alert" else "info";
          };
          case null "info";
        };
      };
      // Warning
      case (#ReminderMissed) "warning";
      case (#ExpiryAlertTriggered or #ExpiryWarningTriggered) "warning";
      // Info — everything else
      case (_) "info";
    };
  };

  /// Convert actor role variant to its Text label.
  func roleToText(role : ActivityActorRole) : Text {
    switch (role) {
      case (#Patient) "Patient";
      case (#Pharmacy) "Pharmacy";
      case (#Hospital) "Hospital";
      case (#Diagnostic) "Diagnostic";
      case (#Admin) "Admin";
    };
  };

  /// Convert event type variant to its Text label for filtering.
  func eventTypeToText(et : ActivityEventType) : Text {
    switch (et) {
      case (#MedicineAddedManually) "MedicineAddedManually";
      case (#MedicineSyncedFromPharmacy) "MedicineSyncedFromPharmacy";
      case (#QRScanCompleted) "QRScanCompleted";
      case (#ReminderCreated) "ReminderCreated";
      case (#ReminderCompleted) "ReminderCompleted";
      case (#ReminderMissed) "ReminderMissed";
      case (#DoseMarkedTaken) "DoseMarkedTaken";
      case (#DiagnosticBooked) "DiagnosticBooked";
      case (#ReportViewedDownloaded) "ReportViewedDownloaded";
      case (#ConsentGranted) "ConsentGranted";
      case (#ConsentRevoked) "ConsentRevoked";
      case (#TelegramConnected) "TelegramConnected";
      case (#TelegramDisconnected) "TelegramDisconnected";
      case (#InventoryItemAdded) "InventoryItemAdded";
      case (#MedicineSold) "MedicineSold";
      case (#MedicineSyncedToPatient) "MedicineSyncedToPatient";
      case (#CSVUploaded) "CSVUploaded";
      case (#RestockFulfilled) "RestockFulfilled";
      case (#InventoryStatusChanged) "InventoryStatusChanged";
      case (#ExpiryAlertTriggered) "ExpiryAlertTriggered";
      case (#HospitalMedicineAdded) "HospitalMedicineAdded";
      case (#HospitalInventoryUpdated) "HospitalInventoryUpdated";
      case (#PatientAdherenceViewed) "PatientAdherenceViewed";
      case (#ConsentAccessGranted) "ConsentAccessGranted";
      case (#ConsentAccessRevoked) "ConsentAccessRevoked";
      case (#ExpiryWarningTriggered) "ExpiryWarningTriggered";
      case (#BookingReceived) "BookingReceived";
      case (#BookingAccepted) "BookingAccepted";
      case (#SampleCollected) "SampleCollected";
      case (#TestProcessingStarted) "TestProcessingStarted";
      case (#ReportUploaded) "ReportUploaded";
      case (#ReportCompleted) "ReportCompleted";
      case (#UserCreated) "UserCreated";
      case (#RoleChanged) "RoleChanged";
      case (#SystemAlert) "SystemAlert";
      case (#EcosystemSyncStats) "EcosystemSyncStats";
    };
  };

  func toView(e : ActivityEvent) : ActivityEventView = {
    id = e.id;
    eventActor = e.eventActor;
    eventType = e.eventType;
    resourceId = e.resourceId;
    metadata = e.metadata;
    timestamp = e.timestamp;
    readBy = e.readBy;
  };

  /// Paginated, filterable audit log search.
  public func searchAuditLog(
    activities : ActivityMap,
    params : AuditSearchQuery,
  ) : [ActivityEventView] {
    let filtered = activities.values()
      .filter(func(e : ActivityEvent) : Bool {
        // Role filter
        switch (params.role) {
          case (?r) {
            if (roleToText(e.eventActor.role) != r) return false;
          };
          case null {};
        };
        // EventType filter
        switch (params.eventType) {
          case (?et) {
            if (eventTypeToText(e.eventType) != et) return false;
          };
          case null {};
        };
        // Severity filter
        switch (params.severity) {
          case (?sev) {
            if (deriveSeverity(e.eventType, e.metadata) != sev) return false;
          };
          case null {};
        };
        // From timestamp
        switch (params.fromTimestamp) {
          case (?from) {
            if (e.timestamp < from) return false;
          };
          case null {};
        };
        // To timestamp
        switch (params.toTimestamp) {
          case (?to) {
            if (e.timestamp > to) return false;
          };
          case null {};
        };
        // Text query — match against metadata or resourceId
        switch (params.searchText) {
          case (?q) {
            let ql = q.toLower();
            let inMeta = switch (e.metadata) {
              case (?m) m.toLower().contains(#text ql);
              case null false;
            };
            let inResource = switch (e.resourceId) {
              case (?r) r.toLower().contains(#text ql);
              case null false;
            };
            let inActor = e.eventActor.principalId.toText().toLower().contains(#text ql);
            let inType = eventTypeToText(e.eventType).toLower().contains(#text ql);
            if (not (inMeta or inResource or inActor or inType)) return false;
          };
          case null {};
        };
        true;
      })
      .toArray();
    let sorted = filtered.sort(func(a : ActivityEvent, b : ActivityEvent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
    let views = sorted.map(toView);
    let total = views.size();
    if (params.offset >= total) return [];
    let endIdx = if (params.offset + params.limit > total) total else params.offset + params.limit;
    Array.tabulate<ActivityEventView>(endIdx - params.offset, func i = views[params.offset + i]);
  };

  /// Return all events attributed to a specific actor principal.
  public func getAuditEventsByActor(
    activities : ActivityMap,
    actorId : Text,
  ) : [ActivityEventView] {
    let matched = activities.values()
      .filter(func(e : ActivityEvent) : Bool {
        e.eventActor.principalId.toText() == actorId
      })
      .toArray();
    let sorted = matched.sort(func(a : ActivityEvent, b : ActivityEvent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
    sorted.map<ActivityEvent, ActivityEventView>(toView);
  };

  // ── Workflow chain ──────────────────────────────────────────────────────────

  /// Assign a medicine lifecycle event to a workflow stage name.
  func stageForEvent(et : ActivityEventType) : Text {
    switch (et) {
      case (#MedicineSold) "PharmacySale";
      case (#MedicineAddedManually or #MedicineSyncedFromPharmacy or #QRScanCompleted
           or #MedicineSyncedToPatient or #HospitalMedicineAdded) "PatientInventory";
      case (#ReminderCreated) "ReminderSetup";
      case (#DoseMarkedTaken) "DoseLogging";
      case (#ReminderCompleted or #ReminderMissed or #PatientAdherenceViewed) "AdherenceTracking";
      case (#ExpiryAlertTriggered or #ExpiryWarningTriggered) "ExpiryMonitoring";
      case (#RestockFulfilled or #InventoryStatusChanged or #InventoryItemAdded) "ReplacementReorder";
      case (_) "PatientInventory";
    };
  };

  /// Determine stage status from its events.
  func stageStatus(events : [ActivityEventView]) : Text {
    if (events.size() == 0) return "pending";
    // Look for warning / alert level events in this stage
    for (e in events.vals()) {
      let sev = deriveSeverity(e.eventType, e.metadata);
      if (sev == "critical") return "critical";
    };
    for (e in events.vals()) {
      let sev = deriveSeverity(e.eventType, e.metadata);
      if (sev == "alert") return "alert";
    };
    for (e in events.vals()) {
      let sev = deriveSeverity(e.eventType, e.metadata);
      if (sev == "warning") return "warning";
    };
    "active";
  };

  /// Return the dominant actor role for a stage (most-represented role).
  func dominantRole(events : [ActivityEventView]) : Text {
    if (events.size() == 0) return "Patient";
    roleToText(events[0].eventActor.role);
  };

  // Stage ordering
  let stageOrder : [Text] = [
    "PharmacySale",
    "PatientInventory",
    "ReminderSetup",
    "DoseLogging",
    "AdherenceTracking",
    "ExpiryMonitoring",
    "ReplacementReorder",
  ];

  /// Build a structured lifecycle workflow chain for a given medicine.
  public func getWorkflowChain(
    activities : ActivityMap,
    medicineId : Text,
  ) : WorkflowChain {
    // Collect all events for this medicine
    let matched = activities.values()
      .filter(func(e : ActivityEvent) : Bool {
        switch (e.resourceId) {
          case (?rid) rid == medicineId;
          case null false;
        };
      })
      .toArray();

    // Build stage buckets using a Map
    let stageBuckets = Map.empty<Text, [ActivityEventView]>();
    for (e in matched.vals()) {
      let stage = stageForEvent(e.eventType);
      let view = toView(e);
      let existing = switch (stageBuckets.get(stage)) {
        case (?arr) arr;
        case null [];
      };
      stageBuckets.add(stage, existing.concat([view]));
    };

    // Build ordered stages array
    let stages = Array.tabulate(
      stageOrder.size(),
      func(i : Nat) : WorkflowStage {
        let stageName = stageOrder[i];
        let events = switch (stageBuckets.get(stageName)) {
          case (?arr) arr;
          case null [];
        };
        {
          stageType = stageName;
          events;
          status = stageStatus(events);
          actorRole = dominantRole(events);
        };
      },
    );

    {
      medicine = null; // medicine name lookup requires the medicines map; filled in the mixin layer
      stages;
    };
  };
};
