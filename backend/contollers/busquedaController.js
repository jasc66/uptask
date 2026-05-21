import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";

// Devuelve IDs de proyectos visibles para el usuario (row-level security)
const getProyectosVisibles = async (usuario) => {
    if (usuario.rol === 'admin') {
        const ps = await Proyecto.find({}, '_id').lean();
        return ps.map(p => p._id);
    }
    const ps = await Proyecto.find({
        $or: [
            { creador: usuario._id },
            { 'colaboradores.usuario': usuario._id },
        ],
    }, '_id').lean();
    return ps.map(p => p._id);
};

// Escape regex injection — input del usuario no se confía
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/buscar?q=texto
// Devuelve hasta 5 proyectos y 8 tareas con coincidencia case-insensitive
const buscarGlobal = async (req, res) => {
    const q = (req.query.q ?? '').trim();
    if (q.length < 2) {
        return res.json({ proyectos: [], tareas: [] });
    }
    try {
        const proyectosIds = await getProyectosVisibles(req.usuario);
        const regex = new RegExp(escaparRegex(q), 'i');

        const [proyectos, tareas] = await Promise.all([
            Proyecto.find(
                { _id: { $in: proyectosIds }, $or: [{ nombre: regex }, { cliente: regex }] },
                'nombre cliente color fechaEntrega',
            )
                .limit(5)
                .lean(),
            Tarea.find(
                {
                    proyecto: { $in: proyectosIds },
                    tareaPadre: null,
                    $or: [{ nombre: regex }, { descripcion: regex }],
                },
                'nombre estado prioridad fechaEntrega proyecto',
            )
                .populate('proyecto', 'nombre color')
                .limit(8)
                .lean(),
        ]);

        res.json({ proyectos, tareas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al buscar' });
    }
};

export { buscarGlobal };
