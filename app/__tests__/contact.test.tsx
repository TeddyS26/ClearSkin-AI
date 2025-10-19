import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";
import Contact from "../contact";
import { useAuth } from "../../src/ctx/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { openContactEmail } from "../../src/lib/contact";

jest.mock("../../src/ctx/AuthContext");
jest.mock("expo-router");
jest.mock("../../src/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    auth: {
      getSession: jest.fn(),
    },
  },
}));
jest.mock("../../src/lib/contact");
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

// Mock lucide-react-native
jest.mock("lucide-react-native", () => ({
  ArrowLeft: "ArrowLeft",
  Mail: "Mail",
  Send: "Send",
  MessageSquare: "MessageSquare",
  User: "User",
  Smartphone: "Smartphone",
}));

describe("Contact", () => {
  const mockBack = jest.fn();
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    user_metadata: {
      full_name: "Test User"
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false
    });
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack
    });
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: {},
      error: null
    });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: "mock-token"
        }
      }
    });
    (openContactEmail as jest.Mock).mockResolvedValue(undefined);
  });

  it("should render contact form", () => {
    const { getByText, getByPlaceholderText } = render(<Contact />);

    expect(getByText("Contact & Support")).toBeTruthy();
    expect(getByText("We're here to help! Send us a message and we'll get back to you soon.")).toBeTruthy();
    expect(getByPlaceholderText("What's this about?")).toBeTruthy();
    expect(getByPlaceholderText("Tell us how we can help you...")).toBeTruthy();
    expect(getByText("Send Message")).toBeTruthy();
  });

  it("should update subject input", () => {
    const { getByPlaceholderText } = render(<Contact />);
    const subjectInput = getByPlaceholderText("What's this about?");

    fireEvent.changeText(subjectInput, "Test Subject");

    expect(subjectInput.props.value).toBe("Test Subject");
  });

  it("should update message input", () => {
    const { getByPlaceholderText } = render(<Contact />);
    const messageInput = getByPlaceholderText("Tell us how we can help you...");

    fireEvent.changeText(messageInput, "Test message content");

    expect(messageInput.props.value).toBe("Test message content");
  });

  it("should show character count for subject", () => {
    const { getByPlaceholderText, getByText } = render(<Contact />);
    const subjectInput = getByPlaceholderText("What's this about?");

    fireEvent.changeText(subjectInput, "Test");
    
    expect(getByText("4/100 characters")).toBeTruthy();
  });

  it("should show character count for message", () => {
    const { getByPlaceholderText, getByText } = render(<Contact />);
    const messageInput = getByPlaceholderText("Tell us how we can help you...");

    fireEvent.changeText(messageInput, "Test message");
    
    expect(getByText("12/1000 characters")).toBeTruthy();
  });

  it("should send message successfully", async () => {
    const { getByPlaceholderText, getByText } = render(<Contact />);
    const subjectInput = getByPlaceholderText("What's this about?");
    const messageInput = getByPlaceholderText("Tell us how we can help you...");
    const sendButton = getByText("Send Message");

    fireEvent.changeText(subjectInput, "Test subject");
    fireEvent.changeText(messageInput, "This is a detailed test message");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-contact-email', {
        body: {
          subject: "Test subject",
          message: "This is a detailed test message",
          userEmail: "test@example.com",
          userName: "Test User"
        },
        headers: {
          Authorization: "Bearer mock-token",
        },
      });
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Message Sent! 📧",
        "Thank you for contacting us! We'll get back to you as soon as possible.",
        expect.any(Array)
      );
    });
  });

  it("should handle send message error with fallback to email", async () => {
    const mockError = new Error("Network error");
    (supabase.functions.invoke as jest.Mock).mockRejectedValue(mockError);

    const { getByPlaceholderText, getByText } = render(<Contact />);
    const subjectInput = getByPlaceholderText("What's this about?");
    const messageInput = getByPlaceholderText("Tell us how we can help you...");
    const sendButton = getByText("Send Message");

    fireEvent.changeText(subjectInput, "Test subject");
    fireEvent.changeText(messageInput, "This is a detailed test message");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Failed to Send",
        "Network error",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Email",
            onPress: expect.any(Function)
          }
        ]
      );
    });
  });

  it("should open email client when open email button is pressed", () => {
    const { getByPlaceholderText, getByText } = render(<Contact />);
    const subjectInput = getByPlaceholderText("What's this about?");
    const messageInput = getByPlaceholderText("Tell us how we can help you...");
    const emailButton = getByText("Open Email App Instead");

    fireEvent.changeText(subjectInput, "Test subject");
    fireEvent.changeText(messageInput, "Test message");
    fireEvent.press(emailButton);

    expect(openContactEmail).toHaveBeenCalledWith("Test subject", "Test message");
  });

  it("should handle back button press", () => {
    const { getByText } = render(<Contact />);
    const backButton = getByText("Back");

    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it("should handle user without metadata", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      loading: false
    });

    const { getByPlaceholderText, getByText } = render(<Contact />);
    const subjectInput = getByPlaceholderText("What's this about?");
    const messageInput = getByPlaceholderText("Tell us how we can help you...");
    const sendButton = getByText("Send Message");

    fireEvent.changeText(subjectInput, "Test subject");
    fireEvent.changeText(messageInput, "This is a detailed test message");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-contact-email', {
        body: {
          subject: "Test subject",
          message: "This is a detailed test message",
          userEmail: "test@example.com",
          userName: "Unknown User"
        },
        headers: {
          Authorization: "Bearer mock-token",
        },
      });
    });
  });

  it("should handle user without email", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123" },
      loading: false
    });

    const { getByPlaceholderText, getByText } = render(<Contact />);
    const subjectInput = getByPlaceholderText("What's this about?");
    const messageInput = getByPlaceholderText("Tell us how we can help you...");
    const sendButton = getByText("Send Message");

    fireEvent.changeText(subjectInput, "Test subject");
    fireEvent.changeText(messageInput, "This is a detailed test message");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-contact-email', {
        body: {
          subject: "Test subject",
          message: "This is a detailed test message",
          userEmail: "Unknown",
          userName: "Unknown User"
        },
        headers: {
          Authorization: "Bearer mock-token",
        },
      });
    });
  });
});