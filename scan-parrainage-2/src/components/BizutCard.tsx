'use client'

import { useDraggable } from '@dnd-kit/core'
import { Bizut } from '@/types'

interface Props {
  bizut: Bizut
  onViewPdf: (bizut: Bizut) => void
  isInRank?: boolean
}

export default function BizutCard({ bizut, onViewPdf, isInRank = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: bizut.id,
    data: { bizut },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const initials = `${bizut.prenom[0]}${bizut.nom[0]}`.toUpperCase()

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`
        flex items-center gap-3 p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing
        transition-shadow hover:shadow-sm
        ${isDragging ? 'opacity-50 ring-2 ring-primary' : ''}
        ${isInRank ? 'border-primary/30 bg-primary/5' : 'border-border'}
      `}
    >
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{bizut.prenom} {bizut.nom}</p>
        <p className="text-xs text-muted-foreground">SCAN</p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onViewPdf(bizut); }}
        className="shrink-0 text-xs font-medium text-accent-foreground bg-accent hover:bg-accent/80 px-2 py-1 rounded-md transition-colors"
      >
        PDF
      </button>
    </div>
  )
}
