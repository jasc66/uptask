import mongoose from 'mongoose';
import Proyecto from '../models/Proyecto.js';
import Tarea from '../models/Tarea.js';
import Usuario from '../models/Usuario.js';

const ESTADOS_VALIDOS = ['Pendiente', 'En Progreso', 'En Revisión', 'Completada'];
const PRIORIDADES_VALIDAS = ['Baja', 'Media', 'Alta', 'Urgente'];
const ESTADOS_PROYECTO_VALIDOS = ['Activo', 'Pausado', 'Completado', 'Cancelado'];

// Parsea query params de filtro; devuelve fechaRange, filtrosEnum y narrowOpts
const parseFiltros = (query) => {
    const { fechaDesde, fechaHasta, prioridad, proyectoId, area, estadoProyecto } = query;

    const fechaRange = {};
    if (fechaDesde) fechaRange.$gte = new Date(fechaDesde);
    if (fechaHasta) {
        const h = new Date(fechaHasta);
        h.setHours(23, 59, 59, 999);
        fechaRange.$lte = h;
    }
    const hayFecha = !!(fechaRange.$gte || fechaRange.$lte);

    const filtrosEnum = {};
    if (prioridad) {
        const arr = (Array.isArray(prioridad) ? prioridad : prioridad.split(','))
            .filter(p => PRIORIDADES_VALIDAS.includes(p));
        if (arr.length > 0) filtrosEnum.prioridad = { $in: arr };
    }

    const narrowOpts = {};
    if (proyectoId && mongoose.Types.ObjectId.isValid(proyectoId)) {
        narrowOpts.proyectoId = new mongoose.Types.ObjectId(proyectoId);
    }
    if (area?.trim()) narrowOpts.area = area.trim();
    if (estadoProyecto && ESTADOS_PROYECTO_VALIDOS.includes(estadoProyecto)) {
        narrowOpts.estadoProyecto = estadoProyecto;
    }

    return { fechaRange, filtrosEnum, narrowOpts, hayFecha };
};

// Restringe los IDs de proyectos visibles según narrowOpts (proyectoId, area, estadoProyecto)
const applyNarrow = async (proyectosIds, narrowOpts) => {
    let ids = proyectosIds;

    if (narrowOpts.proyectoId) {
        const oidStr = narrowOpts.proyectoId.toString();
        ids = ids.filter(id => id.toString() === oidStr);
    }

    if (narrowOpts.area || narrowOpts.estadoProyecto) {
        const q = { _id: { $in: ids } };
        if (narrowOpts.area) q.area = { $regex: narrowOpts.area, $options: 'i' };
        if (narrowOpts.estadoProyecto) q.estado = narrowOpts.estadoProyecto;
        const ps = await Proyecto.find(q, '_id').lean();
        ids = ps.map(p => p._id);
    }

    return ids;
};

// Devuelve los IDs de proyectos visibles para el usuario (row-level security)
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

const tieneAcceso = (proyecto, usuario) => {
    const creadorId = proyecto.creador?._id ?? proyecto.creador;
    if (usuario.rol === 'admin' || creadorId.toString() === usuario._id.toString()) return true;
    return proyecto.colaboradores.some(c => {
        const uid = c.usuario?._id ?? c.usuario;
        return uid.toString() === usuario._id.toString();
    });
};

// GET /api/reportes/kpis
const getKpis = async (req, res) => {
    try {
        const { fechaRange, filtrosEnum, narrowOpts, hayFecha } = parseFiltros(req.query);
        const proyectosIdsBase = await getProyectosVisibles(req.usuario);
        const proyectosIds = await applyNarrow(proyectosIdsBase, narrowOpts);
        const ahora = new Date();
        const hace7Dias = new Date(ahora);
        hace7Dias.setDate(ahora.getDate() - 7);

        const base = { proyecto: { $in: proyectosIds }, tareaPadre: null, ...filtrosEnum };

        // Construir matchVencidas intersectando el rango de fechas con $lt:ahora
        const fechaVencidaCond = { $lt: ahora, ...(hayFecha && fechaRange.$gte ? { $gte: fechaRange.$gte } : {}) };
        const matchVencidaSemana = { $gte: hace7Dias, $lt: ahora };

        const [
            proyectosActivos,
            tareasTotales,
            tareasCompletadas,
            tareasVencidas,
            tareasCompletadasSemana,
            tareasVencidaSemana,
        ] = await Promise.all([
            Proyecto.countDocuments({ _id: { $in: proyectosIds }, fechaEntrega: { $gte: ahora } }),
            Tarea.countDocuments({ ...base, ...(hayFecha ? { fechaEntrega: fechaRange } : {}) }),
            Tarea.countDocuments({ ...base, estado: 'Completada', ...(hayFecha ? { fechaEntrega: fechaRange } : {}) }),
            Tarea.countDocuments({ ...base, estado: { $ne: 'Completada' }, fechaEntrega: fechaVencidaCond }),
            Tarea.countDocuments({ ...base, estado: 'Completada', updatedAt: { $gte: hace7Dias } }),
            Tarea.countDocuments({ ...base, estado: { $ne: 'Completada' }, fechaEntrega: matchVencidaSemana }),
        ]);

        // Proyectos atrasados: fechaEntrega pasada y con al menos una tarea no completada
        const idsAtrasados = (await Proyecto.find({
            _id: { $in: proyectosIds },
            fechaEntrega: { $lt: ahora },
        }, '_id').lean()).map(p => p._id);

        let proyectosAtrasados = 0;
        if (idsAtrasados.length > 0) {
            const r = await Tarea.aggregate([
                { $match: { proyecto: { $in: idsAtrasados }, estado: { $ne: 'Completada' }, tareaPadre: null } },
                { $group: { _id: '$proyecto' } },
                { $count: 'total' },
            ]);
            proyectosAtrasados = r[0]?.total ?? 0;
        }

        const tareasTotalesCount = tareasTotales;
        const tareasCompletadasCount = tareasCompletadas;

        res.json({
            totalProyectos: proyectosIds.length,
            proyectosActivos,
            proyectosAtrasados,
            tareasPendientes: tareasTotalesCount - tareasCompletadasCount,
            tareasVencidas,
            cumplimientoPct: tareasTotalesCount > 0 ? Math.round((tareasCompletadasCount / tareasTotalesCount) * 100) : 0,
            tareasCompletadasSemana,
            tareasVencidaSemana,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener KPIs' });
    }
};

// GET /api/reportes/tareas-por-estado
const getTareasPorEstado = async (req, res) => {
    try {
        const { fechaRange, filtrosEnum, narrowOpts, hayFecha } = parseFiltros(req.query);
        const proyectosIdsBase = await getProyectosVisibles(req.usuario);
        const proyectosIds = await applyNarrow(proyectosIdsBase, narrowOpts);
        const resultado = await Tarea.aggregate([
            {
                $match: {
                    proyecto: { $in: proyectosIds },
                    tareaPadre: null,
                    estado: { $in: ESTADOS_VALIDOS },
                    ...filtrosEnum,
                    ...(hayFecha ? { fechaEntrega: fechaRange } : {}),
                },
            },
            { $group: { _id: '$estado', count: { $sum: 1 } } },
            { $project: { _id: 0, estado: '$_id', count: 1 } },
            { $sort: { estado: 1 } },
        ]);
        res.json(resultado);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener tareas por estado' });
    }
};

// GET /api/reportes/tareas-por-prioridad
const getTareasPorPrioridad = async (req, res) => {
    try {
        const { fechaRange, narrowOpts, hayFecha } = parseFiltros(req.query);
        const proyectosIdsBase = await getProyectosVisibles(req.usuario);
        const proyectosIds = await applyNarrow(proyectosIdsBase, narrowOpts);
        const resultado = await Tarea.aggregate([
            {
                $match: {
                    proyecto: { $in: proyectosIds },
                    tareaPadre: null,
                    prioridad: { $in: PRIORIDADES_VALIDAS },
                    ...(hayFecha ? { fechaEntrega: fechaRange } : {}),
                },
            },
            { $group: { _id: '$prioridad', count: { $sum: 1 } } },
            { $project: { _id: 0, prioridad: '$_id', count: 1 } },
            { $sort: { prioridad: 1 } },
        ]);
        res.json(resultado);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener tareas por prioridad' });
    }
};

// GET /api/reportes/evolucion-mensual?meses=6
const getEvolucionMensual = async (req, res) => {
    try {
        const meses = Math.max(1, Math.min(24, parseInt(req.query.meses) || 6));
        const { narrowOpts } = parseFiltros(req.query);
        const proyectosIdsBase = await getProyectosVisibles(req.usuario);
        const proyectosIds = await applyNarrow(proyectosIdsBase, narrowOpts);
        const ahora = new Date();
        const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - meses + 1, 1);

        const matchBase = { proyecto: { $in: proyectosIds }, tareaPadre: null };

        const [creadasRaw, completadasRaw, vencidasRaw] = await Promise.all([
            Tarea.aggregate([
                { $match: { ...matchBase, createdAt: { $gte: fechaInicio } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, creadas: { $sum: 1 } } },
            ]),
            Tarea.aggregate([
                { $match: { ...matchBase, estado: 'Completada', updatedAt: { $gte: fechaInicio } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } }, completadas: { $sum: 1 } } },
            ]),
            Tarea.aggregate([
                { $match: { ...matchBase, estado: { $ne: 'Completada' }, fechaEntrega: { $gte: fechaInicio, $lte: ahora } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$fechaEntrega' } }, vencidas: { $sum: 1 } } },
            ]),
        ]);

        // Construir mapa con todos los meses del rango
        const mesesMap = {};
        for (let i = 0; i < meses; i++) {
            const d = new Date(ahora.getFullYear(), ahora.getMonth() - meses + 1 + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            mesesMap[key] = { mes: key, creadas: 0, completadas: 0, vencidas: 0 };
        }
        creadasRaw.forEach(({ _id, creadas }) => { if (mesesMap[_id]) mesesMap[_id].creadas = creadas; });
        completadasRaw.forEach(({ _id, completadas }) => { if (mesesMap[_id]) mesesMap[_id].completadas = completadas; });
        vencidasRaw.forEach(({ _id, vencidas }) => { if (mesesMap[_id]) mesesMap[_id].vencidas = vencidas; });

        res.json(Object.values(mesesMap));
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener evolución mensual' });
    }
};

// GET /api/reportes/carga-usuarios
const getCargaUsuarios = async (req, res) => {
    try {
        const { fechaRange, filtrosEnum, narrowOpts, hayFecha } = parseFiltros(req.query);
        const proyectosIdsBase = await getProyectosVisibles(req.usuario);
        const proyectosIds = await applyNarrow(proyectosIdsBase, narrowOpts);
        const ahora = new Date();
        const resultado = await Tarea.aggregate([
            {
                $match: {
                    proyecto: { $in: proyectosIds },
                    tareaPadre: null,
                    ...filtrosEnum,
                    ...(hayFecha ? { fechaEntrega: fechaRange } : {}),
                },
            },
            {
                $addFields: {
                    responsablesEfectivos: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ['$responsables', []] } }, 0] },
                            '$responsables',
                            { $cond: [{ $ifNull: ['$responsable', false] }, ['$responsable'], []] },
                        ],
                    },
                },
            },
            { $match: { 'responsablesEfectivos.0': { $exists: true } } },
            { $unwind: '$responsablesEfectivos' },
            {
                $group: {
                    _id: '$responsablesEfectivos',
                    tareasAbiertas: { $sum: { $cond: [{ $ne: ['$estado', 'Completada'] }, 1, 0] } },
                    tareasCompletadas: { $sum: { $cond: [{ $eq: ['$estado', 'Completada'] }, 1, 0] } },
                    tareasVencidas: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$estado', 'Completada'] }, { $lt: ['$fechaEntrega', ahora] }] },
                                1, 0,
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'usuarioData',
                },
            },
            { $unwind: '$usuarioData' },
            {
                $project: {
                    _id: 0,
                    usuario: { _id: '$usuarioData._id', nombre: '$usuarioData.nombre' },
                    tareasAbiertas: 1,
                    tareasCompletadas: 1,
                    tareasVencidas: 1,
                },
            },
            { $sort: { tareasAbiertas: -1 } },
        ]);
        res.json(resultado);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener carga de usuarios' });
    }
};

// GET /api/reportes/proyectos-resumen
const getProyectosResumen = async (req, res) => {
    try {
        const { narrowOpts } = parseFiltros(req.query);
        const proyectosIdsBase = await getProyectosVisibles(req.usuario);
        const proyectosIds = await applyNarrow(proyectosIdsBase, narrowOpts);
        const ahora = new Date();
        const resultado = await Proyecto.aggregate([
            { $match: { _id: { $in: proyectosIds } } },
            {
                $lookup: {
                    from: 'tareas',
                    localField: 'tareas',
                    foreignField: '_id',
                    as: 'tareasDetalle',
                },
            },
            {
                $addFields: {
                    // Solo tareas principales (no subtareas)
                    tareasDetalle: {
                        $filter: {
                            input: '$tareasDetalle',
                            as: 't',
                            cond: { $eq: ['$$t.tareaPadre', null] },
                        },
                    },
                },
            },
            {
                $addFields: {
                    totalTareas: { $size: '$tareasDetalle' },
                    completadas: {
                        $size: {
                            $filter: { input: '$tareasDetalle', as: 't', cond: { $eq: ['$$t.estado', 'Completada'] } },
                        },
                    },
                    atrasadas: {
                        $size: {
                            $filter: {
                                input: '$tareasDetalle',
                                as: 't',
                                cond: { $and: [{ $ne: ['$$t.estado', 'Completada'] }, { $lt: ['$$t.fechaEntrega', ahora] }] },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    progresoPct: {
                        $cond: [
                            { $gt: ['$totalTareas', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$completadas', '$totalTareas'] }, 100] }, 0] },
                            0,
                        ],
                    },
                },
            },
            {
                $project: {
                    proyecto: { _id: '$_id', nombre: '$nombre', fechaEntrega: '$fechaEntrega', color: '$color' },
                    totalTareas: 1,
                    completadas: 1,
                    atrasadas: 1,
                    progresoPct: 1,
                },
            },
            { $sort: { 'proyecto.fechaEntrega': 1 } },
        ]);
        res.json(resultado);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener resumen de proyectos' });
    }
};

// GET /api/reportes/proyecto/:id
const getReporteProyecto = async (req, res) => {
    try {
        const proyecto = await Proyecto.findById(req.params.id).lean();
        if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });
        if (!tieneAcceso(proyecto, req.usuario)) return res.status(403).json({ msg: 'Sin acceso a este proyecto' });

        const ahora = new Date();
        const proyectoId = proyecto._id;

        const tareas = await Tarea.find({ proyecto: proyectoId, tareaPadre: null })
            .populate('responsable', 'nombre email')
            .populate('responsables', 'nombre email')
            .lean();

        const totalTareas = tareas.length;
        const completadasCount = tareas.filter(t => t.estado === 'Completada').length;
        const avancePct = totalTareas > 0 ? Math.round((completadasCount / totalTareas) * 100) : 0;

        // Agrupaciones — solo valores válidos del enum (evita "false: 1" de datos antiguos)
        const estadoMap = {};
        const prioridadMap = {};
        tareas.forEach(t => {
            if (ESTADOS_VALIDOS.includes(t.estado)) {
                estadoMap[t.estado] = (estadoMap[t.estado] || 0) + 1;
            }
            if (PRIORIDADES_VALIDAS.includes(t.prioridad)) {
                prioridadMap[t.prioridad] = (prioridadMap[t.prioridad] || 0) + 1;
            }
        });
        const tareasPorEstado = Object.entries(estadoMap).map(([estado, count]) => ({ estado, count }));
        const tareasPorPrioridad = Object.entries(prioridadMap).map(([prioridad, count]) => ({ prioridad, count }));

        // Colaboradores con stats
        const todosIds = [proyecto.creador, ...proyecto.colaboradores.map(c => c.usuario)];
        const usuarios = await Usuario.find({ _id: { $in: todosIds } }, 'nombre email').lean();
        const usuariosMap = Object.fromEntries(usuarios.map(u => [u._id.toString(), u]));

        const colaboradores = todosIds.map(uid => {
            const uidStr = uid.toString();
            const u = usuariosMap[uidStr];
            const tareasUsuario = tareas.filter(t => {
                if (t.responsable?._id?.toString() === uidStr) return true;
                return (t.responsables ?? []).some(r => (r?._id ?? r)?.toString() === uidStr);
            });
            const esCreador = uidStr === proyecto.creador.toString();
            const colabEntry = proyecto.colaboradores.find(c => c.usuario.toString() === uidStr);
            const rol = esCreador ? 'creador' : (colabEntry?.rol ?? 'editor');
            return {
                usuario: { _id: uid, nombre: u?.nombre, email: u?.email },
                rol,
                asignadas: tareasUsuario.length,
                completadas: tareasUsuario.filter(t => t.estado === 'Completada').length,
                vencidas: tareasUsuario.filter(t => t.estado !== 'Completada' && t.fechaEntrega < ahora).length,
            };
        });

        // Actividad reciente (últimos 10 eventos entre todas las tareas)
        const actividadReciente = await Tarea.aggregate([
            { $match: { proyecto: proyectoId } },
            { $unwind: '$actividad' },
            { $sort: { 'actividad.createdAt': -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'actividad.usuario',
                    foreignField: '_id',
                    as: 'actUsuario',
                },
            },
            { $unwind: { path: '$actUsuario', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    tarea: '$nombre',
                    tipo: '$actividad.tipo',
                    contenido: '$actividad.contenido',
                    fecha: '$actividad.createdAt',
                    usuario: { _id: '$actUsuario._id', nombre: '$actUsuario.nombre' },
                },
            },
        ]);

        // Timeline básico para visualización
        const timeline = tareas.map(t => ({
            _id: t._id,
            nombre: t.nombre,
            estado: t.estado,
            prioridad: t.prioridad,
            fechaInicio: t.fechaInicio,
            fechaEntrega: t.fechaEntrega,
            responsable: t.responsable ? { _id: t.responsable._id, nombre: t.responsable.nombre } : null,
        }));

        res.json({
            avancePct,
            totalTareas,
            completadas: completadasCount,
            tareasPorEstado,
            tareasPorPrioridad,
            colaboradores,
            actividadReciente,
            timeline,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener reporte del proyecto' });
    }
};

// GET /api/reportes/usuario/:id
const getReporteUsuario = async (req, res) => {
    try {
        const targetId = req.params.id;

        // Solo admin puede ver reportes de otros usuarios
        if (req.usuario.rol !== 'admin' && req.usuario._id.toString() !== targetId) {
            return res.status(403).json({ msg: 'Sin acceso a este reporte de usuario' });
        }

        const proyectosIds = await getProyectosVisibles(req.usuario);
        const ahora = new Date();
        const targetObjectId = new mongoose.Types.ObjectId(targetId);

        const tareas = await Tarea.find({
            proyecto: { $in: proyectosIds },
            $or: [{ responsable: targetObjectId }, { responsables: targetObjectId }],
            tareaPadre: null,
        }).lean();

        const completadas = tareas.filter(t => t.estado === 'Completada').length;
        const vencidas = tareas.filter(t => t.estado !== 'Completada' && t.fechaEntrega < ahora).length;
        const enProgreso = tareas.filter(t => t.estado === 'En Progreso').length;

        // Productividad mensual últimos 6 meses — usar completadaEn cuando esté disponible,
        // fallback a updatedAt para tareas legacy completadas antes del campo
        const seisMesesAtras = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
        const productividadRaw = await Tarea.aggregate([
            {
                $match: {
                    proyecto: { $in: proyectosIds },
                    $or: [{ responsable: targetObjectId }, { responsables: targetObjectId }],
                    estado: 'Completada',
                    tareaPadre: null,
                },
            },
            {
                $addFields: {
                    fechaCompletado: { $ifNull: ['$completadaEn', '$updatedAt'] },
                },
            },
            { $match: { fechaCompletado: { $gte: seisMesesAtras } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$fechaCompletado' } }, completadas: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        const prodMap = {};
        for (let i = 0; i < 6; i++) {
            const d = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            prodMap[key] = { mes: key, completadas: 0 };
        }
        productividadRaw.forEach(({ _id, completadas: c }) => { if (prodMap[_id]) prodMap[_id].completadas = c; });

        // Tiempo promedio de resolución (horas): completadaEn - createdAt sobre tareas con
        // completadaEn definido. Tareas legacy sin completadaEn no entran en el cálculo.
        const resolucionRaw = await Tarea.aggregate([
            {
                $match: {
                    proyecto: { $in: proyectosIds },
                    $or: [{ responsable: targetObjectId }, { responsables: targetObjectId }],
                    estado: 'Completada',
                    completadaEn: { $ne: null },
                    tareaPadre: null,
                },
            },
            {
                $project: {
                    horas: { $divide: [{ $subtract: ['$completadaEn', '$createdAt'] }, 1000 * 60 * 60] },
                },
            },
            { $group: { _id: null, promedio: { $avg: '$horas' }, total: { $sum: 1 } } },
        ]);

        const tiempoPromedioResolucion = resolucionRaw[0]?.promedio != null
            ? Math.round(resolucionRaw[0].promedio * 10) / 10
            : null;

        res.json({
            total: tareas.length,
            completadas,
            vencidas,
            enProgreso,
            productividadMensual: Object.values(prodMap),
            tiempoPromedioResolucion, // en horas, basado en completadaEn - createdAt
            tiempoPromedioMuestra: resolucionRaw[0]?.total ?? 0,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener reporte de usuario' });
    }
};

export {
    getKpis,
    getTareasPorEstado,
    getTareasPorPrioridad,
    getEvolucionMensual,
    getCargaUsuarios,
    getProyectosResumen,
    getReporteProyecto,
    getReporteUsuario,
};
