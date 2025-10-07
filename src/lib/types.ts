export type ScanRow = {
  id: string;
  status: 'pending'|'processing'|'complete'|'failed';
  created_at: string;
  user_id: string;

  skin_score: number | null;
  skin_potential: number | null;
  skin_health_percent: number | null;
  skin_type: 'oily'|'dry'|'combination'|'normal'|'unknown'|null;
  breakout_level: 'none'|'minimal'|'moderate'|'high'|'unknown'|null;
  acne_prone_level: 'none'|'minimal'|'moderate'|'high'|'unknown'|null;
  oiliness_percent: number | null;
  pore_health: number | null;

  summary: any;
  issues: any[];
  watchlist_areas: any[];
  am_routine: any[];
  pm_routine: any[];
  products: any[];

  front_path: string | null;
  left_path: string | null;
  right_path: string | null;
  heatmap_breakouts_path: string | null;
  heatmap_oil_dry_path: string | null;
};
