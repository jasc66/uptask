import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend,
} from 'recharts'

const PALETA = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16']

const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const formatMes = (m) => {
  if (!m || typeof m !== 'string') return String(m ?? '')
  const [, mes] = m.split('-')
  const idx = Number(mes) - 1
  return MESES_ES[idx] ?? m
}

const formatGrupo = (g, agrupacion) => {
  if (g === null || g === undefined || g === '') return 'Sin valor'
  if (agrupacion === 'mes') return formatMes(g)
  return String(g)
}

const LABELS_METRICA = {
  count: 'Total',
  completadas: 'Completadas',
  pendientes: 'Pendientes',
  vencidas: 'Vencidas',
  tiempoEstimadoTotal: 'H. estimadas',
  tiempoRealTotal: 'H. reales',
  activos: 'Activos',
  completados: 'Completados',
  pausados: 'Pausados',
  cancelados: 'Cancelados',
  tareasAsignadas: 'T. asignadas',
  tareasCompletadas: 'T. completadas',
}

const labelMetrica = (m) => LABELS_METRICA[m] ?? m

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs space-y-0.5">
      <p className="font-medium text-slate-700">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{labelMetrica(p.name)}: {p.value}</p>
      ))}
    </div>
  )
}

const EstadoVacio = ({ mensaje = 'Sin datos para mostrar' }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <p className="text-sm font-medium text-slate-600">{mensaje}</p>
    <p className="text-xs text-slate-400 mt-1">Ajusta los filtros o la agrupación</p>
  </div>
)

const Skeleton = () => (
  <div className="animate-pulse space-y-3 py-6">
    <div className="h-6 bg-slate-100 rounded w-48" />
    <div className="h-40 bg-slate-100 rounded-lg" />
  </div>
)

const PreviewReporte = ({ datos, visualizacion = 'tabla', cargando = false }) => {
  if (cargando) return <Skeleton />
  if (!datos) return <EstadoVacio mensaje="Sin vista previa todavía" />

  const { filas = [], tipo, agrupacion, columnas = [] } = datos
  const metricCols = columnas.filter(c => c !== 'grupo')

  if (!filas.length) return <EstadoVacio />

  // KPI
  if (tipo === 'kpi' || agrupacion === 'ninguno' || visualizacion === 'kpi') {
    const fila = filas[0] || {}
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metricCols.map((m, i) => (
          <div key={m} className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{labelMetrica(m)}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: PALETA[i % PALETA.length] }}>
              {fila[m] ?? 0}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const datosFormat = filas.map(f => ({
    ...f,
    label: formatGrupo(f.grupo, agrupacion),
  }))

  // BARRAS
  if (visualizacion === 'barras') {
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={datosFormat} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<TooltipCustom />} cursor={{ fill: '#f8fafc' }} />
            {metricCols.length > 1 && (
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }}
                formatter={(v) => labelMetrica(v)} />
            )}
            {metricCols.map((m, i) => (
              <Bar key={m} dataKey={m} fill={PALETA[i % PALETA.length]} radius={[4, 4, 0, 0]} barSize={metricCols.length === 1 ? 40 : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // LINEAS
  if (visualizacion === 'lineas') {
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height={256}>
          <LineChart data={datosFormat} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<TooltipCustom />} />
            {metricCols.length > 1 && (
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }}
                formatter={(v) => labelMetrica(v)} />
            )}
            {metricCols.map((m, i) => (
              <Line key={m} type="monotone" dataKey={m}
                stroke={PALETA[i % PALETA.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // DONUT
  if (visualizacion === 'donut') {
    const metrica = metricCols[0]
    const datosPie = datosFormat.map(d => ({ name: d.label, value: d[metrica] || 0 }))
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height={256}>
          <PieChart>
            <Pie data={datosPie} cx="50%" cy="50%" innerRadius="48%" outerRadius="75%" paddingAngle={2} dataKey="value">
              {datosPie.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
            </Pie>
            <Tooltip content={<TooltipCustom />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // TABLA (default)
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-200">
            {columnas.map((c, i) => (
              <th key={c} className={`px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i > 0 ? 'text-right' : ''}`}>
                {c === 'grupo' ? (agrupacion === 'ninguno' ? 'Categoría' : labelAgrupacion(agrupacion)) : labelMetrica(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datosFormat.map((f, idx) => (
            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-700 font-medium">{f.label}</td>
              {metricCols.map(m => (
                <td key={m} className="px-3 py-2 text-slate-600 text-right tabular-nums">{f[m] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const labelAgrupacion = (a) => ({
  estado: 'Estado',
  prioridad: 'Prioridad',
  responsable: 'Responsable',
  proyecto: 'Proyecto',
  mes: 'Mes',
  area: 'Área',
  rol: 'Rol',
}[a] ?? a)

export { PreviewReporte as default, labelMetrica, labelAgrupacion }
