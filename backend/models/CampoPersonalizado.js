import mongoose from "mongoose";

const campoPersonalizadoSchema = mongoose.Schema({
    nombre:   { type: String, trim: true, required: true },
    tipo:     { type: String, enum: ['texto', 'numero', 'select', 'fecha', 'checkbox'], required: true },
    opciones: [{ type: String, trim: true }],
    proyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'Proyecto', required: true },
}, { timestamps: true });

const CampoPersonalizado = mongoose.model("CampoPersonalizado", campoPersonalizadoSchema);
export default CampoPersonalizado;
