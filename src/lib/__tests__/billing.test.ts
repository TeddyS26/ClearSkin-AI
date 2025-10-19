import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../supabase";
import {
  getJwt,
  createSubscriptionPayment,
  openBillingPortal,
  configureLinking,
  hasActiveSubscription,
  getSubscriptionStatus
} from "../billing";

jest.mock("expo-web-browser");
jest.mock("expo-linking");
jest.mock("../supabase");

// Mock fetch for API calls
global.fetch = jest.fn();

describe('billing.ts', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  });

  describe('getJwt', () => {
    it('should return JWT token when user is signed in', async () => {
      const mockToken = 'mock-jwt-token';
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      const token = await getJwt();

      expect(token).toBe(mockToken);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should throw error when user is not signed in', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: null
        }
      });

      await expect(getJwt()).rejects.toThrow('Not signed in');
    });

    it('should throw error when session has no access token', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {}
        }
      });

      await expect(getJwt()).rejects.toThrow('Not signed in');
    });
  });

  describe('createSubscriptionPayment', () => {
    it('should create subscription payment successfully', async () => {
      const mockToken = 'mock-jwt-token';
      const mockResponse = {
        paymentIntent: 'pi_test_123',
        ephemeralKey: 'ek_test_123',
        customer: 'cus_test_123',
        subscriptionId: 'sub_test_123'
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          paymentIntent: 'pi_test_123',
          ephemeralKey: 'ek_test_123',
          customerId: 'cus_test_123',
          subscriptionId: 'sub_test_123'
        })
      } as any);

      const result = await createSubscriptionPayment();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/create-subscription-payment',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API call fails', async () => {
      const mockToken = 'mock-jwt-token';
      const errorMessage = 'Payment creation failed';

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: errorMessage })
      } as any);

      await expect(createSubscriptionPayment()).rejects.toThrow(errorMessage);
    });

    it('should throw default error when API call fails without specific error', async () => {
      const mockToken = 'mock-jwt-token';

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({})
      } as any);

      await expect(createSubscriptionPayment()).rejects.toThrow('Failed to create payment');
    });
  });

  describe('openBillingPortal', () => {
    it('should open billing portal successfully', async () => {
      const mockToken = 'mock-jwt-token';
      const mockUrl = 'https://billing.stripe.com/p/session_test_123';

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ url: mockUrl })
      } as any);

      (WebBrowser.openBrowserAsync as jest.Mock).mockResolvedValue(undefined);

      await openBillingPortal();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/billing-portal',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );

      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(mockUrl);
    });

    it('should throw error when API call fails', async () => {
      const mockToken = 'mock-jwt-token';
      const errorMessage = 'Portal creation failed';

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: errorMessage })
      } as any);

      await expect(openBillingPortal()).rejects.toThrow(errorMessage);
    });

    it('should throw default error when API call fails without specific error', async () => {
      const mockToken = 'mock-jwt-token';

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({})
      } as any);

      await expect(openBillingPortal()).rejects.toThrow('Portal failed');
    });

    it('should not open browser when no URL is returned', async () => {
      const mockToken = 'mock-jwt-token';

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: mockToken
          }
        }
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      } as any);

      await openBillingPortal();

      expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
    });
  });

  describe('configureLinking', () => {
    it('should create linking URL', () => {
      const mockUrl = 'clearskinai://';
      (Linking.createURL as jest.Mock).mockReturnValue(mockUrl);

      const result = configureLinking();

      expect(result).toBe(mockUrl);
      expect(Linking.createURL).toHaveBeenCalledWith('/');
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true when user has active subscription', async () => {
      const mockUser = { id: 'user-123' };
      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        status: 'active'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: mockSubscription
              })
            })
          })
        })
      });

      const result = await hasActiveSubscription();

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should return false when user has no subscription', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null
              })
            })
          })
        })
      });

      const result = await hasActiveSubscription();

      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      const result = await hasActiveSubscription();

      expect(result).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription details when user has subscription', async () => {
      const mockUser = { id: 'user-123' };
      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        status: 'active',
        current_period_end: '2024-12-31'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockSubscription
            })
          })
        })
      });

      const result = await getSubscriptionStatus();

      expect(result).toEqual(mockSubscription);
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should return null when user has no subscription', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null
            })
          })
        })
      });

      const result = await getSubscriptionStatus();

      expect(result).toBe(null);
    });

    it('should return null when user is not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      const result = await getSubscriptionStatus();

      expect(result).toBe(null);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
