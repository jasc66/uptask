import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"

const ESTADO_BADGE = {
    Activo:    'bg-emerald-100 text-emerald-700',
    Pausado:   'bg-amber-100 text-amber-700',
    Completado:'bg-indigo-100 text-indigo-700',
    Cancelado: 'bg-slate-100 text-slate-500',
}

const META_ESTADO_BADGE = {
    activa:     { label: 'Activa',     cls: 'bg-indigo-100 text-indigo-700' },
    en_riesgo:  { label: 'En riesgo',  cls: 'bg-amber-100 text-amber-700' },
    completada: { label: 'Completada', cls: 'bg-emerald-100 text-emerald-700' },
    cancelada:  { label: 'Cancelada',  cls: 'bg-slate-100 text-slate-500' },
}

const COLORES = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

// --- Mini componentes ---

const BarraProgreso = ({ pct, color = '#6366f1', height = 'h-1.5' }) => (
    <div className={`w-full bg-slate-100 rounded-full ${height}`}>
        <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
        />
    </div>
)

const ProyectoCard = ({ proyecto, color, onQuitar }) => {
    const navigate = useNavigate()
    const { total = 0, completadas = 0 } = proyecto.stats ?? {}
    const pct = total > 0 ? Math.round((completadas / total) * 100) : 0

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="h-1 rounded-t-xl" style={{ backgroundColor: proyecto.color ?? color }} />
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <button
                        className="text-sm font-semibold text-slate-800 hover:text-indigo-600 text-left transition-colors"
                        onClick={() => navigate(`/proyectos/${proyecto._id}`)}
                    >
                        {proyecto.nombre}
                    </button>
                    <button
                        onClick={() => onQuitar(proyecto._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all shrink-0"
                        title="Quitar del portafolio"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE[proyecto.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                        {proyecto.estado}
                    </span>
                    {proyecto.cliente && (
                        <span className="text-[11px] text-slate-400 truncate">{proyecto.cliente}</span>
                    )}
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Avance</span>
                        <span className="font-medium text-slate-700">{pct}%</span>
                    </div>
                    <BarraProgreso pct={pct} color={proyecto.color ?? color} />
                    <p className="text-[11px] text-slate-400">{completadas}/{total} tareas</p>
                </div>
            </div>
        </div>
    )
}

const MetaCard = ({ meta, portafolioId, onActualizar, onEliminar }) => {
    const [editando, setEditando] = useState(false)
    const [actual, setActual] = useState(String(meta.metrica?.actual ?? 0))
    const [guardando, setGuardando] = useState(false)
    const { tipo, objetivo = 100, actual: actualVal = 0 } = meta.metrica ?? {}
    const pct = tipo === 'booleano' ? (actualVal ? 100 : 0) : (objetivo > 0 ? Math.round((actualVal / objetivo) * 100) : 0)
    const badge = META_ESTADO_BADGE[meta.estado] ?? META_ESTADO_BADGE.activa

    const handleGuardar = async () => {
        setGuardando(true)
        const nuevoActual = tipo === 'booleano' ? (actual === 'true' ? 1 : 0) : Number(actual)
        await onActualizar(portafolioId, meta._id, { metrica: { ...meta.metrica, actual: nuevoActual } })
        setEditando(false)
        setGuardando(false)
    }

    const barColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 30 ? '#f59e0b' : '#ef4444'

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{meta.nombre}</h4>
                    {meta.descripcion && <p className="text-xs text-slate-500 mt-0.5 truncate">{meta.descripcion}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    <button
                        onClick={() => onEliminar(portafolioId, meta._id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {tipo !== 'booleano' && (
                <div className="mb-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>{tipo === 'porcentaje' ? 'Progreso' : 'Valor actual'}</span>
                        <span className="font-semibold text-slate-700">
                            {tipo === 'porcentaje' ? `${pct}%` : `${actualVal} / ${objetivo}`}
                        </span>
                    </div>
                    <BarraProgreso pct={pct} color={barColor} height="h-2" />
                </div>
            )}

            {tipo === 'booleano' && (
                <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${actualVal ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            {actualVal
                                ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                : <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            }
                        </svg>
                        {actualVal ? 'Completado' : 'Pendiente'}
                    </span>
                </div>
            )}

            {editando ? (
                <div className="flex items-center gap-2">
                    {tipo === 'booleano' ? (
                        <select
                            value={actual}
                            onChange={e => setActual(e.target.value)}
                            className="flex-1 text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="false">Pendiente</option>
                            <option value="true">Completado</option>
                        </select>
                    ) : (
                        <input
                            type="number"
                            value={actual}
                            onChange={e => setActual(e.target.value)}
                            min={0}
                            max={tipo === 'porcentaje' ? 100 : undefined}
                            className="flex-1 text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    )}
                    <button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {guardando ? '…' : 'OK'}
                    </button>
                    <button onClick={() => setEditando(false)} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg">
                        ✕
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => { setActual(tipo === 'booleano' ? (actualVal ? 'true' : 'false') : String(actualVal)); setEditando(true) }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    Actualizar progreso
                </button>
            )}
        </div>
    )
}

const ModalAgregarProyecto = ({ proyectos, proyectosEnPortafolio, onAgregar, onClose }) => {
    const [busqueda, setBusqueda] = useState('')
    const idsEnPortafolio = new Set(proyectosEnPortafolio.map(p => p._id))
    const disponibles = proyectos.filter(p =>
        !idsEnPortafolio.has(p._id) &&
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">Agregar proyecto</h2>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">
                    <input
                        type="text"
                        placeholder="Buscar proyecto…"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        autoFocus
                    />
                    <div className="max-h-72 overflow-y-auto space-y-1">
                        {disponibles.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6">
                                {proyectos.length === 0 ? 'No tienes proyectos' : 'No hay proyectos disponibles'}
                            </p>
                        ) : (
                            disponibles.map(p => (
                                <button
                                    key={p._id}
                                    onClick={() => { onAgregar(p._id); onClose() }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color ?? '#6366f1' }} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                                        <p className="text-xs text-slate-400 truncate">{p.cliente}</p>
                                    </div>
                                    <span className={`ml-auto text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${ESTADO_BADGE[p.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                                        {p.estado}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const ModalNuevaMeta = ({ portafolioId, onCrear, onClose }) => {
    const [form, setForm] = useState({ nombre: '', descripcion: '', tipo: 'porcentaje', objetivo: 100, actual: 0, estado: 'activa' })
    const [guardando, setGuardando] = useState(false)

    const handleSubmit = async e => {
        e.preventDefault()
        if (!form.nombre.trim()) return
        setGuardando(true)
        await onCrear(portafolioId, {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim(),
            metrica: { tipo: form.tipo, objetivo: Number(form.objetivo), actual: Number(form.actual) },
            estado: form.estado,
        })
        setGuardando(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">Nueva meta</h2>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                            placeholder="Ej. Completar 80% de tareas"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                        <input
                            type="text"
                            value={form.descripcion}
                            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                            placeholder="Descripción opcional…"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de métrica</label>
                            <select
                                value={form.tipo}
                                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="porcentaje">Porcentaje</option>
                                <option value="numero">Número</option>
                                <option value="booleano">Sí/No</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                            <select
                                value={form.estado}
                                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="activa">Activa</option>
                                <option value="en_riesgo">En riesgo</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                    </div>
                    {form.tipo !== 'booleano' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Objetivo {form.tipo === 'porcentaje' ? '(%)' : ''}
                                </label>
                                <input
                                    type="number"
                                    value={form.objetivo}
                                    onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
                                    min={0}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Actual</label>
                                <input
                                    type="number"
                                    value={form.actual}
                                    onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
                                    min={0}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando || !form.nombre.trim()}
                            className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                            {guardando ? 'Creando…' : 'Crear meta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- Página principal ---

const PortafolioDetalle = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const {
        portafolioActual,
        obtenerPortafolioById,
        actualizarPortafolio,
        eliminarPortafolio,
        agregarProyectoPortafolio,
        quitarProyectoPortafolio,
        crearMetaPortafolio,
        actualizarMetaPortafolio,
        eliminarMetaPortafolio,
        proyectos,
    } = useProyectos()

    const [cargando, setCargando] = useState(true)
    const [editandoNombre, setEditandoNombre] = useState(false)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [showModalProyecto, setShowModalProyecto] = useState(false)
    const [showModalMeta, setShowModalMeta] = useState(false)

    useEffect(() => {
        const cargar = async () => {
            await obtenerPortafolioById(id)
            setCargando(false)
        }
        cargar()
    }, [id])

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!portafolioActual) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500">
                <p className="text-lg font-medium">Portafolio no encontrado</p>
                <button onClick={() => navigate('/proyectos/portafolios')} className="mt-4 text-indigo-600 hover:underline text-sm">
                    Volver a portafolios
                </button>
            </div>
        )
    }

    const { nombre, color, proyectos: pProyectos = [], metas = [] } = portafolioActual

    // Stats globales
    const totalTareas = pProyectos.reduce((s, p) => s + (p.stats?.total ?? 0), 0)
    const totalCompletadas = pProyectos.reduce((s, p) => s + (p.stats?.completadas ?? 0), 0)
    const pctGlobal = totalTareas > 0 ? Math.round((totalCompletadas / totalTareas) * 100) : 0
    const activos = pProyectos.filter(p => p.estado === 'Activo').length
    const completados = pProyectos.filter(p => p.estado === 'Completado').length

    const handleEliminarPortafolio = async () => {
        if (!window.confirm(`¿Eliminar el portafolio "${nombre}"? También se eliminarán sus metas.`)) return
        await eliminarPortafolio(id)
        navigate('/proyectos/portafolios')
    }

    const handleGuardarNombre = async () => {
        if (!nuevoNombre.trim() || nuevoNombre.trim() === nombre) { setEditandoNombre(false); return }
        await actualizarPortafolio(id, { nombre: nuevoNombre.trim() })
        setEditandoNombre(false)
    }

    const handleQuitarProyecto = async (proyectoId) => {
        if (!window.confirm('¿Quitar este proyecto del portafolio?')) return
        await quitarProyectoPortafolio(id, proyectoId)
    }

    const handleEliminarMeta = async (portafolioId, metaId) => {
        if (!window.confirm('¿Eliminar esta meta?')) return
        await eliminarMetaPortafolio(portafolioId, metaId)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back */}
                <button
                    onClick={() => navigate('/proyectos/portafolios')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Portafolios
                </button>

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
                            <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        {editandoNombre ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={nuevoNombre}
                                    onChange={e => setNuevoNombre(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleGuardarNombre()}
                                    className="text-2xl font-bold text-slate-900 bg-white border border-indigo-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                                <button onClick={handleGuardarNombre} className="text-xs px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">OK</button>
                                <button onClick={() => setEditandoNombre(false)} className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-700">✕</button>
                            </div>
                        ) : (
                            <h1
                                className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-indigo-700 transition-colors"
                                onClick={() => { setNuevoNombre(nombre); setEditandoNombre(true) }}
                                title="Clic para editar"
                            >
                                {nombre}
                            </h1>
                        )}
                    </div>
                    <button
                        onClick={handleEliminarPortafolio}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                    </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Proyectos', value: pProyectos.length, icon: '📁' },
                        { label: 'Activos', value: activos, icon: '▶' },
                        { label: 'Completados', value: completados, icon: '✓' },
                        { label: 'Avance global', value: `${pctGlobal}%`, icon: '📊' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Barra progreso global */}
                {totalTareas > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-8">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">Progreso global de tareas</span>
                            <span className="font-semibold text-slate-800">{totalCompletadas} / {totalTareas} completadas</span>
                        </div>
                        <BarraProgreso pct={pctGlobal} color={color} height="h-3" />
                    </div>
                )}

                {/* Proyectos */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Proyectos</h2>
                        <button
                            onClick={() => setShowModalProyecto(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar proyecto
                        </button>
                    </div>
                    {pProyectos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
                            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <p className="text-sm text-slate-500">Sin proyectos en este portafolio</p>
                            <button onClick={() => setShowModalProyecto(true)} className="mt-3 text-sm text-indigo-600 hover:underline font-medium">Agregar proyecto</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pProyectos.map(p => (
                                <ProyectoCard key={p._id} proyecto={p} color={color} onQuitar={handleQuitarProyecto} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Metas */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Metas</h2>
                        <button
                            onClick={() => setShowModalMeta(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva meta
                        </button>
                    </div>
                    {metas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
                            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm text-slate-500">Sin metas definidas</p>
                            <button onClick={() => setShowModalMeta(true)} className="mt-3 text-sm text-indigo-600 hover:underline font-medium">Crear meta</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {metas.map(m => (
                                <MetaCard
                                    key={m._id}
                                    meta={m}
                                    portafolioId={id}
                                    onActualizar={actualizarMetaPortafolio}
                                    onEliminar={handleEliminarMeta}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModalProyecto && (
                <ModalAgregarProyecto
                    proyectos={proyectos}
                    proyectosEnPortafolio={pProyectos}
                    onAgregar={proyectoId => agregarProyectoPortafolio(id, proyectoId)}
                    onClose={() => setShowModalProyecto(false)}
                />
            )}

            {showModalMeta && (
                <ModalNuevaMeta
                    portafolioId={id}
                    onCrear={crearMetaPortafolio}
                    onClose={() => setShowModalMeta(false)}
                />
            )}
        </div>
    )
}

export default PortafolioDetalle
