import mongoose from "mongoose";

const tareaSchema = mongoose.Schema({
	nombre: {
		type: String,
		trim: true,
		required: true,
	},
	descripcion: {
		type: String,
		trim: true,
		required: true,
	},
	estado: {
		type: String,
		enum: ["Pendiente", "En Progreso", "En Revisión", "Completada"],
		default: "Pendiente",
	},
	responsable: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Usuario",
	},
	fechaInicio: {
		type: Date,
		default: null,
	},
	fechaEntrega: {
		type: Date,
		required: true,
		default: Date.now(),
	},
	prioridad: {
		type: String,
		required: true,
		enum: ["Baja", "Media", "Alta", "Urgente"],
	},
	tiempoEstimado: {
		type: Number,
		default: null,
	},
	tiempoReal: {
		type: Number,
		default: null,
	},
	completadaEn: {
		type: Date,
		default: null,
	},
	proyecto: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Proyecto"
	},
	etiquetas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Etiqueta' }],
	tareaPadre: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarea', default: null },
	subtareas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tarea' }],
	actividad: [
		{
			usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
			tipo: { type: String, enum: ["comentario", "cambio_estado", "cambio_responsable"] },
			contenido: { type: String },
			createdAt: { type: Date, default: Date.now },
		}
	],

}, {
	timestamps: true,
}
);
const Tarea = mongoose.model("Tarea", tareaSchema);
export default Tarea