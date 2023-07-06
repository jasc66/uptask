import { Outlet } from "react-router-dom"

function AuthLayout() {
  return (
    <>
        <main className="container mx-auto mt-5 md:mt-20 m-5 md:flex md:justify-center  ">
            <div className="md:w-2/3 lg:2/5">
                 <Outlet/>
            </div>
             
             
        </main>

        
    </>
    
  )
}

export default AuthLayout
