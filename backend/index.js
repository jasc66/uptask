import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors"
import conectarDB from "./config/db.js";
import usuarioRoutes from './routes/usuarioRoutes.js';
import proyectoRoutes from "./routes/proyectoRoutes.js";
import tareaRoutes from "./routes/tareaRoutes.js";
import reportesRoutes from "./routes/reportesRoutes.js";
import busquedaRoutes from "./routes/busquedaRoutes.js";
import notificacionRoutes from "./routes/notificacionRoutes.js";
import plantillaRoutes from "./routes/plantillaRoutes.js";
import portafolioRoutes from "./routes/portafolioRoutes.js";
import { initSocket } from "./socket.js";
import { initScheduler } from "./helpers/reporteScheduler.js";
import { initRecurrenciaScheduler } from "./helpers/recurrenciaScheduler.js";
import { seedPlantillas } from "./contollers/plantillaController.js";


const app = express();
app.use(express.json({ limit: '5mb' }));

conectarDB();

//Configurar CORS
const whiteList = (process.env.FRONTEND_URL || 'http://localhost:5173')
	.split(',')
	.map(url => url.trim().replace(/\/$/, ''))
	.filter(Boolean);

const corsOptions = {
	origin: function(origin, callback) {
		if (!origin) {
			callback(null, true)
		} else if (whiteList.includes(origin)) {
			callback(null, true)
		} else if (origin.includes('vercel.app') || origin.includes('localhost')) {
			callback(null, true)
		} else {
			callback(new Error(`CORS bloqueado para origen: ${origin}`))
		}
	}
}
app.use(cors(corsOptions));

//Routing
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/proyectos", proyectoRoutes);
app.use("/api/tareas", tareaRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/buscar", busquedaRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/plantillas", plantillaRoutes);
app.use("/api/portafolios", portafolioRoutes);

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, ()=> {
	console.log(`Servidor corriendo en el puerto ${PORT}`);
	initScheduler();
	initRecurrenciaScheduler();
	seedPlantillas().catch(console.error);
});
