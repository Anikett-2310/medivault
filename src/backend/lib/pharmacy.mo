import Map "mo:core/Map";
import Principal "mo:core/Principal";
import CommonTypes "../types/common";
import PharmTypes "../types/pharmacy";
import Time "mo:core/Time";

module {
  public type InventoryItem = PharmTypes.InventoryItem;
  public type Order = PharmTypes.Order;
  public type MedicineCategory = CommonTypes.MedicineCategory;
  public type OrderStatus = CommonTypes.OrderStatus;
  public type InventoryMap = Map.Map<Text, InventoryItem>;
  public type OrdersMap = Map.Map<Text, Order>;

    public func getInventoryStatus(
    item : InventoryItem,
  ) : {
    #Safe;
    #LowStock;
    #ExpiringSoon;
    #Expired;
    #CriticalStock;
  } {
    let now = Time.now();
    let thirtyDays : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    if (item.expiryDate <= now) {
      return #Expired;
    };
    if (item.expiryDate <= now + thirtyDays) {
      return #ExpiringSoon;
    };
    if (item.stockQuantity == 0) {
      return #CriticalStock;
    };
    if (item.stockQuantity <= item.minThreshold) {
      return #LowStock;
    };
    #Safe;
  };

public func createInventoryItem(
    inventory : InventoryMap,
    caller : Principal,
    medicineName : Text,
    stockQuantity : Nat,
    minThreshold : Nat,
    maxThreshold : Nat,
    expiryDate : Int,
    category : MedicineCategory,
  ) : { #ok : InventoryItem; #err : Text } {
    let id = caller.toText() # "-inv-" # Time.now().toText();
    let item : InventoryItem = {
      id;
      medicineName;
      stockQuantity;
      minThreshold;
      maxThreshold;
      expiryDate;
      pharmacyPrincipal = caller;
      lastUpdated = Time.now();
      category;
    };
    inventory.add(id, item);
    #ok item;
  };

  public func getPharmacyInventory(
    inventory : InventoryMap,
    caller : Principal,
  ) : [InventoryItem] {
    inventory.values().filter(func(i) { Principal.equal(i.pharmacyPrincipal, caller) }).toArray();
  };

  public func updateInventoryItem(
    inventory : InventoryMap,
    caller : Principal,
    id : Text,
    stockQuantity : Nat,
    minThreshold : Nat,
    maxThreshold : Nat,
    expiryDate : Int,
  ) : { #ok : InventoryItem; #err : Text } {
    switch (inventory.get(id)) {
      case (?item) {
        if (not Principal.equal(item.pharmacyPrincipal, caller)) {
          return #err "Not authorized";
        };
        let updated = { item with stockQuantity; minThreshold; maxThreshold; expiryDate; lastUpdated = Time.now() };
        inventory.add(id, updated);
        #ok updated;
      };
      case null { #err "Inventory item not found" };
    };
  };

  public func deleteInventoryItem(
    inventory : InventoryMap,
    caller : Principal,
    id : Text,
  ) : { #ok; #err : Text } {
    switch (inventory.get(id)) {
      case (?item) {
        if (not Principal.equal(item.pharmacyPrincipal, caller)) {
          return #err "Not authorized";
        };
        inventory.remove(id);
        #ok;
      };
      case null { #err "Inventory item not found" };
    };
  };

  public func createOrder(
    orders : OrdersMap,
    caller : Principal,
    patientId : Text,
    pharmacyId : Text,
    medicineName : Text,
    quantity : Nat,
  ) : { #ok : Order; #err : Text } {
    let id = caller.toText() # "-ord-" # Time.now().toText();
    let order : Order = {
      id;
      patientId;
      pharmacyId;
      medicineName;
      quantity;
      status = #Pending;
      orderDate = Time.now();
      deliveryDate = null;
    };
    orders.add(id, order);
    #ok order;
  };

  public func getMyOrders(
    orders : OrdersMap,
    caller : Principal,
  ) : [Order] {
    let callerText = caller.toText();
    orders.values().filter(func(o) { o.patientId == callerText }).toArray();
  };

  public func getPharmacyOrders(
    orders : OrdersMap,
    caller : Principal,
  ) : [Order] {
    let callerText = caller.toText();
    orders.values().filter(func(o) { o.pharmacyId == callerText }).toArray();
  };

  public func updateOrderStatus(
    orders : OrdersMap,
    caller : Principal,
    id : Text,
    status : OrderStatus,
  ) : { #ok : Order; #err : Text } {
    ignore caller;
    switch (orders.get(id)) {
      case (?order) {
        let updated = { order with status };
        orders.add(id, updated);
        #ok updated;
      };
      case null { #err "Order not found" };
    };
  };
};
