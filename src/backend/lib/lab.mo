import Map "mo:core/Map";
import Principal "mo:core/Principal";
import LabTypes "../types/lab";
import Time "mo:core/Time";

module {
  public type Report = LabTypes.Report;
  public type ReportsMap = Map.Map<Text, Report>;

  public func createReport(
    reports : ReportsMap,
    caller : Principal,
    patientId : Text,
    fileUrl : Text,
    reportType : Text,
  ) : { #ok : Report; #err : Text } {
    let id = caller.toText() # "-rpt-" # Time.now().toText();
    let report : Report = {
      id;
      patientId;
      labPrincipal = caller;
      fileUrl;
      uploadDate = Time.now();
      reportType;
    };
    reports.add(id, report);
    #ok report;
  };

  public func getMyReports(
    reports : ReportsMap,
    caller : Principal,
  ) : [Report] {
    let callerText = caller.toText();
    reports.values().filter(func(r) { r.patientId == callerText }).toArray();
  };

  public func getLabReports(
    reports : ReportsMap,
    caller : Principal,
  ) : [Report] {
    reports.values().filter(func(r) { Principal.equal(r.labPrincipal, caller) }).toArray();
  };
};
