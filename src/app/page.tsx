'use client'
 
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginOrRegisterParrain, getCurrentUser, isValidInsaEmail } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (user) {
        router.push(user.is_admin ? '/admin/' : '/ranking/')
      }
    }
    init()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !pin) {
      setError('Veuillez remplir votre email et votre code PIN.')
      return
    }

    if (!isValidInsaEmail(cleanEmail)) {
      setError('Accès strictement réservé : adresse @insa-lyon.fr obligatoire.')
      return
    }

    if (pin.trim().length < 4) {
      setError('Le code PIN doit comporter au moins 4 caractères.')
      return
    }

    setLoading(true)
    try {
      const parrain = await loginOrRegisterParrain(cleanEmail, prenom, nom, pin)
      router.push(parrain.is_admin ? '/admin/' : '/ranking/')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Erreur lors de la connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            🔒 SCAN Promo 69-70 • Espace Sécurisé
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SCAN Parrainage</h1>
          <p className="text-sm text-muted-foreground">
            Connecte-toi avec ton email INSA et ton code PIN personnel
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Email INSA Lyon <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="prenom.nom@insa-lyon.fr"
                autoComplete="email"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Seules les adresses se terminant par @insa-lyon.fr sont acceptées.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Prénom <span className="text-muted-foreground text-[10px]">(si 1ère visite)</span>
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Jean"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Nom <span className="text-muted-foreground text-[10px]">(si 1ère visite)</span>
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Dupont"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Code PIN personnel (4 chiffres ou +) <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                placeholder="••••"
                autoComplete="current-password"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Choisis un code secret personnel pour protéger tes votes et éviter que quelqu'un d'autre ne les modifie.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Connexion en cours...' : 'Accéder au système de parrainage'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Institut National des Sciences Appliquées de Lyon • Section SCAN
        </div>
      </div>
    </div>
  )
}
