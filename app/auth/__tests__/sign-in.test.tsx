import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import SignIn from "../sign-in";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/ctx/AuthContext";

jest.mock("../../../src/lib/supabase");
jest.mock("../../../src/ctx/AuthContext");
jest.mock("expo-router", () => ({
  Link: "Link",
  Redirect: ({ href }: { href: string }) => `Redirect:${href}`,
}));

// Mock lucide-react-native
jest.mock("lucide-react-native", () => ({
  Mail: "Mail",
  Lock: "Lock",
}));

describe("SignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it("should render sign in form", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    expect(getByText("Welcome Back")).toBeTruthy();
    expect(getByText("Sign in to continue your skin journey")).toBeTruthy();
    expect(getByPlaceholderText("your@email.com")).toBeTruthy();
    expect(getByPlaceholderText("Enter your password")).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("should redirect if user is already logged in", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    const { toJSON } = render(<SignIn />);
    const tree = toJSON();

    expect(tree).toContain("Redirect:/(tabs)/home");
  });

  it("should not redirect while loading", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      signOut: jest.fn(),
    });

    const { queryByText } = render(<SignIn />);

    expect(queryByText("Welcome Back")).toBeTruthy();
  });

  it("should update email input", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const { getByPlaceholderText } = render(<SignIn />);
    const emailInput = getByPlaceholderText("your@email.com");

    fireEvent.changeText(emailInput, "test@example.com");

    expect(emailInput.props.value).toBe("test@example.com");
  });

  it("should update password input", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const { getByPlaceholderText } = render(<SignIn />);
    const passwordInput = getByPlaceholderText("Enter your password");

    fireEvent.changeText(passwordInput, "password123");

    expect(passwordInput.props.value).toBe("password123");
  });

  it("should sign in successfully", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123" }, session: {} },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Enter your password");
    const signInButton = getByText("Sign In");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("should trim email before signing in", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123" }, session: {} },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Enter your password");
    const signInButton = getByText("Sign In");

    fireEvent.changeText(emailInput, "  test@example.com  ");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("should show error alert on sign in failure", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const mockError = new Error("Invalid credentials");
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { getByPlaceholderText, getByText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Enter your password");
    const signInButton = getByText("Sign In");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "wrongpassword");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign in failed",
        "Invalid credentials"
      );
    });
  });

  it("should disable button while signing in", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { getByPlaceholderText, getByText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Enter your password");
    const signInButton = getByText("Sign In");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(signInButton);

    // Check button shows loading state
    await waitFor(() => {
      expect(getByText("Signing in...")).toBeTruthy();
    });
  });

  it("should show sign up link", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const { getByText } = render(<SignIn />);

    expect(getByText(/Don't have an account/)).toBeTruthy();
    // Link component is mocked, so we can verify it exists by checking the parent text
  });

  it("should have secure text entry for password field", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const { getByPlaceholderText } = render(<SignIn />);
    const passwordInput = getByPlaceholderText("Enter your password");

    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it("should have email keyboard type for email field", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const { getByPlaceholderText } = render(<SignIn />);
    const emailInput = getByPlaceholderText("your@email.com");

    expect(emailInput.props.keyboardType).toBe("email-address");
  });

  it("should have autoCapitalize none for email field", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const { getByPlaceholderText } = render(<SignIn />);
    const emailInput = getByPlaceholderText("your@email.com");

    expect(emailInput.props.autoCapitalize).toBe("none");
  });

  it("should handle network errors gracefully", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    const { getByPlaceholderText, getByText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Enter your password");
    const signInButton = getByText("Sign In");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign in failed",
        "Network error"
      );
    });
  });
});

