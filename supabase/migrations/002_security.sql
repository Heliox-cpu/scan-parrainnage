-- Migration 002_security_pin_and_insa_check.sql
-- Active l'extension pgcrypto pour le hashage de mots de passe / PINs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ajout de la contrainte domaine email INSA Lyon
ALTER TABLE parrains 
  DROP CONSTRAINT IF EXISTS check_insa_email;
ALTER TABLE parrains 
  ADD CONSTRAINT check_insa_email 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@insa-lyon\.fr$');

-- 2. Ajout de la colonne pin_hash pour stocker le hash SHA-256 du code PIN (jamais en clair)
ALTER TABLE parrains 
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 3. Fonction sécurisée RPC pour s'enregistrer ou se connecter avec un PIN
CREATE OR REPLACE FUNCTION login_or_register_parrain(
  p_email TEXT,
  p_prenom TEXT,
  p_nom TEXT,
  p_pin_hash TEXT
)
RETURNS TABLE (
  id UUID,
  prenom TEXT,
  nom TEXT,
  email TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  token TEXT
) AS $$
DECLARE
  v_parrain RECORD;
  v_clean_email TEXT;
BEGIN
  v_clean_email := LOWER(TRIM(p_email));

  -- Vérification email INSA Lyon côté DB
  IF NOT (v_clean_email ~* '^[A-Za-z0-9._%+-]+@insa-lyon\.fr$') THEN
    RAISE EXCEPTION 'Adresse email invalide. Seules les adresses @insa-lyon.fr sont autorisées.';
  END IF;

  -- Recherche du parrain existant
  SELECT * INTO v_parrain FROM parrains WHERE parrains.email = v_clean_email;

  IF FOUND THEN
    -- Si le compte a un PIN configuré, on vérifie
    IF v_parrain.pin_hash IS NOT NULL AND v_parrain.pin_hash != '' THEN
      IF v_parrain.pin_hash != p_pin_hash THEN
        RAISE EXCEPTION 'Code PIN incorrect pour ce compte.';
      END IF;
    ELSE
      -- Premier enregistrement du PIN pour un ancien compte
      UPDATE parrains SET pin_hash = p_pin_hash WHERE parrains.id = v_parrain.id;
    END IF;

    RETURN QUERY SELECT 
      v_parrain.id,
      v_parrain.prenom,
      v_parrain.nom,
      v_parrain.email,
      v_parrain.is_admin,
      v_parrain.created_at,
      p_pin_hash AS token;
  ELSE
    -- Nouveau parrain
    IF TRIM(p_prenom) = '' OR TRIM(p_nom) = '' THEN
      RAISE EXCEPTION 'Prénom et nom requis.';
    END IF;

    RETURN QUERY
    INSERT INTO parrains (email, prenom, nom, pin_hash, is_admin)
    VALUES (v_clean_email, TRIM(p_prenom), TRIM(p_nom), p_pin_hash, FALSE)
    RETURNING 
      parrains.id,
      parrains.prenom,
      parrains.nom,
      parrains.email,
      parrains.is_admin,
      parrains.created_at,
      p_pin_hash AS token;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Sécurisation de l'upsert classement avec vérification du PIN
CREATE OR REPLACE FUNCTION secure_upsert_classement(
  p_parrain_id UUID,
  p_pin_hash TEXT,
  p_bizut_id UUID,
  p_position INT
) RETURNS VOID AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Vérifie que le PIN fourni correspond bien à ce parrain
  SELECT (pin_hash = p_pin_hash) INTO v_valid
  FROM parrains 
  WHERE id = p_parrain_id;

  IF v_valid IS NOT TRUE THEN
    RAISE EXCEPTION 'Non autorisé: code PIN invalide pour modifier ces votes.';
  END IF;

  IF p_position NOT BETWEEN 1 AND 3 THEN
    RAISE EXCEPTION 'Position invalide (doit être entre 1 et 3).';
  END IF;

  DELETE FROM classements WHERE parrain_id = p_parrain_id AND position = p_position;
  DELETE FROM classements WHERE parrain_id = p_parrain_id AND bizut_id = p_bizut_id;
  INSERT INTO classements (parrain_id, bizut_id, position) VALUES (p_parrain_id, p_bizut_id, p_position);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Sécurisation de la suppression d'un classement avec vérification du PIN
CREATE OR REPLACE FUNCTION secure_delete_classement(
  p_parrain_id UUID,
  p_pin_hash TEXT,
  p_position INT
) RETURNS VOID AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  SELECT (pin_hash = p_pin_hash) INTO v_valid
  FROM parrains 
  WHERE id = p_parrain_id;

  IF v_valid IS NOT TRUE THEN
    RAISE EXCEPTION 'Non autorisé: code PIN invalide.';
  END IF;

  DELETE FROM classements WHERE parrain_id = p_parrain_id AND position = p_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verrouillage RLS
-- Empêche quiconque de modifier ou supprimer directement la table parrains / classements via l'API REST publique
-- sans passer par les fonctions RPC sécurisées
REVOKE INSERT, UPDATE, DELETE ON parrains FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON classements FROM anon, authenticated;

-- On accorde l'exécution des fonctions sécurisées
GRANT EXECUTE ON FUNCTION login_or_register_parrain(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION secure_upsert_classement(UUID, TEXT, UUID, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION secure_delete_classement(UUID, TEXT, INT) TO anon, authenticated;
