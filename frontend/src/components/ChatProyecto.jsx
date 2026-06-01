import { useState, useRef, useEffect } from 'react'

const BASE_API = `${import.meta.env.VITE_BACKEND_URL}/api`

const SUGERENCIAS = [
    '¿Cómo va el proyecto?',
    '¿Qué tareas están vencidas?',
    '¿Qué falta por completar?',
    '¿Quién tiene más carga de trabajo?',
]

const ChatProyecto = ({ proyectoId, nombreProyecto }) => {
    const [abierto, setAbierto] = useState(false)
    const [historial, setHistorial] = useState([])
    const [input, setInput] = useState('')
    const [enviando, setEnviando] = useState(false)
    const endRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (abierto) {
            setTimeout(() => inputRef.current?.focus(), 150)
        }
    }, [abierto])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [historial])

    const enviarMensaje = async (texto = input.trim()) => {
        if (!texto || enviando) return

        const nuevoHistorial = [...historial, { rol: 'user', contenido: texto }]
        setHistorial(nuevoHistorial)
        setInput('')
        setEnviando(true)

        // Placeholder streaming del asistente
        setHistorial(h => [...h, { rol: 'assistant', contenido: '', streaming: true }])

        try {
            const token = localStorage.getItem('token')
            const resp = await fetch(`${BASE_API}/ia/chat-proyecto/${proyectoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    mensaje: texto,
                    historial: nuevoHistorial.slice(0, -1).map(m => ({ rol: m.rol, contenido: m.contenido })),
                }),
            })

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`)
            }

            const reader = resp.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const payload = line.slice(6).trim()
                    if (payload === '[DONE]') continue
                    try {
                        const parsed = JSON.parse(payload)
                        if (parsed.chunk) {
                            setHistorial(h => {
                                const last = h[h.length - 1]
                                if (last?.streaming) {
                                    return [...h.slice(0, -1), { ...last, contenido: last.contenido + parsed.chunk }]
                                }
                                return h
                            })
                        }
                    } catch { /* skip malformed line */ }
                }
            }
        } catch {
            setHistorial(h => {
                const last = h[h.length - 1]
                if (last?.streaming) {
                    return [...h.slice(0, -1), { ...last, contenido: 'No pude conectarme con la IA. Intenta de nuevo.', streaming: false }]
                }
                return h
            })
        } finally {
            setHistorial(h => {
                const last = h[h.length - 1]
                if (last?.streaming) return [...h.slice(0, -1), { ...last, streaming: false }]
                return h
            })
            setEnviando(false)
        }
    }

    const limpiarChat = () => setHistorial([])

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setAbierto(v => !v)}
                title="Chat con IA sobre este proyecto"
                className={`fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
                    abierto
                        ? 'bg-violet-700 rotate-90 scale-95'
                        : 'bg-violet-600 hover:bg-violet-700 hover:scale-105'
                }`}
                style={{ width: '52px', height: '52px' }}
            >
                {abierto ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Panel de chat */}
            <div className={`fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 origin-bottom-right ${
                abierto ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`} style={{ maxHeight: '540px' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">Asistente IA</p>
                            <p className="text-[10px] text-slate-400 truncate">{nombreProyecto}</p>
                        </div>
                    </div>
                    {historial.length > 0 && (
                        <button
                            onClick={limpiarChat}
                            className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Limpiar conversación"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                    {historial.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 pt-4 pb-2">
                            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-400 text-center leading-relaxed">
                                Pregúntame cualquier cosa sobre este proyecto. Tengo acceso a todas las tareas, fechas y estados.
                            </p>
                            <div className="w-full space-y-1.5">
                                {SUGERENCIAS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => enviarMensaje(s)}
                                        className="w-full text-left text-xs text-slate-600 px-3 py-2 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 rounded-lg border border-slate-200 hover:border-violet-200 transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        historial.map((msg, i) => (
                            <div key={i} className={`flex ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                    msg.rol === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                                }`}>
                                    {msg.contenido || (msg.streaming && (
                                        <span className="flex items-center gap-1 h-4">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </span>
                                    ))}
                                    {msg.streaming && msg.contenido && (
                                        <span className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-middle" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="px-3 pb-3 pt-2 border-t border-slate-100 shrink-0">
                    <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-violet-300 focus-within:border-violet-300 transition-all">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    enviarMensaje()
                                }
                            }}
                            placeholder="Escribe tu pregunta…"
                            rows={1}
                            disabled={enviando}
                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none disabled:opacity-50 leading-5"
                            style={{ maxHeight: '80px' }}
                        />
                        <button
                            onClick={() => enviarMensaje()}
                            disabled={!input.trim() || enviando}
                            className="w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
                        >
                            {enviando ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 px-1">Enter para enviar · Shift+Enter para nueva línea</p>
                </div>
            </div>
        </>
    )
}

export default ChatProyecto
