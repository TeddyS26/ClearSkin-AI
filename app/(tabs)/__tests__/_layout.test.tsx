import TabsLayout from "../_layout";
import { useAuth } from "../../../src/ctx/AuthContext";

jest.mock("../../../src/ctx/AuthContext");
jest.mock("lucide-react-native", () => ({
  Home: "Home",
  Sun: "Sun",
  Camera: "Camera",
  Activity: "Activity",
  History: "History",
}));

describe("TabsLayout", () => {
  it("should return null while loading", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      signOut: jest.fn(),
    });

    const result = TabsLayout();
    expect(result).toBeNull();
  });

  it("should redirect when no user authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    });

    const result = TabsLayout();
    expect(result).toBeTruthy();
  });

  it("should render tabs when user is authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    const result = TabsLayout();
    expect(result).toBeTruthy();
  });

  it("should export a function", () => {
    expect(typeof TabsLayout).toBe("function");
  });
});

