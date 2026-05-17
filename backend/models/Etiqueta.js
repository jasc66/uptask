import mongoose from "mongoose"

const etiquetaSchema = mongoose.Schema({
    nombre: { type: String, trim: true, required: true },
    color: { type: String, default: '#6366f1' },
    proyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'Proyecto', required: true },
}, { timestamps: true })

const Etiqueta = mongoose.model("Etiqueta", etiquetaSchema)
export default Etiqueta
