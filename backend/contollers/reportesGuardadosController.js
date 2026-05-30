import mongoose from "mongoose";
import Reporte from "../models/Reporte.js";
import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";
import Usuario from "../models/Usuario.js";

const getProyectosVisibles = async (usuario) => {
	if (usuario.rol === "admin") {
		const ps = await Proyecto.find({}, "_id").lean();
		return ps.map((p) => p._id);
	}
	const ps = await Proyecto.find(
		{
			$or: [
				{ creador: usuario._id },
				{ "colaboradores.usuario": usuario._id },
			],
		},
		"_id"
	).lean();
	return ps.map((p) => p._id);
};

const puedeVer = (reporte, usuario) => {
	if (usuario.rol === "admin") return true;
	if (reporte.visibilidad === "organizacion") return true;
	const ownerId = reporte.owner?._id ?? reporte.owner;
	return ownerId.toString() === usuario._id.toString();
};

const puedeEditar = (reporte, usuario) => {
	if (usuario.rol === "admin") return true;
	const ownerId = reporte.owner?._id ?? reporte.owner;
	return ownerId.toString() === usuario._id.toString();
};

// Definición de qué métricas y agrupaciones admite cada fuente — usado por el frontend para construir el wizard
export const FUENTES_DEFINICION = {
	tareas: {
		label: "Tareas",
		metricas: [
			{ id: "count", label: "Total" },
			{ id: "completadas", label: "Completadas" },
			{ id: "pendientes", label: "Pendientes" },
			{ id: "vencidas", label: "Vencidas" },
			{ id: "tiempoEstimadoTotal", label: "Horas estimadas" },
			{ id: "tiempoRealTotal", label: "Horas reales" },
		],
		agrupaciones: [
			{ id: "ninguno", label: "Sin agrupar (totales)" },
			{ id: "estado", label: "Por estado" },
			{ id: "prioridad", label: "Por prioridad" },
			{ id: "responsable", label: "Por responsable" },
			{ id: "proyecto", label: "Por proyecto" },
			{ id: "mes", label: "Por mes" },
		],
	},
	proyectos: {
		label: "Proyectos",
		metricas: [
			{ id: "count", label: "Total" },
			{ id: "activos", label: "Activos" },
			{ id: "completados", label: "Completados" },
			{ id: "pausados", label: "Pausados" },
			{ id: "cancelados", label: "Cancelados" },
		],
		agrupaciones: [
			{ id: "ninguno", label: "Sin agrupar (totales)" },
			{ id: "estado", label: "Por estado" },
			{ id: "area", label: "Por área" },
		],
	},
	usuarios: {
		label: "Usuarios",
		metricas: [
			{ id: "count", label: "Total" },
			{ id: "tareasAsignadas", label: "Tareas asignadas" },
			{ id: "tareasCompletadas", label: "Tareas completadas" },
		],
		agrupaciones: [
			{ id: "ninguno", label: "Sin agrupar (totales)" },
			{ id: "rol", label: "Por rol" },
		],
	},
};

// ---------- Motor de ejecución ----------

const toObjectIds = (arr = []) =>
	arr
		.filter((id) => mongoose.Types.ObjectId.isValid(id))
		.map((id) => new mongoose.Types.ObjectId(id));

const ejecutarTareas = async ({ metricas, filtros, agrupacion, ordenamiento }, usuario) => {
	const proyectosIds = await getProyectosVisibles(usuario);
	const ahora = new Date();

	const match = { proyecto: { $in: proyectosIds }, tareaPadre: null };

	if (filtros.estado?.length) match.estado = { $in: filtros.estado };
	if (filtros.prioridad?.length) match.prioridad = { $in: filtros.prioridad };
	if (filtros.proyecto?.length) {
		const ids = toObjectIds(filtros.proyecto);
		match.proyecto = { $in: ids.filter((id) => proyectosIds.some((p) => p.toString() === id.toString())) };
	}
	if (filtros.responsable?.length) {
		const ids = toObjectIds(filtros.responsable);
		match.$or = [
			...(match.$or || []),
			{ responsable: { $in: ids } },
			{ responsables: { $in: ids } },
		];
	}
	if (filtros.desde) match.createdAt = { ...(match.createdAt || {}), $gte: new Date(filtros.desde) };
	if (filtros.hasta) match.createdAt = { ...(match.createdAt || {}), $lte: new Date(filtros.hasta) };
	if (filtros.soloVencidas) {
		match.estado = { $ne: "Completada" };
		match.fechaEntrega = { $lt: ahora };
	}

	let groupId;
	if (agrupacion === "estado") groupId = "$estado";
	else if (agrupacion === "prioridad") groupId = "$prioridad";
	else if (agrupacion === "responsable") groupId = "$responsable";
	else if (agrupacion === "proyecto") groupId = "$proyecto";
	else if (agrupacion === "mes")
		groupId = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
	else groupId = null;

	const groupStage = { _id: groupId };
	if (metricas.includes("count")) groupStage.count = { $sum: 1 };
	if (metricas.includes("completadas"))
		groupStage.completadas = { $sum: { $cond: [{ $eq: ["$estado", "Completada"] }, 1, 0] } };
	if (metricas.includes("pendientes"))
		groupStage.pendientes = { $sum: { $cond: [{ $ne: ["$estado", "Completada"] }, 1, 0] } };
	if (metricas.includes("vencidas"))
		groupStage.vencidas = {
			$sum: {
				$cond: [
					{ $and: [{ $ne: ["$estado", "Completada"] }, { $lt: ["$fechaEntrega", ahora] }] },
					1,
					0,
				],
			},
		};
	if (metricas.includes("tiempoEstimadoTotal"))
		groupStage.tiempoEstimadoTotal = { $sum: { $ifNull: ["$tiempoEstimado", 0] } };
	if (metricas.includes("tiempoRealTotal"))
		groupStage.tiempoRealTotal = { $sum: { $ifNull: ["$tiempoReal", 0] } };

	const pipeline = [{ $match: match }, { $group: groupStage }];

	if (agrupacion === "responsable") {
		pipeline.push(
			{ $lookup: { from: "usuarios", localField: "_id", foreignField: "_id", as: "_u" } },
			{ $unwind: { path: "$_u", preserveNullAndEmptyArrays: true } },
			{ $addFields: { grupo: { $ifNull: ["$_u.nombre", "Sin asignar"] } } },
			{ $project: { _u: 0 } }
		);
	} else if (agrupacion === "proyecto") {
		pipeline.push(
			{ $lookup: { from: "proyectos", localField: "_id", foreignField: "_id", as: "_p" } },
			{ $unwind: { path: "$_p", preserveNullAndEmptyArrays: true } },
			{ $addFields: { grupo: { $ifNull: ["$_p.nombre", "Sin proyecto"] } } },
			{ $project: { _p: 0 } }
		);
	} else if (agrupacion === "ninguno") {
		pipeline.push({ $addFields: { grupo: "Total" } });
	} else {
		pipeline.push({ $addFields: { grupo: { $ifNull: ["$_id", "Sin valor"] } } });
	}

	const sortCampo = ordenamiento?.campo || (agrupacion === "mes" ? "grupo" : metricas[0] || "count");
	const sortDir = ordenamiento?.direccion === "asc" ? 1 : -1;
	pipeline.push({ $sort: { [sortCampo]: sortDir } });

	const filas = await Tarea.aggregate(pipeline);
	return {
		tipo: agrupacion === "ninguno" ? "kpi" : "agrupado",
		fuente: "tareas",
		agrupacion,
		columnas: ["grupo", ...metricas],
		filas,
	};
};

const ejecutarProyectos = async ({ metricas, filtros, agrupacion, ordenamiento }, usuario) => {
	const proyectosIds = await getProyectosVisibles(usuario);

	const match = { _id: { $in: proyectosIds } };
	if (filtros.estado?.length) match.estado = { $in: filtros.estado };
	if (filtros.area?.length) match.area = { $in: filtros.area };
	if (filtros.desde) match.createdAt = { ...(match.createdAt || {}), $gte: new Date(filtros.desde) };
	if (filtros.hasta) match.createdAt = { ...(match.createdAt || {}), $lte: new Date(filtros.hasta) };

	let groupId;
	if (agrupacion === "estado") groupId = "$estado";
	else if (agrupacion === "area") groupId = { $ifNull: ["$area", "Sin área"] };
	else groupId = null;

	const groupStage = { _id: groupId };
	if (metricas.includes("count")) groupStage.count = { $sum: 1 };
	if (metricas.includes("activos"))
		groupStage.activos = { $sum: { $cond: [{ $eq: ["$estado", "Activo"] }, 1, 0] } };
	if (metricas.includes("completados"))
		groupStage.completados = { $sum: { $cond: [{ $eq: ["$estado", "Completado"] }, 1, 0] } };
	if (metricas.includes("pausados"))
		groupStage.pausados = { $sum: { $cond: [{ $eq: ["$estado", "Pausado"] }, 1, 0] } };
	if (metricas.includes("cancelados"))
		groupStage.cancelados = { $sum: { $cond: [{ $eq: ["$estado", "Cancelado"] }, 1, 0] } };

	const pipeline = [{ $match: match }, { $group: groupStage }];
	pipeline.push({
		$addFields: {
			grupo: agrupacion === "ninguno" ? "Total" : { $ifNull: ["$_id", "Sin valor"] },
		},
	});

	const sortCampo = ordenamiento?.campo || metricas[0] || "count";
	const sortDir = ordenamiento?.direccion === "asc" ? 1 : -1;
	pipeline.push({ $sort: { [sortCampo]: sortDir } });

	const filas = await Proyecto.aggregate(pipeline);
	return {
		tipo: agrupacion === "ninguno" ? "kpi" : "agrupado",
		fuente: "proyectos",
		agrupacion,
		columnas: ["grupo", ...metricas],
		filas,
	};
};

const ejecutarUsuarios = async ({ metricas, filtros, agrupacion }, usuario) => {
	// Solo admin puede ejecutar reportes que listan usuarios
	if (usuario.rol !== "admin") {
		return { tipo: "kpi", fuente: "usuarios", agrupacion, columnas: ["grupo"], filas: [] };
	}

	const proyectosIds = await getProyectosVisibles(usuario);

	const match = {};
	if (filtros.rol?.length) match.rol = { $in: filtros.rol };

	const pipeline = [{ $match: match }];

	if (metricas.includes("tareasAsignadas") || metricas.includes("tareasCompletadas")) {
		pipeline.push({
			$lookup: {
				from: "tareas",
				let: { uid: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{
										$or: [
											{ $eq: ["$responsable", "$$uid"] },
											{ $in: ["$$uid", { $ifNull: ["$responsables", []] }] },
										],
									},
									{ $in: ["$proyecto", proyectosIds] },
								],
							},
						},
					},
				],
				as: "_tareas",
			},
		});
	}

	const groupStage = { _id: agrupacion === "rol" ? "$rol" : null };
	if (metricas.includes("count")) groupStage.count = { $sum: 1 };
	if (metricas.includes("tareasAsignadas"))
		groupStage.tareasAsignadas = { $sum: { $size: { $ifNull: ["$_tareas", []] } } };
	if (metricas.includes("tareasCompletadas"))
		groupStage.tareasCompletadas = {
			$sum: {
				$size: {
					$filter: {
						input: { $ifNull: ["$_tareas", []] },
						as: "t",
						cond: { $eq: ["$$t.estado", "Completada"] },
					},
				},
			},
		};
	pipeline.push({ $group: groupStage });
	pipeline.push({
		$addFields: {
			grupo: agrupacion === "ninguno" ? "Total" : { $ifNull: ["$_id", "Sin valor"] },
		},
	});
	pipeline.push({ $sort: { [metricas[0] || "count"]: -1 } });

	const filas = await Usuario.aggregate(pipeline);
	return {
		tipo: agrupacion === "ninguno" ? "kpi" : "agrupado",
		fuente: "usuarios",
		agrupacion,
		columnas: ["grupo", ...metricas],
		filas,
	};
};

export const ejecutarReporte = async (config, usuario) => {
	const params = {
		metricas: config.metricas?.length ? config.metricas : ["count"],
		filtros: config.filtros || {},
		agrupacion: config.agrupacion || "ninguno",
		ordenamiento: config.ordenamiento || {},
	};

	if (config.fuente === "tareas") return ejecutarTareas(params, usuario);
	if (config.fuente === "proyectos") return ejecutarProyectos(params, usuario);
	if (config.fuente === "usuarios") return ejecutarUsuarios(params, usuario);

	return { tipo: "tabla", fuente: config.fuente, agrupacion: params.agrupacion, columnas: [], filas: [] };
};

// ---------- Endpoints ----------

const listarReportes = async (req, res) => {
	try {
		const filtro =
			req.usuario.rol === "admin"
				? {}
				: { $or: [{ owner: req.usuario._id }, { visibilidad: "organizacion" }] };
		const reportes = await Reporte.find(filtro)
			.populate("owner", "nombre email")
			.sort({ updatedAt: -1 })
			.lean();
		res.json(reportes);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al listar reportes guardados" });
	}
};

const obtenerReporte = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Reporte no encontrado" });
		const reporte = await Reporte.findById(req.params.id).populate("owner", "nombre email");
		if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });
		if (!puedeVer(reporte, req.usuario)) return res.status(403).json({ msg: "Sin acceso al reporte" });
		res.json(reporte);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al obtener el reporte" });
	}
};

const crearReporte = async (req, res) => {
	try {
		const { nombre, fuente } = req.body;
		if (!nombre?.trim()) return res.status(400).json({ msg: "El nombre es obligatorio" });
		if (!fuente) return res.status(400).json({ msg: "La fuente es obligatoria" });
		if (!FUENTES_DEFINICION[fuente]) return res.status(400).json({ msg: "Fuente no soportada" });

		const reporte = new Reporte({
			...req.body,
			owner: req.usuario._id,
		});
		const guardado = await reporte.save();
		await guardado.populate("owner", "nombre email");
		res.status(201).json(guardado);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al crear el reporte" });
	}
};

const actualizarReporte = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Reporte no encontrado" });
		const reporte = await Reporte.findById(req.params.id);
		if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });
		if (!puedeEditar(reporte, req.usuario))
			return res.status(403).json({ msg: "Sin permisos para editar este reporte" });

		const campos = [
			"nombre",
			"descripcion",
			"visibilidad",
			"fuente",
			"metricas",
			"filtros",
			"agrupacion",
			"columnas",
			"ordenamiento",
			"visualizacion",
		];
		campos.forEach((c) => {
			if (req.body[c] !== undefined) reporte[c] = req.body[c];
		});

		const guardado = await reporte.save();
		await guardado.populate("owner", "nombre email");
		res.json(guardado);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al actualizar el reporte" });
	}
};

const eliminarReporte = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Reporte no encontrado" });
		const reporte = await Reporte.findById(req.params.id);
		if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });
		if (!puedeEditar(reporte, req.usuario))
			return res.status(403).json({ msg: "Sin permisos para eliminar este reporte" });
		await reporte.deleteOne();
		res.json({ msg: "Reporte eliminado" });
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al eliminar el reporte" });
	}
};

const obtenerDatos = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Reporte no encontrado" });
		const reporte = await Reporte.findById(req.params.id);
		if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });
		if (!puedeVer(reporte, req.usuario)) return res.status(403).json({ msg: "Sin acceso al reporte" });

		const datos = await ejecutarReporte(reporte.toObject(), req.usuario);
		res.json(datos);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al ejecutar el reporte" });
	}
};

const previewReporte = async (req, res) => {
	try {
		if (!req.body?.fuente) return res.status(400).json({ msg: "La fuente es obligatoria" });
		const datos = await ejecutarReporte(req.body, req.usuario);
		res.json(datos);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al generar la vista previa" });
	}
};

const getDefiniciones = async (_req, res) => {
	res.json(FUENTES_DEFINICION);
};

export {
	listarReportes,
	obtenerReporte,
	crearReporte,
	actualizarReporte,
	eliminarReporte,
	obtenerDatos,
	previewReporte,
	getDefiniciones,
};
