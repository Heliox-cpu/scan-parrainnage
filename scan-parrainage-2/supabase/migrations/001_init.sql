-- 001_init.sql
-- Active l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table bizuts (questionnaires)
CREATE TABLE IF NOT EXISTS bizuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table parrains (2A)
CREATE TABLE IF NOT EXISTS parrains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table classements
CREATE TABLE IF NOT EXISTS classements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_id UUID REFERENCES parrains(id) ON DELETE CASCADE,
  bizut_id UUID REFERENCES bizuts(id) ON DELETE CASCADE,
  position INT NOT NULL CHECK (position BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parrain_id, position),
  UNIQUE(parrain_id, bizut_id)
);

-- Table résultats matching (admin)
CREATE TABLE IF NOT EXISTS matchings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_id UUID REFERENCES parrains(id) ON DELETE CASCADE,
  bizut_id UUID REFERENCES bizuts(id) ON DELETE CASCADE,
  score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parrain_id),
  UNIQUE(bizut_id)
);

-- Policies RLS
ALTER TABLE bizuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parrains ENABLE ROW LEVEL SECURITY;
ALTER TABLE classements ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchings ENABLE ROW LEVEL SECURITY;

-- Bizuts : tout le monde peut lire
CREATE POLICY "bizuts_select_all" ON bizuts FOR SELECT USING (true);

-- Parrains : tout le monde peut lire (pour les stats)
CREATE POLICY "parrains_select_all" ON parrains FOR SELECT USING (true);

-- Classements : tout le monde peut lire (stats publiques)
CREATE POLICY "classements_select_all" ON classements FOR SELECT USING (true);
CREATE POLICY "classements_insert_own" ON classements FOR INSERT WITH CHECK (true);
CREATE POLICY "classements_update_own" ON classements FOR UPDATE USING (true);
CREATE POLICY "classements_delete_own" ON classements FOR DELETE USING (true);

-- Matchings : tout le monde peut lire
CREATE POLICY "matchings_select_all" ON matchings FOR SELECT USING (true);

-- Fonction pour upsert classement
CREATE OR REPLACE FUNCTION upsert_classement(
  p_parrain_id UUID,
  p_bizut_id UUID,
  p_position INT
) RETURNS VOID AS $$
BEGIN
  DELETE FROM classements WHERE parrain_id = p_parrain_id AND position = p_position;
  DELETE FROM classements WHERE parrain_id = p_parrain_id AND bizut_id = p_bizut_id;
  INSERT INTO classements (parrain_id, bizut_id, position) VALUES (p_parrain_id, p_bizut_id, p_position);
END;
$$ LANGUAGE plpgsql;

-- Vue agrégée des stats
CREATE OR REPLACE VIEW bizut_stats AS
SELECT 
  b.id AS bizut_id,
  b.prenom,
  b.nom,
  COUNT(c.position) FILTER (WHERE c.position = 1) AS votes_1,
  COUNT(c.position) FILTER (WHERE c.position = 2) AS votes_2,
  COUNT(c.position) FILTER (WHERE c.position = 3) AS votes_3,
  COUNT(c.id) AS total_votes
FROM bizuts b
LEFT JOIN classements c ON b.id = c.bizut_id
GROUP BY b.id, b.prenom, b.nom;
