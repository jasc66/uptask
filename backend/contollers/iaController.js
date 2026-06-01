import { completar } from '../helpers/ia.js';
import Proyecto from '../models/Proyecto.js';
import Tarea from '../models/Tarea.js';
import Usuario from '../models/Usuario.js';

const parsearJSON = (texto) => {
    const limpio = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(limpio);
};

// POST /api/ia/generar-plan
export const generarPlan = async (req, res) => {
    try {
        const { nombre, descripcion, fechaEntrega, numPersonas = 1 } = req.body;
        if (!nombre?.trim() || !descripcion?.trim()) {
            return res.status(400).json({ msg: 'Nombre y descripción son obligatorios' });
        }

        const diasDisponibles = fechaEntrega
            ? Math.max(1, Math.round((new Date(fechaEntrega) - new Date()) / (1000 * 60 * 60 * 24)))
            : 30;

        const respuesta = await completar([
            {
                role: 'system',
                content: 'Eres un experto en gestión de proyectos. Siempre respondes con JSON válido sin markdown ni texto adicional.',
            },
            {
                role: 'user',
                content: `Genera un plan de trabajo para este proyecto:

Nombre: ${nombre}
Descripción: ${descripcion}
Días disponibles: ${diasDisponibles}
Equipo: ${numPersonas} persona(s)

Genera entre 5 y 12 tareas ordenadas cronológicamente. Responde ÚNICAMENTE con JSON:
{"tareas":[{"nombre":"string (máx 60 chars)","descripcion":"string","prioridad":"Baja|Media|Alta|Urgente","offsetDias":0,"duracionDias":1}]}`,
            },
        ], { temperatura: 0.5, maxTokens: 2048 });

        const data = parsearJSON(respuesta);
        if (!Array.isArray(data?.tareas)) throw new Error('Formato inválido');
        res.json(data);
    } catch (error) {
        console.log('[IA] generarPlan error:', error.message);
        res.status(500).json({ msg: 'Error al generar el plan. Intenta de nuevo.' });
    }
};

// POST /api/ia/resumen-proyecto/:id
export const resumirProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const proyecto = await Proyecto.findById(id).lean();
        if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });

        const esCreador = proyecto.creador.toString() === req.usuario._id.toString();
        const esColaborador = proyecto.colaboradores.some(c => c.usuario.toString() === req.usuario._id.toString());
        if (!esCreador && !esColaborador && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'Sin acceso' });
        }

        const ahora = new Date();
        const tareas = await Tarea.find({ proyecto: id, tareaPadre: null }).lean();
        const total = tareas.length;
        const completadas = tareas.filter(t => t.estado === 'Completada').length;
        const vencidas = tareas.filter(t => t.estado !== 'Completada' && t.fechaEntrega && t.fechaEntrega < ahora).length;
        const enProgreso = tareas.filter(t => t.estado === 'En Progreso').length;
        const sinAsignar = tareas.filter(t => !t.responsable && (!t.responsables?.length)).length;
        const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;

        const respuesta = await completar([
            {
                role: 'system',
                content: 'Eres un asistente de gestión de proyectos. Respondes siempre con JSON válido sin markdown.',
            },
            {
                role: 'user',
                content: `Analiza este proyecto y genera un resumen ejecutivo:

Proyecto: ${proyecto.nombre}
Estado: ${proyecto.estado}
Progreso: ${completadas}/${total} tareas (${pct}%)
Vencidas: ${vencidas} | En progreso: ${enProgreso} | Sin asignar: ${sinAsignar}
Fecha entrega: ${proyecto.fechaEntrega ? new Date(proyecto.fechaEntrega).toLocaleDateString('es') : 'no definida'}

Responde ÚNICAMENTE con JSON:
{"resumen":"2-3 oraciones del estado (máx 200 chars)","colorSugerido":"verde|amarillo|rojo","puntosClave":["punto 1","punto 2","punto 3"]}`,
            },
        ], { temperatura: 0.3, maxTokens: 512 });

        const data = parsearJSON(respuesta);
        res.json(data);
    } catch (error) {
        console.log('[IA] resumirProyecto error:', error.message);
        res.status(500).json({ msg: 'Error al generar el resumen' });
    }
};

// POST /api/ia/analizar-riesgos/:id
export const analizarRiesgos = async (req, res) => {
    try {
        const { id } = req.params;

        const proyecto = await Proyecto.findById(id).lean();
        if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });

        const esCreador = proyecto.creador.toString() === req.usuario._id.toString();
        const esColaborador = proyecto.colaboradores.some(c => c.usuario.toString() === req.usuario._id.toString());
        if (!esCreador && !esColaborador && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'Sin acceso' });
        }

        const ahora = new Date();
        const tareas = await Tarea.find({ proyecto: id, tareaPadre: null })
            .populate('responsables', 'nombre')
            .populate('dependencias.tarea', 'nombre estado')
            .lean();

        const total = tareas.length;
        const completadas = tareas.filter(t => t.estado === 'Completada').length;
        const vencidas = tareas.filter(t =>
            t.estado !== 'Completada' && t.fechaEntrega && new Date(t.fechaEntrega) < ahora
        ).length;
        const sinAsignar = tareas.filter(t =>
            !t.responsable && (!t.responsables?.length)
        ).length;
        const bloqueadas = tareas.filter(t =>
            t.dependencias?.some(d => d.tipo === 'depende_de' && d.tarea?.estado !== 'Completada')
        ).length;

        const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        const velocidad7d = tareas.filter(t => t.completadaEn && new Date(t.completadaEn) > hace7dias).length;

        // Desbalance de carga
        const cargaMap = {};
        tareas.forEach(t => {
            const resps = t.responsables?.length ? t.responsables : (t.responsable ? [{ _id: t.responsable }] : []);
            resps.forEach(r => {
                const rid = (r._id ?? r).toString();
                cargaMap[rid] = (cargaMap[rid] || 0) + 1;
            });
        });
        const cargas = Object.values(cargaMap);
        const desbalance = cargas.length > 1 ? Math.max(...cargas) - Math.min(...cargas) : 0;

        const diasRestantes = proyecto.fechaEntrega
            ? Math.ceil((new Date(proyecto.fechaEntrega) - ahora) / (1000 * 60 * 60 * 24))
            : null;

        const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
        const pctVencidas = total > 0 ? Math.round((vencidas / total) * 100) : 0;

        const metricas = { total, completadas, pct, vencidas, pctVencidas, sinAsignar, bloqueadas, velocidad7d, desbalance, diasRestantes };

        const respuesta = await completar([
            {
                role: 'system',
                content: 'Eres un experto en gestión de proyectos. Respondes siempre con JSON válido sin markdown.',
            },
            {
                role: 'user',
                content: `Analiza los riesgos de este proyecto y devuelve un diagnóstico:

Proyecto: "${proyecto.nombre}"
${diasRestantes !== null ? `Días restantes: ${diasRestantes}` : 'Sin fecha de entrega'}
Avance: ${completadas}/${total} tareas (${pct}%)
Tareas vencidas: ${vencidas} (${pctVencidas}%)
Sin asignar: ${sinAsignar}
Bloqueadas por dependencias: ${bloqueadas}
Velocidad (completadas últimos 7 días): ${velocidad7d}
Desbalance de carga entre usuarios: ${desbalance} tareas de diferencia

Responde ÚNICAMENTE con JSON (sin texto extra):
{
  "nivel": "alto"|"medio"|"bajo",
  "puntuacion": número 0-100 (0=crítico, 100=óptimo),
  "resumen": "diagnóstico en 1-2 oraciones (máx 150 chars)",
  "riesgos": ["riesgo específico 1", "riesgo específico 2"],
  "recomendaciones": ["acción concreta 1", "acción concreta 2", "acción concreta 3"]
}`,
            },
        ], { temperatura: 0.3, maxTokens: 700 });

        const data = parsearJSON(respuesta);
        res.json({ ...data, metricas });
    } catch (error) {
        console.log('[IA] analizarRiesgos error:', error.message);
        res.status(500).json({ msg: 'Error al analizar los riesgos' });
    }
};

// POST /api/ia/chat-proyecto/:id  (SSE streaming)
export const chatProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const { mensaje, historial = [] } = req.body;

        if (!mensaje?.trim()) return res.status(400).json({ msg: 'El mensaje es obligatorio' });

        const proyecto = await Proyecto.findById(id).lean();
        if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });

        const esCreador = proyecto.creador.toString() === req.usuario._id.toString();
        const esColaborador = proyecto.colaboradores.some(c => c.usuario.toString() === req.usuario._id.toString());
        if (!esCreador && !esColaborador && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'Sin acceso' });
        }

        const ahora = new Date();
        const tareas = await Tarea.find({ proyecto: id, tareaPadre: null })
            .populate('responsables', 'nombre')
            .lean();

        const total = tareas.length;
        const porEstado = { Pendiente: 0, 'En Progreso': 0, 'En Revisión': 0, Completada: 0 };
        tareas.forEach(t => { if (porEstado[t.estado] !== undefined) porEstado[t.estado]++ });
        const vencidas = tareas.filter(t => t.estado !== 'Completada' && t.fechaEntrega && new Date(t.fechaEntrega) < ahora).length;
        const sinAsignar = tareas.filter(t => !t.responsable && !t.responsables?.length).length;

        const listaTareas = tareas.slice(0, 30).map(t => {
            const resps = t.responsables?.map(r => r.nombre).join(', ') || 'sin asignar';
            const fecha = t.fechaEntrega ? new Date(t.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'sin fecha';
            return `- [${t.estado}] ${t.nombre} (${t.prioridad}) | ${resps} | entrega: ${fecha}`;
        }).join('\n');

        const contexto = `Eres el asistente de IA del proyecto "${proyecto.nombre}". Tienes acceso completo a su estado y puedes responder preguntas en español de forma concisa y útil.

DATOS DEL PROYECTO:
Nombre: ${proyecto.nombre}
Descripción: ${proyecto.descripcion ?? 'No especificada'}
Estado: ${proyecto.estado}
Fecha de entrega: ${proyecto.fechaEntrega ? new Date(proyecto.fechaEntrega).toLocaleDateString('es-MX', { dateStyle: 'long' }) : 'no definida'}
Equipo: ${proyecto.colaboradores.length + 1} persona(s)

RESUMEN DE TAREAS (${total} total):
- Pendientes: ${porEstado.Pendiente}
- En Progreso: ${porEstado['En Progreso']}
- En Revisión: ${porEstado['En Revisión']}
- Completadas: ${porEstado.Completada}
- Vencidas: ${vencidas}
- Sin asignar: ${sinAsignar}

LISTA DE TAREAS:
${listaTareas || 'Sin tareas registradas'}

Responde siempre en español, de forma clara y directa. Si te preguntan algo que no está en los datos, dilo honestamente.`;

        // SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const mensajes = [
            { role: 'system', content: contexto },
            ...historial.map(m => ({ role: m.rol === 'user' ? 'user' : 'assistant', content: m.contenido })),
            { role: 'user', content: mensaje.trim() },
        ];

        await completarStream(mensajes, (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }, { temperatura: 0.6, maxTokens: 1024 });

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.log('[IA] chatProyecto error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Error al procesar el chat' });
        } else {
            res.write(`data: ${JSON.stringify({ error: 'Error interno' })}\n\n`);
            res.end();
        }
    }
};

// POST /api/ia/mejorar-descripcion
export const mejorarDescripcion = async (req, res) => {
    try {
        const { nombre, descripcion, contextoProyecto } = req.body;
        if (!nombre?.trim()) return res.status(400).json({ msg: 'El nombre es obligatorio' });

        const respuesta = await completar([
            {
                role: 'system',
                content: 'Eres un asistente de gestión de proyectos. Escribes descripciones de tareas claras y accionables en español.',
            },
            {
                role: 'user',
                content: `Mejora esta descripción de tarea:

Tarea: ${nombre}
Descripción actual: ${descripcion?.trim() || '(vacía)'}
${contextoProyecto ? `Proyecto: ${contextoProyecto}` : ''}

Escribe una descripción mejorada que incluya: qué hacer, cómo abordarlo y criterios de aceptación. Máximo 180 palabras. Solo el texto, sin títulos ni bullets.`,
            },
        ], { temperatura: 0.6, maxTokens: 512 });

        res.json({ descripcion: respuesta.trim() });
    } catch (error) {
        console.log('[IA] mejorarDescripcion error:', error.message);
        res.status(500).json({ msg: 'Error al mejorar la descripción' });
    }
};
