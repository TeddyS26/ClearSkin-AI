// @ts-ignore errors about "npm:" imports in Supabase editor
import { createClient } from "npm:@supabase/supabase-js@2";
const sb = createClient(Deno.env.get("PROJECT_URL"), Deno.env.get("SERVICE_ROLE_KEY"));
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
function normalize(path) {
  // strip any leading slash so storage path matches 'user/<uid>/...'
  return path.startsWith("/") ? path.slice(1) : path;
}
Deno.serve(async (req)=>{
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", {
      status: 405
    });
    // Auth
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", {
      status: 401
    });
    const token = auth.split(" ")[1];
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return new Response("Unauthorized", {
      status: 401
    });
    // Body
    const body = await req.json().catch(()=>({}));
    const paths = Array.isArray(body.paths) ? body.paths : null;
    if (!paths || paths.length === 0) return json({
      results: []
    });
    // Only sign files in the caller's own folder: user/<uid>/...
    const results = await Promise.all(paths.map(async (raw)=>{
      const p = normalize(raw);
      const allowed = p.startsWith(`user/${user.id}/`);
      if (!allowed) return {
        path: raw,
        url: null
      };
      const { data, error } = await sb.storage.from("scan").createSignedUrl(p, 60 * 5);
      if (error || !data?.signedUrl) return {
        path: raw,
        url: null
      };
      return {
        path: raw,
        url: data.signedUrl
      };
    }));
    return json({
      results
    });
  } catch (e) {
    return json({
      error: String(e)
    }, 500);
  }
});
