import { useState } from "react"
import { Link } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"

const ESTADOS = ['Pendiente', 'En Progreso', 'En Revisión', 'Completada']
const PRIORIDADES = ['Alta', 'Media', 'Baja']

const ESTADO_COLOR = {
  'Pendiente':   'bg-slate-100 text-slate-500',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'En Revisión': 'bg-amber-100 text-amber-700',
  'Completada':  'bg-emerald-100 text-emerald-700',
}

const PRIORIDAD_COLOR = {
  Alta:  'bg-red-100 text-red-700',
  Media: 'bg-amber-100 text-amber-700',
  Baja:  'bg-emerald-100 text-emerald-700',
}

const MisTareas = () => {
  const { misTareas } = useProyectos()
  const [filtroEstados, setFiltroEstados] = useState([])
  const [filtroPrioridades, setFiltroPrioridades] = useState([])

  const toggleFiltro = (lista, setLista, valor) =>
    setLista(prev => prev.includes(valor) ? prev.filter(v => v !== valor) : [...prev, valor])

  const tareasFiltradas = misTareas.filter(t => {
    const pasaEstado = filtroEstados.length === 0 || filtroEstados.includes(t.estado ?? 'Pendiente')
    const pasaPrioridad = filtroPrioridades.length === 0 || filtroPrioridades.includes(t.prioridad)
    return pasaEstado && pasaPrioridad
  })

  const hayFiltros = filtroEstados.length > 0 || filtroPrioridades.length > 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mis tareas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Todas las tareas asignadas a ti</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Estado</p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS.map(e => (
                <button
                  key={e}
                  onClick={() => toggleFiltro(filtroEstados, setFiltroEstados, e)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                    filtroEstados.includes(e)
                      ? ESTADO_COLOR[e] + ' ring-1 ring-current ring-offset-1'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Prioridad</p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORIDADES.map(p => (
                <button
                  key={p}
                  onClick={() => toggleFiltro(filtroPrioridades, setFiltroPrioridades, p)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                    filtroPrioridades.includes(p)
                      ? PRIORIDAD_COLOR[p] + ' ring-1 ring-current ring-offset-1'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {hayFiltros && (
            <div className="flex items-end">
              <button
                onClick={() => { setFiltroEstados([]); setFiltroPrioridades([]) }}
                className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de tareas */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">
            {tareasFiltradas.length}{' '}
            <span className="font-normal text-slate-500">
              tarea{tareasFiltradas.length !== 1 ? 's' : ''}
              {hayFiltros ? ' encontradas' : ' asignadas'}
            </span>
          </span>
        </div>

        {tareasFiltradas.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {tareasFiltradas.map(tarea => (
              <li
                key={tarea._id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{tarea.nombre}</p>
                  {tarea.proyecto && (
                    <Link
                      to={`/proyectos/${tarea.proyecto._id}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-0.5 w-fit"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: tarea.proyecto.color ?? '#6366f1' }}
                      />
                      {tarea.proyecto.nombre}
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {tarea.fechaEntrega && (
                    <span className="text-xs text-slate-400 min-w-max">
                      {new Date(tarea.fechaEntrega).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORIDAD_COLOR[tarea.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
                    {tarea.prioridad}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[tarea.estado] ?? ESTADO_COLOR['Pendiente']}`}>
                    {tarea.estado ?? 'Pendiente'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium text-sm">
              {misTareas.length === 0
                ? 'No tienes tareas asignadas'
                : 'Sin resultados para los filtros aplicados'}
            </p>
            {misTareas.length > 0 && (
              <p className="text-slate-400 text-xs mt-1">Prueba con otros filtros</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MisTareas
