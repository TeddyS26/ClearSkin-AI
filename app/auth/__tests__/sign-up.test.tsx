import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import SignUp from "../sign-up";
import { supabase } from "../../../src/lib/supabase";
import { useRouter } from "expo-router";

jest.mock("../../../src/lib/supabase");
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  Link: "Link",
}));

// Mock lucide-react-native
jest.mock("lucide-react-native", () => ({
  Mail: "Mail",
  Lock: "Lock",
  CheckCircle: "CheckCircle",
}));

describe("SignUp", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it("should render sign up form", () => {
    const { getAllByText, getByPlaceholderText } = render(<SignUp />);

    expect(getAllByText("Create Account").length).toBeGreaterThan(0);
    expect(getAllByText("Start your journey to healthier skin")).toBeTruthy();
    expect(getByPlaceholderText("your@email.com")).toBeTruthy();
    expect(getByPlaceholderText("At least 8 characters")).toBeTruthy();
    expect(getByPlaceholderText("Re-enter password")).toBeTruthy();
  });

  it("should update email input", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    const emailInput = getByPlaceholderText("your@email.com");

    fireEvent.changeText(emailInput, "test@example.com");

    expect(emailInput.props.value).toBe("test@example.com");
  });

  it("should update password input", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    const passwordInput = getByPlaceholderText("At least 8 characters");

    fireEvent.changeText(passwordInput, "password123");

    expect(passwordInput.props.value).toBe("password123");
  });

  it("should update confirm password input", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");

    fireEvent.changeText(confirmPasswordInput, "password123");

    expect(confirmPasswordInput.props.value).toBe("password123");
  });

  it("should show alert when passwords do not match", async () => {
    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1]; // Button text

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password456");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Passwords do not match");
    });
  });

  it("should show alert when password is too short", async () => {
    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "pass123");
    fireEvent.changeText(confirmPasswordInput, "pass123");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Password must be at least 8 characters"
      );
    });
  });

  it("should sign up successfully", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "Account created",
        "Please sign in now."
      );
      expect(mockReplace).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  it("should trim email before signing up", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "  test@example.com  ");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("should show error alert on sign up failure", async () => {
    const mockError = new Error("Email already exists");
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign up failed",
        "Email already exists"
      );
    });
  });

  it("should disable button while signing up", async () => {
    (supabase.auth.signUp as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { getByPlaceholderText, getAllByText, getByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(signUpButton);

    // Check button shows loading state
    await waitFor(() => {
      expect(getByText("Creating...")).toBeTruthy();
    });
  });

  it("should show sign in link", () => {
    const { getByText } = render(<SignUp />);

    expect(getByText(/Already have an account/)).toBeTruthy();
    // Link component is mocked, so we can verify it exists by checking the parent text
  });

  it("should have secure text entry for password fields", () => {
    const { getByPlaceholderText } = render(<SignUp />);

    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
  });

  it("should have email keyboard type for email field", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    const emailInput = getByPlaceholderText("your@email.com");

    expect(emailInput.props.keyboardType).toBe("email-address");
  });

  it("should have autoCapitalize none for email field", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    const emailInput = getByPlaceholderText("your@email.com");

    expect(emailInput.props.autoCapitalize).toBe("none");
  });

  it("should handle network errors gracefully", async () => {
    (supabase.auth.signUp as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Sign up failed", "Network error");
    });
  });

  it("should accept exactly 8 character password", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "pass1234");
    fireEvent.changeText(confirmPasswordInput, "pass1234");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Account created",
        "Please sign in now."
      );
    });
  });

  it("should reject 7 character password", async () => {
    const { getByPlaceholderText, getAllByText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("At least 8 characters");
    const confirmPasswordInput = getByPlaceholderText("Re-enter password");
    const signUpButton = getAllByText("Create Account")[1];

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "pass123");
    fireEvent.changeText(confirmPasswordInput, "pass123");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Password must be at least 8 characters"
      );
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });
  });
});

