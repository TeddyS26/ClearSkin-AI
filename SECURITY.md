# ClearSkin AI - Security Configuration Guide

## Overview

This document outlines the security measures implemented in the ClearSkin AI application and the steps required to ensure complete security in production.

**Last Security Audit:** January 2025  
**OWASP Compliance:** Top 10:2025  
**Status:** Production Ready

---

## Critical Vulnerability Fixed (January 2025)

### CORS Wildcard in cancel-subscription

**File:** `supabase/functions/cancel-subscription/index.ts`

**Before:**
```typescript
"Access-Control-Allow-Origin": "*"
```

**After:**
```typescript
const corsHeaders = getCorsHeaders(req);
// Returns strict origin or empty, never wildcard
```

**Risk:** Allowed any website to make authenticated requests to cancel user subscriptions.

---

## Security Measures Implemented

### 1. API Key Management
- All secrets use environment variables (`Deno.env.get()`, `process.env.EXPO_PUBLIC_*`)
- No hardcoded API keys in source code
- Frontend only has access to public keys (ANON_KEY)
- Service role keys only used in Edge Functions (server-side)

### 2. Authentication & Sessions
- JWT tokens expire in 3600 seconds (1 hour)
- Refresh token rotation enabled
- `autoRefreshToken: true` in Supabase client
- Refresh token reuse interval: 10 seconds

### 3. Row Level Security (RLS)
- `user_profiles` - RLS enabled with SELECT/INSERT/UPDATE policies
- `scan_sessions` - RLS enabled with full CRUD policies
- `subscriptions` - RLS enabled with SELECT-only policy
- `billing_customers` - RLS enabled with SELECT-only policy
- `scan_credits` - RLS enabled with SELECT-only policy

### 4. Rate Limiting (Enhanced January 2025)

All endpoints now use **IP + user-based compound rate limiting** via `_shared/security.ts`:

| Endpoint | Limit | Window | Type |
|----------|-------|--------|------|
| `analyze-image` | 3 requests | 1 minute | expensive |
| `authorize-scan` | 30 requests | 1 minute | read |
| `billing-portal` | 10 requests | 1 minute | standard |
| `create-checkout-session` | 3 requests | 1 minute | expensive |
| `create-subscription-payment` | 3 requests | 1 minute | expensive |
| `cancel-subscription` | 10 requests | 1 minute | standard |
| `sign-storage-urls` | 30 requests | 1 minute | read |
| `stripe-webhook` | 100 requests | 1 minute | webhook |
| `send-contact-email` | 5 requests | 1 hour | contact |
| `export-user-data` | 1 request | 1 hour | export |
| Auth (sign-in/sign-up) | 5 requests | 15 minutes | auth |

### 5. Input Validation (Enhanced January 2025)
- **Schema-based validation** with `validateRequestBody()` - type checks, length limits, unknown field rejection
- Context validation via AI (skincare relevance check)
- UUID validation for scan_session_id using `isValidUUID()`
- Path traversal prevention with `validateUserPath()` - blocks `..` and `//`
- Subscription ID pattern validation: `/^sub_[a-zA-Z0-9]+$/`
- Length limits on contact form (subject: 100, message: 1000)
- Minimum password length: 8 characters
- Client-side validation in `src/lib/validation.ts`

### 6. CORS Configuration (Fixed January 2025)
- **All wildcards removed** - strict origin checking only
- Allowed origins restricted to `clearskinai.ca` and `www.clearskinai.ca`
- Development mode allows `localhost:*`
- Preflight caching (24 hours)
- Centralized via `getCorsHeaders()` in shared security module

### 7. SQL Injection Prevention
- All queries use Supabase's parameterized query builder
- No raw SQL with user input concatenation

### 8. XSS Prevention (Enhanced January 2025)
- `sanitizeString()` - removes HTML brackets, javascript: protocol, event handlers
- `sanitizeForHtml()` - HTML entity encoding for email content
- React Native handles output encoding by default

### 9. Storage Security
- Path validation in `sign-storage-urls` with `validateUserPath()`
- Maximum 10 paths per request limit
- Signed URLs expire in 5-10 minutes
- Private bucket requires authentication

### 10. Webhook Security (Added January 2025)
- Stripe signature verification
- **Idempotency check** - `processedEvents` Map prevents replay attacks
- Event replay protection (5-minute window)
- UUID validation for user IDs in metadata

### 11. Security Logging (Added January 2025)
- `logSecurityEvent()` for audit trail
- Automatic sensitive data redaction (passwords, tokens, keys)
- Structured logging with severity levels

---

## CRITICAL: Required Deployment Steps

### Step 1: Deploy the RLS Migration

```bash
# Navigate to project directory
cd ClearSkin-AI

# Push the new migration to apply RLS policies
supabase db push
```

This will apply: `20260101000002_add_critical_rls_policies.sql`

### Step 2: Verify RLS in Supabase Dashboard

1. Go to Supabase Dashboard > Authentication > Policies
2. Verify these tables have RLS enabled:
   - `user_profiles`
   - `scan_sessions`
   - `subscriptions`
   - `billing_customers`
   - `scan_credits`

### Step 3: Deploy ALL Updated Edge Functions

```bash
# Deploy all functions with security updates (REQUIRED after January 2025 audit)
supabase functions deploy authorize-scan
supabase functions deploy billing-portal
supabase functions deploy create-checkout-session
supabase functions deploy create-subscription-payment
supabase functions deploy cancel-subscription
supabase functions deploy sign-storage-urls
supabase functions deploy stripe-webhook
supabase functions deploy send-contact-email
supabase functions deploy export-user-data
supabase functions deploy analyze-image

# Or deploy all at once:
supabase functions deploy
```

### Step 4: Configure Storage Bucket Policies

In Supabase Dashboard > Storage > Policies for `scan` bucket:

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

Ensure these are set in Supabase Dashboard > Settings > Edge Functions:

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

In Supabase Dashboard > Authentication > URL Configuration:

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

## Additional Security Settings (Supabase Dashboard)

### Authentication Settings
In Supabase Dashboard > Authentication > Settings:

1. **Email Auth**
   - Enable email confirmations
   - Secure email change: Require email verification for changes
   - Double confirm email changes

2. **Password Settings**
   - Minimum password length: 8 characters
   - Enable password strength indicator

3. **Session Settings**
   - JWT expiry: 3600 seconds (1 hour)
   - Refresh token rotation: Enabled
   - Refresh token reuse interval: 10 seconds

4. **Rate Limits** (Supabase built-in)
   - Enable rate limiting on auth endpoints
   - Recommended: 30 requests per 5 minutes

### Database Settings
In Supabase Dashboard > Database > Settings:

1. **Connection Security**
   - SSL enforcement: Required
   - Connection pooling: Enabled (pgbouncer)

2. **Backups**
   - Point-in-time recovery: Enabled (Pro plan)
   - Daily backups: Enabled

### API Settings
In Supabase Dashboard > Settings > API:

1. **API Security**
   - Expose PostgREST schema: Only required tables
   - Max rows returned: 1000 (reasonable limit)

2. **Realtime Security**
   - Enable RLS for Realtime (if using)

---

## Additional Security Settings (Stripe Dashboard)

### Webhook Settings
In Stripe Dashboard > Developers > Webhooks:

1. **Webhook Endpoint**
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Listen to events in: Live mode (for production)

2. **Events to Listen**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

3. **Webhook Signing Secret**
   - Copy to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`
   - Rotate if compromised

### API Keys
In Stripe Dashboard > Developers > API keys:

1. **Live Mode**
   - Use restricted keys in production (not full access)
   - Limit permissions to only what's needed:
     - Customers: Write
     - Subscriptions: Write
     - Checkout Sessions: Write
     - Billing Portal: Write
     - Products & Prices: Read

2. **Test Mode**
   - Use separate test keys for development
   - Never use test keys in production

### Fraud Prevention
In Stripe Dashboard > Radar:

1. **Radar Rules** (Stripe Radar)
   - Enable Radar for fraud detection
   - Block payments from high-risk countries (if applicable)
   - Review payments over $100 (customize threshold)

2. **3D Secure**
   - Enable 3D Secure when supported

---

## Security Monitoring

### Security Event Logging (Built-in)

The shared security module logs security events automatically:

```typescript
// Events logged by the security module:
logSecurityEvent('rate_limit_exceeded', { userId, endpoint, ip });
logSecurityEvent('unauthorized_access', { userId, attemptedPath });
logSecurityEvent('invalid_input', { field, reason });
logSecurityEvent('webhook_replay_blocked', { eventId });
```

### Monitor in Supabase Dashboard
- Edge Function Logs: Settings > Edge Functions > Logs
- Auth Logs: Authentication > Logs
- Database Logs: Database > Logs

### Watch For These Events
- Rate limit exceeded (potential attack)
- Unauthorized path access (potential data breach attempt)
- Invalid tokens (potential session hijacking)
- Webhook replay attempts (potential replay attack)
- Multiple failed auth attempts (brute force)

---

## OWASP Top 10:2025 Compliance

| OWASP Top 10 (2025) | Status | Implementation |
|---------------------|--------|----------------|
| **A01: Broken Access Control** | PASS | RLS on all tables, user ownership verification, path validation |
| **A02: Security Misconfiguration** | PASS | CORS fix (no wildcards), env var validation, secure headers |
| **A03: Software Supply Chain Failures** | REVIEW | Regular `npm audit` recommended, review dependencies |
| **A04: Cryptographic Failures** | PASS | Keys in env vars, HTTPS enforced, JWT tokens |
| **A05: Injection** | PASS | Parameterized queries, input sanitization, schema validation |
| **A06: Insecure Design** | PASS | Defense in depth, rate limiting, least privilege |
| **A07: Authentication Failures** | PASS | Rate limiting on auth, token expiry, refresh rotation |
| **A08: Software/Data Integrity Failures** | PASS | Webhook signature verification, idempotency checks |
| **A09: Security Logging & Alerting** | PASS | `logSecurityEvent()`, structured logging |
| **A10: Mishandling Exceptional Conditions** | PASS | Graceful error handling, no stack traces to client |

---

## Defense in Depth Summary

| Layer | Protection |
|-------|------------|
| **Network** | HTTPS enforced, CORS restricted (no wildcards) |
| **Authentication** | JWT + refresh tokens, session expiry, rate limiting |
| **Authorization** | RLS policies on all tables, user ownership checks |
| **Rate Limiting** | IP + user-based compound limits on all endpoints |
| **Input Validation** | Schema-based validation, length limits, sanitization |
| **Output Encoding** | HTML sanitization, React Native default encoding |
| **Storage** | Path traversal prevention, signed URLs, private buckets |
| **Webhooks** | Signature verification, idempotency, replay protection |
| **Secrets** | Environment variables, no hardcoding, key rotation |
| **Logging** | Security event logging, sensitive data redaction |

---

## Security Checklist for Production

- [ ] Run `supabase db push` to apply RLS migration
- [ ] Verify all 5 tables have RLS enabled in dashboard
- [ ] Deploy all updated Edge Functions (`supabase functions deploy`)
- [ ] Configure storage bucket policies
- [ ] Set `ENVIRONMENT=production` in Edge Function secrets
- [ ] Verify auth redirect URLs are production URLs only
- [ ] Test rate limiting by making multiple rapid requests
- [ ] Test RLS by attempting cross-user data access
- [ ] Remove any localhost URLs from redirect allowlist
- [ ] Enable Supabase logging for security events
- [ ] Run `npm audit` and fix any vulnerabilities
- [ ] Verify Stripe webhook is using live mode signing secret
- [ ] Enable Stripe Radar for fraud detection

---

## Changelog

| Date | Change | Risk Level |
|------|--------|------------|
| Jan 2025 | Fixed CORS wildcard in cancel-subscription | Critical |
| Jan 2025 | Added rate limiting to all endpoints | High |
| Jan 2025 | Implemented input validation schemas | High |
| Jan 2025 | Added webhook idempotency | Medium |
| Jan 2025 | Added path traversal protection | High |
| Jan 2025 | Created client-side validation | Medium |
| Jan 2025 | Updated OWASP compliance to 2025 | - |

---

*Last Updated: January 5, 2026*
