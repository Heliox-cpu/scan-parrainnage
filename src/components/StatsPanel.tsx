'use client'

import { BizutStats } from '@/types'

interface Props {
  stats: BizutStats[]
  maxVotes: number
}

export default function StatsPanel({ stats, maxVotes }: Props) {
  const safeMax = maxVotes || 1

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Stats temps réel — Combien de 2A ont classé chaque bizut
      </h3>
      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.bizut_id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{s.prenom} {s.nom}</span>
              <span className="text-xs text-muted-foreground">{s.total_votes} votes</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: '#1', value: s.votes_1, color: 'bg-blue-500' },
                { label: '#2', value: s.votes_2, color: 'bg-red-500' },
                { label: '#3', value: s.votes_3, color: 'bg-emerald-500' },
              ].map((item) => {
                const pct = (item.value / safeMax) * 100
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-4 text-muted-foreground">{item.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right tabular-nums">{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
