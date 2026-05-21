import { memo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORES = {
  'Baja':    '#94a3b8',
  'Media':   '#f59e0b',
  'Alta':    '#f97316',
  'Urgente': '#ef4444',
}

const TooltipCustom = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-slate-700">{payload[0].payload.prioridad}</p>
      <p className="text-slate-500">{payload[0].value} tarea{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

const BarrasPrioridad = ({ datos = [], altura = 208 }) => {
  if (!datos.length) {
    return <div className="flex items-center justify-center h-full text-xs text-slate-400">Sin datos</div>
  }
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={datos} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="prioridad" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipCustom />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
          {datos.map((entry, i) => (
            <Cell key={i} fill={COLORES[entry.prioridad] ?? '#818cf8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const sonIguales = (prev, next) =>
  prev.altura === next.altura && JSON.stringify(prev.datos) === JSON.stringify(next.datos)

export default memo(BarrasPrioridad, sonIguales)
