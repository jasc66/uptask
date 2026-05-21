import express from "express";
import { buscarGlobal } from "../contollers/busquedaController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.get("/", checkAuth, buscarGlobal);

export default router;
