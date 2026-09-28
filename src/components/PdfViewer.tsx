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
          <div className="flex items-center gap-2">
            <a
              href={bizut.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-2.5 py-1 rounded border bg-background hover:bg-muted transition-colors flex items-center gap-1"
            >
              <span>Ouvrir dans un onglet</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 relative bg-muted/20">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="text-sm text-muted-foreground animate-pulse">Chargement du PDF...</div>
            </div>
          )}
          <object
            data={bizut.pdf_url}
            type="application/pdf"
            className="w-full h-full"
            onLoad={() => setLoading(false)}
          >
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(bizut.pdf_url)}&embedded=true`}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              title={`PDF ${bizut.prenom} ${bizut.nom}`}
            />
          </object>
        </div>
      </div>
    </div>
  )
}
