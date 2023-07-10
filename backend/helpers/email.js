import nodemailer from "nodemailer";

export const emailRegistro = async (datos)=> {
    const { email, nombre, token } = datos;

    //TODO: Mover hacia variables de entorno
    const transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "4781131e227522",
          pass: "29ea78eb87cf33"
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
//TODO: Mover hacia variables de entorno
  const transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "4781131e227522",
        pass: "29ea78eb87cf33"
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
