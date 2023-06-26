import mongoose from "mongoose";
import bcrypt from "bcrypt";

const usuariosSchema = mongoose.Schema(
  {
  	nombre: {
  		type: String,
  		required: true,
  		trim: true,
  	},
  	password: {
  		type: String,
  		required: true,
  		trim: true,
  	},
  	email: {
  		type: String,
  		required: true,
  		trim: true,
  		unique: true,
  	},
  	token: {
  		type: String,
  	},
  	confirmado: {
  		type: Boolean,
  		default: false,
  	},
  }, {
  	timestamps: true,
  }
);
usuariosSchema.pre('save', async function (next) {
	if(!this.isModified('password')){//revisa que no se modifique el hash para que el usuario no pierda el acceso 
		next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
})

const Usuario = mongoose.model("Usuario", usuariosSchema);
export default Usuario;
