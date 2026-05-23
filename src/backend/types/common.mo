import Principal "mo:core/Principal";

module {
  // Shared user role variant
  public type UserRole = {
    #Patient;
    #Pharmacy;
    #Hospital;
    #Lab;
    #Admin;
  };

  // Medicine category variant
  public type MedicineCategory = {
    #Tablet;
    #Capsule;
    #Liquid;
    #Injection;
    #Topical;
    #Other;
  };

  // Order status variant
  public type OrderStatus = {
    #Pending;
    #Shipped;
    #Delivered;
    #Cancelled;
  };

  // Common timestamp alias
  public type Timestamp = Int;
};
