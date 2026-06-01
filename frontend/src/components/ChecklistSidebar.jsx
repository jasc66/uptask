import { useState } from 'react'
import useOnboarding from '../hooks/useOnboarding'

const ChecklistSidebar = () => {
    const { items, estaCompletado, porcentaje, todoCompletado, oculto, ocultarChecklist } = useOnboarding()
    const [expandido, setExpandido] = useState(true)

    if (oculto || todoCompletado) return null

    return (
        <div data-tour="checklist" className="mx-4 mb-3 bg-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpandido(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-white truncate">Primeros pasos</span>
                    <span className="text-[10px] font-bold text-indigo-400 shrink-0">{porcentaje}%</span>
                </div>
                <svg
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {expandido && (
                <div className="px-3 pb-3 space-y-1.5">
                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-700 rounded-full h-1 mb-2.5">
                        <div
                            className="h-1 rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${porcentaje}%` }}
                        />
                    </div>

                    {items.map(item => {
                        const done = estaCompletado(item.id)
                        return (
                            <div key={item.id} className={`flex items-center gap-2 text-xs transition-opacity ${done ? 'opacity-60' : ''}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-indigo-600' : 'border border-slate-500'}`}>
                                    {done && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`truncate ${done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                    {item.label}
                                </span>
                            </div>
                        )
                    })}

                    <button
                        onClick={ocultarChecklist}
                        className="mt-2 text-[11px] text-slate-500 hover:text-slate-400 transition-colors w-full text-left"
                    >
                        Ocultar guía
                    </button>
                </div>
            )}
        </div>
    )
}

export default ChecklistSidebar
