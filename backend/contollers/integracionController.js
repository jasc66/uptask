import Integracion from "../models/Integracion.js";
import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";
import { testIntegracion } from "../helpers/integracionEngine.js";

const verificarAcceso = async (proyectoId, usuario) => {
    const proyecto = await Proyecto.findById(proyectoId);
    if (!proyecto) return { error: 'Proyecto no encontrado', code: 404 };
    const esCreador = proyecto.creador.toString() === usuario._id.toString();
    const esAdminGlobal = usuario.rol === 'admin';
    const esAdminProyecto = proyecto.colaboradores.some(
        c => c.usuario.toString() === usuario._id.toString() && c.rol === 'admin'
    );
    if (!esCreador && !esAdminGlobal && !esAdminProyecto) {
        return { error: 'No tienes permisos para gestionar integraciones', code: 403 };
    }
    return { proyecto };
};

export const obtenerIntegraciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const integraciones = await Integracion.find({ proyecto: id }).sort({ createdAt: -1 });
        res.json(integraciones);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al obtener integraciones' });
    }
};

export const crearIntegracion = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const { nombre, tipo, config } = req.body;
        if (!nombre?.trim()) return res.status(400).json({ msg: 'El nombre es obligatorio' });
        if (!tipo) return res.status(400).json({ msg: 'El tipo es obligatorio' });
        if (tipo !== 'ical' && !config?.url?.trim()) return res.status(400).json({ msg: 'La URL es obligatoria' });
        const integracion = new Integracion({
            proyecto: id,
            nombre: nombre.trim(),
            tipo,
            config: config ?? {},
            creadoPor: req.usuario._id,
        });
        await integracion.save();
        res.status(201).json(integracion);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al crear integración' });
    }
};

export const actualizarIntegracion = async (req, res) => {
    try {
        const { id, integracionId } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const integ = await Integracion.findOne({ _id: integracionId, proyecto: id });
        if (!integ) return res.status(404).json({ msg: 'Integración no encontrada' });
        const { nombre, config, activa } = req.body;
        if (nombre) integ.nombre = nombre.trim();
        if (config) integ.config = { ...integ.config.toObject?.() ?? integ.config, ...config };
        if (activa !== undefined) integ.activa = activa;
        await integ.save();
        res.json(integ);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al actualizar integración' });
    }
};

export const eliminarIntegracion = async (req, res) => {
    try {
        const { id, integracionId } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        await Integracion.findOneAndDelete({ _id: integracionId, proyecto: id });
        res.json({ msg: 'Integración eliminada' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al eliminar integración' });
    }
};

export const toggleIntegracion = async (req, res) => {
    try {
        const { id, integracionId } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const integ = await Integracion.findOne({ _id: integracionId, proyecto: id });
        if (!integ) return res.status(404).json({ msg: 'Integración no encontrada' });
        integ.activa = !integ.activa;
        await integ.save();
        res.json(integ);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al cambiar estado de integración' });
    }
};

export const testearIntegracion = async (req, res) => {
    try {
        const { id, integracionId } = req.params;
        const { error, code } = await verificarAcceso(id, req.usuario);
        if (error) return res.status(code).json({ msg: error });
        const integ = await Integracion.findOne({ _id: integracionId, proyecto: id });
        if (!integ) return res.status(404).json({ msg: 'Integración no encontrada' });
        const ok = await testIntegracion(integ);
        if (ok) {
            res.json({ msg: 'Test enviado correctamente' });
        } else {
            res.status(502).json({ msg: 'No se pudo conectar con la URL configurada' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al testear integración' });
    }
};

export const exportarIcal = async (req, res) => {
    try {
        const { id } = req.params;
        // Auth via checkAuth middleware (req.usuario ya disponible)
        const proyecto = await Proyecto.findById(id).select('nombre creador colaboradores');
        if (!proyecto) return res.status(404).json({ msg: 'Proyecto no encontrado' });

        const tieneAcceso =
            req.usuario.rol === 'admin' ||
            proyecto.creador.toString() === req.usuario._id.toString() ||
            proyecto.colaboradores.some(c => c.usuario.toString() === req.usuario._id.toString());
        if (!tieneAcceso) return res.status(403).json({ msg: 'Sin acceso' });

        const tareas = await Tarea.find({ proyecto: id, fechaEntrega: { $ne: null } })
            .select('nombre descripcion estado fechaEntrega')
            .lean();

        const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
        const escapeIcal = str => (str ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Nexo//Nexo v1.0//ES',
            'CALSCALE:GREGORIAN',
            `X-WR-CALNAME:${escapeIcal(proyecto.nombre)}`,
        ];

        for (const t of tareas) {
            const fecha = new Date(t.fechaEntrega).toISOString().slice(0, 10).replace(/-/g, '');
            lines.push(
                'BEGIN:VEVENT',
                `UID:nexo-${t._id}@nexo`,
                `DTSTAMP:${now}`,
                `DTSTART;VALUE=DATE:${fecha}`,
                `DTEND;VALUE=DATE:${fecha}`,
                `SUMMARY:${escapeIcal(t.nombre)}`,
                `STATUS:${t.estado === 'Completada' ? 'COMPLETED' : 'CONFIRMED'}`,
                ...(t.descripcion ? [`DESCRIPTION:${escapeIcal(t.descripcion)}`] : []),
                'END:VEVENT',
            );
        }

        lines.push('END:VCALENDAR');

        const nombreArchivo = proyecto.nombre.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        res.set('Content-Type', 'text/calendar; charset=utf-8');
        res.set('Content-Disposition', `attachment; filename="nexo-${nombreArchivo}.ics"`);
        res.send(lines.join('\r\n'));
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Error al generar iCal' });
    }
};
