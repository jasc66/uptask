import crypto from "crypto";
import Integracion from "../models/Integracion.js";

const buildPayload = (evento, tarea, proyecto) => ({
    evento,
    proyectoId: (proyecto?._id ?? tarea.proyecto?._id ?? tarea.proyecto)?.toString(),
    proyectoNombre: proyecto?.nombre ?? tarea.proyecto?.nombre ?? '',
    tareaId: tarea._id?.toString(),
    tareaNombre: tarea.nombre,
    tareaEstado: tarea.estado,
    tareaPrioridad: tarea.prioridad,
    timestamp: new Date().toISOString(),
});

const enviarWebhook = async (url, secreto, payload) => {
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json', 'User-Agent': 'Nexo-Webhook/1.0' };
    if (secreto) {
        const firma = crypto.createHmac('sha256', secreto).update(body).digest('hex');
        headers['X-Nexo-Signature'] = `sha256=${firma}`;
    }
    const res = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(10000) });
    return res.ok;
};

const mensajeSlack = (evento, payload) => {
    const labels = {
        tarea_creada:          '🆕 Tarea creada',
        tarea_completada:      '✅ Tarea completada',
        tarea_estado_cambiado: '🔄 Estado cambiado',
        comentario_agregado:   '💬 Nuevo comentario',
        tarea_asignada:        '👤 Tarea asignada',
    };
    return {
        text: `*${labels[evento] ?? evento}* — *${payload.proyectoNombre}*\n• *Tarea:* ${payload.tareaNombre}\n• *Estado:* ${payload.tareaEstado ?? '—'}`,
    };
};

export const disparar = async (evento, tarea, proyectoDoc = null) => {
    try {
        const proyectoId = proyectoDoc?._id ?? tarea.proyecto?._id ?? tarea.proyecto;
        const integraciones = await Integracion.find({
            proyecto: proyectoId,
            activa: true,
            tipo: { $in: ['webhook', 'slack'] },
            'config.eventos': evento,
        });

        if (!integraciones.length) return;

        const payload = buildPayload(evento, tarea, proyectoDoc);

        for (const integ of integraciones) {
            try {
                if (integ.tipo === 'webhook') {
                    await enviarWebhook(integ.config.url, integ.config.secreto, payload);
                } else if (integ.tipo === 'slack') {
                    await fetch(integ.config.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(mensajeSlack(evento, payload)),
                        signal: AbortSignal.timeout(10000),
                    });
                }
                integ.vecesDisparado += 1;
                await integ.save();
            } catch (err) {
                console.error(`[integracionEngine] error dispatching ${integ.tipo}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[integracionEngine] error:', err.message);
    }
};

export const testIntegracion = async (integ) => {
    const payload = buildPayload('test', { _id: 'test', nombre: 'Tarea de prueba', estado: 'Pendiente', prioridad: 'Media', proyecto: integ.proyecto }, null);
    if (integ.tipo === 'webhook') {
        return enviarWebhook(integ.config.url, integ.config.secreto, { ...payload, evento: 'test' });
    }
    if (integ.tipo === 'slack') {
        const res = await fetch(integ.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `*🧪 Test de conexión desde Nexo*\nLa integración "${integ.nombre}" está configurada correctamente.` }),
            signal: AbortSignal.timeout(10000),
        });
        return res.ok;
    }
    return false;
};
