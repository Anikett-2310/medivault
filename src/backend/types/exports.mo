module {
  /// A single export audit log entry stored on-chain.
  public type ExportLogEntry = {
    id : Text;
    userId : Principal;
    userRole : Text;
    exportType : Text;
    fileType : Text;
    filtersApplied : Text;
    timestamp : Int;
    status : Text;
    filename : Text;
    fileSizeBytes : ?Nat;
    errorMessage : ?Text;
  };

  /// Payload sent by the client when logging an export action.
  public type LogExportRequest = {
    userRole : Text;
    exportType : Text;
    fileType : Text;
    filtersApplied : Text;
    status : Text;
    filename : Text;
    fileSizeBytes : ?Nat;
    errorMessage : ?Text;
  };
};
