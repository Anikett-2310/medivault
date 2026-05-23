import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import MedTypes "../types/medicines";
import MedLib "../lib/medicines";

mixin (
  accessControlState : AccessControl.AccessControlState,
  medicines : Map.Map<Text, MedTypes.Medicine>,
  doseLogs : Map.Map<Text, MedTypes.DoseLog>,
  reminders : Map.Map<Text, MedTypes.Reminder>,
) {
  public shared ({ caller }) func createMedicine(
    name : Text,
    dosage : Text,
    frequency : Text,
    expiryDate : Int,
    category : CommonTypes.MedicineCategory,
  ) : async { #ok : MedTypes.Medicine; #err : Text } {
    MedLib.createMedicine(medicines, caller, name, dosage, frequency, expiryDate, category);
  };

  public query ({ caller }) func getMyMedicines() : async [MedTypes.Medicine] {
    MedLib.getMyMedicines(medicines, caller);
  };

  public shared ({ caller }) func updateMedicine(
    id : Text,
    name : Text,
    dosage : Text,
    frequency : Text,
    expiryDate : Int,
    category : CommonTypes.MedicineCategory,
  ) : async { #ok : MedTypes.Medicine; #err : Text } {
    MedLib.updateMedicine(medicines, caller, id, name, dosage, frequency, expiryDate, category);
  };

  public shared ({ caller }) func deleteMedicine(
    id : Text,
  ) : async { #ok; #err : Text } {
    MedLib.deleteMedicine(medicines, caller, id);
  };

  public shared ({ caller }) func updateMedicinePrescriptionUrl(
    id : Text,
    url : Text,
  ) : async { #ok; #err : Text } {
    MedLib.updatePrescriptionUrl(medicines, caller, id, url);
  };

  public shared ({ caller }) func logDose(
    medicineId : Text,
    takenAt : Int,
    isOnTime : Bool,
  ) : async { #ok : MedTypes.DoseLog; #err : Text } {
    MedLib.logDose(doseLogs, caller, medicineId, takenAt, isOnTime);
  };

  public query ({ caller }) func getMyDoseLogs(
    medicineId : ?Text,
  ) : async [MedTypes.DoseLog] {
    MedLib.getMyDoseLogs(doseLogs, caller, medicineId);
  };

  public query ({ caller }) func getAdherenceScore(
    medicineId : Text,
  ) : async Float {
    MedLib.getAdherenceScore(doseLogs, caller, medicineId);
  };

  public shared ({ caller }) func createReminder(
    medicineId : Text,
    reminderTime : Text,
    voiceEnabled : Bool,
  ) : async { #ok : MedTypes.Reminder; #err : Text } {
    MedLib.createReminder(reminders, caller, medicineId, reminderTime, voiceEnabled);
  };

  public query ({ caller }) func getMyReminders() : async [MedTypes.Reminder] {
    MedLib.getMyReminders(reminders, caller);
  };

  public shared ({ caller }) func updateReminder(
    id : Text,
    reminderTime : Text,
    isEnabled : Bool,
    voiceEnabled : Bool,
  ) : async { #ok : MedTypes.Reminder; #err : Text } {
    MedLib.updateReminder(reminders, caller, id, reminderTime, isEnabled, voiceEnabled);
  };

  public shared ({ caller }) func deleteReminder(
    id : Text,
  ) : async { #ok; #err : Text } {
    MedLib.deleteReminder(reminders, caller, id);
  };
};
