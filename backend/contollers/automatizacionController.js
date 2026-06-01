import Automatizacion from "../models/Automatizacion.js";
import Proyecto from "../models/Proyecto.js";

const verificarAcceso = async (proyectoId, usuario) => {
    const proyecto = await Proyecto.findById(proyectoId);
    if (!proyecto) return { error: 'Proyecto no encontrado', code: 404 };
    const esCreador = proyecto.creador.toString() === usuario._id.toString();
    const esAdminGlobal = usuario.rol === 'admin';
    const esAdminProyecto = proyecto.colaboradores.some(
        c => c.usuario.toString() === usuario._id.toString() && c.rol === 'admin'
    );
    if (!esCreador && !esAdminGlobal && !esAdminProyecto) {
        return { error: 'No tienes permisos para gestionar automatizaciones', code: 403 };
    }
    return { proyecto };
};

export const obtenerAutomatizaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { proyecto, error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const automatizaciones = await Automatizacion.find({ proyecto: id })
            .populate('creadoPor', 'nombre')
            .sort({ createdAt: -1 });
        res.json(automatizaciones);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al obtener automatizaciones' });
    }
};

export const crearAutomatizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { proyecto, error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const { nombre, trigger, accion } = req.body;
        if (!nombre?.trim()) return res.status(400).json({ msg: 'El nombre es obligatorio' });
        if (!trigger?.evento) return res.status(400).json({ msg: 'El trigger es obligatorio' });
        if (!accion?.tipo) return res.status(400).json({ msg: 'La acción es obligatoria' });
        const automatizacion = new Automatizacion({
            nombre: nombre.trim(),
            proyecto: id,
            trigger,
            accion,
            creadoPor: req.usuario._id,
        });
        await automatizacion.save();
        res.status(201).json(automatizacion);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al crear automatización' });
    }
};

export const actualizarAutomatizacion = async (req, res) => {
    try {
        const { id, automatizacionId } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const auto = await Automatizacion.findOne({ _id: automatizacionId, proyecto: id });
        if (!auto) return res.status(404).json({ msg: 'Automatización no encontrada' });
        const { nombre, trigger, accion, activa } = req.body;
        if (nombre) auto.nombre = nombre.trim();
        if (trigger) auto.trigger = trigger;
        if (accion) auto.accion = accion;
        if (activa !== undefined) auto.activa = activa;
        await auto.save();
        res.json(auto);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al actualizar automatización' });
    }
};

export const eliminarAutomatizacion = async (req, res) => {
    try {
        const { id, automatizacionId } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        await Automatizacion.findOneAndDelete({ _id: automatizacionId, proyecto: id });
        res.json({ msg: 'Automatización eliminada' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al eliminar automatización' });
    }
};

export const toggleAutomatizacion = async (req, res) => {
    try {
        const { id, automatizacionId } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const auto = await Automatizacion.findOne({ _id: automatizacionId, proyecto: id });
        if (!auto) return res.status(404).json({ msg: 'Automatización no encontrada' });
        auto.activa = !auto.activa;
        await auto.save();
        res.json(auto);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al cambiar estado de automatización' });
    }
};
