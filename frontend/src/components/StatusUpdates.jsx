import { useState } from 'react'
import useProyectos from '../hooks/useProyectos'
import clienteAxios from '../config/clienteAxios'

const SEMAFORO = {
    verde: { bg: 'bg-emerald-500', ring: 'ring-emerald-400', label: 'En buen camino', text: 'text-emerald-700', light: 'bg-emerald-50 border-emerald-200' },
    amarillo: { bg: 'bg-amber-400', ring: 'ring-amber-300', label: 'En riesgo', text: 'text-amber-700', light: 'bg-amber-50 border-amber-200' },
    rojo: { bg: 'bg-red-500', ring: 'ring-red-400', label: 'Con problemas', text: 'text-red-700', light: 'bg-red-50 border-red-200' },
}

const StatusUpdates = ({ proyectoId, statusUpdates = [], puedePublicar }) => {
    const { agregarStatusUpdate } = useProyectos()
    const [mostrarForm, setMostrarForm] = useState(false)
    const [estadoForm, setEstadoForm] = useState('verde')
    const [resumen, setResumen] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [generandoIA, setGenerandoIA] = useState(false)
    const [mostrarTodos, setMostrarTodos] = useState(false)

    const ultimoUpdate = statusUpdates.length > 0 ? statusUpdates[statusUpdates.length - 1] : null
    const historial = [...statusUpdates].reverse()
    const visibles = mostrarTodos ? historial : historial.slice(0, 3)

    const generarConIA = async () => {
        setGenerandoIA(true)
        try {
            const token = localStorage.getItem('token')
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/ia/resumen-proyecto/${proyectoId}`, {}, config)
            setResumen(data.resumen ?? '')
            setEstadoForm(data.colorSugerido ?? 'verde')
            setMostrarForm(true)
        } catch {
            // silencia — el usuario puede seguir llenando manualmente
        } finally {
            setGenerandoIA(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!resumen.trim()) return
        setGuardando(true)
        await agregarStatusUpdate(proyectoId, { estado: estadoForm, resumen: resumen.trim() })
        setGuardando(false)
        setResumen('')
        setEstadoForm('verde')
        setMostrarForm(false)
    }

    const formatFecha = (date) =>
        new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-slate-800 text-sm">Estado del proyecto</h3>
                    {ultimoUpdate && (
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${SEMAFORO[ultimoUpdate.estado].light} ${SEMAFORO[ultimoUpdate.estado].text}`}>
                            <span className={`w-2 h-2 rounded-full ${SEMAFORO[ultimoUpdate.estado].bg}`} />
                            {SEMAFORO[ultimoUpdate.estado].label}
                        </span>
                    )}
                </div>
                {puedePublicar && (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={generarConIA}
                            disabled={generandoIA}
                            title="Generar resumen con IA"
                            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {generandoIA ? (
                                <span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                                <span>✨</span>
                            )}
                            {generandoIA ? 'Analizando…' : 'IA'}
                        </button>
                        <button
                            onClick={() => setMostrarForm(prev => !prev)}
                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Publicar update
                        </button>
                    </div>
                )}
            </div>

            {/* Formulario */}
            {mostrarForm && (
                <form onSubmit={handleSubmit} className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">¿Cómo va el proyecto?</p>
                        <div className="flex gap-2">
                            {['verde', 'amarillo', 'rojo'].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setEstadoForm(s)}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border-2 transition-all ${
                                        estadoForm === s
                                            ? `${SEMAFORO[s].light} border-current ${SEMAFORO[s].text} font-semibold`
                                            : 'border-transparent bg-white hover:bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded-full ${SEMAFORO[s].bg} ${estadoForm === s ? `ring-2 ring-offset-1 ${SEMAFORO[s].ring}` : ''}`} />
                                    <span className="text-[11px]">{SEMAFORO[s].label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <textarea
                            value={resumen}
                            onChange={e => setResumen(e.target.value)}
                            rows={3}
                            placeholder="Resume el avance, bloqueos o próximos pasos..."
                            required
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { setMostrarForm(false); setResumen('') }}
                            className="flex-1 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando || !resumen.trim()}
                            className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                            {guardando ? (
                                <>
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Publicando...
                                </>
                            ) : 'Publicar'}
                        </button>
                    </div>
                </form>
            )}

            {/* Historial */}
            {historial.length === 0 ? (
                <div className="text-center py-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-slate-400">Sin updates publicados aún</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibles.map((update, i) => {
                        const s = SEMAFORO[update.estado] ?? SEMAFORO.verde
                        const esUltimo = i === 0
                        return (
                            <div
                                key={update._id ?? i}
                                className={`flex gap-3 p-3 rounded-lg border ${esUltimo ? s.light : 'border-transparent'}`}
                            >
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <span className={`w-3 h-3 rounded-full mt-1 ${s.bg} ${esUltimo ? `ring-2 ring-offset-1 ${s.ring}` : 'opacity-60'}`} />
                                    {i < visibles.length - 1 && (
                                        <div className="w-px flex-1 bg-slate-200" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={`text-xs font-semibold ${esUltimo ? s.text : 'text-slate-500'}`}>
                                            {s.label}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {formatFecha(update.createdAt)}
                                        </span>
                                        {update.autor?.nombre && (
                                            <span className="text-[11px] text-slate-400">
                                                · {update.autor.nombre}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{update.resumen}</p>
                                </div>
                            </div>
                        )
                    })}
                    {historial.length > 3 && (
                        <button
                            onClick={() => setMostrarTodos(prev => !prev)}
                            className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            {mostrarTodos ? 'Ver menos' : `Ver ${historial.length - 3} updates anteriores`}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default StatusUpdates
