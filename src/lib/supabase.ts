import { createClient } from '@supabase/supabase-js'
import { Bizut, Parrain, Classement, BizutStats } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// ─── Auth ─────────────────────────────────────────────

export async function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('scan_parrain')
  }
}

export async function getCurrentUser(): Promise<Parrain | null> {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('scan_parrain')
  if (!stored) return null
  try {
    return JSON.parse(stored) as Parrain
  } catch {
    return null
  }
}

// ─── Bizuts ───────────────────────────────────────────

export async function getBizuts(): Promise<Bizut[]> {
  const { data, error } = await supabase.from('bizuts').select('*').order('nom')
  if (error) throw error
  return data || []
}

export async function uploadQuestionnaire(file: File, bizutId: string) {
  const path = `questionnaires/${bizutId}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('questionnaires')
    .upload(path, file, { upsert: true, contentType: 'application/pdf' })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('questionnaires').getPublicUrl(path)
  return publicUrl
}

// ─── Helpers Sécurité (Hash SHA-256) ───────────────────

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin.trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function isValidInsaEmail(email: string): boolean {
  const re = /^[A-Za-z0-9._%+-]+@insa-lyon\.fr$/
  return re.test(email.trim().toLowerCase())
}

// ─── Parrains Sécurisés ───────────────────────────────

export async function loginOrRegisterParrain(
  email: string,
  prenom: string,
  nom: string,
  pin: string
): Promise<Parrain> {
  const cleanEmail = email.trim().toLowerCase()
  if (!isValidInsaEmail(cleanEmail)) {
    throw new Error('Adresse email invalide. Utilise ton adresse @insa-lyon.fr')
  }
  if (!pin || pin.trim().length < 4) {
    throw new Error('Le code PIN doit comporter au moins 4 caractères.')
  }

  const pinHash = await hashPin(pin)

  const { data, error } = await supabase.rpc('login_or_register_parrain', {
    p_email: cleanEmail,
    p_prenom: prenom.trim(),
    p_nom: nom.trim(),
    p_pin_hash: pinHash,
  })

  if (error) {
    throw new Error(error.message)
  }

  const user = data && data[0] ? (data[0] as Parrain) : null
  if (!user) {
    throw new Error('Erreur de connexion. Vérifie tes identifiants.')
  }

  user.token = pinHash
  if (typeof window !== 'undefined') {
    localStorage.setItem('scan_parrain', JSON.stringify(user))
  }
  return user
}

export async function getParrains(): Promise<Parrain[]> {
  const { data, error } = await supabase.from('parrains').select('id, prenom, nom, email, is_admin, created_at').order('nom')
  if (error) throw error
  return data || []
}

// ─── Classements Sécurisés ────────────────────────────

export async function getClassements(): Promise<Classement[]> {
  const { data, error } = await supabase.from('classements').select('*')
  if (error) throw error
  return data || []
}

export async function upsertClassement(parrainId: string, pinHash: string, bizutId: string, position: number) {
  const { error } = await supabase.rpc('secure_upsert_classement', {
    p_parrain_id: parrainId,
    p_pin_hash: pinHash,
    p_bizut_id: bizutId,
    p_position: position,
  })
  if (error) throw error
}

export async function deleteClassement(parrainId: string, pinHash: string, position: number) {
  const { error } = await supabase.rpc('secure_delete_classement', {
    p_parrain_id: parrainId,
    p_pin_hash: pinHash,
    p_position: position,
  })
  if (error) throw error
}

export async function getMyClassements(parrainId: string): Promise<Classement[]> {
  const { data, error } = await supabase.from('classements').select('*').eq('parrain_id', parrainId)
  if (error) throw error
  return data || []
}

// ─── Stats ────────────────────────────────────────────

export async function getBizutStats(): Promise<BizutStats[]> {
  const { data, error } = await supabase.from('bizut_stats').select('*')
  if (error) throw error
  return data || []
}

// ─── Realtime ─────────────────────────────────────────

export function subscribeToClassements(callback: (payload: any) => void) {
  return supabase
    .channel('classements_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'classements' }, callback)
    .subscribe()
}
