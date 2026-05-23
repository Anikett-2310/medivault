import Principal "mo:core/Principal";

module {
  // Actor role variant for activity events (matches ecosystem roles)
  public type ActivityActorRole = {
    #Patient;
    #Pharmacy;
    #Hospital;
    #Diagnostic;
    #Admin;
  };

  // Comprehensive event type variant covering all ecosystem actions
  public type ActivityEventType = {
    // Patient events
    #MedicineAddedManually;
    #MedicineSyncedFromPharmacy;
    #QRScanCompleted;
    #ReminderCreated;
    #ReminderCompleted;
    #ReminderMissed;
    #DoseMarkedTaken;
    #DiagnosticBooked;
    #ReportViewedDownloaded;
    #ConsentGranted;
    #ConsentRevoked;
    #TelegramConnected;
    #TelegramDisconnected;
    // Pharmacy events
    #InventoryItemAdded;
    #MedicineSold;
    #MedicineSyncedToPatient;
    #CSVUploaded;
    #RestockFulfilled;
    #InventoryStatusChanged;
    #ExpiryAlertTriggered;
    // Hospital events
    #HospitalMedicineAdded;
    #HospitalInventoryUpdated;
    #PatientAdherenceViewed;
    #ConsentAccessGranted;
    #ConsentAccessRevoked;
    #ExpiryWarningTriggered;
    // Diagnostic events
    #BookingReceived;
    #BookingAccepted;
    #SampleCollected;
    #TestProcessingStarted;
    #ReportUploaded;
    #ReportCompleted;
    // Admin events
    #UserCreated;
    #RoleChanged;
    #SystemAlert;
    #EcosystemSyncStats;
  };

  // Full activity event record
  public type ActivityEvent = {
    id : Text;
    eventActor : {
      role : ActivityActorRole;
      principalId : Principal;
    };
    eventType : ActivityEventType;
    resourceId : ?Text;
    metadata : ?Text; // JSON-serialized context
    timestamp : Int;
    var readBy : [Principal];
  };

  // Shared (non-mutable) version for API boundaries
  public type ActivityEventView = {
    id : Text;
    eventActor : {
      role : ActivityActorRole;
      principalId : Principal;
    };
    eventType : ActivityEventType;
    resourceId : ?Text;
    metadata : ?Text;
    timestamp : Int;
    readBy : [Principal];
  };
};
