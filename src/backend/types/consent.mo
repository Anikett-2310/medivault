import Principal "mo:core/Principal";
import Common "common";

module {
  public type ConsentAuditEntry = {
    action : Text;
    timestamp : Common.Timestamp;
    field : Text;
  };

  public type ConsentRecord = {
    id : Text;
    patientPrincipal : Principal;
    adherenceSharing : Bool;
    prescriptionSharing : Bool;
    diagnosticAccess : Bool;
    lastUpdated : Common.Timestamp;
    auditTrail : [ConsentAuditEntry];
  };
};
