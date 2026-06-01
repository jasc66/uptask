import Automatizacion from "../models/Automatizacion.js";
import Tarea from "../models/Tarea.js";
import { crearNotificacion } from "./notificaciones.js";

const verificarCondicion = (condicion, tarea) => {
    if (!condicion?.campo || condicion.campo === 'ninguna') return true;
    const valor = condicion.campo === 'prioridad' ? tarea.prioridad : tarea.estado;
    if (condicion.operador === 'es') return valor === condicion.valor;
    if (condicion.operador === 'no_es') return valor !== condicion.valor;
    return true;
};

const ejecutarAccion = async (accion, tarea) => {
    try {
        switch (accion.tipo) {
            case 'cambiar_estado': {
                const nuevoEstado = accion.parametros?.estado;
                if (!nuevoEstado) break;
                await Tarea.findByIdAndUpdate(tarea._id, {
                    estado: nuevoEstado,
                    ...(nuevoEstado === 'Completada' ? { completadaEn: new Date() } : { completadaEn: null }),
                });
                break;
            }
            case 'cambiar_prioridad': {
                const nuevaPrioridad = accion.parametros?.prioridad;
                if (!nuevaPrioridad) break;
                await Tarea.findByIdAndUpdate(tarea._id, { prioridad: nuevaPrioridad });
                break;
            }
            case 'asignar_responsable': {
                const uid = accion.parametros?.usuarioId;
                if (!uid) break;
                await Tarea.findByIdAndUpdate(tarea._id, {
                    $addToSet: { responsables: uid },
                    responsable: uid,
                });
                break;
            }
            case 'crear_notificacion': {
                const destinatarios = new Set();
                (tarea.responsables ?? []).forEach(r => destinatarios.add(r?.toString()));
                if (tarea.responsable) destinatarios.add(tarea.responsable.toString());
                for (const uid of destinatarios) {
                    if (!uid) continue;
                    await crearNotificacion({
                        usuario: uid,
                        tipo: 'mencion',
                        titulo: 'Automatización ejecutada',
                        mensaje: accion.parametros?.mensaje || `Automatización aplicada a "${tarea.nombre}"`,
                        proyecto: tarea.proyecto?._id ?? tarea.proyecto,
                        tarea: tarea._id,
                    });
                }
                break;
            }
            case 'mover_seccion': {
                await Tarea.findByIdAndUpdate(tarea._id, {
                    seccion: accion.parametros?.seccionId || null,
                });
                break;
            }
        }
    } catch (err) {
        console.error(`[automationEngine] error en acción ${accion.tipo}:`, err.message);
    }
};

export const ejecutarAutomatizaciones = async (evento, tarea) => {
    try {
        const proyectoId = tarea.proyecto?._id ?? tarea.proyecto;
        const automatizaciones = await Automatizacion.find({
            proyecto: proyectoId,
            activa: true,
            'trigger.evento': evento,
        });

        for (const auto of automatizaciones) {
            if (!verificarCondicion(auto.trigger.condicion, tarea)) continue;
            await ejecutarAccion(auto.accion, tarea);
            auto.vecesEjecutada += 1;
            await auto.save();
        }
    } catch (err) {
        console.error('[automationEngine] error al ejecutar automatizaciones:', err.message);
    }
};

// Cron: revisar tareas con fecha de vencimiento próxima
export const procesarVencimientoProximo = async () => {
    try {
        const automatizaciones = await Automatizacion.find({
            activa: true,
            'trigger.evento': 'fecha_vencimiento_proxima',
        });

        for (const auto of automatizaciones) {
            const dias = auto.trigger.diasAntes ?? 1;
            const objetivo = new Date();
            objetivo.setDate(objetivo.getDate() + dias);
            const inicio = new Date(objetivo);
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date(objetivo);
            fin.setHours(23, 59, 59, 999);

            const tareas = await Tarea.find({
                proyecto: auto.proyecto,
                fechaEntrega: { $gte: inicio, $lte: fin },
                estado: { $ne: 'Completada' },
            });

            for (const tarea of tareas) {
                if (!verificarCondicion(auto.trigger.condicion, tarea)) continue;
                await ejecutarAccion(auto.accion, tarea);
                auto.vecesEjecutada += 1;
            }
            await auto.save();
        }
    } catch (err) {
        console.error('[automationEngine] error en procesarVencimientoProximo:', err.message);
    }
};
