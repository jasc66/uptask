import mongoose from "mongoose";

const tareaBaseSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true, default: '' },
    prioridad: {
        type: String,
        enum: ['Baja', 'Media', 'Alta', 'Urgente'],
        default: 'Media',
    },
    offsetDias: { type: Number, default: 0 },
    duracionDias: { type: Number, default: 1 },
}, { _id: false });

const etiquetaBaseSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    color: { type: String, default: '#6366f1' },
}, { _id: false });

const plantillaSchema = mongoose.Schema(
    {
        nombre: { type: String, required: true, trim: true },
        descripcion: { type: String, trim: true, default: '' },
        esPublica: { type: Boolean, default: false },
        creadoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            default: null,
        },
        tareasBase: [tareaBaseSchema],
        etiquetasBase: [etiquetaBaseSchema],
    },
    { timestamps: true }
);

const PlantillaProyecto = mongoose.model('PlantillaProyecto', plantillaSchema);
export default PlantillaProyecto;
