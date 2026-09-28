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

// ─── Parrains ─────────────────────────────────────────

export async function getOrCreateParrain(email: string, prenom: string, nom: string): Promise<Parrain> {
  const cleanEmail = email.trim().toLowerCase()
  const { data: existing } = await supabase
    .from('parrains')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle()
  
  if (existing) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('scan_parrain', JSON.stringify(existing))
    }
    return existing as Parrain
  }

  const { data, error } = await supabase.from('parrains').insert({
    email: cleanEmail,
    prenom: prenom.trim(),
    nom: nom.trim(),
    is_admin: false,
  }).select().single()

  if (error) throw error

  if (typeof window !== 'undefined') {
    localStorage.setItem('scan_parrain', JSON.stringify(data))
  }
  return data as Parrain
}

export async function selectExistingParrain(parrain: Parrain): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('scan_parrain', JSON.stringify(parrain))
  }
}

export async function getParrains(): Promise<Parrain[]> {
  const { data, error } = await supabase.from('parrains').select('*').order('nom')
  if (error) throw error
  return data || []
}

// ─── Classements ──────────────────────────────────────

export async function getClassements(): Promise<Classement[]> {
  const { data, error } = await supabase.from('classements').select('*')
  if (error) throw error
  return data || []
}

export async function upsertClassement(parrainId: string, bizutId: string, position: number) {
  const { error } = await supabase.rpc('upsert_classement', {
    p_parrain_id: parrainId,
    p_bizut_id: bizutId,
    p_position: position,
  })
  if (error) throw error
}

export async function deleteClassement(parrainId: string, position: number) {
  const { error } = await supabase.from('classements').delete().eq('parrain_id', parrainId).eq('position', position)
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
