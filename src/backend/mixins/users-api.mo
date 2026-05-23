import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserLib "../lib/users";
import CommonTypes "../types/common";
import UserTypes "../types/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, UserTypes.UserProfile>,
) {
  public shared ({ caller }) func registerUser(
    email : Text,
    name : Text,
    role : CommonTypes.UserRole,
  ) : async { #ok : UserTypes.UserProfile; #err : Text } {
    UserLib.registerUser(users, caller, email, name, role);
  };

  public query ({ caller }) func getMyProfile() : async { #ok : UserTypes.UserProfile; #err : Text } {
    UserLib.getProfile(users, caller);
  };

  public query ({ caller }) func getAllUsers() : async [UserTypes.UserProfile] {
    ignore caller;
    UserLib.getAllUsers(users);
  };

  public shared ({ caller }) func updateUserStatus(
    userId : Text,
    isActive : Bool,
  ) : async { #ok; #err : Text } {
    ignore caller;
    UserLib.updateUserStatus(users, userId, isActive);
  };

  public shared ({ caller }) func updateUserProfile(
    name : ?Text,
    email : ?Text,
    telegramChatId : ?Text,
    telegramEnabled : ?Bool,
  ) : async { #ok : UserTypes.UserProfile; #err : Text } {
    switch (users.get(caller)) {
      case null { #err "User not found" };
      case (?profile) {
        let newName = switch (name) { case (?n) n; case null profile.name };
        let newEmail = switch (email) { case (?e) e; case null profile.email };
        let newChatId = switch (telegramChatId) { case (?c) ?c; case null profile.telegramChatId };
        let newEnabled = switch (telegramEnabled) { case (?b) b; case null profile.telegramEnabled };
        UserLib.updateUserProfile(users, caller, newName, newEmail, newChatId, newEnabled, profile.phone);
      };
    };
  };

  // Authorization compatibility: provide getCallerUserProfile / saveCallerUserProfile for frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserTypes.UserProfile {
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(
    profile : UserTypes.UserProfile,
  ) : async () {
    users.add(caller, { profile with principal = caller });
  };

  public query ({ caller }) func getUserProfile(
    user : Principal,
  ) : async ?UserTypes.UserProfile {
    ignore caller;
    users.get(user);
  };
};
