'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  getOrCreateParrain,
  getBizuts,
  getParrains,
  getClassements,
  getBizutStats,
  supabase,
} from '@/lib/supabase'
import { Bizut, Parrain, Classement, BizutStats } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<Parrain | null>(null)
  const [bizuts, setBizuts] = useState<Bizut[]>([])
  const [parrains, setParrains] = useState<Parrain[]>([])
  const [classements, setClassements] = useState<Classement[]>([])
  const [stats, setStats] = useState<BizutStats[]>([])
  const [loading, setLoading] = useState(true)
  const [matchings, setMatchings] = useState<{parrain: Parrain; bizut: Bizut; score: number}[]>([])

  useEffect(() => {
    async function init() {
      const authUser = await getCurrentUser()
      if (!authUser) { router.push('/'); return }
      const prenom = authUser.user_metadata?.prenom || ''
      const nom = authUser.user_metadata?.nom || ''
      const parrain = await getOrCreateParrain(authUser.id, authUser.email!, prenom, nom)
      if (!parrain.is_admin) { router.push('/ranking/'); return }
      setUser(parrain)

      const [b, p, c, s] = await Promise.all([
        getBizuts(), getParrains(), getClassements(), getBizutStats(),
      ])
      setBizuts(b)
      setParrains(p)
      setClassements(c)
      setStats(s)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    const channel = supabase
      .channel('admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classements' }, async () => {
        const [c, s] = await Promise.all([getClassements(), getBizutStats()])
        setClassements(c)
        setStats(s)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const getParrainClassements = useCallback((parrainId: string) => {
    const map: Record<number, Bizut | null> = { 1: null, 2: null, 3: null }
    classements.filter((c) => c.parrain_id === parrainId).forEach((c) => {
      map[c.position] = bizuts.find((b) => b.id === c.bizut_id) || null
    })
    return map
  }, [classements, bizuts])

  const runMatching = useCallback(() => {
    const parrainsList = parrains.filter((p) => !p.is_admin)
    const bizutsList = [...bizuts]
    const prefs: Record<string, string[]> = {}
    const bizutPrefs: Record<string, string[]> = {}

    parrainsList.forEach((p) => {
      const pc = getParrainClassements(p.id)
      prefs[p.id] = [1, 2, 3].map((pos) => pc[pos]?.id).filter(Boolean) as string[]
    })

    bizutsList.forEach((b) => {
      const rankedParrains = parrainsList
        .map((p) => {
          const c = classements.find((cl) => cl.parrain_id === p.id && cl.bizut_id === b.id)
          return { id: p.id, score: c ? 4 - c.position : 0 }
        })
        .sort((a, b) => b.score - a.score)
        .map((x) => x.id)
      bizutPrefs[b.id] = rankedParrains.length > 0 ? rankedParrains : parrainsList.map((p) => p.id)
    })

    const freeParrains = new Set(parrainsList.map((p) => p.id))
    const matches: Record<string, string | null> = {}
    const parrainMatches: Record<string, string | null> = {}
    bizutsList.forEach((b) => (matches[b.id] = null))
    parrainsList.forEach((p) => (parrainMatches[p.id] = null))

    let iter = 0
    while (freeParrains.size > 0 && iter < 1000) {
      iter++
      const pId = freeParrains.values().next().value as string
      const pPrefs = prefs[pId] || []
      let matched = false
      for (const bId of pPrefs) {
        if (!bId) continue
        const currentP = matches[bId]
        if (currentP === null) {
          matches[bId] = pId
          parrainMatches[pId] = bId
          freeParrains.delete(pId)
          matched = true
          break
        } else {
          const bPrefList = bizutPrefs[bId] || []
          const currentRank = bPrefList.indexOf(currentP)
          const newRank = bPrefList.indexOf(pId)
          if (newRank !== -1 && (currentRank === -1 || newRank < currentRank)) {
            matches[bId] = pId
            parrainMatches[pId] = bId
            parrainMatches[currentP] = null
            freeParrains.add(currentP)
            freeParrains.delete(pId)
            matched = true
            break
          }
        }
      }
      if (!matched) freeParrains.delete(pId)
    }

    const result = Object.entries(parrainMatches)
      .filter(([, bId]) => bId !== null)
      .map(([pId, bId]) => {
        const p = parrainsList.find((x) => x.id === pId)!
        const b = bizutsList.find((x) => x.id === bId!)!
        const c = classements.find((cl) => cl.parrain_id === pId && cl.bizut_id === bId!)
        return { parrain: p, bizut: b, score: c ? c.position : 999 }
      })
    setMatchings(result)
  }, [parrains, bizuts, classements, stats, getParrainClassements])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">SCAN Parrainage — Promo 69-70</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runMatching}
            className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Lancer le matching
          </button>
          <button
            onClick={() => router.push('/ranking/')}
            className="text-sm font-medium px-4 py-2 rounded-md border hover:bg-muted transition-colors"
          >
            Retour classement
          </button>
        </div>
      </div>

      {matchings.length > 0 && (
        <div className="mb-8 rounded-xl border bg-card p-4">
          <h2 className="text-lg font-semibold mb-4">Résultats du matching ({matchings.length} attributions)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Parrain</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Bizut attribué</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Position choisie</th>
                </tr>
              </thead>
              <tbody>
                {matchings.map((m, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{m.parrain.prenom} {m.parrain.nom}</td>
                    <td className="py-2 px-3">{m.bizut.prenom} {m.bizut.nom}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        m.score === 1 ? 'bg-blue-100 text-blue-800' :
                        m.score === 2 ? 'bg-red-100 text-red-800' :
                        m.score === 3 ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {m.score <= 3 ? `#${m.score}` : 'Non classé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-8 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Stats globales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.bizut_id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{s.prenom} {s.nom}</span>
                <span className="text-xs text-muted-foreground">{s.total_votes} votes</span>
              </div>
              <div className="space-y-1">
                {[
                  { label: '#1', value: s.votes_1, color: 'bg-blue-500' },
                  { label: '#2', value: s.votes_2, color: 'bg-red-500' },
                  { label: '#3', value: s.votes_3, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs w-4 text-muted-foreground">{item.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / Math.max(s.total_votes, 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs w-5 text-right tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Récapitulatif des choix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Parrain</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">#1</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">#2</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">#3</th>
              </tr>
            </thead>
            <tbody>
              {parrains.filter((p) => !p.is_admin).map((p) => {
                const pc = getParrainClassements(p.id)
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{p.prenom} {p.nom}</td>
                    {[1, 2, 3].map((pos) => {
                      const b = pc[pos]
                      return (
                        <td key={pos} className="py-2 px-3">
                          {b ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              pos === 1 ? 'bg-blue-100 text-blue-800' :
                              pos === 2 ? 'bg-red-100 text-red-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {b.prenom} {b.nom}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
