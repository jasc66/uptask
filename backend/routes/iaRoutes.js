import express from 'express';
import { generarPlan, resumirProyecto, mejorarDescripcion, analizarRiesgos, chatProyecto } from '../contollers/iaController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

router.post('/generar-plan', checkAuth, generarPlan);
router.post('/resumen-proyecto/:id', checkAuth, resumirProyecto);
router.post('/mejorar-descripcion', checkAuth, mejorarDescripcion);
router.post('/analizar-riesgos/:id', checkAuth, analizarRiesgos);
router.post('/chat-proyecto/:id', checkAuth, chatProyecto);

export default router;
