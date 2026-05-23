import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import ConsentTypes "../types/consent";

module {
  public type ConsentRecord = ConsentTypes.ConsentRecord;
  public type ConsentAuditEntry = ConsentTypes.ConsentAuditEntry;
  public type ConsentMap = Map.Map<Principal, ConsentRecord>;

  public func getConsent(
    consents : ConsentMap,
    caller : Principal,
  ) : ?ConsentRecord {
    consents.get(caller);
  };

  public func updateConsent(
    consents : ConsentMap,
    caller : Principal,
    adherenceSharing : Bool,
    prescriptionSharing : Bool,
    diagnosticAccess : Bool,
  ) : { #ok : ConsentRecord; #err : Text } {
    let now = Time.now();
    // Build audit entries for each changed field
    let existing = consents.get(caller);
    var entries : [ConsentAuditEntry] = switch (existing) {
      case (?rec) { rec.auditTrail };
      case null { [] };
    };
    let addAudit = func(field : Text, newVal : Bool) {
      let entry : ConsentAuditEntry = {
        action = if (newVal) "enabled" else "disabled";
        timestamp = now;
        field;
      };
      entries := entries.concat([entry]);
    };
    switch (existing) {
      case (?rec) {
        if (rec.adherenceSharing != adherenceSharing) { addAudit("adherenceSharing", adherenceSharing) };
        if (rec.prescriptionSharing != prescriptionSharing) { addAudit("prescriptionSharing", prescriptionSharing) };
        if (rec.diagnosticAccess != diagnosticAccess) { addAudit("diagnosticAccess", diagnosticAccess) };
      };
      case null {
        addAudit("adherenceSharing", adherenceSharing);
        addAudit("prescriptionSharing", prescriptionSharing);
        addAudit("diagnosticAccess", diagnosticAccess);
      };
    };
    let id = switch (existing) {
      case (?rec) { rec.id };
      case null { caller.toText() # "-consent" };
    };
    let record : ConsentRecord = {
      id;
      patientPrincipal = caller;
      adherenceSharing;
      prescriptionSharing;
      diagnosticAccess;
      lastUpdated = now;
      auditTrail = entries;
    };
    consents.add(caller, record);
    #ok record;
  };

  public func revokeAllConsent(
    consents : ConsentMap,
    caller : Principal,
  ) : { #ok : ConsentRecord; #err : Text } {
    let now = Time.now();
    let revokeEntry : ConsentAuditEntry = {
      action = "revoked_all";
      timestamp = now;
      field = "all";
    };
    let (id, existingAudit) = switch (consents.get(caller)) {
      case (?rec) { (rec.id, rec.auditTrail) };
      case null { (caller.toText() # "-consent", []) };
    };
    let record : ConsentRecord = {
      id;
      patientPrincipal = caller;
      adherenceSharing = false;
      prescriptionSharing = false;
      diagnosticAccess = false;
      lastUpdated = now;
      auditTrail = existingAudit.concat([revokeEntry]);
    };
    consents.add(caller, record);
    #ok record;
  };

  public func getConsentAuditTrail(
    consents : ConsentMap,
    caller : Principal,
  ) : [ConsentAuditEntry] {
    switch (consents.get(caller)) {
      case (?rec) { rec.auditTrail };
      case null { [] };
    };
  };

  /// Return all patients who have at least one consent flag set.
  public func getConsentedPatients(consents : ConsentMap) : [ConsentRecord] {
    consents.values()
      .filter(func(r) { r.adherenceSharing or r.prescriptionSharing or r.diagnosticAccess })
      .toArray();
  };
};
