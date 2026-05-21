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
import {
    listarReportes,
    obtenerReporte,
    crearReporte,
    actualizarReporte,
    eliminarReporte,
    obtenerDatos,
    previewReporte,
    getDefiniciones,
} from '../contollers/reportesGuardadosController.js';
import {
    listarProgramados,
    obtenerProgramado,
    crearProgramado,
    actualizarProgramado,
    eliminarProgramado,
    ejecutarAhora,
} from '../contollers/reportesProgramadosController.js';
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

// Reportes guardados (Fase 9)
router.get('/guardados/definiciones', checkAuth, getDefiniciones);
router.post('/guardados/preview', checkAuth, previewReporte);
router
    .route('/guardados')
    .get(checkAuth, listarReportes)
    .post(checkAuth, crearReporte);
router.get('/guardados/:id/datos', checkAuth, obtenerDatos);
router
    .route('/guardados/:id')
    .get(checkAuth, obtenerReporte)
    .put(checkAuth, actualizarReporte)
    .delete(checkAuth, eliminarReporte);

// Reportes programados (Fase 10)
router
    .route('/programados')
    .get(checkAuth, listarProgramados)
    .post(checkAuth, crearProgramado);
router.post('/programados/:id/ejecutar', checkAuth, ejecutarAhora);
router
    .route('/programados/:id')
    .get(checkAuth, obtenerProgramado)
    .put(checkAuth, actualizarProgramado)
    .delete(checkAuth, eliminarProgramado);

export default router;
