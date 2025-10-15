import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import CheckEmail from "../check-email";
import { supabase } from "../../../src/lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";

jest.mock("../../../src/lib/supabase", () => ({
  supabase: {
    auth: {
      resend: jest.fn(),
    },
  },
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Link: "Link",
}));

// Mock expo-auth-session
jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "https://auth.expo.io/@test/clearskin-ai/--/auth/confirm"),
}));

// Mock lucide-react-native
jest.mock("lucide-react-native", () => ({
  Mail: "Mail",
  CheckCircle: "CheckCircle",
  ArrowRight: "ArrowRight",
}));

describe("CheckEmail", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      email: "test@example.com",
    });
  });

  it("should render check email screen", () => {
    const { getByText } = render(<CheckEmail />);

    expect(getByText("Check your email")).toBeTruthy();
    expect(getByText("test@example.com")).toBeTruthy();
    expect(getByText("What's next?")).toBeTruthy();
    expect(getByText("Resend confirmation email")).toBeTruthy();
  });

  it("should show resend button with countdown after resending", async () => {
    (supabase.auth.resend as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    const { getByText } = render(<CheckEmail />);
    const resendButton = getByText("Resend confirmation email");

    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: "test@example.com",
        options: {
          emailRedirectTo: "https://auth.expo.io/@test/clearskin-ai/--/auth/confirm"
        }
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith("Email sent", "Please check your inbox for the confirmation email.");
  });

  it("should handle resend error", async () => {
    const mockError = new Error("Resend failed");
    (supabase.auth.resend as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { getByText } = render(<CheckEmail />);
    const resendButton = getByText("Resend confirmation email");

    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Failed to resend", "Resend failed");
    });
  });

  it("should show error when no email provided", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      email: null,
    });

    const { getByText } = render(<CheckEmail />);
    const resendButton = getByText("Resend confirmation email");

    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "No email address found");
    });
  });

  it("should show continue to sign in link", () => {
    const { getByText } = render(<CheckEmail />);

    expect(getByText("Already confirmed your email?")).toBeTruthy();
    expect(getByText("Continue to sign in")).toBeTruthy();
  });
});
