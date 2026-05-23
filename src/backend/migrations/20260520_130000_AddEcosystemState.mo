import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

// Migration: no-op passthrough.
// 20260520_140000_AddPhoneToUserProfile handles all changes (ecosystem maps + phone)
// from the deployed AddTelegramFields snapshot in a single migration.
// This file is a valid no-op so the chain compiles without gaps;
// OldActor = NewActor = deployed AddTelegramFields snapshot (no ecosystem maps).
module {
  // ── OldActor: matches NewActor from AddTelegramFields ─────────────────────
  type OldUserProfile = {
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

  // ── NewActor: identical to OldActor (no-op passthrough) ─────────────────
  type NewActor = OldActor;

  public func migration(old : OldActor) : NewActor { old };
};
