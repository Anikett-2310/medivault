import Principal "mo:core/Principal";

module {
  public type TelegramLog = {
    id : Text;
    userPrincipal : Principal;
    medicineId : Text;
    medicineName : Text;
    reminderTime : Text;
    status : Text; // "sent" | "failed"
    errorMessage : ?Text;
    timestamp : Int;
  };
};
