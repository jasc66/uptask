import mongoose from "mongoose";

const reporteProgramadoSchema = mongoose.Schema(
	{
		nombre: {
			type: String,
			trim: true,
			required: true,
		},
		reporte: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Reporte",
			required: true,
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Usuario",
			required: true,
		},
		frecuencia: {
			type: String,
			enum: ["diaria", "semanal", "mensual"],
			default: "semanal",
		},
		// Hora local de envío en formato HH:mm (0-23 horas)
		hora: {
			type: String,
			default: "08:00",
		},
		// Para semanal: 0 (domingo) - 6 (sábado)
		diaSemana: {
			type: Number,
			min: 0,
			max: 6,
			default: 1,
		},
		// Para mensual: 1 - 28 (limitado para evitar meses sin día 29/30/31)
		diaMes: {
			type: Number,
			min: 1,
			max: 28,
			default: 1,
		},
		destinatarios: {
			type: [String],
			default: [],
			validate: {
				validator: (arr) => arr.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
				message: "Algún destinatario tiene formato inválido",
			},
		},
		formato: {
			type: String,
			enum: ["html", "csv"],
			default: "html",
		},
		activo: {
			type: Boolean,
			default: true,
		},
		ultimaEjecucion: {
			type: Date,
			default: null,
		},
		ultimoEstado: {
			type: String,
			enum: ["pendiente", "enviado", "error"],
			default: "pendiente",
		},
		ultimoError: {
			type: String,
			default: null,
		},
	},
	{ timestamps: true }
);

const ReporteProgramado = mongoose.model("ReporteProgramado", reporteProgramadoSchema);
export default ReporteProgramado;
