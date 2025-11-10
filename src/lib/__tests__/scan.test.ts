import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";
import { supabase } from "../supabase";
import {
  getAccessToken,
  createScanSession,
  uploadThreePhotos,
  callAnalyzeFunction,
  getScan,
  waitForScanComplete,
  listScans,
  latestCompletedScan,
  signStoragePaths,
  fmtDate,
} from "../scan";

// Mock the modules
jest.mock("expo-file-system/legacy");
jest.mock("../supabase");

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe("scan.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("getAccessToken", () => {
    it("should return access token when user is signed in", async () => {
      const mockToken = "mock-token-123";
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      const token = await getAccessToken();

      expect(token).toBe(mockToken);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it("should throw error when no session exists", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      await expect(getAccessToken()).rejects.toThrow("Not signed in");
    });

    it("should throw error when session has no token", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: {} },
      });

      await expect(getAccessToken()).rejects.toThrow("Not signed in");
    });
  });

  describe("createScanSession", () => {
    it("should create a new scan session successfully", async () => {
      const mockUserId = "user-123";
      const mockScanId = "scan-456";

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockScanId },
              error: null,
            }),
          }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await createScanSession();

      expect(result).toEqual({
        scanId: mockScanId,
        userId: mockUserId,
      });
      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("scan_sessions");
    });

    it("should throw error when user is not signed in", async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await expect(createScanSession()).rejects.toThrow("Not signed in");
    });

    it("should throw error when database insert fails", async () => {
      const mockError = new Error("Database error");

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123" } },
      });

      const mockFrom = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      await expect(createScanSession()).rejects.toThrow("Database error");
    });
  });

  describe("uploadThreePhotos", () => {
    it("should upload three photos successfully", async () => {
      const mockScanId = "scan-123";
      const mockUserId = "user-456";
      const mockFiles = {
        front: "file:///front.jpg",
        left: "file:///left.jpg",
        right: "file:///right.jpg",
      };

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue("base64data");

      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockStorageFrom = {
        upload: mockUpload,
      };
      (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

      const result = await uploadThreePhotos(mockScanId, mockUserId, mockFiles);

      expect(result).toEqual({
        frontPath: `user/${mockUserId}/${mockScanId}/front.jpg`,
        leftPath: `user/${mockUserId}/${mockScanId}/left.jpg`,
        rightPath: `user/${mockUserId}/${mockScanId}/right.jpg`,
      });
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledTimes(3);
      expect(mockUpload).toHaveBeenCalledTimes(3);
    });

    it("should throw error when file upload fails", async () => {
      const mockError = new Error("Upload failed");

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue("base64data");

      const mockUpload = jest.fn().mockResolvedValue({ error: mockError });
      const mockStorageFrom = {
        upload: mockUpload,
      };
      (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

      await expect(
        uploadThreePhotos("scan-123", "user-456", {
          front: "file:///front.jpg",
          left: "file:///left.jpg",
          right: "file:///right.jpg",
        })
      ).rejects.toThrow("Upload failed");
    });
  });

  describe("callAnalyzeFunction", () => {
    it("should call analyze function successfully", async () => {
      const mockToken = "token-123";
      const mockScanId = "scan-456";
      const mockPaths = {
        frontPath: "path/front.jpg",
        leftPath: "path/left.jpg",
        rightPath: "path/right.jpg",
      };
      const mockResponse = { success: true };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await callAnalyzeFunction(mockScanId, mockPaths);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/analyze-image"),
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scan_session_id: mockScanId,
            front_path: mockPaths.frontPath,
            left_path: mockPaths.leftPath,
            right_path: mockPaths.rightPath,
          }),
        })
      );
    });

    it("should throw error when API call fails", async () => {
      const mockToken = "token-123";

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue("API Error"),
      });

      await expect(
        callAnalyzeFunction("scan-123", {
          frontPath: "path/front.jpg",
          leftPath: "path/left.jpg",
          rightPath: "path/right.jpg",
        })
      ).rejects.toThrow("API Error");
    });

    it("should include context in request body when provided", async () => {
      const mockToken = "token-123";
      const mockScanId = "scan-456";
      const mockPaths = {
        frontPath: "path/front.jpg",
        leftPath: "path/left.jpg",
        rightPath: "path/right.jpg",
      };
      const mockContext = "My skin is dry on cheeks but oily on nose";
      const mockResponse = { success: true };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await callAnalyzeFunction(mockScanId, mockPaths, mockContext);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/analyze-image"),
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scan_session_id: mockScanId,
            front_path: mockPaths.frontPath,
            left_path: mockPaths.leftPath,
            right_path: mockPaths.rightPath,
            context: mockContext,
          }),
        })
      );
    });

    it("should not include context in request body when not provided", async () => {
      const mockToken = "token-123";
      const mockScanId = "scan-456";
      const mockPaths = {
        frontPath: "path/front.jpg",
        leftPath: "path/left.jpg",
        rightPath: "path/right.jpg",
      };
      const mockResponse = { success: true };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await callAnalyzeFunction(mockScanId, mockPaths);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).not.toHaveProperty("context");
      expect(requestBody).toEqual({
        scan_session_id: mockScanId,
        front_path: mockPaths.frontPath,
        left_path: mockPaths.leftPath,
        right_path: mockPaths.rightPath,
      });
    });

    it("should not include context when context is undefined", async () => {
      const mockToken = "token-123";
      const mockScanId = "scan-456";
      const mockPaths = {
        frontPath: "path/front.jpg",
        leftPath: "path/left.jpg",
        rightPath: "path/right.jpg",
      };
      const mockResponse = { success: true };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await callAnalyzeFunction(mockScanId, mockPaths, undefined);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).not.toHaveProperty("context");
    });
  });

  describe("getScan", () => {
    it("should fetch scan data successfully", async () => {
      const mockScanId = "scan-123";
      const mockData = { id: mockScanId, status: "complete" };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getScan(mockScanId);

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith("scan_sessions");
    });

    it("should throw error when database query fails", async () => {
      const mockError = new Error("Query failed");

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(getScan("scan-123")).rejects.toThrow("Query failed");
    });
  });

  describe("waitForScanComplete", () => {
    it("should return when scan is complete", async () => {
      const mockScanId = "scan-123";
      const mockCompleteData = { id: mockScanId, status: "complete" };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCompleteData,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await waitForScanComplete(mockScanId);

      expect(result).toEqual(mockCompleteData);
    });

    it("should return when scan fails", async () => {
      const mockScanId = "scan-123";
      const mockFailedData = { id: mockScanId, status: "failed" };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockFailedData,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await waitForScanComplete(mockScanId);

      expect(result).toEqual(mockFailedData);
    });

    it("should poll until scan is complete", async () => {
      const mockScanId = "scan-123";
      const mockPendingData = { id: mockScanId, status: "pending" };
      const mockCompleteData = { id: mockScanId, status: "complete" };

      let callCount = 0;
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            callCount++;
            // Return pending twice, then complete
            if (callCount <= 2) {
              return Promise.resolve({ data: mockPendingData, error: null });
            }
            return Promise.resolve({ data: mockCompleteData, error: null });
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await waitForScanComplete(mockScanId, 10000, 100);

      expect(result).toEqual(mockCompleteData);
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe("listScans", () => {
    it("should fetch scans without cursor", async () => {
      const mockScans = [
        { id: "scan-1", created_at: "2025-01-01" },
        { id: "scan-2", created_at: "2025-01-02" },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockScans,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await listScans();

      expect(result).toEqual(mockScans);
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
    });

    it("should fetch scans with cursor", async () => {
      const mockScans = [{ id: "scan-3", created_at: "2025-01-03" }];
      const cursor = "2025-01-05";

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({
          data: mockScans,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await listScans({ cursor });

      expect(result).toEqual(mockScans);
      expect(mockQuery.lt).toHaveBeenCalledWith("created_at", cursor);
    });

    it("should throw error when query fails", async () => {
      const mockError = new Error("Query failed");

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(listScans()).rejects.toThrow("Query failed");
    });
  });

  describe("latestCompletedScan", () => {
    it("should fetch latest completed scan", async () => {
      const mockScan = { id: "scan-123", status: "complete" };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockScan,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await latestCompletedScan();

      expect(result).toEqual(mockScan);
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "complete");
    });

    it("should return null when no completed scans exist", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await latestCompletedScan();

      expect(result).toBeNull();
    });

    it("should throw error when query fails", async () => {
      const mockError = new Error("Query failed");

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(latestCompletedScan()).rejects.toThrow("Query failed");
    });
  });

  describe("signStoragePaths", () => {
    it("should sign storage paths successfully", async () => {
      const mockPaths = ["path1.jpg", "path2.jpg"];
      const mockToken = "token-123";
      const mockResponse = {
        results: [
          { path: "path1.jpg", url: "https://signed-url-1.com" },
          { path: "path2.jpg", url: "https://signed-url-2.com" },
        ],
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await signStoragePaths(mockPaths);

      expect(result).toEqual({
        "path1.jpg": "https://signed-url-1.com",
        "path2.jpg": "https://signed-url-2.com",
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/sign-storage-urls"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ paths: mockPaths }),
        })
      );
    });

    it("should return empty object when no paths provided", async () => {
      const result = await signStoragePaths([]);
      expect(result).toEqual({});
    });

    it("should return empty object when paths is null/undefined", async () => {
      const result = await signStoragePaths(null as any);
      expect(result).toEqual({});
    });

    it("should return empty object when API call fails", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: "token" } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const result = await signStoragePaths(["path1.jpg"]);
      expect(result).toEqual({});
    });
  });

  describe("fmtDate", () => {
    it("should format date string correctly", () => {
      const dateStr = "2025-01-15T10:30:00.000Z";
      const result = fmtDate(dateStr);

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      // Basic check - actual format depends on locale
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty string for undefined", () => {
      const result = fmtDate(undefined);
      expect(result).toBe("");
    });

    it("should return empty string for empty string", () => {
      const result = fmtDate("");
      expect(result).toBe("");
    });
  });
});

