-- DH TISSU — Demandes rendez-vous (formulaire site)
-- Exécutez dans Supabase → SQL Editor si la table n'existe pas encore

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

ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_admin_all" ON appointment_requests;
CREATE POLICY "appointments_admin_all" ON appointment_requests
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
