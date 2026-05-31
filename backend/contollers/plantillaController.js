import PlantillaProyecto from "../models/PlantillaProyecto.js";
import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";
import Etiqueta from "../models/Etiqueta.js";

const PLANTILLAS_SEED = [
    {
        nombre: 'Sprint',
        descripcion: 'Plantilla para un sprint de desarrollo ágil de 2 semanas.',
        esPublica: true,
        tareasBase: [
            { nombre: 'Planificación del sprint', descripcion: 'Definir alcance, estimar y asignar tareas.', prioridad: 'Alta', offsetDias: 0, duracionDias: 1 },
            { nombre: 'Desarrollo de features', descripcion: 'Implementar las funcionalidades acordadas en el sprint.', prioridad: 'Alta', offsetDias: 1, duracionDias: 8 },
            { nombre: 'Code review', descripcion: 'Revisión de código entre pares antes de mergear.', prioridad: 'Media', offsetDias: 9, duracionDias: 2 },
            { nombre: 'QA / Testing', descripcion: 'Pruebas funcionales y de regresión.', prioridad: 'Alta', offsetDias: 9, duracionDias: 3 },
            { nombre: 'Despliegue a producción', descripcion: 'Release del sprint al entorno de producción.', prioridad: 'Urgente', offsetDias: 12, duracionDias: 1 },
            { nombre: 'Retrospectiva', descripcion: 'Análisis de lo que funcionó y oportunidades de mejora.', prioridad: 'Baja', offsetDias: 13, duracionDias: 1 },
        ],
        etiquetasBase: [
            { nombre: 'frontend', color: '#3b82f6' },
            { nombre: 'backend', color: '#8b5cf6' },
            { nombre: 'bug', color: '#ef4444' },
            { nombre: 'feature', color: '#10b981' },
        ],
    },
    {
        nombre: 'Lanzamiento de producto',
        descripcion: 'Plantilla para el lanzamiento de un producto o nueva funcionalidad.',
        esPublica: true,
        tareasBase: [
            { nombre: 'Análisis de mercado', descripcion: 'Investigar competidores, audiencia objetivo y demanda.', prioridad: 'Alta', offsetDias: 0, duracionDias: 5 },
            { nombre: 'Definir propuesta de valor', descripcion: 'Establecer el diferencial y los mensajes clave del producto.', prioridad: 'Alta', offsetDias: 5, duracionDias: 3 },
            { nombre: 'Preparar materiales de marketing', descripcion: 'Crear copy, diseños y assets para la campaña de lanzamiento.', prioridad: 'Media', offsetDias: 8, duracionDias: 7 },
            { nombre: 'Crear landing page / demo', descripcion: 'Desarrollar la página de lanzamiento y video demo.', prioridad: 'Alta', offsetDias: 8, duracionDias: 10 },
            { nombre: 'Beta testing', descripcion: 'Invitar usuarios early-adopter y recopilar feedback.', prioridad: 'Alta', offsetDias: 18, duracionDias: 7 },
            { nombre: 'Correcciones pre-lanzamiento', descripcion: 'Resolver los issues críticos encontrados en la beta.', prioridad: 'Urgente', offsetDias: 25, duracionDias: 3 },
            { nombre: 'Lanzamiento oficial', descripcion: 'Go-live del producto en todos los canales.', prioridad: 'Urgente', offsetDias: 28, duracionDias: 1 },
            { nombre: 'Análisis post-lanzamiento', descripcion: 'Revisar métricas y feedback inicial del mercado.', prioridad: 'Media', offsetDias: 29, duracionDias: 3 },
        ],
        etiquetasBase: [
            { nombre: 'marketing', color: '#ec4899' },
            { nombre: 'técnico', color: '#3b82f6' },
            { nombre: 'crítico', color: '#ef4444' },
            { nombre: 'contenido', color: '#f59e0b' },
        ],
    },
    {
        nombre: 'Campaña de marketing',
        descripcion: 'Plantilla para planificar y ejecutar una campaña de marketing digital.',
        esPublica: true,
        tareasBase: [
            { nombre: 'Definir objetivos y KPIs', descripcion: 'Establecer metas medibles y los indicadores de éxito.', prioridad: 'Alta', offsetDias: 0, duracionDias: 2 },
            { nombre: 'Segmentación de audiencia', descripcion: 'Identificar y perfilar los segmentos objetivo de la campaña.', prioridad: 'Alta', offsetDias: 2, duracionDias: 3 },
            { nombre: 'Diseño de creatividades', descripcion: 'Crear los materiales visuales y textuales de la campaña.', prioridad: 'Media', offsetDias: 5, duracionDias: 7 },
            { nombre: 'Configurar canales de distribución', descripcion: 'Preparar redes sociales, email y anuncios pagados.', prioridad: 'Media', offsetDias: 5, duracionDias: 5 },
            { nombre: 'Publicación y distribución de contenido', descripcion: 'Ejecutar el calendario de publicaciones de la campaña.', prioridad: 'Alta', offsetDias: 12, duracionDias: 14 },
            { nombre: 'Monitoreo y optimización', descripcion: 'Analizar métricas en tiempo real y ajustar la estrategia.', prioridad: 'Media', offsetDias: 12, duracionDias: 16 },
            { nombre: 'Informe de resultados', descripcion: 'Preparar el reporte final de la campaña con aprendizajes.', prioridad: 'Baja', offsetDias: 28, duracionDias: 3 },
        ],
        etiquetasBase: [
            { nombre: 'redes sociales', color: '#3b82f6' },
            { nombre: 'email', color: '#10b981' },
            { nombre: 'ads', color: '#f59e0b' },
            { nombre: 'analytics', color: '#6366f1' },
        ],
    },
];

export const seedPlantillas = async () => {
    const count = await PlantillaProyecto.countDocuments({ esPublica: true, creadoPor: null });
    if (count > 0) return;
    await PlantillaProyecto.insertMany(PLANTILLAS_SEED);
    console.log('Plantillas seed insertadas correctamente.');
};

const obtenerPlantillas = async (req, res) => {
    const plantillas = await PlantillaProyecto.find({
        $or: [
            { esPublica: true },
            { creadoPor: req.usuario._id },
        ],
    }).sort({ esPublica: -1, createdAt: -1 });

    res.json(plantillas);
};

const crearPlantillaDesdeProyecto = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });

    const creadorId = proyecto.creador?._id ?? proyecto.creador;
    if (creadorId.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: 'Sin permisos para crear plantilla desde este proyecto' });
    }

    const [todasTareas, etiquetas] = await Promise.all([
        Tarea.find({ proyecto: id, tareaPadre: null }),
        Etiqueta.find({ proyecto: id }),
    ]);

    const fechaBase = proyecto.fechaInicio ? new Date(proyecto.fechaInicio) : new Date(proyecto.createdAt);

    const tareasBase = todasTareas.map(t => {
        const fechaT = t.fechaInicio ? new Date(t.fechaInicio) : fechaBase;
        const offsetDias = Math.max(0, Math.round((fechaT - fechaBase) / (1000 * 60 * 60 * 24)));
        const duracionDias = t.fechaEntrega
            ? Math.max(1, Math.round((new Date(t.fechaEntrega) - fechaT) / (1000 * 60 * 60 * 24)))
            : 1;
        return {
            nombre: t.nombre,
            descripcion: t.descripcion || '',
            prioridad: t.prioridad || 'Media',
            offsetDias,
            duracionDias,
        };
    });

    const etiquetasBase = etiquetas.map(e => ({ nombre: e.nombre, color: e.color }));

    const plantilla = await PlantillaProyecto.create({
        nombre: nombre?.trim() || proyecto.nombre,
        descripcion: descripcion?.trim() || proyecto.descripcion,
        esPublica: false,
        creadoPor: req.usuario._id,
        tareasBase,
        etiquetasBase,
    });

    res.json(plantilla);
};

const eliminarPlantilla = async (req, res) => {
    const { id } = req.params;

    const plantilla = await PlantillaProyecto.findById(id);
    if (!plantilla) return res.status(404).json({ msg: 'Plantilla no encontrada' });

    if (plantilla.esPublica && plantilla.creadoPor === null) {
        return res.status(403).json({ msg: 'Las plantillas del sistema no se pueden eliminar' });
    }
    const creadoPorId = plantilla.creadoPor?.toString();
    if (creadoPorId !== req.usuario._id.toString() && req.usuario.rol !== 'admin') {
        return res.status(403).json({ msg: 'Sin permisos para eliminar esta plantilla' });
    }

    await plantilla.deleteOne();
    res.json({ msg: 'Plantilla eliminada' });
};

export { obtenerPlantillas, crearPlantillaDesdeProyecto, eliminarPlantilla };
