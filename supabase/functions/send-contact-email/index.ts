// Supabase Edge Function: send-contact-email
// This is the index.ts file for your send-contact-email edge function
// Deploy this to: supabase/functions/send-contact-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: Please sign in to send a message');
    }
    // Parse the request body
    const { subject, message, userEmail, userName } = await req.json();
    // Validate required fields
    if (!subject || !message) {
      throw new Error('Missing required fields: subject and message are required');
    }
    if (subject.length > 100) {
      throw new Error('Subject must be 100 characters or less');
    }
    if (message.length > 1000) {
      throw new Error('Message must be 1000 characters or less');
    }
    if (message.length < 10) {
      throw new Error('Message must be at least 10 characters long');
    }
    // Get the Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Email service not configured');
    }
    // Create the email content
    const emailSubject = `ClearSkinAI Contact: ${subject}`;
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
              <div class="field-value">${userName || 'Unknown User'} (${userEmail || user.email})</div>
            </div>
            
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${subject}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="message-content">${message}</div>
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
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ClearSkinAI <noreply@clearskinai.ca>',
        to: [
          'contact@clearskinai.ca'
        ],
        subject: emailSubject,
        html: emailHtml,
        reply_to: userEmail || user.email
      })
    });
    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Email service error: ${emailResponse.status} ${emailResponse.statusText}`);
    }
    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult.id);
    // Optional: Log the contact message to your database for tracking
    try {
      const { error: logError } = await supabaseClient.from('contact_messages') // You can create this table if you want to track messages
      .insert({
        user_id: user.id,
        user_email: userEmail || user.email,
        user_name: userName,
        subject,
        message,
        status: 'sent',
        email_id: emailResult.id,
        created_at: new Date().toISOString()
      });
      if (logError) {
        console.warn('Failed to log contact message:', logError);
      // Don't throw here - email was sent successfully
      }
    } catch (logError) {
      console.warn('Failed to log contact message:', logError);
    // Don't throw here - email was sent successfully
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Contact message sent successfully',
      emailId: emailResult.id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Contact email error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to send contact message'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
