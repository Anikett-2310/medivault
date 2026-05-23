import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  // Initial stable state — all collections start empty
  type OldActor = {};

  type NewActor = {
    // Users domain
    users : Map.Map<Principal, {
      id : Text;
      principal : Principal;
      name : Text;
      email : Text;
      role : { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };
      registrationDate : Int;
      isActive : Bool;
    }>;
    // Medicines domain
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
    // Pharmacy domain
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
    // Lab domain
    reports : Map.Map<Text, {
      id : Text;
      patientId : Text;
      labPrincipal : Principal;
      fileUrl : Text;
      uploadDate : Int;
      reportType : Text;
    }>;
    // Hospital domain
    appointments : Map.Map<Text, {
      id : Text;
      patientName : Text;
      dateTime : Int;
      status : Text;
      notes : Text;
    }>;
    // Authorization extension
    accessControlState : AccessControl.AccessControlState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      users = Map.empty<Principal, {
        id : Text;
        principal : Principal;
        name : Text;
        email : Text;
        role : { #Patient; #Pharmacy; #Hospital; #Lab; #Admin };
        registrationDate : Int;
        isActive : Bool;
      }>();
      medicines = Map.empty<Text, {
        id : Text;
        name : Text;
        dosage : Text;
        frequency : Text;
        expiryDate : Int;
        category : { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };
        ownerPrincipal : Principal;
        prescriptionUrl : ?Text;
        createdAt : Int;
      }>();
      doseLogs = Map.empty<Text, {
        id : Text;
        medicineId : Text;
        userPrincipal : Principal;
        takenAt : Int;
        isOnTime : Bool;
      }>();
      reminders = Map.empty<Text, {
        id : Text;
        medicineId : Text;
        userPrincipal : Principal;
        reminderTime : Text;
        isEnabled : Bool;
        voiceEnabled : Bool;
        createdAt : Int;
      }>();
      inventory = Map.empty<Text, {
        id : Text;
        medicineName : Text;
        stockQuantity : Nat;
        minThreshold : Nat;
        maxThreshold : Nat;
        expiryDate : Int;
        pharmacyPrincipal : Principal;
        lastUpdated : Int;
        category : { #Tablet; #Capsule; #Liquid; #Injection; #Topical; #Other };
      }>();
      orders = Map.empty<Text, {
        id : Text;
        patientId : Text;
        pharmacyId : Text;
        medicineName : Text;
        quantity : Nat;
        status : { #Pending; #Shipped; #Delivered; #Cancelled };
        orderDate : Int;
        deliveryDate : ?Int;
      }>();
      reports = Map.empty<Text, {
        id : Text;
        patientId : Text;
        labPrincipal : Principal;
        fileUrl : Text;
        uploadDate : Int;
        reportType : Text;
      }>();
      appointments = Map.empty<Text, {
        id : Text;
        patientName : Text;
        dateTime : Int;
        status : Text;
        notes : Text;
      }>();
      accessControlState = AccessControl.initState();
    };
  };
};
