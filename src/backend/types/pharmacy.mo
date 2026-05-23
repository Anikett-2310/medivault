import Principal "mo:core/Principal";
import Common "common";

module {
  public type InventoryStatus = {
    #Safe;
    #LowStock;
    #ExpiringSoon;
    #Expired;
    #CriticalStock;
  };

  public type PharmacySyncLog = {
    id : Text;
    pharmacyPrincipal : Principal;
    patientPrincipal : Principal;
    medicineName : Text;
    batchNumber : Text;
    expiryDate : Common.Timestamp;
    quantity : Nat;
    syncedAt : Common.Timestamp;
    status : { #Success; #Failed; #Duplicate };
    errorMessage : ?Text;
  };
  public type InventoryItem = {
    id : Text;
    medicineName : Text;
    stockQuantity : Nat;
    minThreshold : Nat;
    maxThreshold : Nat;
    expiryDate : Common.Timestamp;
    pharmacyPrincipal : Principal;
    lastUpdated : Common.Timestamp;
    category : Common.MedicineCategory;
  };

  public type Order = {
    id : Text;
    patientId : Text;
    pharmacyId : Text;
    medicineName : Text;
    quantity : Nat;
    status : Common.OrderStatus;
    orderDate : Common.Timestamp;
    deliveryDate : ?Common.Timestamp;
  };
};
