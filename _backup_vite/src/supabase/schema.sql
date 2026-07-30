-- BeautyGlowry PostgreSQL Database Schema for Supabase
-- Concept: Dosage: Dermatological Precision

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer', 'content_editor')),
  skin_type TEXT,
  is_online BOOLEAN DEFAULT false,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Skin Types & Concerns Taxonomy
CREATE TABLE IF NOT EXISTS public.skin_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.concerns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Ingredients Taxonomy & Glossary
CREATE TABLE IF NOT EXISTS public.ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  inci_name VARCHAR(160) NOT NULL,
  slug VARCHAR(160) UNIQUE NOT NULL,
  description TEXT,
  benefits TEXT,
  cautions TEXT
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug VARCHAR(180) UNIQUE,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  category TEXT NOT NULL,
  image TEXT,
  description TEXT,
  how_to_use TEXT,
  stock INT DEFAULT 50,
  is_new BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
  label VARCHAR(60) NOT NULL,
  sku VARCHAR(60) UNIQUE NOT NULL,
  stock_quantity INT DEFAULT 50,
  price_override NUMERIC(10, 2)
);

-- 6. Product Ingredients Join Table (Formulation Readout Source)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES public.ingredients(id) ON DELETE CASCADE,
  concentration_pct NUMERIC(4, 1) NOT NULL,
  is_key_ingredient BOOLEAN DEFAULT false,
  PRIMARY KEY (product_id, ingredient_id)
);

-- 7. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  gender TEXT DEFAULT 'Unisex',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Filters Table
CREATE TABLE IF NOT EXISTS public.filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INT DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_method TEXT DEFAULT 'Cash on Delivery',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Quiz & Consultation Bookings
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL,
  recommended_product_ids INT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultation_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'Confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Subscriptions & Wishlists
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
  frequency_weeks INT DEFAULT 4,
  status TEXT DEFAULT 'Active',
  next_delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, product_id)
);

-- 13. Invites & CMS
CREATE TABLE IF NOT EXISTS public.invites (
  email TEXT PRIMARY KEY,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cms (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms ENABLE ROW LEVEL SECURITY;

-- Public Read & Full Access Policies
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read filters" ON public.filters FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public read cms" ON public.cms FOR SELECT USING (true);

CREATE POLICY "All access products" ON public.products FOR ALL USING (true);
CREATE POLICY "All access categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "All access filters" ON public.filters FOR ALL USING (true);
CREATE POLICY "All access orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "All access reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "All access users" ON public.users FOR ALL USING (true);
CREATE POLICY "All access invites" ON public.invites FOR ALL USING (true);
CREATE POLICY "All access cms" ON public.cms FOR ALL USING (true);
