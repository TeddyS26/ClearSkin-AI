import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";

// --- SECURITY: Validate base URL at module load time ---
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error("[SECURITY] EXPO_PUBLIC_SUPABASE_URL is not set");
}
// Ensure URL is HTTPS in production to prevent man-in-the-middle attacks
if (!SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('localhost') && !SUPABASE_URL.includes('127.0.0.1')) {
  console.warn('[SECURITY] EXPO_PUBLIC_SUPABASE_URL should use HTTPS in production');
}
const FUNC_BASE = `${SUPABASE_URL}/functions/v1`;

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

export async function createScanSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("scan_sessions").insert({ user_id: user.id, status: "pending" }).select("id").single();
  if (error) throw error;
  return { scanId: data!.id as string, userId: user!.id as string };
}

function base64ToUint8Array(base64: string) {
  const binary = globalThis.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function uploadFile(localUri: string, path: string) {
  const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
  const bytes = base64ToUint8Array(b64);
  const { error } = await supabase.storage.from("scan").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
}

export async function uploadThreePhotos(scanId: string, userId: string, files: { front: string; left: string; right: string; }) {
  const base = `user/${userId}/${scanId}`;
  const frontPath = `${base}/front.jpg`;
  const leftPath  = `${base}/left.jpg`;
  const rightPath = `${base}/right.jpg`;
  await uploadFile(files.front, frontPath);
  await uploadFile(files.left,  leftPath);
  await uploadFile(files.right, rightPath);
  return { frontPath, leftPath, rightPath };
}

export async function callAnalyzeFunction(scanId: string, paths: { frontPath: string; leftPath: string; rightPath: string; }, context?: string) {
  const token = await getAccessToken();
  const res = await fetch(`${FUNC_BASE}/analyze-image`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      scan_session_id: scanId,
      front_path: paths.frontPath,
      left_path:  paths.leftPath,
      right_path: paths.rightPath,
      ...(context ? { context } : {})
    })
  });
  if (!res.ok) {
    // Try to parse error message from JSON response
    const errorText = await res.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error || `Analysis failed with status ${res.status}`);
    } catch {
      // If JSON parsing fails, use text response
      throw new Error(errorText || `Analysis failed with status ${res.status}`);
    }
  }
  return res.json();
}

export async function getScan(scanId: string) {
  const { data, error } = await supabase.from("scan_sessions").select("*").eq("id", scanId).single();
  if (error) throw error;
  return data;
}

// Check if a scan has valid face detection (skin_score exists)
export function isValidScan(scan: any): boolean {
  if (!scan) return false;
  return scan.skin_score !== null && scan.skin_score !== undefined;
}

// Delete an invalid scan session
export async function deleteScan(scanId: string) {
  const { error } = await supabase.from("scan_sessions").delete().eq("id", scanId);
  if (error) throw error;
}

export async function waitForScanComplete(scanId: string, timeoutMs = 90_000, intervalMs = 2000) {
  const start = Date.now();
  while (true) {
    const row = await getScan(scanId);
    if (row.status === "complete" || row.status === "failed") return row;
    if (Date.now() - start > timeoutMs) throw new Error("Timed out waiting for analysis");
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

export async function listScans({ limit = 20, cursor }: { limit?: number; cursor?: string | null } = {}) {
  // simple keyset pagination using created_at & id
  // Only return valid scans (with skin_score)
  let q = supabase
    .from("scan_sessions")
    .select("*")
    .eq("status", "complete")
    .not("skin_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    // cursor is created_at ISO string; fetch older rows
    q = q.lt("created_at", cursor);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function latestCompletedScan() {
  const { data, error } = await supabase
    .from("scan_sessions")
    .select("*")
    .eq("status", "complete")
    .not("skin_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecentCompletedScans(limit: number = 2) {
  const { data, error } = await supabase
    .from("scan_sessions")
    .select("*")
    .eq("status", "complete")
    .not("skin_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Batch sign any storage paths via your edge function
// Automatically chunks into batches of 10 (the server-side maximum)
export async function signStoragePaths(paths: string[]) {
  // --- SECURITY: Validate paths before sending to server ---
  if (!paths?.length) return {};
  // Ensure all paths are strings with sane lengths
  for (const p of paths) {
    if (typeof p !== 'string' || p.length === 0 || p.length > 500) {
      throw new Error('Invalid path format');
    }
    // Check for path traversal
    if (p.includes('..') || p.includes('//')) {
      throw new Error('Invalid path format');
    }
  }

  const BATCH_SIZE = 10;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const map: Record<string, string> = {};

  // Process paths in chunks of BATCH_SIZE
  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const chunk = paths.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sign-storage-urls`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paths: chunk }),
    });
    if (!res.ok) continue;
    const json = await res.json();
    (json?.results ?? []).forEach((r: any) => { if (r?.path && r?.url) map[r.path] = r.url; });
  }

  return map;
}

export function fmtDate(dt?: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleString();
}

export async function authorizeScan() {
  const token = await getAccessToken();
  const res = await fetch(`${FUNC_BASE}/authorize-scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Authorization failed");
  return json as { allowed: boolean; reason?: "subscription"|"credit"|"free_trial"; remaining?: number|null; isFreeTier?: boolean };
}
