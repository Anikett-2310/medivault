import Map "mo:core/Map";
import HospTypes "../types/hospital";
import Time "mo:core/Time";

module {
  public type Appointment = HospTypes.Appointment;
  public type AppointmentsMap = Map.Map<Text, Appointment>;

  public func createAppointment(
    appointments : AppointmentsMap,
    patientName : Text,
    dateTime : Int,
    notes : Text,
  ) : { #ok : Appointment; #err : Text } {
    let id = patientName # "-apt-" # Time.now().toText();
    let appointment : Appointment = {
      id;
      patientName;
      dateTime;
      status = "Scheduled";
      notes;
    };
    appointments.add(id, appointment);
    #ok appointment;
  };

  public func getAppointments(
    appointments : AppointmentsMap,
  ) : [Appointment] {
    appointments.values().toArray();
  };

  public func updateAppointmentStatus(
    appointments : AppointmentsMap,
    id : Text,
    status : Text,
  ) : { #ok : Appointment; #err : Text } {
    switch (appointments.get(id)) {
      case (?apt) {
        let updated = { apt with status };
        appointments.add(id, updated);
        #ok updated;
      };
      case null { #err "Appointment not found" };
    };
  };
};
