import mongoose from "mongoose";

const automatizacionSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
      required: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proyecto',
      required: true,
    },
    trigger: {
      evento: {
        type: String,
        enum: ['tarea_creada', 'tarea_completada', 'tarea_estado_cambiado', 'tarea_asignada', 'fecha_vencimiento_proxima'],
        required: true,
      },
      diasAntes: {
        type: Number,
        default: 1,
      },
      condicion: {
        campo: {
          type: String,
          enum: ['ninguna', 'prioridad', 'estado'],
          default: 'ninguna',
        },
        operador: {
          type: String,
          enum: ['es', 'no_es'],
          default: 'es',
        },
        valor: {
          type: String,
          default: '',
        },
      },
    },
    accion: {
      tipo: {
        type: String,
        enum: ['cambiar_estado', 'cambiar_prioridad', 'asignar_responsable', 'crear_notificacion', 'mover_seccion'],
        required: true,
      },
      parametros: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    vecesEjecutada: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Automatizacion = mongoose.model("Automatizacion", automatizacionSchema);
export default Automatizacion;
