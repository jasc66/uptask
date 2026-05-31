import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";
import Etiqueta from "../models/Etiqueta.js";
import Seccion from "../models/Seccion.js";
import Tarea from "../models/Tarea.js";
import PlantillaProyecto from "../models/PlantillaProyecto.js";
import CampoPersonalizado from "../models/CampoPersonalizado.js";

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
                { path: "responsables", select: "nombre email" },
                { path: "etiquetas", select: "nombre color" },
                { path: "subtareas", select: "nombre estado" },
                { path: "seccion", select: "nombre color" },
                { path: "dependencias.tarea", select: "nombre estado" },
                { path: "camposPersonalizados.campo", select: "nombre tipo opciones" },
            ],
        })
        .populate("colaboradores.usuario", "nombre email")
        .populate("creador", "nombre email")
        .populate("statusUpdates.autor", "nombre email");

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

const obtenerCampos = async (req, res) => {
    const { id } = req.params;
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!tieneAcceso(proyecto, req.usuario)) return res.status(401).json({ msg: "Acción No Válida" });

    const campos = await CampoPersonalizado.find({ proyecto: id });
    res.json(campos);
};

const crearCampo = async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo, opciones } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ msg: "El nombre es obligatorio" });
    if (!tipo) return res.status(400).json({ msg: "El tipo es obligatorio" });

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Acción No Válida" });
    }

    try {
        const campo = await CampoPersonalizado.create({
            nombre: nombre.trim(),
            tipo,
            opciones: tipo === 'select' ? (opciones ?? []) : [],
            proyecto: id,
        });
        res.json(campo);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const actualizarCampo = async (req, res) => {
    const { id, campoId } = req.params;
    const { nombre, opciones } = req.body;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Acción No Válida" });
    }

    try {
        const updates = {};
        if (nombre?.trim()) updates.nombre = nombre.trim();
        if (opciones !== undefined) updates.opciones = opciones;
        const campo = await CampoPersonalizado.findByIdAndUpdate(campoId, updates, { new: true });
        if (!campo) return res.status(404).json({ msg: "Campo no encontrado" });
        res.json(campo);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const eliminarCampo = async (req, res) => {
    const { id, campoId } = req.params;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" });
    if (!esCreador(proyecto, req.usuario._id) && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: "Acción No Válida" });
    }

    try {
        await CampoPersonalizado.findByIdAndDelete(campoId);
        await Tarea.updateMany({ proyecto: id }, { $pull: { camposPersonalizados: { campo: campoId } } });
        res.json({ msg: "Campo eliminado" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
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

const exportarProyecto = async (req, res) => {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });
    if (!tieneAcceso(proyecto, req.usuario)) return res.status(401).json({ msg: 'Acción No Válida' });

    const [etiquetas, todasTareas] = await Promise.all([
        Etiqueta.find({ proyecto: id }),
        Tarea.find({ proyecto: id }).populate('etiquetas', 'nombre color'),
    ]);

    const etiquetasMap = new Map();
    const etiquetasExport = etiquetas.map((e, i) => {
        const local = `et${i + 1}`;
        etiquetasMap.set(e._id.toString(), local);
        return { _idLocal: local, nombre: e.nombre, color: e.color };
    });

    const tareasMap = new Map();
    todasTareas.forEach((t, i) => tareasMap.set(t._id.toString(), `t${i + 1}`));

    const childrenOf = {};
    todasTareas.forEach(t => {
        if (t.tareaPadre) {
            const pid = t.tareaPadre.toString();
            if (!childrenOf[pid]) childrenOf[pid] = [];
            childrenOf[pid].push(t);
        }
    });

    const serializarTarea = (t) => ({
        _idLocal: tareasMap.get(t._id.toString()),
        nombre: t.nombre,
        descripcion: t.descripcion,
        estado: t.estado,
        prioridad: t.prioridad,
        fechaInicio: t.fechaInicio ?? null,
        fechaEntrega: t.fechaEntrega ?? null,
        tiempoEstimado: t.tiempoEstimado ?? null,
        tiempoReal: t.tiempoReal ?? null,
        completadaEn: t.completadaEn ?? null,
        etiquetas: (t.etiquetas ?? []).map(e => etiquetasMap.get(e._id.toString())).filter(Boolean),
        subtareas: (childrenOf[t._id.toString()] ?? []).map(serializarTarea),
    });

    const tareasRaiz = todasTareas.filter(t => !t.tareaPadre);

    const payload = {
        version: '1',
        exportadoEn: new Date().toISOString(),
        exportadoPor: req.usuario.email,
        proyecto: {
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion,
            cliente: proyecto.cliente,
            fechaEntrega: proyecto.fechaEntrega ?? null,
            fechaInicio: proyecto.fechaInicio ?? null,
            area: proyecto.area ?? null,
            color: proyecto.color,
            estado: proyecto.estado,
        },
        etiquetas: etiquetasExport,
        tareas: tareasRaiz.map(serializarTarea),
    };

    const slug = proyecto.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="${slug}_nexo.json"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(payload);
};

const importarProyecto = async (req, res) => {
    const body = req.body;

    if (!body || body.version !== '1') {
        return res.status(400).json({ msg: 'Versión de archivo no soportada. Se requiere versión 1.' });
    }

    const { proyecto: p, etiquetas: etiquetasData = [], tareas: tareasData = [] } = body;

    if (!p?.nombre?.trim() || !p?.descripcion?.trim() || !p?.cliente?.trim()) {
        return res.status(400).json({ msg: 'El archivo de importación está incompleto (nombre, descripción o cliente faltantes).' });
    }

    const ESTADOS_PROYECTO = ['Activo', 'Pausado', 'Completado', 'Cancelado'];
    const ESTADOS_TAREA = ['Pendiente', 'En Progreso', 'En Revisión', 'Completada'];
    const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente'];

    let proyectoCreado = null;

    try {
        const existe = await Proyecto.findOne({ creador: req.usuario._id, nombre: p.nombre.trim() });
        const nombre = existe ? `${p.nombre.trim()} (importado)` : p.nombre.trim();

        proyectoCreado = await Proyecto.create({
            nombre,
            descripcion: p.descripcion.trim(),
            cliente: p.cliente.trim(),
            fechaEntrega: p.fechaEntrega || new Date(),
            fechaInicio: p.fechaInicio || null,
            area: p.area || null,
            color: p.color || '#6366f1',
            estado: ESTADOS_PROYECTO.includes(p.estado) ? p.estado : 'Activo',
            creador: req.usuario._id,
        });

        const etiquetasIdMap = {};
        for (const e of etiquetasData) {
            if (!e._idLocal || !e.nombre?.trim()) continue;
            const etiqueta = await Etiqueta.create({
                nombre: e.nombre.trim(),
                color: e.color || '#6366f1',
                proyecto: proyectoCreado._id,
            });
            etiquetasIdMap[e._idLocal] = etiqueta._id;
        }

        const flatten = (lista, padreLocal = null) => {
            const result = [];
            for (const t of (lista || [])) {
                result.push({ ...t, _padreLocal: padreLocal, subtareas: undefined });
                if (t.subtareas?.length) result.push(...flatten(t.subtareas, t._idLocal));
            }
            return result;
        };

        const tareasPlanas = flatten(tareasData);
        const tareasIdMap = {};

        for (const t of tareasPlanas) {
            if (!t._idLocal || !t.nombre?.trim()) continue;
            const tarea = await Tarea.create({
                nombre: t.nombre.trim(),
                descripcion: t.descripcion?.trim() || '-',
                estado: ESTADOS_TAREA.includes(t.estado) ? t.estado : 'Pendiente',
                prioridad: PRIORIDADES.includes(t.prioridad) ? t.prioridad : 'Media',
                fechaInicio: t.fechaInicio || null,
                fechaEntrega: t.fechaEntrega || new Date(),
                tiempoEstimado: t.tiempoEstimado || null,
                tiempoReal: t.tiempoReal || null,
                completadaEn: t.completadaEn || null,
                etiquetas: (t.etiquetas || []).map(loc => etiquetasIdMap[loc]).filter(Boolean),
                proyecto: proyectoCreado._id,
            });
            tareasIdMap[t._idLocal] = tarea._id;
            proyectoCreado.tareas.push(tarea._id);
        }
        await proyectoCreado.save();

        for (const t of tareasPlanas) {
            if (!t._padreLocal || !t._idLocal) continue;
            const tareaId = tareasIdMap[t._idLocal];
            const padreId = tareasIdMap[t._padreLocal];
            if (!tareaId || !padreId) continue;
            await Promise.all([
                Tarea.findByIdAndUpdate(tareaId, { tareaPadre: padreId }),
                Tarea.findByIdAndUpdate(padreId, { $push: { subtareas: tareaId } }),
            ]);
        }

        res.json({
            msg: `Proyecto "${nombre}" importado correctamente`,
            proyectoId: proyectoCreado._id,
        });

    } catch (error) {
        if (proyectoCreado?._id) {
            await Tarea.deleteMany({ proyecto: proyectoCreado._id }).catch(() => {});
            await Etiqueta.deleteMany({ proyecto: proyectoCreado._id }).catch(() => {});
            await Proyecto.findByIdAndDelete(proyectoCreado._id).catch(() => {});
        }
        console.error('Error en importarProyecto:', error);
        res.status(500).json({ msg: 'Error al importar el proyecto. Los cambios han sido revertidos.' });
    }
};

const agregarStatusUpdate = async (req, res) => {
    const { id } = req.params;
    const { estado, resumen } = req.body;

    const ESTADOS_VALIDOS = ['verde', 'amarillo', 'rojo'];
    if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ msg: 'Estado inválido. Usa verde, amarillo o rojo.' });
    }
    if (!resumen?.trim()) {
        return res.status(400).json({ msg: 'El resumen es obligatorio.' });
    }

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });
    if (!tieneAcceso(proyecto, req.usuario)) {
        return res.status(401).json({ msg: 'Acción No Válida' });
    }

    const update = {
        estado,
        resumen: resumen.trim(),
        autor: req.usuario._id,
        createdAt: new Date(),
    };

    proyecto.statusUpdates.push(update);
    await proyecto.save();

    const populado = await Proyecto.findById(id).select('statusUpdates').populate('statusUpdates.autor', 'nombre email');
    const ultimo = populado.statusUpdates[populado.statusUpdates.length - 1];
    res.json(ultimo);
};

const crearProyectoDesdePlantilla = async (req, res) => {
    const { plantillaId } = req.params;
    const { nombre, descripcion, cliente, fechaInicio, fechaEntrega, area, color } = req.body;

    const plantilla = await PlantillaProyecto.findById(plantillaId);
    if (!plantilla) return res.status(404).json({ msg: 'Plantilla no encontrada' });

    if (!nombre?.trim() || !cliente?.trim()) {
        return res.status(400).json({ msg: 'Nombre y cliente son obligatorios.' });
    }

    const base = fechaInicio ? new Date(fechaInicio) : new Date();
    base.setHours(0, 0, 0, 0);

    const proyecto = await Proyecto.create({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || plantilla.descripcion,
        cliente: cliente.trim(),
        fechaInicio: base,
        fechaEntrega: fechaEntrega || new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000),
        area: area || null,
        color: color || '#6366f1',
        creador: req.usuario._id,
    });

    const etiquetasIdMap = {};
    for (const e of (plantilla.etiquetasBase || [])) {
        const etiqueta = await Etiqueta.create({
            nombre: e.nombre,
            color: e.color,
            proyecto: proyecto._id,
        });
        etiquetasIdMap[e.nombre] = etiqueta._id;
    }

    for (const t of (plantilla.tareasBase || [])) {
        const inicio = new Date(base.getTime() + t.offsetDias * 24 * 60 * 60 * 1000);
        const entrega = new Date(inicio.getTime() + (t.duracionDias || 1) * 24 * 60 * 60 * 1000);

        const tarea = await Tarea.create({
            nombre: t.nombre,
            descripcion: t.descripcion || '-',
            prioridad: t.prioridad || 'Media',
            estado: 'Pendiente',
            fechaInicio: inicio,
            fechaEntrega: entrega,
            proyecto: proyecto._id,
        });
        proyecto.tareas.push(tarea._id);
    }
    await proyecto.save();

    res.json({ msg: `Proyecto "${proyecto.nombre}" creado desde plantilla`, proyectoId: proyecto._id });
};

export {
    obtenerProyectos,
    obtenerProyecto,
    nuevoProyecto,
    editarProyecto,
    eliminarProyecto,
    agregarColaborador,
    eliminarColaborador,
    obtenerCampos,
    crearCampo,
    actualizarCampo,
    eliminarCampo,
    obtenerEtiquetas,
    crearEtiqueta,
    eliminarEtiqueta,
    obtenerSecciones,
    crearSeccion,
    actualizarSeccion,
    eliminarSeccion,
    reordenarSecciones,
    exportarProyecto,
    importarProyecto,
    agregarStatusUpdate,
    crearProyectoDesdePlantilla,
};
