import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace('/api', '') || 'http://localhost:4000'

let sharedSocket = null
let sharedRefCount = 0
let pendingDisconnect = null

const adquirirSocket = () => {
    if (pendingDisconnect) {
        clearTimeout(pendingDisconnect)
        pendingDisconnect = null
    }
    if (!sharedSocket) {
        const token = localStorage.getItem('token')
        if (!token) return null
        sharedSocket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        })
    }
    sharedRefCount += 1
    return sharedSocket
}

const liberarSocket = () => {
    sharedRefCount = Math.max(0, sharedRefCount - 1)
    if (sharedRefCount > 0) return
    pendingDisconnect = setTimeout(() => {
        if (sharedSocket && sharedRefCount === 0) {
            sharedSocket.disconnect()
            sharedSocket = null
        }
        pendingDisconnect = null
    }, 200)
}

const useSocket = ({ onEvento, proyectoId } = {}) => {
    const socketRef = useRef(null)

    useEffect(() => {
        const socket = adquirirSocket()
        if (!socket) return
        socketRef.current = socket

        if (proyectoId) socket.emit('unirse:proyecto', proyectoId)
        if (onEvento) socket.on('tarea:evento', onEvento)

        return () => {
            if (proyectoId) socket.emit('salir:proyecto', proyectoId)
            if (onEvento) socket.off('tarea:evento', onEvento)
            socketRef.current = null
            liberarSocket()
        }
    }, [proyectoId])

    return socketRef
}

export default useSocket
