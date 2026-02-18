# 🧴 ClearSkin AI

<div align="center">
  <img src="assets/icon.png" alt="ClearSkin AI Logo" width="120" height="120">
  
  **AI-Powered Skin Analysis Mobile App**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-~54.0-black)](https://expo.dev/)
  [![Website](https://img.shields.io/badge/website-clearskinai.ca-10B981)](https://www.clearskinai.ca/)
</div>

---

## What is ClearSkin AI?

ClearSkin AI is a mobile application that uses artificial intelligence to analyze skin health through smartphone photography. Users can track their skincare journey, receive personalized recommendations, and monitor improvements over time.

## Key Features

### AI-Powered Analysis
- **Computer Vision**: Powered by OpenAI GPT-5-mini with vision capabilities
- **Multi-Angle Photography**: Front, left, and right facial views for comprehensive assessment
- **Skin Age Estimation**: AI-powered skin age analysis with confidence percentage and age comparison
- **Visual Heatmaps**: Interactive SVG overlays (breakouts, oiliness, dryness, redness) across all 3 photo views
- **Face Detection Validation**: Automatic detection of invalid scans with user-friendly retry flow
- **Personalized Context**: Optional user-provided skin concerns (up to 500 characters) for tailored analysis
- **Watchlist Areas**: AI-flagged areas requiring ongoing monitoring
- **Scan Comparison**: Side-by-side comparison of two scans with delta badges showing score changes
- **Progress Tracking**: Historical data visualization and improvement monitoring

### User Experience
- **User Profiles**: Age and gender collection for personalized AI analysis
- **Mandatory Profile Setup**: New users complete profile for optimized recommendations
- **Personalized Routines**: Custom AM/PM skincare recommendations based on analysis
- **Product Suggestions**: AI-curated product recommendations for specific skin needs
- **Real-Time Updates**: Live data sync via Supabase Realtime on home, history, latest, and routine screens
- **Pull-to-Refresh**: Manual refresh on all main screens
- **Cross-Platform**: Seamless experience on iOS and Android devices
- **Background State Handling**: Scan processing resumes correctly when app returns to foreground

### Security
- **Secure Authentication**: Supabase Auth with email/password and session management
- **End-to-End Encryption**: All photos encrypted before storage
- **Rate Limiting**: Compound IP + user sliding window rate limiting on all endpoints
- **Row-Level Security**: Database-level access controls on all user tables
- **CORS Protection**: Strict origin validation in production
- **Input Validation**: UUID validation, path traversal prevention, content-length enforcement, and OWASP-compliant sanitization
- **GDPR Compliance**: Complete data export (JSON via Resend email) and full account deletion

### Payments
- **Stripe Integration**: Payment processing with Apple Pay/Google Pay via Payment Sheet
- **Subscription Management**: Automated billing with Stripe billing portal
- **Freemium Model**: One free trial scan per account with premium unlimited ($3.33 USD/month)

## Technical Architecture

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **TypeScript** | 5.9 | Type-safe development with strict mode |
| **Expo** | ~54.0 | Development platform and build tools |
| **NativeWind** | 4.2 | TailwindCSS for React Native styling |
| **Expo Router** | ~6.0 | File-based navigation system |
| **Lucide Icons** | 0.545 | Iconography |

### Backend & Services
| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL, Auth, Storage, Edge Functions, Realtime |
| **OpenAI GPT-5-mini** | Computer vision for skin assessment |
| **Stripe** | Payment Sheet (native), Apple Pay, Google Pay |
| **Resend** | Data exports and contact form notifications |

### Edge Functions (10)
| Function | Purpose | Rate Limit |
|----------|---------|------------|
| `analyze-image` | GPT-5-mini skin analysis with context | 5 req/min |
| `authorize-scan` | Pre-scan authorization (subscription/credit/free) | 60 req/min |
| `create-subscription-payment` | Stripe Payment Sheet intent (native flow) | 20 req/min |
| `create-checkout-session` | Stripe checkout session (web flow) | 20 req/min |
| `cancel-subscription` | Cancel Stripe subscription | 20 req/min |
| `billing-portal` | Stripe billing portal URL generation | 20 req/min |
| `sign-storage-urls` | Signed Supabase storage URLs for photos | 60 req/min |
| `stripe-webhook` | Stripe event handling (subscription lifecycle) | 100 req/min |
| `send-contact-email` | Contact form email via Resend | 3 req/hr |
| `export-user-data` | GDPR data export via Resend email | 1 req/hr |

### Database Schema (RLS-Protected)
All 5 user data tables are protected with Row-Level Security policies:

| Table | Description |
|-------|-------------|
| `user_profiles` | Date of birth, gender, age, profile edit tracking, free scan cooldown, legacy user flag |
| `scan_sessions` | Status, photo paths, user context, skin scores, skin age/type/health, condition levels (breakouts, acne, scarring, redness, razor burn, blackheads, oiliness, pore health), summary, issues, region scores, watchlist areas, routines, products, heatmap overlays |
| `subscriptions` | Stripe subscription ID, plan, status, billing period, plan code |
| `billing_customers` | Stripe customer ID mapping |
| `scan_credits` | Scan credit tracking |

## Getting Started

### Prerequisites
- **Node.js** v18+ or v20+
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g eas-cli` (for production builds)
- **iOS Simulator** (Mac) or **Android Studio** (any OS)

### Quick Setup

```bash
# 1. Clone and install
git clone https://github.com/TeddyS26/ClearSkin-AI.git
cd ClearSkin-AI
npm install

# 2. Environment setup
cp .env.example .env
# Add your API keys (see Environment Variables section)

# 3. Start development
npm start

# 4. Run on device
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

### Environment Variables

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Payment Processing
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxx

# OpenAI AI Analysis
OPENAI_API_KEY=sk-xxx

# Email Service (for data exports)
RESEND_API_KEY=re_xxx
```

## Testing

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode for development
npm run type-check    # TypeScript compilation check
npm run lint          # ESLint code quality check
```

### Test Coverage
- **31 test files** covering screens, components, libraries, contexts, and utilities
- Unit tests for core business logic (`src/lib/__tests__/`)
- Component tests with user interactions (`components/__tests__/`)
- Screen tests for tabs, auth, scan flow, and app screens
- Snapshot tests for visual regression

## Project Structure

```
ClearSkin-AI/
├── app/                          # Expo Router - File-based navigation
│   ├── (tabs)/                   # Main app tabs (Home, Latest, Scan, Routine, History)
│   ├── auth/                     # Auth flow (sign-in, sign-up, profile-setup, etc.)
│   ├── scan/                     # Scan workflow (capture, review, loading, result, compare)
│   ├── checkout/                 # Payment processing (success, cancel)
│   ├── contact.tsx               # Support & contact form
│   ├── settings.tsx              # Account management, data export, deletion
│   ├── subscribe.tsx             # Subscription purchase via Stripe Payment Sheet
│   ├── privacy-policy.tsx        # Privacy policy
│   └── terms-of-service.tsx      # Terms of service
├── components/                   # Reusable UI components
│   ├── HeatmapOverlay.tsx        # SVG polygon overlay visualization
│   └── HeatmapLegend.tsx         # Color gradient legend
├── src/                          # Core application logic
│   ├── ctx/AuthContext.tsx        # Global authentication state + profile completion
│   ├── types/index.ts            # TypeScript type definitions
│   ├── lib/                      # Business logic (scan, billing, contact, validation, supabase)
│   ├── utils/compare.ts          # Scan comparison utilities
│   └── components/DeltaBadge.tsx  # Score change indicator
├── supabase/                     # Backend configuration
│   ├── functions/                # 10 Edge Functions + shared security module
│   └── migrations/               # Database schema + RLS policies
├── website/                      # Marketing website (clearskinai.ca)
└── assets/                       # App icons and splash screen
```

## Security & Privacy

### Security Implementation
- **Shared Security Module**: v2.0.0 (947 lines) — OWASP Top 10:2025 compliant
- **Client-Side Validation**: 504-line OWASP-compliant validation library
- **Rate Limiting**: Compound IP + user sliding window limits on all endpoints
- **CORS**: Strict origin checking, no wildcards, centralized `getCorsHeaders()`
- **Input Sanitization**: XSS prevention, UUID validation, path traversal prevention, content-length enforcement
- **Security Logging**: `logSecurityEvent()` with automatic sensitive data redaction
- **Webhook Security**: Stripe signature verification with idempotency and replay protection
- **Session Management**: 1-hour JWT expiry with automatic token refresh

See [SECURITY.md](SECURITY.md) for the full security configuration guide.

### Privacy & Legal Compliance
| Regulation | Status |
|------------|--------|
| **PIPEDA** (Canada) | Primary compliance — privacy policy, data protection, Canadian jurisdiction |
| **GDPR** (EU) | Disclaimer — Canadian law applies |
| **CCPA** (California) | Disclaimer — Canadian law applies |

- **Data Export**: Complete user data download (GDPR Article 20)
- **Right to Deletion**: Complete account and data removal (GDPR Article 17)
- **Medical Disclaimer**: ClearSkin AI is for informational purposes only and is not a medical device

## Monetization

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/month | 1 free scan every 30 days, overall skin score & potential, browse scan history |
| **Premium** | $3.33 USD/month | Unlimited AI scans, skin age estimation, detailed conditions, interactive heatmaps, personalized routines, product recommendations, watchlist areas, scan comparison, progress tracking |

## Development Commands

```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator

# Testing & Quality
npm test               # Run all tests with coverage
npm run test:watch     # Watch mode for TDD
npm run type-check     # TypeScript compilation check
npm run lint           # ESLint code quality check

# Production Builds
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform all --latest
```

## Known Limitations

1. **Camera Testing**: Full camera functionality requires physical device testing
2. **Dark Mode**: System `userInterfaceStyle` is set to `automatic` but screens use hardcoded light colors
3. **Push Notifications**: Infrastructure is in place but notification scheduling is not yet implemented
4. **Learn Section**: Placeholder — not yet implemented
5. **Habits / Missions / Rewards**: Placeholder directories — not yet implemented

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

## Contact

- 📧 **Email**: contact@clearskinai.ca
- 📱 **In-App Support**: Contact form available in settings
- 🌐 **Website**: [clearskinai.ca](https://clearskinai.ca)
