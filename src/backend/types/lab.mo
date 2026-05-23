import Principal "mo:core/Principal";
import Common "common";

module {
  public type Report = {
    id : Text;
    patientId : Text;
    labPrincipal : Principal;
    fileUrl : Text;
    uploadDate : Common.Timestamp;
    reportType : Text;
  };
};
