import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and store the token in Supabase.
 * Must be called after the user is authenticated.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync("scan-reminders", {
      name: "Scan Reminders",
      description: "Weekly reminders to take your skin scan",
      importance: Notifications.AndroidImportance.HIGH,
    });

    await Notifications.setNotificationChannelAsync("routine-reminders", {
      name: "Routine Reminders",
      description: "Daily AM/PM skincare routine reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Get the Expo push token
  try {
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;

    if (!projectId) {
      console.error("Expo project ID is not configured. Please set EXPO_PUBLIC_PROJECT_ID.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Store token in Supabase
    await savePushToken(token);

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

/**
 * Save the push token to the user's profile in Supabase.
 */
async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      push_token: token,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    console.error("Error saving push token:", error);
  }
}

/**
 * Get notification preferences for the current user.
 */
export async function getNotificationPreferences() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching notification preferences:", error);
    return null;
  }
  return data;
}

/**
 * Update notification preferences for the current user.
 */
export async function updateNotificationPreferences(prefs: {
  scan_reminders?: boolean;
  routine_reminders?: boolean;
  insights_notifications?: boolean;
  routine_am_hour?: number;
  routine_am_minute?: number;
  routine_pm_hour?: number;
  routine_pm_minute?: number;
  scan_reminder_day?: number;
  scan_reminder_hour?: number;
  scan_reminder_minute?: number;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    console.error("Error updating notification preferences:", error);
  }
}

/**
 * Schedule a local notification for scanning reminder.
 * Schedules for the next occurrence of the specified day at the given time.
 */
export async function scheduleScanReminder(
  dayOfWeek: number,
  hour: number = 10,
  minute: number = 0
): Promise<void> {
  // Cancel any existing scan reminders
  await cancelScanReminders();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time for your weekly scan!",
      body: "Take a quick scan to track your skin progress.",
      data: { type: "scan_reminder" },
      ...(Platform.OS === "android" ? { channelId: "scan-reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: dayOfWeek, // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
      hour,
      minute,
    },
  });
}

/**
 * Schedule daily AM and PM routine reminders.
 */
export async function scheduleRoutineReminders(
  amHour: number = 8,
  amMinute: number = 0,
  pmHour: number = 21,
  pmMinute: number = 0
): Promise<void> {
  // Cancel any existing routine reminders
  await cancelRoutineReminders();

  // Morning reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Good morning! Time for your AM routine",
      body: "Start your day with your morning skincare routine.",
      data: { type: "routine_am" },
      ...(Platform.OS === "android" ? { channelId: "routine-reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: amHour,
      minute: amMinute,
    },
  });

  // Evening reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Evening routine time",
      body: "Wind down with your PM skincare routine.",
      data: { type: "routine_pm" },
      ...(Platform.OS === "android" ? { channelId: "routine-reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: pmHour,
      minute: pmMinute,
    },
  });
}

/**
 * Cancel all scheduled scan reminder notifications.
 */
export async function cancelScanReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === "scan_reminder") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/**
 * Cancel all scheduled routine reminder notifications.
 */
export async function cancelRoutineReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === "routine_am" || notif.content.data?.type === "routine_pm") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/**
 * Check if push notification permission is granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
