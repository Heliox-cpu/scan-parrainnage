-- Migration 003_protect_bizuts_and_storage.sql
-- Renforcement maximal de la sécurité des données personnelles des bizuts (photos, contacts, emails)

-- 1. Verrouiller la table bizuts : lecture seule pour le public, aucune modification permise depuis l'API publique
REVOKE INSERT, UPDATE, DELETE ON bizuts FROM anon, authenticated;

-- On s'assure que les politiques RLS n'autorisent QUE la lecture (SELECT)
DROP POLICY IF EXISTS "bizuts_select_all" ON bizuts;
CREATE POLICY "bizuts_select_all" ON bizuts FOR SELECT USING (true);

-- 2. Fonction RPC sécurisée pour récupérer les bizuts uniquement si l'étudiant est authentifié avec un PIN valide
CREATE OR REPLACE FUNCTION get_bizuts_authenticated(
  p_parrain_id UUID,
  p_pin_hash TEXT
)
RETURNS TABLE (
  id UUID,
  prenom TEXT,
  nom TEXT,
  email TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Vérification stricte du PIN
  SELECT (pin_hash = p_pin_hash) INTO v_valid 
  FROM parrains 
  WHERE parrains.id = p_parrain_id;

  IF v_valid IS NOT TRUE THEN
    RAISE EXCEPTION 'Non autorisé : vous devez être connecté avec votre compte INSA et votre code PIN pour voir les bizuts.';
  END IF;

  RETURN QUERY SELECT 
    bizuts.id,
    bizuts.prenom,
    bizuts.nom,
    bizuts.email,
    bizuts.pdf_url,
    bizuts.created_at
  FROM bizuts
  ORDER BY bizuts.nom ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Accorder l'exécution de la fonction aux rôles publics
GRANT EXECUTE ON FUNCTION get_bizuts_authenticated(UUID, TEXT) TO anon, authenticated;

-- 4. Sécurité Supabase Storage (Bucket questionnaires)
-- Interdire à quiconque d'écrire, modifier ou effacer les fichiers PDF du bucket
-- Seule la lecture des objets existants est autorisée
CREATE POLICY "questionnaires_read_only"
ON storage.objects FOR SELECT
USING (bucket_id = 'questionnaires');

DROP POLICY IF EXISTS "questionnaires_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "questionnaires_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "questionnaires_delete_policy" ON storage.objects;
