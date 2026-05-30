import express from "express";
import {
    listar,
    contar,
    marcarLeida,
    marcarTodasLeidas,
    eliminar,
} from "../contollers/notificacionController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.get("/", checkAuth, listar);
router.get("/conteo", checkAuth, contar);
router.put("/leer-todas", checkAuth, marcarTodasLeidas);
router.put("/:id/leer", checkAuth, marcarLeida);
router.delete("/:id", checkAuth, eliminar);

export default router;
