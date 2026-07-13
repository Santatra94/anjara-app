'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { PointCA } from '@/types/dashboard'

interface GraphiqueCAProps {
  data: PointCA[]
}

function formatMontant(valeur: number): string {
  if (valeur >= 1000000) {
    return (valeur / 1000000).toFixed(1) + 'M'
  }
  if (valeur >= 1000) {
    return (valeur / 1000).toFixed(0) + 'k'
  }
  return valeur.toString()
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: fr })
  } catch {
    return dateStr
  }
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">
        {label ? formatDate(label) : ''}
      </p>
      <p className="text-sm font-semibold text-blue-600">
        {Number(payload[0].value).toLocaleString('fr-MG')} Ar
      </p>
    </div>
  )
}

export default function GraphiqueCA({ data }: GraphiqueCAProps) {
  const aDesData = data.some((d) => d.ca > 0)

  if (!aDesData) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Aucune donnée sur cette période
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval={6}
        />
        <YAxis
          tickFormatter={formatMontant}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="ca"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorCA)"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
