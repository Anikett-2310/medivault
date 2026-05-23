import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import NotifLib "../lib/notifications";

mixin (
  accessControlState : AccessControl.AccessControlState,
  notifications : NotifLib.NotificationMap,
) {
  public shared query ({ caller }) func getMyNotifications() : async [NotifLib.NotificationRecord] {
    ignore accessControlState;
    NotifLib.getMyNotifications(notifications, caller);
  };

  public shared ({ caller }) func markNotificationRead(notifId : Text) : async { #ok; #err : Text } {
    ignore accessControlState;
    NotifLib.markAsRead(notifications, caller, notifId);
  };

  public shared ({ caller }) func markAllNotificationsRead() : async Nat {
    ignore accessControlState;
    NotifLib.markAllAsRead(notifications, caller);
  };

  public shared query ({ caller }) func getUnreadNotificationCount() : async Nat {
    ignore accessControlState;
    NotifLib.getUnreadCount(notifications, caller);
  };
};
