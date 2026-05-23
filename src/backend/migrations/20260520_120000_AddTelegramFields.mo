import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  // ── Previous stable shape (from 20260520_000000_InitialState) ──────────────
  type OldUserProfile = {
    id : Text;
    principal : Principal;
    name : Text;
    email : Text;
    role : { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };
    registrationDate : Int;
    isActive : Bool;
  };

  type OldActor = {
    users : Map.Map<Principal, OldUserProfile>;
    medicines : Map.Map<Text, {
      id : Text;
      name : Text;
      dosage : Text;
      frequency : Text;
      expiryDate : Int;
      category : { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };
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
      category : { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };
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
  };

  // ── New stable shape (adds telegramChatId/telegramEnabled to UserProfile ────
  // and a new telegramLogs collection and telegramState record)
  type NewUserProfile = {
    id : Text;
    principal : Principal;
    name : Text;
    email : Text;
    role : { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };
    registrationDate : Int;
    isActive : Bool;
    telegramChatId : ?Text;
    telegramEnabled : Bool;
  };

  type NewActor = {
    users : Map.Map<Principal, NewUserProfile>;
    medicines : Map.Map<Text, {
      id : Text;
      name : Text;
      dosage : Text;
      frequency : Text;
      expiryDate : Int;
      category : { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };
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
      category : { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };
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
    // New: Telegram logs and state
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

  public func migration(old : OldActor) : NewActor {
    // Migrate every existing user profile to include the new Telegram fields
    let migratedUsers = old.users.map<Principal, OldUserProfile, NewUserProfile>(
      func(_, u) {
        {
          u with
          telegramChatId = null;
          telegramEnabled = false;
        };
      }
    );

    {
      users = migratedUsers;
      medicines = old.medicines;
      doseLogs = old.doseLogs;
      reminders = old.reminders;
      inventory = old.inventory;
      orders = old.orders;
      reports = old.reports;
      appointments = old.appointments;
      accessControlState = old.accessControlState;
      telegramLogs = Map.empty<Text, {
        id : Text;
        userPrincipal : Principal;
        medicineId : Text;
        medicineName : Text;
        reminderTime : Text;
        status : Text;
        errorMessage : ?Text;
        timestamp : Int;
      }>();
      telegramState = { var botToken = null };
    };
  };
};
