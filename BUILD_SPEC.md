# Opascope Angle Library — Build Specification

## Overview
A Next.js 15 (App Router) web application deployed on Vercel with Supabase as the database. This is a creative angle library for performance advertising — used to generate, store, browse, and share ad angles across clients and products.

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (Postgres)
- **AI:** Anthropic Claude API (claude-opus-4-6) for angle generation
- **Deployment:** Vercel
- **Auth:** None for MVP (team-shared tool)

## Supabase Config
- **Project ref:** yjiednocaxeenzhtgvtk
- **Region:** us-east-1
- **URL:** https://yjiednocaxeenzhtgvtk.supabase.co
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqaWVkbm9jYXhlZW56aHRndnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDcyMDksImV4cCI6MjA4OTY4MzIwOX0.Rn5MOijTAXMbAHzCAFle036Hff_ybOwGnaOFGtkSIxg
- **Service Role Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqaWVkbm9jYXhlZW56aHRndnRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDEwNzIwOSwiZXhwIjoyMDg5NjgzMjA5fQ.YUopYytCbDZVw_xVKUyMJYQ7QAtOXcU--TGXi1OVLIA

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://yjiednocaxeenzhtgvtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqaWVkbm9jYXhlZW56aHRndnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDcyMDksImV4cCI6MjA4OTY4MzIwOX0.Rn5MOijTAXMbAHzCAFle036Hff_ybOwGnaOFGtkSIxg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqaWVkbm9jYXhlZW56aHRndnRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDEwNzIwOSwiZXhwIjoyMDg5NjgzMjA5fQ.YUopYytCbDZVw_xVKUyMJYQ7QAtOXcU--TGXi1OVLIA
ANTHROPIC_API_KEY=<user will add manually>
```

## Database Schema (Supabase)

### Table: `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1', -- brand color for pills/tags
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_code TEXT NOT NULL, -- e.g., "PAS", "TSA", "TAX" — shown on cards
  color TEXT NOT NULL DEFAULT '#8b5cf6', -- pill color
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, slug)
);
```

### Table: `segments`
```sql
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('motivator', 'characteristic')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `angles`
```sql
CREATE TABLE angles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- the angle headline
  description TEXT NOT NULL, -- what this angle is about
  hooks JSONB NOT NULL DEFAULT '[]', -- array of 3 example hook strings
  segment_tags JSONB NOT NULL DEFAULT '[]', -- array of segment names (motivator + characteristic)
  psychology_tags JSONB NOT NULL DEFAULT '[]', -- e.g., ["contrast", "social-proof", "urgency"]
  awareness_stage TEXT CHECK (awareness_stage IN ('symptom', 'problem', 'solution', 'product', 'offer')),
  status TEXT NOT NULL DEFAULT 'untested' CHECK (status IN ('untested', 'testing', 'winner', 'fatigued', 'retired')),
  brief_prompt TEXT, -- generated prompt for OpenClaw brief creation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies
Disable RLS for all tables (team tool, no auth):
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE angles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON segments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON angles FOR ALL USING (true) WITH CHECK (true);
```

### Seed Data

**Clients:**
1. GOV+ (slug: govplus, color: #10b981)
2. BACtrack (slug: bactrack, color: #3b82f6)
3. SmartTools (slug: smarttools, color: #f59e0b)
4. Hotel Collection (slug: hotel-collection, color: #8b5cf6)
5. Aroma360 (slug: aroma360, color: #ec4899)

**Products (GOV+):**
- Passport (PAS, #10b981)
- TSA PreCheck (TSA, #6366f1)
- Taxes (TAX, #f59e0b)
- Birth Certificate (CER, #ef4444)
- Multi-Product (MULTI, #8b5cf6)

**Products (BACtrack):**
- BACtrack Mobile (MOB, #3b82f6)
- BACtrack View (VIEW, #ef4444)

**Products (SmartTools):**
- SmartCuffs 4.0 (SC4, #f59e0b)

**Products (Hotel Collection):**
- Studio Pro Diffuser (STUDIO, #8b5cf6)
- Fragrance Oils (OILS, #ec4899)
- Candles (CANDLE, #f59e0b)
- Bedding (BED, #3b82f6)

**Products (Aroma360):**
- Refillable Diffuser (REFILL, #ec4899)
- Museum Diffuser (MUSEUM, #8b5cf6)

## UI Design

Reference screenshot shows the existing design. Match this layout:

### Page Layout
- White/light background
- Top bar with "< Back" link, "Angle Library" title + total count, "+ Add Angle" button, and "✨ Generate Angles" button (purple gradient)
- Filter bar below: product pills with counts (All, Passport, TSA PreCheck, etc.) — colored pills
- Search bar: "Search hooks, concepts, headlines..."
- Sort dropdown: "Newest First" 
- Client selector dropdown/tabs above the product pills to switch between clients

### Angle Cards (3-column masonry/grid)
Each card has:
- **Product pill** (top-left, colored, e.g., green "TSA" or blue "PAS")
- **Checkbox** (top-right, for bulk selection)
- **Title** (bold, the angle headline — 1-2 lines)
- **Description** (gray text, 2-3 lines)
- **Example hook** (in a colored/tinted quote block — show ONE hook prominently)
- **Segment tags** (colored pills at bottom — motivator + characteristic names)
- **Psychology tags** (smaller colored pills below segment tags)

### Card Click → Detail Modal
When clicking a card, open a modal/slide-over showing:
- Full angle details (title, description, all 3 hooks, segments, psychology principles, awareness stage, status)
- **"Copy Brief Prompt" button** — copies a pre-generated prompt to clipboard that the user can paste into OpenClaw
- The prompt should include: the angle, the product, the client, the segments, and reference the playbook training

### Generate Angles Feature
"✨ Generate Angles" button opens a modal with:
- **Mode selector:** "Bulk Generate" (all products for a client) or "Single Product"
- **Client dropdown**
- **Product dropdown** (if single product mode)
- **Count:** How many angles to generate (default: 10 for single, 5 per product for bulk)
- **Additional context** (optional textarea)
- **Generate button**

Uses Anthropic API (server-side route) to generate angles. The generation prompt should incorporate:
- The client's segment plan (motivator + characteristic segments from DB)
- The product details
- Box scaling awareness stages
- Performance creative copy training principles (clarity over cleverness, the balance rule, etc.)
- Hooks guide frameworks (21 Makepeace bullets, callout types)
- Interesting ads playbook (entertainment/education balance)

Generated angles are saved to Supabase and appear in the library.

### Brief Prompt Template
When user clicks an angle card and hits "Copy Brief Prompt", generate a prompt like:

```
Create a performance creative brief for [Client] — [Product].

**Angle:** [angle title]
**Description:** [angle description]
**Example Hooks:** [hooks]
**Target Segments:** [segment tags]
**Awareness Stage:** [awareness stage]
**Psychology Principles:** [psychology tags]

Use the following training and playbooks:
- Performance Creative Copy Training (clarity over cleverness, the balance rule, fluff filter, approved CTAs)
- Box Scaling framework (match copy to the [awareness stage] stage)
- Hooks Guide (apply relevant hook frameworks)
- Interesting Ads Playbook (balance entertainment and education)

Reference the [Client] brand guidelines, messaging blueprint, and segment plan for brand voice and targeting specifics.

Generate the brief in the standard format with: concept name, format recommendation, hook options, headline, subheadline, body copy, CTA, and creative direction notes.
```

### Add Angle (Manual)
"+ Add Angle" opens a form modal:
- Client (dropdown)
- Product (dropdown, filtered by client)
- Title
- Description
- 3 hooks (text inputs)
- Segment tags (multi-select from client's segments)
- Psychology tags (multi-select or tag input)
- Awareness stage (dropdown)
- Status (dropdown)

## API Routes

### `GET /api/angles` — List angles with optional filters
Query params: `client_id`, `product_id`, `search`, `sort`

### `POST /api/angles` — Create angle(s)
Body: single angle or array of angles

### `PATCH /api/angles/[id]` — Update angle

### `DELETE /api/angles/[id]` — Delete angle

### `GET /api/clients` — List clients with products and segment counts

### `POST /api/generate` — Generate angles via Anthropic
Body: `{ client_id, product_id?, count, context? }`
Server-side: calls Anthropic API with system prompt incorporating all playbook training

### `GET /api/segments?client_id=X` — List segments for a client

## File Structure
```
app/
  layout.tsx
  page.tsx (main angle library page)
  globals.css
  api/
    angles/
      route.ts
      [id]/
        route.ts
    clients/
      route.ts
    segments/
      route.ts
    generate/
      route.ts
components/
  AngleCard.tsx
  AngleDetailModal.tsx
  AngleForm.tsx
  GenerateModal.tsx
  ClientSelector.tsx
  ProductFilter.tsx
  SearchBar.tsx
lib/
  supabase.ts (client)
  supabase-server.ts (service role for API routes)
  types.ts
  prompts.ts (AI generation prompts incorporating playbook training)
```

## Key Implementation Notes

1. **All playbook training is embedded in `lib/prompts.ts`** as system prompt context for the Anthropic API. This includes the core principles from Performance Creative Copy Training, Box Scaling, Hooks Guide, and Interesting Ads Playbook.

2. **Segment tags on cards** should be colored consistently — motivator segments in one color family, characteristic in another.

3. **Psychology tags** use the same taxonomy as the existing angle banks: contrast, social-proof, urgency, fear-of-missing-out, authority, mythbusting, problem-discovery, convenience, storytelling, identity, scarcity.

4. **The search** should search across title, description, and hooks text.

5. **Product pills with counts** should show the count of angles for each product, updating in real-time as filters change.

6. **Cards should show ONE prominent hook** in the tinted quote block (randomly selected from the 3), with all 3 visible in the detail modal.

7. Use `@supabase/supabase-js` for database access. Use `@supabase/ssr` for Next.js server-side usage if needed.

8. **No authentication** — this is a team tool accessed via URL.
