import Map "mo:core/Map";
import Principal "mo:core/Principal";
import UserTypes "../types/users";
import MedTypes "../types/medicines";
import PharmTypes "../types/pharmacy";

module {
  public type UsersMap = Map.Map<Principal, UserTypes.UserProfile>;
  public type MedicinesMap = Map.Map<Text, MedTypes.Medicine>;
  public type OrdersMap = Map.Map<Text, PharmTypes.Order>;
  public type InventoryMap = Map.Map<Text, PharmTypes.InventoryItem>;

  public func getSystemStats(
    users : UsersMap,
    medicines : MedicinesMap,
    orders : OrdersMap,
  ) : { totalUsers : Nat; totalMedicines : Nat; totalOrders : Nat; usersByRole : [(Text, Nat)] } {
    let totalUsers = users.size();
    let totalMedicines = medicines.size();
    let totalOrders = orders.size();
    var patientCount = 0;
    var pharmacyCount = 0;
    var hospitalCount = 0;
    var labCount = 0;
    var adminCount = 0;
    users.values().forEach(func(u) {
      switch (u.role) {
        case (#Patient) { patientCount += 1 };
        case (#Pharmacy) { pharmacyCount += 1 };
        case (#Hospital) { hospitalCount += 1 };
        case (#Lab) { labCount += 1 };
        case (#Admin) { adminCount += 1 };
      };
    });
    let usersByRole : [(Text, Nat)] = [
      ("Patient", patientCount),
      ("Pharmacy", pharmacyCount),
      ("Hospital", hospitalCount),
      ("Lab", labCount),
      ("Admin", adminCount),
    ];
    { totalUsers; totalMedicines; totalOrders; usersByRole };
  };

  public func getExpiryStats(
    medicines : MedicinesMap,
    now : Int,
  ) : { safe : Nat; expiringSoon : Nat; expired : Nat } {
    var safe = 0;
    var expiringSoon = 0;
    var expired = 0;
    let thirtyDaysNs : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    medicines.values().forEach(func(m) {
      let diff = m.expiryDate - now;
      if (diff < 0) {
        expired += 1;
      } else if (diff <= thirtyDaysNs) {
        expiringSoon += 1;
      } else {
        safe += 1;
      };
    });
    { safe; expiringSoon; expired };
  };

  public func getInventoryStats(
    inventory : InventoryMap,
  ) : [(Text, Nat)] {
    var tabletStock = 0;
    var capsuleStock = 0;
    var liquidStock = 0;
    var injectionStock = 0;
    var topicalStock = 0;
    var otherStock = 0;
    inventory.values().forEach(func(i) {
      switch (i.category) {
        case (#Tablet) { tabletStock += i.stockQuantity };
        case (#Capsule) { capsuleStock += i.stockQuantity };
        case (#Liquid) { liquidStock += i.stockQuantity };
        case (#Injection) { injectionStock += i.stockQuantity };
        case (#Topical) { topicalStock += i.stockQuantity };
        case (#Other) { otherStock += i.stockQuantity };
      };
    });
    [
      ("Tablet", tabletStock),
      ("Capsule", capsuleStock),
      ("Liquid", liquidStock),
      ("Injection", injectionStock),
      ("Topical", topicalStock),
      ("Other", otherStock),
    ];
  };
};
