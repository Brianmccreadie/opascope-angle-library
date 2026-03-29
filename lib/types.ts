export interface Client {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
  products?: Product[];
  segments?: Segment[];
}

export interface Product {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  short_code: string;
  color: string;
  created_at: string;
  angle_count?: number;
}

export interface Segment {
  id: string;
  client_id: string;
  name: string;
  type: 'motivator' | 'characteristic';
  description: string | null;
  created_at: string;
}

export interface Angle {
  id: string;
  client_id: string;
  product_id: string;
  title: string;
  description: string;
  hooks: string[];
  segment_tags: string[];
  psychology_tags: string[];
  awareness_stage: 'symptom' | 'problem' | 'solution' | 'product' | 'offer' | null;
  status: 'untested' | 'testing' | 'winner' | 'fatigued' | 'retired';
  brief_prompt: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  client?: Client;
}

export const PSYCHOLOGY_TAGS = [
  'contrast',
  'social-proof',
  'urgency',
  'fear-of-missing-out',
  'authority',
  'mythbusting',
  'problem-discovery',
  'convenience',
  'storytelling',
  'identity',
  'scarcity',
] as const;

export const AWARENESS_STAGES = [
  'symptom',
  'problem',
  'solution',
  'product',
  'offer',
] as const;

export const STATUS_OPTIONS = [
  'untested',
  'testing',
  'winner',
  'fatigued',
  'retired',
] as const;
