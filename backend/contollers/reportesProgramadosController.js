import mongoose from "mongoose";
import ReporteProgramado from "../models/ReporteProgramado.js";
import Reporte from "../models/Reporte.js";
import {
	registrarProgramado,
	desregistrarProgramado,
	ejecutarProgramado,
} from "../helpers/reporteScheduler.js";

const esPropietario = (programado, usuario) => {
	if (usuario.rol === "admin") return true;
	const ownerId = programado.owner?._id ?? programado.owner;
	return ownerId.toString() === usuario._id.toString();
};

const reporteVisible = (reporte, usuario) => {
	if (usuario.rol === "admin") return true;
	if (reporte.visibilidad === "organizacion") return true;
	const ownerId = reporte.owner?._id ?? reporte.owner;
	return ownerId.toString() === usuario._id.toString();
};

const CAMPOS_EDITABLES = [
	"nombre",
	"reporte",
	"frecuencia",
	"hora",
	"diaSemana",
	"diaMes",
	"destinatarios",
	"formato",
	"activo",
];

const listarProgramados = async (req, res) => {
	try {
		const filtro = req.usuario.rol === "admin" ? {} : { owner: req.usuario._id };
		const programados = await ReporteProgramado.find(filtro)
			.populate("reporte", "nombre fuente visualizacion")
			.populate("owner", "nombre email")
			.sort({ updatedAt: -1 })
			.lean();
		res.json(programados);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al listar reportes programados" });
	}
};

const obtenerProgramado = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Programado no encontrado" });
		const programado = await ReporteProgramado.findById(req.params.id)
			.populate("reporte", "nombre fuente visualizacion")
			.populate("owner", "nombre email");
		if (!programado) return res.status(404).json({ msg: "Programado no encontrado" });
		if (!esPropietario(programado, req.usuario))
			return res.status(403).json({ msg: "Sin acceso a este programado" });
		res.json(programado);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al obtener el programado" });
	}
};

const crearProgramado = async (req, res) => {
	try {
		const { nombre, reporte: reporteId, destinatarios } = req.body;
		if (!nombre?.trim()) return res.status(400).json({ msg: "El nombre es obligatorio" });
		if (!mongoose.Types.ObjectId.isValid(reporteId))
			return res.status(400).json({ msg: "Reporte inválido" });
		if (!Array.isArray(destinatarios) || destinatarios.length === 0)
			return res.status(400).json({ msg: "Debes indicar al menos un destinatario" });

		const reporte = await Reporte.findById(reporteId);
		if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });
		if (!reporteVisible(reporte, req.usuario))
			return res.status(403).json({ msg: "Sin acceso al reporte base" });

		const data = {};
		CAMPOS_EDITABLES.forEach((c) => {
			if (req.body[c] !== undefined) data[c] = req.body[c];
		});

		const nuevo = new ReporteProgramado({ ...data, owner: req.usuario._id });
		const guardado = await nuevo.save();
		await guardado.populate([
			{ path: "reporte", select: "nombre fuente visualizacion" },
			{ path: "owner", select: "nombre email" },
		]);

		registrarProgramado(guardado);
		res.status(201).json(guardado);
	} catch (error) {
		if (error.name === "ValidationError") {
			return res.status(400).json({ msg: error.message });
		}
		console.log(error);
		res.status(500).json({ msg: "Error al crear el programado" });
	}
};

const actualizarProgramado = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Programado no encontrado" });
		const programado = await ReporteProgramado.findById(req.params.id);
		if (!programado) return res.status(404).json({ msg: "Programado no encontrado" });
		if (!esPropietario(programado, req.usuario))
			return res.status(403).json({ msg: "Sin permisos para editar este programado" });

		if (req.body.reporte && req.body.reporte !== programado.reporte.toString()) {
			if (!mongoose.Types.ObjectId.isValid(req.body.reporte))
				return res.status(400).json({ msg: "Reporte inválido" });
			const reporte = await Reporte.findById(req.body.reporte);
			if (!reporte) return res.status(404).json({ msg: "Reporte base no encontrado" });
			if (!reporteVisible(reporte, req.usuario))
				return res.status(403).json({ msg: "Sin acceso al reporte base" });
		}

		CAMPOS_EDITABLES.forEach((c) => {
			if (req.body[c] !== undefined) programado[c] = req.body[c];
		});

		const guardado = await programado.save();
		await guardado.populate([
			{ path: "reporte", select: "nombre fuente visualizacion" },
			{ path: "owner", select: "nombre email" },
		]);

		registrarProgramado(guardado);
		res.json(guardado);
	} catch (error) {
		if (error.name === "ValidationError") {
			return res.status(400).json({ msg: error.message });
		}
		console.log(error);
		res.status(500).json({ msg: "Error al actualizar el programado" });
	}
};

const eliminarProgramado = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Programado no encontrado" });
		const programado = await ReporteProgramado.findById(req.params.id);
		if (!programado) return res.status(404).json({ msg: "Programado no encontrado" });
		if (!esPropietario(programado, req.usuario))
			return res.status(403).json({ msg: "Sin permisos para eliminar este programado" });

		desregistrarProgramado(programado._id);
		await programado.deleteOne();
		res.json({ msg: "Programado eliminado" });
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al eliminar el programado" });
	}
};

const ejecutarAhora = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id))
			return res.status(404).json({ msg: "Programado no encontrado" });
		const programado = await ReporteProgramado.findById(req.params.id);
		if (!programado) return res.status(404).json({ msg: "Programado no encontrado" });
		if (!esPropietario(programado, req.usuario))
			return res.status(403).json({ msg: "Sin permisos para ejecutar este programado" });

		try {
			const resultado = await ejecutarProgramado(programado._id);
			res.json({ msg: "Reporte enviado correctamente", ...resultado });
		} catch (error) {
			await ReporteProgramado.findByIdAndUpdate(programado._id, {
				ultimaEjecucion: new Date(),
				ultimoEstado: "error",
				ultimoError: error.message?.slice(0, 500) ?? "Error desconocido",
			});
			res.status(500).json({ msg: error.message ?? "No se pudo enviar el reporte" });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Error al ejecutar el programado" });
	}
};

export {
	listarProgramados,
	obtenerProgramado,
	crearProgramado,
	actualizarProgramado,
	eliminarProgramado,
	ejecutarAhora,
};
