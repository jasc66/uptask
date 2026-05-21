import mongoose from "mongoose";

const seccionSchema = mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        color: {
            type: String,
            default: '#94a3b8',
        },
        orden: {
            type: Number,
            default: 0,
        },
        proyecto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Proyecto',
            required: true,
        },
    },
    { timestamps: true }
);

const Seccion = mongoose.model("Seccion", seccionSchema);
export default Seccion;
