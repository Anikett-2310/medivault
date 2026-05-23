import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserTypes "../types/users";
import MedTypes "../types/medicines";
import PharmTypes "../types/pharmacy";
import AnalyticsLib "../lib/analytics";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, UserTypes.UserProfile>,
  medicines : Map.Map<Text, MedTypes.Medicine>,
  orders : Map.Map<Text, PharmTypes.Order>,
  inventory : Map.Map<Text, PharmTypes.InventoryItem>,
) {
  public query ({ caller }) func getSystemStats() : async {
    totalUsers : Nat;
    totalMedicines : Nat;
    totalOrders : Nat;
    usersByRole : [(Text, Nat)];
  } {
    ignore caller;
    AnalyticsLib.getSystemStats(users, medicines, orders);
  };

  public query ({ caller }) func getExpiryStats() : async {
    safe : Nat;
    expiringSoon : Nat;
    expired : Nat;
  } {
    ignore caller;
    AnalyticsLib.getExpiryStats(medicines, Time.now());
  };

  public query ({ caller }) func getInventoryStats() : async [(Text, Nat)] {
    ignore caller;
    AnalyticsLib.getInventoryStats(inventory);
  };
};
