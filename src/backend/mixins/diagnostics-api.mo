import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import DiagLib "../lib/diagnostics";
import ActivityLib "../lib/activity";
import NotifLib "../lib/notifications";

mixin (
  accessControlState : AccessControl.AccessControlState,
  bookings : DiagLib.BookingMap,
  activityEvents : ActivityLib.ActivityMap,
  notifications : NotifLib.NotificationMap,
) {
  public shared ({ caller }) func createDiagnosticBooking(
    labPrincipal : Principal,
    testType : Text,
    preferredDate : Text,
    reason : ?Text,
  ) : async { #ok : DiagLib.DiagnosticBooking; #err : Text } {
    ignore accessControlState;
    let result = DiagLib.createBooking(bookings, caller, labPrincipal, testType, preferredDate, reason);
    switch (result) {
      case (#ok booking) {
        // Patient books — record patient-side event
        ActivityLib.recordEvent(
          activityEvents, #Patient, caller,
          #DiagnosticBooked,
          ?booking.id,
          ?("lab:" # labPrincipal.toText() # ",test:" # testType),
        );
        // Lab receives — record lab-side event with lab principal as actor
        ActivityLib.recordEvent(
          activityEvents, #Diagnostic, labPrincipal,
          #BookingReceived,
          ?booking.id,
          ?("patient:" # caller.toText() # ",test:" # testType),
        );
        ignore NotifLib.createNotification(
          notifications, caller, #Patient, #BookingConfirmed,
          "Your diagnostic test '" # testType # "' has been booked.",
          ?booking.id,
        );
      };
      case (#err _) {};
    };
    result;
  };

  public shared query ({ caller }) func getMyDiagnosticBookings() : async [DiagLib.DiagnosticBooking] {
    ignore accessControlState;
    DiagLib.getMyBookings(bookings, caller);
  };

  public shared query ({ caller }) func getLabDiagnosticBookings() : async [DiagLib.DiagnosticBooking] {
    ignore accessControlState;
    DiagLib.getLabBookings(bookings, caller);
  };

  public shared ({ caller }) func updateDiagnosticBookingStatus(
    bookingId : Text,
    status : DiagLib.BookingStatus,
    note : Text,
  ) : async { #ok : DiagLib.DiagnosticBooking; #err : Text } {
    ignore accessControlState;
    let result = DiagLib.updateBookingStatus(bookings, caller, bookingId, status, note);
    switch (result) {
      case (#ok booking) {
        let evtType : ActivityLib.ActivityEventType = switch (status) {
          case (#Confirmed)        #BookingAccepted;
          case (#InProgress)       #TestProcessingStarted;
          case (#Completed)        #ReportCompleted;
          case (#ReportUploaded)   #ReportUploaded;
          case (#Booked)           #BookingReceived;
        };
        ActivityLib.recordEvent(
          activityEvents, #Diagnostic, caller,
          evtType,
          ?bookingId,
          ?("patient:" # booking.patientPrincipal.toText()),
        );
      };
      case (#err _) {};
    };
    result;
  };

  public shared ({ caller }) func uploadDiagnosticReport(
    bookingId : Text,
    reportUrl : Text,
  ) : async { #ok : DiagLib.DiagnosticBooking; #err : Text } {
    ignore accessControlState;
    let result = DiagLib.uploadReport(bookings, caller, bookingId, reportUrl);
    switch (result) {
      case (#ok booking) {
        ActivityLib.recordEvent(
          activityEvents, #Diagnostic, caller,
          #ReportUploaded,
          ?bookingId,
          ?("patient:" # booking.patientPrincipal.toText() # ",url:" # reportUrl),
        );
        ignore NotifLib.createNotification(
          notifications,
          booking.patientPrincipal, #Patient, #ReportReady,
          "Your diagnostic report for '" # booking.testType # "' is ready.",
          ?bookingId,
        );
      };
      case (#err _) {};
    };
    result;
  };

  public shared query ({ caller }) func getDiagnosticBooking(
    bookingId : Text,
  ) : async ?DiagLib.DiagnosticBooking {
    ignore accessControlState;
    DiagLib.getBooking(bookings, caller, bookingId);
  };
};
