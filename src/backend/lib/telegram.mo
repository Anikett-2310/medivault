import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import TelegramTypes "../types/telegram";
import OutCall "mo:caffeineai-http-outcalls/outcall";

module {
  public type TelegramLog = TelegramTypes.TelegramLog;
  public type TelegramLogsMap = Map.Map<Text, TelegramLog>;

  // Re-export OutCall types so the mixin can reference them without a direct import.
  public type TransformFn = shared query OutCall.TransformationInput -> async OutCall.TransformationOutput;

  // Outcome type for send operations — avoids deprecated Result module.
  public type SendResult = { #ok; #err : Text };

  // Bot token stored at module level as a var wrapped in a record so it
  // can be mutably updated without crossing actor-field boundaries.
  // The canister wires in the state record from main.mo.
  public type TelegramState = { var botToken : ?Text };

  public func initState() : TelegramState {
    { var botToken = null };
  };

  // Store the bot token (called by admin at runtime via the mixin).
  public func setBotToken(state : TelegramState, token : Text) {
    state.botToken := ?token;
  };

  // Returns true only when a bot token has been configured.
  public func isBotTokenConfigured(state : TelegramState) : Bool {
    switch (state.botToken) {
      case (?_) true;
      case null false;
    };
  };

  // Send a Telegram message to the given chat ID.
  // `transformFn` must be the actor-level query transform — modules cannot declare query funcs.
  public func sendTelegramMessage(
    state : TelegramState,
    chatId : Text,
    message : Text,
    transformFn : TransformFn,
  ) : async SendResult {
    switch (state.botToken) {
      case null {
        #err "Telegram bot not configured";
      };
      case (?token) {
        let url = "https://api.telegram.org/bot" # token # "/sendMessage";
        let body = "{\"chat_id\":\"" # chatId # "\",\"text\":\"" # escapeJson(message) # "\"}";
        let headers : [OutCall.Header] = [
          { name = "Content-Type"; value = "application/json" },
        ];
        try {
          let _response = await OutCall.httpPostRequest(url, headers, body, transformFn);
          #ok;
        } catch (_e) {
          #err "HTTP outcall failed";
        };
      };
    };
  };

  func escapeJson(s : Text) : Text {
    var result = "";
    for (c in s.chars()) {
      let ch = Text.fromChar(c);
      if (ch == "\\") { result #= "\\\\" }
      else if (ch == "\"") { result #= "\\\"" }
      else if (c == '\n') { result #= "\\n" }
      else if (c == '\r') { result #= "\\r" }
      else { result #= ch };
    };
    result;
  };

  // Send a test message to verify the chat ID is correct.
  public func sendTestMessage(
    state : TelegramState,
    chatId : Text,
    transformFn : TransformFn,
  ) : async SendResult {
    let msg = "[REMINDER] MediVault Test\nThis is a test notification from MediVault. Your Telegram reminders are configured correctly.";
    await sendTelegramMessage(state, chatId, msg, transformFn);
  };

  // Retrieve all Telegram notification logs for a given principal.
  public func getTelegramLogs(
    logs : TelegramLogsMap,
    principal : Principal,
  ) : [TelegramLog] {
    logs.entries()
      .filter(func((_, log)) { log.userPrincipal == principal })
      .map<(Text, TelegramLog), TelegramLog>(func((_, log)) { log })
      .toArray();
  };

  public func storeTelegramLog(logs : TelegramLogsMap, log : TelegramLog) {
    logs.add(log.id, log);
  };
};
