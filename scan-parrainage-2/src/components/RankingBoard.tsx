'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core'
import { Bizut, Classement } from '@/types'
import BizutCard from './BizutCard'

interface Props {
  bizuts: Bizut[]
  myClassements: Classement[]
  onUpdateRank: (bizutId: string | null, position: number | null) => void
  onViewPdf: (bizut: Bizut) => void
}

function RankZone({ position, label, bizut, onViewPdf }: {
  position: number
  label: string
  bizut: Bizut | null
  onViewPdf: (b: Bizut) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `rank-${position}` })
  const colors = ['border-blue-300 bg-blue-50', 'border-red-300 bg-red-50', 'border-emerald-300 bg-emerald-50']
  const badgeColors = ['text-blue-700 bg-blue-100', 'text-red-700 bg-red-100', 'text-emerald-700 bg-emerald-100']

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-xl border-2 border-dashed p-4 min-h-[100px] transition-colors
        ${isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}
        ${bizut ? colors[position - 1] : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${badgeColors[position - 1]}`}>
          #{position} {label}
        </span>
        {bizut && (
          <button
            onClick={() => onUpdateRank(null, position)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Retirer
          </button>
        )}
      </div>
      {bizut ? (
        <BizutCard bizut={bizut} onViewPdf={onViewPdf} isInRank />
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">Glisse un bizut ici</p>
      )}
    </div>
  )
}

export default function RankingBoard({ bizuts, myClassements, onUpdateRank, onViewPdf }: Props) {
  const [activeBizut, setActiveBizut] = useState<Bizut | null>(null)

  const getBizutById = useCallback((id: string) => bizuts.find((b) => b.id === id) || null, [bizuts])

  const ranks: Record<number, Bizut | null> = {
    1: getBizutById(myClassements.find((c) => c.position === 1)?.bizut_id || ''),
    2: getBizutById(myClassements.find((c) => c.position === 2)?.bizut_id || ''),
    3: getBizutById(myClassements.find((c) => c.position === 3)?.bizut_id || ''),
  }

  const usedBizutIds = new Set(myClassements.map((c) => c.bizut_id))
  const availableBizuts = bizuts.filter((b) => !usedBizutIds.has(b.id))

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    const bizut = getBizutById(id)
    setActiveBizut(bizut)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveBizut(null)
    if (!over) return

    const bizutId = active.id as string
    const overId = over.id as string

    if (overId.startsWith('rank-')) {
      const position = parseInt(overId.replace('rank-', ''))
      onUpdateRank(bizutId, position)
    } else if (overId === 'pool') {
      // Retirer du classement
      const existingPos = myClassements.find((c) => c.bizut_id === bizutId)?.position
      if (existingPos) onUpdateRank(null, existingPos)
    }
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } },
    }),
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pool */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Bizuts disponibles ({availableBizuts.length})
          </h3>
          <PoolDroppable>
            <div className="space-y-2 min-h-[200px]">
              {availableBizuts.map((bizut) => (
                <BizutCard key={bizut.id} bizut={bizut} onViewPdf={onViewPdf} />
              ))}
              {availableBizuts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Tous les bizuts sont classés !</p>
              )}
            </div>
          </PoolDroppable>
        </div>

        {/* Ranks */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Mon classement
          </h3>
          {[1, 2, 3].map((pos) => (
            <RankZone
              key={pos}
              position={pos}
              label={pos === 1 ? 'Premier choix' : pos === 2 ? 'Deuxième choix' : 'Troisième choix'}
              bizut={ranks[pos]}
              onViewPdf={onViewPdf}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeBizut ? <BizutCard bizut={activeBizut} onViewPdf={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function PoolDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed p-3 transition-colors ${isOver ? 'border-primary bg-primary/5' : 'border-border'}`}
    >
      {children}
    </div>
  )
}
