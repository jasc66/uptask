import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace('/api', '') || 'http://localhost:4000'

const useSocket = ({ onEvento, proyectoId } = {}) => {
    const socketRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        const socket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        })

        socketRef.current = socket

        if (proyectoId) {
            socket.emit('unirse:proyecto', proyectoId)
        }

        if (onEvento) {
            socket.on('tarea:evento', onEvento)
        }

        return () => {
            if (proyectoId) socket.emit('salir:proyecto', proyectoId)
            socket.disconnect()
            socketRef.current = null
        }
    }, [proyectoId])

    return socketRef
}

export default useSocket
