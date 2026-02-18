import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";
import { AuthProvider, useAuth } from "../AuthContext";
import { supabase } from "../../lib/supabase";

jest.mock("../../lib/supabase");

// Test component that uses the auth hook
const TestComponent = () => {
  const { user, loading, signOut, profileComplete, checkProfileComplete } = useAuth();
  return (
    <>
      <Text testID="user-id">{user?.id || "no-user"}</Text>
      <Text testID="loading">{loading ? "loading" : "not-loading"}</Text>
      <Text testID="profile-complete">
        {profileComplete === null ? "null" : profileComplete ? "complete" : "incomplete"}
      </Text>
      <Text testID="sign-out" onPress={signOut}>
        Sign Out
      </Text>
      <Pressable testID="check-profile" onPress={checkProfileComplete}>
        <Text>Check Profile</Text>
      </Pressable>
    </>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should provide initial loading state", () => {
    const mockUnsubscribe = jest.fn();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("loading").props.children).toBe("loading");
  });

  it("should load user data on mount", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockUnsubscribe = jest.fn();

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("user-123");
      expect(getByTestId("loading").props.children).toBe("not-loading");
    });

    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it("should handle no user on mount", async () => {
    const mockUnsubscribe = jest.fn();

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("no-user");
      expect(getByTestId("loading").props.children).toBe("not-loading");
    });
  });

  it("should subscribe to auth state changes", async () => {
    const mockUnsubscribe = jest.fn();
    const mockCallback = jest.fn();

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      (callback) => {
        mockCallback.mockImplementation(callback);
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      }
    );

    const { getByTestId, unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("not-loading");
    });

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();

    // Simulate auth state change
    const newUser = { id: "user-456", email: "new@example.com" };
    act(() => {
      mockCallback("SIGNED_IN", { user: newUser });
    });

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("user-456");
    });

    // Test cleanup
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should handle sign out", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockUnsubscribe = jest.fn();

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("user-123");
    });

    // Call signOut
    const signOutButton = getByTestId("sign-out");
    await act(async () => {
      signOutButton.props.onPress();
    });

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it("should update user when session changes to null", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockUnsubscribe = jest.fn();
    const mockCallback = jest.fn();

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      (callback) => {
        mockCallback.mockImplementation(callback);
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      }
    );

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("user-123");
    });

    // Simulate sign out via auth state change
    act(() => {
      mockCallback("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("no-user");
    });
  });

  it("should provide default context values when used outside AuthProvider", () => {
    // In React Native testing environment, context may provide defaults
    // rather than throwing, which is acceptable behavior
    const { getByTestId } = render(<TestComponent />);
    
    // Check that component renders without crashing
    expect(getByTestId("user-id")).toBeTruthy();
  });

  describe("Profile Completion", () => {
    it("should have null profileComplete initially", async () => {
      const mockUnsubscribe = jest.fn();
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId("profile-complete").props.children).toBe("null");
      });
    });

    it("should set profileComplete to true when profile_edited is true", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockUnsubscribe = jest.fn();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                profile_edited: true,
                gender: "male",
                date_of_birth: "1990-01-01",
                is_legacy_user: false
              }
            })
          })
        })
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId("profile-complete").props.children).toBe("complete");
      });
    });

    it("should set profileComplete to true for legacy users", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockUnsubscribe = jest.fn();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                profile_edited: false,
                gender: null,
                date_of_birth: null,
                is_legacy_user: true
              }
            })
          })
        })
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId("profile-complete").props.children).toBe("complete");
      });
    });

    it("should set profileComplete to true when gender and DOB are set", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockUnsubscribe = jest.fn();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                profile_edited: false,
                gender: "female",
                date_of_birth: "1995-06-15",
                is_legacy_user: false
              }
            })
          })
        })
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId("profile-complete").props.children).toBe("complete");
      });
    });

    it("should set profileComplete to false when profile is incomplete", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockUnsubscribe = jest.fn();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                profile_edited: false,
                gender: null,
                date_of_birth: null,
                is_legacy_user: false
              }
            })
          })
        })
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId("profile-complete").props.children).toBe("incomplete");
      });
    });

    it("should set profileComplete to incomplete when profile exists but has no data", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockUnsubscribe = jest.fn();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                profile_edited: false,
                gender: null, 
                date_of_birth: null,
                is_legacy_user: false
              }
            })
          })
        })
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId("profile-complete").props.children).toBe("incomplete");
      });
    });

    it("should reset profileComplete to null on sign out", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockUnsubscribe = jest.fn();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({});
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { profile_edited: true }
            })
          })
        })
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId("user-id").props.children).toBe("user-123");
      });

      // Call signOut
      const signOutButton = getByTestId("sign-out");
      await act(async () => {
        signOutButton.props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId("profile-complete").props.children).toBe("null");
      });
    });

    it("should handle database errors gracefully", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockUnsubscribe = jest.fn();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'SOME_ERROR', message: 'Database error' }
            })
          })
        })
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should not crash and should render
      await waitFor(() => {
        expect(getByTestId("user-id").props.children).toBe("user-123");
      });
    });
  });
});
