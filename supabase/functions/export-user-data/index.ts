/**
 * =============================================================================
 * CLEARSKIN AI - EXPORT USER DATA ENDPOINT
 * =============================================================================
 * 
 * GDPR-compliant user data export functionality.
 * Exports all user data (profile, scans, subscriptions) as JSON via email.
 * 
 * Security measures:
 * - Rate limiting (1 export per hour per user)
 * - JWT token validation
 * - CORS protection
 * - Users can only export their own data
 * 
 * @version 2.0.0
 * =============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared security utilities
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getCorsHeaders,
  handleCorsPreflightRequest,
  getClientIP,
  logSecurityEvent,
  successResponse,
  errorResponse
} from "../_shared/security.ts";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!RESEND_API_KEY) {
  throw new Error("Missing required environment variable: RESEND_API_KEY");
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Helper function to encode string to base64 in Deno
 */
function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Only allow POST method
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED", corsHeaders);
  }

  console.log('🚀 Export function called');

  try {
    // --- SECURITY: Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logSecurityEvent('invalid_token', { reason: 'Missing or malformed Authorization header' });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }

    console.log('🔐 Auth header present');

    // Create Supabase client with user's auth context
    const supabase = createClient(
      SUPABASE_URL ?? "",
      SUPABASE_ANON_KEY ?? "",
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logSecurityEvent('invalid_token', { reason: 'Invalid JWT token', error: userError?.message });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }

    console.log('👤 User authenticated:', user.email);

    // --- SECURITY: Rate Limiting (IP + User) ---
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.export, clientIP);
    
    if (rateLimit.limited) {
      logSecurityEvent('rate_limit_exceeded', { 
        userId: user.id, 
        ip: clientIP,
        endpoint: 'export-user-data'
      });
      return rateLimitResponse(rateLimit.resetIn, corsHeaders);
    }

    // --- BUSINESS LOGIC: Fetch User Data ---
    console.log('📝 Fetching user data...');

    // Fetch scan sessions (user can only see their own due to RLS)
    const { data: scans, error: scansError } = await supabase
      .from("scan_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (scansError) {
      console.error("Error fetching scans:", scansError);
      return errorResponse("Failed to fetch scan data", 500, "DB_ERROR", corsHeaders);
    }

    // Fetch subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      return errorResponse("Failed to fetch subscription data", 500, "DB_ERROR", corsHeaders);
    }

    // Fetch user profile (if exists)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Compile export data
    const exportData = {
      export_info: {
        export_date: new Date().toISOString(),
        export_reason: "User requested data export",
        data_format: "JSON",
        version: "2.0"
      },
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at
      },
      profile: profile || null,
      scan_sessions: scans || [],
      subscriptions: subscriptions || [],
      statistics: {
        total_scans: scans?.length || 0,
        total_subscriptions: subscriptions?.length || 0
      }
    };

    // --- SEND EMAIL WITH DATA ---
    console.log('📧 Sending email to:', user.email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "ClearSkinAI <noreply@clearskinai.ca>",
        to: [user.email],
        subject: "Your ClearSkinAI Data Export",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Your Data Export</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
                .stats { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0;">Your Data Export is Ready</h1>
              </div>
              <div class="content">
                <p>As requested, here is your complete data export from ClearSkinAI.</p>
                
                <div class="stats">
                  <h3 style="margin-top: 0;">Export Summary</h3>
                  <ul>
                    <li><strong>Export Date:</strong> ${new Date().toLocaleString()}</li>
                    <li><strong>Total Scans:</strong> ${scans?.length || 0}</li>
                    <li><strong>Subscriptions:</strong> ${subscriptions?.length || 0}</li>
                  </ul>
                </div>
                
                <p>Your complete data is attached as a JSON file. This includes:</p>
                <ul>
                  <li>Account information</li>
                  <li>Profile data</li>
                  <li>All scan sessions and results</li>
                  <li>Subscription history</li>
                </ul>
                
                <p style="color: #dc2626; font-weight: bold;">
                  ⚠️ Security Notice: If you didn't request this export, please contact us immediately at support@clearskinai.ca
                </p>
              </div>
              <div class="footer">
                <p>ClearSkinAI - Your AI Skincare Companion</p>
                <p style="font-size: 12px;">This is an automated email. Please do not reply.</p>
              </div>
            </body>
          </html>
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
      console.error("Resend API error:", errorText);
      return errorResponse(
        "Failed to send export email. Please try again later.",
        502,
        "EMAIL_SERVICE_ERROR",
        corsHeaders
      );
    }

    console.log('✅ Email sent successfully!');

    return successResponse({
      success: true,
      message: "Your data export has been sent to your email address."
    }, 200, corsHeaders);

  } catch (error) {
    console.error('❌ Export error:', error);
    return errorResponse(
      "An error occurred while exporting your data",
      500,
      "INTERNAL_ERROR",
      corsHeaders
    );
  }
});
