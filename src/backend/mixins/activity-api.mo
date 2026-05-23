import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import ActivityLib "../lib/activity";

mixin (
  accessControlState : AccessControl.AccessControlState,
  activityEvents : ActivityLib.ActivityMap,
) {
  /// Return a paginated, contextually-filtered timeline for the calling principal.
  public shared query ({ caller }) func getMyTimeline(
    offset : Nat,
    limit : Nat,
  ) : async [ActivityLib.ActivityEventView] {
    ignore accessControlState;
    // Derive the caller's role from the actor role stored on their own events.
    // If no events yet, default to #Patient (safe — only own events would be returned).
    let callerRole : ActivityLib.ActivityActorRole = switch (
      activityEvents.values().find(func(e : ActivityLib.ActivityEvent) : Bool {
        Principal.equal(e.eventActor.principalId, caller)
      })
    ) {
      case (?e) e.eventActor.role;
      case null #Patient;
    };
    ActivityLib.getMyTimeline(activityEvents, caller, callerRole, offset, limit);
  };

  /// Return a single event by id.
  public shared query ({ caller }) func getEventById(
    id : Text,
  ) : async ?ActivityLib.ActivityEventView {
    ignore (accessControlState, caller);
    ActivityLib.getEventById(activityEvents, id);
  };

  /// Mark an event as read by the calling principal.
  public shared ({ caller }) func markEventRead(
    id : Text,
  ) : async { #ok; #err : Text } {
    ignore accessControlState;
    ActivityLib.markEventRead(activityEvents, id, caller);
  };

  /// Return the lifecycle chain of events for a specific medicine.
  public shared query ({ caller }) func getMedicineLcChain(
    medicineId : Text,
  ) : async [ActivityLib.ActivityEventView] {
    ignore accessControlState;
    let callerRole : ActivityLib.ActivityActorRole = switch (
      activityEvents.values().find(func(e : ActivityLib.ActivityEvent) : Bool {
        Principal.equal(e.eventActor.principalId, caller)
      })
    ) {
      case (?e) e.eventActor.role;
      case null #Patient;
    };
    ActivityLib.getMedicineLcChain(activityEvents, medicineId, caller, callerRole);
  };
};
