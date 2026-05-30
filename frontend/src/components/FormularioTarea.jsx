import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useProyectos from '../hooks/useProyectos'
import useAuth from '../hooks/useAuth'
import Alerta from './Alerta'

const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente']
const ESTADO_SUBTAREA_COLOR = {
  'Pendiente': 'bg-slate-100 text-slate-500',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'En Revisión': 'bg-amber-100 text-amber-700',
  'Completada': 'bg-emerald-100 text-emerald-700',
}

const FormularioTarea = () => {
  const { id } = useParams()
  const {
    submitTarea, alerta, mostrarAlerta, tareaEditar, proyecto,
    tareaDetalle, agregarComentario, etiquetasProyecto, crearEtiqueta,
    eliminarEtiqueta, agregarSubtarea, cambiarEstadoSubtarea, secciones,
    agregarDependencia, eliminarDependencia,
  } = useProyectos()
  const { auth } = useAuth()

  const creadorProyectoId = proyecto.creador?._id ?? proyecto.creador
  const puedeAdministrar =
    auth.rol === 'admin' || creadorProyectoId?.toString() === auth._id?.toString()
  const esEditorProyecto =
    puedeAdministrar ||
    proyecto.colaboradores?.some(
      c => (c.usuario?._id ?? c.usuario)?.toString() === auth._id?.toString() && (c.rol === 'editor' || c.rol === 'admin')
    )

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [responsables, setResponsables] = useState([])
  const [tareaId, setTareaId] = useState(null)
  const [tiempoEstimado, setTiempoEstimado] = useState('')
  const [tiempoReal, setTiempoReal] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [mostrarMenciones, setMostrarMenciones] = useState(false)
  const [filtroMencion, setFiltroMencion] = useState('')
  const [seccionId, setSeccionId] = useState('')
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState([])
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState({ nombre: '', color: '#6366f1' })
  const [mostrarFormEtiqueta, setMostrarFormEtiqueta] = useState(false)
  const [nuevaSubtarea, setNuevaSubtarea] = useState('')
  const [mostrarFormSubtarea, setMostrarFormSubtarea] = useState(false)
  const [mostrarFormDependencia, setMostrarFormDependencia] = useState(false)
  const [nuevaDependencia, setNuevaDependencia] = useState({ tareaId: '', tipo: 'depende_de' })

  useEffect(() => {
    if (tareaEditar?._id) {
      setNombre(tareaEditar.nombre)
      setDescripcion(tareaEditar.descripcion)
      setPrioridad(tareaEditar.prioridad)
      setFechaInicio(tareaEditar.fechaInicio?.split('T')[0] ?? '')
      setFechaEntrega(tareaEditar.fechaEntrega?.split('T')[0] ?? '')
      const respList = (tareaEditar.responsables ?? []).map(r => r._id ?? r)
      if (respList.length === 0 && tareaEditar.responsable) {
        respList.push(tareaEditar.responsable._id ?? tareaEditar.responsable)
      }
      setResponsables(respList)
      setTareaId(tareaEditar._id)
      setEtiquetasSeleccionadas(
        (tareaEditar.etiquetas ?? []).map(e => e._id ?? e)
      )
      setTiempoEstimado(tareaEditar.tiempoEstimado ?? '')
      setTiempoReal(tareaEditar.tiempoReal ?? '')
      setSeccionId(tareaEditar.seccion?._id ?? tareaEditar.seccion ?? '')
    } else {
      setNombre('')
      setDescripcion('')
      setPrioridad('')
      setFechaInicio('')
      setFechaEntrega('')
      setResponsables([])
      setTareaId(null)
      setEtiquetasSeleccionadas([])
      setTiempoEstimado('')
      setTiempoReal('')
      setSeccionId('')
    }
    setMostrarFormEtiqueta(false)
    setMostrarFormSubtarea(false)
    setNuevaSubtarea('')
    setMostrarFormDependencia(false)
    setNuevaDependencia({ tareaId: '', tipo: 'depende_de' })
  }, [tareaEditar])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if ([nombre, descripcion, prioridad, fechaEntrega].includes('')) {
      mostrarAlerta({ msg: 'Todos los campos son obligatorios', error: true })
      return
    }

    await submitTarea({
      ...(tareaId ? { id: tareaId } : {}),
      nombre,
      descripcion,
      prioridad,
      fechaInicio: fechaInicio || null,
      fechaEntrega,
      proyecto: id,
      responsables,
      etiquetas: etiquetasSeleccionadas,
      tiempoEstimado: tiempoEstimado !== '' ? Number(tiempoEstimado) : null,
      tiempoReal: tiempoReal !== '' ? Number(tiempoReal) : null,
      seccion: seccionId || null,
    })
  }

  const toggleResponsable = (uid) => {
    setResponsables(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
  }

  const toggleEtiqueta = (etiquetaId) => {
    setEtiquetasSeleccionadas(prev =>
      prev.includes(etiquetaId) ? prev.filter(id => id !== etiquetaId) : [...prev, etiquetaId]
    )
  }

  const handleCrearEtiqueta = async () => {
    if (!nuevaEtiqueta.nombre.trim()) return
    const etiqueta = await crearEtiqueta(id, nuevaEtiqueta)
    if (etiqueta) {
      setEtiquetasSeleccionadas(prev => [...prev, etiqueta._id])
      setNuevaEtiqueta({ nombre: '', color: '#6366f1' })
      setMostrarFormEtiqueta(false)
    }
  }

  const handleAgregarSubtarea = async () => {
    if (!nuevaSubtarea.trim()) return
    await agregarSubtarea(tareaId, { nombre: nuevaSubtarea.trim() })
    setNuevaSubtarea('')
    setMostrarFormSubtarea(false)
  }

  const handleAgregarDependencia = async () => {
    if (!nuevaDependencia.tareaId) return
    await agregarDependencia(tareaId, nuevaDependencia.tareaId, nuevaDependencia.tipo)
    setNuevaDependencia({ tareaId: '', tipo: 'depende_de' })
    setMostrarFormDependencia(false)
  }

  const handleEliminarDependencia = async (tareaDependenciaId) => {
    await eliminarDependencia(tareaId, tareaDependenciaId)
  }

  const handleComentario = async () => {
    if (!comentario.trim()) return
    setEnviandoComentario(true)
    await agregarComentario(tareaId, comentario.trim())
    setComentario('')
    setMostrarMenciones(false)
    setFiltroMencion('')
    setEnviandoComentario(false)
  }

  const handleComentarioChange = (e) => {
    const valor = e.target.value
    setComentario(valor)
    const cursor = e.target.selectionStart
    const previo = valor.slice(0, cursor)
    const m = previo.match(/(?:^|\s)@([\w]*)$/i)
    if (m) {
      setFiltroMencion(m[1].toLowerCase())
      setMostrarMenciones(true)
    } else {
      setMostrarMenciones(false)
    }
  }

  const insertarMencion = (p) => {
    const slug = p.nombre.trim().split(/\s+/)[0].toLowerCase()
    setComentario(prev => prev.replace(/(?:^|\s)@([\w]*)$/i, (match) => {
      const prefix = match.startsWith('@') ? '' : match.charAt(0)
      return `${prefix}@${slug} `
    }))
    setMostrarMenciones(false)
    setFiltroMencion('')
  }

  // Lista de participantes: creador + colaboradores
  const participantes = []
  if (proyecto.creador?._id) {
    participantes.push({ _id: proyecto.creador._id, nombre: proyecto.creador.nombre })
  }
  proyecto.colaboradores?.forEach(c => {
    if (c.usuario?._id) participantes.push({ _id: c.usuario._id, nombre: c.usuario.nombre })
  })

  const { msg } = alerta

  const fmtFecha = (iso) =>
    new Date(iso).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })

  const PRIORIDAD_COLOR = {
    Urgente: 'bg-red-100 text-red-700',
    Alta:    'bg-orange-100 text-orange-700',
    Media:   'bg-amber-100 text-amber-700',
    Baja:    'bg-emerald-100 text-emerald-700',
  }

  return (
    <div>
      {/* Vista solo-lectura para colaboradores sin permisos de edición */}
      {!puedeAdministrar && tareaId ? (
        <div className="space-y-3">
          {msg && <Alerta alerta={alerta} />}
          <h2 className="text-base font-semibold text-slate-800">{nombre}</h2>
          {descripcion && (
            <p className="text-sm text-slate-600">{descripcion}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {prioridad && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORIDAD_COLOR[prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
                {prioridad}
              </span>
            )}
            {fechaEntrega && (
              <span className="text-xs text-slate-500">
                Entrega: {new Date(fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
              </span>
            )}
            {responsables.length > 0 && (
              <span className="text-xs text-slate-500">
                {responsables.length === 1 ? 'Responsable: ' : 'Responsables: '}
                {responsables
                  .map(rid => participantes.find(p => p._id === rid)?.nombre)
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
          </div>
          {etiquetasSeleccionadas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {etiquetasProyecto
                .filter(e => etiquetasSeleccionadas.includes(e._id))
                .map(e => (
                  <span
                    key={e._id}
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: e.color }}
                  >
                    {e.nombre}
                  </span>
                ))}
            </div>
          )}
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        {msg && <Alerta alerta={alerta} />}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="nombre">
            Nombre de la tarea
          </label>
          <input
            id="nombre"
            type="text"
            placeholder="Nombre de la tarea"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="descripcion">
            Descripción
          </label>
          <textarea
            id="descripcion"
            placeholder="Descripción de la tarea"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fechaInicio">
              Fecha de inicio
            </label>
            <input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fechaEntrega">
              Fecha de entrega
            </label>
            <input
              id="fechaEntrega"
              type="date"
              value={fechaEntrega}
              onChange={e => setFechaEntrega(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="prioridad">
            Prioridad
          </label>
          <select
            id="prioridad"
            value={prioridad}
            onChange={e => setPrioridad(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">-- Prioridad --</option>
            {PRIORIDADES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tiempoEstimado">
              Tiempo estimado (h)
            </label>
            <input
              id="tiempoEstimado"
              type="number"
              min="0"
              step="0.5"
              placeholder="ej. 4"
              value={tiempoEstimado}
              onChange={e => setTiempoEstimado(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tiempoReal">
              Tiempo real (h)
            </label>
            <input
              id="tiempoReal"
              type="number"
              min="0"
              step="0.5"
              placeholder="ej. 5"
              value={tiempoReal}
              onChange={e => setTiempoReal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {participantes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Responsables
              {responsables.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {responsables.length} asignado{responsables.length === 1 ? '' : 's'}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {participantes.map(p => {
                const sel = responsables.includes(p._id)
                const inicial = p.nombre?.[0]?.toUpperCase() ?? '?'
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => toggleResponsable(p._id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border transition-all ${
                      sel
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      sel ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {inicial}
                    </span>
                    {p.nombre}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Sección */}
        {secciones?.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="seccion">
              Sección (tablero)
            </label>
            <select
              id="seccion"
              value={seccionId}
              onChange={e => setSeccionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">— Sin sección —</option>
              {secciones.map(s => (
                <option key={s._id} value={s._id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Etiquetas */}
        {etiquetasProyecto.length > 0 || true ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Etiquetas</label>
              <button
                type="button"
                onClick={() => setMostrarFormEtiqueta(v => !v)}
                className="text-xs text-indigo-500 hover:text-indigo-700"
              >
                + Nueva
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {etiquetasProyecto.map(e => {
                const sel = etiquetasSeleccionadas.includes(e._id)
                return (
                  <button
                    key={e._id}
                    type="button"
                    onClick={() => toggleEtiqueta(e._id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${
                      sel ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                    style={sel ? { backgroundColor: e.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: e.color }}
                    />
                    {e.nombre}
                  </button>
                )
              })}
              {etiquetasProyecto.length === 0 && !mostrarFormEtiqueta && (
                <p className="text-xs text-slate-400">Sin etiquetas — crea la primera</p>
              )}
            </div>
            {mostrarFormEtiqueta && (
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={nuevaEtiqueta.color}
                  onChange={e => setNuevaEtiqueta(prev => ({ ...prev, color: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  placeholder="Nombre de etiqueta"
                  value={nuevaEtiqueta.nombre}
                  onChange={e => setNuevaEtiqueta(prev => ({ ...prev, nombre: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCrearEtiqueta())}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCrearEtiqueta}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
                >
                  Crear
                </button>
              </div>
            )}
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {tareaId ? 'Guardar cambios' : 'Crear tarea'}
        </button>
      </form>
      )}

      {/* Subtareas — solo al editar */}
      {tareaId && (
        <div className="border-t border-slate-100 mt-5 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Subtareas
              {(tareaDetalle?.subtareas?.length ?? 0) > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {(tareaDetalle?.subtareas ?? []).filter(s => s.estado === 'Completada').length}
                  /{tareaDetalle.subtareas.length} completadas
                </span>
              )}
            </h3>
            {esEditorProyecto && (
              <button
                type="button"
                onClick={() => setMostrarFormSubtarea(v => !v)}
                className="text-xs text-indigo-500 hover:text-indigo-700"
              >
                + Agregar
              </button>
            )}
          </div>

          {(tareaDetalle?.subtareas ?? []).length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {(tareaDetalle?.subtareas ?? []).map(sub => (
                <li key={sub._id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cambiarEstadoSubtarea(
                      sub._id,
                      tareaId,
                      sub.estado === 'Completada' ? 'Pendiente' : 'Completada'
                    )}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      sub.estado === 'Completada'
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {sub.estado === 'Completada' && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${sub.estado === 'Completada' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {sub.nombre}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {esEditorProyecto && mostrarFormSubtarea && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre de la subtarea"
                value={nuevaSubtarea}
                onChange={e => setNuevaSubtarea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAgregarSubtarea())}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAgregarSubtarea}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
              >
                Añadir
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dependencias — solo al editar */}
      {tareaId && (
        <div className="border-t border-slate-100 mt-5 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Dependencias
              {(tareaDetalle?.dependencias?.length ?? 0) > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {tareaDetalle.dependencias.length}
                </span>
              )}
            </h3>
            {esEditorProyecto && (
              <button
                type="button"
                onClick={() => setMostrarFormDependencia(v => !v)}
                className="text-xs text-indigo-500 hover:text-indigo-700"
              >
                + Agregar
              </button>
            )}
          </div>

          {(tareaDetalle?.dependencias ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 mb-2">Sin dependencias</p>
          ) : (
            <ul className="space-y-1.5 mb-3">
              {tareaDetalle.dependencias.map(dep => {
                const tareaDep = dep.tarea
                const completada = tareaDep?.estado === 'Completada'
                const esBloqueante = dep.tipo === 'depende_de'
                return (
                  <li key={`${tareaDep?._id}-${dep.tipo}`} className="flex items-center gap-2 group/dep">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        esBloqueante ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}
                      title={esBloqueante ? 'Esta tarea depende de la otra' : 'Esta tarea bloquea a la otra'}
                    >
                      {esBloqueante ? 'Depende de' : 'Bloquea a'}
                    </span>
                    <span className={`text-sm flex-1 truncate ${completada ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {tareaDep?.nombre ?? '—'}
                    </span>
                    {tareaDep?.estado && (
                      <span className="text-xs text-slate-400 shrink-0">{tareaDep.estado}</span>
                    )}
                    {esEditorProyecto && tareaDep?._id && (
                      <button
                        type="button"
                        onClick={() => handleEliminarDependencia(tareaDep._id)}
                        className="opacity-0 group-hover/dep:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                        title="Eliminar dependencia"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {esEditorProyecto && mostrarFormDependencia && (
            <div className="space-y-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <select
                value={nuevaDependencia.tipo}
                onChange={e => setNuevaDependencia(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="depende_de">Esta tarea depende de…</option>
                <option value="bloquea">Esta tarea bloquea a…</option>
              </select>
              <select
                value={nuevaDependencia.tareaId}
                onChange={e => setNuevaDependencia(prev => ({ ...prev, tareaId: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Selecciona tarea —</option>
                {(proyecto.tareas ?? [])
                  .filter(t => t._id !== tareaId && !t.tareaPadre)
                  .map(t => (
                    <option key={t._id} value={t._id}>{t.nombre}</option>
                  ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAgregarDependencia}
                  disabled={!nuevaDependencia.tareaId}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg"
                >
                  Vincular
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarFormDependencia(false); setNuevaDependencia({ tareaId: '', tipo: 'depende_de' }) }}
                  className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-medium rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sección de actividad — solo visible al editar una tarea existente */}
      {tareaId && (
        <div className="border-t border-slate-100 mt-5 pt-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Actividad</h3>

          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {(tareaDetalle?.actividad ?? []).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Sin actividad aún</p>
            )}
            {(tareaDetalle?.actividad ?? []).map((entrada, i) =>
              entrada.tipo === 'comentario' ? (
                <div key={i} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">
                      {entrada.usuario?.nombre?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">{entrada.usuario?.nombre ?? '—'}</p>
                    <p className="text-sm text-slate-600 mt-0.5 break-words">{entrada.contenido}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtFecha(entrada.createdAt)}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{entrada.usuario?.nombre ?? '—'}</span>
                      {' '}{entrada.contenido}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtFecha(entrada.createdAt)}</p>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={comentario}
                onChange={handleComentarioChange}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setMostrarMenciones(false); return }
                  if (e.key === 'Enter' && !e.shiftKey && !mostrarMenciones) {
                    e.preventDefault()
                    handleComentario()
                  }
                }}
                placeholder="Escribe un comentario… usa @ para mencionar"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              {mostrarMenciones && (() => {
                const filtrados = participantes
                  .filter(p => p.nombre.toLowerCase().includes(filtroMencion))
                  .slice(0, 6)
                if (filtrados.length === 0) return null
                return (
                  <div className="absolute bottom-full mb-1 left-0 z-20 w-56 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Mencionar a
                    </p>
                    {filtrados.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); insertarMencion(p) }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                      >
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {p.nombre?.[0]?.toUpperCase() ?? '?'}
                        </span>
                        <span className="text-sm text-slate-700 truncate">{p.nombre}</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
            <button
              type="button"
              onClick={handleComentario}
              disabled={enviandoComentario || !comentario.trim()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormularioTarea
