import mongoose from "mongoose";

const portafolioSchema = mongoose.Schema(
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
    color: {
      type: String,
      default: '#6366f1',
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    proyectos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto',
      },
    ],
  },
  { timestamps: true }
);

const Portafolio = mongoose.model("Portafolio", portafolioSchema);
export default Portafolio;
