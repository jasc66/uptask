import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"

const COLORES = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

const PortafolioCard = ({ portafolio, onEliminar }) => {
    const navigate = useNavigate()
    const total = portafolio.proyectos?.length ?? 0

    return (
        <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate(`/proyectos/portafolios/${portafolio._id}`)}
        >
            <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: portafolio.color }} />
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: portafolio.color + '20' }}
                        >
                            <svg className="w-5 h-5" style={{ color: portafolio.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-slate-800 truncate">{portafolio.nombre}</h3>
                            {portafolio.descripcion && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">{portafolio.descripcion}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); onEliminar(portafolio._id, portafolio.nombre) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {total} {total === 1 ? 'proyecto' : 'proyectos'}
                    </span>
                </div>
            </div>
        </div>
    )
}

const ModalNuevoPortafolio = ({ onClose, onCreate }) => {
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [color, setColor] = useState(COLORES[0])
    const [guardando, setGuardando] = useState(false)

    const handleSubmit = async e => {
        e.preventDefault()
        if (!nombre.trim()) return
        setGuardando(true)
        await onCreate({ nombre: nombre.trim(), descripcion: descripcion.trim(), color })
        setGuardando(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">Nuevo portafolio</h2>
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
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            placeholder="Ej. Proyectos Q2 2026"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                        <textarea
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Descripción opcional…"
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORES.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando || !nombre.trim()}
                            className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                            {guardando ? 'Creando…' : 'Crear portafolio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const Portafolios = () => {
    const { portafolios, obtenerPortafolios, crearPortafolio, eliminarPortafolio } = useProyectos()
    const [showModal, setShowModal] = useState(false)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            await obtenerPortafolios()
            setCargando(false)
        }
        cargar()
    }, [])

    const handleEliminar = async (id, nombre) => {
        if (!window.confirm(`¿Eliminar el portafolio "${nombre}"? También se eliminarán sus metas.`)) return
        await eliminarPortafolio(id)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Portafolios</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Agrupa proyectos y realiza seguimiento de metas</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo portafolio
                    </button>
                </div>

                {/* Content */}
                {cargando ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : portafolios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700 mb-1">Sin portafolios aún</h2>
                        <p className="text-sm text-slate-500 max-w-sm mb-6">
                            Crea tu primer portafolio para agrupar proyectos relacionados y hacer seguimiento con metas.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            Crear portafolio
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {portafolios.map(p => (
                            <PortafolioCard key={p._id} portafolio={p} onEliminar={handleEliminar} />
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <ModalNuevoPortafolio
                    onClose={() => setShowModal(false)}
                    onCreate={crearPortafolio}
                />
            )}
        </div>
    )
}

export default Portafolios
