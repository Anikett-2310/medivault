import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import UserTypes "types/users";
import MedTypes "types/medicines";
import PharmTypes "types/pharmacy";
import LabTypes "types/lab";
import HospTypes "types/hospital";
import UsersMixin "mixins/users-api";
import MedicinesMixin "mixins/medicines-api";
import PharmacyMixin "mixins/pharmacy-api";
import LabMixin "mixins/lab-api";
import HospitalMixin "mixins/hospital-api";
import AnalyticsMixin "mixins/analytics-api";
import TelegramTypes "types/telegram";
import TelegramLib "lib/telegram";
import TelegramMixin "mixins/telegram-api";
import ConsentTypes "types/consent";
import NotifTypes "types/notifications";
import DiagTypes "types/diagnostics";
import ActivityTypes "types/activity";
import ConsentMixin "mixins/consent-api";
import NotificationsMixin "mixins/notifications-api";
import DiagnosticsMixin "mixins/diagnostics-api";
import PharmacySyncMixin "mixins/pharmacy-sync-api";
import ActivityMixin "mixins/activity-api";
import ExportTypes "types/exports";
import ExportsMixin "mixins/exports-api";
import AuditMixin "mixins/audit-api";

actor {
  // Authorization (extension)
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState);

  // Stable state — initialized by migration chain
  let users : Map.Map<Principal, UserTypes.UserProfile>;
  let medicines : Map.Map<Text, MedTypes.Medicine>;
  let doseLogs : Map.Map<Text, MedTypes.DoseLog>;
  let reminders : Map.Map<Text, MedTypes.Reminder>;
  let inventory : Map.Map<Text, PharmTypes.InventoryItem>;
  let orders : Map.Map<Text, PharmTypes.Order>;
  let reports : Map.Map<Text, LabTypes.Report>;
  let appointments : Map.Map<Text, HospTypes.Appointment>;
  let telegramLogs : Map.Map<Text, TelegramTypes.TelegramLog>;
  let telegramState : TelegramLib.TelegramState;
  // New ecosystem stable state — initialized by migration chain
  let consents : Map.Map<Principal, ConsentTypes.ConsentRecord>;
  let notifications : Map.Map<Text, NotifTypes.NotificationRecord>;
  let diagnosticBookings : Map.Map<Text, DiagTypes.DiagnosticBooking>;
  let syncLogs : Map.Map<Text, PharmTypes.PharmacySyncLog>;
  let syncedMedicines : Map.Map<Text, MedTypes.SyncedMedicine>;
  let activityEvents : Map.Map<Text, ActivityTypes.ActivityEvent>;
  let exportLogsStore : Map.Map<Text, ExportTypes.ExportLogEntry>;
  // Mixin composition — all public API delegated to mixins
  include UsersMixin(accessControlState, users);
  include MedicinesMixin(accessControlState, medicines, doseLogs, reminders);
  include PharmacyMixin(accessControlState, inventory, orders);
  include LabMixin(accessControlState, reports);
  include HospitalMixin(accessControlState, appointments, consents, users);
  include AnalyticsMixin(accessControlState, users, medicines, orders, inventory);
  include TelegramMixin(accessControlState, users, telegramLogs, telegramState);
  include ConsentMixin(accessControlState, consents, activityEvents);
  include NotificationsMixin(accessControlState, notifications);
  include DiagnosticsMixin(accessControlState, diagnosticBookings, activityEvents, notifications);
  include PharmacySyncMixin(accessControlState, users, syncLogs, syncedMedicines, notifications, activityEvents);
  include AuditMixin(accessControlState, activityEvents, medicines, doseLogs, reminders, exportLogsStore);
  include ActivityMixin(accessControlState, activityEvents);
  include ExportsMixin(accessControlState, users, exportLogsStore);
};
