'use client'

import type { ReactNode } from 'react'

interface StatCardProps {
  titre: string
  valeur: string
  sousTitre?: string
  icone: ReactNode
  couleur: 'bleu' | 'violet' | 'orange' | 'vert'
}

const COULEURS = {
  bleu: { bg: 'bg-blue-50', icone: 'bg-blue-100 text-blue-600', valeur: 'text-blue-700' },
  violet: { bg: 'bg-violet-50', icone: 'bg-violet-100 text-violet-600', valeur: 'text-violet-700' },
  orange: { bg: 'bg-orange-50', icone: 'bg-orange-100 text-orange-600', valeur: 'text-orange-700' },
  vert: { bg: 'bg-green-50', icone: 'bg-green-100 text-green-600', valeur: 'text-green-700' },
}

export default function StatCard(props: StatCardProps) {
  const c = COULEURS[props.couleur]

  return (
    <div className={`rounded-xl p-5 ${c.bg} flex items-start gap-4`}>
      <div className={`rounded-lg p-2.5 ${c.icone} shrink-0`}>
        {props.icone}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {props.titre}
        </p>
        <p className={`text-xl font-bold mt-0.5 truncate ${c.valeur}`}>
          {props.valeur}
        </p>
        {props.sousTitre ? (
          <p className="text-xs text-gray-400 mt-0.5">{props.sousTitre}</p>
        ) : null}
      </div>
    </div>
  )
}
