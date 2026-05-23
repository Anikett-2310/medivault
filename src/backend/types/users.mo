import Principal "mo:core/Principal";
import Common "common";

module {
  public type UserProfile = {
    id : Text;
    principal : Principal;
    name : Text;
    email : Text;
    role : Common.UserRole;
    registrationDate : Common.Timestamp;
    isActive : Bool;
    telegramChatId : ?Text;
    telegramEnabled : Bool;
    phone : ?Text;
  };

  /// Subset of UserProfile fields that callers may update via updateUserProfile.
  public type UserProfileUpdate = {
    name : Text;
    email : Text;
    telegramChatId : ?Text;
    telegramEnabled : Bool;
    phone : ?Text;
  };
};
