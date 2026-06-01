import mongoose from "mongoose";

const integracionSchema = mongoose.Schema(
  {
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proyecto',
      required: true,
    },
    tipo: {
      type: String,
      enum: ['webhook', 'slack', 'ical'],
      required: true,
    },
    nombre: {
      type: String,
      trim: true,
      required: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
    config: {
      url: { type: String, default: '' },
      secreto: { type: String, default: '' },
      eventos: [{ type: String }],
    },
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    vecesDisparado: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Integracion = mongoose.model("Integracion", integracionSchema);
export default Integracion;
