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

export async function signInWithMagicLink(email: string, prenom: string, nom: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { prenom, nom },
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/ranking/' : undefined,
    },
  })
  return { error }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
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

export async function getOrCreateParrain(userId: string, email: string, prenom: string, nom: string): Promise<Parrain> {
  const { data: existing } = await supabase.from('parrains').select('*').eq('id', userId).single()
  if (existing) return existing as Parrain

  const { data, error } = await supabase.from('parrains').insert({
    id: userId,
    email,
    prenom,
    nom,
    is_admin: false,
  }).select().single()
  if (error) throw error
  return data as Parrain
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
