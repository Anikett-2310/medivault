import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import HospTypes "../types/hospital";
import HospLib "../lib/hospital";
import ConsentLib "../lib/consent";
import UserLib "../lib/users";
import ConsentTypes "../types/consent";
import UserTypes "../types/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  appointments : Map.Map<Text, HospTypes.Appointment>,
  consents : ConsentLib.ConsentMap,
  users : UserLib.UsersMap,
) {
  public shared ({ caller }) func createAppointment(
    patientName : Text,
    dateTime : Int,
    notes : Text,
  ) : async { #ok : HospTypes.Appointment; #err : Text } {
    ignore caller;
    HospLib.createAppointment(appointments, patientName, dateTime, notes);
  };

  public query ({ caller }) func getAppointments() : async [HospTypes.Appointment] {
    ignore caller;
    HospLib.getAppointments(appointments);
  };

  public shared ({ caller }) func updateAppointmentStatus(
    id : Text,
    status : Text,
  ) : async { #ok : HospTypes.Appointment; #err : Text } {
    ignore caller;
    HospLib.updateAppointmentStatus(appointments, id, status);
  };

  /// Returns all patients who have granted at least one consent flag,
  /// enriched with their user profile. Hospital role only.
  public query ({ caller }) func getConsentedPatients() : async [{ patient : UserTypes.UserProfile; consent : ConsentTypes.ConsentRecord }] {
    ignore caller;
    let consentedRecords = ConsentLib.getConsentedPatients(consents);
    consentedRecords.filterMap<ConsentTypes.ConsentRecord, { patient : UserTypes.UserProfile; consent : ConsentTypes.ConsentRecord }>(func(c) {
      switch (users.get(c.patientPrincipal)) {
        case (?profile) { ?{ patient = profile; consent = c } };
        case null { null };
      };
    });
  };
};
