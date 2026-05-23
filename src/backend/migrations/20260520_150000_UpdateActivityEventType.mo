import Map "mo:core/Map";
import Principal "mo:core/Principal";

// Migration: UpdateActivityEventType
// Previous ActivityEvent used Text-based eventType + description + actorPrincipal flat fields.
// New ActivityEvent uses a variant eventType, actor record, resourceId, metadata, and var readBy.
// Strategy: drop all existing activity events (they were placeholder foundation data)
// and reinitialise activityEvents to an empty Map so fresh events use the new type.
module {

  // -- New activity actor role variant ---------------------------------------
  type ActivityActorRole = {
    #Patient;
    #Pharmacy;
    #Hospital;
    #Diagnostic;
    #Admin;
  };

  // -- New activity event type variant --------------------------------------
  type ActivityEventType = {
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

  // -- New ActivityEvent shape -----------------------------------------------
  type ActivityEvent = {
    id : Text;
    eventActor : {
      role : ActivityActorRole;
      principalId : Principal;
    };
    eventType : ActivityEventType;
    resourceId : ?Text;
    metadata : ?Text;
    timestamp : Int;
    var readBy : [Principal];
  };

  // -- OldActor: previous shape (Text-based eventType) ----------------------
  // The old ActivityEvent used flat Text fields; the new shape is incompatible.
  // We clear the map rather than attempt a lossy conversion.
  type OldActivityEvent = {
    id : Text;
    actorPrincipal : Principal;
    actorRole : { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };
    eventType : Text;
    description : Text;
    relatedId : ?Text;
    relatedType : ?Text;
    timestamp : Int;
  };

  type OldState = {
    activityEvents : Map.Map<Text, OldActivityEvent>;
  };

  type NewState = {
    activityEvents : Map.Map<Text, ActivityEvent>;
  };

  public func migration(old : OldState) : NewState {
    // Drop all old placeholder events — incompatible schema.
    // Fresh events written after this migration will use the new variant type.
    ignore old.activityEvents;
    let freshEvents = Map.empty<Text, ActivityEvent>();
    { activityEvents = freshEvents };
  };
};
