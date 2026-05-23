import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WorkflowChain {
    stages: Array<WorkflowStage>;
    medicine?: {
        id: string;
        name: string;
    };
}
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface SyncedMedicine {
    id: string;
    sourcePharmacy: string;
    dosage: string;
    purchaseTimestamp: Timestamp;
    expiryDate: Timestamp;
    ownerPrincipal: Principal;
    name: string;
    createdAt: Timestamp;
    batchNumber: string;
    category: MedicineCategory;
    frequency: string;
    sourcePrincipal: Principal;
    prescriptionUrl?: string;
}
export interface ReportDataPoint {
    value: string;
    metadata?: string;
    dataLabel: string;
}
export interface Report {
    id: string;
    patientId: string;
    reportType: string;
    uploadDate: Timestamp;
    labPrincipal: Principal;
    fileUrl: string;
}
export interface NotificationRecord {
    id: string;
    notifType: NotifType;
    createdAt: Timestamp;
    role: UserRole;
    isRead: boolean;
    message: string;
    relatedId?: string;
    recipientPrincipal: Principal;
}
export interface InventoryItem {
    id: string;
    stockQuantity: bigint;
    expiryDate: Timestamp;
    minThreshold: bigint;
    lastUpdated: Timestamp;
    pharmacyPrincipal: Principal;
    category: MedicineCategory;
    maxThreshold: bigint;
    medicineName: string;
}
export interface Reminder {
    id: string;
    createdAt: Timestamp;
    voiceEnabled: boolean;
    isEnabled: boolean;
    reminderTime: string;
    userPrincipal: Principal;
    medicineId: string;
}
export interface ConsentRecord {
    id: string;
    lastUpdated: Timestamp;
    adherenceSharing: boolean;
    patientPrincipal: Principal;
    diagnosticAccess: boolean;
    auditTrail: Array<ConsentAuditEntry>;
    prescriptionSharing: boolean;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface AuditSearchQuery {
    toTimestamp?: bigint;
    fromTimestamp?: bigint;
    role?: string;
    offset: bigint;
    limit: bigint;
    searchText?: string;
    severity?: string;
    eventType?: string;
}
export interface Medicine {
    id: string;
    dosage: string;
    expiryDate: Timestamp;
    ownerPrincipal: Principal;
    name: string;
    createdAt: Timestamp;
    category: MedicineCategory;
    frequency: string;
    prescriptionUrl?: string;
}
export interface DiagnosticBooking {
    id: string;
    reportUrl?: string;
    status: BookingStatus;
    createdAt: Timestamp;
    testType: string;
    statusHistory: Array<BookingStatusEntry>;
    reportUploadedAt?: Timestamp;
    patientPrincipal: Principal;
    preferredDate: string;
    labPrincipal: Principal;
    reason?: string;
}
export interface WorkflowStage {
    status: string;
    actorRole: string;
    events: Array<ActivityEventView>;
    stageType: string;
}
export interface ActivityEventView {
    id: string;
    metadata?: string;
    resourceId?: string;
    eventActor: {
        role: ActivityActorRole;
        principalId: Principal;
    };
    timestamp: bigint;
    eventType: ActivityEventType;
    readBy: Array<Principal>;
}
export interface BookingStatusEntry {
    status: BookingStatus;
    note: string;
    timestamp: Timestamp;
}
export interface ConsentAuditEntry {
    field: string;
    action: string;
    timestamp: Timestamp;
}
export interface DoseLog {
    id: string;
    isOnTime: boolean;
    takenAt: Timestamp;
    userPrincipal: Principal;
    medicineId: string;
}
export interface Order {
    id: string;
    status: OrderStatus;
    patientId: string;
    deliveryDate?: Timestamp;
    orderDate: Timestamp;
    quantity: bigint;
    pharmacyId: string;
    medicineName: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PharmacySyncLog {
    id: string;
    status: Variant_Failed_Duplicate_Success;
    expiryDate: Timestamp;
    errorMessage?: string;
    pharmacyPrincipal: Principal;
    patientPrincipal: Principal;
    syncedAt: Timestamp;
    batchNumber: string;
    quantity: bigint;
    medicineName: string;
}
export interface ReportData {
    generatedAt: bigint;
    reportType: string;
    dataPoints: Array<ReportDataPoint>;
}
export interface LogExportRequest {
    status: string;
    userRole: string;
    errorMessage?: string;
    fileSizeBytes?: bigint;
    exportType: string;
    fileType: string;
    filename: string;
    filtersApplied: string;
}
export interface ExportLogEntry {
    id: string;
    status: string;
    userRole: string;
    userId: Principal;
    errorMessage?: string;
    fileSizeBytes?: bigint;
    exportType: string;
    fileType: string;
    filename: string;
    timestamp: bigint;
    filtersApplied: string;
}
export interface TelegramLog {
    id: string;
    status: string;
    errorMessage?: string;
    reminderTime: string;
    userPrincipal: Principal;
    timestamp: bigint;
    medicineId: string;
    medicineName: string;
}
export interface Appointment {
    id: string;
    status: string;
    notes: string;
    patientName: string;
    dateTime: Timestamp;
}
export interface UserProfile {
    id: string;
    principal: Principal;
    name: string;
    role: UserRole;
    isActive: boolean;
    email: string;
    telegramEnabled: boolean;
    phone?: string;
    registrationDate: Timestamp;
    telegramChatId?: string;
}
export enum ActivityActorRole {
    Diagnostic = "Diagnostic",
    Pharmacy = "Pharmacy",
    Admin = "Admin",
    Patient = "Patient",
    Hospital = "Hospital"
}
export enum ActivityEventType {
    ConsentGranted = "ConsentGranted",
    ReportCompleted = "ReportCompleted",
    SystemAlert = "SystemAlert",
    InventoryStatusChanged = "InventoryStatusChanged",
    DiagnosticBooked = "DiagnosticBooked",
    ConsentAccessGranted = "ConsentAccessGranted",
    PatientAdherenceViewed = "PatientAdherenceViewed",
    RestockFulfilled = "RestockFulfilled",
    ReminderCreated = "ReminderCreated",
    ReportUploaded = "ReportUploaded",
    TestProcessingStarted = "TestProcessingStarted",
    TelegramDisconnected = "TelegramDisconnected",
    HospitalMedicineAdded = "HospitalMedicineAdded",
    ReminderMissed = "ReminderMissed",
    HospitalInventoryUpdated = "HospitalInventoryUpdated",
    CSVUploaded = "CSVUploaded",
    TelegramConnected = "TelegramConnected",
    BookingAccepted = "BookingAccepted",
    MedicineAddedManually = "MedicineAddedManually",
    BookingReceived = "BookingReceived",
    ExpiryAlertTriggered = "ExpiryAlertTriggered",
    ExpiryWarningTriggered = "ExpiryWarningTriggered",
    ConsentRevoked = "ConsentRevoked",
    EcosystemSyncStats = "EcosystemSyncStats",
    DoseMarkedTaken = "DoseMarkedTaken",
    UserCreated = "UserCreated",
    ConsentAccessRevoked = "ConsentAccessRevoked",
    MedicineSold = "MedicineSold",
    MedicineSyncedToPatient = "MedicineSyncedToPatient",
    RoleChanged = "RoleChanged",
    ReportViewedDownloaded = "ReportViewedDownloaded",
    ReminderCompleted = "ReminderCompleted",
    InventoryItemAdded = "InventoryItemAdded",
    SampleCollected = "SampleCollected",
    MedicineSyncedFromPharmacy = "MedicineSyncedFromPharmacy",
    QRScanCompleted = "QRScanCompleted"
}
export enum BookingStatus {
    ReportUploaded = "ReportUploaded",
    Confirmed = "Confirmed",
    Booked = "Booked",
    InProgress = "InProgress",
    Completed = "Completed"
}
export enum MedicineCategory {
    Liquid = "Liquid",
    Capsule = "Capsule",
    Injection = "Injection",
    Tablet = "Tablet",
    Topical = "Topical",
    Other = "Other"
}
export enum NotifType {
    BookingCompleted = "BookingCompleted",
    ConsentChanged = "ConsentChanged",
    ReminderMissed = "ReminderMissed",
    ReportReady = "ReportReady",
    MedicineSynced = "MedicineSynced",
    BookingConfirmed = "BookingConfirmed",
    LowStock = "LowStock",
    ExpiringSoon = "ExpiringSoon"
}
export enum OrderStatus {
    Delivered = "Delivered",
    Cancelled = "Cancelled",
    Shipped = "Shipped",
    Pending = "Pending"
}
export enum UserRole {
    Lab = "Lab",
    Pharmacy = "Pharmacy",
    Admin = "Admin",
    Patient = "Patient",
    Hospital = "Hospital"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_Failed_Duplicate_Success {
    Failed = "Failed",
    Duplicate = "Duplicate",
    Success = "Success"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createAppointment(patientName: string, dateTime: bigint, notes: string): Promise<{
        __kind__: "ok";
        ok: Appointment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createDiagnosticBooking(labPrincipal: Principal, testType: string, preferredDate: string, reason: string | null): Promise<{
        __kind__: "ok";
        ok: DiagnosticBooking;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createInventoryItem(medicineName: string, stockQuantity: bigint, minThreshold: bigint, maxThreshold: bigint, expiryDate: bigint, category: MedicineCategory): Promise<{
        __kind__: "ok";
        ok: InventoryItem;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createMedicine(name: string, dosage: string, frequency: string, expiryDate: bigint, category: MedicineCategory): Promise<{
        __kind__: "ok";
        ok: Medicine;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createOrder(patientId: string, pharmacyId: string, medicineName: string, quantity: bigint): Promise<{
        __kind__: "ok";
        ok: Order;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createReminder(medicineId: string, reminderTime: string, voiceEnabled: boolean): Promise<{
        __kind__: "ok";
        ok: Reminder;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createReport(patientId: string, fileUrl: string, reportType: string): Promise<{
        __kind__: "ok";
        ok: Report;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteExportLog(id: string): Promise<boolean>;
    deleteInventoryItem(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteMedicine(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteReminder(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAdherenceScore(medicineId: string): Promise<number>;
    getAllExportLogs(): Promise<Array<ExportLogEntry>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAppointments(): Promise<Array<Appointment>>;
    getAuditEventsByActor(actorId: string): Promise<Array<ActivityEventView>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getConsentAuditTrail(): Promise<Array<ConsentAuditEntry>>;
    getConsentedPatients(): Promise<Array<{
        patient: UserProfile;
        consent: ConsentRecord;
    }>>;
    getDiagnosticBooking(bookingId: string): Promise<DiagnosticBooking | null>;
    getEventById(id: string): Promise<ActivityEventView | null>;
    getExpiryStats(): Promise<{
        expiringSoon: bigint;
        expired: bigint;
        safe: bigint;
    }>;
    getExportAnalytics(): Promise<{
        successCount: bigint;
        failureCount: bigint;
        totalExports: bigint;
        exportsByRole: Array<[string, bigint]>;
        exportsByType: Array<[string, bigint]>;
        exportsByFormat: Array<[string, bigint]>;
    }>;
    getInventoryStats(): Promise<Array<[string, bigint]>>;
    getLabDiagnosticBookings(): Promise<Array<DiagnosticBooking>>;
    getLabReports(): Promise<Array<Report>>;
    getMedicineLcChain(medicineId: string): Promise<Array<ActivityEventView>>;
    getMyConsent(): Promise<ConsentRecord | null>;
    getMyDiagnosticBookings(): Promise<Array<DiagnosticBooking>>;
    getMyDoseLogs(medicineId: string | null): Promise<Array<DoseLog>>;
    getMyExportLogs(): Promise<Array<ExportLogEntry>>;
    getMyMedicines(): Promise<Array<Medicine>>;
    getMyNotifications(): Promise<Array<NotificationRecord>>;
    getMyOrders(): Promise<Array<Order>>;
    getMyProfile(): Promise<{
        __kind__: "ok";
        ok: UserProfile;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getMyReminders(): Promise<Array<Reminder>>;
    getMyReports(): Promise<Array<Report>>;
    getMySyncedMedicines(): Promise<Array<SyncedMedicine>>;
    getMyTimeline(offset: bigint, limit: bigint): Promise<Array<ActivityEventView>>;
    getPharmacyInventory(): Promise<Array<InventoryItem>>;
    getPharmacyOrders(): Promise<Array<Order>>;
    getPharmacySyncLogs(): Promise<Array<PharmacySyncLog>>;
    getReportData(reportType: string): Promise<ReportData>;
    getSystemStats(): Promise<{
        totalOrders: bigint;
        totalUsers: bigint;
        totalMedicines: bigint;
        usersByRole: Array<[string, bigint]>;
    }>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTelegramLogs(): Promise<Array<TelegramLog>>;
    getWorkflowChain(medicineId: string): Promise<WorkflowChain>;
    isBotTokenConfigured(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    logDose(medicineId: string, takenAt: bigint, isOnTime: boolean): Promise<{
        __kind__: "ok";
        ok: DoseLog;
    } | {
        __kind__: "err";
        err: string;
    }>;
    logExport(req: LogExportRequest): Promise<ExportLogEntry>;
    lookupPatientByPhone(phone: string): Promise<{
        __kind__: "ok";
        ok: {
            principal: Principal;
            name: string;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    markAllNotificationsRead(): Promise<bigint>;
    markEventRead(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markNotificationRead(notifId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerUser(email: string, name: string, role: UserRole): Promise<{
        __kind__: "ok";
        ok: UserProfile;
    } | {
        __kind__: "err";
        err: string;
    }>;
    revokeAllConsent(): Promise<{
        __kind__: "ok";
        ok: ConsentRecord;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchAuditLog(params: AuditSearchQuery): Promise<Array<ActivityEventView>>;
    sendTestTelegramMessage(chatId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setBotToken(token: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    syncMedicineToPatient(patientPhone: string, medicineName: string, batchNumber: string, expiryDate: bigint, quantity: bigint): Promise<{
        __kind__: "ok";
        ok: PharmacySyncLog;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAppointmentStatus(id: string, status: string): Promise<{
        __kind__: "ok";
        ok: Appointment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateConsent(adherenceSharing: boolean, prescriptionSharing: boolean, diagnosticAccess: boolean): Promise<{
        __kind__: "ok";
        ok: ConsentRecord;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateDiagnosticBookingStatus(bookingId: string, status: BookingStatus, note: string): Promise<{
        __kind__: "ok";
        ok: DiagnosticBooking;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateInventoryItem(id: string, stockQuantity: bigint, minThreshold: bigint, maxThreshold: bigint, expiryDate: bigint): Promise<{
        __kind__: "ok";
        ok: InventoryItem;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateMedicine(id: string, name: string, dosage: string, frequency: string, expiryDate: bigint, category: MedicineCategory): Promise<{
        __kind__: "ok";
        ok: Medicine;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateMedicinePrescriptionUrl(id: string, url: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateOrderStatus(id: string, status: OrderStatus): Promise<{
        __kind__: "ok";
        ok: Order;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateReminder(id: string, reminderTime: string, isEnabled: boolean, voiceEnabled: boolean): Promise<{
        __kind__: "ok";
        ok: Reminder;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateTelegramSettings(chatId: string | null, enabled: boolean | null): Promise<{
        __kind__: "ok";
        ok: UserProfile;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateUserProfile(name: string | null, email: string | null, telegramChatId: string | null, telegramEnabled: boolean | null): Promise<{
        __kind__: "ok";
        ok: UserProfile;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateUserStatus(userId: string, isActive: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    uploadDiagnosticReport(bookingId: string, reportUrl: string): Promise<{
        __kind__: "ok";
        ok: DiagnosticBooking;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
