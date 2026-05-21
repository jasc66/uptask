import { useState, useMemo } from 'react'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

const PRIORIDAD_CHIP = {
  Alta:    'bg-red-50 text-red-700 border-red-200',
  Media:   'bg-amber-50 text-amber-700 border-amber-200',
  Baja:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Urgente: 'bg-rose-50 text-rose-800 border-rose-200',
}
const ESTADO_CHIP = {
  'Pendiente':   'bg-slate-50 text-slate-600 border-slate-200',
  'En Progreso': 'bg-blue-50 text-blue-700 border-blue-200',
  'En Revisión': 'bg-amber-50 text-amber-700 border-amber-200',
  'Completada':  'bg-emerald-50 text-emerald-700 border-emerald-200',
}
const PRIORIDAD_DOT = { Alta: 'bg-red-400', Media: 'bg-amber-400', Baja: 'bg-emerald-400', Urgente: 'bg-rose-500' }
const ESTADO_DOT = { 'Pendiente': 'bg-slate-400', 'En Progreso': 'bg-blue-400', 'En Revisión': 'bg-amber-400', 'Completada': 'bg-emerald-400' }

const normalizeEstado = (e) => {
  if (e === true) return 'Completada'
  if (e === false || e == null) return 'Pendiente'
  return e
}

const dayOfWeekMon = (d) => (d.getDay() + 6) % 7  // Mon=0 … Sun=6

const dateKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const getDiasDelMes = (anio, mes) => {
  const primerDia = new Date(anio, mes, 1)
  const ultimoNum = new Date(anio, mes + 1, 0).getDate()
  const offset = dayOfWeekMon(primerDia)
  const dias = []
  for (let i = 0; i < offset; i++) {
    dias.push({ fecha: new Date(anio, mes, 1 - offset + i), mesActual: false })
  }
  for (let d = 1; d <= ultimoNum; d++) {
    dias.push({ fecha: new Date(anio, mes, d), mesActual: true })
  }
  const remaining = 42 - dias.length
  for (let i = 1; i <= remaining; i++) {
    dias.push({ fecha: new Date(anio, mes + 1, i), mesActual: false })
  }
  return dias
}

const getDiasDelaSemana = (fecha) => {
  const offset = dayOfWeekMon(fecha)
  const lunes = new Date(fecha)
  lunes.setDate(fecha.getDate() - offset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return d
  })
}

const MAX_CHIPS = 3

const CalendarioVista = ({ tareas, onTareaClick, onFechaChange, puedeEditar }) => {
  const hoy = useMemo(() => new Date(), [])
  const [fechaActual, setFechaActual] = useState(new Date())
  const [modo, setModo] = useState('mes')
  const [colorMode, setColorMode] = useState('prioridad')
  const [dragTareaId, setDragTareaId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const navPrev = () => {
    setFechaActual(prev => {
      const d = new Date(prev)
      if (modo === 'mes') d.setMonth(d.getMonth() - 1)
      else d.setDate(d.getDate() - 7)
      return d
    })
  }
  const navNext = () => {
    setFechaActual(prev => {
      const d = new Date(prev)
      if (modo === 'mes') d.setMonth(d.getMonth() + 1)
      else d.setDate(d.getDate() + 7)
      return d
    })
  }
  const irHoy = () => setFechaActual(new Date())

  const tareasPorDia = useMemo(() => {
    const mapa = {}
    ;(tareas ?? []).forEach(t => {
      if (!t.fechaEntrega) return
      const k = dateKey(new Date(t.fechaEntrega))
      if (!mapa[k]) mapa[k] = []
      mapa[k].push(t)
    })
    return mapa
  }, [tareas])

  const chipClass = (t) =>
    colorMode === 'prioridad'
      ? (PRIORIDAD_CHIP[t.prioridad] ?? 'bg-slate-50 text-slate-600 border-slate-200')
      : (ESTADO_CHIP[normalizeEstado(t.estado)] ?? 'bg-slate-50 text-slate-600 border-slate-200')

  const dotClass = (t) =>
    colorMode === 'prioridad'
      ? (PRIORIDAD_DOT[t.prioridad] ?? 'bg-slate-400')
      : (ESTADO_DOT[normalizeEstado(t.estado)] ?? 'bg-slate-400')

  const handleDragStart = (e, tareaId) => {
    if (!puedeEditar) return
    setDragTareaId(tareaId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, key) => {
    if (!puedeEditar || !dragTareaId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(key)
  }

  const handleDragLeave = () => setDropTarget(null)

  const handleDrop = (e, fecha) => {
    e.preventDefault()
    if (dragTareaId && onFechaChange) {
      onFechaChange(dragTareaId, fecha)
    }
    setDragTareaId(null)
    setDropTarget(null)
  }

  const renderChip = (tarea) => (
    <div
      key={tarea._id}
      draggable={puedeEditar}
      onDragStart={puedeEditar ? e => handleDragStart(e, tarea._id) : undefined}
      onDragEnd={() => { setDragTareaId(null); setDropTarget(null) }}
      onClick={e => { e.stopPropagation(); onTareaClick(tarea) }}
      title={tarea.nombre}
      className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border truncate select-none transition-opacity ${chipClass(tarea)} ${
        dragTareaId === tarea._id ? 'opacity-40' : 'opacity-100'
      } ${puedeEditar ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : 'cursor-pointer hover:opacity-70'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass(tarea)}`} />
      <span className="truncate">{tarea.nombre}</span>
    </div>
  )

  const renderCelda = (fecha, mesActual) => {
    const key = dateKey(fecha)
    const tareasDelDia = tareasPorDia[key] ?? []
    const esHoy = isSameDay(fecha, hoy)
    const isDrop = dropTarget === key

    return (
      <div
        key={key}
        onDragOver={e => handleDragOver(e, key)}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, new Date(fecha))}
        className={`min-h-[88px] p-1.5 border-b border-r border-slate-100 transition-colors ${
          !mesActual ? 'bg-slate-50/70' : 'bg-white'
        } ${isDrop ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300' : ''}`}
      >
        <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 text-xs font-semibold ${
          esHoy
            ? 'bg-indigo-600 text-white'
            : mesActual ? 'text-slate-700' : 'text-slate-400'
        }`}>
          {fecha.getDate()}
        </div>
        <div className="space-y-0.5">
          {tareasDelDia.slice(0, MAX_CHIPS).map(renderChip)}
          {tareasDelDia.length > MAX_CHIPS && (
            <p className="text-[10px] text-slate-400 pl-1">+{tareasDelDia.length - MAX_CHIPS} más</p>
          )}
        </div>
      </div>
    )
  }

  const diasMes = useMemo(
    () => getDiasDelMes(fechaActual.getFullYear(), fechaActual.getMonth()),
    [fechaActual]
  )
  const diasSemana = useMemo(() => getDiasDelaSemana(fechaActual), [fechaActual])

  const tituloHeader = () => {
    if (modo === 'mes') {
      return `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`
    }
    const inicio = diasSemana[0]
    const fin = diasSemana[6]
    const fmt = { day: 'numeric', month: 'short' }
    const fmtFin = { day: 'numeric', month: 'short', year: 'numeric' }
    if (inicio.getMonth() === fin.getMonth()) {
      return `${inicio.getDate()} – ${fin.toLocaleDateString('es-MX', fmtFin)}`
    }
    return `${inicio.toLocaleDateString('es-MX', fmt)} – ${fin.toLocaleDateString('es-MX', fmtFin)}`
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Barra de navegación */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <button onClick={navPrev} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-800 min-w-[180px] text-center">{tituloHeader()}</span>
          <button onClick={navNext} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={irHoy}
            className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors ml-1"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {['prioridad', 'estado'].map(m => (
              <button
                key={m}
                onClick={() => setColorMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                  colorMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'prioridad' ? 'Prioridad' : 'Estado'}
              </button>
            ))}
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {[['mes','Mes'],['semana','Semana']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setModo(val)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  modo === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {modo === 'mes'
          ? diasMes.map(({ fecha, mesActual }) => renderCelda(fecha, mesActual))
          : diasSemana.map(fecha => renderCelda(fecha, true))
        }
      </div>

      {/* Leyenda */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
        <span className="text-xs text-slate-400 font-medium">Leyenda:</span>
        {colorMode === 'prioridad'
          ? [['Alta','bg-red-400'],['Media','bg-amber-400'],['Baja','bg-emerald-400'],['Urgente','bg-rose-500']].map(([lbl, dot]) => (
              <span key={lbl} className="flex items-center gap-1 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${dot}`} />{lbl}
              </span>
            ))
          : [['Pendiente','bg-slate-400'],['En Progreso','bg-blue-400'],['En Revisión','bg-amber-400'],['Completada','bg-emerald-400']].map(([lbl, dot]) => (
              <span key={lbl} className="flex items-center gap-1 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${dot}`} />{lbl}
              </span>
            ))
        }
        {puedeEditar && (
          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Arrastra para cambiar fecha
          </span>
        )}
      </div>
    </div>
  )
}

export default CalendarioVista
