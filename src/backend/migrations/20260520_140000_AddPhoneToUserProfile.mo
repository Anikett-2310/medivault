import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

// Migration: all-in-one upgrade from AddTelegramFields snapshot.
// OldActor = AddTelegramFields NewActor (deployed snapshot — no ecosystem maps, no phone).
// NewActor = OldActor + phone:?Text on UserProfile + 6 ecosystem Maps (all empty on upgrade).
// This is the ONLY migration validated against the deployed .most snapshot (check-limit=1).
module {

  // -- Shared types ----------------------------------------------------------

  type UserRole = { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };

  type MedicineCategory = { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };

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

  type ActivityEvent = {
    id : Text;
    actorPrincipal : Principal;
    actorRole : UserRole;
    eventType : Text;
    description : Text;
    relatedId : ?Text;
    relatedType : ?Text;
    timestamp : Int;
  };

  // -- OldUserProfile: AddTelegramFields shape (no phone) --------------------
  type OldUserProfile = {
    id : Text;
    principal : Principal;
    name : Text;
    email : Text;
    role : UserRole;
    registrationDate : Int;
    isActive : Bool;
    telegramChatId : ?Text;
    telegramEnabled : Bool;
  };

  // -- OldActor: matches deployed .most snapshot (AddTelegramFields NewActor) -
  // NO ecosystem maps, NO phone — exactly the deployed on-chain shape.
  type OldActor = {
    users : Map.Map<Principal, OldUserProfile>;
    medicines : Map.Map<Text, {
      id : Text;
      name : Text;
      dosage : Text;
      frequency : Text;
      expiryDate : Int;
      category : MedicineCategory;
      ownerPrincipal : Principal;
      prescriptionUrl : ?Text;
      createdAt : Int;
    }>;
    doseLogs : Map.Map<Text, {
      id : Text;
      medicineId : Text;
      userPrincipal : Principal;
      takenAt : Int;
      isOnTime : Bool;
    }>;
    reminders : Map.Map<Text, {
      id : Text;
      medicineId : Text;
      userPrincipal : Principal;
      reminderTime : Text;
      isEnabled : Bool;
      voiceEnabled : Bool;
      createdAt : Int;
    }>;
    inventory : Map.Map<Text, {
      id : Text;
      medicineName : Text;
      stockQuantity : Nat;
      minThreshold : Nat;
      maxThreshold : Nat;
      expiryDate : Int;
      pharmacyPrincipal : Principal;
      lastUpdated : Int;
      category : MedicineCategory;
    }>;
    orders : Map.Map<Text, {
      id : Text;
      patientId : Text;
      pharmacyId : Text;
      medicineName : Text;
      quantity : Nat;
      status : { #Pending; #Shipped; #Delivered; #Cancelled };
      orderDate : Int;
      deliveryDate : ?Int;
    }>;
    reports : Map.Map<Text, {
      id : Text;
      patientId : Text;
      labPrincipal : Principal;
      fileUrl : Text;
      uploadDate : Int;
      reportType : Text;
    }>;
    appointments : Map.Map<Text, {
      id : Text;
      patientName : Text;
      dateTime : Int;
      status : Text;
      notes : Text;
    }>;
    accessControlState : AccessControl.AccessControlState;
    telegramLogs : Map.Map<Text, {
      id : Text;
      userPrincipal : Principal;
      medicineId : Text;
      medicineName : Text;
      reminderTime : Text;
      status : Text;
      errorMessage : ?Text;
      timestamp : Int;
    }>;
    telegramState : { var botToken : ?Text };
  };

  // -- NewUserProfile: OldUserProfile + phone --------------------------------
  type NewUserProfile = {
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

  // -- NewActor: OldActor + phone on users + 6 ecosystem Maps ---------------
  type NewActor = {
    users : Map.Map<Principal, NewUserProfile>;
    medicines : Map.Map<Text, {
      id : Text;
      name : Text;
      dosage : Text;
      frequency : Text;
      expiryDate : Int;
      category : MedicineCategory;
      ownerPrincipal : Principal;
      prescriptionUrl : ?Text;
      createdAt : Int;
    }>;
    doseLogs : Map.Map<Text, {
      id : Text;
      medicineId : Text;
      userPrincipal : Principal;
      takenAt : Int;
      isOnTime : Bool;
    }>;
    reminders : Map.Map<Text, {
      id : Text;
      medicineId : Text;
      userPrincipal : Principal;
      reminderTime : Text;
      isEnabled : Bool;
      voiceEnabled : Bool;
      createdAt : Int;
    }>;
    inventory : Map.Map<Text, {
      id : Text;
      medicineName : Text;
      stockQuantity : Nat;
      minThreshold : Nat;
      maxThreshold : Nat;
      expiryDate : Int;
      pharmacyPrincipal : Principal;
      lastUpdated : Int;
      category : MedicineCategory;
    }>;
    orders : Map.Map<Text, {
      id : Text;
      patientId : Text;
      pharmacyId : Text;
      medicineName : Text;
      quantity : Nat;
      status : { #Pending; #Shipped; #Delivered; #Cancelled };
      orderDate : Int;
      deliveryDate : ?Int;
    }>;
    reports : Map.Map<Text, {
      id : Text;
      patientId : Text;
      labPrincipal : Principal;
      fileUrl : Text;
      uploadDate : Int;
      reportType : Text;
    }>;
    appointments : Map.Map<Text, {
      id : Text;
      patientName : Text;
      dateTime : Int;
      status : Text;
      notes : Text;
    }>;
    accessControlState : AccessControl.AccessControlState;
    telegramLogs : Map.Map<Text, {
      id : Text;
      userPrincipal : Principal;
      medicineId : Text;
      medicineName : Text;
      reminderTime : Text;
      status : Text;
      errorMessage : ?Text;
      timestamp : Int;
    }>;
    telegramState : { var botToken : ?Text };
    consents : Map.Map<Principal, ConsentRecord>;
    notifications : Map.Map<Text, NotificationRecord>;
    diagnosticBookings : Map.Map<Text, DiagnosticBooking>;
    syncLogs : Map.Map<Text, PharmacySyncLog>;
    syncedMedicines : Map.Map<Text, SyncedMedicine>;
    activityEvents : Map.Map<Text, ActivityEvent>;
  };

  public func migration(old : OldActor) : NewActor {
    {
      old with
      users = old.users.map<Principal, OldUserProfile, NewUserProfile>(
        func(_, u) { { u with phone = null } }
      );
      consents = Map.empty<Principal, ConsentRecord>();
      notifications = Map.empty<Text, NotificationRecord>();
      diagnosticBookings = Map.empty<Text, DiagnosticBooking>();
      syncLogs = Map.empty<Text, PharmacySyncLog>();
      syncedMedicines = Map.empty<Text, SyncedMedicine>();
      activityEvents = Map.empty<Text, ActivityEvent>();
    };
  };
};
