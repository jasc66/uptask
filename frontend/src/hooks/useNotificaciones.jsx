import { useContext } from 'react'
import NotificacionesContext from '../context/NotificacionesProvider'

const useNotificaciones = () => useContext(NotificacionesContext)

export default useNotificaciones
