import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useNotificaciones from '../hooks/useNotificaciones'

const TIPO_LABEL = {
    mencion: { icon: '@', label: 'Menciones', color: 'bg-purple-100 text-purple-700' },
    asignacion: { icon: '👤', label: 'Asignaciones', color: 'bg-indigo-100 text-indigo-700' },
    cambio_estado: { icon: '✓', label: 'Estados', color: 'bg-blue-100 text-blue-700' },
    comentario: { icon: '💬', label: 'Comentarios', color: 'bg-sky-100 text-sky-700' },
    vencimiento: { icon: '⏰', label: 'Vencimientos', color: 'bg-amber-100 text-amber-700' },
    dependencia_resuelta: { icon: '🔓', label: 'Dependencias', color: 'bg-emerald-100 text-emerald-700' },
}

const FILTROS = [
    { id: 'todas', label: 'Todas' },
    { id: 'noleidas', label: 'No leídas' },
    { id: 'mencion', label: 'Menciones' },
    { id: 'asignacion', label: 'Asignaciones' },
]

const Notificaciones = () => {
    const { notificaciones, noLeidas, cargando, marcarLeida, marcarTodasLeidas, eliminar } = useNotificaciones() ?? {}
    const navigate = useNavigate()
    const [filtro, setFiltro] = useState('todas')

    const lista = useMemo(() => {
        if (!notificaciones) return []
        if (filtro === 'todas') return notificaciones
        if (filtro === 'noleidas') return notificaciones.filter(n => !n.leida)
        return notificaciones.filter(n => n.tipo === filtro)
    }, [notificaciones, filtro])

    const abrir = (n) => {
        marcarLeida(n._id)
        if (n.proyecto?._id) {
            const tareaParam = n.tarea?._id ? `?tarea=${n.tarea._id}` : ''
            navigate(`/proyectos/${n.proyecto._id}${tareaParam}`)
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notificaciones</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
                    </p>
                </div>
                {noLeidas > 0 && (
                    <button
                        onClick={marcarTodasLeidas}
                        className="text-sm px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                    >
                        Marcar todas leídas
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
                {FILTROS.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFiltro(f.id)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                            filtro === f.id
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {cargando && (
                    <div className="px-4 py-6 text-sm text-slate-400 text-center">Cargando…</div>
                )}
                {!cargando && lista.length === 0 && (
                    <div className="px-4 py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-600">Sin notificaciones</p>
                        <p className="text-xs text-slate-400 mt-1">Te avisaremos cuando algo ocurra en tus proyectos</p>
                    </div>
                )}
                {lista.map(n => {
                    const meta = TIPO_LABEL[n.tipo] ?? { icon: '🔔', label: n.tipo, color: 'bg-slate-100 text-slate-700' }
                    return (
                        <div
                            key={n._id}
                            className={`group flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${!n.leida ? 'bg-indigo-50/30' : ''}`}
                        >
                            <button
                                onClick={() => abrir(n)}
                                className="flex-1 flex items-start gap-3 text-left min-w-0"
                            >
                                <span className={`text-base shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.color}`} aria-hidden>
                                    {meta.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-slate-800">{n.titulo}</p>
                                        {!n.leida && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                                    </div>
                                    {n.mensaje && (
                                        <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{n.mensaje}</p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">
                                        {n.proyecto?.nombre && <span>{n.proyecto.nombre} · </span>}
                                        {n.tarea?.nombre && <span>{n.tarea.nombre} · </span>}
                                        {new Date(n.createdAt).toLocaleString('es-MX', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </button>
                            <button
                                onClick={() => eliminar(n._id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1"
                                title="Eliminar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Notificaciones
