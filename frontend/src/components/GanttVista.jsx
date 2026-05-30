import { useEffect, useRef, useState, useMemo } from 'react'
import Gantt from 'frappe-gantt'
import '../styles/frappe-gantt.css'

const VIEW_MODES = ['Day', 'Week', 'Month']

const ESTADO_PROGRESO = {
  'Pendiente': 0,
  'En Progreso': 50,
  'En Revisión': 75,
  'Completada': 100,
}

const ESTADO_CLASE = {
  'Pendiente': 'gantt-estado-pendiente',
  'En Progreso': 'gantt-estado-progreso',
  'En Revisión': 'gantt-estado-revision',
  'Completada': 'gantt-estado-completada',
}

const toIsoDate = (fecha) => {
  if (!fecha) return null
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

const GanttVista = ({ tareas = [], onTareaClick, onFechaChange, puedeEditar }) => {
  const containerRef = useRef(null)
  const ganttRef = useRef(null)
  const [viewMode, setViewMode] = useState('Week')

  const { tareasGantt, tareasSinFecha } = useMemo(() => {
    const visibles = (tareas ?? []).filter(t => !t.tareaPadre)
    const idsVisibles = new Set(visibles.map(t => t._id))
    const conFecha = []
    const sinFecha = []
    for (const t of visibles) {
      const fin = toIsoDate(t.fechaEntrega)
      const inicio = toIsoDate(t.fechaInicio) || fin
      if (!fin) { sinFecha.push(t); continue }
      const deps = (t.dependencias ?? [])
        .filter(d => d.tipo === 'depende_de' && d.tarea?._id && idsVisibles.has(d.tarea._id))
        .map(d => d.tarea._id)
        .join(',')
      const estado = t.estado ?? 'Pendiente'
      conFecha.push({
        id: t._id,
        name: t.nombre,
        start: inicio,
        end: fin,
        progress: ESTADO_PROGRESO[estado] ?? 0,
        dependencies: deps,
        custom_class: ESTADO_CLASE[estado] ?? '',
      })
    }
    return { tareasGantt: conFecha, tareasSinFecha: sinFecha }
  }, [tareas])

  useEffect(() => {
    if (!containerRef.current) return
    if (tareasGantt.length === 0) {
      containerRef.current.innerHTML = ''
      ganttRef.current = null
      return
    }
    containerRef.current.innerHTML = ''
    ganttRef.current = new Gantt(containerRef.current, tareasGantt, {
      view_mode: viewMode,
      bar_height: 28,
      padding: 18,
      language: 'es',
      readonly: !puedeEditar,
      popup: ({ task, set_details }) => {
        set_details(`
          <strong>${task.name}</strong><br/>
          ${task.start} → ${task.end}<br/>
          Progreso: ${task.progress}%
        `)
      },
      on_click: (task) => {
        const original = (tareas ?? []).find(t => t._id === task.id)
        if (original && onTareaClick) onTareaClick(original)
      },
      on_date_change: (task, start, end) => {
        if (!puedeEditar || !onFechaChange) return
        const fechaIso = end instanceof Date ? end.toISOString() : new Date(end).toISOString()
        onFechaChange(task.id, fechaIso)
      },
    })
  }, [tareasGantt, viewMode, puedeEditar])

  if ((tareas ?? []).filter(t => !t.tareaPadre).length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
          <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">Sin tareas para mostrar en el Gantt</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <style>{`
        .gantt-container .bar-wrapper .bar { fill: #6366f1; }
        .gantt-container .bar-wrapper .bar-progress { fill: #4338ca; }
        .gantt-container .bar-wrapper.gantt-estado-pendiente .bar { fill: #94a3b8; }
        .gantt-container .bar-wrapper.gantt-estado-pendiente .bar-progress { fill: #64748b; }
        .gantt-container .bar-wrapper.gantt-estado-progreso .bar { fill: #3b82f6; }
        .gantt-container .bar-wrapper.gantt-estado-progreso .bar-progress { fill: #1d4ed8; }
        .gantt-container .bar-wrapper.gantt-estado-revision .bar { fill: #f59e0b; }
        .gantt-container .bar-wrapper.gantt-estado-revision .bar-progress { fill: #b45309; }
        .gantt-container .bar-wrapper.gantt-estado-completada .bar { fill: #10b981; }
        .gantt-container .bar-wrapper.gantt-estado-completada .bar-progress { fill: #047857; }
        .gantt-container .bar-wrapper .bar-label { font-size: 12px; font-weight: 500; }
        .gantt-container .grid-header { fill: #f8fafc; }
        .gantt-container .lower-text, .gantt-container .upper-text { fill: #64748b; font-size: 11px; }
        .gantt-container .today-highlight { fill: #eef2ff; opacity: 0.6; }
        .gantt-container .arrow { stroke: #94a3b8; }
      `}</style>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          {VIEW_MODES.map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                viewMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'Day' ? 'Día' : m === 'Week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400"/>Pendiente</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500"/>En Progreso</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"/>En Revisión</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"/>Completada</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg ref={containerRef} />
      </div>

      {tareasSinFecha.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs font-medium text-amber-800 mb-1">
            {tareasSinFecha.length} tarea{tareasSinFecha.length === 1 ? '' : 's'} sin fecha de entrega — no aparece{tareasSinFecha.length === 1 ? '' : 'n'} en el Gantt
          </p>
          <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
            {tareasSinFecha.slice(0, 5).map(t => (
              <li key={t._id}>
                {onTareaClick ? (
                  <button onClick={() => onTareaClick(t)} className="hover:underline">{t.nombre}</button>
                ) : t.nombre}
              </li>
            ))}
            {tareasSinFecha.length > 5 && <li>… y {tareasSinFecha.length - 5} más</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export default GanttVista
