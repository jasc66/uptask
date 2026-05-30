import mongoose from "mongoose";

const notificacionSchema = mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true,
            index: true,
        },
        tipo: {
            type: String,
            enum: [
                "mencion",
                "asignacion",
                "cambio_estado",
                "comentario",
                "vencimiento",
                "dependencia_resuelta",
            ],
            required: true,
        },
        titulo: { type: String, trim: true, required: true },
        mensaje: { type: String, trim: true, default: "" },
        proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Proyecto", default: null },
        tarea: { type: mongoose.Schema.Types.ObjectId, ref: "Tarea", default: null },
        origen: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
        leida: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

notificacionSchema.index({ usuario: 1, createdAt: -1 });

const Notificacion = mongoose.model("Notificacion", notificacionSchema);
export default Notificacion;
