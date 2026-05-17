import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors"
import conectarDB from "./config/db.js";
import usuarioRoutes from './routes/usuarioRoutes.js';
import proyectoRoutes from "./routes/proyectoRoutes.js";
import tareaRoutes from "./routes/tareaRoutes.js";


const app = express();
app.use(express.json());

conectarDB();

//Configurar CORS
const whiteList = (process.env.FRONTEND_URL || 'http://localhost:5173')
	.split(',')
	.map(url => url.trim().replace(/\/$/, ''))
	.filter(Boolean);

const corsOptions = {
	origin: function(origin, callback) {
		if (!origin || whiteList.includes(origin)) {
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
app.use("/api/tareas", tareaRoutes)

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=> {
	console.log(`Servidor corriendo en el puerto ${PORT}`);
});
