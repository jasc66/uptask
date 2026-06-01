import { useState, useEffect } from "react"
import useProyectos from "../hooks/useProyectos"
import { marcarProgresoOnboarding } from "../hooks/useOnboarding"

const EVENTOS = [
    { value: 'tarea_creada',              label: 'Se crea una tarea' },
    { value: 'tarea_completada',          label: 'Se completa una tarea' },
    { value: 'tarea_estado_cambiado',     label: 'Cambia el estado de una tarea' },
    { value: 'tarea_asignada',            label: 'Se asigna un responsable' },
    { value: 'fecha_vencimiento_proxima', label: 'Fecha de vencimiento próxima' },
]

const ACCIONES = [
    { value: 'cambiar_estado',       label: 'Cambiar estado' },
    { value: 'cambiar_prioridad',    label: 'Cambiar prioridad' },
    { value: 'asignar_responsable',  label: 'Asignar responsable' },
    { value: 'crear_notificacion',   label: 'Enviar notificación' },
    { value: 'mover_seccion',        label: 'Mover a sección' },
]

const ESTADOS = ['Pendiente', 'En Progreso', 'En Revisión', 'Completada']
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente']

const EVENTO_LABEL = Object.fromEntries(EVENTOS.map(e => [e.value, e.label]))
const ACCION_LABEL = Object.fromEntries(ACCIONES.map(a => [a.value, a.label]))

const resumenAccion = (accion) => {
    if (!accion?.tipo) return '—'
    switch (accion.tipo) {
        case 'cambiar_estado':      return `→ Estado: "${accion.parametros?.estado ?? ''}"`
        case 'cambiar_prioridad':   return `→ Prioridad: "${accion.parametros?.prioridad ?? ''}"`
        case 'asignar_responsable': return `→ Asignar responsable`
        case 'crear_notificacion':  return `→ Notificación: "${accion.parametros?.mensaje?.slice(0, 40) ?? ''}"`
        case 'mover_seccion':       return `→ Mover a sección`
        default: return accion.tipo
    }
}

// --- Builder de una automatización ---
const BuilderForm = ({ proyectoId, secciones, colaboradores, onCrear, onCancelar }) => {
    const [nombre, setNombre] = useState('')
    const [evento, setEvento] = useState('tarea_creada')
    const [diasAntes, setDiasAntes] = useState(1)
    const [condCampo, setCondCampo] = useState('ninguna')
    const [condOp, setCondOp] = useState('es')
    const [condValor, setCondValor] = useState('')
    const [accionTipo, setAccionTipo] = useState('cambiar_estado')
    const [accionParams, setAccionParams] = useState({})
    const [guardando, setGuardando] = useState(false)

    const handleSubmit = async e => {
        e.preventDefault()
        if (!nombre.trim()) return
        setGuardando(true)
        const datos = {
            nombre: nombre.trim(),
            trigger: {
                evento,
                diasAntes: Number(diasAntes),
                condicion: { campo: condCampo, operador: condOp, valor: condValor },
            },
            accion: { tipo: accionTipo, parametros: accionParams },
        }
        const result = await onCrear(proyectoId, datos)
        setGuardando(false)
        if (result) onCancelar()
    }

    const opcCondValor = condCampo === 'prioridad' ? PRIORIDADES : ESTADOS

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-800">Nueva automatización</h3>

            {/* Nombre */}
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej. Marcar urgente al asignar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cuando… */}
                <div>
                    <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-2">Cuando…</p>
                    <label className="block text-xs text-slate-600 mb-1">Evento</label>
                    <select
                        value={evento}
                        onChange={e => setEvento(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {EVENTOS.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                    </select>
                    {evento === 'fecha_vencimiento_proxima' && (
                        <div className="mt-2">
                            <label className="block text-xs text-slate-600 mb-1">Días antes</label>
                            <input
                                type="number"
                                min={1}
                                value={diasAntes}
                                onChange={e => setDiasAntes(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}
                </div>

                {/* Si… (condición opcional) */}
                <div>
                    <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-2">Si… (opcional)</p>
                    <label className="block text-xs text-slate-600 mb-1">Campo</label>
                    <select
                        value={condCampo}
                        onChange={e => { setCondCampo(e.target.value); setCondValor('') }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ninguna">Sin condición</option>
                        <option value="prioridad">Prioridad</option>
                        <option value="estado">Estado</option>
                    </select>
                    {condCampo !== 'ninguna' && (
                        <div className="mt-2 flex gap-2">
                            <select
                                value={condOp}
                                onChange={e => setCondOp(e.target.value)}
                                className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="es">es</option>
                                <option value="no_es">no es</option>
                            </select>
                            <select
                                value={condValor}
                                onChange={e => setCondValor(e.target.value)}
                                className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Seleccionar…</option>
                                {opcCondValor.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Entonces… */}
                <div>
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">Entonces…</p>
                    <label className="block text-xs text-slate-600 mb-1">Acción</label>
                    <select
                        value={accionTipo}
                        onChange={e => { setAccionTipo(e.target.value); setAccionParams({}) }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {ACCIONES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>

                    <div className="mt-2">
                        {accionTipo === 'cambiar_estado' && (
                            <select
                                value={accionParams.estado ?? ''}
                                onChange={e => setAccionParams({ estado: e.target.value })}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Seleccionar estado…</option>
                                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}
                        {accionTipo === 'cambiar_prioridad' && (
                            <select
                                value={accionParams.prioridad ?? ''}
                                onChange={e => setAccionParams({ prioridad: e.target.value })}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Seleccionar prioridad…</option>
                                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        )}
                        {accionTipo === 'asignar_responsable' && (
                            <select
                                value={accionParams.usuarioId ?? ''}
                                onChange={e => setAccionParams({ usuarioId: e.target.value })}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Seleccionar usuario…</option>
                                {colaboradores.map(c => (
                                    <option key={c._id} value={c._id}>{c.nombre}</option>
                                ))}
                            </select>
                        )}
                        {accionTipo === 'crear_notificacion' && (
                            <input
                                type="text"
                                placeholder="Mensaje de la notificación…"
                                value={accionParams.mensaje ?? ''}
                                onChange={e => setAccionParams({ mensaje: e.target.value })}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        )}
                        {accionTipo === 'mover_seccion' && (
                            <select
                                value={accionParams.seccionId ?? ''}
                                onChange={e => setAccionParams({ seccionId: e.target.value })}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Sin sección</option>
                                {secciones.map(s => (
                                    <option key={s._id} value={s._id}>{s.nombre}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-1">
                <button
                    type="button"
                    onClick={onCancelar}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={guardando || !nombre.trim()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                    {guardando ? 'Guardando…' : 'Crear automatización'}
                </button>
            </div>
        </form>
    )
}

// --- Tarjeta de una automatización ---
const AutomatizacionCard = ({ auto, proyectoId, onToggle, onEliminar }) => {
    const [toggling, setToggling] = useState(false)

    const handleToggle = async () => {
        setToggling(true)
        await onToggle(proyectoId, auto._id)
        setToggling(false)
    }

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-4 transition-opacity ${auto.activa ? 'border-slate-200 opacity-100' : 'border-slate-100 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${auto.activa ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <h4 className="text-sm font-semibold text-slate-800 truncate">{auto.nombre}</h4>
                    </div>

                    {/* Flujo visual */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                            {EVENTO_LABEL[auto.trigger?.evento] ?? auto.trigger?.evento}
                        </span>
                        {auto.trigger?.condicion?.campo !== 'ninguna' && auto.trigger?.condicion?.campo && (
                            <>
                                <span className="text-slate-400">·</span>
                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                    {auto.trigger.condicion.campo} {auto.trigger.condicion.operador === 'no_es' ? '≠' : '='} {auto.trigger.condicion.valor}
                                </span>
                            </>
                        )}
                        <span className="text-slate-400">→</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {ACCION_LABEL[auto.accion?.tipo] ?? auto.accion?.tipo}
                        </span>
                        <span className="text-slate-400 ml-1">
                            {resumenAccion(auto.accion)}
                        </span>
                    </div>

                    {auto.vecesEjecutada > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            Ejecutada {auto.vecesEjecutada} {auto.vecesEjecutada === 1 ? 'vez' : 'veces'}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        title={auto.activa ? 'Desactivar' : 'Activar'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${auto.activa ? 'bg-indigo-600' : 'bg-slate-200'} disabled:opacity-50`}
                    >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${auto.activa ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                    {/* Delete */}
                    <button
                        onClick={() => onEliminar(proyectoId, auto._id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- Vista principal ---
const AutomatizacionesVista = ({ proyectoId, secciones, colaboradores }) => {
    const { obtenerAutomatizaciones, crearAutomatizacion, eliminarAutomatizacion, toggleAutomatizacion } = useProyectos()
    const [automatizaciones, setAutomatizaciones] = useState([])
    const [cargando, setCargando] = useState(true)
    const [showBuilder, setShowBuilder] = useState(false)

    useEffect(() => {
        const cargar = async () => {
            const data = await obtenerAutomatizaciones(proyectoId)
            setAutomatizaciones(data)
            setCargando(false)
        }
        cargar()
    }, [proyectoId])

    const handleCrear = async (pid, datos) => {
        const nueva = await crearAutomatizacion(pid, datos)
        if (nueva) {
            setAutomatizaciones(prev => [nueva, ...prev])
            marcarProgresoOnboarding('crear_automatizacion')
        }
        return nueva
    }

    const handleEliminar = async (pid, id) => {
        if (!window.confirm('¿Eliminar esta automatización?')) return
        await eliminarAutomatizacion(pid, id)
        setAutomatizaciones(prev => prev.filter(a => a._id !== id))
    }

    const handleToggle = async (pid, id) => {
        const actualizada = await toggleAutomatizacion(pid, id)
        if (actualizada) setAutomatizaciones(prev => prev.map(a => a._id === id ? actualizada : a))
    }

    return (
        <div className="py-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Automatizaciones</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Reglas que se ejecutan automáticamente cuando ocurre un evento en las tareas del proyecto.
                    </p>
                </div>
                {!showBuilder && (
                    <button
                        onClick={() => setShowBuilder(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva regla
                    </button>
                )}
            </div>

            {/* Builder */}
            {showBuilder && (
                <BuilderForm
                    proyectoId={proyectoId}
                    secciones={secciones}
                    colaboradores={colaboradores}
                    onCrear={handleCrear}
                    onCancelar={() => setShowBuilder(false)}
                />
            )}

            {/* Lista */}
            {cargando ? (
                <div className="flex justify-center py-12">
                    <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : automatizaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 border-dashed text-center">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Sin automatizaciones</h3>
                    <p className="text-xs text-slate-500 max-w-xs">
                        Crea reglas para que las tareas se actualicen solas cuando ocurra un evento.
                    </p>
                    <button
                        onClick={() => setShowBuilder(true)}
                        className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
                    >
                        Crear primera regla
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {automatizaciones.map(a => (
                        <AutomatizacionCard
                            key={a._id}
                            auto={a}
                            proyectoId={proyectoId}
                            onToggle={handleToggle}
                            onEliminar={handleEliminar}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default AutomatizacionesVista
