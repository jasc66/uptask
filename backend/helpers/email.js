import nodemailer from "nodemailer";

export const emailRegistro = async (datos)=> {
    const { email, nombre, token } = datos;

    
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASS,
        }
      });

      //Información del email 
      const info = await transport.sendMail({
        from: '"MAG - Administrador de Proyectos" <correo@mag.go.cr>',
        to: email,
        subject: "Ministerio de Agricultura - Comprueba tu cuenta",
        text: "Comprueba tu cuenta en MAG",
        html: 
        ` <p>Hola: ${nombre} Comprueba tu cuenta en MAG-Tareas </p>
        <p>Tu cuenta ya esta casi lista, solo debes comprobarla en el siguiente enlace:</p>
        
        <a href="${process.env.FRONTEND_URL}/confirmar/${token}">Comprobar Cuenta</a>

        <p>Si tu no creaste esta cuenta, puedes ignorar el mensaje</p>
        `
      })
}

export const emailOlvidePassword = async (datos)=> {
  const { email, nombre, token } = datos;

  const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          }
    });

    //Información del email 
    const info = await transport.sendMail({
      from: '"MAG - Administrador de Proyectos" <correo@mag.go.cr>',
      to: email,
      subject: "Ministerio de Agricultura - Reestablece tu Password",
      text: "Reestablece tu Password",
      html: 
      ` <p>Hola: ${nombre} has solicitado reestablecer tu password </p>
      <p>Sigue el siguiente enlace para generar un nuevo password:</p>
      
      <a href="${process.env.FRONTEND_URL}/olvide-password/${token}">Reestablecer Password</a>

      <p>Si tu no solicitaste esta email, puedes ignorar el mensaje</p>
      `
    })
}
