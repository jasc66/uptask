import { useState, useEffect } from 'react'

export const ITEMS_ONBOARDING = [
    { id: 'crear_proyecto',       label: 'Crear tu primer proyecto',   icono: '📁' },
    { id: 'crear_tarea',          label: 'Crear una tarea',            icono: '✅' },
    { id: 'agregar_colaborador',  label: 'Agregar un colaborador',     icono: '👥' },
    { id: 'completar_tarea',      label: 'Completar una tarea',        icono: '🎯' },
    { id: 'crear_automatizacion', label: 'Crear una automatización',   icono: '⚡' },
]

const STORAGE_COMPLETADOS = 'nexo_onboarding_completados'
const STORAGE_OCULTO      = 'nexo_onboarding_oculto'
const STORAGE_TOUR        = 'nexo_tour_completado'

export const marcarProgresoOnboarding = (itemId) => {
    window.dispatchEvent(new CustomEvent('nexo:progreso', { detail: itemId }))
}

const useOnboarding = () => {
    const [completados, setCompletados] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_COMPLETADOS) ?? '[]') } catch { return [] }
    })
    const [oculto, setOculto] = useState(() => localStorage.getItem(STORAGE_OCULTO) === 'true')
    const [tourHecho, setTourHecho] = useState(() => localStorage.getItem(STORAGE_TOUR) === 'true')

    useEffect(() => {
        const handler = (e) => {
            const id = e.detail
            setCompletados(prev => {
                if (prev.includes(id)) return prev
                const next = [...prev, id]
                localStorage.setItem(STORAGE_COMPLETADOS, JSON.stringify(next))
                return next
            })
        }
        window.addEventListener('nexo:progreso', handler)
        return () => window.removeEventListener('nexo:progreso', handler)
    }, [])

    const todoCompletado = completados.length >= ITEMS_ONBOARDING.length
    const estaCompletado = (id) => completados.includes(id)
    const porcentaje = Math.round((completados.length / ITEMS_ONBOARDING.length) * 100)

    const ocultarChecklist = () => {
        setOculto(true)
        localStorage.setItem(STORAGE_OCULTO, 'true')
    }

    const marcarTourHecho = () => {
        setTourHecho(true)
        localStorage.setItem(STORAGE_TOUR, 'true')
    }

    const reiniciarOnboarding = () => {
        setCompletados([])
        setOculto(false)
        setTourHecho(false)
        localStorage.removeItem(STORAGE_COMPLETADOS)
        localStorage.removeItem(STORAGE_OCULTO)
        localStorage.removeItem(STORAGE_TOUR)
    }

    return {
        items: ITEMS_ONBOARDING,
        completados,
        todoCompletado,
        estaCompletado,
        porcentaje,
        oculto,
        ocultarChecklist,
        tourHecho,
        marcarTourHecho,
        reiniciarOnboarding,
    }
}

export default useOnboarding
