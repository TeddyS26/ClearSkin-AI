// User Profile Types
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface UserProfile {
  id?: string;
  user_id: string;
  date_of_birth: string | null;
  gender: Gender | null;
  age: number | null;
  profile_edited: boolean;
  profile_edited_at: string | null;
  free_scan_used_at: string | null;
  free_scan_month: number | null;
  free_scan_year: number | null;
  created_at: string;
  updated_at: string;
}

// Scan Session Types
export interface ScanSession {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  created_at: string;
  
  // Photo paths
  front_path: string | null;
  left_path: string | null;
  right_path: string | null;
  
  // User context
  user_context: string | null;
  
  // Core scores
  skin_score: number | null;
  skin_potential: number | null;
  skin_health_percent: number | null;
  skin_type: 'oily' | 'dry' | 'combination' | 'normal' | 'unknown';
  
  // Skin age (NEW)
  skin_age: number | null;
  skin_age_comparison: string | null;
  skin_age_confidence: number | null;
  
  // Condition levels
  breakout_level: 'none' | 'minimal' | 'moderate' | 'high' | 'unknown';
  acne_prone_level: 'none' | 'minimal' | 'moderate' | 'high' | 'unknown';
  scarring_level: 'none' | 'mild' | 'moderate' | 'severe' | 'unknown';
  redness_percent: number | null;
  razor_burn_level: 'none' | 'mild' | 'moderate' | 'severe' | 'unknown';
  blackheads_level: 'none' | 'mild' | 'moderate' | 'severe' | 'unknown';
  blackheads_estimated_count: number | null;
  oiliness_percent: number | null;
  pore_health: number | null;
  
  // JSON fields
  summary: { notes?: string } | null;
  issues: Array<{
    type: string;
    severity: 'none' | 'minimal' | 'moderate' | 'high';
    area: string;
    confidence: number;
  }> | null;
  region_scores: Record<string, Record<string, number | null>> | null;
  watchlist_areas: Array<{
    area: string;
    reason: string;
  }> | null;
  am_routine: Array<{
    step: number;
    what: string;
    why: string;
  }> | null;
  pm_routine: Array<{
    step: number;
    what: string;
    why: string;
  }> | null;
  products: Array<{
    name: string;
    type: string;
    reason: string;
    url?: string;
    price?: number;
    tags?: string[];
  }> | null;
  overlays: {
    front?: HeatmapOverlays;
    left?: HeatmapOverlays;
    right?: HeatmapOverlays;
  } | null;
}

export interface HeatmapOverlays {
  breakouts: number[][][];
  oiliness: number[][][];
  dryness: number[][][];
  redness: number[][][];
}

// Subscription Types
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired';

export interface Subscription {
  id?: string;
  user_id: string;
  stripe_subscription_id: string;
  plan: string;
  scans_per_week: number;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// Auth Context Types
export interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
