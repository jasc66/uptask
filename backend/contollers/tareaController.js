import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";

// --- helpers de permisos ---
const esCreador = (proyecto, usuarioId) =>
    proyecto.creador.toString() === usuarioId.toString();

const esEditor = (proyecto, usuarioId) =>
    proyecto.colaboradores.some(
        c => c.usuario.toString() === usuarioId.toString() && c.rol === 'editor'
    );

const tieneAcceso = (proyecto, usuario) =>
    usuario.rol === 'admin' || esCreador(proyecto, usuario._id) ||
    proyecto.colaboradores.some(c => c.usuario.toString() === usuario._id.toString());

// --- controllers ---

const agregarTarea = async (req, res) => {
    const { proyecto, nombre, descripcion, prioridad, fechaInicio, fechaEntrega, responsable } = req.body;

    try {
        const existeProyecto = await Proyecto.findById(proyecto);
        if (!existeProyecto) {
            return res.status(404).json({ msg: "El proyecto no existe" });
        }
        if (!esCreador(existeProyecto, req.usuario._id) && req.usuario.rol !== 'admin' && !esEditor(existeProyecto, req.usuario._id)) {
            return res.status(403).json({ msg: "No tienes los permisos para añadir tareas" });
        }

        const { etiquetas } = req.body;
        const tareaAlmacenada = await Tarea.create({
            nombre, descripcion, prioridad, fechaInicio, fechaEntrega, responsable, proyecto,
            ...(etiquetas?.length ? { etiquetas } : {}),
        });
        await Proyecto.findByIdAndUpdate(existeProyecto._id, {
            $push: { tareas: tareaAlmacenada._id },
        });
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
            .populate("etiquetas", "nombre color")
            .populate({ path: "subtareas", select: "nombre estado" })
            .populate({ path: "actividad.usuario", select: "nombre" });

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

        const responsableAnterior = tarea.responsable?.toString()

        tarea.nombre = req.body.nombre || tarea.nombre;
        tarea.descripcion = req.body.descripcion || tarea.descripcion;
        tarea.prioridad = req.body.prioridad || tarea.prioridad;
        tarea.fechaInicio = req.body.fechaInicio !== undefined ? req.body.fechaInicio : tarea.fechaInicio;
        tarea.fechaEntrega = req.body.fechaEntrega || tarea.fechaEntrega;
        tarea.responsable = req.body.responsable || tarea.responsable;
        if (req.body.etiquetas !== undefined) tarea.etiquetas = req.body.etiquetas;

        if (req.body.responsable && req.body.responsable !== responsableAnterior) {
            tarea.actividad.push({
                usuario: req.usuario._id,
                tipo: 'cambio_responsable',
                contenido: 'Cambió el responsable de la tarea',
            })
        }

        const tareaAlmacenada = await tarea.save();
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

        await Proyecto.findByIdAndUpdate(tarea.proyecto._id, {
            $pull: { tareas: tarea._id },
        });
        await tarea.deleteOne();
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

        tarea.estado = estado;
        tarea.actividad.push({
            usuario: req.usuario._id,
            tipo: 'cambio_estado',
            contenido: `Cambió el estado a "${estado}"`,
        });
        const tareaActualizada = await tarea.save();
        res.json(tareaActualizada);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "ID de tarea no válido" });
    }
};

const obtenerMisTareas = async (req, res) => {
    try {
        const tareas = await Tarea.find({ responsable: req.usuario._id })
            .populate('proyecto', 'nombre color')
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

        tarea.actividad.push({
            usuario: req.usuario._id,
            tipo: "comentario",
            contenido: contenido.trim(),
        });

        await tarea.save();
        await tarea.populate({ path: "actividad.usuario", select: "nombre" });

        const nuevaEntrada = tarea.actividad[tarea.actividad.length - 1];
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

export {
    agregarTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado,
    agregarComentario,
    obtenerMisTareas,
    agregarSubtarea,
};
