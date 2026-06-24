-- DH TISSU — Bucket Storage pour uploads admin (Vercel / production)
-- Supabase Dashboard → SQL Editor → exécuter ce script en entier

-- 1. Créer le bucket public « produits »
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Politiques (ré-exécutable : DROP puis CREATE)
DROP POLICY IF EXISTS "produits_public_read" ON storage.objects;
DROP POLICY IF EXISTS "produits_service_upload" ON storage.objects;
DROP POLICY IF EXISTS "produits_service_update" ON storage.objects;

-- Lecture publique des images
CREATE POLICY "produits_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produits');

-- Upload via l'API serveur (service role)
CREATE POLICY "produits_service_upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'produits');

CREATE POLICY "produits_service_update"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'produits');
