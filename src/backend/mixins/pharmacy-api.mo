import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import PharmTypes "../types/pharmacy";
import PharmLib "../lib/pharmacy";

mixin (
  accessControlState : AccessControl.AccessControlState,
  inventory : Map.Map<Text, PharmTypes.InventoryItem>,
  orders : Map.Map<Text, PharmTypes.Order>,
) {
  public shared ({ caller }) func createInventoryItem(
    medicineName : Text,
    stockQuantity : Nat,
    minThreshold : Nat,
    maxThreshold : Nat,
    expiryDate : Int,
    category : CommonTypes.MedicineCategory,
  ) : async { #ok : PharmTypes.InventoryItem; #err : Text } {
    PharmLib.createInventoryItem(inventory, caller, medicineName, stockQuantity, minThreshold, maxThreshold, expiryDate, category);
  };

  public query ({ caller }) func getPharmacyInventory() : async [PharmTypes.InventoryItem] {
    PharmLib.getPharmacyInventory(inventory, caller);
  };

  public shared ({ caller }) func updateInventoryItem(
    id : Text,
    stockQuantity : Nat,
    minThreshold : Nat,
    maxThreshold : Nat,
    expiryDate : Int,
  ) : async { #ok : PharmTypes.InventoryItem; #err : Text } {
    PharmLib.updateInventoryItem(inventory, caller, id, stockQuantity, minThreshold, maxThreshold, expiryDate);
  };

  public shared ({ caller }) func deleteInventoryItem(
    id : Text,
  ) : async { #ok; #err : Text } {
    PharmLib.deleteInventoryItem(inventory, caller, id);
  };

  public shared ({ caller }) func createOrder(
    patientId : Text,
    pharmacyId : Text,
    medicineName : Text,
    quantity : Nat,
  ) : async { #ok : PharmTypes.Order; #err : Text } {
    PharmLib.createOrder(orders, caller, patientId, pharmacyId, medicineName, quantity);
  };

  public query ({ caller }) func getMyOrders() : async [PharmTypes.Order] {
    PharmLib.getMyOrders(orders, caller);
  };

  public query ({ caller }) func getPharmacyOrders() : async [PharmTypes.Order] {
    PharmLib.getPharmacyOrders(orders, caller);
  };

  public shared ({ caller }) func updateOrderStatus(
    id : Text,
    status : CommonTypes.OrderStatus,
  ) : async { #ok : PharmTypes.Order; #err : Text } {
    PharmLib.updateOrderStatus(orders, caller, id, status);
  };
};
