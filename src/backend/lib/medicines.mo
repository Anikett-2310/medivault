import Map "mo:core/Map";
import Principal "mo:core/Principal";
import CommonTypes "../types/common";
import MedTypes "../types/medicines";
import Time "mo:core/Time";

module {
  public type Medicine = MedTypes.Medicine;
  public type DoseLog = MedTypes.DoseLog;
  public type Reminder = MedTypes.Reminder;
  public type MedicineCategory = CommonTypes.MedicineCategory;
  public type MedicinesMap = Map.Map<Text, Medicine>;
  public type DoseLogsMap = Map.Map<Text, DoseLog>;
  public type RemindersMap = Map.Map<Text, Reminder>;

  public func createMedicine(
    medicines : MedicinesMap,
    caller : Principal,
    name : Text,
    dosage : Text,
    frequency : Text,
    expiryDate : Int,
    category : MedicineCategory,
  ) : { #ok : Medicine; #err : Text } {
    let id = caller.toText() # "-" # Time.now().toText();
    let medicine : Medicine = {
      id;
      name;
      dosage;
      frequency;
      expiryDate;
      category;
      ownerPrincipal = caller;
      prescriptionUrl = null;
      createdAt = Time.now();
    };
    medicines.add(id, medicine);
    #ok medicine;
  };

  public func getMyMedicines(
    medicines : MedicinesMap,
    caller : Principal,
  ) : [Medicine] {
    medicines.values().filter(func(m) { Principal.equal(m.ownerPrincipal, caller) }).toArray();
  };

  public func updateMedicine(
    medicines : MedicinesMap,
    caller : Principal,
    id : Text,
    name : Text,
    dosage : Text,
    frequency : Text,
    expiryDate : Int,
    category : MedicineCategory,
  ) : { #ok : Medicine; #err : Text } {
    switch (medicines.get(id)) {
      case (?m) {
        if (not Principal.equal(m.ownerPrincipal, caller)) {
          return #err "Not authorized";
        };
        let updated = { m with name; dosage; frequency; expiryDate; category };
        medicines.add(id, updated);
        #ok updated;
      };
      case null { #err "Medicine not found" };
    };
  };

  public func deleteMedicine(
    medicines : MedicinesMap,
    caller : Principal,
    id : Text,
  ) : { #ok; #err : Text } {
    switch (medicines.get(id)) {
      case (?m) {
        if (not Principal.equal(m.ownerPrincipal, caller)) {
          return #err "Not authorized";
        };
        medicines.remove(id);
        #ok;
      };
      case null { #err "Medicine not found" };
    };
  };

  public func updatePrescriptionUrl(
    medicines : MedicinesMap,
    caller : Principal,
    id : Text,
    url : Text,
  ) : { #ok; #err : Text } {
    switch (medicines.get(id)) {
      case (?m) {
        if (not Principal.equal(m.ownerPrincipal, caller)) {
          return #err "Not authorized";
        };
        medicines.add(id, { m with prescriptionUrl = ?url });
        #ok;
      };
      case null { #err "Medicine not found" };
    };
  };

  public func logDose(
    doseLogs : DoseLogsMap,
    caller : Principal,
    medicineId : Text,
    takenAt : Int,
    isOnTime : Bool,
  ) : { #ok : DoseLog; #err : Text } {
    let id = caller.toText() # "-dose-" # Time.now().toText();
    let log : DoseLog = {
      id;
      medicineId;
      userPrincipal = caller;
      takenAt;
      isOnTime;
    };
    doseLogs.add(id, log);
    #ok log;
  };

  public func getMyDoseLogs(
    doseLogs : DoseLogsMap,
    caller : Principal,
    medicineId : ?Text,
  ) : [DoseLog] {
    doseLogs.values().filter(func(l) {
      if (not Principal.equal(l.userPrincipal, caller)) { return false };
      switch (medicineId) {
        case (?mid) { l.medicineId == mid };
        case null { true };
      };
    }).toArray();
  };

  public func getAdherenceScore(
    doseLogs : DoseLogsMap,
    caller : Principal,
    medicineId : Text,
  ) : Float {
    let logs = doseLogs.values().filter(func(l) {
      Principal.equal(l.userPrincipal, caller) and l.medicineId == medicineId;
    }).toArray();
    let takenCount = logs.size();
    if (takenCount == 0) { return 0.0 };
    // Approximate: assume at least 1 dose per day since creation
    // Use takenCount as numerator, treat 30 as baseline expected
    let expected : Float = 30.0;
    let score = takenCount.toFloat() / expected * 100.0;
    if (score > 100.0) { 100.0 } else { score };
  };

  public func createReminder(
    reminders : RemindersMap,
    caller : Principal,
    medicineId : Text,
    reminderTime : Text,
    voiceEnabled : Bool,
  ) : { #ok : Reminder; #err : Text } {
    let id = caller.toText() # "-rem-" # Time.now().toText();
    let reminder : Reminder = {
      id;
      medicineId;
      userPrincipal = caller;
      reminderTime;
      isEnabled = true;
      voiceEnabled;
      createdAt = Time.now();
    };
    reminders.add(id, reminder);
    #ok reminder;
  };

  public func getMyReminders(
    reminders : RemindersMap,
    caller : Principal,
  ) : [Reminder] {
    reminders.values().filter(func(r) { Principal.equal(r.userPrincipal, caller) }).toArray();
  };

  public func updateReminder(
    reminders : RemindersMap,
    caller : Principal,
    id : Text,
    reminderTime : Text,
    isEnabled : Bool,
    voiceEnabled : Bool,
  ) : { #ok : Reminder; #err : Text } {
    switch (reminders.get(id)) {
      case (?r) {
        if (not Principal.equal(r.userPrincipal, caller)) {
          return #err "Not authorized";
        };
        let updated = { r with reminderTime; isEnabled; voiceEnabled };
        reminders.add(id, updated);
        #ok updated;
      };
      case null { #err "Reminder not found" };
    };
  };

  public func deleteReminder(
    reminders : RemindersMap,
    caller : Principal,
    id : Text,
  ) : { #ok; #err : Text } {
    switch (reminders.get(id)) {
      case (?r) {
        if (not Principal.equal(r.userPrincipal, caller)) {
          return #err "Not authorized";
        };
        reminders.remove(id);
        #ok;
      };
      case null { #err "Reminder not found" };
    };
  };
};
