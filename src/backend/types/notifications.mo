import Principal "mo:core/Principal";
import Common "common";

module {
  public type NotifType = {
    #MedicineSynced;
    #LowStock;
    #ExpiringSoon;
    #ReportReady;
    #BookingConfirmed;
    #BookingCompleted;
    #ReminderMissed;
    #ConsentChanged;
  };

  public type NotificationRecord = {
    id : Text;
    recipientPrincipal : Principal;
    role : Common.UserRole;
    notifType : NotifType;
    message : Text;
    isRead : Bool;
    createdAt : Common.Timestamp;
    relatedId : ?Text;
  };
};
