'use client'

import { useState } from 'react'
import { Bizut } from '@/types'

interface Props {
  bizut: Bizut | null
  onClose: () => void
}

export default function PdfViewer({ bizut, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  if (!bizut) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl h-[85vh] bg-background rounded-xl border shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <div>
            <h3 className="text-sm font-semibold">{bizut.prenom} {bizut.nom}</h3>
            <p className="text-xs text-muted-foreground">Questionnaire</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-muted-foreground animate-pulse">Chargement du PDF...</div>
            </div>
          )}
          <iframe
            src={bizut.pdf_url}
            className="w-full h-full"
            onLoad={() => setLoading(false)}
            title={`PDF ${bizut.prenom} ${bizut.nom}`}
          />
        </div>
      </div>
    </div>
  )
}
