import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Array "mo:core/Array";
import ActivityTypes "../types/activity";
import Order "mo:core/Order";

module {
  public type ActivityEvent = ActivityTypes.ActivityEvent;
  public type ActivityEventView = ActivityTypes.ActivityEventView;
  public type ActivityEventType = ActivityTypes.ActivityEventType;
  public type ActivityActorRole = ActivityTypes.ActivityActorRole;
  public type ActivityMap = Map.Map<Text, ActivityEvent>;

  /// Record a new activity event in the map.
  public func recordEvent(
    activities : ActivityMap,
    actorRole : ActivityActorRole,
    actorPrincipal : Principal,
    eventType : ActivityEventType,
    resourceId : ?Text,
    metadata : ?Text,
  ) : () {
    let now = Time.now();
    let id = actorPrincipal.toText() # "-" # now.toText();
    let event : ActivityEvent = {
      id;
      eventActor = { role = actorRole; principalId = actorPrincipal };
      eventType;
      resourceId;
      metadata;
      timestamp = now;
      var readBy = [];
    };
    activities.add(id, event);
  };

  /// Convert internal mutable event to shared view type.
  func toView(e : ActivityEvent) : ActivityEventView = {
    id = e.id;
    eventActor = e.eventActor;
    eventType = e.eventType;
    resourceId = e.resourceId;
    metadata = e.metadata;
    timestamp = e.timestamp;
    readBy = e.readBy;
  };

  /// Contextual timeline: each role sees own events + ecosystem events related to them.
  public func getMyTimeline(
    activities : ActivityMap,
    caller : Principal,
    callerRole : ActivityActorRole,
    offset : Nat,
    limit : Nat,
  ) : [ActivityEventView] {
    let all = activities.values()
      .filter(func(e : ActivityEvent) : Bool {
        let isOwn = Principal.equal(e.eventActor.principalId, caller);
        if (isOwn) return true;
        switch (callerRole) {
          case (#Patient) {
            // Patient sees: pharmacy sync targeting them, report events for their bookings,
            // adherence views where they are the subject (resourceId = caller text)
            switch (e.eventType) {
              case (#MedicineSyncedFromPharmacy) {
                switch (e.resourceId) {
                  case (?rid) { rid == caller.toText() };
                  case null false;
                };
              };
              case (#ReportUploaded or #ReportCompleted) {
                switch (e.metadata) {
                  case (?m) { m.contains(#text (caller.toText())) };
                  case null false;
                };
              };
              case (#PatientAdherenceViewed) {
                switch (e.resourceId) {
                  case (?rid) { rid == caller.toText() };
                  case null false;
                };
              };
              case (_) false;
            };
          };
          case (#Pharmacy) {
            // Pharmacy sees: MedicineSyncedToPatient they originated
            switch (e.eventType) {
              case (#MedicineSyncedToPatient) {
                switch (e.metadata) {
                  case (?m) { m.contains(#text (caller.toText())) };
                  case null false;
                };
              };
              case (_) false;
            };
          };
          case (#Hospital) {
            // Hospital sees: patient adherence events for consented patients (resourceId = hospital text)
            switch (e.eventType) {
              case (#PatientAdherenceViewed or #ConsentAccessGranted or #ConsentAccessRevoked) {
                switch (e.resourceId) {
                  case (?rid) { rid == caller.toText() };
                  case null false;
                };
              };
              case (_) false;
            };
          };
          case (#Diagnostic) {
            // Diagnostic sees: booking lifecycle for bookings they own (metadata contains their principal)
            switch (e.eventType) {
              case (#BookingReceived or #BookingAccepted or #SampleCollected
                   or #TestProcessingStarted or #ReportUploaded or #ReportCompleted) {
                switch (e.metadata) {
                  case (?m) { m.contains(#text (caller.toText())) };
                  case null false;
                };
              };
              case (_) false;
            };
          };
          case (#Admin) true; // Admin sees all events
        };
      })
      .toArray();
    let sorted = all.sort(func(a : ActivityEvent, b : ActivityEvent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
    let views = sorted.map(toView);
    let total = views.size();
    if (offset >= total) return [];
    let end = if (offset + limit > total) total else offset + limit;
    Array.tabulate<ActivityEventView>(end - offset, func i = views[offset + i]);
  };

  /// Look up a single event by id (returns shared view if caller can access it).
  public func getEventById(
    activities : ActivityMap,
    id : Text,
  ) : ?ActivityEventView {
    switch (activities.get(id)) {
      case (?e) ?toView(e);
      case null null;
    };
  };

  /// Mark an event as read by a given principal.
  public func markEventRead(
    activities : ActivityMap,
    id : Text,
    caller : Principal,
  ) : { #ok; #err : Text } {
    switch (activities.get(id)) {
      case null #err("Event not found");
      case (?e) {
        let alreadyRead = e.readBy.find(func p = Principal.equal(p, caller));
        if (alreadyRead != null) return #ok ();
        e.readBy := e.readBy.concat<Principal>([caller]);
        #ok ();
      };
    };
  };

  /// Return all events in the lifecycle chain for a specific medicine (by resourceId).
  public func getMedicineLcChain(
    activities : ActivityMap,
    medicineId : Text,
    caller : Principal,
    callerRole : ActivityActorRole,
  ) : [ActivityEventView] {
    ignore (caller, callerRole);
    let matched = activities.values()
      .filter(func(e : ActivityEvent) : Bool {
        switch (e.resourceId) {
          case (?rid) rid == medicineId;
          case null false;
        };
      })
      .toArray();
    let sorted = matched.sort(func(a : ActivityEvent, b : ActivityEvent) : Order.Order {
      Int.compare(a.timestamp, b.timestamp)
    });
    sorted.map<ActivityEvent, ActivityEventView>(toView);
  };
};
