# ClearSkin AI vs Competitors: Feature Comparison & Roadmap

## 1. Feature-by-Feature Comparison

| Feature | ClearSkin AI | Skinepic | Market Average |
|---------|:---:|:---:|:---:|
| **SCANNING & ANALYSIS** | | | |
| AI skin analysis | Yes (GPT-5-mini vision) | Yes (custom AI model) | Yes |
| Multi-angle photos (3) | Yes | Partial (2 sides) | Rare |
| Face detection validation | Yes | No mention | Rare |
| User context input | Yes (500 chars) | No | Rare |
| Demographic-aware analysis | Yes (age + gender) | No mention | Some |
| Manual AI correction / editing | **No** | **Yes** (adjust counts, false positives) | Rare |
| Scan confidence score | **No** | No | No |
| **METRICS & VISUALIZATION** | | | |
| Overall skin score | Yes (0-100) | No (severity-based) | Some |
| Skin age estimation | Yes | No | Rare (Olay/L'Oreal only) |
| Interactive heatmaps (4 modes) | Yes | Yes (AI masks on/off) | Rare |
| Regional scores (forehead/nose/cheeks/chin) | Yes | No | No |
| Condition detection breadth | Yes (8+ conditions) | Acne-focused only | Varies |
| Pimple counting by type | Partial (blackhead count) | Yes (all types) | Some |
| **ROUTINES & PRODUCTS** | | | |
| AM/PM skincare routine | Yes | Yes (4-week plan) | Some |
| Specific product recommendations | Yes (name, URL, price) | Yes (product types) | Some |
| Product usage tracking | **No** | **Yes** (with notifications) | Rare |
| Product barcode scanner | No | No | TroveSkin only |
| **HISTORY & PROGRESS** | | | |
| Scan history | Yes (paginated) | Yes | Most apps |
| Side-by-side comparison with deltas | Yes | Yes (Trend section) | Some |
| Structured scan cadence | **No** | **Yes** (weekly) | Some |
| **ENGAGEMENT & RETENTION** | | | |
| Push notifications | **No** (infra only) | **Yes** | Most apps |
| Habit tracker | **No** | **Yes** | Some |
| Daily missions/tasks | **No** | **Yes** | Some |
| Gamification (rewards/streaks) | **No** | **Yes** | Some (TroveSkin) |
| Educational content | **No** (empty placeholder) | **Yes** ("Good to Know") | Most apps |
| Emotional support messaging | No | Yes ("acne is OK") | Some |
| **MONETIZATION** | | | |
| Free tier | 1 scan | More generous free tier | Varies |
| Subscription price | $3.33/month | Unknown (likely similar) | $5-15/month |
| Apple Pay / Google Pay | Yes | Unknown | Some |

---

## 2. ClearSkin AI's Current Advantages

These are areas where ClearSkin AI is **already stronger** than Skinepic and most competitors:

1. **Broader condition detection** - Not just acne. Detects oiliness, redness, razor burn, scarring, pore health, blackheads, skin type. Skinepic is acne-only.
2. **Skin age estimation** - Unique differentiator. Only brand-locked apps (Olay, L'Oreal) offer this, and they only recommend their own products.
3. **3-angle scanning** - More comprehensive coverage than Skinepic's 2-photo approach.
4. **Interactive heatmaps with 4 modes** - Breakouts, oiliness, dryness, redness visualized separately. More diagnostic depth than competitors.
5. **Regional scoring** - Forehead, nose, cheeks, chin scored independently. No competitor does this.
6. **User context integration** - Users can describe concerns before scanning. AI considers this context.
7. **Specific product recommendations** - Actual product names with URLs and prices, not just generic "use a cleanser."
8. **Side-by-side comparison with delta badges** - Quantified improvement metrics between scans.
9. **Demographic-aware analysis** - Adjusts for age and gender. More medically relevant.
10. **Affordable pricing** - $3.33/month is below market average.

---

## 3. ClearSkin AI's Gaps (What's Missing)

Critical gaps that competitors fill and ClearSkin AI doesn't:

| Gap | Why It Matters | Who Does It |
|-----|---------------|-------------|
| Push notifications | #1 retention driver. Without reminders, users forget the app exists | All competitors |
| Product usage tracking | Can't measure if recommendations work without tracking compliance | Skinepic, MDacne |
| Habit/lifestyle tracking | Can't correlate lifestyle to skin changes. Users want causation, not just observation | Skinepic, TroveSkin |
| Educational content | Users need to understand WHY, not just WHAT. Builds trust and session time | Skinepic, MDacne |
| Manual AI correction | Users can't trust AI they can't correct. Builds accuracy perception and actual accuracy over time | Skinepic |
| Scan cadence/reminders | Without structure, users scan irregularly, making trend data meaningless | Skinepic |
| Gamification/missions | No reason to open the app between scans. Competitors give daily reasons | Skinepic, TroveSkin |
| Generous free tier | 1 free scan is aggressive. Users can't evaluate the app before paying | Skinepic (free), TroveSkin |

---

## 4. Recommended Features (Prioritized)

### TIER 1: MUST-HAVE (Market Parity + Core Differentiation)

These close critical gaps and are table-stakes for competing:

#### Feature 1: Push Notifications
- **Why**: Without notifications, users forget the app. Retention drops 70%+ without reminders. Every competitor has this.
- **How**: Scheduled notifications for scan reminders (weekly), product usage reminders (AM/PM), and results-ready alerts.
- **Backend**: New `notification_preferences` table in Supabase. Use `expo-notifications` (already in dependencies).
- **Screens affected**: Settings (preferences), Home (permission prompt)
- **Effort**: **Small**
- **Dependencies**: None. Infrastructure already exists (`expo-task-manager` in package.json).

#### Feature 2: Manual AI Correction
- **Why**: Positions ClearSkin AI as a "serious skin intelligence tool." Builds user trust. Makes AI more accurate over time (correction data = training signal). Skinepic already has this.
- **How**:
  - On the result screen, each detected condition gets a "Was this detected correctly?" toggle
  - Editable counts (e.g., blackheads: 12 -> user changes to 9)
  - On heatmap zones, option to "mark as false positive"
  - Corrections saved alongside original AI values
- **Backend**: Add `user_corrections` JSON column to `scan_sessions` table. Store original + corrected values.
- **Screens affected**: `scan/result.tsx` (add correction UI), heatmap components
- **Effort**: **Medium**
- **Dependencies**: None

#### Feature 3: Scan Quality & Confidence Score
- **Why**: Users need to know IF they can trust a scan result. A confidence score of "87% confidence" builds credibility. No competitor does this - unique differentiator.
- **How**:
  - AI already analyzes photos. Add confidence scoring to the analysis prompt.
  - Display "Scan Quality: Good/Fair/Poor" + confidence percentage on results.
  - If quality is low, suggest retaking with tips (better lighting, remove makeup, etc.)
- **Backend**: Add `confidence_score` and `scan_quality` fields to `scan_sessions`.
- **Screens affected**: `scan/result.tsx`, `scan/loading.tsx` (quality tips)
- **Effort**: **Small** (mostly prompt engineering + UI)
- **Dependencies**: None

#### Feature 4: Product Usage Tracking
- **Why**: Bridges the gap between "we recommend products" and "did they actually work?" This is the #1 thing that turns ClearSkin AI from a scanner into an intelligence tool.
- **How**:
  - After a scan, recommended products appear with a daily "Used today?" toggle
  - Users log which products they used each day
  - After 2-3 weeks, show insight cards: "You used [moisturizer] 18 of 21 days. Your oiliness dropped 11%."
  - Correlation analysis between product usage and metric changes
- **Backend**: New `product_usage_logs` table (user_id, product_name, date, used: boolean). New `user_products` table to persist the product list.
- **Screens affected**: Routine tab (add toggles), Home (insight cards), new insights/analytics section
- **Effort**: **Large**
- **Dependencies**: Push notifications (for daily reminders)

#### Feature 5: Educational Content (AI-Synthesized, Evidence-Grounded)
- **Why**: Users who understand WHY they have skin issues are 3x more likely to follow routines. Skinepic's "Good to Know" section is one of their key features. The `/app/learn/` directory already exists.
- **How**:
  - AI generates personalized articles that cite credible dermatological sources (AAD, PubMed, dermatology textbooks)
  - Topics: acne causes, skincare ingredients, lifestyle impacts, product selection, skin types
  - Scan-specific insights: after a scan showing high oiliness, surface relevant evidence-based articles
  - Each article includes source citations (e.g., "According to the American Academy of Dermatology...")
  - Short, digestible format with "Sources" section at the bottom
  - Disclaimer: "This content is AI-synthesized from dermatological research. Consult a dermatologist for medical advice."
- **Backend**: Edge function to generate articles via GPT with evidence-grounding prompt. `learn_articles` table in Supabase (id, title, content, sources, tags, scan_relevance_tags). Cache generated articles to avoid regeneration.
- **Screens affected**: `learn/` section (currently empty), Home (contextual tips linked to latest scan)
- **Effort**: **Medium**
- **Dependencies**: None

### TIER 2: SHOULD-HAVE (Retention & Intelligence)

These differentiate ClearSkin AI beyond market parity:

#### Feature 6: Basic Habit Input with Correlation Insights
- **Why**: This is what makes ClearSkin AI a "skin intelligence tool" vs just a scanner. No competitor shows CORRELATION between lifestyle and skin metrics. This is a unique differentiator.
- **How**:
  - Daily check-in (minimal friction): Sleep quality (1-5), Stress level (1-5), Water intake (yes/no)
  - After 3+ weeks of data, show insights: "Higher stress days correlate with 12% increase in redness"
  - Visualize correlations with simple charts
- **Backend**: New `daily_habits` table (user_id, date, sleep_quality, stress_level, water_intake). Correlation calculation in edge function or client-side.
- **Screens affected**: Home (daily check-in widget), new Insights tab or section
- **Effort**: **Large** (especially the correlation analysis)
- **Dependencies**: Enough scan history + habit data (3+ weeks)

#### Feature 7: Structured Weekly Scan Cadence
- **Why**: Regular scanning produces meaningful trend data. Irregular scanning makes trends unreliable. A structured cadence + reminders makes the app a habit.
- **How**:
  - After first scan, suggest "Scan every Sunday for best tracking"
  - Show "Next scan in X days" on home screen
  - Push notification on scan day
  - Trend visualization improved with regular data points
- **Backend**: Add `scan_cadence` preference to user profile. Notification scheduling logic.
- **Screens affected**: Home (next scan countdown), Settings (cadence preference)
- **Effort**: **Small**
- **Dependencies**: Push notifications (Feature 1)

#### Feature 8: Daily Missions / Tasks
- **Why**: Gives users a reason to open the app every day, not just on scan days. Skinepic's main engagement loop.
- **How**:
  - Daily task list on home screen: "Log your morning routine," "Rate your sleep," "Check your skin tip of the day"
  - Tasks tied to product usage tracking and habit input
  - Completion streaks tracked
- **Backend**: Mission generation logic (could be template-based or AI-generated). `daily_missions` table.
- **Screens affected**: Home (mission widget)
- **Effort**: **Medium**
- **Dependencies**: Product usage tracking (Feature 4), Habit input (Feature 6)

### TIER 3: NICE-TO-HAVE (Engagement & Delight)

#### Feature 9: Gamification (Rewards & Streaks)
- **Why**: Increases daily engagement. Users with streaks have 2x retention. But this is polish, not core value.
- **How**: Streak counter for daily check-ins, badges for milestones (10 scans, 30-day habit streak, etc.), XP/points system
- **Backend**: `achievements` and `user_achievements` tables, streak tracking in user profile
- **Screens affected**: Home (streak display), new Achievements screen
- **Effort**: **Medium**
- **Dependencies**: Daily missions (Feature 8), Habit tracking (Feature 6)

#### Feature 10: More Generous Free Tier (3 Free Scans)
- **Why**: 1 free scan makes it hard for users to evaluate the app. Competitors offer more. 3 scans gives users enough to see the comparison/trend value.
- **How**: Increase free scan limit from 1 to 3. Users get 3 full scans before hitting the paywall. All premium features (heatmaps, skin age, routines) still included in free scans so users experience the full value.
- **Backend**: Modify `authorize-scan` edge function to check for 3 free scans instead of 1. Update `user_profiles` free trial tracking logic.
- **Effort**: **Small**
- **Dependencies**: None

#### Feature 11: Positive/Supportive Messaging
- **Why**: Skinepic emphasizes emotional support. Skin issues cause real anxiety, especially in teens. Empathetic messaging builds brand loyalty.
- **How**: Add encouraging messages to scan results, progress updates, and the home screen. Frame improvements positively, frame setbacks constructively.
- **Backend**: Prompt engineering changes + UI copy updates
- **Effort**: **Small**
- **Dependencies**: None

---

## 5. Detailed Implementation Roadmap

### Phase 1: Foundation (Features 1, 3, 10, 11)
Push notifications, scan confidence score, 3 free scans, supportive messaging.
These are quick wins that immediately improve retention and user experience.

**Feature 1 - Push Notifications:**
- Add `expo-notifications` permission prompt on first app launch
- Create `notification_preferences` table (user_id, scan_reminders: bool, product_reminders: bool, morning_reminder_time, evening_reminder_time)
- Register device push token with Supabase
- Implement local scheduled notifications for AM/PM product reminders
- Add notification preferences screen in Settings
- Send push when scan analysis completes (via edge function)

**Feature 3 - Scan Confidence Score:**
- Update `analyze-image` edge function prompt to return `confidence_score` (0-100) and `scan_quality` (good/fair/poor) with reasoning
- Add migration: `ALTER TABLE scan_sessions ADD COLUMN confidence_score INT, ADD COLUMN scan_quality TEXT`
- Display confidence badge on `scan/result.tsx` (e.g., "91% confidence - Good quality scan")
- If quality is "poor", show tips modal: "For better results: use natural lighting, remove makeup, hold phone steady"

**Feature 10 - 3 Free Scans:**
- Update `authorize-scan` edge function: change free scan limit from 1 to 3
- Update `user_profiles` tracking: count total free scans used (not just boolean flag)
- Update home screen copy: "You have X of 3 free scans remaining"
- Update subscribe prompt to mention free scan count

**Feature 11 - Supportive Messaging:**
- Add encouraging copy to scan results based on metrics:
  - Improvement: "Your skin score improved 5 points. Your routine is working!"
  - No change: "Consistency is key. Keep following your routine."
  - Decline: "Skin fluctuates naturally. Let's look at what might help."
- Update AI prompt to include a `supportive_note` field in response
- Add motivational banner to home screen (rotating tips)

---

### Phase 2: Intelligence Core (Features 2, 4, 5)
Manual AI correction, product usage tracking, educational content.
This phase transforms the app from "scanner" to "skin intelligence platform."

**Feature 2 - Manual AI Correction:**
- Add correction UI to `scan/result.tsx`:
  - Each condition row gets an expand/edit icon
  - Expanded view shows: AI value, editable input field, "Looks correct" / "Adjust" toggle
  - Blackhead count gets a stepper control (+/-)
  - Severity levels get a dropdown (none/mild/moderate/severe)
- Heatmap zones: long-press a highlighted zone to see "Mark as false positive" option
- Add migration: `ALTER TABLE scan_sessions ADD COLUMN user_corrections JSONB DEFAULT NULL`
- Store both `ai_original` and `user_corrected` values
- When corrections exist, use corrected values in trend calculations
- Backend: corrections data could later be used to improve AI prompts

**Feature 4 - Product Usage Tracking:**
- New tables:
  - `user_products` (id, user_id, product_name, product_type, source: 'ai_recommended' | 'user_added', active: bool, created_at)
  - `product_usage_logs` (id, user_id, product_id, date, used: bool, time_of_day: 'am' | 'pm')
- After a scan generates recommendations, auto-populate `user_products` from AI response
- Users can also manually add products (dermatologist-prescribed)
- Routine tab: show product list with daily "Used today?" toggles (AM and PM sections)
- After 14+ days of logging, calculate usage statistics per product
- Insight card on home: "CeraVe Cleanser: used 18/21 days (86% compliance)"
- After 21+ days with 2+ scans, show correlation: "Since starting [product], your [metric] changed by X%"
- Push notification: "Time for your morning routine! Log your products."

**Feature 5 - Educational Content:**
- New table: `learn_articles` (id, title, slug, content_markdown, sources_json, tags, relevance_conditions, created_at, generated_by_model)
- New edge function `generate-learn-article`: Takes a topic + optional scan data, generates evidence-grounded article via GPT
- Pre-generate a library of 15-20 foundational articles on app launch topics:
  - "What causes acne?", "Understanding your skin type", "How stress affects your skin"
  - "Ingredients to look for", "Building a skincare routine", "When to see a dermatologist"
- Each article cites sources (AAD, JAAD, dermatology textbooks)
- Learn tab: scrollable article list, filtered by relevance to user's latest scan
- After each scan, surface 2-3 relevant articles: "Based on your scan, you might find these helpful"
- Article detail screen with markdown rendering
- "Was this helpful?" feedback button per article

---

### Phase 3: Lifestyle Intelligence (Features 6, 7, 8)
Habit tracking with correlations, scan cadence, daily missions.
This phase creates the daily engagement loop and ClearSkin AI's unique selling proposition.

**Feature 6 - Basic Habit Input + Correlation Insights:**
- New table: `daily_habits` (id, user_id, date, sleep_quality: 1-5, stress_level: 1-5, water_intake: bool, notes: text, created_at)
- Home screen: daily check-in card (3 inputs, takes ~10 seconds)
  - Sleep: star rating 1-5
  - Stress: emoji scale 1-5
  - Water: simple yes/no toggle
- Data accumulates for 21+ days
- New edge function `generate-habit-insights` or client-side calculation:
  - Aggregate habit data with scan metrics over time
  - Calculate correlations (e.g., Pearson correlation between stress level and redness %)
  - Generate natural-language insight cards
- Insights section on home screen (after 21 days of data):
  - "On days you rated sleep 4+, your skin score averaged 8% higher"
  - "Higher stress correlates with increased breakout severity"
  - "You drink enough water on 65% of days. Users who hydrate daily see better pore health."
- Weekly summary push notification: "Your skin intelligence summary is ready"

**Feature 7 - Structured Weekly Scan Cadence:**
- Add `preferred_scan_day` (0-6, day of week) and `scan_cadence_enabled` (bool) to `user_profiles`
- After first scan, prompt: "For the best progress tracking, we recommend scanning weekly. Which day works best?"
- Day picker (Mon-Sun)
- Home screen: "Next scan: Wednesday (3 days away)" countdown card
- Push notification on scan day morning: "It's scan day! Take a quick scan to track your progress."
- If user misses scan day, gentle reminder next day: "You missed your weekly scan. Scan today to stay on track."
- Trend visualization: highlight regular vs irregular scan intervals

**Feature 8 - Daily Missions:**
- New table: `daily_missions` (id, user_id, date, missions_json, completed_count, total_count)
- Mission types (template-based, contextual to user's state):
  - "Log your morning products" (if product tracking active)
  - "Complete your daily check-in" (habit input)
  - "Read today's skin tip" (educational)
  - "Take your weekly scan" (on scan days)
  - "Review your latest insights" (if insights available)
- Home screen: mission checklist widget (3-5 tasks per day)
- Missions auto-generate each morning based on user's active features
- Track daily completion rate
- Completion message: "All missions complete! You're taking great care of your skin."

---

### Phase 4: Engagement & Growth (Feature 9)
Gamification with streaks, badges, and achievements.

**Feature 9 - Gamification:**
- New tables:
  - `achievements` (id, name, description, icon, category, requirement_type, requirement_value)
  - `user_achievements` (id, user_id, achievement_id, earned_at)
  - Add `current_streak` and `longest_streak` columns to `user_profiles`
- Achievement categories:
  - **Scanning**: "First Scan", "5 Scans", "10 Scans", "3-Month Tracker"
  - **Consistency**: "7-Day Streak", "14-Day Streak", "30-Day Streak" (daily check-ins)
  - **Product Tracking**: "Product Logger" (7 days), "Routine Master" (30 days)
  - **Learning**: "Knowledge Seeker" (read 5 articles), "Skin Scholar" (read all articles)
  - **Improvement**: "First Improvement" (any metric improves), "Score Climber" (+10 score)
- Home screen: streak counter with flame icon
- Achievement notification when earned (in-app + push)
- New Achievements screen accessible from profile/settings
- Badge display on profile

---

## 6. Strategic Positioning

**Current ClearSkin AI**: A skin scanner that tells you what's wrong.
**Target ClearSkin AI**: A skin intelligence platform that tracks, correlates, and proves what works.

The key differentiator vs ALL competitors:
- **Skinepic** counts pimples and tracks habits separately. ClearSkin AI would CORRELATE them.
- **TroveSkin** has a skin diary but no intelligence layer. ClearSkin AI would show causation.
- **MDacne** focuses on treatment. ClearSkin AI would prove treatment effectiveness with data.

The "killer features" that no competitor has:
1. **Metric correlation insights** - "Your redness is 15% lower on days you slept 7+ hours"
2. **Product effectiveness proof** - "Niacinamide serum: used 20/21 days, oiliness reduced 12%"
3. **Confidence scoring** - "This scan has 91% confidence"
4. **8+ condition detection** - Not just acne. Comprehensive skin health.

---

## 7. Verification Plan

After implementing each phase:
- Test scan flow end-to-end with new features
- Verify database migrations don't break existing data
- Test notification delivery on both iOS and Android
- Validate correlation calculations with synthetic data
- User acceptance testing with 3-5 beta testers per phase
- Performance testing (ensure new features don't slow the app)

---

## Key Files That Will Be Modified

### Core screens:
- `app/(tabs)/home.tsx` - Daily check-in widget, mission list, insight cards, next scan countdown
- `app/(tabs)/routine.tsx` - Product usage toggles
- `app/(tabs)/latest.tsx` - Confidence score display
- `app/scan/result.tsx` - Manual AI correction UI, confidence score, supportive messaging
- `app/learn/` - Educational content (currently empty)
- `app/settings.tsx` - Notification preferences, scan cadence

### Backend:
- `supabase/functions/analyze-image/index.ts` - Add confidence scoring to AI prompt
- `supabase/migrations/` - New tables: notification_preferences, product_usage_logs, user_products, daily_habits, daily_missions, achievements
- New edge functions for correlation analysis and mission generation

### New components:
- Product usage toggle component
- Habit check-in widget
- Mission list component
- Insight card component
- Confidence score badge
- AI correction interface
