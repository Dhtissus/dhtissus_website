-- DH TISSU — Schéma Supabase
-- Exécutez ce script dans : Supabase Dashboard → SQL Editor → New query

-- ── Collections ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  image       TEXT,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Produits ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  collection_slug TEXT NOT NULL REFERENCES collections(slug) ON UPDATE CASCADE,
  name            TEXT NOT NULL,
  price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL DEFAULT 'coupon',
  coupon          NUMERIC(6, 2),
  width           NUMERIC(6, 2),
  colors          JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_fit       TEXT,
  image           TEXT,
  images          JSONB NOT NULL DEFAULT '[]'::jsonb,
  description     TEXT,
  details         TEXT,
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_collections JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand           TEXT,
  available       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_slug);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- ── Paramètres site ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('whatsapp', '212600000000')
ON CONFLICT (key) DO NOTHING;

-- ── Statistiques / événements ─────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id              BIGSERIAL PRIMARY KEY,
  event_type      TEXT NOT NULL,
  product_id      TEXT REFERENCES products(id) ON DELETE SET NULL,
  collection_slug TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);

-- ── Demandes rendez-vous (formulaire) ───────────────────────
CREATE TABLE IF NOT EXISTS appointment_requests (
  id           BIGSERIAL PRIMARY KEY,
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  project_type TEXT NOT NULL,
  message      TEXT,
  status       TEXT NOT NULL DEFAULT 'new',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointment_requests(status);

-- ── Trigger updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE collections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- Lecture publique (site vitrine)
CREATE POLICY "collections_public_read" ON collections
  FOR SELECT USING (true);

CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (true);

CREATE POLICY "settings_public_read" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "analytics_public_insert" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Écriture réservée aux utilisateurs authentifiés (admin)
CREATE POLICY "collections_admin_all" ON collections
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "settings_admin_all" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "analytics_admin_read" ON analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "appointments_admin_all" ON appointment_requests
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
