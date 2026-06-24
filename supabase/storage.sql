-- DH TISSU — Bucket Storage pour uploads admin (Vercel / production)
-- Supabase Dashboard → SQL Editor → exécuter ce script

INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Lecture publique des images
CREATE POLICY IF NOT EXISTS "produits_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'produits');

-- Upload réservé au service role (API serveur)
CREATE POLICY IF NOT EXISTS "produits_service_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produits');

CREATE POLICY IF NOT EXISTS "produits_service_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'produits');
