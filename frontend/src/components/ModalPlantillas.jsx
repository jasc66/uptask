import { useState, useEffect } from 'react'
import useProyectos from '../hooks/useProyectos'
import { useNavigate } from 'react-router-dom'

const PRIORIDAD_COLOR = {
    Alta: 'bg-red-100 text-red-700',
    Media: 'bg-amber-100 text-amber-700',
    Baja: 'bg-emerald-100 text-emerald-700',
    Urgente: 'bg-rose-100 text-rose-800',
}

const ModalPlantillas = ({ onClose }) => {
    const { plantillas, obtenerPlantillas, crearProyectoDesdePlantilla, eliminarPlantilla, mostrarAlerta } = useProyectos()
    const navigate = useNavigate()

    const [seleccionada, setSeleccionada] = useState(null)
    const [paso, setPaso] = useState('lista') // 'lista' | 'configurar'
    const [cargando, setCargando] = useState(false)
    const [form, setForm] = useState({
        nombre: '',
        cliente: '',
        descripcion: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        color: '#6366f1',
    })

    useEffect(() => {
        obtenerPlantillas()
    }, [])

    const COLORES = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#3b82f6', '#ef4444', '#64748b',
    ]

    const handleSeleccionar = (plantilla) => {
        setSeleccionada(plantilla)
        setForm(prev => ({ ...prev, nombre: plantilla.nombre, descripcion: plantilla.descripcion }))
        setPaso('configurar')
    }

    const handleCrear = async (e) => {
        e.preventDefault()
        if (!form.nombre.trim() || !form.cliente.trim()) return
        setCargando(true)
        const resultado = await crearProyectoDesdePlantilla(seleccionada._id, form)
        setCargando(false)
        if (resultado?.proyectoId) {
            onClose()
            navigate(`/proyectos/${resultado.proyectoId}`)
        }
    }

    const handleEliminar = async (plantillaId, e) => {
        e.stopPropagation()
        if (!window.confirm('¿Eliminar esta plantilla?')) return
        await eliminarPlantilla(plantillaId)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {paso === 'configurar' && (
                            <button
                                onClick={() => { setPaso('lista'); setSeleccionada(null) }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                {paso === 'lista' ? 'Plantillas de proyecto' : `Nuevo proyecto — ${seleccionada?.nombre}`}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {paso === 'lista'
                                    ? 'Crea un proyecto pre-configurado con tareas listas para usar'
                                    : 'Personaliza los datos básicos del nuevo proyecto'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Paso 1: Lista de plantillas */}
                {paso === 'lista' && (
                    <div className="flex-1 overflow-y-auto p-6">
                        {plantillas.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="text-slate-500 text-sm">No hay plantillas disponibles</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {plantillas.map(plantilla => (
                                    <button
                                        key={plantilla._id}
                                        onClick={() => handleSeleccionar(plantilla)}
                                        className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group relative"
                                    >
                                        {!plantilla.esPublica && (
                                            <button
                                                onClick={(e) => handleEliminar(plantilla._id, e)}
                                                className="absolute top-3 right-3 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                                                title="Eliminar plantilla"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                                                        {plantilla.nombre}
                                                    </h3>
                                                    {plantilla.esPublica && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">
                                                            Sistema
                                                        </span>
                                                    )}
                                                </div>
                                                {plantilla.descripcion && (
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{plantilla.descripcion}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                                                </svg>
                                                {plantilla.tareasBase?.length ?? 0} tareas
                                            </span>
                                            {plantilla.etiquetasBase?.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    {plantilla.etiquetasBase.slice(0, 3).map((e, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-block w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: e.color }}
                                                            title={e.nombre}
                                                        />
                                                    ))}
                                                    {plantilla.etiquetasBase.length > 3 && (
                                                        <span className="text-[10px] text-slate-400">+{plantilla.etiquetasBase.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {plantilla.tareasBase?.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                {plantilla.tareasBase.slice(0, 3).map((t, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORIDAD_COLOR[t.prioridad] ?? 'bg-slate-100 text-slate-500'}`}>
                                                            {t.prioridad}
                                                        </span>
                                                        <span className="text-xs text-slate-600 truncate">{t.nombre}</span>
                                                    </div>
                                                ))}
                                                {plantilla.tareasBase.length > 3 && (
                                                    <p className="text-[11px] text-slate-400 pl-1">
                                                        +{plantilla.tareasBase.length - 3} tareas más
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Paso 2: Configurar proyecto */}
                {paso === 'configurar' && seleccionada && (
                    <form onSubmit={handleCrear} className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Preview de tareas */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                Tareas incluidas ({seleccionada.tareasBase?.length ?? 0})
                            </p>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {seleccionada.tareasBase?.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORIDAD_COLOR[t.prioridad] ?? 'bg-slate-100 text-slate-500'}`}>
                                            {t.prioridad}
                                        </span>
                                        <span className="text-xs text-slate-700 truncate">{t.nombre}</span>
                                        <span className="text-[10px] text-slate-400 shrink-0 ml-auto">
                                            Día {t.offsetDias + 1}
                                            {t.duracionDias > 1 ? `–${t.offsetDias + t.duracionDias}` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Nombre del proyecto <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                                    required
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                                    placeholder="Nombre del proyecto"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Cliente <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.cliente}
                                    onChange={e => setForm(prev => ({ ...prev, cliente: e.target.value }))}
                                    required
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                                    placeholder="Nombre del cliente"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha de inicio</label>
                                <input
                                    type="date"
                                    value={form.fechaInicio}
                                    onChange={e => setForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#64748b'].map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, color: c }))}
                                            className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-indigo-400' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descripción</label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                    rows={2}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none"
                                    placeholder="Descripción del proyecto (opcional)"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setPaso('lista'); setSeleccionada(null) }}
                                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                type="submit"
                                disabled={cargando || !form.nombre.trim() || !form.cliente.trim()}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {cargando ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creando...
                                    </>
                                ) : 'Crear proyecto'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default ModalPlantillas
