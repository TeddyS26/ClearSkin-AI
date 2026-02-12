/**
 * =============================================================================
 * CLEARSKIN AI - SEND CONTACT EMAIL ENDPOINT
 * =============================================================================
 * 
 * Handles contact form submissions from the mobile app.
 * Sends emails via Resend API with HTML formatting.
 * 
 * Security measures:
 * - Rate limiting (3 emails per hour per user)
 * - JWT token validation
 * - CORS protection
 * - Input validation & sanitization (XSS prevention)
 * - HTML entity encoding for email content
 * 
 * @version 2.0.0
 * =============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import shared security utilities
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getCorsHeaders,
  handleCorsPreflightRequest,
  getClientIP,
  logSecurityEvent,
  validateRequestBody,
  sanitizeForHtml,
  isValidEmail,
  validateContentLength,
  successResponse,
  errorResponse
} from "../_shared/security.ts";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

if (!RESEND_API_KEY) {
  throw new Error("Missing required environment variable: RESEND_API_KEY");
}

// Contact email recipient
const CONTACT_EMAIL = 'contact@clearskinai.ca';

// =============================================================================
// REQUEST BODY SCHEMA
// =============================================================================

const requestSchema = {
  subject: {
    type: 'string' as const,
    required: true,
    minLength: 1,
    maxLength: 100,
    sanitize: true
  },
  message: {
    type: 'string' as const,
    required: true,
    minLength: 10,
    maxLength: 1000,
    sanitize: true
  },
  userEmail: {
    type: 'string' as const,
    required: false,
    maxLength: 254
  },
  userName: {
    type: 'string' as const,
    required: false,
    maxLength: 100,
    sanitize: true
  }
};

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Only allow POST method
  if (req.method !== 'POST') {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED", corsHeaders);
  }

  // --- SECURITY: Reject oversized payloads (max 50KB for contact form) ---
  const sizeCheck = validateContentLength(req, 50 * 1024, corsHeaders);
  if (sizeCheck) return sizeCheck;

  try {
    // --- SECURITY: Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logSecurityEvent('invalid_token', { reason: 'Missing or malformed Authorization header' });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }

    // Create Supabase client with user's auth context
    const supabaseClient = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logSecurityEvent('invalid_token', { reason: 'Invalid JWT token', error: authError?.message });
      return errorResponse("Unauthorized: Please sign in to send a message", 401, "UNAUTHORIZED", corsHeaders);
    }

    // --- SECURITY: Rate Limiting (IP + User) ---
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.contact, clientIP);
    
    if (rateLimit.limited) {
      logSecurityEvent('rate_limit_exceeded', { 
        userId: user.id, 
        ip: clientIP,
        endpoint: 'send-contact-email'
      });
      return rateLimitResponse(rateLimit.resetIn, corsHeaders);
    }

    // --- SECURITY: Parse and Validate Request Body ---
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, "INVALID_JSON", corsHeaders);
    }

    const validation = validateRequestBody(body, requestSchema);
    if (!validation.valid) {
      logSecurityEvent('validation_failed', { 
        userId: user.id, 
        errors: validation.errors,
        endpoint: 'send-contact-email'
      });
      return errorResponse(
        `Validation failed: ${validation.errors.join(', ')}`,
        400,
        "VALIDATION_ERROR",
        corsHeaders
      );
    }

    const { subject, message, userEmail, userName } = validation.sanitized as {
      subject: string;
      message: string;
      userEmail?: string;
      userName?: string;
    };

    // Validate email format if provided
    const replyToEmail = userEmail || user.email || '';
    if (replyToEmail && !isValidEmail(replyToEmail)) {
      return errorResponse("Invalid email format", 400, "INVALID_EMAIL", corsHeaders);
    }

    // --- SECURITY: Sanitize all inputs for HTML email (XSS prevention) ---
    const safeSubject = sanitizeForHtml(subject);
    const safeMessage = sanitizeForHtml(message);
    const safeName = sanitizeForHtml(userName || 'Unknown User');
    const safeEmail = sanitizeForHtml(replyToEmail || 'Unknown');

    // --- BUSINESS LOGIC: Send Email via Resend ---
    const emailSubject = `ClearSkinAI Contact: ${safeSubject}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .field-value { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; }
            .message-content { white-space: pre-wrap; font-family: 'Courier New', monospace; background: #f3f4f6; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .app-badge { display: inline-block; background: #10B981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="app-badge">CLEARSKIN AI</div>
            <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>
          
          <div class="content">
            <div class="field">
              <div class="field-label">From:</div>
              <div class="field-value">${safeName} (${safeEmail})</div>
            </div>
            
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${safeSubject}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="message-content">${safeMessage}</div>
            </div>
            
            <div class="field">
              <div class="field-label">User ID:</div>
              <div class="field-value">${user.id}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Timestamp:</div>
              <div class="field-value">${new Date().toLocaleString('en-US', {
                timeZone: 'UTC',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })} UTC</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This message was sent from the ClearSkinAI mobile app.</p>
            <p>Please reply directly to this email to respond to the user.</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ClearSkinAI <noreply@clearskinai.ca>',
        to: [CONTACT_EMAIL],
        subject: emailSubject,
        html: emailHtml,
        reply_to: replyToEmail || undefined
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      return errorResponse(
        "Failed to send message. Please try again later.",
        502,
        "EMAIL_SERVICE_ERROR",
        corsHeaders
      );
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult.id);

    // Optional: Log the contact message to database for tracking
    try {
      const { error: logError } = await supabaseClient
        .from('contact_messages')
        .insert({
          user_id: user.id,
          user_email: replyToEmail,
          user_name: userName,
          subject,
          message,
          status: 'sent',
          email_id: emailResult.id,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.warn('Failed to log contact message:', logError);
        // Don't fail the request - email was sent successfully
      }
    } catch (logError) {
      console.warn('Failed to log contact message:', logError);
    }

    return successResponse({
      success: true,
      message: 'Contact message sent successfully',
      emailId: emailResult.id
    }, 200, corsHeaders);

  } catch (error) {
    console.error('send-contact-email error:', error);
    return errorResponse(
      "An error occurred while sending your message",
      500,
      "INTERNAL_ERROR",
      corsHeaders
    );
  }
});
