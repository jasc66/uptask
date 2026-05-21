import { useState, useEffect } from 'react'

const RealtimeBadge = ({ ultimaActualizacion, conectado }) => {
    const [hace, setHace] = useState('')

    useEffect(() => {
        if (!ultimaActualizacion) return
        const actualizar = () => {
            const diff = Math.floor((Date.now() - ultimaActualizacion) / 1000)
            if (diff < 5) setHace('ahora mismo')
            else if (diff < 60) setHace(`hace ${diff}s`)
            else setHace(`hace ${Math.floor(diff / 60)}min`)
        }
        actualizar()
        const id = setInterval(actualizar, 10000)
        return () => clearInterval(id)
    }, [ultimaActualizacion])

    if (!ultimaActualizacion) return null

    return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    conectado ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'
                }`}
            />
            <span>{conectado ? `Actualizado ${hace}` : 'Sin conexión en tiempo real'}</span>
        </div>
    )
}

export default RealtimeBadge
