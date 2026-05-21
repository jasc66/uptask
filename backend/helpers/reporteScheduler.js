import cron from "node-cron";
import ReporteProgramado from "../models/ReporteProgramado.js";
import Reporte from "../models/Reporte.js";
import Usuario from "../models/Usuario.js";
import { ejecutarReporte } from "../contollers/reportesGuardadosController.js";
import { emailReporteProgramado } from "./email.js";

const tareasCron = new Map();
const TIMEZONE = process.env.SCHEDULER_TZ || "America/Costa_Rica";

const construirCron = ({ frecuencia, hora, diaSemana, diaMes }) => {
	const [hStr, mStr] = (hora || "08:00").split(":");
	const h = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
	const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));

	if (frecuencia === "diaria") return `${m} ${h} * * *`;
	if (frecuencia === "semanal") {
		const dow = Math.min(6, Math.max(0, diaSemana ?? 1));
		return `${m} ${h} * * ${dow}`;
	}
	if (frecuencia === "mensual") {
		const dom = Math.min(28, Math.max(1, diaMes ?? 1));
		return `${m} ${h} ${dom} * *`;
	}
	return `${m} ${h} * * *`;
};

export const ejecutarProgramado = async (programadoId) => {
	const programado = await ReporteProgramado.findById(programadoId)
		.populate("reporte")
		.populate("owner");

	if (!programado) throw new Error("Reporte programado no encontrado");
	if (!programado.reporte) throw new Error("El reporte asociado fue eliminado");
	if (!programado.owner) throw new Error("El owner del programado fue eliminado");
	if (!programado.destinatarios?.length) throw new Error("No hay destinatarios configurados");

	const datos = await ejecutarReporte(programado.reporte.toObject(), programado.owner);

	await emailReporteProgramado({
		destinatarios: programado.destinatarios,
		programado,
		reporte: programado.reporte,
		datos,
	});

	programado.ultimaEjecucion = new Date();
	programado.ultimoEstado = "enviado";
	programado.ultimoError = null;
	await programado.save();

	return { ok: true, filas: datos?.filas?.length ?? 0 };
};

const ejecutarSeguro = async (programadoId) => {
	try {
		await ejecutarProgramado(programadoId);
	} catch (error) {
		console.error(`[scheduler] error al ejecutar ${programadoId}:`, error.message);
		try {
			await ReporteProgramado.findByIdAndUpdate(programadoId, {
				ultimaEjecucion: new Date(),
				ultimoEstado: "error",
				ultimoError: error.message?.slice(0, 500) ?? "Error desconocido",
			});
		} catch (e) {
			console.error("[scheduler] no se pudo registrar el error:", e.message);
		}
	}
};

export const registrarProgramado = (programado) => {
	desregistrarProgramado(programado._id);
	if (!programado.activo) return;

	const expresion = construirCron(programado);
	if (!cron.validate(expresion)) {
		console.warn(`[scheduler] expresión cron inválida para ${programado._id}: ${expresion}`);
		return;
	}

	const tarea = cron.schedule(
		expresion,
		() => ejecutarSeguro(programado._id),
		{ scheduled: true, timezone: TIMEZONE }
	);
	tareasCron.set(programado._id.toString(), tarea);
};

export const desregistrarProgramado = (programadoId) => {
	const id = programadoId.toString();
	const tarea = tareasCron.get(id);
	if (tarea) {
		tarea.stop();
		tareasCron.delete(id);
	}
};

export const initScheduler = async () => {
	try {
		const programados = await ReporteProgramado.find({ activo: true });
		programados.forEach((p) => registrarProgramado(p));
		console.log(`[scheduler] ${programados.length} reportes programados activos cargados`);
	} catch (error) {
		console.error("[scheduler] no se pudo inicializar:", error.message);
	}
};
