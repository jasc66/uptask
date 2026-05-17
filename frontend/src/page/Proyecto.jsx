import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"
import useAuth from "../hooks/useAuth"
import Modal from "../components/Modal"
import FormularioTarea from "../components/FormularioTarea"
import Colaboradores from "../components/Colaboradores"
import Alerta from "../components/Alerta"

const PRIORIDAD_COLOR = {
  Alta: 'bg-red-100 text-red-700',
  Media: 'bg-amber-100 text-amber-700',
  Baja: 'bg-emerald-100 text-emerald-700',
}

const ESTADO_COLOR = {
  'Pendiente':   'bg-slate-100 text-slate-500',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'En Revisión': 'bg-amber-100 text-amber-700',
  'Completada':  'bg-emerald-100 text-emerald-700',
}

const ESTADOS = ['Pendiente', 'En Progreso', 'En Revisión', 'Completada']

const SECCION_ESTILO = {
  'Pendiente':   { dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-300'   },
  'En Progreso': { dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300'    },
  'En Revisión': { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300'   },
  'Completada':  { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
}

// Convierte el estado legacy (Boolean) al nuevo formato string
const normalizeEstado = (estado) => {
  if (estado === true) return 'Completada'
  if (estado === false || estado == null) return 'Pendiente'
  return estado
}

const Proyecto = () => {
  const params = useParams()
  const {
    obtenerProyecto,
    proyecto,
    cargando,
    handleModalEditarProyecto,
    modalFormularioTarea,
    handleModalTarea,
    handleModalEditarTarea,
    eliminarTarea,
    alerta,
    cambiarEstadoTarea,
    etiquetasProyecto,
  } = useProyectos()
  const { auth } = useAuth()

  const [seccionesColapsadas, setSeccionesColapsadas] = useState({})
  const [vistaTablero, setVistaTablero] = useState(false)
  const [dragTareaId, setDragTareaId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [filtroEstados, setFiltroEstados] = useState([])
  const [filtroPrioridades, setFiltroPrioridades] = useState([])
  const [filtroResponsable, setFiltroResponsable] = useState('')
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const toggleSeccion = (estado) =>
    setSeccionesColapsadas(prev => ({ ...prev, [estado]: !prev[estado] }))

  const creadorId = proyecto.creador?._id ?? proyecto.creador
  const puedeAdministrar =
    auth.rol === 'admin' || creadorId?.toString() === auth._id?.toString()

  const colaboradorId = (c) => c.usuario?._id ?? c.usuario
  const puedeEditarEstado =
    puedeAdministrar ||
    proyecto.colaboradores?.some(
      c => colaboradorId(c)?.toString() === auth._id?.toString() && c.rol === 'editor'
    )

  useEffect(() => {
    obtenerProyecto(params.id)
  }, [])

  if (cargando) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-1/4" />
    </div>
  )

  const { nombre, descripcion, cliente, fechaEntrega, color, tareas } = proyecto
  const { msg } = alerta

  // Responsables únicos de las tareas del proyecto
  const responsablesDisponibles = [...new Map(
    (tareas ?? [])
      .filter(t => t.responsable?._id)
      .map(t => [t.responsable._id, t.responsable])
  ).values()]

  const hayFiltros = filtroEstados.length > 0 || filtroPrioridades.length > 0 || filtroResponsable || filtroEtiqueta
  const limpiarFiltros = () => {
    setFiltroEstados([])
    setFiltroPrioridades([])
    setFiltroResponsable('')
    setFiltroEtiqueta('')
  }
  const toggleFiltroEstado = (e) =>
    setFiltroEstados(prev => prev.includes(e) ? prev.filter(v => v !== e) : [...prev, e])
  const toggleFiltroPrioridad = (p) =>
    setFiltroPrioridades(prev => prev.includes(p) ? prev.filter(v => v !== p) : [...prev, p])

  const aplicarFiltros = (lista) => lista.filter(t => {
    const est = normalizeEstado(t.estado)
    const pasaEstado = filtroEstados.length === 0 || filtroEstados.includes(est)
    const pasaPrioridad = filtroPrioridades.length === 0 || filtroPrioridades.includes(t.prioridad)
    const pasaResponsable = !filtroResponsable || t.responsable?._id === filtroResponsable
    const pasaEtiqueta = !filtroEtiqueta || t.etiquetas?.some(e => (e._id ?? e) === filtroEtiqueta)
    return pasaEstado && pasaPrioridad && pasaResponsable && pasaEtiqueta
  })

  // --- Drag & Drop handlers ---
  const handleDragStart = (e, tareaId) => {
    setDragTareaId(tareaId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, estado) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(estado)
  }
  const handleDragLeave = () => setDropTarget(null)
  const handleDrop = (e, estado) => {
    e.preventDefault()
    if (dragTareaId) {
      const tarea = (tareas ?? []).find(t => t._id === dragTareaId)
      if (tarea && normalizeEstado(tarea.estado) !== estado) {
        cambiarEstadoTarea(dragTareaId, estado)
      }
    }
    setDragTareaId(null)
    setDropTarget(null)
  }
  const handleDragEnd = () => {
    setDragTareaId(null)
    setDropTarget(null)
  }

  return (
    <div>
      {msg && <div className="mb-4"><Alerta alerta={alerta} /></div>}

      {/* Header del proyecto */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color ?? '#6366f1'}22` }}
          >
            <span className="font-bold text-lg" style={{ color: color ?? '#6366f1' }}>
              {nombre?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 truncate">{nombre}</h1>
            <p className="text-sm text-slate-400">{cliente}</p>
          </div>
        </div>

        {puedeAdministrar && (
          <button
            onClick={() => handleModalEditarProyecto(proyecto)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar proyecto
          </button>
        )}
      </div>

      {/* Info del proyecto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Descripción</p>
          <p className="text-sm text-slate-700">{descripcion}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Cliente</p>
          <p className="text-sm font-semibold text-slate-800">{cliente}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Fecha de entrega</p>
          <p className="text-sm font-semibold text-slate-800">
            {fechaEntrega ? new Date(fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* Tareas */}
      <div className={vistaTablero ? '' : 'bg-white rounded-xl border border-slate-200 p-6'}>

        {/* Barra de controles */}
        <div className={`flex items-center justify-between mb-4 ${vistaTablero ? 'bg-white rounded-xl border border-slate-200 px-6 py-4' : ''}`}>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-800">Tareas</h2>

            {/* Toggle Lista / Tablero */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setVistaTablero(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${!vistaTablero ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Lista
              </button>
              <button
                onClick={() => setVistaTablero(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${vistaTablero ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Tablero
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(tareas?.length > 0) && (
              <button
                onClick={() => setMostrarFiltros(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  mostrarFiltros || hayFiltros
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filtros
                {hayFiltros && (
                  <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {filtroEstados.length + filtroPrioridades.length + (filtroResponsable ? 1 : 0) + (filtroEtiqueta ? 1 : 0)}
                  </span>
                )}
              </button>
            )}
            {puedeAdministrar && (
              <button
                onClick={handleModalTarea}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar tarea
              </button>
            )}
          </div>
        </div>

        {/* Barra de filtros */}
        {mostrarFiltros && (
          <div className={`mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 ${vistaTablero ? '' : ''}`}>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Estado</p>
                <div className="flex flex-wrap gap-1">
                  {ESTADOS.map(e => (
                    <button key={e} onClick={() => toggleFiltroEstado(e)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
                        filtroEstados.includes(e) ? ESTADO_COLOR[e] + ' ring-1 ring-current ring-offset-1' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Prioridad</p>
                <div className="flex flex-wrap gap-1">
                  {['Alta', 'Media', 'Baja'].map(p => (
                    <button key={p} onClick={() => toggleFiltroPrioridad(p)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
                        filtroPrioridades.includes(p) ? PRIORIDAD_COLOR[p] + ' ring-1 ring-current ring-offset-1' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              {responsablesDisponibles.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Responsable</p>
                  <select
                    value={filtroResponsable}
                    onChange={e => setFiltroResponsable(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Todos</option>
                    {responsablesDisponibles.map(r => (
                      <option key={r._id} value={r._id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              {etiquetasProyecto.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Etiqueta</p>
                  <div className="flex flex-wrap gap-1">
                    {etiquetasProyecto.map(e => (
                      <button key={e._id} onClick={() => setFiltroEtiqueta(prev => prev === e._id ? '' : e._id)}
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${
                          filtroEtiqueta === e._id ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        style={filtroEtiqueta === e._id ? { backgroundColor: e.color } : {}}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                        {e.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!tareas?.length ? (
          <p className={`text-sm text-slate-400 text-center py-8 ${vistaTablero ? 'bg-white rounded-xl border border-slate-200' : ''}`}>
            No hay tareas en este proyecto aún
          </p>

        ) : vistaTablero ? (
          /* ── VISTA TABLERO ── */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {ESTADOS.map(estado => {
                const grupo = aplicarFiltros((tareas ?? []).filter(t => normalizeEstado(t.estado) === estado))
                const estilo = SECCION_ESTILO[estado]
                const isTarget = dropTarget === estado
                return (
                  <div key={estado} className="flex flex-col w-72">
                    {/* Cabecera columna */}
                    <div className="flex items-center gap-2 px-1 py-2 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${estilo.dot}`} />
                      <span className={`text-sm font-semibold ${estilo.text}`}>{estado}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${estilo.bg} ${estilo.text}`}>
                        {grupo.length}
                      </span>
                    </div>

                    {/* Zona de drop */}
                    <div
                      onDragOver={e => handleDragOver(e, estado)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, estado)}
                      className={`flex-1 rounded-xl border-2 border-dashed min-h-[200px] p-2 space-y-2 transition-all duration-150 ${
                        isTarget
                          ? `${estilo.border} ${estilo.bg}`
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      {grupo.map(tarea => (
                        <div
                          key={tarea._id}
                          draggable={puedeEditarEstado}
                          onDragStart={puedeEditarEstado ? e => handleDragStart(e, tarea._id) : undefined}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm select-none transition-opacity ${
                            puedeEditarEstado ? 'cursor-grab active:cursor-grabbing' : ''
                          } ${dragTareaId === tarea._id ? 'opacity-40' : 'opacity-100'}`}
                        >
                          <p className="text-sm font-medium text-slate-800 mb-1">{tarea.nombre}</p>
                          {tarea.descripcion && (
                            <p className="text-xs text-slate-400 mb-2 line-clamp-2">{tarea.descripcion}</p>
                          )}
                          {tarea.etiquetas?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tarea.etiquetas.map(e => (
                                <span key={e._id ?? e} className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: e.color ?? '#6366f1' }}>
                                  {e.nombre}
                                </span>
                              ))}
                            </div>
                          )}
                          {tarea.subtareas?.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <span className="text-xs text-slate-400">
                                {tarea.subtareas.filter(s => s.estado === 'Completada').length}/{tarea.subtareas.length}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${PRIORIDAD_COLOR[tarea.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
                                {tarea.prioridad}
                              </span>
                              {tarea.responsable && (
                                <span className="text-xs text-slate-500 truncate max-w-[90px]">
                                  {tarea.responsable.nombre}
                                </span>
                              )}
                            </div>
                            {tarea.fechaEntrega && (
                              <span className="text-xs text-slate-400">
                                {new Date(tarea.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          {puedeAdministrar && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => handleModalEditarTarea(tarea)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Editar"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => eliminarTarea(tarea._id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {grupo.length === 0 && (
                        <p className="text-xs text-slate-300 text-center pt-10">
                          {isTarget ? 'Suelta aquí' : 'Sin tareas'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        ) : (
          /* ── VISTA LISTA ── */
          <div className="space-y-3">
            {ESTADOS.map(estado => {
              const grupo = aplicarFiltros((tareas ?? []).filter(t => normalizeEstado(t.estado) === estado))
              const colapsada = seccionesColapsadas[estado]
              const estilo = SECCION_ESTILO[estado]
              return (
                <div key={estado}>
                  <button
                    onClick={() => toggleSeccion(estado)}
                    className="flex items-center gap-2 w-full text-left py-1.5"
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${colapsada ? '-rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${estilo.dot}`} />
                    <span className={`text-sm font-semibold ${estilo.text}`}>{estado}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${estilo.bg} ${estilo.text} ml-0.5`}>
                      {grupo.length}
                    </span>
                  </button>

                  {!colapsada && (
                    grupo.length > 0 ? (
                      <ul className="divide-y divide-slate-100 ml-5 border-l-2 border-slate-100 pl-3">
                        {grupo.map(tarea => (
                          <li key={tarea._id} className="flex items-start justify-between py-3 gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800 truncate">{tarea.nombre}</p>
                              {tarea.etiquetas?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {tarea.etiquetas.map(e => (
                                    <span key={e._id ?? e} className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: e.color ?? '#6366f1' }}>
                                      {e.nombre}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-slate-400 truncate mt-0.5">{tarea.descripcion}</p>
                              {tarea.subtareas?.length > 0 && (
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                  </svg>
                                  {tarea.subtareas.filter(s => s.estado === 'Completada').length}/{tarea.subtareas.length} subtareas
                                </p>
                              )}
                              {tarea.responsable && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  <span className="text-slate-400">Responsable: </span>
                                  {tarea.responsable.nombre}
                                </p>
                              )}
                              {tarea.fechaEntrega && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {tarea.fechaInicio
                                    ? `${new Date(tarea.fechaInicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} → ${new Date(tarea.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                                    : `Entrega: ${new Date(tarea.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                                  }
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                              {puedeEditarEstado ? (
                                <select
                                  value={normalizeEstado(tarea.estado)}
                                  onChange={e => cambiarEstadoTarea(tarea._id, e.target.value)}
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${ESTADO_COLOR[normalizeEstado(tarea.estado)]}`}
                                >
                                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                              ) : (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[normalizeEstado(tarea.estado)]}`}>
                                  {normalizeEstado(tarea.estado)}
                                </span>
                              )}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORIDAD_COLOR[tarea.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
                                {tarea.prioridad}
                              </span>
                              {puedeAdministrar && (
                                <>
                                  <button
                                    onClick={() => handleModalEditarTarea(tarea)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => eliminarTarea(tarea._id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-300 ml-10 pb-2">Sin tareas</p>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Colaboradores />

      {modalFormularioTarea && (
        <Modal titulo="Tarea" onClose={handleModalTarea}>
          <FormularioTarea />
        </Modal>
      )}
    </div>
  )
}

export default Proyecto
