import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import UserLib "../lib/users";
import TelegramLib "../lib/telegram";
import UserTypes "../types/users";
import TelegramTypes "../types/telegram";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, UserTypes.UserProfile>,
  telegramLogs : Map.Map<Text, TelegramTypes.TelegramLog>,
  telegramState : TelegramLib.TelegramState,
) {
  // Required transform callback for http-outcalls — MUST live in actor scope (query funcs are actor-only).
  public query func transform(
    input : OutCall.TransformationInput,
  ) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Admin-only: configure the Telegram bot token.
  public shared ({ caller }) func setBotToken(token : Text) : async { #ok; #err : Text } {
    let profile = users.get(caller);
    switch (profile) {
      case (?p) {
        if (p.role != #Admin) {
          return #err "Admin access required";
        };
      };
      case null { return #err "User not found" };
    };
    TelegramLib.setBotToken(telegramState, token);
    #ok;
  };

  // Query: returns true when a bot token has been configured.
  public query func isBotTokenConfigured() : async Bool {
    TelegramLib.isBotTokenConfigured(telegramState);
  };

  // Send a test Telegram message to verify the caller's chat ID.
  public shared ({ caller }) func sendTestTelegramMessage(
    chatId : Text,
  ) : async { #ok; #err : Text } {
    ignore caller;
    switch (await TelegramLib.sendTestMessage(telegramState, chatId, transform)) {
      case (#ok ()) #ok;
      case (#err e) #err e;
    };
  };

  // Query: return all Telegram notification logs for the calling user.
  public query ({ caller }) func getUserTelegramLogs() : async [TelegramTypes.TelegramLog] {
    TelegramLib.getTelegramLogs(telegramLogs, caller);
  };

  // Update the caller's Telegram settings (chat ID and enabled flag).
  public shared ({ caller }) func updateTelegramSettings(
    chatId : ?Text,
    enabled : ?Bool,
  ) : async { #ok : UserTypes.UserProfile; #err : Text } {
    switch (users.get(caller)) {
      case null { #err "User not found" };
      case (?profile) {
        let newChatId = switch (chatId) { case (?c) ?c; case null profile.telegramChatId };
        let newEnabled = switch (enabled) { case (?b) b; case null profile.telegramEnabled };
        UserLib.updateUserProfile(
          users,
          caller,
          profile.name,
          profile.email,
          newChatId,
          newEnabled,
          profile.phone,
        );
      };
    };
  };
};
