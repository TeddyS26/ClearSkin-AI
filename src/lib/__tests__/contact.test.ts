import { Alert, Linking } from 'react-native';
import { openContactEmail, sendContactMessage } from '../contact';

// Mock React Native modules
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

// Mock fetch for sendContactMessage
global.fetch = jest.fn();

describe('contact.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openContactEmail', () => {
    it('should open email client with default subject and message', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openContactEmail();

      expect(Linking.canOpenURL).toHaveBeenCalledWith(
        'mailto:contact@clearskinai.ca?subject=Contact%20from%20ClearSkin%20AI&body=Hello%20ClearSkin%20AI%20team%2C%0A%0A'
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        'mailto:contact@clearskinai.ca?subject=Contact%20from%20ClearSkin%20AI&body=Hello%20ClearSkin%20AI%20team%2C%0A%0A'
      );
    });

    it('should open email client with custom subject and message', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openContactEmail('Test Subject', 'Test message content');

      expect(Linking.canOpenURL).toHaveBeenCalledWith(
        'mailto:contact@clearskinai.ca?subject=Test%20Subject&body=Test%20message%20content'
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        'mailto:contact@clearskinai.ca?subject=Test%20Subject&body=Test%20message%20content'
      );
    });

    it('should handle URL encoding for special characters', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await openContactEmail('Subject with & symbols', 'Message with "quotes" and \n newlines');

      expect(Linking.canOpenURL).toHaveBeenCalledWith(
        'mailto:contact@clearskinai.ca?subject=Subject%20with%20%26%20symbols&body=Message%20with%20%22quotes%22%20and%20%0A%20newlines'
      );
    });

    it('should show alert when email client is not available', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await openContactEmail('Test Subject', 'Test message');

      expect(Linking.openURL).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Not Available',
        'Please contact us directly at contact@clearskinai.ca',
        [
          {
            text: 'Copy Email',
            onPress: expect.any(Function)
          },
          { text: 'OK' }
        ]
      );
    });

    it('should handle copy email button press', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      await openContactEmail('Test Subject', 'Test message');

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const copyButton = alertCall[2][0];
      copyButton.onPress();

      expect(Alert.alert).toHaveBeenCalledWith('Contact Email', 'contact@clearskinai.ca');
    });

    it('should handle error when opening URL fails', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Failed to open'));

      await openContactEmail('Test Subject', 'Test message');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to open email client. Please contact us directly at contact@clearskinai.ca'
      );
    });

    it('should handle error when canOpenURL fails', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Check failed'));

      await openContactEmail('Test Subject', 'Test message');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to open email client. Please contact us directly at contact@clearskinai.ca'
      );
    });
  });

  describe('sendContactMessage', () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    };

    beforeEach(() => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    it('should send contact message successfully', async () => {
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await sendContactMessage(
        'Test Subject',
        'Test message',
        'user@example.com',
        'Test User',
        'mock-token'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/send-contact-email',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'Test Subject',
            message: 'Test message',
            userEmail: 'user@example.com',
            userName: 'Test User',
          }),
        }
      );

      expect(result).toEqual({ success: true });
    });

    it('should handle fetch error response', async () => {
      const errorResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('Error message from server'),
      };
      mockFetch.mockResolvedValue(errorResponse as any);

      await expect(
        sendContactMessage(
          'Test Subject',
          'Test message',
          'user@example.com',
          'Test User',
          'mock-token'
        )
      ).rejects.toThrow('Error message from server');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        sendContactMessage(
          'Test Subject',
          'Test message',
          'user@example.com',
          'Test User',
          'mock-token'
        )
      ).rejects.toThrow('Network error');
    });

    it('should handle empty subject and message', async () => {
      mockFetch.mockResolvedValue(mockResponse as any);

      await sendContactMessage(
        '',
        '',
        'user@example.com',
        'Test User',
        'mock-token'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/send-contact-email',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: '',
            message: '',
            userEmail: 'user@example.com',
            userName: 'Test User',
          }),
        }
      );
    });

    it('should handle special characters in subject and message', async () => {
      mockFetch.mockResolvedValue(mockResponse as any);

      await sendContactMessage(
        'Subject with "quotes" & symbols',
        'Message with \n newlines and "quotes"',
        'user@example.com',
        'Test User',
        'mock-token'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/send-contact-email',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'Subject with "quotes" & symbols',
            message: 'Message with \n newlines and "quotes"',
            userEmail: 'user@example.com',
            userName: 'Test User',
          }),
        }
      );
    });
  });
});
