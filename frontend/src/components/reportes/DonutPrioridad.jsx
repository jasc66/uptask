import { memo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
      <p className="font-medium text-slate-700">{payload[0].name}</p>
      <p className="text-slate-500">{payload[0].value} tarea{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

const DonutPrioridad = ({ datos = [], altura = 208 }) => {
  if (!datos.length) {
    return <div className="flex items-center justify-center h-full text-xs text-slate-400">Sin datos</div>
  }
  const entries = datos.map(d => ({ name: d.prioridad, value: d.count }))
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <PieChart>
        <Pie
          data={entries}
          cx="50%"
          cy="45%"
          innerRadius="50%"
          outerRadius="75%"
          paddingAngle={2}
          dataKey="value"
        >
          {entries.map((entry, i) => (
            <Cell key={i} fill={COLORES[entry.name] ?? '#818cf8'} />
          ))}
        </Pie>
        <Tooltip content={<TooltipCustom />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

const sonIguales = (prev, next) =>
  prev.altura === next.altura && JSON.stringify(prev.datos) === JSON.stringify(next.datos)

export default memo(DonutPrioridad, sonIguales)
