-- Opascope Angle Library — Supabase Schema + Seed Data
-- Run this in the Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_code TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, slug)
);

CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('motivator', 'characteristic')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS angles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hooks JSONB NOT NULL DEFAULT '[]',
  segment_tags JSONB NOT NULL DEFAULT '[]',
  psychology_tags JSONB NOT NULL DEFAULT '[]',
  awareness_stage TEXT CHECK (awareness_stage IN ('symptom', 'problem', 'solution', 'product', 'offer')),
  status TEXT NOT NULL DEFAULT 'untested' CHECK (status IN ('untested', 'testing', 'winner', 'fatigued', 'retired')),
  brief_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS (open access — team tool, no auth)
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE angles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON segments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON angles FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED: Clients
-- ============================================

INSERT INTO clients (name, slug, color) VALUES
  ('GOV+', 'govplus', '#10b981'),
  ('BACtrack', 'bactrack', '#3b82f6'),
  ('SmartTools', 'smarttools', '#f59e0b'),
  ('Hotel Collection', 'hotel-collection', '#8b5cf6'),
  ('Aroma360', 'aroma360', '#ec4899')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED: Products
-- ============================================

-- GOV+
INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Passport', 'passport', 'PAS', '#10b981' FROM clients WHERE slug = 'govplus'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'TSA PreCheck', 'tsa-precheck', 'TSA', '#6366f1' FROM clients WHERE slug = 'govplus'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Taxes', 'taxes', 'TAX', '#f59e0b' FROM clients WHERE slug = 'govplus'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Birth Certificate', 'birth-certificate', 'CER', '#ef4444' FROM clients WHERE slug = 'govplus'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Multi-Product', 'multi-product', 'MULTI', '#8b5cf6' FROM clients WHERE slug = 'govplus'
ON CONFLICT (client_id, slug) DO NOTHING;

-- BACtrack
INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'BACtrack Mobile', 'bactrack-mobile', 'MOB', '#3b82f6' FROM clients WHERE slug = 'bactrack'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'BACtrack View', 'bactrack-view', 'VIEW', '#ef4444' FROM clients WHERE slug = 'bactrack'
ON CONFLICT (client_id, slug) DO NOTHING;

-- SmartTools
INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'SmartCuffs 4.0', 'smartcuffs-4', 'SC4', '#f59e0b' FROM clients WHERE slug = 'smarttools'
ON CONFLICT (client_id, slug) DO NOTHING;

-- Hotel Collection
INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Studio Pro Diffuser', 'studio-pro', 'STUDIO', '#8b5cf6' FROM clients WHERE slug = 'hotel-collection'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Fragrance Oils', 'fragrance-oils', 'OILS', '#ec4899' FROM clients WHERE slug = 'hotel-collection'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Candles', 'candles', 'CANDLE', '#f59e0b' FROM clients WHERE slug = 'hotel-collection'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Bedding', 'bedding', 'BED', '#3b82f6' FROM clients WHERE slug = 'hotel-collection'
ON CONFLICT (client_id, slug) DO NOTHING;

-- Aroma360
INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Refillable Diffuser', 'refillable-diffuser', 'REFILL', '#ec4899' FROM clients WHERE slug = 'aroma360'
ON CONFLICT (client_id, slug) DO NOTHING;

INSERT INTO products (client_id, name, slug, short_code, color)
SELECT id, 'Museum Diffuser', 'museum-diffuser', 'MUSEUM', '#8b5cf6' FROM clients WHERE slug = 'aroma360'
ON CONFLICT (client_id, slug) DO NOTHING;

-- ============================================
-- SEED: Segments (GOV+)
-- ============================================

INSERT INTO segments (client_id, name, type, description)
SELECT c.id, s.name, s.type, s.description
FROM clients c
CROSS JOIN (VALUES
  ('Convenience Seeker', 'motivator', 'Wants easy, do-it-from-home process'),
  ('Error Avoider', 'motivator', 'Worried about making mistakes on forms'),
  ('Time Saver', 'motivator', 'Hates lines and wasted time'),
  ('Deadline Driven', 'motivator', 'Upcoming trip or deadline creating urgency'),
  ('Tech-Averse Simplifier', 'motivator', 'Not tech savvy, wants step-by-step guidance'),
  ('Cost Conscious', 'motivator', 'Comparing service costs, wants value'),
  ('First Timer', 'characteristic', 'Never done this process before'),
  ('Renewal/Repeat', 'characteristic', 'Has done this before, wants it faster this time'),
  ('Busy Parent', 'characteristic', 'Managing family docs with limited time'),
  ('Senior (55+)', 'characteristic', 'Primary demographic, may need extra guidance'),
  ('Frequent Traveler', 'characteristic', 'Flies often, values speed and convenience'),
  ('Young Professional', 'characteristic', 'Career-focused, efficiency-oriented')
) AS s(name, type, description)
WHERE c.slug = 'govplus';

-- ============================================
-- SEED: Segments (BACtrack)
-- ============================================

INSERT INTO segments (client_id, name, type, description)
SELECT c.id, s.name, s.type, s.description
FROM clients c
CROSS JOIN (VALUES
  ('DUI Fear / Legal Protection', 'motivator', 'Afraid of the financial and career consequences of a DUI'),
  ('The Perception Gap', 'motivator', 'Curious how drunk they actually are vs. how they feel'),
  ('Health & Performance', 'motivator', 'Tracking BAC as part of wellness/biohacking lifestyle'),
  ('Trust Rebuilding', 'motivator', 'Proving sobriety to family, courts, or partners'),
  ('Responsible Hosting', 'motivator', 'Ensuring guests are safe to drive'),
  ('Relationship Tension', 'motivator', 'Partner or family member concerned about drinking habits'),
  ('Moderation, Not Abstinence', 'motivator', 'Wants to drink less, not quit — data helps'),
  ('Parental Responsibility', 'motivator', 'Parents modeling responsible drinking for kids'),
  ('The Social Drinker', 'characteristic', 'Regular social situations with alcohol'),
  ('The Weekend Warrior', 'characteristic', 'Heavy weekend consumption, work week sober'),
  ('The Wine Parent', 'characteristic', 'Parents who drink wine nightly'),
  ('The Craft Enthusiast', 'characteristic', 'Craft beer/whiskey/wine collectors'),
  ('The Quantified Self', 'characteristic', 'Wearable/data-driven health trackers'),
  ('The Recovery Supporter', 'characteristic', 'Supporting someone in recovery'),
  ('The Young Professional', 'characteristic', 'Career at stake, social drinking culture')
) AS s(name, type, description)
WHERE c.slug = 'bactrack';

-- ============================================
-- SEED: Segments (SmartTools)
-- ============================================

INSERT INTO segments (client_id, name, type, description)
SELECT c.id, s.name, s.type, s.description
FROM clients c
CROSS JOIN (VALUES
  ('Injury Recovery / Rehab', 'motivator', 'Post-surgical patients needing muscle rebuild at low loads'),
  ('Joint Pain / Low-Impact', 'motivator', 'Arthritis or chronic pain — cant tolerate heavy loads'),
  ('Age-Related Muscle Loss', 'motivator', 'Sarcopenia prevention for 50+ adults'),
  ('Athletic Performance', 'motivator', 'Competitive athletes wanting edge with lighter loads'),
  ('Clinical Practice', 'motivator', 'PTs and clinics wanting affordable BFR for patients'),
  ('The Rehab Patient', 'characteristic', 'Currently in PT or post-surgical recovery'),
  ('The Aging Athlete', 'characteristic', 'Former athlete dealing with joint issues'),
  ('The PT Professional', 'characteristic', 'Physical therapist looking for clinic equipment'),
  ('The Educated Fitness Enthusiast', 'characteristic', 'Researches training science, reads studies'),
  ('The Pain Avoider', 'characteristic', 'Stopped exercising due to joint pain')
) AS s(name, type, description)
WHERE c.slug = 'smarttools';

-- ============================================
-- SEED: Segments (Hotel Collection)
-- ============================================

INSERT INTO segments (client_id, name, type, description)
SELECT c.id, s.name, s.type, s.description
FROM clients c
CROSS JOIN (VALUES
  ('Hotel Nostalgia', 'motivator', 'Wants to recreate the feeling of a luxury hotel stay at home'),
  ('Home Impresser', 'motivator', 'Wants guests to compliment their home'),
  ('Self-Treat / Daily Luxury', 'motivator', 'Small daily indulgence, treat-yourself energy'),
  ('Gift Giver', 'motivator', 'Looking for impressive, unique gifts'),
  ('Scent Obsessed', 'motivator', 'Collects fragrances, always trying new scents'),
  ('The Lifestyle Upgrader', 'characteristic', 'Investing in home aesthetics and experience'),
  ('The Candle-to-Diffuser Convert', 'characteristic', 'Currently burns candles, ready to upgrade'),
  ('The Entertainer', 'characteristic', 'Hosts frequently, cares about ambiance'),
  ('The New Homeowner', 'characteristic', 'Just moved, building their home identity')
) AS s(name, type, description)
WHERE c.slug = 'hotel-collection';

-- ============================================
-- SEED: Segments (Aroma360)
-- ============================================

INSERT INTO segments (client_id, name, type, description)
SELECT c.id, s.name, s.type, s.description
FROM clients c
CROSS JOIN (VALUES
  ('Scent Branding', 'motivator', 'Businesses wanting signature scent for their space'),
  ('Home Luxury', 'motivator', 'Premium home fragrance experience'),
  ('Wellness / Mood', 'motivator', 'Using scent for relaxation, focus, or energy'),
  ('The Business Owner', 'characteristic', 'Retail, hotel, spa, or office — commercial use'),
  ('The Luxury Home Buyer', 'characteristic', 'High-end home decor and lifestyle'),
  ('The Interior Designer', 'characteristic', 'Specifying products for client projects')
) AS s(name, type, description)
WHERE c.slug = 'aroma360';

-- ============================================
-- INDEX for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_angles_client_id ON angles(client_id);
CREATE INDEX IF NOT EXISTS idx_angles_product_id ON angles(product_id);
CREATE INDEX IF NOT EXISTS idx_products_client_id ON products(client_id);
CREATE INDEX IF NOT EXISTS idx_segments_client_id ON segments(client_id);
