import { userStorageKey } from "./userStorageKey";

export type NotificationPrefs = {
  emailPhaseAdvance: boolean;
  emailRejection: boolean;
  emailAqlAssignment: boolean;
  emailSupervisorAlert: boolean;
  smsRejection: boolean;
  smsSupervisorOverride: boolean;
};

const STORAGE_KEY = "doccompare_notification_prefs";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailPhaseAdvance: true,
  emailRejection: true,
  emailAqlAssignment: true,
  emailSupervisorAlert: true,
  smsRejection: false,
  smsSupervisorOverride: false,
};

export function loadNotificationPrefs(userId?: number | null): NotificationPrefs {
  try {
    const raw = localStorage.getItem(userStorageKey(STORAGE_KEY, userId));
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs, userId?: number | null) {
  localStorage.setItem(userStorageKey(STORAGE_KEY, userId), JSON.stringify(prefs));
}
