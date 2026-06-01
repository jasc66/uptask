import { useState, useEffect } from "react"
import useProyectos from "../hooks/useProyectos"

const EVENTOS = [
    { value: 'tarea_creada',          label: 'Tarea creada' },
    { value: 'tarea_completada',      label: 'Tarea completada' },
    { value: 'tarea_estado_cambiado', label: 'Estado cambiado' },
    { value: 'tarea_asignada',        label: 'Responsable asignado' },
    { value: 'comentario_agregado',   label: 'Comentario agregado' },
]

const TIPO_INFO = {
    webhook: {
        label: 'Webhook',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        ),
        color: 'indigo',
        desc: 'Envía un HTTP POST a tu URL cuando ocurren eventos. Compatible con Zapier, Make y n8n.',
    },
    slack: {
        label: 'Slack',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
        ),
        color: 'violet',
        desc: 'Envía mensajes a un canal de Slack usando un Incoming Webhook.',
    },
    ical: {
        label: 'Exportar iCal',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        color: 'emerald',
        desc: 'Descarga las fechas de entrega de las tareas como archivo .ics para importar en Google Calendar, Outlook o Apple Calendar.',
    },
}

const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
}

// --- Formulario de nueva integración ---
const FormularioIntegracion = ({ tipo, proyectoId, onCrear, onCancelar }) => {
    const [nombre, setNombre] = useState('')
    const [url, setUrl] = useState('')
    const [secreto, setSecreto] = useState('')
    const [eventos, setEventos] = useState(['tarea_creada', 'tarea_completada'])
    const [guardando, setGuardando] = useState(false)

    const toggleEvento = (ev) => setEventos(prev =>
        prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    )

    const handleSubmit = async e => {
        e.preventDefault()
        if (!nombre.trim() || !url.trim()) return
        setGuardando(true)
        const datos = {
            nombre: nombre.trim(),
            tipo,
            config: { url: url.trim(), secreto: secreto.trim(), eventos },
        }
        const result = await onCrear(proyectoId, datos)
        setGuardando(false)
        if (result) onCancelar()
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-indigo-200 p-5 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-800">Configurar {TIPO_INFO[tipo]?.label}</h4>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder={tipo === 'slack' ? 'Ej. Notificaciones #general' : 'Ej. Zapier trigger'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                    {tipo === 'slack' ? 'Slack Incoming Webhook URL *' : 'URL del endpoint *'}
                </label>
                <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={tipo === 'slack' ? 'https://hooks.slack.com/services/...' : 'https://hooks.zapier.com/...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            {tipo === 'webhook' && (
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        Secreto HMAC <span className="text-slate-400 font-normal">(opcional — para verificar la firma)</span>
                    </label>
                    <input
                        type="text"
                        value={secreto}
                        onChange={e => setSecreto(e.target.value)}
                        placeholder="mi-secreto-seguro"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Se envía como cabecera <code className="bg-slate-100 px-1 rounded">X-Nexo-Signature: sha256=...</code></p>
                </div>
            )}
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Eventos a escuchar</label>
                <div className="flex flex-wrap gap-2">
                    {EVENTOS.map(ev => (
                        <button
                            key={ev.value}
                            type="button"
                            onClick={() => toggleEvento(ev.value)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                eventos.includes(ev.value)
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                            }`}
                        >
                            {ev.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-3 pt-1">
                <button type="button" onClick={onCancelar} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={guardando || !nombre.trim() || !url.trim()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                    {guardando ? 'Guardando…' : 'Guardar integración'}
                </button>
            </div>
        </form>
    )
}

// --- Tarjeta de integración configurada ---
const IntegracionCard = ({ integ, proyectoId, onToggle, onEliminar, onTest }) => {
    const [toggling, setToggling] = useState(false)
    const [testing, setTesting] = useState(false)
    const info = TIPO_INFO[integ.tipo]

    const handleToggle = async () => { setToggling(true); await onToggle(proyectoId, integ._id); setToggling(false) }
    const handleTest = async () => { setTesting(true); await onTest(proyectoId, integ._id); setTesting(false) }

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-4 transition-opacity ${integ.activa ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap[info?.color ?? 'indigo']}`}>
                        {info?.icon}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${integ.activa ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <h4 className="text-sm font-semibold text-slate-800 truncate">{integ.nombre}</h4>
                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">{info?.label}</span>
                        </div>
                        {integ.config?.url && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{integ.config.url}</p>
                        )}
                        {integ.config?.eventos?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {integ.config.eventos.map(ev => (
                                    <span key={ev} className="text-[11px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                        {EVENTOS.find(e => e.value === ev)?.label ?? ev}
                                    </span>
                                ))}
                            </div>
                        )}
                        {integ.vecesDisparado > 0 && (
                            <p className="text-[11px] text-slate-400 mt-1">Disparada {integ.vecesDisparado} {integ.vecesDisparado === 1 ? 'vez' : 'veces'}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {integ.tipo !== 'ical' && (
                        <button
                            onClick={handleTest}
                            disabled={testing}
                            className="text-xs px-2.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {testing ? '…' : 'Test'}
                        </button>
                    )}
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        title={integ.activa ? 'Desactivar' : 'Activar'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${integ.activa ? 'bg-indigo-600' : 'bg-slate-200'} disabled:opacity-50`}
                    >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${integ.activa ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                    <button
                        onClick={() => onEliminar(proyectoId, integ._id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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

// --- Tarjeta tipo para seleccionar ---
const TipoCard = ({ tipo, onSeleccionar }) => {
    const info = TIPO_INFO[tipo]
    return (
        <button
            onClick={() => onSeleccionar(tipo)}
            className="flex flex-col items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[info.color]} group-hover:scale-110 transition-transform`}>
                {info.icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-800">{info.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{info.desc}</p>
            </div>
        </button>
    )
}

// --- Vista principal ---
const IntegracionesVista = ({ proyectoId }) => {
    const { obtenerIntegraciones, crearIntegracion, eliminarIntegracion, toggleIntegracion, testearIntegracion, descargarIcal } = useProyectos()
    const [integraciones, setIntegraciones] = useState([])
    const [cargando, setCargando] = useState(true)
    const [tipoSeleccionado, setTipoSeleccionado] = useState(null)
    const [descargando, setDescargando] = useState(false)

    useEffect(() => {
        const cargar = async () => {
            const data = await obtenerIntegraciones(proyectoId)
            setIntegraciones(data)
            setCargando(false)
        }
        cargar()
    }, [proyectoId])

    const handleCrear = async (pid, datos) => {
        const nueva = await crearIntegracion(pid, datos)
        if (nueva) setIntegraciones(prev => [nueva, ...prev])
        return nueva
    }

    const handleEliminar = async (pid, id) => {
        if (!window.confirm('¿Eliminar esta integración?')) return
        await eliminarIntegracion(pid, id)
        setIntegraciones(prev => prev.filter(i => i._id !== id))
    }

    const handleToggle = async (pid, id) => {
        const actualizada = await toggleIntegracion(pid, id)
        if (actualizada) setIntegraciones(prev => prev.map(i => i._id === id ? actualizada : i))
    }

    const handleDescargarIcal = async () => {
        setDescargando(true)
        await descargarIcal(proyectoId)
        setDescargando(false)
    }

    return (
        <div className="py-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800">Integraciones</h2>
                <p className="text-sm text-slate-500 mt-0.5">Conecta este proyecto con herramientas externas.</p>
            </div>

            {/* iCal */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap.emerald}`}>
                            {TIPO_INFO.ical.icon}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Exportar a calendario</p>
                            <p className="text-xs text-slate-500">{TIPO_INFO.ical.desc}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDescargarIcal}
                        disabled={descargando}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {descargando ? 'Generando…' : 'Descargar .ics'}
                    </button>
                </div>
            </div>

            {/* Formulario si se seleccionó un tipo */}
            {tipoSeleccionado && tipoSeleccionado !== 'ical' && (
                <FormularioIntegracion
                    tipo={tipoSeleccionado}
                    proyectoId={proyectoId}
                    onCrear={handleCrear}
                    onCancelar={() => setTipoSeleccionado(null)}
                />
            )}

            {/* Integraciones configuradas */}
            {cargando ? (
                <div className="flex justify-center py-8">
                    <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {integraciones.filter(i => i.tipo !== 'ical').length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuradas</h3>
                            {integraciones.map(integ => (
                                <IntegracionCard
                                    key={integ._id}
                                    integ={integ}
                                    proyectoId={proyectoId}
                                    onToggle={handleToggle}
                                    onEliminar={handleEliminar}
                                    onTest={testearIntegracion}
                                />
                            ))}
                        </div>
                    )}

                    {/* Agregar nueva */}
                    {!tipoSeleccionado && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agregar integración</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TipoCard tipo="webhook" onSeleccionar={setTipoSeleccionado} />
                                <TipoCard tipo="slack" onSeleccionar={setTipoSeleccionado} />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default IntegracionesVista
