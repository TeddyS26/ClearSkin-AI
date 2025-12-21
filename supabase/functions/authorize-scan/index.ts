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
Deno.serve(async (req)=>{
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", {
      status: 401
    });
    const token = auth.split(" ")[1];
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return new Response("Unauthorized", {
      status: 401
    });
    // 1) Active subscription with remaining weekly scans?
    const { data: sub } = await sb.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle();
    const { data: tw } = await sb.from("scans_this_week").select("scans_count").eq("user_id", user.id).maybeSingle();
    const used = tw?.scans_count ?? 0;
    if (sub && used < (sub.weekly_limit ?? 0)) {
      return json({
        allowed: true,
        reason: "subscription",
        remaining: sub.weekly_limit - used
      });
    }
    // 2) Otherwise, try to use one credit
    const { data: creditsRow } = await sb.from("scan_credits").select("credits").eq("user_id", user.id).maybeSingle();
    const credits = creditsRow?.credits ?? 0;
    if (credits > 0) {
      await sb.from("scan_credits").upsert({
        user_id: user.id,
        credits: credits - 1,
        updated_at: new Date().toISOString()
      });
      return json({
        allowed: true,
        reason: "credit",
        remaining: credits - 1
      });
    }
    // 3) Block → paywall
    return json({
      allowed: false
    });
  } catch (e) {
    return json({
      error: String(e)
    }, 500);
  }
});
