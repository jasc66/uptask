import { useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import useProyectos from "../hooks/useProyectos"
import useOnboarding from "../hooks/useOnboarding"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import Modal from "../components/Modal"
import FormularioProyecto from "../components/FormularioProyecto"
import OnboardingTour from "../components/OnboardingTour"

const RutaProtegida = () => {
  const { auth, cargando } = useAuth()
  const { modalFormularioProyecto, handleModalFormulario, proyectoEditar } = useProyectos()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { tourHecho, marcarTourHecho } = useOnboarding()
  const [tourCorriendo, setTourCorriendo] = useState(false)

  // Auto-start tour on first visit (after cargando resuelve)
  const [tourAutoIniciado, setTourAutoIniciado] = useState(false)
  if (!cargando && auth._id && !tourHecho && !tourAutoIniciado) {
    setTourAutoIniciado(true)
    setTimeout(() => setTourCorriendo(true), 800)
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
    </div>
  )

  return (
    <>
      {auth._id ? (
        <>
        <OnboardingTour corriendo={tourCorriendo} onTerminar={() => { setTourCorriendo(false); marcarTourHecho() }} />
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Header onMenuClick={() => setSidebarOpen(true)} onIniciarTour={() => setTourCorriendo(true)} />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              <Outlet />
            </main>
          </div>
        </div>
        </>
      ) : (
        <Navigate to="/" />
      )}

      {modalFormularioProyecto && (
        <Modal
          titulo={proyectoEditar?._id ? 'Editar proyecto' : 'Nuevo proyecto'}
          onClose={handleModalFormulario}
        >
          <FormularioProyecto />
        </Modal>
      )}
    </>
  )
}

export default RutaProtegida
