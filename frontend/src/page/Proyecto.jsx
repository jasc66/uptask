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
import GanttVista from "../components/GanttVista"
import StatusUpdates from "../components/StatusUpdates"
import AutomatizacionesVista from "../components/AutomatizacionesVista"
import IntegracionesVista from "../components/IntegracionesVista"
import clienteAxios from "../config/clienteAxios"

const PRIORIDAD_COLOR = {
  Alta: 'bg-red-100 text-red-700',
  Media: 'bg-amber-100 text-amber-700',
  Baja: 'bg-emerald-100 text-emerald-700',
}

const TIPO_LABELS = { texto: 'Texto', numero: 'Número', select: 'Selección', fecha: 'Fecha', checkbox: 'Sí/No' }

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

const estaBloqueada = (tarea) =>
  (tarea.dependencias ?? []).some(
    d => d.tipo === 'depende_de' && d.tarea && d.tarea.estado !== 'Completada'
  )

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
    exportarProyecto,
    crearPlantillaDesdeProyecto,
    camposProyecto,
    crearCampo,
    eliminarCampo,
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
  const [mostrarColaboradores, setMostrarColaboradores] = useState(false)
  const [modalPlantilla, setModalPlantilla] = useState(false)
  const [nombrePlantilla, setNombrePlantilla] = useState('')
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false)
  const [mostrarPanelCampos, setMostrarPanelCampos] = useState(false)
  const [camposOcultosEnLista, setCamposOcultosEnLista] = useState(new Set())
  const [nuevoCampo, setNuevoCampo] = useState({ nombre: '', tipo: 'texto', opciones: '' })
  const [mostrarFormCampo, setMostrarFormCampo] = useState(false)
  const [guardandoCampo, setGuardandoCampo] = useState(false)
  const [modalPlanIA, setModalPlanIA] = useState(false)
  const [generandoPlan, setGenerandoPlan] = useState(false)
  const [tareasGeneradas, setTareasGeneradas] = useState([])
  const [creandoTareasIA, setCreandoTareasIA] = useState(false)
  const [seleccionadas, setSeleccionadas] = useState(new Set())

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

  const responsablesDe = (t) => {
    if (Array.isArray(t.responsables) && t.responsables.length > 0) return t.responsables
    return t.responsable ? [t.responsable] : []
  }
  const responsablesDisponibles = [...new Map(
    (tareas ?? []).flatMap(t => responsablesDe(t).filter(r => r?._id).map(r => [r._id, r]))
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
    const pasaResponsable = !filtroResponsable || responsablesDe(t).some(r => r?._id === filtroResponsable)
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

  const toggleCampoEnLista = (campoId) => {
    setCamposOcultosEnLista(prev => {
      const next = new Set(prev)
      next.has(campoId) ? next.delete(campoId) : next.add(campoId)
      return next
    })
  }

  const handleCrearCampo = async () => {
    if (!nuevoCampo.nombre.trim()) return
    setGuardandoCampo(true)
    const opciones = nuevoCampo.tipo === 'select'
      ? nuevoCampo.opciones.split(',').map(o => o.trim()).filter(Boolean)
      : []
    await crearCampo(proyecto._id, { nombre: nuevoCampo.nombre.trim(), tipo: nuevoCampo.tipo, opciones })
    setNuevoCampo({ nombre: '', tipo: 'texto', opciones: '' })
    setMostrarFormCampo(false)
    setGuardandoCampo(false)
  }

  const handleEliminarCampo = async (campoId) => {
    if (!window.confirm('¿Eliminar este campo? Se borrarán los valores en todas las tareas del proyecto.')) return
    await eliminarCampo(proyecto._id, campoId)
  }

  const formatearValorCampo = (tipo, valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (tipo === 'checkbox') return valor ? '✓' : null
    if (tipo === 'fecha') return new Date(valor).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    return String(valor)
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

  // --- IA: Generador de plan ---
  const abrirGeneradorPlan = async () => {
    setTareasGeneradas([])
    setSeleccionadas(new Set())
    setModalPlanIA(true)
    setGenerandoPlan(true)
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      const { data } = await clienteAxios.post('/ia/generar-plan', {
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion,
        fechaEntrega: proyecto.fechaEntrega,
      }, config)
      const con_id = data.tareas.map((t, i) => ({ ...t, _uid: i }))
      setTareasGeneradas(con_id)
      setSeleccionadas(new Set(con_id.map(t => t._uid)))
    } catch {
      setModalPlanIA(false)
    } finally {
      setGenerandoPlan(false)
    }
  }

  const crearTareasIASeleccionadas = async () => {
    const elegidas = tareasGeneradas.filter(t => seleccionadas.has(t._uid))
    if (!elegidas.length) return
    setCreandoTareasIA(true)
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      const base = proyecto.fechaInicio ? new Date(proyecto.fechaInicio) : new Date()
      for (const t of elegidas) {
        const fecha = new Date(base)
        fecha.setDate(fecha.getDate() + (t.offsetDias ?? 0))
        await clienteAxios.post('/tareas', {
          proyecto: proyecto._id,
          nombre: t.nombre,
          descripcion: t.descripcion,
          prioridad: t.prioridad,
          fechaEntrega: fecha.toISOString(),
        }, config)
      }
      await obtenerProyecto(params.id)
      setModalPlanIA(false)
    } catch { /* silencioso */ }
    finally { setCreandoTareasIA(false) }
  }

  const toggleSeleccionada = (uid) => setSeleccionadas(prev => {
    const next = new Set(prev)
    next.has(uid) ? next.delete(uid) : next.add(uid)
    return next
  })

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
      <p className="text-sm font-medium text-slate-800 mb-1 flex items-center gap-1">
        {tarea.nombre}
        {tarea.recurrencia?.activa && (
          <span title="Tarea recurrente" className="text-indigo-400 text-xs">🔁</span>
        )}
      </p>
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
          {estaBloqueada(tarea) && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-0.5" title="Bloqueada por dependencias">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Bloqueada
            </span>
          )}
          {(() => {
            const resp = responsablesDe(tarea)
            if (!resp.length) return null
            return (
              <div className="flex -space-x-1.5" title={resp.map(r => r?.nombre).filter(Boolean).join(', ')}>
                {resp.slice(0, 3).map(r => (
                  <span key={r._id} className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {r.nombre?.[0]?.toUpperCase() ?? '?'}
                  </span>
                ))}
                {resp.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    +{resp.length - 3}
                  </span>
                )}
              </div>
            )
          })()}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
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

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
          <button
            onClick={() => setMostrarColaboradores(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Ver colaboradores del proyecto"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">Equipo</span>
            {proyecto.colaboradores?.length > 0 && (
              <span className="min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-indigo-100 text-indigo-700">
                {proyecto.colaboradores.length}
              </span>
            )}
          </button>
          <button
            onClick={() => exportarProyecto(proyecto._id, nombre)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Exportar proyecto como JSON"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Exportar</span>
          </button>
          {puedeAdministrar && (
            <button
              onClick={abrirGeneradorPlan}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
              title="Generar plan de tareas con IA"
            >
              <span>✨</span>
              <span className="hidden sm:inline">Plan IA</span>
            </button>
          )}
          {puedeAdministrar && (
            <button
              onClick={() => setMostrarPanelCampos(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Gestionar campos personalizados"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              <span className="hidden sm:inline">Campos</span>
              {camposProyecto?.length > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-indigo-100 text-indigo-700">
                  {camposProyecto.length}
                </span>
              )}
            </button>
          )}
          {puedeAdministrar && (
            <button
              onClick={() => { setNombrePlantilla(nombre ?? ''); setModalPlantilla(true) }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Guardar proyecto como plantilla reutilizable"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">Plantilla</span>
            </button>
          )}
          {puedeAdministrar && (
            <button
              onClick={() => handleModalEditarProyecto(proyecto)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Editar proyecto"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}
        </div>
      </div>

      {/* Tareas */}
      <div className={vista === 'tablero' || vista === 'reportes' || vista === 'calendario' || vista === 'gantt' ? '' : 'bg-white rounded-xl border border-slate-200 p-6'}>

        {/* Barra de controles */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 ${vista === 'tablero' ? 'bg-white rounded-xl border border-slate-200 px-6 py-4' : ''}`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h2 className="font-semibold text-slate-800 shrink-0">Tareas</h2>

            {/* Toggle vistas — scroll horizontal en mobile */}
            <div className="overflow-x-auto flex-1 -mx-0.5 px-0.5" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 min-w-max">
                <button
                  onClick={() => setVista('lista')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'lista' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Lista
                </button>
                <button
                  onClick={() => setVista('tablero')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'tablero' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Tablero
                </button>
                <button
                  onClick={() => setVista('calendario')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'calendario' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendario
                </button>
                <button
                  onClick={() => setVista('gantt')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'gantt' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h8M4 12h12M4 18h6" />
                  </svg>
                  Gantt
                </button>
                <button
                  onClick={() => setVista('reportes')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'reportes' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reportes
                </button>
                {puedeAdministrar && (
                  <button
                    onClick={() => setVista('automatizaciones')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'automatizaciones' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Reglas
                  </button>
                )}
                {puedeAdministrar && (
                  <button
                    onClick={() => setVista('integraciones')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${vista === 'integraciones' ? 'bg-[#6d4afe] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Integraciones
                  </button>
                )}
              </div>
            </div>
          </div>

          {vista !== 'reportes' && vista !== 'automatizaciones' && vista !== 'integraciones' && <div className="flex items-center gap-2 shrink-0">
            {vista !== 'calendario' && vista !== 'gantt' && (tareas?.length > 0) && (
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
        {mostrarFiltros && vista !== 'reportes' && vista !== 'calendario' && vista !== 'gantt' && vista !== 'automatizaciones' && vista !== 'integraciones' && (
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
              {camposProyecto?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Columnas de campos</p>
                  <div className="flex flex-wrap gap-1">
                    {camposProyecto.map(c => {
                      const visible = !camposOcultosEnLista.has(c._id)
                      return (
                        <button key={c._id} onClick={() => toggleCampoEnLista(c._id)}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${
                            visible
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-1 ring-indigo-300 ring-offset-1'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {visible && <span className="text-indigo-500">✓</span>}
                          {c.nombre}
                        </button>
                      )
                    })}
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
        ) : vista === 'gantt' ? (
          <GanttVista
            tareas={tareas ?? []}
            onTareaClick={handleModalEditarTarea}
            onFechaChange={(tareaId, fecha) => actualizarFechaTarea(tareaId, fecha)}
            puedeEditar={puedeAdministrar}
          />
        ) : vista === 'reportes' ? (
          <ReportesProyecto proyectoId={params.id} embedded />
        ) : vista === 'integraciones' ? (
          <IntegracionesVista proyectoId={params.id} />
        ) : vista === 'automatizaciones' ? (
          <AutomatizacionesVista
            proyectoId={params.id}
            secciones={secciones ?? []}
            colaboradores={[
              ...(proyecto.creador ? [proyecto.creador] : []),
              ...(proyecto.colaboradores ?? []).map(c => c.usuario ?? c).filter(Boolean)
            ].filter(u => u?._id || u?.nombre)}
          />
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
                                className={`text-sm font-medium text-slate-800 truncate flex items-center gap-1 ${puedeVerDetalle ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
                                onClick={puedeVerDetalle ? () => handleModalEditarTarea(tarea) : undefined}
                              >
                                {tarea.nombre}
                                {tarea.recurrencia?.activa && (
                                  <span title="Tarea recurrente" className="text-indigo-400 text-xs shrink-0">🔁</span>
                                )}
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
                              {(() => {
                                const resp = responsablesDe(tarea)
                                if (!resp.length) return null
                                return (
                                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <span className="text-slate-400">
                                      {resp.length === 1 ? 'Responsable: ' : 'Responsables: '}
                                    </span>
                                    <span className="flex -space-x-1.5">
                                      {resp.slice(0, 3).map(r => (
                                        <span key={r._id} className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white" title={r.nombre}>
                                          {r.nombre?.[0]?.toUpperCase() ?? '?'}
                                        </span>
                                      ))}
                                      {resp.length > 3 && (
                                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                          +{resp.length - 3}
                                        </span>
                                      )}
                                    </span>
                                    <span className="truncate">
                                      {resp.map(r => r.nombre).filter(Boolean).join(', ')}
                                    </span>
                                  </p>
                                )
                              })()}
                              {tarea.fechaEntrega && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {tarea.fechaInicio
                                    ? `${new Date(tarea.fechaInicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} → ${new Date(tarea.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                                    : `Entrega: ${new Date(tarea.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                                  }
                                </p>
                              )}
                              {(() => {
                                const visibles = (camposProyecto ?? []).filter(c => !camposOcultosEnLista.has(c._id))
                                if (!visibles.length) return null
                                const pares = visibles.flatMap(c => {
                                  const cv = tarea.camposPersonalizados?.find(
                                    x => (x.campo?._id?.toString() ?? x.campo?.toString() ?? '') === c._id.toString()
                                  )
                                  const display = formatearValorCampo(c.tipo, cv?.valor)
                                  return display !== null ? [{ campo: c, display }] : []
                                })
                                if (!pares.length) return null
                                return (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {pares.map(({ campo, display }) => (
                                      <span key={campo._id} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                        <span className="text-slate-400 font-medium">{campo.nombre}:</span>
                                        {display}
                                      </span>
                                    ))}
                                  </div>
                                )
                              })()}
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
                              {estaBloqueada(tarea) && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1" title="Bloqueada por dependencias">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Bloqueada
                                </span>
                              )}
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

      {/* Status Updates */}
      <div className="mt-6">
        <StatusUpdates
          proyectoId={proyecto._id}
          statusUpdates={proyecto.statusUpdates ?? []}
          puedePublicar={puedeAdministrar || puedeEditarEstado}
        />
      </div>

      {/* Modal Guardar como plantilla */}
      {modalPlantilla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Guardar como plantilla</h2>
              <button
                onClick={() => setModalPlantilla(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Se guardará la estructura de tareas como plantilla reutilizable (sin responsables ni comentarios).
            </p>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre de la plantilla</label>
            <input
              type="text"
              value={nombrePlantilla}
              onChange={e => setNombrePlantilla(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent mb-5"
              placeholder="Ej. Sprint de 2 semanas"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setModalPlantilla(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={guardandoPlantilla || !nombrePlantilla.trim()}
                onClick={async () => {
                  setGuardandoPlantilla(true)
                  await crearPlantillaDesdeProyecto(proyecto._id, { nombre: nombrePlantilla.trim() })
                  setGuardandoPlantilla(false)
                  setModalPlantilla(false)
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {guardandoPlantilla ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </>
                ) : 'Guardar plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Campos Personalizados */}
      {mostrarPanelCampos && (
        <div
          onClick={() => setMostrarPanelCampos(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          mostrarPanelCampos ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!mostrarPanelCampos}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Campos personalizados</h2>
              <p className="text-xs text-slate-400">Atributos extra para las tareas</p>
            </div>
          </div>
          <button
            onClick={() => setMostrarPanelCampos(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(camposProyecto ?? []).length === 0 && !mostrarFormCampo ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">Sin campos aún</p>
              <p className="text-xs text-slate-400 mt-1">Crea campos para agregar información extra a las tareas</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {(camposProyecto ?? []).map(c => (
                <li key={c._id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                        {TIPO_LABELS[c.tipo]}
                      </span>
                      {c.tipo === 'select' && c.opciones?.length > 0 && (
                        <span className="text-xs text-slate-400 truncate">
                          {c.opciones.join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEliminarCampo(c._id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Eliminar campo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mostrarFormCampo ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Nuevo campo</p>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="ej. URL de referencia"
                  value={nuevoCampo.nombre}
                  onChange={e => setNuevoCampo(prev => ({ ...prev, nombre: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleCrearCampo()}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                <select
                  value={nuevoCampo.tipo}
                  onChange={e => setNuevoCampo(prev => ({ ...prev, tipo: e.target.value, opciones: '' }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(TIPO_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              {nuevoCampo.tipo === 'select' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Opciones (separadas por coma)</label>
                  <input
                    type="text"
                    placeholder="ej. Bajo, Medio, Alto"
                    value={nuevoCampo.opciones}
                    onChange={e => setNuevoCampo(prev => ({ ...prev, opciones: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCrearCampo}
                  disabled={!nuevoCampo.nombre.trim() || guardandoCampo}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {guardandoCampo ? 'Guardando...' : 'Crear campo'}
                </button>
                <button
                  onClick={() => { setMostrarFormCampo(false); setNuevoCampo({ nombre: '', tipo: 'texto', opciones: '' }) }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setMostrarFormCampo(true)}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar campo
            </button>
          )}
        </div>
      </aside>

      {/* Drawer Colaboradores — deslizable desde la derecha */}
      {mostrarColaboradores && (
        <div
          onClick={() => setMostrarColaboradores(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          mostrarColaboradores ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!mostrarColaboradores}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="font-semibold text-slate-800">Equipo del proyecto</h2>
          </div>
          <button
            onClick={() => setMostrarColaboradores(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Cerrar panel de colaboradores"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Colaboradores />
        </div>
      </aside>

      {modalFormularioTarea && (
        <Modal titulo={puedeEditarEstado ? "Tarea" : "Detalle de tarea"} onClose={handleModalTarea}>
          <FormularioTarea />
        </Modal>
      )}

      {/* Modal Plan IA */}
      {modalPlanIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <span>✨</span> Plan generado con IA
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Selecciona las tareas que quieres crear</p>
              </div>
              <button onClick={() => setModalPlanIA(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {generandoPlan ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Analizando el proyecto y generando tareas…</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-500">{seleccionadas.size} de {tareasGeneradas.length} seleccionadas</span>
                    <button
                      onClick={() => setSeleccionadas(seleccionadas.size === tareasGeneradas.length ? new Set() : new Set(tareasGeneradas.map(t => t._uid)))}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {seleccionadas.size === tareasGeneradas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </button>
                  </div>
                  {tareasGeneradas.map(t => (
                    <div
                      key={t._uid}
                      onClick={() => toggleSeleccionada(t._uid)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        seleccionadas.has(t._uid) ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        seleccionadas.has(t._uid) ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                      }`}>
                        {seleccionadas.has(t._uid) && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-800">{t.nombre}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            t.prioridad === 'Urgente' ? 'bg-red-100 text-red-700' :
                            t.prioridad === 'Alta' ? 'bg-amber-100 text-amber-700' :
                            t.prioridad === 'Media' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>{t.prioridad}</span>
                          {t.duracionDias > 0 && (
                            <span className="text-[10px] text-slate-400">{t.duracionDias}d</span>
                          )}
                        </div>
                        {t.descripcion && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.descripcion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!generandoPlan && tareasGeneradas.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-3">
                <button onClick={() => setModalPlanIA(false)} className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={crearTareasIASeleccionadas}
                  disabled={creandoTareasIA || seleccionadas.size === 0}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {creandoTareasIA ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando…</>
                  ) : (
                    `Crear ${seleccionadas.size} tarea${seleccionadas.size !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Proyecto
