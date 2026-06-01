import express from 'express';
import { generarPlan, resumirProyecto, mejorarDescripcion } from '../contollers/iaController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

router.post('/generar-plan', checkAuth, generarPlan);
router.post('/resumen-proyecto/:id', checkAuth, resumirProyecto);
router.post('/mejorar-descripcion', checkAuth, mejorarDescripcion);

export default router;
