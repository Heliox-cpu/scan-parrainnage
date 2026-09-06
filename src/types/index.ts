export interface Bizut {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  pdf_url: string;
  created_at: string;
}

export interface Parrain {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface Classement {
  id: string;
  parrain_id: string;
  bizut_id: string;
  position: number;
  created_at: string;
}

export interface BizutStats {
  bizut_id: string;
  prenom: string;
  nom: string;
  votes_1: number;
  votes_2: number;
  votes_3: number;
  total_votes: number;
}

export interface Matching {
  id: string;
  parrain_id: string;
  bizut_id: string;
  score: number;
  created_at: string;
}
