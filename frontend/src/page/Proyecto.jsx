import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"
import useAuth from "../hooks/useAuth"
import Modal from "../components/Modal"
import FormularioTarea from "../components/FormularioTarea"
import Colaboradores from "../components/Colaboradores"
import Alerta from "../components/Alerta"
import ReportesProyecto from "./ReportesProyecto"
import CalendarioVista from "../components/CalendarioVista"

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
  'Pendiente':   { dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-300'   },
  'En Progreso': { dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-100',   border: 'border-blue-300'    },
  'En Revisión': { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-100',  border: 'border-amber-300'   },
  'Completada':  { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-100',border: 'border-emerald-300' },
}

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
    secciones,
    crearSeccion,
    actualizarSeccion,
    eliminarSeccion,
    reordenarSecciones,
    moverTareaASeccion,
    actualizarFechaTarea,
  } = useProyectos()
  const { auth } = useAuth()

  const [seccionesColapsadas, setSeccionesColapsadas] = useState({})
  const [vista, setVista] = useState('lista')
  const [dragTareaId, setDragTareaId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [filtroEstados, setFiltroEstados] = useState([])
  const [filtroPrioridades, setFiltroPrioridades] = useState([])
  const [filtroResponsable, setFiltroResponsable] = useState('')
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [editandoSeccion, setEditandoSeccion] = useState(null)
  const [mostrarNuevaSeccion, setMostrarNuevaSeccion] = useState(false)
  const [nuevaSeccionNombre, setNuevaSeccionNombre] = useState('')

  const toggleSeccion = (estado) =>
    setSeccionesColapsadas(prev => ({ ...prev, [estado]: !prev[estado] }))

  const creadorId = proyecto.creador?._id ?? proyecto.creador
  const puedeAdministrar =
    auth.rol === 'admin' || creadorId?.toString() === auth._id?.toString()

  const colaboradorId = (c) => c.usuario?._id ?? c.usuario
  const puedeEditarEstado =
    puedeAdministrar ||
    proyecto.colaboradores?.some(
      c => colaboradorId(c)?.toString() === auth._id?.toString() && (c.rol === 'editor' || c.rol === 'admin')
    )
  const puedeVerDetalle =
    puedeAdministrar ||
    proyecto.colaboradores?.some(
      c => colaboradorId(c)?.toString() === auth._id?.toString()
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

  const handleDragStart = (e, tareaId) => {
    setDragTareaId(tareaId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, key) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(key)
  }
  const handleDragLeave = () => setDropTarget(null)
  const handleDrop = (e, seccionId) => {
    e.preventDefault()
    if (dragTareaId) {
      moverTareaASeccion(dragTareaId, seccionId)
    }
    setDragTareaId(null)
    setDropTarget(null)
  }
  const handleDragEnd = () => {
    setDragTareaId(null)
    setDropTarget(null)
  }

  const tareasDeSección = (seccionId) =>
    aplicarFiltros((tareas ?? []).filter(t => {
      const sid = t.seccion?._id ?? t.seccion
      return sid?.toString() === seccionId
    }))

  const tareassinSeccion = aplicarFiltros((tareas ?? []).filter(t => !t.seccion))

  const guardarRenombreSeccion = async (seccionId) => {
    if (!editandoSeccion) return
    if (editandoSeccion.nombre.trim()) {
      await actualizarSeccion(proyecto._id, seccionId, { nombre: editandoSeccion.nombre.trim() })
    }
    setEditandoSeccion(null)
  }

  const inicializarSeccionesDefault = async () => {
    const defaults = [
      { nombre: 'Por hacer', color: '#94a3b8' },
      { nombre: 'En progreso', color: '#3b82f6' },
      { nombre: 'Completado', color: '#10b981' },
    ]
    for (const s of defaults) {
      await crearSeccion(proyecto._id, s)
    }
  }

  const handleCrearSeccion = async () => {
    if (!nuevaSeccionNombre.trim()) return
    await crearSeccion(proyecto._id, { nombre: nuevaSeccionNombre.trim() })
    setNuevaSeccionNombre('')
    setMostrarNuevaSeccion(false)
  }

  const handleEliminarSeccion = async (seccionId) => {
    if (!window.confirm('¿Eliminar esta sección? Las tareas quedarán sin sección asignada.')) return
    await eliminarSeccion(proyecto._id, seccionId)
  }

  const moverSeccionIzq = (seccionId) => {
    const idx = secciones.findIndex(s => s._id === seccionId)
    if (idx <= 0) return
    const nuevoOrden = secciones.map(s => s._id)
    ;[nuevoOrden[idx - 1], nuevoOrden[idx]] = [nuevoOrden[idx], nuevoOrden[idx - 1]]
    reordenarSecciones(proyecto._id, nuevoOrden)
  }

  const moverSeccionDer = (seccionId) => {
    const idx = secciones.findIndex(s => s._id === seccionId)
    if (idx >= secciones.length - 1) return
    const nuevoOrden = secciones.map(s => s._id)
    ;[nuevoOrden[idx], nuevoOrden[idx + 1]] = [nuevoOrden[idx + 1], nuevoOrden[idx]]
    reordenarSecciones(proyecto._id, nuevoOrden)
  }

  const renderTarjetaKanban = (tarea) => (
    <div
      key={tarea._id}
      draggable={puedeEditarEstado}
      onDragStart={puedeEditarEstado ? e => handleDragStart(e, tarea._id) : undefined}
      onDragEnd={handleDragEnd}
      className={`group bg-white rounded-lg border border-slate-200 p-3 shadow-sm select-none transition-opacity ${
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
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${ESTADO_COLOR[normalizeEstado(tarea.estado)]}`}>
            {normalizeEstado(tarea.estado)}
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
      {(puedeVerDetalle) && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => handleModalEditarTarea(tarea)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title={puedeAdministrar ? "Editar" : "Ver detalle"}
          >
            {puedeAdministrar ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          {puedeAdministrar && (
            <button
              onClick={() => eliminarTarea(tarea._id)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Eliminar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div>
      {msg && <div className="mb-4"><Alerta alerta={alerta} /></div>}

      {/* Header compacto del proyecto */}
      <div className="flex items-center justify-between mb-8 gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color ?? '#6366f1'}22` }}
          >
            <span className="font-bold text-xl" style={{ color: color ?? '#6366f1' }}>
              {nombre?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-800 truncate">{nombre}</h1>
            <div className="flex items-center gap-4 mt-0.5 flex-wrap">
              {cliente && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {cliente}
                </span>
              )}
              {fechaEntrega && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
            {descripcion && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{descripcion}</p>
            )}
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
            Editar
          </button>
        )}
      </div>

      {/* Tareas */}
      <div className={vista === 'tablero' || vista === 'reportes' || vista === 'calendario' ? '' : 'bg-white rounded-xl border border-slate-200 p-6'}>

        {/* Barra de controles */}
        <div className={`flex items-center justify-between mb-4 ${vista === 'tablero' ? 'bg-white rounded-xl border border-slate-200 px-6 py-4' : ''}`}>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-800">Tareas</h2>

            {/* Toggle Lista / Tablero / Reportes */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setVista('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'lista' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Lista
              </button>
              <button
                onClick={() => setVista('tablero')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'tablero' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Tablero
              </button>
              <button
                onClick={() => setVista('calendario')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'calendario' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendario
              </button>
              <button
                onClick={() => setVista('reportes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'reportes' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reportes
              </button>
            </div>
          </div>

          {vista !== 'reportes' && <div className="flex items-center gap-2">
            {vista !== 'calendario' && (tareas?.length > 0) && (
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
            {puedeEditarEstado && (
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
          </div>}
        </div>

        {/* Barra de filtros */}
        {mostrarFiltros && vista !== 'reportes' && vista !== 'calendario' && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
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

        {vista === 'calendario' ? (
          <CalendarioVista
            tareas={tareas ?? []}
            onTareaClick={handleModalEditarTarea}
            onFechaChange={(tareaId, fecha) => actualizarFechaTarea(tareaId, fecha)}
            puedeEditar={puedeAdministrar}
          />
        ) : vista === 'reportes' ? (
          <ReportesProyecto proyectoId={params.id} embedded />
        ) : !tareas?.length ? (
          <div className={`flex flex-col items-center justify-center py-12 text-center ${vista === 'tablero' ? 'bg-white rounded-xl border border-slate-200' : ''}`}>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Sin tareas en este proyecto</p>
            {puedeEditarEstado && (
              <button
                onClick={handleModalTarea}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar primera tarea
              </button>
            )}
          </div>

        ) : vista === 'tablero' ? (
          /* ── VISTA TABLERO (secciones dinámicas) ── */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max items-start">
              {secciones.length === 0 ? (
                <div className="flex items-center justify-center w-[600px] py-16">
                  <div className="text-center max-w-xs">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">Sin secciones aún</p>
                    <p className="text-xs text-slate-400 mb-4">Crea columnas personalizadas para organizar tu flujo de trabajo</p>
                    {puedeAdministrar && (
                      <button
                        onClick={inicializarSeccionesDefault}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Crear secciones por defecto
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Columna "Sin sección" — solo si hay tareas sin asignar */}
                  {tareassinSeccion.length > 0 && (
                    <div className="flex flex-col w-72 shrink-0">
                      <div className="flex items-center gap-2 px-1 py-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-sm font-semibold text-slate-500 flex-1">Sin sección</span>
                        <span className="min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1 bg-slate-100 text-slate-500">
                          {tareassinSeccion.length}
                        </span>
                      </div>
                      <div
                        onDragOver={e => handleDragOver(e, '__sin_seccion__')}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, null)}
                        className={`flex-1 rounded-xl border-2 border-dashed min-h-[300px] p-2 space-y-2 transition-all duration-150 ${
                          dropTarget === '__sin_seccion__' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-slate-50/60'
                        }`}
                      >
                        {tareassinSeccion.map(tarea => renderTarjetaKanban(tarea))}
                      </div>
                    </div>
                  )}

                  {/* Columnas de secciones */}
                  {secciones.map(seccion => {
                    const grupo = tareasDeSección(seccion._id)
                    const isTarget = dropTarget === seccion._id
                    const editando = editandoSeccion?.id === seccion._id
                    return (
                      <div key={seccion._id} className="flex flex-col w-72 shrink-0">
                        <div className="flex items-center gap-2 px-1 py-2 mb-2 group/col">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seccion.color }} />
                          {editando ? (
                            <input
                              autoFocus
                              value={editandoSeccion.nombre}
                              onChange={e => setEditandoSeccion(prev => ({ ...prev, nombre: e.target.value }))}
                              onBlur={() => guardarRenombreSeccion(seccion._id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') guardarRenombreSeccion(seccion._id)
                                if (e.key === 'Escape') setEditandoSeccion(null)
                              }}
                              className="text-sm font-semibold text-slate-700 bg-transparent border-b border-indigo-400 outline-none flex-1 min-w-0"
                            />
                          ) : (
                            <span
                              className={`text-sm font-semibold text-slate-700 flex-1 min-w-0 truncate ${puedeAdministrar ? 'cursor-text' : ''}`}
                              onDoubleClick={puedeAdministrar ? () => setEditandoSeccion({ id: seccion._id, nombre: seccion.nombre }) : undefined}
                              title={puedeAdministrar ? 'Doble clic para renombrar' : undefined}
                            >
                              {seccion.nombre}
                            </span>
                          )}
                          <span className="min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1 bg-slate-100 text-slate-600">
                            {grupo.length}
                          </span>
                          {puedeAdministrar && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity">
                              <button
                                onClick={() => moverSeccionIzq(seccion._id)}
                                className="p-0.5 text-slate-300 hover:text-slate-600 rounded"
                                title="Mover izquierda"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => moverSeccionDer(seccion._id)}
                                className="p-0.5 text-slate-300 hover:text-slate-600 rounded"
                                title="Mover derecha"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEliminarSeccion(seccion._id)}
                                className="p-0.5 text-slate-300 hover:text-red-500 rounded"
                                title="Eliminar sección"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div
                          onDragOver={e => handleDragOver(e, seccion._id)}
                          onDragLeave={handleDragLeave}
                          onDrop={e => handleDrop(e, seccion._id)}
                          className={`flex-1 rounded-xl border-2 border-dashed min-h-[300px] p-2 space-y-2 transition-all duration-150 ${
                            isTarget ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 bg-slate-50/60'
                          }`}
                        >
                          {grupo.map(tarea => renderTarjetaKanban(tarea))}
                          {grupo.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full pt-12 pb-4 gap-2">
                              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                              </svg>
                              <p className="text-xs text-slate-300 text-center">
                                {isTarget ? 'Suelta aquí' : 'Sin tareas'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Columna para agregar sección */}
                  {puedeAdministrar && (
                    <div className="flex flex-col w-64 shrink-0 pt-9">
                      {mostrarNuevaSeccion ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                          <input
                            autoFocus
                            placeholder="Nombre de la sección"
                            value={nuevaSeccionNombre}
                            onChange={e => setNuevaSeccionNombre(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCrearSeccion()
                              if (e.key === 'Escape') { setMostrarNuevaSeccion(false); setNuevaSeccionNombre('') }
                            }}
                            className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCrearSeccion}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
                            >
                              Crear
                            </button>
                            <button
                              onClick={() => { setMostrarNuevaSeccion(false); setNuevaSeccionNombre('') }}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMostrarNuevaSeccion(true)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all w-full text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar sección
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
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
                    className="flex items-center gap-2.5 w-full text-left py-1.5"
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${colapsada ? '-rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${estilo.bg} ${estilo.text}`}>
                      {estado}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">({grupo.length})</span>
                  </button>

                  {!colapsada && (
                    grupo.length > 0 ? (
                      <ul className="divide-y divide-slate-100 ml-5 border-l-2 border-slate-100 pl-3">
                        {grupo.map(tarea => (
                          <li key={tarea._id} className="group flex items-start justify-between py-3 gap-3">
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium text-slate-800 truncate ${puedeVerDetalle ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
                                onClick={puedeVerDetalle ? () => handleModalEditarTarea(tarea) : undefined}
                              >
                                {tarea.nombre}
                              </p>
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
                              {puedeVerDetalle && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={() => handleModalEditarTarea(tarea)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title={puedeAdministrar ? "Editar" : "Ver detalle"}
                                  >
                                    {puedeAdministrar ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    )}
                                  </button>
                                  {puedeAdministrar && (
                                    <button
                                      onClick={() => eliminarTarea(tarea._id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Eliminar"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="ml-10 py-3 flex items-center gap-2 text-slate-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span className="text-xs">Sin tareas en esta sección</span>
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {vista !== 'reportes' && (
        <>
          {/* Separador de sección */}
          <div className="flex items-center gap-4 my-8">
            <hr className="flex-1 border-slate-200" />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Equipo
            </span>
            <hr className="flex-1 border-slate-200" />
          </div>
          <Colaboradores />
        </>
      )}

      {modalFormularioTarea && (
        <Modal titulo={puedeEditarEstado ? "Tarea" : "Detalle de tarea"} onClose={handleModalTarea}>
          <FormularioTarea />
        </Modal>
      )}
    </div>
  )
}

export default Proyecto
