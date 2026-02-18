# ClearSkin AI - Security Configuration Guide

## Overview

This document outlines the security measures implemented in the ClearSkin AI application.

**Last Security Audit:** February 2026
**OWASP Compliance:** Top 10:2025

---

## Security Measures

### 1. API Key Management
- All secrets use environment variables (`Deno.env.get()`, `process.env.EXPO_PUBLIC_*`)
- `requireEnv()` helper enforces fail-fast at startup if secrets are missing
- No hardcoded API keys in source code
- Frontend only has access to public keys (ANON_KEY)
- Service role keys only used in Edge Functions (server-side)
- `google-service-account.json` is `.gitignore`d — never committed to version control
- Client-side `supabase.ts` validates env vars and warns if key looks like a service_role key

### 2. Authentication & Sessions
- JWT tokens expire in 3600 seconds (1 hour)
- Refresh token rotation enabled
- `autoRefreshToken: true` in Supabase client
- Refresh token reuse interval: 10 seconds

### 3. Row Level Security (RLS)
All 5 user data tables have RLS enabled:

- `user_profiles` — SELECT/INSERT/UPDATE policies (users can only access their own profile)
- `scan_sessions` — Full CRUD policies (users can only access their own scans)
- `subscriptions` — SELECT-only policy
- `billing_customers` — SELECT-only policy
- `scan_credits` — SELECT-only policy

### 4. Rate Limiting

All endpoints use **IP + user-based compound rate limiting** via `_shared/security.ts` (v2.0.0, 947 lines).
IP-based limits are 3x more permissive to accommodate shared networks.

| Endpoint | User Limit | Window | Type |
|----------|-----------|--------|------|
| `analyze-image` | 5 requests | 1 minute | expensive |
| `authorize-scan` | 60 requests | 1 minute | read |
| `billing-portal` | 20 requests | 1 minute | standard |
| `create-checkout-session` | 20 requests | 1 minute | standard |
| `create-subscription-payment` | 20 requests | 1 minute | standard |
| `cancel-subscription` | 20 requests | 1 minute | standard |
| `sign-storage-urls` | 60 requests | 1 minute | read |
| `stripe-webhook` | 100 requests | 1 minute | webhook |
| `send-contact-email` | 3 requests | 1 hour | contact |
| `export-user-data` | 1 request | 1 hour | export |
| Auth (sign-in/sign-up) | 10 requests | 15 minutes | auth |

Rate limit responses return HTTP 429 with RFC 6585 compliant `Retry-After` and `X-RateLimit-*` headers.

### 5. Input Validation
- **Schema-based validation** with `validateRequestBody()` — type checks, length limits, unknown field rejection
- **Content-Length enforcement** via `validateContentLength()` on all endpoints (prevents oversized payload attacks)
- **`safeParseBody()`** — combined body size + JSON parse with typed error returns
- **analyze-image**: explicit allowlist of fields, rejects unknown properties
- Context validation via AI (skincare relevance check)
- UUID validation for scan_session_id using `isValidUUID()`
- Path traversal prevention with `validateUserPath()` — blocks `..` and `//`
- Path length limits (max 500 chars) on all storage paths
- Subscription ID pattern validation: `/^sub_[a-zA-Z0-9]+$/`
- Length limits on contact form (subject: 100, message: 1000)
- Minimum password length: 8 characters
- Client-side validation in `src/lib/validation.ts` (504 lines, OWASP-compliant)
- Client-side pre-flight validation in `scan.ts`, `contact.ts`, `billing.ts`

### 6. CORS Configuration
- Strict origin checking only — no wildcards
- Allowed origins restricted to `clearskinai.ca` and `www.clearskinai.ca`
- Development mode allows `localhost:*`
- Preflight caching (24 hours)
- Centralized via `getCorsHeaders()` in shared security module
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`

### 7. SQL Injection Prevention
- All queries use Supabase's parameterized query builder
- No raw SQL with user input concatenation

### 8. XSS Prevention
- `sanitizeString()` — removes HTML brackets, javascript: protocol, event handlers, control characters
- `sanitizeForHtml()` — HTML entity encoding for email content
- React Native handles output encoding by default

### 9. Storage Security
- Path validation in `sign-storage-urls` with `validateUserPath()`
- Maximum 10 paths per request limit
- Signed URLs expire in 5–10 minutes
- Private bucket requires authentication

### 10. Webhook Security
- Stripe signature verification
- **Idempotency check** — `processedEvents` Map prevents replay attacks
- Event replay protection (5-minute window)
- UUID validation for user IDs in metadata
- Payload size limit (1MB) to prevent DoS

### 11. Security Logging
- `logSecurityEvent()` for audit trail
- Automatic sensitive data redaction (passwords, tokens, keys)
- Structured logging with severity levels

### 12. Error Handling
- Internal errors are logged server-side but never exposed to clients
- Generic error messages returned in all 500 responses
- Error codes returned for programmatic handling (`RATE_LIMIT_EXCEEDED`, `VALIDATION_ERROR`, etc.)

---

## OWASP Top 10:2025 Compliance

| OWASP Top 10 (2025) | Status | Implementation |
|---------------------|--------|----------------|
| **A01: Broken Access Control** | PASS | RLS on all tables, user ownership verification, path validation |
| **A02: Security Misconfiguration** | PASS | No CORS wildcards, env var validation, secure headers |
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

## Additional Security Settings (Supabase Dashboard)

### Authentication Settings

1. **Email Auth**
   - Email confirmations enabled
   - Secure email change: requires email verification
   - Double confirm email changes

2. **Password Settings**
   - Minimum password length: 8 characters

3. **Session Settings**
   - JWT expiry: 3600 seconds (1 hour)
   - Refresh token rotation: Enabled
   - Refresh token reuse interval: 10 seconds

4. **Rate Limits** (Supabase built-in)
   - Rate limiting on auth endpoints enabled
   - Recommended: 30 requests per 5 minutes

### Database Settings

1. **Connection Security**
   - SSL enforcement: Required
   - Connection pooling: Enabled (pgbouncer)

2. **Backups**
   - Point-in-time recovery: Enabled (Pro plan)
   - Daily backups: Enabled

### API Settings

1. **API Security**
   - Expose PostgREST schema: Only required tables
   - Max rows returned: 1000

2. **Realtime Security**
   - RLS enabled for Realtime

---

## Additional Security Settings (Stripe Dashboard)

### Webhook Settings

1. **Webhook Endpoint**
   - URL: `https://<project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

2. **Webhook Signing Secret**
   - Stored as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets

3. **JWT Verification Disabled for Webhook**
   - Required because Stripe uses signature-based authentication, not JWT
   - The function verifies authenticity using Stripe's webhook signature

### API Keys

- Use restricted keys in production (not full access)
- Required permissions: Customers (Write), Subscriptions (Write), Checkout Sessions (Write), Billing Portal (Write), Products & Prices (Read)
- Separate test keys for development — never use test keys in production

### Fraud Prevention (Stripe Radar)

- Radar enabled for fraud detection
- 3D Secure enabled when supported

---

## Security Monitoring

### Security Event Logging

The shared security module logs events automatically:

```typescript
logSecurityEvent('rate_limit_exceeded', { userId, endpoint, ip });
logSecurityEvent('unauthorized_access', { userId, attemptedPath });
logSecurityEvent('invalid_input', { field, reason });
logSecurityEvent('webhook_replay_blocked', { eventId });
```

### Monitoring Locations
- **Edge Function Logs**: Supabase Dashboard > Settings > Edge Functions > Logs
- **Auth Logs**: Supabase Dashboard > Authentication > Logs
- **Database Logs**: Supabase Dashboard > Database > Logs

### Key Events to Watch
- Rate limit exceeded (potential attack)
- Unauthorized path access (potential data breach attempt)
- Invalid tokens (potential session hijacking)
- Webhook replay attempts (potential replay attack)
- Multiple failed auth attempts (brute force)

---

*Last Updated: February 2026*
