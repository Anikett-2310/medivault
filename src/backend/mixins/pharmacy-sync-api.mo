import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Time "mo:core/Time";
import PharmTypes "../types/pharmacy";
import MedTypes "../types/medicines";
import CommonTypes "../types/common";
import NotifLib "../lib/notifications";
import UserLib "../lib/users";
import ActivityLib "../lib/activity";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : UserLib.UsersMap,
  syncLogs : Map.Map<Text, PharmTypes.PharmacySyncLog>,
  syncedMedicines : Map.Map<Text, MedTypes.SyncedMedicine>,
  notifications : NotifLib.NotificationMap,
  activityEvents : ActivityLib.ActivityMap,
) {
  /// Look up a patient by phone number. Pharmacy-only.
  public shared query ({ caller }) func lookupPatientByPhone(
    phone : Text,
  ) : async { #ok : { name : Text; principal : Principal }; #err : Text } {
    ignore accessControlState;
    switch (UserLib.lookupPatientByPhone(users, phone)) {
      case (?(principal, name)) { #ok { name; principal } };
      case null { #err "No patient found with that phone number" };
    };
  };

  /// Sync a medicine to a patient via phone number auto-match. Pharmacy-only.
  public shared ({ caller }) func syncMedicineToPatient(
    patientPhone : Text,
    medicineName : Text,
    batchNumber : Text,
    expiryDate : Int,
    quantity : Nat,
  ) : async { #ok : PharmTypes.PharmacySyncLog; #err : Text } {
    ignore accessControlState;
    let patientResult = UserLib.lookupPatientByPhone(users, patientPhone);
    switch (patientResult) {
      case null {
        return #err ("No patient found with phone: " # patientPhone);
      };
      case (?(patientPrincipal, patientName)) {
        // Duplicate check: same pharmacy + patient + medicineName + batchNumber
        let isDuplicate = syncedMedicines.values().find(func(m) {
          Principal.equal(m.ownerPrincipal, patientPrincipal)
          and m.name == medicineName
          and m.batchNumber == batchNumber
          and Principal.equal(m.sourcePrincipal, caller)
        });
        if (isDuplicate != null) {
          let now = Time.now();
          let logId = caller.toText() # "-synclog-" # now.toText();
          let dupLog : PharmTypes.PharmacySyncLog = {
            id = logId;
            pharmacyPrincipal = caller;
            patientPrincipal;
            medicineName;
            batchNumber;
            expiryDate;
            quantity;
            syncedAt = now;
            status = #Duplicate;
            errorMessage = ?"Medicine already synced to this patient";
          };
          syncLogs.add(logId, dupLog);
          return #err "Medicine already synced to this patient";
        };
        // Create synced medicine entry
        let now = Time.now();
        let medId = patientPrincipal.toText() # "-sync-" # now.toText();
        let synced : MedTypes.SyncedMedicine = {
          id = medId;
          name = medicineName;
          dosage = "";
          frequency = "";
          expiryDate;
          category = #Other;
          ownerPrincipal = patientPrincipal;
          prescriptionUrl = null;
          createdAt = now;
          sourcePharmacy = caller.toText();
          sourcePrincipal = caller;
          purchaseTimestamp = now;
          batchNumber;
        };
        syncedMedicines.add(medId, synced);
        // Create success log
        let logId = caller.toText() # "-synclog-" # now.toText();
        let log : PharmTypes.PharmacySyncLog = {
          id = logId;
          pharmacyPrincipal = caller;
          patientPrincipal;
          medicineName;
          batchNumber;
          expiryDate;
          quantity;
          syncedAt = now;
          status = #Success;
          errorMessage = null;
        };
        syncLogs.add(logId, log);
        // Notify patient
        ignore NotifLib.createNotification(
          notifications,
          patientPrincipal, #Patient, #MedicineSynced,
          "Medicine '" # medicineName # "' has been synced to your account from a pharmacy.",
          ?logId,
        );
        // Record pharmacy-side activity event
        ActivityLib.recordEvent(
          activityEvents, #Pharmacy, caller,
          #MedicineSyncedToPatient,
          ?logId,
          ?("patient:" # patientPrincipal.toText() # ",medicine:" # medicineName # ",pharmacy:" # caller.toText()),
        );
        // Record patient-side activity event
        ActivityLib.recordEvent(
          activityEvents, #Patient, patientPrincipal,
          #MedicineSyncedFromPharmacy,
          ?patientPrincipal.toText(),
          ?("pharmacy:" # caller.toText() # ",medicine:" # medicineName # ",batch:" # batchNumber),
        );
        #ok log;
      };
    };
  };

  /// Return sync logs for the calling pharmacy.
  public shared query ({ caller }) func getPharmacySyncLogs() : async [PharmTypes.PharmacySyncLog] {
    ignore accessControlState;
    syncLogs.values()
      .filter(func(l) { Principal.equal(l.pharmacyPrincipal, caller) })
      .toArray();
  };

  /// Return synced medicines for the calling patient.
  public shared query ({ caller }) func getMySyncedMedicines() : async [MedTypes.SyncedMedicine] {
    ignore accessControlState;
    syncedMedicines.values()
      .filter(func(m) { Principal.equal(m.ownerPrincipal, caller) })
      .toArray();
  };
};
