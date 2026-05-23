import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

// Migration: AddExportLogsStore
// Tail: 20260520_150000_UpdateActivityEventType.mo
// Adds exportLogsStore : Map.Map<Text, ExportLogEntry> to the stable state.
// All existing fields are passed through unchanged.
// exportLogsStore is initialised to Map.empty().
module {

  // ── Shared types (inlined — no project imports allowed) ──────────────────

  type UserRole = { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };

  type MedicineCategory = { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };

  type UserProfile = {
    id : Text;
    principal : Principal;
    name : Text;
    email : Text;
    role : UserRole;
    registrationDate : Int;
    isActive : Bool;
    telegramChatId : ?Text;
    telegramEnabled : Bool;
    phone : ?Text;
  };

  type Medicine = {
    id : Text;
    name : Text;
    dosage : Text;
    frequency : Text;
    expiryDate : Int;
    category : MedicineCategory;
    ownerPrincipal : Principal;
    prescriptionUrl : ?Text;
    createdAt : Int;
  };

  type DoseLog = {
    id : Text;
    medicineId : Text;
    userPrincipal : Principal;
    takenAt : Int;
    isOnTime : Bool;
  };

  type Reminder = {
    id : Text;
    medicineId : Text;
    userPrincipal : Principal;
    reminderTime : Text;
    isEnabled : Bool;
    voiceEnabled : Bool;
    createdAt : Int;
  };

  type InventoryItem = {
    id : Text;
    medicineName : Text;
    stockQuantity : Nat;
    minThreshold : Nat;
    maxThreshold : Nat;
    expiryDate : Int;
    pharmacyPrincipal : Principal;
    lastUpdated : Int;
    category : MedicineCategory;
  };

  type Order = {
    id : Text;
    patientId : Text;
    pharmacyId : Text;
    medicineName : Text;
    quantity : Nat;
    status : { #Pending; #Shipped; #Delivered; #Cancelled };
    orderDate : Int;
    deliveryDate : ?Int;
  };

  type Report = {
    id : Text;
    patientId : Text;
    labPrincipal : Principal;
    fileUrl : Text;
    uploadDate : Int;
    reportType : Text;
  };

  type Appointment = {
    id : Text;
    patientName : Text;
    dateTime : Int;
    status : Text;
    notes : Text;
  };

  type TelegramLog = {
    id : Text;
    userPrincipal : Principal;
    medicineId : Text;
    medicineName : Text;
    reminderTime : Text;
    status : Text;
    errorMessage : ?Text;
    timestamp : Int;
  };

  type ConsentAuditEntry = {
    action : Text;
    timestamp : Int;
    field : Text;
  };

  type ConsentRecord = {
    id : Text;
    patientPrincipal : Principal;
    adherenceSharing : Bool;
    prescriptionSharing : Bool;
    diagnosticAccess : Bool;
    lastUpdated : Int;
    auditTrail : [ConsentAuditEntry];
  };

  type NotifType = {
    #MedicineSynced;
    #LowStock;
    #ExpiringSoon;
    #ReportReady;
    #BookingConfirmed;
    #BookingCompleted;
    #ReminderMissed;
    #ConsentChanged;
  };

  type NotificationRecord = {
    id : Text;
    recipientPrincipal : Principal;
    role : UserRole;
    notifType : NotifType;
    message : Text;
    isRead : Bool;
    createdAt : Int;
    relatedId : ?Text;
  };

  type BookingStatus = { #Booked; #Confirmed; #InProgress; #Completed; #ReportUploaded };

  type BookingStatusEntry = {
    status : BookingStatus;
    timestamp : Int;
    note : Text;
  };

  type DiagnosticBooking = {
    id : Text;
    patientPrincipal : Principal;
    labPrincipal : Principal;
    testType : Text;
    preferredDate : Text;
    reason : ?Text;
    status : BookingStatus;
    statusHistory : [BookingStatusEntry];
    reportUrl : ?Text;
    reportUploadedAt : ?Int;
    createdAt : Int;
  };

  type SyncStatus = { #Success; #Failed; #Duplicate };

  type PharmacySyncLog = {
    id : Text;
    pharmacyPrincipal : Principal;
    patientPrincipal : Principal;
    medicineName : Text;
    batchNumber : Text;
    expiryDate : Int;
    quantity : Nat;
    syncedAt : Int;
    status : SyncStatus;
    errorMessage : ?Text;
  };

  type SyncedMedicine = {
    id : Text;
    name : Text;
    dosage : Text;
    frequency : Text;
    expiryDate : Int;
    category : MedicineCategory;
    ownerPrincipal : Principal;
    prescriptionUrl : ?Text;
    createdAt : Int;
    sourcePharmacy : Text;
    sourcePrincipal : Principal;
    purchaseTimestamp : Int;
    batchNumber : Text;
  };

  type ActivityActorRole = {
    #Patient;
    #Pharmacy;
    #Hospital;
    #Diagnostic;
    #Admin;
  };

  type ActivityEventType = {
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
    #InventoryItemAdded;
    #MedicineSold;
    #MedicineSyncedToPatient;
    #CSVUploaded;
    #RestockFulfilled;
    #InventoryStatusChanged;
    #ExpiryAlertTriggered;
    #HospitalMedicineAdded;
    #HospitalInventoryUpdated;
    #PatientAdherenceViewed;
    #ConsentAccessGranted;
    #ConsentAccessRevoked;
    #ExpiryWarningTriggered;
    #BookingReceived;
    #BookingAccepted;
    #SampleCollected;
    #TestProcessingStarted;
    #ReportUploaded;
    #ReportCompleted;
    #UserCreated;
    #RoleChanged;
    #SystemAlert;
    #EcosystemSyncStats;
  };

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

  // ── ExportLogEntry: new type added by this migration ─────────────────────
  type ExportLogEntry = {
    id : Text;
    userId : Principal;
    userRole : Text;
    exportType : Text;
    fileType : Text;
    filtersApplied : Text;
    timestamp : Int;
    status : Text;
    filename : Text;
    fileSizeBytes : ?Nat;
    errorMessage : ?Text;
  };

  // ── OldActor: NewActor from 20260520_150000_UpdateActivityEventType ───────
  type OldActor = {
    users : Map.Map<Principal, UserProfile>;
    medicines : Map.Map<Text, Medicine>;
    doseLogs : Map.Map<Text, DoseLog>;
    reminders : Map.Map<Text, Reminder>;
    inventory : Map.Map<Text, InventoryItem>;
    orders : Map.Map<Text, Order>;
    reports : Map.Map<Text, Report>;
    appointments : Map.Map<Text, Appointment>;
    accessControlState : AccessControl.AccessControlState;
    telegramLogs : Map.Map<Text, TelegramLog>;
    telegramState : { var botToken : ?Text };
    consents : Map.Map<Principal, ConsentRecord>;
    notifications : Map.Map<Text, NotificationRecord>;
    diagnosticBookings : Map.Map<Text, DiagnosticBooking>;
    syncLogs : Map.Map<Text, PharmacySyncLog>;
    syncedMedicines : Map.Map<Text, SyncedMedicine>;
    activityEvents : Map.Map<Text, ActivityEvent>;
  };

  // ── NewActor: OldActor + exportLogsStore ─────────────────────────────────
  type NewActor = {
    users : Map.Map<Principal, UserProfile>;
    medicines : Map.Map<Text, Medicine>;
    doseLogs : Map.Map<Text, DoseLog>;
    reminders : Map.Map<Text, Reminder>;
    inventory : Map.Map<Text, InventoryItem>;
    orders : Map.Map<Text, Order>;
    reports : Map.Map<Text, Report>;
    appointments : Map.Map<Text, Appointment>;
    accessControlState : AccessControl.AccessControlState;
    telegramLogs : Map.Map<Text, TelegramLog>;
    telegramState : { var botToken : ?Text };
    consents : Map.Map<Principal, ConsentRecord>;
    notifications : Map.Map<Text, NotificationRecord>;
    diagnosticBookings : Map.Map<Text, DiagnosticBooking>;
    syncLogs : Map.Map<Text, PharmacySyncLog>;
    syncedMedicines : Map.Map<Text, SyncedMedicine>;
    activityEvents : Map.Map<Text, ActivityEvent>;
    exportLogsStore : Map.Map<Text, ExportLogEntry>;
  };

  // ── Migration body: pass through all old fields, init exportLogsStore ────
  public func migration(old : OldActor) : NewActor {
    {
      old with
      exportLogsStore = Map.empty<Text, ExportLogEntry>();
    };
  };
};
