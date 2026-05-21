import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";
import Etiqueta from "../models/Etiqueta.js";
import Seccion from "../models/Seccion.js";
import Tarea from "../models/Tarea.js";

// --- helpers de permisos ---
// Soportan creador/usuario como ObjectId (sin populate) o Document (con populate)
const esCreador = (proyecto, usuarioId) => {
    const id = proyecto.creador?._id ?? proyecto.creador;
    return id.toString() === usuarioId.toString();
};

const esColaborador = (proyecto, usuarioId) =>
    proyecto.colaboradores.some(c => {
        const id = c.usuario?._id ?? c.usuario;
        return id.toString() === usuarioId.toString();
    });

const tieneAcceso = (proyecto, usuario) =>
    usuario.rol === 'admin' || esCreador(proyecto, usuario._id) || esColaborador(proyecto, usuario._id);

// --- controllers ---

const obtenerProyectos = async (req, res) => {
    let query;

    if (req.usuario.rol === 'admin') {
        query = Proyecto.find();
    } else {
        query = Proyecto.find({
            $or: [
                { creador: req.usuario._id },
                { 'colaboradores.usuario': req.usuario._id },
            ],
        });
    }

    const proyectos = await query.populate('tareas', 'estado');

    res.json(proyectos);
};

const nuevoProyecto = async (req, res) => {
    const proyecto = new Proyecto(req.body);
    proyecto.creador = req.usuario._id;

    try {
        const proyectoAlmacenado = await proyecto.save();
        res.json(proyectoAlmacenado);
    } catch (error) {
        console.log(error);
    }
};

const obtenerProyecto = async (req, res) => {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id)
        .populate({
            path: "tareas",
            populate: [
                { path: "responsable", select: "nombre email" },
                { path: "etiquetas", select: "nombre color" },
                { path: "subtareas", select: "nombre estado" },
                { path: "seccion", select: "nombre color" },
            ],
        })
        .populate("colaboradores.usuario", "nombre email")
        .populate("creador", "nombre email");

    if (!proyecto) {
        return res.status(404).json({ msg: "No Encontrado" });
    }
    if (!tieneAcceso(proyecto, req.usuario)) {
        return res.status(401).json({ msg: "Acción No Válida" });
    }

    res.json({ proyecto });
};

const editarProyecto = async (req, res) => {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
        return res.status(404).json({ msg: "No Encontrado" });
    }
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(401).json({ msg: "Acción No Válida" });
    }

    proyecto.nombre = req.body.nombre || proyecto.nombre;
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
    proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;
    proyecto.cliente = req.body.cliente || proyecto.cliente;
    proyecto.color = req.body.color || proyecto.color;
    if (req.body.estado !== undefined) proyecto.estado = req.body.estado;
    if (req.body.fechaInicio !== undefined) proyecto.fechaInicio = req.body.fechaInicio;
    if (req.body.area !== undefined) proyecto.area = req.body.area;

    try {
        const proyectoAlmacenado = await proyecto.save();
        res.json(proyectoAlmacenado);
    } catch (error) {
        console.log(error);
    }
};

const eliminarProyecto = async (req, res) => {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
        return res.status(404).json({ msg: "No Encontrado" });
    }
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(401).json({ msg: "Acción No Válida" });
    }

    try {
        await proyecto.deleteOne();
        res.json({ msg: "Proyecto Eliminado" });
    } catch (error) {
        console.log(error);
    }
};

const agregarColaborador = async (req, res) => {
    const { id } = req.params;
    const { email, rol = 'editor' } = req.body;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
        return res.status(404).json({ msg: "Proyecto no encontrado" });
    }
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Acción No Válida" });
    }

    const usuario = await Usuario.findOne({ email }).select('-password -token');
    if (!usuario) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    if (!usuario.confirmado) {
        return res.status(400).json({ msg: "El usuario no ha confirmado su cuenta" });
    }
    if (esCreador(proyecto, usuario._id)) {
        return res.status(400).json({ msg: "El creador del proyecto no puede ser colaborador" });
    }
    if (esColaborador(proyecto, usuario._id)) {
        return res.status(400).json({ msg: "El usuario ya es colaborador de este proyecto" });
    }

    proyecto.colaboradores.push({ usuario: usuario._id, rol });
    await proyecto.save();

    res.json({ msg: "Colaborador agregado correctamente", usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol } });
};

const eliminarColaborador = async (req, res) => {
    const { id } = req.params;
    const { usuarioId } = req.body;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
        return res.status(404).json({ msg: "Proyecto no encontrado" });
    }
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Acción No Válida" });
    }

    proyecto.colaboradores = proyecto.colaboradores.filter(
        c => c.usuario.toString() !== usuarioId
    );
    await proyecto.save();

    res.json({ msg: "Colaborador eliminado" });
};

const obtenerEtiquetas = async (req, res) => {
    const { id } = req.params;
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!tieneAcceso(proyecto, req.usuario)) return res.status(401).json({ msg: "Acción No Válida" });

    const etiquetas = await Etiqueta.find({ proyecto: id });
    res.json(etiquetas);
};

const crearEtiqueta = async (req, res) => {
    const { id } = req.params;
    const { nombre, color } = req.body;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Acción No Válida" });
    }

    try {
        const etiqueta = await Etiqueta.create({ nombre, color: color || '#6366f1', proyecto: id });
        res.json(etiqueta);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const eliminarEtiqueta = async (req, res) => {
    const { id, etiquetaId } = req.params;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Acción No Válida" });
    }

    try {
        await Etiqueta.findByIdAndDelete(etiquetaId);
        res.json({ msg: "Etiqueta eliminada" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const obtenerSecciones = async (req, res) => {
    const { id } = req.params;
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!tieneAcceso(proyecto, req.usuario)) return res.status(401).json({ msg: "Acción No Válida" });

    const secciones = await Seccion.find({ proyecto: id }).sort('orden');
    res.json(secciones);
};

const crearSeccion = async (req, res) => {
    const { id } = req.params;
    const { nombre, color } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ msg: "El nombre es obligatorio" });

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Sin permisos para crear secciones" });
    }

    const count = await Seccion.countDocuments({ proyecto: id });
    const seccion = await Seccion.create({
        nombre: nombre.trim(),
        color: color || '#94a3b8',
        orden: count,
        proyecto: id,
    });
    res.json(seccion);
};

const actualizarSeccion = async (req, res) => {
    const { id, seccionId } = req.params;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Sin permisos" });
    }

    const seccion = await Seccion.findById(seccionId);
    if (!seccion || seccion.proyecto.toString() !== id) {
        return res.status(404).json({ msg: "Sección no encontrada" });
    }

    if (req.body.nombre?.trim()) seccion.nombre = req.body.nombre.trim();
    if (req.body.color) seccion.color = req.body.color;
    if (req.body.orden !== undefined) seccion.orden = req.body.orden;
    await seccion.save();
    res.json(seccion);
};

const eliminarSeccion = async (req, res) => {
    const { id, seccionId } = req.params;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Sin permisos" });
    }

    const seccion = await Seccion.findById(seccionId);
    if (!seccion || seccion.proyecto.toString() !== id) {
        return res.status(404).json({ msg: "Sección no encontrada" });
    }

    await Tarea.updateMany({ seccion: seccionId }, { $set: { seccion: null } });
    await seccion.deleteOne();
    res.json({ msg: "Sección eliminada" });
};

const reordenarSecciones = async (req, res) => {
    const { id } = req.params;
    const { orden } = req.body;

    if (!Array.isArray(orden)) return res.status(400).json({ msg: "orden debe ser un array de IDs" });

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Sin permisos" });
    }

    await Promise.all(orden.map((secId, idx) =>
        Seccion.findByIdAndUpdate(secId, { orden: idx })
    ));

    const secciones = await Seccion.find({ proyecto: id }).sort('orden');
    res.json(secciones);
};

export {
    obtenerProyectos,
    obtenerProyecto,
    nuevoProyecto,
    editarProyecto,
    eliminarProyecto,
    agregarColaborador,
    eliminarColaborador,
    obtenerEtiquetas,
    crearEtiqueta,
    eliminarEtiqueta,
    obtenerSecciones,
    crearSeccion,
    actualizarSeccion,
    eliminarSeccion,
    reordenarSecciones,
};
