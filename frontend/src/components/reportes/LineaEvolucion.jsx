import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const formatMes = (mes) => {
  const [, m] = (mes ?? '').split('-')
  return MESES_ES[Number(m) - 1] ?? mes
}

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs space-y-1">
      <p className="font-medium text-slate-700 capitalize">{formatMes(label)}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

const LineaEvolucion = ({ datos = [] }) => {
  if (!datos.length) {
    return <div className="flex items-center justify-center h-full text-xs text-slate-400">Sin datos</div>
  }
  const formateados = datos.map(d => ({ ...d, label: formatMes(d.mes) }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formateados} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipCustom />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
        <Line type="monotone" dataKey="creadas" name="Creadas" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="completadas" name="Completadas" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="vencidas" name="Vencidas" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default LineaEvolucion
