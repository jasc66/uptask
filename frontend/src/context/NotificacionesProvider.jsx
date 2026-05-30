import { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react'
import clienteAxios from '../config/clienteAxios'
import AuthContext from './AuthProvider'
import useSocket from '../hooks/useSocket'

const NotificacionesContext = createContext()

const NotificacionesProvider = ({ children }) => {
    const { auth } = useContext(AuthContext)
    const [notificaciones, setNotificaciones] = useState([])
    const [noLeidas, setNoLeidas] = useState(0)
    const [cargando, setCargando] = useState(false)

    const cargar = useCallback(async () => {
        const token = localStorage.getItem('token')
        if (!token || !auth?._id) return
        setCargando(true)
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const [{ data: items }, { data: conteo }] = await Promise.all([
                clienteAxios('/notificaciones?limite=50', config),
                clienteAxios('/notificaciones/conteo', config),
            ])
            setNotificaciones(items)
            setNoLeidas(conteo.noLeidas ?? 0)
        } catch (error) {
            console.log(error)
        } finally {
            setCargando(false)
        }
    }, [auth?._id])

    useEffect(() => {
        if (!auth?._id) {
            setNotificaciones([])
            setNoLeidas(0)
            return
        }
        cargar()
    }, [auth?._id, cargar])

    // Stable ref para handler de socket
    const handlerRef = useRef(null)
    handlerRef.current = (noti) => {
        setNotificaciones(prev => [noti, ...prev].slice(0, 100))
        setNoLeidas(prev => prev + 1)
    }
    const onNotificacion = useCallback((noti) => handlerRef.current?.(noti), [])

    useSocket({ onNotificacion })

    const marcarLeida = async (id) => {
        const noti = notificaciones.find(n => n._id === id)
        if (noti?.leida) return
        setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n))
        setNoLeidas(prev => Math.max(0, prev - 1))
        try {
            const token = localStorage.getItem('token')
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.put(`/notificaciones/${id}/leer`, {}, config)
        } catch (error) {
            console.log(error)
        }
    }

    const marcarTodasLeidas = async () => {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
        setNoLeidas(0)
        try {
            const token = localStorage.getItem('token')
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.put('/notificaciones/leer-todas', {}, config)
        } catch (error) {
            console.log(error)
        }
    }

    const eliminar = async (id) => {
        const previa = notificaciones.find(n => n._id === id)
        setNotificaciones(prev => prev.filter(n => n._id !== id))
        if (previa && !previa.leida) setNoLeidas(prev => Math.max(0, prev - 1))
        try {
            const token = localStorage.getItem('token')
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/notificaciones/${id}`, config)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <NotificacionesContext.Provider
            value={{
                notificaciones,
                noLeidas,
                cargando,
                cargar,
                marcarLeida,
                marcarTodasLeidas,
                eliminar,
            }}
        >
            {children}
        </NotificacionesContext.Provider>
    )
}

export { NotificacionesProvider }
export default NotificacionesContext
