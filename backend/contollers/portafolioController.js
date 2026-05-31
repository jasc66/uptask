import Portafolio from "../models/Portafolio.js";
import Meta from "../models/Meta.js";
import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";

const verificarAcceso = async (portafolioId, userId) => {
    const portafolio = await Portafolio.findById(portafolioId);
    if (!portafolio) return { error: 'Portafolio no encontrado', code: 404 };
    if (portafolio.creador.toString() !== userId.toString()) return { error: 'No tienes permisos', code: 403 };
    return { portafolio };
};

const calcularStatsProyectos = async (proyectoIds) => {
    const rows = await Tarea.aggregate([
        { $match: { proyecto: { $in: proyectoIds } } },
        {
            $group: {
                _id: '$proyecto',
                total: { $sum: 1 },
                completadas: { $sum: { $cond: [{ $eq: ['$estado', 'Completada'] }, 1, 0] } },
            },
        },
    ]);
    const map = {};
    rows.forEach(r => { map[r._id.toString()] = { total: r.total, completadas: r.completadas }; });
    return map;
};

export const obtenerPortafolios = async (req, res) => {
    try {
        const portafolios = await Portafolio.find({ creador: req.usuario._id })
            .select('nombre descripcion color proyectos createdAt')
            .lean();
        res.json(portafolios);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener portafolios' });
    }
};

export const crearPortafolio = async (req, res) => {
    try {
        const { nombre, descripcion, color } = req.body;
        if (!nombre?.trim()) return res.status(400).json({ msg: 'El nombre es obligatorio' });
        const portafolio = new Portafolio({
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() ?? '',
            color: color ?? '#6366f1',
            creador: req.usuario._id,
        });
        await portafolio.save();
        res.status(201).json(portafolio);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al crear portafolio' });
    }
};

export const obtenerPortafolio = async (req, res) => {
    try {
        const portafolio = await Portafolio.findById(req.params.id)
            .populate('creador', 'nombre email')
            .populate('proyectos', 'nombre color estado fechaEntrega fechaInicio cliente area')
            .lean();
        if (!portafolio) return res.status(404).json({ msg: 'Portafolio no encontrado' });
        if (portafolio.creador._id.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({ msg: 'No tienes permisos' });
        }
        const statsMap = await calcularStatsProyectos(portafolio.proyectos.map(p => p._id));
        const proyectosConStats = portafolio.proyectos.map(p => ({
            ...p,
            stats: statsMap[p._id.toString()] ?? { total: 0, completadas: 0 },
        }));
        const metas = await Meta.find({ portafolio: portafolio._id }).lean();
        res.json({ ...portafolio, proyectos: proyectosConStats, metas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener portafolio' });
    }
};

export const actualizarPortafolio = async (req, res) => {
    try {
        const { portafolio, error, code } = await verificarAcceso(req.params.id, req.usuario._id);
        if (error) return res.status(code).json({ msg: error });
        const { nombre, descripcion, color } = req.body;
        if (nombre) portafolio.nombre = nombre.trim();
        if (descripcion !== undefined) portafolio.descripcion = descripcion;
        if (color) portafolio.color = color;
        await portafolio.save();
        res.json(portafolio);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al actualizar portafolio' });
    }
};

export const eliminarPortafolio = async (req, res) => {
    try {
        const { portafolio, error, code } = await verificarAcceso(req.params.id, req.usuario._id);
        if (error) return res.status(code).json({ msg: error });
        await Meta.deleteMany({ portafolio: portafolio._id });
        await portafolio.deleteOne();
        res.json({ msg: 'Portafolio eliminado' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al eliminar portafolio' });
    }
};

export const agregarProyecto = async (req, res) => {
    try {
        const { portafolio, error, code } = await verificarAcceso(req.params.id, req.usuario._id);
        if (error) return res.status(code).json({ msg: error });
        const { proyectoId } = req.body;
        if (!proyectoId) return res.status(400).json({ msg: 'proyectoId es obligatorio' });
        const proyecto = await Proyecto.findById(proyectoId);
        if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });
        const esCreador = proyecto.creador.toString() === req.usuario._id.toString();
        const esColaborador = proyecto.colaboradores.some(c => c.usuario.toString() === req.usuario._id.toString());
        if (!esCreador && !esColaborador) return res.status(403).json({ msg: 'No tienes acceso a ese proyecto' });
        if (!portafolio.proyectos.map(p => p.toString()).includes(proyectoId.toString())) {
            portafolio.proyectos.push(proyectoId);
            await portafolio.save();
        }
        const proyectoDoc = await Proyecto.findById(proyectoId)
            .select('nombre color estado fechaEntrega fechaInicio cliente area')
            .lean();
        const statsArr = await Tarea.aggregate([
            { $match: { proyecto: proyecto._id } },
            { $group: { _id: null, total: { $sum: 1 }, completadas: { $sum: { $cond: [{ $eq: ['$estado', 'Completada'] }, 1, 0] } } } },
        ]);
        res.json({ ...proyectoDoc, stats: statsArr[0] ?? { total: 0, completadas: 0 } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al agregar proyecto' });
    }
};

export const quitarProyecto = async (req, res) => {
    try {
        const { portafolio, error, code } = await verificarAcceso(req.params.id, req.usuario._id);
        if (error) return res.status(code).json({ msg: error });
        portafolio.proyectos.pull(req.params.proyectoId);
        await portafolio.save();
        res.json({ msg: 'Proyecto quitado del portafolio' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al quitar proyecto' });
    }
};

export const crearMeta = async (req, res) => {
    try {
        const { portafolio, error, code } = await verificarAcceso(req.params.id, req.usuario._id);
        if (error) return res.status(code).json({ msg: error });
        const { nombre, descripcion, metrica, proyectosVinculados, estado } = req.body;
        if (!nombre?.trim()) return res.status(400).json({ msg: 'El nombre es obligatorio' });
        const meta = new Meta({
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() ?? '',
            portafolio: portafolio._id,
            metrica: metrica ?? { tipo: 'porcentaje', objetivo: 100, actual: 0 },
            proyectosVinculados: proyectosVinculados ?? [],
            estado: estado ?? 'activa',
            creador: req.usuario._id,
        });
        await meta.save();
        res.status(201).json(meta);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al crear meta' });
    }
};

export const actualizarMeta = async (req, res) => {
    try {
        const { portafolio, error, code } = await verificarAcceso(req.params.id, req.usuario._id);
        if (error) return res.status(code).json({ msg: error });
        const meta = await Meta.findOne({ _id: req.params.metaId, portafolio: portafolio._id });
        if (!meta) return res.status(404).json({ msg: 'Meta no encontrada' });
        const { nombre, descripcion, metrica, proyectosVinculados, estado } = req.body;
        if (nombre) meta.nombre = nombre.trim();
        if (descripcion !== undefined) meta.descripcion = descripcion;
        if (metrica) meta.metrica = { ...meta.metrica.toObject?.() ?? meta.metrica, ...metrica };
        if (proyectosVinculados) meta.proyectosVinculados = proyectosVinculados;
        if (estado) meta.estado = estado;
        await meta.save();
        res.json(meta);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al actualizar meta' });
    }
};

export const eliminarMeta = async (req, res) => {
    try {
        const { portafolio, error, code } = await verificarAcceso(req.params.id, req.usuario._id);
        if (error) return res.status(code).json({ msg: error });
        await Meta.findOneAndDelete({ _id: req.params.metaId, portafolio: portafolio._id });
        res.json({ msg: 'Meta eliminada' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al eliminar meta' });
    }
};
