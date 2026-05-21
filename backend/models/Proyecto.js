import mongoose from "mongoose";

const proyectosSchema = mongoose.Schema(
  {
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
    fechaEntrega: {
      type: Date,
      default: Date.now(),
    },
    cliente: {
      type: String,
      trim: true,
      required: true,
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    tareas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tarea",
      },
    ],
    colaboradores: [
      {
        usuario: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Usuario",
        },
        rol: {
          type: String,
          enum: ["editor", "lector", "admin"],
          default: "editor",
        },
      },
    ],
    color: {
      type: String,
      default: '#6366f1',
    },
    estado: {
      type: String,
      enum: ['Activo', 'Pausado', 'Completado', 'Cancelado'],
      default: 'Activo',
    },
    fechaInicio: {
      type: Date,
      default: null,
    },
    area: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Proyecto = mongoose.model("Proyecto", proyectosSchema);
export default Proyecto;
