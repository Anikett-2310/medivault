import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import UserTypes "../types/users";
import Time "mo:core/Time";

module {
  public type UserProfile = UserTypes.UserProfile;
  public type UserRole = CommonTypes.UserRole;
  public type UsersMap = Map.Map<Principal, UserProfile>;

  public func registerUser(
    users : UsersMap,
    caller : Principal,
    email : Text,
    name : Text,
    role : UserRole,
  ) : { #ok : UserProfile; #err : Text } {
    if (users.containsKey(caller)) {
      return #err "User already registered";
    };
    let id = caller.toText();
    let profile : UserProfile = {
      id;
      principal = caller;
      name;
      email;
      role;
      registrationDate = Time.now();
      isActive = true;
      telegramChatId = null;
      telegramEnabled = false;
      phone = null;
    };
    users.add(caller, profile);
    #ok profile;
  };

  public func getProfile(
    users : UsersMap,
    caller : Principal,
  ) : { #ok : UserProfile; #err : Text } {
    switch (users.get(caller)) {
      case (?profile) { #ok profile };
      case null { #err "User not found" };
    };
  };

  public func getAllUsers(users : UsersMap) : [UserProfile] {
    users.values().toArray();
  };

  public func updateUserStatus(
    users : UsersMap,
    userId : Text,
    isActive : Bool,
  ) : { #ok; #err : Text } {
    let found = users.entries().find(func((_, p)) { p.id == userId });
    switch (found) {
      case (?(key, profile)) {
        users.add(key, { profile with isActive });
        #ok;
      };
      case null { #err "User not found" };
    };
  };
  /// Update mutable profile fields for the calling user.
  /// Telegram fields are optional — only updated when present in the request.
  public func updateUserProfile(
    users : UsersMap,
    caller : Principal,
    name : Text,
    email : Text,
    telegramChatId : ?Text,
    telegramEnabled : Bool,
    phone : ?Text,
  ) : { #ok : UserProfile; #err : Text } {
    switch (users.get(caller)) {
      case (?profile) {
        let updated = {
          profile with
          name;
          email;
          telegramChatId;
          telegramEnabled;
          phone;
        };
        users.add(caller, updated);
        #ok updated;
      };
      case null { #err "User not found" };
    };
  };

  /// Look up a patient by phone number (exact match). Returns (principal, name) or null.
  public func lookupPatientByPhone(
    users : UsersMap,
    phone : Text,
  ) : ?(Principal, Text) {
    let found = users.values().find(func(p) {
      switch (p.phone) {
        case (?ph) { ph == phone and p.role == #Patient };
        case null { false };
      };
    });
    switch (found) {
      case (?p) { ?(p.principal, p.name) };
      case null { null };
    };
  };
};
