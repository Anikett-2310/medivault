import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Array "mo:core/Array";
import ActivityTypes "../types/activity";
import ExportTypes "../types/exports";
import MedTypes "../types/medicines";
import Float "mo:core/Float";

module {
  public type ActivityMap = Map.Map<Text, ActivityTypes.ActivityEvent>;
  public type MedicinesMap = Map.Map<Text, MedTypes.Medicine>;
  public type DoseLogsMap = Map.Map<Text, MedTypes.DoseLog>;
  public type RemindersMap = Map.Map<Text, MedTypes.Reminder>;
  public type ExportMap = Map.Map<Text, ExportTypes.ExportLogEntry>;

  public type ReportDataPoint = {
    dataLabel : Text;
    value : Text;
    metadata : ?Text;
  };

  public type ReportData = {
    reportType : Text;
    generatedAt : Int;
    dataPoints : [ReportDataPoint];
  };

  // ── Internal helpers ────────────────────────────────────────────────────────

  func intToText(n : Int) : Text = debug_show(n);
  func natToText(n : Nat) : Text = debug_show(n);
  func floatOneDecimal(f : Float) : Text {
    // Truncate to one decimal place via integer arithmetic
    let scaled : Int = (f * 10.0).toInt();
    let whole : Int = scaled / 10;
    let frac : Int = if (scaled < 0) -(scaled % 10) else scaled % 10;
    intToText(whole) # "." # intToText(frac);
  };

  // ── Report builders ─────────────────────────────────────────────────────────

  /// adherence-history: per-medicine dose adherence for the caller.
  func adherenceHistory(
    caller : Principal,
    medicines : MedicinesMap,
    doseLogs : DoseLogsMap,
  ) : [ReportDataPoint] {
    let myMeds = medicines.values()
      .filter(func(m : MedTypes.Medicine) : Bool {
        Principal.equal(m.ownerPrincipal, caller)
      })
      .toArray();
    myMeds.map<MedTypes.Medicine, ReportDataPoint>(func(m) {
      let logs = doseLogs.values()
        .filter(func(l : MedTypes.DoseLog) : Bool {
          Principal.equal(l.userPrincipal, caller) and l.medicineId == m.id
        })
        .toArray();
      let taken = logs.size();
      let onTime = logs.filter(func(l : MedTypes.DoseLog) : Bool { l.isOnTime }).size();
      let score = if (taken == 0) "0.0" else floatOneDecimal(onTime.toFloat() / taken.toFloat() * 100.0);
      {
        dataLabel = m.name;
        value = score # "%";
        metadata = ?("taken:" # natToText(taken) # ",onTime:" # natToText(onTime));
      };
    });
  };

  /// medicine-inventory: list of caller's medicines with expiry status.
  func medicineInventory(
    caller : Principal,
    medicines : MedicinesMap,
  ) : [ReportDataPoint] {
    let now = Time.now();
    let thirtyDays : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    medicines.values()
      .filter(func(m : MedTypes.Medicine) : Bool {
        Principal.equal(m.ownerPrincipal, caller)
      })
      .map<MedTypes.Medicine, ReportDataPoint>(func(m) {
        let diff = m.expiryDate - now;
        let status = if (diff < 0) "expired"
          else if (diff <= thirtyDays) "expiring-soon"
          else "ok";
        {
          dataLabel = m.name;
          value = status;
          metadata = ?("dosage:" # m.dosage # ",frequency:" # m.frequency);
        };
      })
      .toArray();
  };

  /// reminder-logs: reminder completion stats per medicine.
  func reminderLogs(
    caller : Principal,
    reminders : RemindersMap,
    activities : ActivityMap,
  ) : [ReportDataPoint] {
    let myReminders = reminders.values()
      .filter(func(r : MedTypes.Reminder) : Bool {
        Principal.equal(r.userPrincipal, caller)
      })
      .toArray();
    myReminders.map<MedTypes.Reminder, ReportDataPoint>(func(r) {
      let completed = activities.values()
        .filter(func(e : ActivityTypes.ActivityEvent) : Bool {
          if (not Principal.equal(e.eventActor.principalId, caller)) return false;
          let isCompleted = switch (e.eventType) {
            case (#ReminderCompleted) true;
            case (_) false;
          };
          if (not isCompleted) return false;
          switch (e.resourceId) {
            case (?rid) rid == r.medicineId;
            case null false;
          };
        })
        .toArray()
        .size();
      let missed = activities.values()
        .filter(func(e : ActivityTypes.ActivityEvent) : Bool {
          if (not Principal.equal(e.eventActor.principalId, caller)) return false;
          let isMissed = switch (e.eventType) {
            case (#ReminderMissed) true;
            case (_) false;
          };
          if (not isMissed) return false;
          switch (e.resourceId) {
            case (?rid) rid == r.medicineId;
            case null false;
          };
        })
        .toArray()
        .size();
      {
        dataLabel = r.reminderTime;
        value = "completed:" # natToText(completed) # ",missed:" # natToText(missed);
        metadata = ?r.medicineId;
      };
    });
  };

  /// lifecycle-summary: count of each activity event type for the caller.
  func lifecycleSummary(
    caller : Principal,
    activities : ActivityMap,
  ) : [ReportDataPoint] {
    let myEvents = activities.values()
      .filter(func(e : ActivityTypes.ActivityEvent) : Bool {
        Principal.equal(e.eventActor.principalId, caller)
      })
      .toArray();
    // Count by eventType text label
    let counts = Map.empty<Text, Nat>();
    for (e in myEvents.vals()) {
      let key = debug_show(e.eventType);
      let prev = switch (counts.get(key)) { case (?n) n; case null 0 };
      counts.add(key, prev + 1);
    };
    counts.entries()
      .map<(Text, Nat), ReportDataPoint>(func((k, v)) {
        { dataLabel = k; value = natToText(v); metadata = null };
      })
      .toArray();
  };

  /// expiry-risk: all medicines expiring within 60 days (pharmacy role uses inventory,
  /// but here we use the shared medicines map which captures both personal and synced meds).
  func expiryRisk(
    medicines : MedicinesMap,
  ) : [ReportDataPoint] {
    let now = Time.now();
    let sixtyDays : Int = 60 * 24 * 60 * 60 * 1_000_000_000;
    medicines.values()
      .filter(func(m : MedTypes.Medicine) : Bool {
        let diff = m.expiryDate - now;
        diff >= 0 and diff <= sixtyDays;
      })
      .map<MedTypes.Medicine, ReportDataPoint>(func(m) {
        let daysLeft = (m.expiryDate - now) / 1_000_000_000 / 86400;
        {
          dataLabel = m.name;
          value = intToText(daysLeft) # " days";
          metadata = ?m.id;
        };
      })
      .toArray();
  };

  /// inventory-movement: count of medicine-sold / synced events.
  func inventoryMovement(
    activities : ActivityMap,
  ) : [ReportDataPoint] {
    let counts = Map.empty<Text, Nat>();
    activities.values().forEach(func(e : ActivityTypes.ActivityEvent) {
      switch (e.eventType) {
        case (#MedicineSold or #MedicineSyncedToPatient or #InventoryItemAdded
             or #RestockFulfilled) {
          let key = debug_show(e.eventType);
          let prev = switch (counts.get(key)) { case (?n) n; case null 0 };
          counts.add(key, prev + 1);
        };
        case (_) {};
      };
    });
    counts.entries()
      .map<(Text, Nat), ReportDataPoint>(func((k, v)) {
        { dataLabel = k; value = natToText(v); metadata = null };
      })
      .toArray();
  };

  /// sync-history: pharmacy sync events
  func syncHistory(
    activities : ActivityMap,
  ) : [ReportDataPoint] {
    activities.values()
      .filter(func(e : ActivityTypes.ActivityEvent) : Bool {
        switch (e.eventType) {
          case (#MedicineSyncedToPatient or #MedicineSyncedFromPharmacy) true;
          case (_) false;
        };
      })
      .map<ActivityTypes.ActivityEvent, ReportDataPoint>(func(e) {
        { dataLabel = debug_show(e.eventType); value = intToText(e.timestamp); metadata = e.resourceId };
      })
      .toArray();
  };

  /// compliance-report: adherence events per patient.
  func complianceReport(
    activities : ActivityMap,
  ) : [ReportDataPoint] {
    let counts = Map.empty<Text, Nat>();
    activities.values().forEach(func(e : ActivityTypes.ActivityEvent) {
      switch (e.eventType) {
        case (#DoseMarkedTaken) {
          let key = e.eventActor.principalId.toText();
          let prev = switch (counts.get(key)) { case (?n) n; case null 0 };
          counts.add(key, prev + 1);
        };
        case (_) {};
      };
    });
    counts.entries()
      .map<(Text, Nat), ReportDataPoint>(func((k, v)) {
        { dataLabel = k; value = natToText(v) # " doses"; metadata = null };
      })
      .toArray();
  };

  /// consent-report: consent granted/revoked events.
  func consentReport(
    activities : ActivityMap,
  ) : [ReportDataPoint] {
    activities.values()
      .filter(func(e : ActivityTypes.ActivityEvent) : Bool {
        switch (e.eventType) {
          case (#ConsentGranted or #ConsentRevoked or #ConsentAccessGranted
               or #ConsentAccessRevoked) true;
          case (_) false;
        };
      })
      .map<ActivityTypes.ActivityEvent, ReportDataPoint>(func(e) {
        {
          dataLabel = debug_show(e.eventType);
          value = e.eventActor.principalId.toText();
          metadata = e.resourceId;
        };
      })
      .toArray();
  };

  /// diagnostics-timeline: booking lifecycle events.
  func diagnosticsTimeline(
    activities : ActivityMap,
  ) : [ReportDataPoint] {
    activities.values()
      .filter(func(e : ActivityTypes.ActivityEvent) : Bool {
        switch (e.eventType) {
          case (#BookingReceived or #BookingAccepted or #SampleCollected
               or #TestProcessingStarted or #ReportUploaded or #ReportCompleted) true;
          case (_) false;
        };
      })
      .map<ActivityTypes.ActivityEvent, ReportDataPoint>(func(e) {
        { dataLabel = debug_show(e.eventType); value = intToText(e.timestamp); metadata = e.resourceId };
      })
      .toArray();
  };

  /// ecosystem-analytics: high-level event distribution across the platform.
  func ecosystemAnalytics(
    activities : ActivityMap,
    exportLogs : ExportMap,
  ) : [ReportDataPoint] {
    let counts = Map.empty<Text, Nat>();
    activities.values().forEach(func(e : ActivityTypes.ActivityEvent) {
      let key = debug_show(e.eventActor.role);
      let prev = switch (counts.get(key)) { case (?n) n; case null 0 };
      counts.add(key, prev + 1);
    });
    let rolePoints = counts.entries()
      .map<(Text, Nat), ReportDataPoint>(func((k, v)) {
      { dataLabel = "events:" # k; value = natToText(v); metadata = null };
      })
      .toArray();
    let exportCount = exportLogs.size();
    let exportPoint : ReportDataPoint = {
      dataLabel = "totalExports";
      value = natToText(exportCount);
      metadata = null;
    };
    rolePoints.concat([exportPoint]);
  };

  // ── Main dispatch ────────────────────────────────────────────────────────────

  public func getReportData(
    caller : Principal,
    reportType : Text,
    medicines : MedicinesMap,
    doseLogs : DoseLogsMap,
    reminders : RemindersMap,
    activities : ActivityMap,
    exportLogs : ExportMap,
  ) : ReportData {
    let dataPoints : [ReportDataPoint] = if (reportType == "adherence-history") {
      adherenceHistory(caller, medicines, doseLogs);
    } else if (reportType == "medicine-inventory") {
      medicineInventory(caller, medicines);
    } else if (reportType == "reminder-logs") {
      reminderLogs(caller, reminders, activities);
    } else if (reportType == "lifecycle-summary") {
      lifecycleSummary(caller, activities);
    } else if (reportType == "expiry-risk") {
      expiryRisk(medicines);
    } else if (reportType == "inventory-movement") {
      inventoryMovement(activities);
    } else if (reportType == "sync-history") {
      syncHistory(activities);
    } else if (reportType == "compliance-report") {
      complianceReport(activities);
    } else if (reportType == "consent-report") {
      consentReport(activities);
    } else if (reportType == "diagnostics-timeline") {
      diagnosticsTimeline(activities);
    } else if (reportType == "ecosystem-analytics") {
      ecosystemAnalytics(activities, exportLogs);
    } else {
      [];
    };
    {
      reportType;
      generatedAt = Time.now();
      dataPoints;
    };
  };
};
