import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import DiagTypes "../types/diagnostics";

module {
  public type DiagnosticBooking = DiagTypes.DiagnosticBooking;
  public type BookingStatus = DiagTypes.BookingStatus;
  public type BookingStatusEntry = DiagTypes.BookingStatusEntry;
  public type BookingMap = Map.Map<Text, DiagnosticBooking>;

  public func createBooking(
    bookings : BookingMap,
    caller : Principal,
    labPrincipal : Principal,
    testType : Text,
    preferredDate : Text,
    reason : ?Text,
  ) : { #ok : DiagnosticBooking; #err : Text } {
    if (testType == "") { return #err "Test type cannot be empty" };
    if (preferredDate == "") { return #err "Preferred date cannot be empty" };
    let now = Time.now();
    let id = caller.toText() # "-diag-" # now.toText();
    let initialStatus : BookingStatus = #Booked;
    let initialEntry : BookingStatusEntry = {
      status = initialStatus;
      timestamp = now;
      note = "Booking created";
    };
    let booking : DiagnosticBooking = {
      id;
      patientPrincipal = caller;
      labPrincipal;
      testType;
      preferredDate;
      reason;
      status = initialStatus;
      statusHistory = [initialEntry];
      reportUrl = null;
      reportUploadedAt = null;
      createdAt = now;
    };
    bookings.add(id, booking);
    #ok booking;
  };

  public func getMyBookings(
    bookings : BookingMap,
    caller : Principal,
  ) : [DiagnosticBooking] {
    bookings.values()
      .filter(func(b) { Principal.equal(b.patientPrincipal, caller) })
      .toArray();
  };

  public func getLabBookings(
    bookings : BookingMap,
    caller : Principal,
  ) : [DiagnosticBooking] {
    bookings.values()
      .filter(func(b) { Principal.equal(b.labPrincipal, caller) })
      .toArray();
  };

  public func updateBookingStatus(
    bookings : BookingMap,
    caller : Principal,
    bookingId : Text,
    status : BookingStatus,
    note : Text,
  ) : { #ok : DiagnosticBooking; #err : Text } {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (not Principal.equal(booking.labPrincipal, caller)) {
          return #err "Not authorized — only the assigned lab can update booking status";
        };
        let now = Time.now();
        let entry : BookingStatusEntry = { status; timestamp = now; note };
        let updated = {
          booking with
          status;
          statusHistory = booking.statusHistory.concat([entry]);
        };
        bookings.add(bookingId, updated);
        #ok updated;
      };
      case null { #err "Booking not found" };
    };
  };

  public func uploadReport(
    bookings : BookingMap,
    caller : Principal,
    bookingId : Text,
    reportUrl : Text,
  ) : { #ok : DiagnosticBooking; #err : Text } {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (not Principal.equal(booking.labPrincipal, caller)) {
          return #err "Not authorized — only the assigned lab can upload reports";
        };
        let now = Time.now();
        let entry : BookingStatusEntry = {
          status = #ReportUploaded;
          timestamp = now;
          note = "Report uploaded";
        };
        let updated = {
          booking with
          reportUrl = ?reportUrl;
          reportUploadedAt = ?now;
          status = #ReportUploaded;
          statusHistory = booking.statusHistory.concat([entry]);
        };
        bookings.add(bookingId, updated);
        #ok updated;
      };
      case null { #err "Booking not found" };
    };
  };

  public func getBooking(
    bookings : BookingMap,
    caller : Principal,
    bookingId : Text,
  ) : ?DiagnosticBooking {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        // Patient can see their own; lab can see their bookings
        if (Principal.equal(booking.patientPrincipal, caller) or Principal.equal(booking.labPrincipal, caller)) {
          ?booking;
        } else {
          null;
        };
      };
      case null { null };
    };
  };
};
