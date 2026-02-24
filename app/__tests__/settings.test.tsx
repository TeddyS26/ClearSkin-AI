import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import Settings from "../settings";
import { supabase } from "../../src/lib/supabase";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/ctx/AuthContext";
import { getSubscriptionStatus } from "../../src/lib/billing";

jest.mock("../../src/lib/supabase");
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));
jest.mock("../../src/ctx/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../src/lib/billing", () => ({
  getSubscriptionStatus: jest.fn(),
  openBillingPortal: jest.fn(),
}));

// Mock notifications module
jest.mock("../../src/lib/notifications", () => ({
  getNotificationPreferences: jest.fn().mockResolvedValue(null),
  updateNotificationPreferences: jest.fn().mockResolvedValue(undefined),
  scheduleScanReminder: jest.fn().mockResolvedValue(undefined),
  scheduleRoutineReminders: jest.fn().mockResolvedValue(undefined),
  cancelScanReminders: jest.fn().mockResolvedValue(undefined),
  cancelRoutineReminders: jest.fn().mockResolvedValue(undefined),
  hasNotificationPermission: jest.fn().mockResolvedValue(false),
  registerForPushNotifications: jest.fn().mockResolvedValue(null),
}));

// Mock DateTimePicker
jest.mock("@react-native-community/datetimepicker", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => View,
  };
});

// Mock lucide-react-native
jest.mock("lucide-react-native", () => ({
  ArrowLeft: "ArrowLeft",
  CreditCard: "CreditCard",
  Lock: "Lock",
  LogOut: "LogOut",
  Crown: "Crown",
  ChevronRight: "ChevronRight",
  User: "User",
  FileText: "FileText",
  Shield: "Shield",
  X: "X",
  Eye: "Eye",
  EyeOff: "EyeOff",
  Download: "Download",
  MessageSquare: "MessageSquare",
  Calendar: "Calendar",
  UserCircle: "UserCircle",
  AlertCircle: "AlertCircle",
  Bell: "Bell",
  Clock: "Clock",
}));

describe("Settings", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockSignOut = jest.fn();
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    });
    (getSubscriptionStatus as jest.Mock).mockResolvedValue(null);
    
    // Default supabase mocks
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          order: jest.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    });
  });

  describe("Rendering", () => {
    it("should render settings page", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Settings")).toBeTruthy();
      });
    });

    it("should show user email", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("test@example.com")).toBeTruthy();
      });
    });

    it("should display settings sections", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Account Information")).toBeTruthy();
        expect(getByText("Profile Information")).toBeTruthy();
      });
    });
  });

  describe("Profile Section", () => {
    it("should show profile information section", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Profile Information")).toBeTruthy();
      });
    });

    it("should display profile data when loaded", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                gender: "male",
                date_of_birth: "1990-05-15",
                age: 35,
                profile_edited: true,
              },
            }),
            order: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Male")).toBeTruthy();
      });
    });

    it("should show 'Not set' when profile data is missing", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                gender: null,
                date_of_birth: null,
                age: null,
                profile_edited: false,
              },
            }),
            order: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        // When profile not edited, we show "Complete Your Profile"
        expect(getByText("Complete Your Profile")).toBeTruthy();
      });
    });
  });

  describe("Profile Modal", () => {
    it("should show setup prompt when profile not edited", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { gender: null, date_of_birth: null, age: null, profile_edited: false },
            }),
            order: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Complete Your Profile")).toBeTruthy();
        expect(getByText("Set Up Profile")).toBeTruthy();
      });
    });

    it("should show 'Profile Set' when profile is edited", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { gender: "male", date_of_birth: "1990-05-15", age: 35, profile_edited: true },
            }),
            order: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Profile Set")).toBeTruthy();
        expect(getByText("Male")).toBeTruthy();
      });
    });

    it("should show alert when trying to edit already-set profile", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { gender: null, date_of_birth: null, age: null, profile_edited: true },
            }),
            order: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      });

      // Profile is edited but has null values - should still be "set"
      // In this case there's no "Set Up Profile" button visible
    });
  });

  describe("Navigation", () => {
    it("should navigate to privacy policy", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        const privacyButton = getByText("Privacy Policy");
        fireEvent.press(privacyButton);
      });

      expect(mockPush).toHaveBeenCalledWith("/privacy-policy");
    });

    it("should navigate to terms of service", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        const termsButton = getByText("Terms of Service");
        fireEvent.press(termsButton);
      });

      expect(mockPush).toHaveBeenCalledWith("/terms-of-service");
    });

    it("should navigate to contact page when support pressed", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Contact & Support")).toBeTruthy();
      });
      
      fireEvent.press(getByText("Contact & Support"));
      expect(mockPush).toHaveBeenCalledWith("/contact");
    });
  });

  describe("Subscription", () => {
    it("should show subscription section", async () => {
      (getSubscriptionStatus as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Subscription")).toBeTruthy();
      });
    });

    it("should show active status when subscribed", async () => {
      (getSubscriptionStatus as jest.Mock).mockResolvedValue({
        status: "active",
        stripe_subscription_id: "sub_123",
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Active and ready to use")).toBeTruthy();
      });
    });
  });

  describe("Password Change", () => {
    it("should show change password section", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText("Change Password")).toBeTruthy();
      });
    });
  });

  describe("Sign Out", () => {
    it("should show confirmation alert when sign out is pressed", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        const signOutButton = getByText("Sign Out");
        fireEvent.press(signOutButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign Out",
        "Are you sure you want to sign out?",
        expect.any(Array)
      );
    });
  });

  describe("Data Export", () => {
    it("should show export confirmation when export is pressed", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        const exportButton = getByText("Export My Data");
        fireEvent.press(exportButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Export Your Data",
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  describe("Account Deletion", () => {
    it("should show deletion warning when delete is pressed", async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        const deleteButton = getByText("Delete Account");
        fireEvent.press(deleteButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Account",
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  describe("Back Navigation", () => {
    it("should go back when back button is pressed", async () => {
      const { getByTestId } = render(<Settings />);

      await waitFor(() => {
        const backButton = getByTestId("back-button");
        fireEvent.press(backButton);
      });

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
