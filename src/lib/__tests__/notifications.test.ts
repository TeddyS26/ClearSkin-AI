import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermissions,
  hasNotificationPermissions,
  notifyScanComplete,
  scheduleScanReminder,
  cancelScanReminder,
  getScheduledNotifications,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '../notifications';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidNotificationPriority: {
    HIGH: 'high',
    DEFAULT: 'default',
  },
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermissions', () => {
    it('should return true if permissions already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should request permissions if not already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false if permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });
  });

  describe('hasNotificationPermissions', () => {
    it('should return true if permissions granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await hasNotificationPermissions();

      expect(result).toBe(true);
    });

    it('should return false if permissions not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await hasNotificationPermissions();

      expect(result).toBe(false);
    });
  });

  describe('notifyScanComplete', () => {
    it('should schedule success notification when scan completes successfully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      await notifyScanComplete('scan-123', true);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: '✨ Skin Analysis Complete!',
          body: 'Your skin analysis is ready. Tap to view your results!',
          data: { scanId: 'scan-123', success: true, type: 'scan_complete' },
          sound: true,
        }),
        trigger: null,
      });
    });

    it('should schedule failure notification when scan fails', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      await notifyScanComplete('scan-123', false);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: '❌ Analysis Failed',
          body: 'Something went wrong with your analysis. Tap to try again.',
          data: { scanId: 'scan-123', success: false, type: 'scan_complete' },
          sound: true,
        }),
        trigger: null,
      });
    });

    it('should not schedule notification if permissions not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await notifyScanComplete('scan-123', true);

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('scheduleScanReminder', () => {
    it('should schedule bi-weekly reminder notification', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');

      await scheduleScanReminder();

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: '📸 Time for a Skin Check!',
          body: "It's been 2 weeks since your last scan. Track your skin's progress with a new analysis!",
          data: { type: 'scan_reminder' },
          sound: true,
        }),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 14 * 24 * 60 * 60, // 2 weeks in seconds
        },
      });
    });

    it('should store notification ID in AsyncStorage', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');

      await scheduleScanReminder();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@clearskin_scan_reminder_id',
        'notification-id-123'
      );
    });

    it('should cancel existing reminder before scheduling new one', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('old-notification-id');
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('new-notification-id');

      await scheduleScanReminder();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-notification-id');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@clearskin_scan_reminder_id');
    });

    it('should not schedule reminder if permissions not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await scheduleScanReminder();

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelScanReminder', () => {
    it('should cancel existing reminder notification', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('notification-id-123');

      await cancelScanReminder();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-id-123');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@clearskin_scan_reminder_id');
    });

    it('should do nothing if no existing reminder', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await cancelScanReminder();

      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(cancelScanReminder()).resolves.not.toThrow();
    });
  });

  describe('getScheduledNotifications', () => {
    it('should return all scheduled notifications', async () => {
      const mockNotifications = [{ id: '1' }, { id: '2' }];
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await getScheduledNotifications();

      expect(result).toEqual(mockNotifications);
    });
  });

  describe('addNotificationResponseListener', () => {
    it('should add response listener', () => {
      const mockCallback = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      const subscription = addNotificationResponseListener(mockCallback);

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(mockCallback);
      expect(subscription).toBe(mockSubscription);
    });
  });

  describe('addNotificationReceivedListener', () => {
    it('should add received listener', () => {
      const mockCallback = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      const subscription = addNotificationReceivedListener(mockCallback);

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(mockCallback);
      expect(subscription).toBe(mockSubscription);
    });
  });
});
