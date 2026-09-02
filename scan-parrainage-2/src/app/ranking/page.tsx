'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  getBizuts,
  getOrCreateParrain,
  getMyClassements,
  getBizutStats,
  upsertClassement,
  deleteClassement,
  subscribeToClassements,
  signOut,
  supabase,
} from '@/lib/supabase'
import { Bizut, Parrain, Classement, BizutStats } from '@/types'
import RankingBoard from '@/components/RankingBoard'
import StatsPanel from '@/components/StatsPanel'
import PdfViewer from '@/components/PdfViewer'

export default function RankingPage() {
  const router = useRouter()
  const [user, setUser] = useState<Parrain | null>(null)
  const [bizuts, setBizuts] = useState<Bizut[]>([])
  const [myClassements, setMyClassements] = useState<Classement[]>([])
  const [stats, setStats] = useState<BizutStats[]>([])
  const [pdfBizut, setPdfBizut] = useState<Bizut | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Auth + init
  useEffect(() => {
    async function init() {
      const authUser = await getCurrentUser()
      if (!authUser) {
        router.push('/')
        return
      }
      const prenom = authUser.user_metadata?.prenom || ''
      const nom = authUser.user_metadata?.nom || ''
      const parrain = await getOrCreateParrain(authUser.id, authUser.email!, prenom, nom)
      setUser(parrain)

      const [b, mc, st] = await Promise.all([
        getBizuts(),
        getMyClassements(parrain.id),
        getBizutStats(),
      ])
      setBizuts(b)
      setMyClassements(mc)
      setStats(st)
      setLoading(false)
    }
    init()
  }, [router])

  // Realtime sync
  useEffect(() => {
    if (!user) return
    const channel = subscribeToClassements(async () => {
      const [mc, st] = await Promise.all([
        getMyClassements(user.id),
        getBizutStats(),
      ])
      setMyClassements(mc)
      setStats(st)
    })
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleUpdateRank = useCallback(async (bizutId: string | null, position: number | null) => {
    if (!user || position === null) return
    setSaving(true)
    try {
      if (bizutId === null) {
        await deleteClassement(user.id, position)
      } else {
        await upsertClassement(user.id, bizutId, position)
      }
      const [mc, st] = await Promise.all([
        getMyClassements(user.id),
        getBizutStats(),
      ])
      setMyClassements(mc)
      setStats(st)
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [user])

  const maxVotes = Math.max(...stats.map((s) => Math.max(s.votes_1, s.votes_2, s.votes_3)), 1)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SCAN Parrainage</h1>
          <p className="text-sm text-muted-foreground">
            {user ? `Connecté en tant que ${user.prenom} ${user.nom}` : '...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-muted-foreground animate-pulse">Sauvegarde...</span>
          )}
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </div>
          {user?.is_admin && (
            <button
              onClick={() => router.push('/admin')}
              className="text-xs font-medium px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
            >
              Panel admin
            </button>
          )}
          <button
            onClick={async () => { await signOut(); router.push('/') }}
            className="text-xs font-medium px-3 py-1.5 rounded-md border hover:bg-muted transition-colors text-muted-foreground"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ranking */}
        <div className="xl:col-span-2">
          <RankingBoard
            bizuts={bizuts}
            myClassements={myClassements}
            onUpdateRank={handleUpdateRank}
            onViewPdf={setPdfBizut}
          />
        </div>

        {/* Stats */}
        <div className="xl:col-span-1">
          <StatsPanel stats={stats} maxVotes={maxVotes} />
        </div>
      </div>

      {pdfBizut && <PdfViewer bizut={pdfBizut} onClose={() => setPdfBizut(null)} />}
    </div>
  )
}
