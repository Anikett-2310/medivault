import Common "common";

module {
  public type Appointment = {
    id : Text;
    patientName : Text;
    dateTime : Common.Timestamp;
    status : Text;
    notes : Text;
  };
};
