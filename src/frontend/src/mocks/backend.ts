import type { backendInterface } from "../backend";
import type {
  UserProfile,
  Medicine,
  Reminder,
  Order,
  Appointment,
  InventoryItem,
  DiagnosticBooking,
  Report,
  NotificationRecord,
  ExportLogEntry,
  ActivityEventView,
  ConsentRecord,
  PharmacySyncLog,
  DoseLog,
  TelegramLog,
  SyncedMedicine,
  ConsentAuditEntry,
} from "../backend.d";
import {
  UserRole,
  UserRole__1,
  MedicineCategory,
  OrderStatus,
  BookingStatus,
  NotifType,
  ActivityEventType,
  ActivityActorRole,
  Variant_Failed_Duplicate_Success,
} from "../backend.d";

// ─── Dynamic Time Anchors ──────────────────────────────────────────────────
const NOW = BigInt(Date.now() * 1_000_000);
const daysAgo = (d: number) => NOW - BigInt(d * 24 * 3600 * 1_000_000_000);
const hoursAgo = (h: number) => NOW - BigInt(h * 3600 * 1_000_000_000);
const daysFromNow = (d: number) => NOW + BigInt(d * 24 * 3600 * 1_000_000_000);
const minutesAgo = (m: number) => NOW - BigInt(m * 60 * 1_000_000_000);

// ─── Principals ────────────────────────────────────────────────────────────
const P_SARAH   = { toText: () => "patient-sarah-mitchell" } as any;
const P_JAMES   = { toText: () => "patient-james-okonkwo" } as any;
const P_PRIYA   = { toText: () => "patient-priya-nair" } as any;
const P_DAVID   = { toText: () => "patient-david-chen" } as any;
const P_EMMA    = { toText: () => "patient-emma-thompson" } as any;
const P_MARCUS  = { toText: () => "patient-marcus-rodriguez" } as any;
const P_AISHA   = { toText: () => "patient-aisha-patel" } as any;
const P_ROBERT  = { toText: () => "patient-robert-kim" } as any;
const P_PHARMACY = { toText: () => "pharmacy-rxchennai-001" } as any;
const P_HOSPITAL = { toText: () => "hospital-citygeneral-001" } as any;
const P_LAB      = { toText: () => "lab-lifepath-diagnostics" } as any;
const P_ADMIN    = { toText: () => "admin-system-001" } as any;

// Aliases for mock backend compatibility (methods returning "current user")
const PATIENT_PRINCIPAL  = P_SARAH;
const PHARMACY_PRINCIPAL = P_PHARMACY;
const LAB_PRINCIPAL      = P_LAB;

const mockPatient: UserProfile = {
  id: "user-001",
  principal: P_SARAH,
  name: "Sarah Mitchell",
  role: UserRole.Patient,
  isActive: true,
  email: "sarah.mitchell@email.com",
  telegramEnabled: true,
  phone: "+91-98451-20301",
  registrationDate: daysAgo(730),
};

// ─── Medicines (cross-referenced by patient) ─────────────────────────────
const mockMedicines: Medicine[] = [
  // Sarah Mitchell — diabetic + hypertension, 94% adherence
  {
    id: "med-001",
    name: "Lisinopril 10mg",
    dosage: "10mg",
    frequency: "Once daily — morning",
    expiryDate: daysFromNow(210),
    ownerPrincipal: P_SARAH,
    createdAt: daysAgo(730),
    category: MedicineCategory.Tablet,
    prescriptionUrl: "https://example.com/rx/sarah-lisinopril.pdf",
  },
  {
    id: "med-002",
    name: "Metformin ER 500mg",
    dosage: "500mg",
    frequency: "Twice daily — with meals",
    expiryDate: daysFromNow(300),
    ownerPrincipal: P_SARAH,
    createdAt: daysAgo(730),
    category: MedicineCategory.Tablet,
    prescriptionUrl: "https://example.com/rx/sarah-metformin.pdf",
  },
  {
    id: "med-003",
    name: "Atorvastatin 20mg",
    dosage: "20mg",
    frequency: "Once daily — bedtime",
    expiryDate: daysFromNow(390),
    ownerPrincipal: P_SARAH,
    createdAt: daysAgo(365),
    category: MedicineCategory.Tablet,
  },
  // James Okonkwo — recovering adherence, 67%
  {
    id: "med-004",
    name: "Metformin ER 500mg",
    dosage: "500mg",
    frequency: "Twice daily — with meals",
    expiryDate: daysFromNow(180),
    ownerPrincipal: P_JAMES,
    createdAt: daysAgo(90),
    category: MedicineCategory.Tablet,
    prescriptionUrl: "https://example.com/rx/james-metformin.pdf",
  },
  {
    id: "med-005",
    name: "Omeprazole 20mg",
    dosage: "20mg",
    frequency: "Once daily — before breakfast",
    expiryDate: daysFromNow(120),
    ownerPrincipal: P_JAMES,
    createdAt: daysAgo(60),
    category: MedicineCategory.Capsule,
  },
  // Priya Nair — asthma maintenance, 82%
  {
    id: "med-006",
    name: "Salbutamol Inhaler 100mcg",
    dosage: "100mcg — 2 puffs",
    frequency: "As needed / PRN",
    expiryDate: daysFromNow(90),
    ownerPrincipal: P_PRIYA,
    createdAt: daysAgo(420),
    category: MedicineCategory.Other,
    prescriptionUrl: "https://example.com/rx/priya-salbutamol.pdf",
  },
  {
    id: "med-007",
    name: "Omeprazole 20mg",
    dosage: "20mg",
    frequency: "Once daily — morning",
    expiryDate: daysFromNow(150),
    ownerPrincipal: P_PRIYA,
    createdAt: daysAgo(200),
    category: MedicineCategory.Capsule,
  },
  // David Chen — poor adherence, 45%, new patient
  {
    id: "med-008",
    name: "Metoprolol Succinate 25mg",
    dosage: "25mg",
    frequency: "Once daily — morning",
    expiryDate: daysFromNow(270),
    ownerPrincipal: P_DAVID,
    createdAt: daysAgo(45),
    category: MedicineCategory.Tablet,
    prescriptionUrl: "https://example.com/rx/david-metoprolol.pdf",
  },
  {
    id: "med-009",
    name: "Losartan 50mg",
    dosage: "50mg",
    frequency: "Once daily",
    expiryDate: daysFromNow(240),
    ownerPrincipal: P_DAVID,
    createdAt: daysAgo(45),
    category: MedicineCategory.Tablet,
  },
  // Emma Thompson — cardiac, 91%
  {
    id: "med-010",
    name: "Aspirin EC 81mg",
    dosage: "81mg",
    frequency: "Once daily — morning",
    expiryDate: daysFromNow(360),
    ownerPrincipal: P_EMMA,
    createdAt: daysAgo(548),
    category: MedicineCategory.Tablet,
  },
  {
    id: "med-011",
    name: "Amlodipine 5mg",
    dosage: "5mg",
    frequency: "Once daily",
    expiryDate: daysFromNow(330),
    ownerPrincipal: P_EMMA,
    createdAt: daysAgo(548),
    category: MedicineCategory.Tablet,
    prescriptionUrl: "https://example.com/rx/emma-amlodipine.pdf",
  },
  // Marcus Rodriguez — moderate improving, 73%
  {
    id: "med-012",
    name: "Atorvastatin 20mg",
    dosage: "20mg",
    frequency: "Once daily — bedtime",
    expiryDate: daysFromNow(280),
    ownerPrincipal: P_MARCUS,
    createdAt: daysAgo(120),
    category: MedicineCategory.Tablet,
  },
  // Aisha Patel — strong compliance, 88%
  {
    id: "med-013",
    name: "Levothyroxine 50mcg",
    dosage: "50mcg",
    frequency: "Once daily — fasting, 30 min before breakfast",
    expiryDate: daysFromNow(320),
    ownerPrincipal: P_AISHA,
    createdAt: daysAgo(310),
    category: MedicineCategory.Tablet,
    prescriptionUrl: "https://example.com/rx/aisha-levothyroxine.pdf",
  },
  // Robert Kim — inconsistent elderly, 56%
  {
    id: "med-014",
    name: "Warfarin 5mg",
    dosage: "5mg",
    frequency: "Once daily — 17:00",
    expiryDate: daysFromNow(180),
    ownerPrincipal: P_ROBERT,
    createdAt: daysAgo(620),
    category: MedicineCategory.Tablet,
    prescriptionUrl: "https://example.com/rx/robert-warfarin.pdf",
  },
  {
    id: "med-015",
    name: "Gabapentin 300mg",
    dosage: "300mg",
    frequency: "Three times daily",
    expiryDate: daysFromNow(140),
    ownerPrincipal: P_ROBERT,
    createdAt: daysAgo(400),
    category: MedicineCategory.Capsule,
  },
];

// ─── Reminders ─────────────────────────────────────────────────────────────
const mockReminders: Reminder[] = [
  // Sarah Mitchell — Lisinopril: completed 08:14 today
  { id: "rem-001", medicineId: "med-001", reminderTime: "08:00", voiceEnabled: false, isEnabled: true, createdAt: daysAgo(730), userPrincipal: P_SARAH },
  // Sarah Mitchell — Metformin lunch + dinner
  { id: "rem-002", medicineId: "med-002", reminderTime: "13:00", voiceEnabled: true, isEnabled: true, createdAt: daysAgo(730), userPrincipal: P_SARAH },
  { id: "rem-003", medicineId: "med-002", reminderTime: "20:00", voiceEnabled: true, isEnabled: true, createdAt: daysAgo(730), userPrincipal: P_SARAH },
  // Robert Kim — Warfarin 17:00 MISSED
  { id: "rem-004", medicineId: "med-014", reminderTime: "17:00", voiceEnabled: true, isEnabled: true, createdAt: daysAgo(620), userPrincipal: P_ROBERT },
  // James Okonkwo — Metformin with dinner, snoozed 3x
  { id: "rem-005", medicineId: "med-004", reminderTime: "19:30", voiceEnabled: false, isEnabled: true, createdAt: daysAgo(60), userPrincipal: P_JAMES },
  // Emma Thompson — Aspirin morning, 14-day streak
  { id: "rem-006", medicineId: "med-010", reminderTime: "07:30", voiceEnabled: false, isEnabled: true, createdAt: daysAgo(548), userPrincipal: P_EMMA },
  // David Chen — Metoprolol 07:00, never logged today
  { id: "rem-007", medicineId: "med-008", reminderTime: "07:00", voiceEnabled: false, isEnabled: true, createdAt: daysAgo(45), userPrincipal: P_DAVID },
  // Priya Nair — Salbutamol PRN check
  { id: "rem-008", medicineId: "med-006", reminderTime: "09:00", voiceEnabled: false, isEnabled: true, createdAt: daysAgo(200), userPrincipal: P_PRIYA },
  // Aisha Patel — Levothyroxine fasting
  { id: "rem-009", medicineId: "med-013", reminderTime: "06:30", voiceEnabled: true, isEnabled: true, createdAt: daysAgo(310), userPrincipal: P_AISHA },
];

// ─── Orders ────────────────────────────────────────────────────────────────
const mockOrders: Order[] = [
  { id: "ord-001", patientId: "user-001", pharmacyId: "user-009", medicineName: "Metformin ER 500mg",         quantity: BigInt(60), status: OrderStatus.Delivered, orderDate: daysAgo(14), deliveryDate: daysAgo(12) },
  { id: "ord-002", patientId: "user-001", pharmacyId: "user-009", medicineName: "Lisinopril 10mg",            quantity: BigInt(30), status: OrderStatus.Delivered, orderDate: daysAgo(7),  deliveryDate: daysAgo(5) },
  { id: "ord-003", patientId: "user-002", pharmacyId: "user-009", medicineName: "Metformin ER 500mg",         quantity: BigInt(30), status: OrderStatus.Shipped,   orderDate: daysAgo(2) },
  { id: "ord-004", patientId: "user-005", pharmacyId: "user-009", medicineName: "Aspirin EC 81mg",            quantity: BigInt(90), status: OrderStatus.Delivered, orderDate: daysAgo(21), deliveryDate: daysAgo(19) },
  { id: "ord-005", patientId: "user-008", pharmacyId: "user-009", medicineName: "Warfarin 5mg",               quantity: BigInt(28), status: OrderStatus.Delivered, orderDate: daysAgo(30), deliveryDate: daysAgo(28) },
  { id: "ord-006", patientId: "user-004", pharmacyId: "user-009", medicineName: "Metoprolol Succinate 25mg",  quantity: BigInt(30), status: OrderStatus.Pending,   orderDate: daysAgo(1) },
];

// ─── Notifications ─────────────────────────────────────────────────────────
const mockNotifications: NotificationRecord[] = [
  {
    id: "notif-001",
    notifType: NotifType.ExpiringSoon,
    message: "Salbutamol Inhaler 100mcg — 89 units expire in 45 days. Reorder recommended.",
    createdAt: hoursAgo(2),
    role: UserRole.Pharmacy,
    isRead: false,
    relatedId: "inv-004",
    recipientPrincipal: P_PHARMACY,
  },
  {
    id: "notif-002",
    notifType: NotifType.LowStock,
    message: "Lisinopril 10mg — 3 active low-stock alerts this week. Current stock: 412 units.",
    createdAt: hoursAgo(5),
    role: UserRole.Pharmacy,
    isRead: false,
    relatedId: "inv-003",
    recipientPrincipal: P_PHARMACY,
  },
  {
    id: "notif-003",
    notifType: NotifType.BookingCompleted,
    message: "David Chen — adherence review booking created. 7-day clinical review has been scheduled.",
    createdAt: hoursAgo(8),
    role: UserRole.Hospital,
    isRead: false,
    relatedId: "user-004",
    recipientPrincipal: P_HOSPITAL,
  },
  {
    id: "notif-004",
    notifType: NotifType.MedicineSynced,
    message: "Metformin ER 500mg synced to James Okonkwo — PharmacistRx Chennai (Batch BATCH-2026-MAY)",
    createdAt: daysAgo(2),
    role: UserRole.Patient,
    isRead: true,
    recipientPrincipal: P_JAMES,
  },
  {
    id: "notif-005",
    notifType: NotifType.ReminderMissed,
    message: "Robert Kim missed Warfarin 5mg — 17:00 dose. INR monitoring required.",
    createdAt: hoursAgo(4),
    role: UserRole.Patient,
    isRead: false,
    relatedId: "rem-004",
    recipientPrincipal: P_ROBERT,
  },
  {
    id: "notif-006",
    notifType: NotifType.ReportReady,
    message: "HbA1c results ready — Sarah Mitchell. Result: 6.8% (within target range).",
    createdAt: daysAgo(3),
    role: UserRole.Patient,
    isRead: true,
    relatedId: "rep-002",
    recipientPrincipal: P_SARAH,
  },
  {
    id: "notif-007",
    notifType: NotifType.ConsentChanged,
    message: "Emma Thompson granted diagnostic access to City General Hospital — Cardiology Dept.",
    createdAt: daysAgo(14),
    role: UserRole.Hospital,
    isRead: true,
    relatedId: "consent-emma",
    recipientPrincipal: P_HOSPITAL,
  },
];

// ─── Pharmacy Inventory ────────────────────────────────────────────────────
const mockInventory: InventoryItem[] = [
  { id: "inv-001", medicineName: "Metformin ER 500mg",         stockQuantity: BigInt(847),  minThreshold: BigInt(200), maxThreshold: BigInt(1200), expiryDate: daysFromNow(280), lastUpdated: hoursAgo(4),  pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Tablet },
  { id: "inv-002", medicineName: "Atorvastatin 20mg",          stockQuantity: BigInt(623),  minThreshold: BigInt(150), maxThreshold: BigInt(800),  expiryDate: daysFromNow(310), lastUpdated: hoursAgo(8),  pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Tablet },
  { id: "inv-003", medicineName: "Lisinopril 10mg",            stockQuantity: BigInt(412),  minThreshold: BigInt(200), maxThreshold: BigInt(800),  expiryDate: daysFromNow(190), lastUpdated: hoursAgo(2),  pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Tablet },
  { id: "inv-004", medicineName: "Salbutamol Inhaler 100mcg",  stockQuantity: BigInt(89),   minThreshold: BigInt(100), maxThreshold: BigInt(400),  expiryDate: daysFromNow(45),  lastUpdated: hoursAgo(1),  pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Other },
  { id: "inv-005", medicineName: "Omeprazole 20mg",            stockQuantity: BigInt(1204), minThreshold: BigInt(250), maxThreshold: BigInt(1500), expiryDate: daysFromNow(420), lastUpdated: daysAgo(1),   pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Capsule },
  { id: "inv-006", medicineName: "Warfarin 5mg",               stockQuantity: BigInt(156),  minThreshold: BigInt(100), maxThreshold: BigInt(500),  expiryDate: daysFromNow(220), lastUpdated: hoursAgo(12), pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Tablet },
  { id: "inv-007", medicineName: "Metoprolol Succinate 25mg",  stockQuantity: BigInt(334),  minThreshold: BigInt(100), maxThreshold: BigInt(600),  expiryDate: daysFromNow(260), lastUpdated: daysAgo(2),   pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Tablet },
  { id: "inv-008", medicineName: "Levothyroxine 50mcg",        stockQuantity: BigInt(271),  minThreshold: BigInt(80),  maxThreshold: BigInt(500),  expiryDate: daysFromNow(340), lastUpdated: daysAgo(3),   pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Tablet },
  { id: "inv-009", medicineName: "Aspirin EC 81mg",            stockQuantity: BigInt(918),  minThreshold: BigInt(300), maxThreshold: BigInt(1200), expiryDate: daysFromNow(500), lastUpdated: daysAgo(4),   pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Tablet },
  { id: "inv-010", medicineName: "Gabapentin 300mg",           stockQuantity: BigInt(188),  minThreshold: BigInt(150), maxThreshold: BigInt(600),  expiryDate: daysFromNow(120), lastUpdated: daysAgo(1),   pharmacyPrincipal: P_PHARMACY, category: MedicineCategory.Capsule },
];

// ─── Appointments ──────────────────────────────────────────────────────────
const mockAppointments: Appointment[] = [
  { id: "apt-001", patientName: "Sarah Mitchell",   dateTime: daysFromNow(4), notes: "Quarterly HbA1c review — diabetes management, Lisinopril dose reassessment",                               status: "Scheduled" },
  { id: "apt-002", patientName: "Emma Thompson",    dateTime: daysFromNow(1), notes: "Cardiology follow-up — Aspirin + Amlodipine therapy review, adherence excellent",                         status: "Confirmed" },
  { id: "apt-003", patientName: "David Chen",        dateTime: daysFromNow(2), notes: "Adherence intervention — 45% score, 7-day review flagged by system",                                     status: "Scheduled" },
  { id: "apt-004", patientName: "Robert Kim",        dateTime: daysFromNow(6), notes: "INR monitoring — Warfarin 5mg, missed doses last week, dose adjustment possible",                         status: "Scheduled" },
  { id: "apt-005", patientName: "Priya Nair",        dateTime: daysAgo(1),     notes: "Respiratory review — Salbutamol usage frequency assessment, CBC results reviewed",                        status: "Completed" },
  { id: "apt-006", patientName: "Marcus Rodriguez",  dateTime: daysFromNow(3), notes: "Lipid panel review — Atorvastatin 20mg, improving adherence trend noted",                               status: "Scheduled" },
];

// ─── Diagnostic Bookings ───────────────────────────────────────────────────
const mockDiagnosticBookings: DiagnosticBooking[] = [
  // Priya Nair — CBC pending results
  {
    id: "book-001",
    patientPrincipal: P_PRIYA,
    labPrincipal: P_LAB,
    testType: "Complete Blood Count with Differential",
    preferredDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
    status: BookingStatus.Confirmed,
    createdAt: daysAgo(3),
    statusHistory: [
      { status: BookingStatus.Booked, note: "Booking received", timestamp: daysAgo(3) },
      { status: BookingStatus.Confirmed, note: "Confirmed — LifePath Diagnostics slot reserved", timestamp: daysAgo(2) },
    ],
    reason: "Respiratory monitoring — asthma management, Salbutamol therapy follow-up",
  },
  // Sarah Mitchell — HbA1c completed, 6.8%
  {
    id: "book-002",
    patientPrincipal: P_SARAH,
    labPrincipal: P_LAB,
    testType: "HbA1c Glycated Haemoglobin Panel",
    preferredDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
    status: BookingStatus.Completed,
    createdAt: daysAgo(12),
    statusHistory: [
      { status: BookingStatus.Booked, note: "Booking received", timestamp: daysAgo(12) },
      { status: BookingStatus.Confirmed, note: "Appointment confirmed", timestamp: daysAgo(10) },
      { status: BookingStatus.InProgress,  note: "Blood sample collected at lab", timestamp: daysAgo(5) },
      { status: BookingStatus.ReportUploaded, note: "HbA1c 6.8% — within target range", timestamp: daysAgo(4) },
      { status: BookingStatus.Completed, note: "Report shared with patient and hospital", timestamp: daysAgo(3) },
    ],
    reason: "Quarterly diabetes monitoring — Metformin ER efficacy assessment",
    reportUrl: "https://example.com/reports/hba1c-sarah-mitchell.pdf",
  },
  // Marcus Rodriguez — Lipid Panel scheduled tomorrow
  {
    id: "book-003",
    patientPrincipal: P_MARCUS,
    labPrincipal: P_LAB,
    testType: "Full Lipid Panel (Total Cholesterol / LDL / HDL / Triglycerides)",
    preferredDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
    status: BookingStatus.Confirmed,
    createdAt: daysAgo(5),
    statusHistory: [
      { status: BookingStatus.Booked, note: "Booking received", timestamp: daysAgo(5) },
      { status: BookingStatus.Confirmed, note: "Confirmed — fasting required 12h prior", timestamp: daysAgo(4) },
    ],
    reason: "Atorvastatin therapy monitoring — 3-month Lipid follow-up",
  },
  // Aisha Patel — Thyroid Function completed, TSH 2.1 normal
  {
    id: "book-004",
    patientPrincipal: P_AISHA,
    labPrincipal: P_LAB,
    testType: "Thyroid Function Panel (TSH / Free T4 / Free T3)",
    preferredDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
    status: BookingStatus.Completed,
    createdAt: daysAgo(10),
    statusHistory: [
      { status: BookingStatus.Booked, note: "Booking received", timestamp: daysAgo(10) },
      { status: BookingStatus.Confirmed, note: "Appointment confirmed", timestamp: daysAgo(8) },
      { status: BookingStatus.InProgress,  note: "Blood draw completed at clinic", timestamp: daysAgo(3) },
      { status: BookingStatus.ReportUploaded, note: "TSH 2.1 mIU/L — within normal range (0.4–4.0)", timestamp: daysAgo(1) },
      { status: BookingStatus.Completed, note: "Results dispatched to patient", timestamp: hoursAgo(6) },
    ],
    reason: "Levothyroxine 50mcg maintenance — annual thyroid function monitoring",
    reportUrl: "https://example.com/reports/thyroid-aisha-patel.pdf",
  },
];

// ─── Lab Reports ───────────────────────────────────────────────────────────
const mockReports: Report[] = [
  {
    id: "rep-001",
    patientId: "user-003",
    reportType: "Complete Blood Count with Differential",
    uploadDate: daysAgo(5),
    labPrincipal: P_LAB,
    fileUrl: "https://example.com/reports/cbc-priya-nair.pdf",
  },
  {
    id: "rep-002",
    patientId: "user-001",
    reportType: "HbA1c Glycated Haemoglobin Panel",
    uploadDate: daysAgo(3),
    labPrincipal: P_LAB,
    fileUrl: "https://example.com/reports/hba1c-sarah-mitchell.pdf",
  },
  {
    id: "rep-003",
    patientId: "user-007",
    reportType: "Thyroid Function Panel (TSH / Free T4 / Free T3)",
    uploadDate: hoursAgo(6),
    labPrincipal: P_LAB,
    fileUrl: "https://example.com/reports/thyroid-aisha-patel.pdf",
  },
  {
    id: "rep-004",
    patientId: "user-005",
    reportType: "Cardiac Risk Panel (Troponin I / BNP / CRP)",
    uploadDate: daysAgo(14),
    labPrincipal: P_LAB,
    fileUrl: "https://example.com/reports/cardiac-emma-thompson.pdf",
  },
];

// ─── Consent Records ───────────────────────────────────────────────────────
const mockConsentRecord: ConsentRecord = {
  id: "consent-001",
  patientPrincipal: P_SARAH,
  adherenceSharing: true,
  prescriptionSharing: true,
  diagnosticAccess: true,
  lastUpdated: daysAgo(7),
  auditTrail: [
    { field: "adherenceSharing",   action: "granted", timestamp: daysAgo(60) },
    { field: "prescriptionSharing", action: "granted", timestamp: daysAgo(60) },
    { field: "diagnosticAccess",   action: "granted", timestamp: daysAgo(7) },
  ],
};

const mockConsentRecords: ConsentRecord[] = [
  // Emma Thompson — full adherence sharing to City General (cardiology)
  {
    id: "consent-emma",
    patientPrincipal: P_EMMA,
    adherenceSharing: true,
    prescriptionSharing: true,
    diagnosticAccess: true,
    lastUpdated: daysAgo(14),
    auditTrail: [
      { field: "adherenceSharing",   action: "granted", timestamp: daysAgo(548) },
      { field: "prescriptionSharing", action: "granted", timestamp: daysAgo(200) },
      { field: "diagnosticAccess",   action: "granted", timestamp: daysAgo(14) },
    ],
  },
  // Priya Nair — read-only respiratory access
  {
    id: "consent-priya",
    patientPrincipal: P_PRIYA,
    adherenceSharing: true,
    prescriptionSharing: false,
    diagnosticAccess: true,
    lastUpdated: daysAgo(45),
    auditTrail: [
      { field: "adherenceSharing", action: "granted", timestamp: daysAgo(200) },
      { field: "diagnosticAccess", action: "granted", timestamp: daysAgo(45) },
    ],
  },
  // David Chen — NO consent yet (flagged)
  {
    id: "consent-david",
    patientPrincipal: P_DAVID,
    adherenceSharing: false,
    prescriptionSharing: false,
    diagnosticAccess: false,
    lastUpdated: daysAgo(45),
    auditTrail: [],
  },
  mockConsentRecord,
];

// ─── Activity Timeline ─────────────────────────────────────────────────────
const mockTimeline: ActivityEventView[] = [
  {
    id: "evt-001",
    eventType: ActivityEventType.DoseMarkedTaken,
    eventActor: { role: ActivityActorRole.Patient, principalId: P_SARAH },
    timestamp: minutesAgo(346),
    readBy: [],
    resourceId: "med-001",
    metadata: JSON.stringify({ medicineName: "Lisinopril 10mg", patientName: "Sarah Mitchell", isOnTime: true, takenAt: "08:14" }),
  },
  {
    id: "evt-002",
    eventType: ActivityEventType.ReminderMissed,
    eventActor: { role: ActivityActorRole.Patient, principalId: P_ROBERT },
    timestamp: hoursAgo(2),
    readBy: [],
    resourceId: "rem-004",
    metadata: JSON.stringify({ medicineName: "Warfarin 5mg", patientName: "Robert Kim", status: "MISSED", reminderTime: "17:00" }),
  },
  {
    id: "evt-003",
    eventType: ActivityEventType.ReportUploaded,
    eventActor: { role: ActivityActorRole.Diagnostic, principalId: P_LAB },
    timestamp: hoursAgo(6),
    readBy: [],
    resourceId: "rep-003",
    metadata: JSON.stringify({ testType: "Thyroid Function Panel", patientName: "Aisha Patel", labTechnician: "Ananya Sharma", result: "TSH 2.1 mIU/L — Normal" }),
  },
  {
    id: "evt-004",
    eventType: ActivityEventType.MedicineSyncedFromPharmacy,
    eventActor: { role: ActivityActorRole.Pharmacy, principalId: P_PHARMACY },
    timestamp: daysAgo(2),
    readBy: [],
    resourceId: "med-004",
    metadata: JSON.stringify({ medicineName: "Metformin ER 500mg", patientName: "James Okonkwo", pharmacyName: "PharmacistRx Chennai", batchNumber: "BATCH-2026-MAY", quantity: 30 }),
  },
  {
    id: "evt-005",
    eventType: ActivityEventType.ConsentGranted,
    eventActor: { role: ActivityActorRole.Patient, principalId: P_EMMA },
    timestamp: daysAgo(14),
    readBy: [],
    resourceId: "consent-emma",
    metadata: JSON.stringify({ patientName: "Emma Thompson", action: "Granted", hospitalName: "City General Hospital", dept: "Cardiology", scope: "Full adherence + prescription sharing" }),
  },
  {
    id: "evt-006",
    eventType: ActivityEventType.SystemAlert,
    eventActor: { role: ActivityActorRole.Patient, principalId: P_DAVID },
    timestamp: daysAgo(1),
    readBy: [],
    resourceId: "user-004",
    metadata: JSON.stringify({ patientName: "David Chen", adherenceScore: 45, previousScore: 52, trend: "declining", reviewScheduled: true }),
  },
  {
    id: "evt-007",
    eventType: ActivityEventType.MedicineAddedManually,
    eventActor: { role: ActivityActorRole.Patient, principalId: P_DAVID },
    timestamp: daysAgo(45),
    readBy: [],
    resourceId: "med-008",
    metadata: JSON.stringify({ medicineName: "Metoprolol Succinate 25mg", patientName: "David Chen", source: "manual" }),
  },
  {
    id: "evt-008",
    eventType: ActivityEventType.ReportUploaded,
    eventActor: { role: ActivityActorRole.Diagnostic, principalId: P_LAB },
    timestamp: daysAgo(3),
    readBy: [],
    resourceId: "rep-002",
    metadata: JSON.stringify({ testType: "HbA1c Glycated Haemoglobin", patientName: "Sarah Mitchell", result: "6.8%", interpretation: "Within ADA target range" }),
  },
  {
    id: "evt-009",
    eventType: ActivityEventType.DoseMarkedTaken,
    eventActor: { role: ActivityActorRole.Patient, principalId: P_EMMA },
    timestamp: minutesAgo(480),
    readBy: [],
    resourceId: "med-010",
    metadata: JSON.stringify({ medicineName: "Aspirin EC 81mg", patientName: "Emma Thompson", streak: 14, isOnTime: true }),
  },
  {
    id: "evt-010",
    eventType: ActivityEventType.BookingAccepted,
    eventActor: { role: ActivityActorRole.Diagnostic, principalId: P_LAB },
    timestamp: daysAgo(4),
    readBy: [],
    resourceId: "book-002",
    metadata: JSON.stringify({ testType: "HbA1c Panel", patientName: "Sarah Mitchell", status: "ResultsReady", result: "6.8%" }),
  },
];

// ─── Export Logs ───────────────────────────────────────────────────────────
const mockExportLogs: ExportLogEntry[] = [
  { id: "exp-001", exportType: "Patient Medication History",   fileType: "PDF",  filename: "sarah-mitchell-medication-report-may2026.pdf",      status: "success", userRole: "Patient",  userId: P_SARAH,    timestamp: daysAgo(7), filtersApplied: "date_range: last 90 days, medicines: all, include_adherence: true",                              fileSizeBytes: BigInt(387_412) },
  { id: "exp-002", exportType: "Monthly Dispensing Report",    fileType: "CSV",  filename: "pharmacistrx-dispensing-april2026.csv",             status: "success", userRole: "Pharmacy", userId: P_PHARMACY, timestamp: daysAgo(1), filtersApplied: "month: April 2026, include_expiry_alerts: true, include_sync_logs: true",                      fileSizeBytes: BigInt(124_880) },
  { id: "exp-003", exportType: "Ecosystem Operations Summary", fileType: "XLSX", filename: "medivault-ecosystem-summary-q1-2026.xlsx",           status: "success", userRole: "Admin",    userId: P_ADMIN,    timestamp: daysAgo(3), filtersApplied: "quarter: Q1 2026, roles: all, include_audit_trail: true",                                       fileSizeBytes: BigInt(682_144) },
  { id: "exp-004", exportType: "Adherence Analytics Report",   fileType: "PDF",  filename: "hospital-adherence-report-may2026.pdf",             status: "success", userRole: "Hospital", userId: P_HOSPITAL, timestamp: daysAgo(5), filtersApplied: "consented_patients: only, include_trends: true, highlight_flagged: true",                      fileSizeBytes: BigInt(295_630) },
  { id: "exp-005", exportType: "Diagnostic Lab Report Bundle", fileType: "PDF",  filename: "lifepath-lab-reports-may-week3.pdf",                status: "success", userRole: "Lab",      userId: P_LAB,      timestamp: daysAgo(2), filtersApplied: "period: may_week3, include_completed: true, include_pending: false",                           fileSizeBytes: BigInt(1_024_512) },
];

// ─── Pharmacy Sync Logs ────────────────────────────────────────────────────
const mockPharmacySyncLogs: PharmacySyncLog[] = [
  { id: "sync-001", medicineName: "Metformin ER 500mg",        batchNumber: "BATCH-2026-MAY",    quantity: BigInt(30), expiryDate: daysFromNow(180), pharmacyPrincipal: P_PHARMACY, patientPrincipal: P_JAMES,   syncedAt: daysAgo(2),  status: Variant_Failed_Duplicate_Success.Success },
  { id: "sync-002", medicineName: "Lisinopril 10mg",           batchNumber: "BATCH-2026-APR-L",  quantity: BigInt(30), expiryDate: daysFromNow(210), pharmacyPrincipal: P_PHARMACY, patientPrincipal: P_SARAH,   syncedAt: daysAgo(7),  status: Variant_Failed_Duplicate_Success.Success },
  { id: "sync-003", medicineName: "Aspirin EC 81mg",           batchNumber: "BATCH-2026-APR-A",  quantity: BigInt(90), expiryDate: daysFromNow(500), pharmacyPrincipal: P_PHARMACY, patientPrincipal: P_EMMA,    syncedAt: daysAgo(21), status: Variant_Failed_Duplicate_Success.Success },
  { id: "sync-004", medicineName: "Warfarin 5mg",              batchNumber: "BATCH-2026-MAR-W",  quantity: BigInt(28), expiryDate: daysFromNow(180), pharmacyPrincipal: P_PHARMACY, patientPrincipal: P_ROBERT,  syncedAt: daysAgo(30), status: Variant_Failed_Duplicate_Success.Success },
  { id: "sync-005", medicineName: "Levothyroxine 50mcg",       batchNumber: "BATCH-2026-MAR-LT", quantity: BigInt(60), expiryDate: daysFromNow(320), pharmacyPrincipal: P_PHARMACY, patientPrincipal: P_AISHA,   syncedAt: daysAgo(35), status: Variant_Failed_Duplicate_Success.Success },
];

// ─── Dose Logs ─────────────────────────────────────────────────────────────
const mockDoseLogs: DoseLog[] = [
  // Sarah Mitchell — Lisinopril taken 08:14 today (on time)
  { id: "dose-001", medicineId: "med-001", takenAt: minutesAgo(346), isOnTime: true,  userPrincipal: P_SARAH },
  { id: "dose-002", medicineId: "med-002", takenAt: minutesAgo(320), isOnTime: true,  userPrincipal: P_SARAH },
  { id: "dose-003", medicineId: "med-001", takenAt: daysAgo(1) + BigInt(8  * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_SARAH },
  { id: "dose-004", medicineId: "med-002", takenAt: daysAgo(1) + BigInt(13 * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_SARAH },
  { id: "dose-005", medicineId: "med-002", takenAt: daysAgo(1) + BigInt(20 * 3600 * 1_000_000_000), isOnTime: false, userPrincipal: P_SARAH },
  { id: "dose-006", medicineId: "med-003", takenAt: daysAgo(1) + BigInt(22 * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_SARAH },
  // Emma Thompson — Aspirin streak 14 days
  { id: "dose-007", medicineId: "med-010", takenAt: minutesAgo(480), isOnTime: true,  userPrincipal: P_EMMA },
  { id: "dose-008", medicineId: "med-010", takenAt: daysAgo(1) + BigInt(7  * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_EMMA },
  { id: "dose-009", medicineId: "med-010", takenAt: daysAgo(2) + BigInt(7  * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_EMMA },
  { id: "dose-010", medicineId: "med-011", takenAt: minutesAgo(475), isOnTime: true,  userPrincipal: P_EMMA },
  // James Okonkwo — recovering, missed several
  { id: "dose-011", medicineId: "med-004", takenAt: daysAgo(1) + BigInt(20 * 3600 * 1_000_000_000), isOnTime: false, userPrincipal: P_JAMES },
  { id: "dose-012", medicineId: "med-004", takenAt: daysAgo(4) + BigInt(19 * 3600 * 1_000_000_000), isOnTime: false, userPrincipal: P_JAMES },
  { id: "dose-013", medicineId: "med-005", takenAt: daysAgo(1) + BigInt(8  * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_JAMES },
  // David Chen — poor adherence
  { id: "dose-014", medicineId: "med-008", takenAt: daysAgo(3) + BigInt(9  * 3600 * 1_000_000_000), isOnTime: false, userPrincipal: P_DAVID },
  { id: "dose-015", medicineId: "med-009", takenAt: daysAgo(5) + BigInt(8  * 3600 * 1_000_000_000), isOnTime: false, userPrincipal: P_DAVID },
  // Aisha Patel — strong
  { id: "dose-016", medicineId: "med-013", takenAt: minutesAgo(510), isOnTime: true,  userPrincipal: P_AISHA },
  { id: "dose-017", medicineId: "med-013", takenAt: daysAgo(1) + BigInt(6  * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_AISHA },
  // Robert Kim — inconsistent
  { id: "dose-018", medicineId: "med-014", takenAt: daysAgo(2) + BigInt(17 * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_ROBERT },
  { id: "dose-019", medicineId: "med-015", takenAt: daysAgo(1) + BigInt(10 * 3600 * 1_000_000_000), isOnTime: false, userPrincipal: P_ROBERT },
  // Marcus Rodriguez — improving
  { id: "dose-020", medicineId: "med-012", takenAt: minutesAgo(580), isOnTime: true,  userPrincipal: P_MARCUS },
  { id: "dose-021", medicineId: "med-012", takenAt: daysAgo(1) + BigInt(22 * 3600 * 1_000_000_000), isOnTime: true,  userPrincipal: P_MARCUS },
  // Priya Nair
  { id: "dose-022", medicineId: "med-006", takenAt: hoursAgo(6), isOnTime: true,  userPrincipal: P_PRIYA },
  { id: "dose-023", medicineId: "med-007", takenAt: minutesAgo(420), isOnTime: true, userPrincipal: P_PRIYA },
];

// ─── Synced Medicines ──────────────────────────────────────────────────────
const mockSyncedMedicines: SyncedMedicine[] = [
  {
    id: "synced-001",
    name: "Lisinopril 10mg",
    dosage: "10mg",
    frequency: "Once daily — morning",
    category: MedicineCategory.Tablet,
    expiryDate: daysFromNow(210),
    batchNumber: "BATCH-2026-APR-L",
    ownerPrincipal: P_SARAH,
    sourcePrincipal: P_PHARMACY,
    sourcePharmacy: "PharmacistRx Chennai",
    purchaseTimestamp: daysAgo(7),
    createdAt: daysAgo(7),
  },
  {
    id: "synced-002",
    name: "Metformin ER 500mg",
    dosage: "500mg",
    frequency: "Twice daily — with meals",
    category: MedicineCategory.Tablet,
    expiryDate: daysFromNow(180),
    batchNumber: "BATCH-2026-MAY",
    ownerPrincipal: P_JAMES,
    sourcePrincipal: P_PHARMACY,
    sourcePharmacy: "PharmacistRx Chennai",
    purchaseTimestamp: daysAgo(2),
    createdAt: daysAgo(2),
  },
];

// ─── All Users ─────────────────────────────────────────────────────────────
const mockUsers: UserProfile[] = [
  mockPatient,
  { id: "user-002", principal: P_JAMES,    name: "James Okonkwo",       role: UserRole.Patient,   isActive: true, email: "j.okonkwo@gmail.com",       telegramEnabled: false, phone: "+44-7700-900412",  registrationDate: daysAgo(180)  },
  { id: "user-003", principal: P_PRIYA,    name: "Priya Nair",          role: UserRole.Patient,   isActive: true, email: "priya.nair@outlook.com",    telegramEnabled: true,  phone: "+91-99000-45623",  registrationDate: daysAgo(420)  },
  { id: "user-004", principal: P_DAVID,    name: "David Chen",          role: UserRole.Patient,   isActive: true, email: "david.chen@protonmail.com", telegramEnabled: false, phone: "+1-604-555-0198",   registrationDate: daysAgo(45)   },
  { id: "user-005", principal: P_EMMA,     name: "Emma Thompson",       role: UserRole.Patient,   isActive: true, email: "emma.thompson@nhs.net",     telegramEnabled: true,  phone: "+44-7911-123456",  registrationDate: daysAgo(548)  },
  { id: "user-006", principal: P_MARCUS,   name: "Marcus Rodriguez",    role: UserRole.Patient,   isActive: true, email: "marcus.r@icloud.com",       telegramEnabled: false, phone: "+1-305-555-0177",   registrationDate: daysAgo(210)  },
  { id: "user-007", principal: P_AISHA,    name: "Aisha Patel",         role: UserRole.Patient,   isActive: true, email: "aisha.patel@gmail.com",     telegramEnabled: true,  phone: "+91-90003-78912",  registrationDate: daysAgo(310)  },
  { id: "user-008", principal: P_ROBERT,   name: "Robert Kim",          role: UserRole.Patient,   isActive: true, email: "robert.kim@yahoo.com",      telegramEnabled: false, phone: "+82-10-5555-2198",  registrationDate: daysAgo(620)  },
  { id: "user-009", principal: P_PHARMACY, name: "PharmacistRx Chennai", role: UserRole.Pharmacy,  isActive: true, email: "ops@pharmacistrx.in",       telegramEnabled: false,                           registrationDate: daysAgo(900)  },
  { id: "user-010", principal: P_HOSPITAL, name: "City General Hospital", role: UserRole.Hospital, isActive: true, email: "clinical@citygeneral.org",  telegramEnabled: false,                           registrationDate: daysAgo(1100) },
  { id: "user-011", principal: P_LAB,      name: "LifePath Diagnostics",  role: UserRole.Lab,      isActive: true, email: "lab@lifepathdiag.com",      telegramEnabled: false,                           registrationDate: daysAgo(750)  },
  { id: "user-012", principal: P_ADMIN,    name: "Platform Admin",        role: UserRole.Admin,    isActive: true, email: "admin@medivault.io",        telegramEnabled: false,                           registrationDate: daysAgo(1200) },
];

export const mockBackend: backendInterface = {
  // Auth/Profile
  assignCallerUserRole: async () => undefined,
  getCallerUserProfile: async () => mockPatient,
  getCallerUserRole: async () => UserRole__1.user,
  getMyProfile: async () => ({ __kind__: "ok", ok: mockPatient }),
  getUserProfile: async () => mockPatient,
  getAllUsers: async () => mockUsers,
  registerUser: async (email, name, role) => ({
    __kind__: "ok",
    ok: {
      id: "new-user",
      principal: PATIENT_PRINCIPAL,
      name,
      role,
      isActive: true,
      email,
      telegramEnabled: false,
      registrationDate: NOW,
    },
  }),
  saveCallerUserProfile: async () => undefined,
  updateUserProfile: async () => ({ __kind__: "ok", ok: mockPatient }),
  updateUserStatus: async () => ({ __kind__: "ok", ok: null }),
  isCallerAdmin: async () => true,

  // Medicines
  getMyMedicines: async () => mockMedicines,
  createMedicine: async (name, dosage, frequency, expiryDate, category) => ({
    __kind__: "ok",
    ok: {
      id: "med-new",
      name,
      dosage,
      frequency,
      expiryDate,
      category,
      ownerPrincipal: PATIENT_PRINCIPAL,
      createdAt: NOW,
    },
  }),
  updateMedicine: async () => ({ __kind__: "ok", ok: mockMedicines[0] }),
  deleteMedicine: async () => ({ __kind__: "ok", ok: null }),
  updateMedicinePrescriptionUrl: async () => ({ __kind__: "ok", ok: null }),
  getMedicineLcChain: async () => mockTimeline,

  // Reminders
  getMyReminders: async () => mockReminders,
  createReminder: async (medicineId, reminderTime, voiceEnabled) => ({
    __kind__: "ok",
    ok: {
      id: "rem-new",
      medicineId,
      reminderTime,
      voiceEnabled,
      isEnabled: true,
      createdAt: NOW,
      userPrincipal: PATIENT_PRINCIPAL,
    },
  }),
  updateReminder: async () => ({ __kind__: "ok", ok: mockReminders[0] }),
  deleteReminder: async () => ({ __kind__: "ok", ok: null }),

  // Orders
  getMyOrders: async () => mockOrders,
  getPharmacyOrders: async () => mockOrders,
  createOrder: async (patientId, pharmacyId, medicineName, quantity) => ({
    __kind__: "ok",
    ok: {
      id: "ord-new",
      patientId,
      pharmacyId,
      medicineName,
      quantity,
      status: OrderStatus.Pending,
      orderDate: NOW,
    },
  }),
  updateOrderStatus: async () => ({ __kind__: "ok", ok: mockOrders[0] }),

  // Appointments
  getAppointments: async () => mockAppointments,
  createAppointment: async (patientName, dateTime, notes) => ({
    __kind__: "ok",
    ok: { id: "apt-new", patientName, dateTime, notes, status: "Scheduled" },
  }),
  updateAppointmentStatus: async () => ({ __kind__: "ok", ok: mockAppointments[0] }),

  // Inventory
  getPharmacyInventory: async () => mockInventory,
  getInventoryStats: async () => [
    ["Tablet",  BigInt(847 + 623 + 412 + 156 + 334 + 271 + 918)],
    ["Capsule", BigInt(1204 + 188)],
    ["Inhaler", BigInt(89)],
  ],
  getExpiryStats: async () => ({
    expiringSoon: BigInt(3),
    expired: BigInt(0),
    safe: BigInt(7),
  }),
  createInventoryItem: async () => ({ __kind__: "ok", ok: mockInventory[0] }),
  updateInventoryItem: async () => ({ __kind__: "ok", ok: mockInventory[0] }),
  deleteInventoryItem: async () => ({ __kind__: "ok", ok: null }),

  // Diagnostics
  getMyDiagnosticBookings: async () => mockDiagnosticBookings,
  getLabDiagnosticBookings: async () => mockDiagnosticBookings,
  getDiagnosticBooking: async () => mockDiagnosticBookings[0],
  createDiagnosticBooking: async (labPrincipal, testType, preferredDate, reason) => ({
    __kind__: "ok",
    ok: {
      id: "book-new",
      patientPrincipal: PATIENT_PRINCIPAL,
      labPrincipal,
      testType,
      preferredDate,
      reason: reason ?? undefined,
      status: BookingStatus.Booked,
      createdAt: NOW,
      statusHistory: [],
    },
  }),
  updateDiagnosticBookingStatus: async () => ({ __kind__: "ok", ok: mockDiagnosticBookings[0] }),
  uploadDiagnosticReport: async () => ({ __kind__: "ok", ok: mockDiagnosticBookings[0] }),

  // Reports
  getMyReports: async () => mockReports,
  getLabReports: async () => mockReports,
  createReport: async (patientId, fileUrl, reportType) => ({
    __kind__: "ok",
    ok: {
      id: "rep-new",
      patientId,
      fileUrl,
      reportType,
      uploadDate: NOW,
      labPrincipal: LAB_PRINCIPAL,
    },
  }),

  // Notifications
  getMyNotifications: async () => mockNotifications,
  getUnreadNotificationCount: async () => BigInt(4),
  markNotificationRead: async () => ({ __kind__: "ok", ok: null }),
  markAllNotificationsRead: async () => BigInt(4),

  // Timeline / Activity
  getMyTimeline: async () => mockTimeline,
  getEventById: async () => mockTimeline[0],
  markEventRead: async () => ({ __kind__: "ok", ok: null }),

  // Consent
  getMyConsent: async () => mockConsentRecord,
  updateConsent: async () => ({ __kind__: "ok", ok: mockConsentRecord }),
  revokeAllConsent: async () => ({ __kind__: "ok", ok: mockConsentRecord }),
  getConsentAuditTrail: async () => mockConsentRecord.auditTrail,
  getConsentedPatients: async () => [
    { patient: mockPatient,      consent: mockConsentRecord },
    { patient: mockUsers[4],     consent: mockConsentRecords[0] },
    { patient: mockUsers[2],     consent: mockConsentRecords[1] },
  ],

  // Adherence
  getAdherenceScore: async () => 0.94,
  getMyDoseLogs: async () => mockDoseLogs,
  logDose: async () => ({ __kind__: "ok", ok: mockDoseLogs[0] }),

  // Sync
  getMySyncedMedicines: async () => mockSyncedMedicines,
  getPharmacySyncLogs: async () => mockPharmacySyncLogs,
  syncMedicineToPatient: async () => ({ __kind__: "ok", ok: mockPharmacySyncLogs[0] }),

  // Export
  getMyExportLogs: async () => mockExportLogs,
  getAllExportLogs: async () => mockExportLogs,
  logExport: async (req) => ({
    id: "exp-new",
    ...req,
    userId: PATIENT_PRINCIPAL,
    timestamp: NOW,
  }),
  deleteExportLog: async () => true,

  // Admin / System
  getSystemStats: async () => ({
    totalOrders: BigInt(247),
    totalUsers: BigInt(1843),
    totalMedicines: BigInt(4291),
    usersByRole: [
      ["Patient",  BigInt(1624)],
      ["Pharmacy", BigInt(142)],
      ["Hospital", BigInt(48)],
      ["Lab",      BigInt(27)],
      ["Admin",    BigInt(2)],
    ],
  }),

  // Patient lookup
  lookupPatientByPhone: async (_phone) => ({
    __kind__: "ok",
    ok: { principal: P_SARAH, name: "Sarah Mitchell" },
  }),

  // Telegram
  getUserTelegramLogs: async () => [],
  isBotTokenConfigured: async () => false,
  setBotToken: async () => ({ __kind__: "ok", ok: null }),
  sendTestTelegramMessage: async () => ({ __kind__: "ok", ok: null }),
  updateTelegramSettings: async () => ({ __kind__: "ok", ok: mockPatient }),

  // Transform (HTTP outcall)
  transform: async (_input) => ({
    status: BigInt(200),
    body: new Uint8Array(),
    headers: [],
  }),

  // Access control initialization
  _initializeAccessControl: async () => undefined,

  // Phase 3 operational intelligence
  getAuditEventsByActor: async (_actorId: string) => mockTimeline,
  getExportAnalytics: async () => ({
    totalExports: BigInt(mockExportLogs.length),
    successCount: BigInt(mockExportLogs.filter((e) => e.status === "success").length),
    failureCount: BigInt(0),
    exportsByRole: [
      ["Patient",  BigInt(1)],
      ["Pharmacy", BigInt(1)],
      ["Hospital", BigInt(1)],
      ["Lab",      BigInt(1)],
      ["Admin",    BigInt(1)],
    ] as [string, bigint][],
    exportsByFormat: [
      ["PDF",  BigInt(3)],
      ["CSV",  BigInt(1)],
      ["XLSX", BigInt(1)],
    ] as [string, bigint][],
    exportsByType: [
      ["Medication History",  BigInt(1)],
      ["Dispensing Report",   BigInt(1)],
      ["Ecosystem Summary",   BigInt(1)],
      ["Adherence Analytics", BigInt(1)],
      ["Lab Report Bundle",   BigInt(1)],
    ] as [string, bigint][],
  }),
  getReportData: async (_reportType: string) => ({
    reportType: _reportType,
    generatedAt: BigInt(Date.now() * 1_000_000),
    dataPoints: [
      { dataLabel: "Total Patients",        value: "1,624",  metadata: "active across all regions" },
      { dataLabel: "Avg Adherence Score",    value: "76.8%",  metadata: "platform-wide, rolling 30 days" },
      { dataLabel: "Doses Logged Today",     value: "3,847",  metadata: "across all patient cohorts" },
      { dataLabel: "Active Reminders",       value: "8,112",  metadata: "enabled, not expired" },
      { dataLabel: "Flagged Low Adherence",  value: "214",    metadata: "below 60% threshold — review needed" },
    ] as { dataLabel: string; value: string; metadata?: string }[],
  }),
  getWorkflowChain: async (_medicineId: string) => ({
    medicine: { id: "med-001", name: "Lisinopril 10mg" } as { id: string; name: string } | undefined,
    stages: [
      { stageType: "PharmacySale",        events: [], status: "completed", actorRole: "Pharmacy" },
      { stageType: "PatientInventory",    events: [], status: "completed", actorRole: "Patient"  },
      { stageType: "ReminderScheduled",   events: [], status: "completed", actorRole: "Patient"  },
      { stageType: "DoseLogged",          events: [], status: "completed", actorRole: "Patient"  },
      { stageType: "AdherenceRecorded",   events: [], status: "active",    actorRole: "System"   },
      { stageType: "ExpiryMonitored",     events: [], status: "pending",   actorRole: "System"   },
      { stageType: "ReorderTriggered",    events: [], status: "pending",   actorRole: "Pharmacy" },
    ] as { stageType: string; events: never[]; status: string; actorRole: string }[],
  }),
  searchAuditLog: async (_params: unknown) => mockTimeline,
};
