import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Helper function to encode to base64 in Deno
function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
serve(async (req)=>{
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
