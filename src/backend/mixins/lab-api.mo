import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import LabTypes "../types/lab";
import LabLib "../lib/lab";

mixin (
  accessControlState : AccessControl.AccessControlState,
  reports : Map.Map<Text, LabTypes.Report>,
) {
  public shared ({ caller }) func createReport(
    patientId : Text,
    fileUrl : Text,
    reportType : Text,
  ) : async { #ok : LabTypes.Report; #err : Text } {
    LabLib.createReport(reports, caller, patientId, fileUrl, reportType);
  };

  public query ({ caller }) func getMyReports() : async [LabTypes.Report] {
    LabLib.getMyReports(reports, caller);
  };

  public query ({ caller }) func getLabReports() : async [LabTypes.Report] {
    LabLib.getLabReports(reports, caller);
  };
};
