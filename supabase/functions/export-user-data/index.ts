import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- SECURITY: Rate limiting (1 export per hour per user) ---
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 1;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { limited: boolean; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(userId);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  record.count++;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`[SECURITY] Data export rate limit exceeded for user: ${userId}`);
    return { limited: true, resetIn: record.resetAt - now };
  }
  return { limited: false, resetIn: record.resetAt - now };
}

// Clean up old entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) rateLimitStore.delete(key);
  }
}, 60 * 1000);

// --- SECURITY: Allowed origins ---
const ALLOWED_ORIGINS = ["https://www.clearskinai.ca", "https://clearskinai.ca"];

function getCorsHeaders(origin?: string | null) {
  const isDev = Deno.env.get("ENVIRONMENT") === "development";
  const isLocalhost = origin?.includes("localhost") || origin?.includes("127.0.0.1");
  const isAllowed = ALLOWED_ORIGINS.includes(origin || "");
  const allowedOrigin = (isAllowed || (isDev && isLocalhost)) ? origin || ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
  };
}
// Helper function to encode to base64 in Deno
function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
serve(async (req)=>{
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  
  console.log('🚀 Export function called');
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    console.log('📝 Processing export request...');
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    console.log('🔐 Auth header present:', !!authHeader);
    if (!authHeader) throw new Error("No authorization header");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");
    
    // --- SECURITY: Rate limiting ---
    const rateLimit = checkRateLimit(user.id);
    if (rateLimit.limited) {
      console.warn(`[SECURITY] Export rate limit hit for user: ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: 'You can only export your data once per hour. Please try again later.',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }
    
    // Fetch all user data
    const { data: scans, error: scansError } = await supabase.from("scan_sessions").select("*").eq("user_id", user.id);
    if (scansError) throw scansError;
    const { data: subscriptions, error: subsError } = await supabase.from("subscriptions").select("*").eq("user_id", user.id);
    if (subsError) throw subsError;
    // Compile export data
    const exportData = {
      export_date: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      scan_sessions: scans || [],
      subscriptions: subscriptions || [],
      total_scans: scans?.length || 0
    };
    // Send email using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: "ClearSkinAI <noreply@clearskinai.ca>",
        to: [
          user.email
        ],
        subject: "Your ClearSkinAI Data Export",
        html: `
          <h2>Your Data Export is Ready</h2>
          <p>As requested, here is your complete data export from ClearSkinAI.</p>
          <p><strong>Export Details:</strong></p>
          <ul>
            <li>Export Date: ${new Date().toLocaleString()}</li>
            <li>Total Scans: ${scans?.length || 0}</li>
            <li>Subscriptions: ${subscriptions?.length || 0}</li>
          </ul>
          <p>Your data is attached as a JSON file.</p>
          <p>If you didn't request this export, please contact us immediately.</p>
          <p>Best regards,<br>ClearSkinAI Team</p>
        `,
        attachments: [
          {
            filename: `clearskin-export-${Date.now()}.json`,
            content: base64Encode(JSON.stringify(exportData, null, 2))
          }
        ]
      })
    });
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email service error: ${errorText}`);
    }
    // After getting user
    console.log('👤 User authenticated:', user.email);
    // Before sending email
    console.log('📧 Sending email to:', user.email);
    console.log('🔑 Resend API key present:', !!resendApiKey);
    // After email sent
    console.log('✅ Email sent successfully!');
    return new Response(JSON.stringify({
      success: true,
      message: "Export sent to your email"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }
});
