# 🔐 ClearSkin AI - Security Configuration Guide

## Overview

This document outlines the security measures implemented in the ClearSkin AI application and the steps required to ensure complete security in production.

---

## ✅ Security Measures Implemented

### 1. API Key Management
- ✅ All secrets use environment variables (`Deno.env.get()`, `process.env.EXPO_PUBLIC_*`)
- ✅ No hardcoded API keys in source code
- ✅ Frontend only has access to public keys (ANON_KEY)
- ✅ Service role keys only used in Edge Functions (server-side)

### 2. Authentication & Sessions
- ✅ JWT tokens expire in 3600 seconds (1 hour)
- ✅ Refresh token rotation enabled
- ✅ `autoRefreshToken: true` in Supabase client
- ✅ Refresh token reuse interval: 10 seconds

### 3. Row Level Security (RLS)
- ✅ `user_profiles` - RLS enabled with SELECT/INSERT/UPDATE policies
- ✅ `scan_sessions` - RLS enabled with full CRUD policies
- ✅ `subscriptions` - RLS enabled with SELECT-only policy
- ✅ `billing_customers` - RLS enabled with SELECT-only policy
- ✅ `scan_credits` - RLS enabled with SELECT-only policy

### 4. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `analyze-image` | 5 requests | 1 minute |
| `send-contact-email` | 3 requests | 1 hour |
| `export-user-data` | 1 request | 1 hour |
| Auth (sign-in/sign-up) | 30 requests | 5 minutes |
| Email sent | 2 emails | 1 hour |

### 5. Input Validation
- ✅ Context validation via AI (skincare relevance check)
- ✅ UUID validation for scan_session_id
- ✅ Path validation (must start with `user/{user_id}/`)
- ✅ Length limits on contact form (subject: 100, message: 1000)
- ✅ Minimum password length: 8 characters

### 6. CORS Configuration
- ✅ Allowed origins restricted to `clearskinai.ca` in production
- ✅ Development mode allows localhost
- ✅ Preflight caching (24 hours)

### 7. SQL Injection Prevention
- ✅ All queries use Supabase's parameterized query builder
- ✅ No raw SQL with user input concatenation

### 8. XSS Prevention
- ✅ HTML sanitization in email templates
- ✅ React Native handles output encoding by default

### 9. Storage Security
- ✅ Path validation in `sign-storage-urls` (only user's own folder)
- ✅ Signed URLs expire in 5-10 minutes
- ✅ Private bucket requires authentication

---

## 🚨 CRITICAL: Required Deployment Steps

### Step 1: Deploy the RLS Migration

```bash
# Navigate to project directory
cd ClearSkin-AI

# Push the new migration to apply RLS policies
supabase db push
```

This will apply: `20260101000002_add_critical_rls_policies.sql`

### Step 2: Verify RLS in Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Policies
2. Verify these tables have RLS enabled:
   - ✅ `user_profiles`
   - ✅ `scan_sessions` 
   - ✅ `subscriptions`
   - ✅ `billing_customers`
   - ✅ `scan_credits`

### Step 3: Deploy Updated Edge Functions

```bash
# Deploy all functions with security updates
supabase functions deploy analyze-image
supabase functions deploy send-contact-email
supabase functions deploy export-user-data
```

### Step 4: Configure Storage Bucket Policies

In Supabase Dashboard → Storage → Policies for `scan` bucket:

```sql
-- SELECT policy: Users can only view their own files
CREATE POLICY "Users can view own scan files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'scan' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- INSERT policy: Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'scan' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- DELETE policy: Users can only delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'scan' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);
```

### Step 5: Set Environment Variables

Ensure these are set in Supabase Dashboard → Settings → Edge Functions:

```
PROJECT_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY_TEST=your-stripe-key
STRIPE_WEBHOOK_SECRET_TEST=your-webhook-secret
RESEND_API_KEY=your-resend-key
ENVIRONMENT=production  # Important for CORS!
```

### Step 6: Update Auth Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

```
Site URL: https://www.clearskinai.ca
Redirect URLs:
  - https://www.clearskinai.ca/confirm.html
  - https://www.clearskinai.ca/reset-password.html
  - clearskinai://auth/confirm
  - clearskinai://auth/reset-password
  - clearskinai://checkout/success
  - clearskinai://checkout/cancel
```

---

## 🔍 Security Monitoring

### Recommended: Enable Logging

Add these console logs to your Edge Functions for security monitoring:

```typescript
// Rate limit exceeded
console.warn(`[SECURITY] Rate limit exceeded for user: ${userId}`);

// Unauthorized access attempt
console.warn(`[SECURITY] User ${userId} attempted to access paths not belonging to them`);

// Invalid token
console.warn(`[SECURITY] Invalid token attempt from IP: ${req.headers.get('x-forwarded-for')}`);
```

### Monitor in Supabase Dashboard
- Edge Function Logs: Settings → Edge Functions → Logs
- Auth Logs: Authentication → Logs
- Database Logs: Database → Logs

---

## 🛡️ Defense in Depth Summary

| Layer | Protection |
|-------|------------|
| **Network** | HTTPS enforced, CORS restricted |
| **Authentication** | JWT + refresh tokens, session expiry |
| **Authorization** | RLS policies on all tables |
| **Rate Limiting** | Per-user limits on expensive operations |
| **Input Validation** | UUID validation, length limits, AI content validation |
| **Output Encoding** | HTML sanitization, React Native default encoding |
| **Storage** | Path validation, signed URLs, private buckets |
| **Secrets** | Environment variables, no hardcoding |

---

## 📋 Security Checklist for Production

- [ ] Run `supabase db push` to apply RLS migration
- [ ] Verify all 5 tables have RLS enabled in dashboard
- [ ] Deploy all updated Edge Functions
- [ ] Configure storage bucket policies
- [ ] Set `ENVIRONMENT=production` in Edge Function secrets
- [ ] Verify auth redirect URLs are production URLs only
- [ ] Test rate limiting by making multiple rapid requests
- [ ] Test RLS by attempting cross-user data access
- [ ] Remove any localhost URLs from redirect allowlist
- [ ] Enable Supabase logging for security events

---

*Last Updated: January 1, 2026*
