const User = require("../models/User.model")
const randomCode = require("../../utils/randomCode");
const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const nodemailer = require("nodemailer");
const validator = require("validator");
const bcrypt = require("bcrypt");
const sendEmail = require("../../utils/sendEmail");
const { generateToken } = require("../../utils/token");
const setError = require("../../helpers/handle-error");
const randomPassword = require("../../utils/randomPassword")
const enumOk = require("../../utils/enumOk");

//! --- REGISTRO CON REDIRECT ---

const registerRedirect = async (req, res, next) => {

    let catchImg = req.file?.path;

    try {
        await User.syncIndexes()

        const confirmationCode = randomCode();

        const { email, name } = req.body;

        const userExist = await User.findOne(
            { email: req.body.email },
            { name: req.body.name }
        )

        if (!userExist) {
            const newUser = new User({ ...req.body, confirmationCode })
            
            req.file 
            ? (newUser.image = req.file.path) 
            : (newUser.image = 'https://res.cloudinary.com/dzfbxtdwe/image/upload/v1710357454/userPlaceholder_zxkzc2.png')

            // creamos una nueva utilidad ---sendEmail
            try {
                const userSave = await newUser.save(); 

                if (userSave) {
                    return res.redirect(
                        307,
                        `http://localhost:8080/api_Inmo/v1/users/register/sendMail/${userSave._id}`
                    )
                } else {
                    // si el user no se ha guardado
                    return res.status(404).json('el usuario no se ha guardado')
                }
            } catch (error) {
                // no se ha guardado el user
                return res.status(404).json({
                    error: 'error catch save',
                    message: error.message
                })
            }
        } else {
            req.file && deleteImgCloudinary(catchImg)
            return res.status(404).json('el usuario ya existe')
        }
    } catch (error) {
        // error registro
        return res.status(404).json({
            error: 'error catch general',
            message: error.message
        })
    }
}

/* redireccion a sendCode para enviar el codigo de confirmacion
   después de ejecutar este controlador, volvemos a registerRedirect
 */


//!--- CORREO CONFIRMACION CON REDIRECT ---

const sendCode = async (req, res, next) => {
    try {
        // BUSCAMOS AL USER POR ID EL CUAL RECIBIMOS POR UN PARAM
        // para buscar el email y su codigo de confirmacion
        //del user sacamos el email y el confirmationCode
        const { id } = req.params;
        const userDB = await User.findById(id)

  //todO --- envio correo codigo de confirmacion ---
        
        const EMAIL = process.env.EMAIL;
        const PASSWORD = process.env.PASSWORD;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: EMAIL,
                pass: PASSWORD,
            },
        });

        const mailOptions = {
            from: EMAIL,
            to: userDB.email,
            subject: "Confirmation code",
            text: `tu codigo es ${userDB.confirmationCode}, gracias por confiar en nosotros ${userDB.name}`,
            tls: {
                rejectUnauthorized: false
            }
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.status(404).json({
                    user: userDB,
                    confirmationCode: 'error, no se ha enviado el codigo'
                })
            } else {
                console.log('Email enviado - info del email: ' + info.response);
                return res.status(200).json({
                    user: userDB,
                    confirmationCode: userDB.confirmationCode
                })
            }
        })

    } catch (error) {
        return next(error);
    }
}


//! --- RESEND CODE ---

const resendCode = async (req, res, next) => {
    try {
      // vamos a configurar nodemailer porque tenemos que enviar un codigo
      const email = process.env.EMAIL;
      const password = process.env.PASSWORD;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: email,
          pass: password,
        },
      });
  
      // hay que ver que el usuario exista porque si no existe no tiene sentido hacer ninguna verificacion
      const userExists = await User.findOne({ email: req.body.email });
  
      if (userExists) {
        const mailOptions = {
          from: email,
          to: req.body.email,
          subject: "Confirmation code",
          text: `tu codigo es ${userExists.confirmationCode}`,
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            return res.status(404).json({
              resend: false,
            });
          } else {
            console.log("Email sent: " + info.response);
            return res.status(200).json({
              resend: true,
            });
          }
        });
      } else {
        return res.status(404).json("User not found");
      }
    } catch (error) {
      return next(setError(500, error.message || "Error general send code"));
    }
  };


//! --- CHECK NEW USER ---

const checkNewUser = async (req, res, next) => {
    try {
      // nos traemos de la req.body el email y codigo de confirmation
      const { email, confirmationCode } = req.body;
  
      const userExists = await User.findOne({ email });
  
      if (!userExists) {
        // No existe----> 404 de no se encuentra
        return res.status(404).json("User not found");
      } else {
        // comparamos que codigo recibido por la req.body y el del userExists sea igual
        if (confirmationCode === userExists.confirmationCode) {
          try {
            await userExists.updateOne({ check: true });
  
            // testeo de que este user se ha actualizado correctamente, (findOne)
            const updateUser = await User.findOne({ email });
  
            // este finOne nos sirve para hacer un ternario que nos diga si la propiedad vale true o false
            return res.status(200).json({
              testCheckOk: updateUser.check == true ? true : false,
            });
          } catch (error) {
            return res.status(404).json(error.message);
          }
        } else {
          try {
            /// Si codigo incorrecto lo borramos de la base datos y lo mandamos al registro
            await User.findByIdAndDelete(userExists._id);
  
            // borramos la imagen
            deleteImgCloudinary(userExists.image);
  
            // estado de que el delete se ha hecho correctamente
            return res.status(200).json({
              userExists,
              check: false,
  
              // test en el runtime sobre la eliminacion de este user
              delete: (await User.findById(userExists._id))
                ? "error delete user"
                : "ok delete user",
            });
          } catch (error) {
            return res
              .status(404)
              .json(error.message || "error general delete user");
          }
        }
      }
    } catch (error) {
      return next(setError(500, error.message || "General error check code"));
    }
  };


//! --- LOGIN ---

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userDb = await User.findOne({ email })
        // if else para ver si existe el usuario
        if (userDb) {
            /** comparamos gracias a bcrypt la contraseña sin encriptar con la contraseña encriptada que tenemos en el back
             *  metodo compareSync
             * >>> importante!! ---> las contraseñas tiene que ir en este orden
             */
            if (bcrypt.compareSync(password, userDb.password)) {
                // si contraseñas iguales --> funcion de generar el token
                const token = generateToken(userDb._id, email);
                // una vez generado el token le envio al user su token
                return res.status(200).json({
                    user: userDb,
                    token,
                })
            } else { 
                return res.status(404).json('las contraseñas no coinciden')
            }
        } else {
            // si no encuentra el email que el usuario nos da
            return res.status(404).json('usuario no registrado')
        }
    } catch (error) {
        return next(error)
    }
}


//! --- EJ. con Autenticación ---

const exampleAuth = async (req, res, next) => {
    // este { user } ---> se crea gracias a las funciones que tenemos en el middleware de autenticacion
    // ese middleware crea el user comprobado con su token y aquí lo traemos para hacer un ejemplo
    // de que es un user autentiado
    const { user } = req;
    return res.status(200).json(user)
}


//! --- CAMBIO DE CONTRASEÑA NO LOGUEADO ---

const changePassword = async (req, res, next) => {
    try {
      // PEDIR EMAIL DEL BODY Y COMPROBAR QUE EXISTE EN LA DB
      const { email } = req.body;
      console.log(req.body);
      const userDb = await User.findOne({ email });
      if (userDb) {
        // SI EXISTE HACEMOS EL REDIRECT
        const PORT = process.env.PORT;
        return res.redirect(
          307,
          `http://localhost:${PORT}/api_Inmo/v1/users/sendPassword/${userDb._id}`
        );
      } else {
        return res.status(404).json("User no register");
      }
    } catch (error) {
      return next(error);
    }
  };

const sendPassword = async (req, res, next) => {
    try {
      // BUSCAR AL USER POR EL ID DEL PARAM 
      const { id } = req.params;
      const userDb = await User.findById(id);
      // ENVIO EMAIL
      const email = process.env.EMAIL;
      const password = process.env.PASSWORD;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: email,
          pass: password,
        },
      });
      let passwordSecure = randomPassword();
      console.log(passwordSecure);
      const mailOptions = {
        from: email,
        to: userDb.email,
        subject: "-----",
        text: `User: ${userDb.name}. Your new code login is ${passwordSecure} Hemos enviado esto porque tenemos una solicitud de cambio de contraseña, si no has sido ponte en contacto con nosotros, gracias.`,
      };
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          /// SI HAY UN ERROR MANDO UN 404
          console.log(error);
          return res.status(404).json("dont send email and dont update user");
        } else {
          // SI NO HAY NINGUN ERROR
          console.log("Email sent: " + info.response);
          // GUARDO ESTA CONTRASEÑA EN MONGO DB
  
          // PRIMERO HAY QUE ENCRIPTAR LA CONTRASEÑA
          const newPasswordBcrypt = bcrypt.hashSync(passwordSecure, 10);
  
          try {
            /* este metodo te lo busca por id y luego modifica las claves que le digas
               en este caso le decimos que en la parte dde password queremos meter
               la contraseña hasheada  */
            await User.findByIdAndUpdate(id, { password: newPasswordBcrypt });
  
            //!------------------ test --------------------------------------------
            // vuelvo a buscar el user pero ya actualizado
            const userUpdatePassword = await User.findById(id);
  
            // hago un compare sync ----> comparo una contraseña no encriptada con una encrptada
            /// -----> userUpdatePassword.password ----> encriptada
            /// -----> passwordSecure -----> contraseña no encriptada
            if (bcrypt.compareSync(passwordSecure, userUpdatePassword.password)) {
              // si son iguales quiere decir que el back se ha actualizado correctamente
              return res.status(200).json({
                updateUser: true,
                sendPassword: true,
              });
            } else {
              /* si no son iguales le diremos que hemos enviado el correo pero que no
                hemos actualizado el user del back en mongo db  */
              return res.status(404).json({
                updateUser: false,
                sendPassword: true,
              });
            }
          } catch (error) {
            return res.status(404).json(error.message);
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  };


//! --- CAMBIO DE CONTRASEÑA LOGUEADO ---

const modifyPassword = async(req, res, next) => {
    try {
        // contraseña nueva y antigua dada por el user el body es un json con la password nueva y la antigua
        const { password, newPassword } = req.body;

        // comprobacion de contraseña segura según validator */
        const validado = validator.isStrongPassword(newPassword); // true o false

        // si logueado y contraseña validada, traemos el id del user para poder comparar las contraseñas y actualizar la password a la nueva
         
        // validado es true
        if (validado) {

            /** este req.user sale de la función isAtuh del middlewate de autenticación
             * el middleware comprueba que estamos autenticados y nos manda por la req.user el id
             * lo recogemos en esta funcion de modifypassword para actualizarlo con la nueva pass
             */
            const { _id } = req.user;
            
            // comparamos contraseñas del usuario y de la db
            if (bcrypt.compareSync(password, req.user.password)) {

                // encriptamos la nueva contraseña
                const newPasswordHashed = bcrypt.hashSync(newPassword, 10)

                // y actualizamos el user con la contraseña nueva
                try {
                    await User.findByIdAndUpdate(_id, { password: newPasswordHashed })

        //* ------------ test update password en user ------------
                    
                    // traer el user por id
                    const userUpdate = await User.findById(_id)
                    // comparar las contraseñas 
                    if (bcrypt.compareSync(newPassword, userUpdate.password)) {
                        // respuesta de update user true (test OK)
                        return res.status(200).json({
                            userUpdate : true,
                        })
                    } else {
                        // respuesta de update user false (test KO)
                        return res.status(404).json({
                            userUpdate : false,
                        })
                    }

        //* ---------------------- fin test ----------------------
                } catch (error) {
                    return res.status(404).json({
                        error: "error catch update",
                        message: error.message,
                    })
                }
            } else {
                // si no conseguimos validacion al comparar las contraseñas
                return res.status(404).json("las contraseñas no coinciden")
            }
        } else {
            // validado es false
            return res.status(404).json("las contraseña no es suficientemente segura")
        }
    } catch (error) {
        return res.status(500).json({
            error: "error catch general --- no autenticado",
            message: error.message,
        })
    }
}


//! --- UPDATE ---

const update = async (req, res, next) => {
    // CAPTURA IMAGEN
    let catchImg = req.file?.path;

    try {
        // ACTUALIZACION DE INDICES
        await User.syncIndexes();
        // instanciamos un nuevo objeto del modelo de user con el req.body
        const patchUser = new User(req.body);

        // si tenemos imagen nueva la metemos a la instancia del modelo 
        req.file && (patchUser.image = catchImg);

        // salvaguardamos info que no quiero que el usuario pueda cambiar 
        patchUser._id = req.user._id;
        patchUser.password = req.user.password;
        patchUser.rol = req.user.rol;
        patchUser.confirmationCode = req.user.confirmationCode;
        patchUser.email = req.user.email;
        patchUser.check = req.user.check;

        // enumOk de utils para comprobar que al cambiar gender nos da un valor valido
        if (req.body?.gender) {
            const resultEnum = enumOk(req.body?.gender)
            patchUser.gender = resultEnum.check ? req.body?.gender : req.user.gender
        }

        // try catch para la peticion del usuario con la peticion de update
        try {
            // peticion del usuario por id y actualizacion con update
            await User.findByIdAndUpdate(req.user._id, patchUser)
            // borrado de imagen antigua, almancenada en el req.user en la propiedad image
            if (req.file) { deleteImgCloudinary(req.user.image) }

    //* --------- test runtime update del user -------
            // traemos el user actualizado (en mongodb el id lleva _id antes)
            const updateUser = await User.findById(req.user._id);
            /* queremos saber que nos envia el usuario para hacer el testeo entonces tenemos que coger
               las propiedades de lo que quiere cambiar del objeto del body (req.body)
              
               Object.keys() devuelve un array con las propiedades del objeto: name, image, email, gender... */
            
            const updateKeys = Object.keys(req.body);
            /* array vacio para meter dentro esas propiedades con forEach
               así solo cogemos las propiedades que nos da el usuario
               solo testeamos las propiedades que van a tener una actualizacion */
             
            const testUpdate = [];
            // hacemos un forEach de esas propiedades y cada propiedad va a ser un "item" 
            updateKeys.forEach((item) => {
                /* hacemos un "doble testeo" de esos item (propiedades)
                  en el primer if ---> comprobamos que la propiedad del usuario actualizado es igual a la propidad que nos ha dado el usuario en el formulario
                  >>>>>>>> si es igual ---> comprobamos dentro con otro if ---> comprobamos que las propiedades que no son distintas dentro del usuario
                  
                  si no son distintas >>> puseamos dentro del array vacio la propiedad actualizada con un true ---> update ok
                  si son distintas >>> puseamos dentro del array vacio la propiedad actualizada con un false ---> update ko  */
               
                if (updateUser[item] === req.body[item]) {
                    if (updateUser[item] != req.user[item]) {
                        testUpdate.push({
                            [item] : true,
                        })
                    } else {
                        testUpdate.push({
                            [item] : false,
                        })
                    }
                } else {
                    testUpdate.push({
                        [item] : false,
                    })
                }
            });
            // hacemos el mismo testeo con la imagen
            /* comprobamos si ha subido una imagen,
               y comprobamos que es igual a la imagen que hemos capturado al inicio de la funcion
               y pusheamos dentro del test un obejto con los resultados del test ---> true o false */
            
            if (req.file) {
                updateUser.image === catchImg 
                ? testUpdate.push({
                    image : true,
                }) 
                : testUpdate.push({
                    image : false,
                }) 
            } else {
                return res.status(200).json({
                    updateUser,
                    testUpdate,
                })
            }

    //* -------------- fin test ----------------------

        /* primero tenemos que borrar la imagen que se ha quedado en el middleware de cloudinary y después damos respuesta con el error
           el primer error será el del update ---> cliente
           el segundo error será en el servidor ---> back
         */

        } catch (error) {
            req.file && deleteImgCloudinary(catchImg)
            return res.status(404).json({
                error: "error catch update",
                message: error.message,
            })
        }

    } catch (error) {
        req.file && deleteImgCloudinary(catchImg)
        return res.status(500).json({
            error: "error catch general",
            message: error.message,
        })
    }
}   

//! --- DELETE ---

const deleteUser = async (req, res, next) => {
    try {
        // borrado usuario del body por el id
      await User.findByIdAndDelete(req.user._id);
        // comprobacion de si existe o no despues de borrarlo y si no eliminamos la imagen de cloudinary
      if (await User.findById(req.user._id)) {
        return res.status(404).json("not deleted");
      } else {
        deleteImgCloudinary(req.user?.image);
        return res.status(200).json("ok delete");
      }
    } catch (error) {
      return next(error);
    }
  };





//! --- EXPORTACION

module.exports = {
    registerRedirect,
    sendCode,
    login,
    exampleAuth,
    resendCode,
    checkNewUser,
    changePassword,
    sendPassword,
    modifyPassword,
    update,
    deleteUser,

}