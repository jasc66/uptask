import Notificacion from "../models/Notificacion.js";
import { getIO } from "../socket.js";

const idOf = (v) => (v?._id ? v._id.toString() : v?.toString?.() ?? null);

export const crearNotificacion = async ({
    usuario,
    tipo,
    titulo,
    mensaje = "",
    proyecto = null,
    tarea = null,
    origen = null,
}) => {
    const usuarioId = idOf(usuario);
    if (!usuarioId) return null;
    if (origen && idOf(origen) === usuarioId) return null; // no avisar al propio actor

    const doc = await Notificacion.create({
        usuario: usuarioId,
        tipo,
        titulo,
        mensaje,
        proyecto: idOf(proyecto),
        tarea: idOf(tarea),
        origen: idOf(origen),
    });

    const populada = await Notificacion.findById(doc._id)
        .populate("origen", "nombre")
        .populate("proyecto", "nombre color")
        .populate("tarea", "nombre")
        .lean();

    const io = getIO();
    if (io) {
        io.to(`usuario:${usuarioId}`).emit("notificacion:nueva", populada);
    }
    return populada;
};

export const crearNotificacionesEnLote = async (lista) => {
    const resultados = [];
    for (const n of lista) {
        const r = await crearNotificacion(n);
        if (r) resultados.push(r);
    }
    return resultados;
};

// Extrae menciones tipo @nombre del contenido — devuelve array de usuarios match
// participantesProyecto = [{ _id, nombre }]
export const extraerMenciones = (contenido, participantesProyecto = []) => {
    if (!contenido || !participantesProyecto.length) return [];
    const texto = contenido.toLowerCase();
    const encontrados = new Map();
    for (const p of participantesProyecto) {
        if (!p?.nombre || !p?._id) continue;
        const partes = p.nombre.trim().toLowerCase().split(/\s+/).filter(Boolean);
        // match por nombre completo o por primer nombre (sin espacios) precedido de @
        const candidatos = new Set([
            p.nombre.toLowerCase().replace(/\s+/g, ""),
            partes[0],
        ]);
        for (const c of candidatos) {
            if (!c) continue;
            const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const re = new RegExp(`(?:^|[^\\w@])@${escaped}\\b`, "i");
            if (re.test(texto)) {
                encontrados.set(p._id.toString(), p);
                break;
            }
        }
    }
    return Array.from(encontrados.values());
};
