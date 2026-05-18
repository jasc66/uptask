import { useContext } from "react";
import ProyectoContext from "../context/ProyectoContext";

const useProyectos = () => {
    return useContext(ProyectoContext)
}

export default useProyectos
