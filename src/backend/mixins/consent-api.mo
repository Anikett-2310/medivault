import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import ConsentLib "../lib/consent";
import ActivityLib "../lib/activity";

mixin (
  accessControlState : AccessControl.AccessControlState,
  consents : ConsentLib.ConsentMap,
  activityEvents : ActivityLib.ActivityMap,
) {
  public shared query ({ caller }) func getMyConsent() : async ?ConsentLib.ConsentRecord {
    ignore accessControlState;
    ConsentLib.getConsent(consents, caller);
  };

  public shared ({ caller }) func updateConsent(
    adherenceSharing : Bool,
    prescriptionSharing : Bool,
    diagnosticAccess : Bool,
  ) : async { #ok : ConsentLib.ConsentRecord; #err : Text } {
    ignore accessControlState;
    let result = ConsentLib.updateConsent(consents, caller, adherenceSharing, prescriptionSharing, diagnosticAccess);
    switch (result) {
      case (#ok _) {
        ActivityLib.recordEvent(
          activityEvents, #Patient, caller,
          #ConsentGranted,
          null,
          ?("adherence:" # debug_show adherenceSharing
            # ",prescription:" # debug_show prescriptionSharing
            # ",diagnostic:" # debug_show diagnosticAccess),
        );
      };
      case (#err _) {};
    };
    result;
  };

  public shared ({ caller }) func revokeAllConsent() : async { #ok : ConsentLib.ConsentRecord; #err : Text } {
    ignore accessControlState;
    let result = ConsentLib.revokeAllConsent(consents, caller);
    switch (result) {
      case (#ok _) {
        ActivityLib.recordEvent(
          activityEvents, #Patient, caller,
          #ConsentRevoked,
          null,
          null,
        );
      };
      case (#err _) {};
    };
    result;
  };

  public shared query ({ caller }) func getConsentAuditTrail() : async [ConsentLib.ConsentAuditEntry] {
    ignore accessControlState;
    ConsentLib.getConsentAuditTrail(consents, caller);
  };
};
