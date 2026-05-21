import express from 'express';
import {
    getKpis,
    getTareasPorEstado,
    getTareasPorPrioridad,
    getEvolucionMensual,
    getCargaUsuarios,
    getProyectosResumen,
    getReporteProyecto,
    getReporteUsuario,
} from '../contollers/reportesController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

router.get('/kpis', checkAuth, getKpis);
router.get('/tareas-por-estado', checkAuth, getTareasPorEstado);
router.get('/tareas-por-prioridad', checkAuth, getTareasPorPrioridad);
router.get('/evolucion-mensual', checkAuth, getEvolucionMensual);
router.get('/carga-usuarios', checkAuth, getCargaUsuarios);
router.get('/proyectos-resumen', checkAuth, getProyectosResumen);
router.get('/proyecto/:id', checkAuth, getReporteProyecto);
router.get('/usuario/:id', checkAuth, getReporteUsuario);

export default router;
