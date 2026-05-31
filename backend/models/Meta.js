import mongoose from "mongoose";

const metaSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
      required: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    portafolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portafolio',
      required: true,
    },
    metrica: {
      tipo: {
        type: String,
        enum: ['porcentaje', 'numero', 'booleano'],
        default: 'porcentaje',
      },
      objetivo: {
        type: Number,
        default: 100,
      },
      actual: {
        type: Number,
        default: 0,
      },
    },
    proyectosVinculados: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto',
      },
    ],
    estado: {
      type: String,
      enum: ['activa', 'en_riesgo', 'completada', 'cancelada'],
      default: 'activa',
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
  },
  { timestamps: true }
);

const Meta = mongoose.model("Meta", metaSchema);
export default Meta;
