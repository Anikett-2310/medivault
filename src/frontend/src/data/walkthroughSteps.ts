import type { WalkthroughStep } from "@/hooks/useWalkthrough";

export const PATIENT_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "patient-medicines",
    stepNumber: 1,
    role: "patient",
    title: "Your Medicine Inventory",
    description:
      "All your active prescriptions in one place. Each medicine tracks its full lifecycle from pharmacy dispensing to your last dose.",
    targetSelector: "[data-ocid='medicines.list']",
  },
  {
    id: "patient-reminders",
    stepNumber: 2,
    role: "patient",
    title: "Schedule Reminders",
    description:
      "Set daily reminders per medicine. The system tracks completion, snoozes, and missed doses automatically.",
    targetSelector: "[data-ocid='reminders.list']",
  },
  {
    id: "patient-dose-log",
    stepNumber: 3,
    role: "patient",
    title: "Log Your Doses",
    description:
      "Every dose you log creates a traceable entry in your health record — visible to consented hospitals.",
    targetSelector: "[data-ocid='dose_log.list']",
  },
  {
    id: "patient-adherence",
    stepNumber: 4,
    role: "patient",
    title: "Your Adherence Score",
    description:
      "Real-time adherence trends calculated from your dose logs. Hospitals and pharmacies use this to coordinate your care.",
    targetSelector: "[data-ocid='adherence.section']",
  },
  {
    id: "patient-diagnostics",
    stepNumber: 5,
    role: "patient",
    title: "Diagnostic Bookings",
    description:
      "Book lab tests directly. Results are uploaded by the lab and linked to your patient record.",
    targetSelector: "[data-ocid='diagnostics.list']",
  },
  {
    id: "patient-timeline",
    stepNumber: 6,
    role: "patient",
    title: "Your Activity Timeline",
    description:
      "A complete audit trail of every interaction — from prescription dispensing to consent grants.",
    targetSelector: "[data-ocid='timeline.list']",
  },
  {
    id: "patient-lifecycle",
    stepNumber: 7,
    role: "patient",
    title: "Medicine Lifecycle",
    description:
      "Trace any medicine from pharmacy sale through reminders, dose logs, adherence, and reorder.",
    targetSelector: "[data-ocid='lifecycle.section']",
  },
  {
    id: "patient-reports",
    stepNumber: 8,
    role: "patient",
    title: "Generate Reports",
    description:
      "Export your medication history as PDF or CSV for insurance, specialists, or personal records.",
    targetSelector: "[data-ocid='reports.section']",
  },
  {
    id: "patient-ecosystem",
    stepNumber: 9,
    role: "patient",
    title: "Ecosystem Visibility",
    description:
      "See which pharmacies and hospitals are actively coordinating your care.",
    targetSelector: "[data-ocid='dashboard.ecosystem_section']",
  },
];

export const PHARMACY_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "pharmacy-inventory",
    stepNumber: 1,
    role: "pharmacy",
    title: "Live Inventory",
    description:
      "Real-time stock levels with automatic low-stock and expiry alerts.",
    targetSelector: "[data-ocid='inventory.list']",
  },
  {
    id: "pharmacy-expiry",
    stepNumber: 2,
    role: "pharmacy",
    title: "Expiry Intelligence",
    description:
      "Medicines approaching expiry are flagged automatically — 90, 60, and 30-day warnings.",
    targetSelector: "[data-ocid='expiry.section']",
  },
  {
    id: "pharmacy-sync",
    stepNumber: 3,
    role: "pharmacy",
    title: "Patient Sync",
    description:
      "Synchronize dispensed medicines directly to patient inventory — creating the first link in the lifecycle chain.",
    targetSelector: "[data-ocid='sync.section']",
  },
  {
    id: "pharmacy-orders",
    stepNumber: 4,
    role: "pharmacy",
    title: "Operational Orders",
    description:
      "Track supplier orders and restock events as part of the full inventory audit trail.",
    targetSelector: "[data-ocid='orders.list']",
  },
  {
    id: "pharmacy-reports",
    stepNumber: 5,
    role: "pharmacy",
    title: "Reporting Center",
    description:
      "Generate dispensing summaries, expiry reports, and inventory audits.",
    targetSelector: "[data-ocid='reports.section']",
  },
  {
    id: "pharmacy-audit",
    stepNumber: 6,
    role: "pharmacy",
    title: "Audit History",
    description:
      "Every dispensing event, sync, and inventory change is logged with timestamps and actor attribution.",
    targetSelector: "[data-ocid='audit.section']",
  },
];

export const ADMIN_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "admin-ecosystem",
    stepNumber: 1,
    role: "admin",
    title: "Ecosystem Overview",
    description:
      "See the full MediVault ecosystem — active patients, pharmacies, hospitals, and labs — at a glance.",
    targetSelector: "[data-ocid='dashboard.section']",
  },
  {
    id: "admin-analytics",
    stepNumber: 2,
    role: "admin",
    title: "Role Intelligence",
    description:
      "Cross-role analytics: adherence trends, lifecycle completion rates, workflow coordination metrics.",
    targetSelector: "[data-ocid='analytics.section']",
  },
  {
    id: "admin-audit",
    stepNumber: 3,
    role: "admin",
    title: "Platform Audit",
    description: "Complete operational audit log across all roles and actors.",
    targetSelector: "[data-ocid='audit.section']",
  },
  {
    id: "admin-users",
    stepNumber: 4,
    role: "admin",
    title: "User Management",
    description:
      "Manage role registrations, access levels, and ecosystem membership.",
    targetSelector: "[data-ocid='users.list']",
  },
  {
    id: "admin-exports",
    stepNumber: 5,
    role: "admin",
    title: "Export Center",
    description:
      "Generate ecosystem-wide operational reports and compliance summaries.",
    targetSelector: "[data-ocid='reports.section']",
  },
];

export const HOSPITAL_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "hospital-welcome",
    stepNumber: 1,
    role: "hospital",
    title: "Hospital Role Overview",
    description:
      "The hospital view surfaces consent-controlled patient data — medication histories, adherence records, and diagnostic results. Access is granted per-patient and governed by explicit consent interactions.",
    targetSelector: "[data-ocid='dashboard.section']",
  },
  {
    id: "hospital-consented-patients",
    stepNumber: 2,
    role: "hospital",
    title: "Consented Patients",
    description:
      "Only patients who have explicitly granted hospital access appear here. Consent state is live — revocation removes access immediately without manual intervention.",
    targetSelector: "[data-ocid='patients.list']",
  },
  {
    id: "hospital-adherence",
    stepNumber: 3,
    role: "hospital",
    title: "Adherence Review",
    description:
      "Medication adherence rates calculated from patient dose logs. Clinicians can identify non-adherent patients and coordinate with pharmacy or care teams for follow-up.",
    targetSelector: "[data-ocid='adherence.section']",
  },
  {
    id: "hospital-diagnostics",
    stepNumber: 4,
    role: "hospital",
    title: "Diagnostics Integration",
    description:
      "Lab reports linked to consented patients are surfaced here. Each report carries its upload timestamp, lab attribution, and patient linkage — enabling clinical review without manual aggregation.",
    targetSelector: "[data-ocid='diagnostics.list']",
  },
  {
    id: "hospital-reports",
    stepNumber: 5,
    role: "hospital",
    title: "Reporting & Export",
    description:
      "Generate hospital-scoped operational reports — adherence summaries, consent interaction logs, and diagnostic outcome records. Exports respect consent boundaries and include full audit lineage.",
    targetSelector: "[data-ocid='reports.section']",
  },
  {
    id: "hospital-audit",
    stepNumber: 6,
    role: "hospital",
    title: "Audit Trail",
    description:
      "Every data access event, consent change, and report interaction is logged with actor attribution and timestamps. The audit trail supports clinical governance and compliance review.",
    targetSelector: "[data-ocid='audit.section']",
  },
];

export const LAB_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "lab-welcome",
    stepNumber: 1,
    role: "diagnostic",
    title: "Lab / Diagnostic Role Overview",
    description:
      "The lab role manages diagnostic report uploads, patient linkage, and result distribution. Every report creates an auditable event visible across the care ecosystem — to patients, consented hospitals, and admins.",
    targetSelector: "[data-ocid='dashboard.section']",
  },
  {
    id: "lab-reports",
    stepNumber: 2,
    role: "diagnostic",
    title: "Diagnostic Reports",
    description:
      "All uploaded lab reports with status indicators — pending review, delivered, or flagged. Each entry shows the linked patient, test type, and upload timestamp.",
    targetSelector: "[data-ocid='reports.list']",
  },
  {
    id: "lab-upload",
    stepNumber: 3,
    role: "diagnostic",
    title: "Upload Workflow",
    description:
      "Uploading a report triggers automatic patient linkage, generates an audit event, and notifies the patient. The workflow is atomic — partial uploads do not create orphaned records.",
    targetSelector: "[data-ocid='upload.section']",
  },
  {
    id: "lab-coordination",
    stepNumber: 4,
    role: "diagnostic",
    title: "Patient & Hospital Coordination",
    description:
      "Lab results flow directly to the linked patient's record and become visible to consented hospitals. This closes the diagnostic loop without manual handoffs between systems.",
    targetSelector: "[data-ocid='coordination.section']",
  },
  {
    id: "lab-audit",
    stepNumber: 5,
    role: "diagnostic",
    title: "Audit & Compliance",
    description:
      "Full audit trail of report uploads, patient linkage events, delivery confirmations, and access interactions. Each entry is timestamped and attributed to the responsible lab actor.",
    targetSelector: "[data-ocid='audit.section']",
  },
];

/** Lookup by role — returns empty array for roles without a defined walkthrough */
export function getWalkthroughStepsForRole(role: string): WalkthroughStep[] {
  switch (role) {
    case "patient":
      return PATIENT_WALKTHROUGH_STEPS;
    case "pharmacy":
      return PHARMACY_WALKTHROUGH_STEPS;
    case "admin":
      return ADMIN_WALKTHROUGH_STEPS;
    case "hospital":
      return HOSPITAL_WALKTHROUGH_STEPS;
    case "diagnostic":
      return LAB_WALKTHROUGH_STEPS;
    default:
      return [];
  }
}

export default {
  patient: PATIENT_WALKTHROUGH_STEPS,
  pharmacy: PHARMACY_WALKTHROUGH_STEPS,
  admin: ADMIN_WALKTHROUGH_STEPS,
  hospital: HOSPITAL_WALKTHROUGH_STEPS,
  lab: LAB_WALKTHROUGH_STEPS,
};
