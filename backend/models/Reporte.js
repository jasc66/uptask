import mongoose from "mongoose";

const reporteSchema = mongoose.Schema(
	{
		nombre: {
			type: String,
			trim: true,
			required: true,
		},
		descripcion: {
			type: String,
			trim: true,
			default: "",
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Usuario",
			required: true,
		},
		visibilidad: {
			type: String,
			enum: ["privado", "equipo", "organizacion"],
			default: "privado",
		},
		fuente: {
			type: String,
			enum: ["tareas", "proyectos", "usuarios"],
			required: true,
		},
		metricas: {
			type: [String],
			default: ["count"],
		},
		filtros: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		agrupacion: {
			type: String,
			default: "ninguno",
		},
		columnas: {
			type: [String],
			default: [],
		},
		ordenamiento: {
			campo: { type: String, default: null },
			direccion: { type: String, enum: ["asc", "desc"], default: "desc" },
		},
		visualizacion: {
			type: String,
			enum: ["tabla", "barras", "lineas", "donut", "kpi"],
			default: "tabla",
		},
	},
	{
		timestamps: true,
	}
);

const Reporte = mongoose.model("Reporte", reporteSchema);
export default Reporte;
