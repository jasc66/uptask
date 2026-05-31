import cron from "node-cron";
import Tarea from "../models/Tarea.js";
import Proyecto from "../models/Proyecto.js";

const TIMEZONE = process.env.SCHEDULER_TZ || "America/Costa_Rica";

export const calcNextDate = (base, patron, intervalo) => {
	const next = new Date(base);
	const n = Math.max(1, parseInt(intervalo, 10) || 1);
	if (patron === "diaria")   next.setDate(next.getDate() + n);
	else if (patron === "semanal")  next.setDate(next.getDate() + n * 7);
	else if (patron === "mensual")  next.setMonth(next.getMonth() + n);
	else if (patron === "anual")    next.setFullYear(next.getFullYear() + n);
	return next;
};

export const procesarTareasRecurrentes = async () => {
	const now = new Date();
	const tareas = await Tarea.find({
		"recurrencia.activa": true,
		"recurrencia.proximaInstancia": { $lte: now },
	}).populate("proyecto", "_id tareas nombre");

	if (!tareas.length) return;

	let creadas = 0;
	let desactivadas = 0;

	for (const tarea of tareas) {
		const rec = tarea.recurrencia;

		// Expiró la recurrencia
		if (rec.finRecurrencia && now > rec.finRecurrencia) {
			tarea.recurrencia.activa = false;
			await tarea.save();
			desactivadas++;
			continue;
		}

		// Clonar tarea como nueva instancia independiente
		const clon = new Tarea({
			nombre:         tarea.nombre,
			descripcion:    tarea.descripcion,
			estado:         "Pendiente",
			responsable:    tarea.responsable,
			responsables:   tarea.responsables,
			prioridad:      tarea.prioridad,
			tiempoEstimado: tarea.tiempoEstimado,
			proyecto:       tarea.proyecto._id,
			seccion:        tarea.seccion,
			etiquetas:      tarea.etiquetas,
			fechaInicio:    null,
			fechaEntrega:   rec.proximaInstancia,
			recurrencia:    { activa: false },
		});
		await clon.save();

		await Proyecto.findByIdAndUpdate(tarea.proyecto._id, {
			$push: { tareas: clon._id },
		});

		// Avanzar próxima instancia
		tarea.recurrencia.proximaInstancia = calcNextDate(
			rec.proximaInstancia,
			rec.patron,
			rec.intervalo
		);
		await tarea.save();
		creadas++;
	}

	console.log(`[recurrencia] ${creadas} tarea(s) creadas, ${desactivadas} desactivadas`);
};

export const initRecurrenciaScheduler = () => {
	cron.schedule("0 * * * *", procesarTareasRecurrentes, {
		scheduled: true,
		timezone: TIMEZONE,
	});
	console.log("[recurrencia] scheduler iniciado");
};
