import Principal "mo:core/Principal";
import Common "common";

module {
  /// Medicine pushed from a pharmacy via phone number auto-match sync.
  public type SyncedMedicine = {
    id : Text;
    name : Text;
    dosage : Text;
    frequency : Text;
    expiryDate : Common.Timestamp;
    category : Common.MedicineCategory;
    ownerPrincipal : Principal;
    prescriptionUrl : ?Text;
    createdAt : Common.Timestamp;
    // Sync-specific fields
    sourcePharmacy : Text;
    sourcePrincipal : Principal;
    purchaseTimestamp : Common.Timestamp;
    batchNumber : Text;
  };
  public type Medicine = {
    id : Text;
    name : Text;
    dosage : Text;
    frequency : Text;
    expiryDate : Common.Timestamp;
    category : Common.MedicineCategory;
    ownerPrincipal : Principal;
    prescriptionUrl : ?Text;
    createdAt : Common.Timestamp;
  };

  public type DoseLog = {
    id : Text;
    medicineId : Text;
    userPrincipal : Principal;
    takenAt : Common.Timestamp;
    isOnTime : Bool;
  };

  public type Reminder = {
    id : Text;
    medicineId : Text;
    userPrincipal : Principal;
    reminderTime : Text;
    isEnabled : Bool;
    voiceEnabled : Bool;
    createdAt : Common.Timestamp;
  };
};
