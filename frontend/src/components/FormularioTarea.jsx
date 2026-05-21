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
    eliminarEtiqueta, agregarSubtarea, cambiarEstadoSubtarea,
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
  const [responsable, setResponsable] = useState('')
  const [tareaId, setTareaId] = useState(null)
  const [tiempoEstimado, setTiempoEstimado] = useState('')
  const [tiempoReal, setTiempoReal] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState([])
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState({ nombre: '', color: '#6366f1' })
  const [mostrarFormEtiqueta, setMostrarFormEtiqueta] = useState(false)
  const [nuevaSubtarea, setNuevaSubtarea] = useState('')
  const [mostrarFormSubtarea, setMostrarFormSubtarea] = useState(false)

  useEffect(() => {
    if (tareaEditar?._id) {
      setNombre(tareaEditar.nombre)
      setDescripcion(tareaEditar.descripcion)
      setPrioridad(tareaEditar.prioridad)
      setFechaInicio(tareaEditar.fechaInicio?.split('T')[0] ?? '')
      setFechaEntrega(tareaEditar.fechaEntrega?.split('T')[0] ?? '')
      setResponsable(tareaEditar.responsable?._id ?? tareaEditar.responsable ?? '')
      setTareaId(tareaEditar._id)
      setEtiquetasSeleccionadas(
        (tareaEditar.etiquetas ?? []).map(e => e._id ?? e)
      )
      setTiempoEstimado(tareaEditar.tiempoEstimado ?? '')
      setTiempoReal(tareaEditar.tiempoReal ?? '')
    } else {
      setNombre('')
      setDescripcion('')
      setPrioridad('')
      setFechaInicio('')
      setFechaEntrega('')
      setResponsable('')
      setTareaId(null)
      setEtiquetasSeleccionadas([])
      setTiempoEstimado('')
      setTiempoReal('')
    }
    setMostrarFormEtiqueta(false)
    setMostrarFormSubtarea(false)
    setNuevaSubtarea('')
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
      responsable: responsable || undefined,
      etiquetas: etiquetasSeleccionadas,
      tiempoEstimado: tiempoEstimado !== '' ? Number(tiempoEstimado) : null,
      tiempoReal: tiempoReal !== '' ? Number(tiempoReal) : null,
    })
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

  const handleComentario = async () => {
    if (!comentario.trim()) return
    setEnviandoComentario(true)
    await agregarComentario(tareaId, comentario.trim())
    setComentario('')
    setEnviandoComentario(false)
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
            {responsable && participantes.find(p => p._id === responsable) && (
              <span className="text-xs text-slate-500">
                Responsable: {participantes.find(p => p._id === responsable)?.nombre}
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
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="responsable">
              Responsable
            </label>
            <select
              id="responsable"
              value={responsable}
              onChange={e => setResponsable(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">— Sin asignar —</option>
              {participantes.map(p => (
                <option key={p._id} value={p._id}>{p.nombre}</option>
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
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComentario() } }}
              placeholder="Escribe un comentario… (Enter para enviar)"
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
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
