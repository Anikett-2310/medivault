import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import NotifTypes "../types/notifications";
import CommonTypes "../types/common";
import Int "mo:core/Int";

module {
  public type NotificationRecord = NotifTypes.NotificationRecord;
  public type NotifType = NotifTypes.NotifType;
  public type NotificationMap = Map.Map<Text, NotificationRecord>;

  public func createNotification(
    notifications : NotificationMap,
    recipient : Principal,
    role : CommonTypes.UserRole,
    notifType : NotifType,
    message : Text,
    relatedId : ?Text,
  ) : NotificationRecord {
    let now = Time.now();
    let id = recipient.toText() # "-notif-" # now.toText();
    let record : NotificationRecord = {
      id;
      recipientPrincipal = recipient;
      role;
      notifType;
      message;
      isRead = false;
      createdAt = now;
      relatedId;
    };
    notifications.add(id, record);
    record;
  };

  public func getMyNotifications(
    notifications : NotificationMap,
    caller : Principal,
  ) : [NotificationRecord] {
    let all = notifications.values()
      .filter(func(n) { Principal.equal(n.recipientPrincipal, caller) })
      .toArray();
    all.sort(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
  };

  public func markAsRead(
    notifications : NotificationMap,
    caller : Principal,
    notifId : Text,
  ) : { #ok; #err : Text } {
    switch (notifications.get(notifId)) {
      case (?notif) {
        if (not Principal.equal(notif.recipientPrincipal, caller)) {
          return #err "Not authorized";
        };
        notifications.add(notifId, { notif with isRead = true });
        #ok;
      };
      case null { #err "Notification not found" };
    };
  };

  public func markAllAsRead(
    notifications : NotificationMap,
    caller : Principal,
  ) : Nat {
    var count = 0;
    for ((id, notif) in notifications.entries()) {
      if (Principal.equal(notif.recipientPrincipal, caller) and not notif.isRead) {
        notifications.add(id, { notif with isRead = true });
        count += 1;
      };
    };
    count;
  };

  public func getUnreadCount(
    notifications : NotificationMap,
    caller : Principal,
  ) : Nat {
    notifications.values()
      .filter(func(n) { Principal.equal(n.recipientPrincipal, caller) and not n.isRead })
      .size();
  };

  public func deleteNotification(
    notifications : NotificationMap,
    caller : Principal,
    notifId : Text,
  ) : { #ok; #err : Text } {
    switch (notifications.get(notifId)) {
      case (?notif) {
        if (not Principal.equal(notif.recipientPrincipal, caller)) {
          return #err "Not authorized";
        };
        notifications.remove(notifId);
        #ok;
      };
      case null { #err "Notification not found" };
    };
  };
};
