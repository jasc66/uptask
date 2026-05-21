import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

let io

export const initSocket = (httpServer) => {
    const origins = (process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',')
        .map(u => u.trim().replace(/\/$/, ''))
        .filter(Boolean)

    io = new Server(httpServer, {
        cors: {
            origin: origins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    })

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token
        if (!token) return next(new Error('No autorizado'))
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            socket.usuario = decoded
            next()
        } catch {
            next(new Error('Token inválido'))
        }
    })

    io.on('connection', (socket) => {
        const { id: usuarioId, rol } = socket.usuario

        socket.join(`usuario:${usuarioId}`)

        if (rol === 'admin') {
            socket.join('global')
        }

        socket.on('unirse:proyecto', (proyectoId) => {
            socket.join(`proyecto:${proyectoId}`)
        })

        socket.on('salir:proyecto', (proyectoId) => {
            socket.leave(`proyecto:${proyectoId}`)
        })
    })

    return io
}

export const getIO = () => io

export const emitirEventoTarea = (proyecto, tipo, payload) => {
    if (!io) return
    const datos = { tipo, ...payload }
    io.to(`proyecto:${proyecto._id}`).emit('tarea:evento', datos)
    io.to('global').emit('tarea:evento', datos)
    const creadorId = proyecto.creador?.toString()
    if (creadorId) io.to(`usuario:${creadorId}`).emit('tarea:evento', datos)
    for (const col of proyecto.colaboradores ?? []) {
        const colId = col.usuario?.toString()
        if (colId) io.to(`usuario:${colId}`).emit('tarea:evento', datos)
    }
}
