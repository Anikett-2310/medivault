import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

// THIS FILE IS NOW AN IDENTITY PASS-THROUGH.
// The ecosystem state migration was moved to 20260520_130000_AddEcosystemState.mo
// so that AddTelegramFields (120000) runs BEFORE AddEcosystemState (130000).
// This file's OldActor matches the pre-Telegram shape (from InitialState);
// its NewActor is identical (no change), so it passes through the chain unchanged.
module {
  type OldActor = {
    users : Map.Map<Principal, {
      id : Text;
      principal : Principal;
      name : Text;
      email : Text;
      role : { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };
      registrationDate : Int;
      isActive : Bool;
    }>;
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

  // NewActor is identical — this migration is a no-op pass-through.
  type NewActor = OldActor;

  public func migration(old : OldActor) : NewActor {
    old;
  };
};
