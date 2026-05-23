import Principal "mo:core/Principal";
import Common "common";

module {
  public type BookingStatus = {
    #Booked;
    #Confirmed;
    #InProgress;
    #Completed;
    #ReportUploaded;
  };

  public type BookingStatusEntry = {
    status : BookingStatus;
    timestamp : Common.Timestamp;
    note : Text;
  };

  public type DiagnosticBooking = {
    id : Text;
    patientPrincipal : Principal;
    labPrincipal : Principal;
    testType : Text;
    preferredDate : Text;
    reason : ?Text;
    status : BookingStatus;
    statusHistory : [BookingStatusEntry];
    reportUrl : ?Text;
    reportUploadedAt : ?Common.Timestamp;
    createdAt : Common.Timestamp;
  };
};
