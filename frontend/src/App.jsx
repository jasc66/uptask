import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import Login from './page/Login'
import Registrar from './page/Registrar'
import OlvidePassword from './page/OlvidePassword'
import NuevoPassword from './page/NuevoPassword'
import ConfirmarCuenta from './page/ConfirmarCuenta'

function App() {


  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<AuthLayout/>}>
        <Route index element={<Login/>} />
        <Route path='registrar' element={<Registrar/>} />
        <Route path='olvide-password' element={<OlvidePassword/>} />
        <Route path='olvide-password/:token' element={<NuevoPassword/>} />
        <Route path='confirmar/:id' element={<ConfirmarCuenta/>} />

      </Route>
    </Routes>
    
    </BrowserRouter>
  )
}

export default App
