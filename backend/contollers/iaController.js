import { completar } from '../helpers/ia.js';
import Proyecto from '../models/Proyecto.js';
import Tarea from '../models/Tarea.js';

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
