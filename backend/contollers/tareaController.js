import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";
import Seccion from "../models/Seccion.js";
import Usuario from "../models/Usuario.js";
import { emitirEventoTarea } from "../socket.js";
import { crearNotificacion, extraerMenciones } from "../helpers/notificaciones.js";

// --- helpers de permisos ---
const esCreador = (proyecto, usuarioId) =>
    proyecto.creador.toString() === usuarioId.toString();

const esEditor = (proyecto, usuarioId) =>
    proyecto.colaboradores.some(
        c => c.usuario.toString() === usuarioId.toString() && (c.rol === 'editor' || c.rol === 'admin')
    );

const tieneAcceso = (proyecto, usuario) =>
    usuario.rol === 'admin' || esCreador(proyecto, usuario._id) ||
    proyecto.colaboradores.some(c => c.usuario.toString() === usuario._id.toString());

// --- helpers responsables ---
// Normaliza entrada del cliente a un array de strings sin duplicados ni nulls
const normalizarResponsables = (body) => {
    const lista = Array.isArray(body.responsables) ? body.responsables : null;
    if (lista) return [...new Set(lista.map(v => v?.toString()).filter(Boolean))];
    if (body.responsable) return [body.responsable.toString()];
    return [];
};

// Participantes del proyecto para resolver menciones
const obtenerParticipantes = async (proyecto) => {
    const ids = [proyecto.creador?.toString()].filter(Boolean);
    for (const c of proyecto.colaboradores ?? []) {
        const uid = c.usuario?._id?.toString() ?? c.usuario?.toString();
        if (uid) ids.push(uid);
    }
    const unicos = [...new Set(ids)];
    return Usuario.find({ _id: { $in: unicos } }).select("nombre email").lean();
};

// --- controllers ---

const agregarTarea = async (req, res) => {
    const { proyecto, nombre, descripcion, prioridad, fechaInicio, fechaEntrega } = req.body;

    try {
        const existeProyecto = await Proyecto.findById(proyecto);
        if (!existeProyecto) {
            return res.status(404).json({ msg: "El proyecto no existe" });
        }
        if (!esCreador(existeProyecto, req.usuario._id) && req.usuario.rol !== 'admin' && !esEditor(existeProyecto, req.usuario._id)) {
            return res.status(403).json({ msg: "No tienes los permisos para añadir tareas" });
        }

        const { etiquetas, tiempoEstimado, tiempoReal, seccion } = req.body;
        const responsables = normalizarResponsables(req.body);
        const responsablePrincipal = responsables[0] || null;
        const tareaAlmacenada = await Tarea.create({
            nombre, descripcion, prioridad, fechaInicio, fechaEntrega, proyecto,
            ...(responsablePrincipal ? { responsable: responsablePrincipal } : {}),
            ...(responsables.length ? { responsables } : {}),
            ...(etiquetas?.length ? { etiquetas } : {}),
            ...(tiempoEstimado != null ? { tiempoEstimado } : {}),
            ...(tiempoReal != null ? { tiempoReal } : {}),
            ...(seccion ? { seccion } : {}),
        });
        await Proyecto.findByIdAndUpdate(existeProyecto._id, {
            $push: { tareas: tareaAlmacenada._id },
        });
        emitirEventoTarea(existeProyecto, 'nueva', { tareaId: tareaAlmacenada._id, proyectoId: existeProyecto._id });

        // Notificar a cada responsable asignado al crear
        for (const uid of responsables) {
            await crearNotificacion({
                usuario: uid,
                tipo: 'asignacion',
                titulo: 'Te asignaron una tarea',
                mensaje: `${req.usuario.nombre} te asignó "${tareaAlmacenada.nombre}"`,
                proyecto: existeProyecto._id,
                tarea: tareaAlmacenada._id,
                origen: req.usuario._id,
            });
        }

        res.json(tareaAlmacenada);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
};

const obtenerTarea = async (req, res) => {
    const { id } = req.params;

    try {
        const tarea = await Tarea.findById(id)
            .populate("proyecto")
            .populate("responsable", "nombre email")
            .populate("responsables", "nombre email")
            .populate("etiquetas", "nombre color")
            .populate({ path: "subtareas", select: "nombre estado" })
            .populate({ path: "dependencias.tarea", select: "nombre estado fechaEntrega" })
            .populate({ path: "actividad.usuario", select: "nombre" })
            .populate({ path: "actividad.menciones", select: "nombre" });

        if (!tarea) {
            return res.status(404).json({ msg: "Tarea no encontrada" });
        }
        if (!tieneAcceso(tarea.proyecto, req.usuario)) {
            return res.status(403).json({ msg: "Acción no válida" });
        }

        res.json(tarea);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "ID de tarea no válido" });
    }
};

const actualizarTarea = async (req, res) => {
    const { id } = req.params;

    try {
        const tarea = await Tarea.findById(id).populate("proyecto");
        if (!tarea) {
            return res.status(404).json({ msg: "Tarea no encontrada" });
        }
        if (!esCreador(tarea.proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: "Acción no válida" });
        }

        const responsablesAnteriores = (tarea.responsables ?? [])
            .map(r => r.toString())
            .filter(Boolean);
        const responsablesAnteriorSet = new Set(responsablesAnteriores);

        tarea.nombre = req.body.nombre || tarea.nombre;
        tarea.descripcion = req.body.descripcion || tarea.descripcion;
        tarea.prioridad = req.body.prioridad || tarea.prioridad;
        tarea.fechaInicio = req.body.fechaInicio !== undefined ? req.body.fechaInicio : tarea.fechaInicio;
        tarea.fechaEntrega = req.body.fechaEntrega || tarea.fechaEntrega;

        const enviaResponsables = Array.isArray(req.body.responsables) || req.body.responsable !== undefined;
        if (enviaResponsables) {
            const nuevos = normalizarResponsables(req.body);
            tarea.responsables = nuevos;
            tarea.responsable = nuevos[0] || null;
        }
        if (req.body.etiquetas !== undefined) tarea.etiquetas = req.body.etiquetas;
        if (req.body.tiempoEstimado !== undefined) tarea.tiempoEstimado = req.body.tiempoEstimado;
        if (req.body.tiempoReal !== undefined) tarea.tiempoReal = req.body.tiempoReal;
        if (req.body.seccion !== undefined) tarea.seccion = req.body.seccion || null;

        let nuevasAsignaciones = [];
        if (enviaResponsables) {
            const actuales = (tarea.responsables ?? []).map(r => r.toString());
            nuevasAsignaciones = actuales.filter(uid => !responsablesAnteriorSet.has(uid));
            if (nuevasAsignaciones.length || actuales.length !== responsablesAnteriores.length) {
                tarea.actividad.push({
                    usuario: req.usuario._id,
                    tipo: 'cambio_responsable',
                    contenido: 'Actualizó los responsables de la tarea',
                });
            }
        }

        const tareaAlmacenada = await tarea.save();
        emitirEventoTarea(tarea.proyecto, 'actualizada', { tareaId: tarea._id, proyectoId: tarea.proyecto._id });

        for (const uid of nuevasAsignaciones) {
            await crearNotificacion({
                usuario: uid,
                tipo: 'asignacion',
                titulo: 'Te asignaron una tarea',
                mensaje: `${req.usuario.nombre} te asignó "${tareaAlmacenada.nombre}"`,
                proyecto: tarea.proyecto._id,
                tarea: tarea._id,
                origen: req.usuario._id,
            });
        }

        res.json(tareaAlmacenada);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
};

const eliminarTarea = async (req, res) => {
    const { id } = req.params;

    try {
        const tarea = await Tarea.findById(id).populate("proyecto");
        if (!tarea) {
            return res.status(404).json({ msg: "Tarea no Encontrada" });
        }
        if (!esCreador(tarea.proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: "Acción No Válida" });
        }

        const proyectoRef = tarea.proyecto;
        await Proyecto.findByIdAndUpdate(proyectoRef._id, {
            $pull: { tareas: tarea._id },
        });
        await tarea.deleteOne();
        emitirEventoTarea(proyectoRef, 'eliminada', { tareaId: tarea._id, proyectoId: proyectoRef._id });
        res.json({ msg: "Tarea Eliminada" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
};

const cambiarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ["Pendiente", "En Progreso", "En Revisión", "Completada"];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ msg: "Estado no válido" });
    }

    try {
        const tarea = await Tarea.findById(id).populate("proyecto");
        if (!tarea) {
            return res.status(404).json({ msg: "Tarea no encontrada" });
        }

        const proyecto = tarea.proyecto;
        const puedeModificar =
            req.usuario.rol === 'admin' ||
            esCreador(proyecto, req.usuario._id) ||
            esEditor(proyecto, req.usuario._id);

        if (!puedeModificar) {
            return res.status(403).json({ msg: "No tienes permisos para cambiar el estado" });
        }

        if (estado === 'Completada' && tarea.dependencias?.length) {
            const bloqueantes = tarea.dependencias.filter(d => d.tipo === 'depende_de');
            if (bloqueantes.length > 0) {
                const ids = bloqueantes.map(d => d.tarea);
                const pendientes = await Tarea.find({ _id: { $in: ids }, estado: { $ne: 'Completada' } })
                    .select('nombre');
                if (pendientes.length > 0) {
                    return res.status(400).json({
                        msg: `Tarea bloqueada por: ${pendientes.map(p => p.nombre).join(', ')}`,
                    });
                }
            }
        }

        const estadoAnterior = tarea.estado;
        tarea.estado = estado;
        tarea.completadaEn = estado === 'Completada' ? new Date() : null;
        tarea.actividad.push({
            usuario: req.usuario._id,
            tipo: 'cambio_estado',
            contenido: `Cambió el estado a "${estado}"`,
        });
        const tareaActualizada = await tarea.save();
        emitirEventoTarea(tarea.proyecto, 'estado', { tareaId: tarea._id, proyectoId: tarea.proyecto._id, estado });

        if (estadoAnterior !== estado) {
            const destinatarios = new Set();
            (tarea.responsables ?? []).forEach(r => destinatarios.add(r.toString()));
            if (tarea.responsable) destinatarios.add(tarea.responsable.toString());
            destinatarios.delete(req.usuario._id.toString());
            for (const uid of destinatarios) {
                await crearNotificacion({
                    usuario: uid,
                    tipo: 'cambio_estado',
                    titulo: `Tarea ahora "${estado}"`,
                    mensaje: `${req.usuario.nombre} cambió "${tarea.nombre}" a ${estado}`,
                    proyecto: tarea.proyecto._id,
                    tarea: tarea._id,
                    origen: req.usuario._id,
                });
            }

            // Si esta tarea bloqueaba a otras, notificar a sus responsables (dependencia_resuelta)
            if (estado === 'Completada' && tarea.dependencias?.length) {
                const bloqueadas = tarea.dependencias.filter(d => d.tipo === 'bloquea').map(d => d.tarea);
                if (bloqueadas.length) {
                    const tareasBloqueadas = await Tarea.find({ _id: { $in: bloqueadas } })
                        .select('nombre responsables responsable proyecto');
                    for (const tb of tareasBloqueadas) {
                        const ids = new Set();
                        (tb.responsables ?? []).forEach(r => ids.add(r.toString()));
                        if (tb.responsable) ids.add(tb.responsable.toString());
                        ids.delete(req.usuario._id.toString());
                        for (const uid of ids) {
                            await crearNotificacion({
                                usuario: uid,
                                tipo: 'dependencia_resuelta',
                                titulo: 'Dependencia resuelta',
                                mensaje: `"${tarea.nombre}" se completó — ya puedes avanzar con "${tb.nombre}"`,
                                proyecto: tb.proyecto,
                                tarea: tb._id,
                                origen: req.usuario._id,
                            });
                        }
                    }
                }
            }
        }

        res.json(tareaActualizada);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "ID de tarea no válido" });
    }
};

const obtenerMisTareas = async (req, res) => {
    try {
        const proyectos = await Proyecto.find({
            $or: [
                { creador: req.usuario._id },
                { 'colaboradores.usuario': req.usuario._id },
            ]
        }, '_id').lean()

        const proyectosIds = proyectos.map(p => p._id)

        const tareas = await Tarea.find({
            proyecto: { $in: proyectosIds },
            tareaPadre: null,
        })
            .populate('proyecto', 'nombre color')
            .populate('responsables', 'nombre email')
            .sort({ fechaEntrega: 1 })
            .lean()

        res.json(tareas)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ msg: error.message })
    }
}

const agregarComentario = async (req, res) => {
    const { id } = req.params;
    const { contenido } = req.body;

    if (!contenido?.trim()) {
        return res.status(400).json({ msg: "El comentario no puede estar vacío" });
    }

    try {
        const tarea = await Tarea.findById(id).populate("proyecto");
        if (!tarea) {
            return res.status(404).json({ msg: "Tarea no encontrada" });
        }
        if (!tieneAcceso(tarea.proyecto, req.usuario)) {
            return res.status(403).json({ msg: "Sin permisos para comentar en esta tarea" });
        }

        const participantes = await obtenerParticipantes(tarea.proyecto);
        const mencionados = extraerMenciones(contenido, participantes);
        const mencionadosIds = mencionados.map(m => m._id);

        tarea.actividad.push({
            usuario: req.usuario._id,
            tipo: "comentario",
            contenido: contenido.trim(),
            menciones: mencionadosIds,
        });

        await tarea.save();
        await tarea.populate({ path: "actividad.usuario", select: "nombre" });
        await tarea.populate({ path: "actividad.menciones", select: "nombre" });

        const nuevaEntrada = tarea.actividad[tarea.actividad.length - 1];

        // Notificaciones: menciones (alta prioridad) + responsables (comentario)
        const menciones = new Set(mencionadosIds.map(id => id.toString()));
        menciones.delete(req.usuario._id.toString());
        for (const uid of menciones) {
            await crearNotificacion({
                usuario: uid,
                tipo: 'mencion',
                titulo: 'Te mencionaron en un comentario',
                mensaje: `${req.usuario.nombre}: "${contenido.trim().slice(0, 120)}"`,
                proyecto: tarea.proyecto._id,
                tarea: tarea._id,
                origen: req.usuario._id,
            });
        }

        const responsables = new Set();
        (tarea.responsables ?? []).forEach(r => responsables.add(r.toString()));
        if (tarea.responsable) responsables.add(tarea.responsable.toString());
        responsables.delete(req.usuario._id.toString());
        for (const uid of menciones) responsables.delete(uid); // no duplicar con mención
        for (const uid of responsables) {
            await crearNotificacion({
                usuario: uid,
                tipo: 'comentario',
                titulo: 'Nuevo comentario en tu tarea',
                mensaje: `${req.usuario.nombre}: "${contenido.trim().slice(0, 120)}"`,
                proyecto: tarea.proyecto._id,
                tarea: tarea._id,
                origen: req.usuario._id,
            });
        }

        res.json(nuevaEntrada);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "ID de tarea no válido" });
    }
};

const agregarSubtarea = async (req, res) => {
    const { id } = req.params;
    const { nombre, fechaEntrega, prioridad = 'Media' } = req.body;

    if (!nombre?.trim()) {
        return res.status(400).json({ msg: "El nombre de la subtarea es obligatorio" });
    }

    try {
        const tareaParent = await Tarea.findById(id).populate("proyecto");
        if (!tareaParent) return res.status(404).json({ msg: "Tarea no encontrada" });
        if (!esCreador(tareaParent.proyecto, req.usuario._id) && !esEditor(tareaParent.proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: "Sin permisos para agregar subtareas" });
        }

        const subtarea = await Tarea.create({
            nombre: nombre.trim(),
            descripcion: '-',
            prioridad,
            fechaEntrega: fechaEntrega || tareaParent.fechaEntrega,
            proyecto: tareaParent.proyecto._id,
            tareaPadre: id,
        });

        tareaParent.subtareas.push(subtarea._id);
        await tareaParent.save();

        res.json(subtarea);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: error.message });
    }
};

const agregarDependencia = async (req, res) => {
    const { id } = req.params;
    const { tareaDependenciaId, tipo } = req.body;

    if (!['bloquea', 'depende_de'].includes(tipo)) {
        return res.status(400).json({ msg: "Tipo de dependencia no válido" });
    }
    if (!tareaDependenciaId || id === tareaDependenciaId) {
        return res.status(400).json({ msg: "Una tarea no puede depender de sí misma" });
    }

    try {
        const tareaOrigen = await Tarea.findById(id).populate("proyecto");
        const tareaDestino = await Tarea.findById(tareaDependenciaId);

        if (!tareaOrigen || !tareaDestino) {
            return res.status(404).json({ msg: "Tarea no encontrada" });
        }
        if (tareaOrigen.proyecto._id.toString() !== tareaDestino.proyecto.toString()) {
            return res.status(400).json({ msg: "Las tareas deben pertenecer al mismo proyecto" });
        }

        const proyecto = tareaOrigen.proyecto;
        if (!esCreador(proyecto, req.usuario._id) && !esEditor(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: "Sin permisos para gestionar dependencias" });
        }

        // Normalizar: representar siempre como "A depende_de B" (B debe terminar primero)
        const [tareaA, tareaB] = tipo === 'depende_de'
            ? [tareaOrigen, tareaDestino]
            : [tareaDestino, tareaOrigen];

        const yaExiste = tareaA.dependencias.some(
            d => d.tarea.toString() === tareaB._id.toString() && d.tipo === 'depende_de'
        );
        if (yaExiste) {
            return res.status(400).json({ msg: "Esta dependencia ya existe" });
        }

        // BFS de ciclos: desde B siguiendo cadenas "depende_de", verificar que no llegue a A
        const visitados = new Set();
        const cola = [tareaB._id.toString()];
        while (cola.length > 0) {
            const actualId = cola.shift();
            if (visitados.has(actualId)) continue;
            visitados.add(actualId);

            if (actualId === tareaA._id.toString()) {
                return res.status(400).json({ msg: "No se puede crear: generaría un ciclo de dependencias" });
            }

            const actual = await Tarea.findById(actualId).select('dependencias');
            if (!actual) continue;
            for (const dep of actual.dependencias) {
                if (dep.tipo === 'depende_de') cola.push(dep.tarea.toString());
            }
        }

        tareaA.dependencias.push({ tarea: tareaB._id, tipo: 'depende_de' });
        tareaB.dependencias.push({ tarea: tareaA._id, tipo: 'bloquea' });
        await tareaA.save();
        await tareaB.save();

        emitirEventoTarea(proyecto, 'actualizada', { tareaId: tareaOrigen._id, proyectoId: proyecto._id });
        emitirEventoTarea(proyecto, 'actualizada', { tareaId: tareaDestino._id, proyectoId: proyecto._id });

        res.json({
            msg: 'Dependencia agregada',
            origen: { _id: tareaOrigen._id, dependencias: tareaOrigen.dependencias },
            destino: { _id: tareaDestino._id, dependencias: tareaDestino.dependencias },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: error.message });
    }
};

const eliminarDependencia = async (req, res) => {
    const { id } = req.params;
    const { tareaDependenciaId } = req.body;

    if (!tareaDependenciaId) {
        return res.status(400).json({ msg: "Falta el ID de la dependencia" });
    }

    try {
        const tareaOrigen = await Tarea.findById(id).populate("proyecto");
        const tareaDestino = await Tarea.findById(tareaDependenciaId);
        if (!tareaOrigen || !tareaDestino) {
            return res.status(404).json({ msg: "Tarea no encontrada" });
        }

        const proyecto = tareaOrigen.proyecto;
        if (!esCreador(proyecto, req.usuario._id) && !esEditor(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: "Sin permisos para gestionar dependencias" });
        }

        tareaOrigen.dependencias = tareaOrigen.dependencias.filter(d => d.tarea.toString() !== tareaDependenciaId);
        tareaDestino.dependencias = tareaDestino.dependencias.filter(d => d.tarea.toString() !== id);
        await tareaOrigen.save();
        await tareaDestino.save();

        emitirEventoTarea(proyecto, 'actualizada', { tareaId: tareaOrigen._id, proyectoId: proyecto._id });
        emitirEventoTarea(proyecto, 'actualizada', { tareaId: tareaDestino._id, proyectoId: proyecto._id });

        res.json({
            msg: 'Dependencia eliminada',
            origen: { _id: tareaOrigen._id, dependencias: tareaOrigen.dependencias },
            destino: { _id: tareaDestino._id, dependencias: tareaDestino.dependencias },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: error.message });
    }
};

const moverSeccion = async (req, res) => {
    const { id } = req.params;
    const { seccionId } = req.body;

    try {
        const tarea = await Tarea.findById(id).populate("proyecto");
        if (!tarea) return res.status(404).json({ msg: "Tarea no encontrada" });

        const proyecto = tarea.proyecto;
        const puedeModificar =
            req.usuario.rol === 'admin' ||
            esCreador(proyecto, req.usuario._id) ||
            esEditor(proyecto, req.usuario._id);

        if (!puedeModificar) return res.status(403).json({ msg: "Sin permisos para mover la tarea" });

        if (seccionId) {
            const seccion = await Seccion.findById(seccionId);
            if (!seccion || seccion.proyecto.toString() !== proyecto._id.toString()) {
                return res.status(400).json({ msg: "Sección no válida para este proyecto" });
            }
        }

        tarea.seccion = seccionId || null;
        await tarea.save();
        emitirEventoTarea(proyecto, 'actualizada', { tareaId: tarea._id, proyectoId: proyecto._id });
        res.json({ _id: tarea._id, seccion: tarea.seccion });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: error.message });
    }
};

export {
    agregarTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado,
    agregarComentario,
    obtenerMisTareas,
    agregarSubtarea,
    moverSeccion,
    agregarDependencia,
    eliminarDependencia,
};
