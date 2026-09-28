'use client'
 
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateParrain, selectExistingParrain, getParrains, getCurrentUser } from '@/lib/supabase'
import { Parrain } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parrains, setParrains] = useState<Parrain[]>([])
  const [selectedParrainId, setSelectedParrainId] = useState('')

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (user) {
        router.push(user.is_admin ? '/admin/' : '/ranking/')
        return
      }
      try {
        const list = await getParrains()
        setParrains(list)
      } catch (err) {
        console.error('Erreur chargement parrains:', err)
      }
    }
    init()
  }, [router])

  async function handleCreateOrLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !prenom || !nom) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const parrain = await getOrCreateParrain(email, prenom, nom)
      router.push(parrain.is_admin ? '/admin/' : '/ranking/')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Une erreur est survenue lors de la connexion.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectExisting(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedParrainId) return
    const parrain = parrains.find((p) => p.id === selectedParrainId)
    if (!parrain) return
    setLoading(true)
    try {
      await selectExistingParrain(parrain)
      router.push(parrain.is_admin ? '/admin/' : '/ranking/')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Erreur de sélection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">SCAN Parrainage</h1>
          <p className="text-muted-foreground">Promo 69-70 — Système de matching</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        {parrains.length > 0 && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Déjà inscrit ? Sélectionne ton profil :</h2>
            <form onSubmit={handleSelectExisting} className="space-y-3">
              <select
                value={selectedParrainId}
                onChange={(e) => setSelectedParrainId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Choisis ton nom --</option>
                {parrains.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom} ({p.email}){p.is_admin ? ' [Admin]' : ''}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading || !selectedParrainId}
                className="w-full rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? 'Connexion...' : 'Accéder avec ce profil'}
              </button>
            </form>
          </div>
        )}

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">
            {parrains.length > 0 ? 'Ou connecte-toi / inscris-toi :' : 'Connexion / Inscription :'}
          </h2>
          <form onSubmit={handleCreateOrLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Prénom</label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email INSA</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="prenom.nom@insa-lyon.fr"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Connexion...' : 'Accéder directement au classement'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
