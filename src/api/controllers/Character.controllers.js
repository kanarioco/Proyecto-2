//! - IMPORTACIONES - MIDDLEWARE DE CLOUDINARY + MODELO CHARACTER

const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const Character = require("../models/Character.models");

//! --- POST create ---

const create = async(req, res, next) => {
    let catchImg = req.file?.path;
    try {
        //! - ACTUALIZAR LOS INDEXS
        await Character.syncIndexes();
        //! - INSTANCIAR UN CHARACTER >>> new Character
        const newCharacter = new Character(req.body);
        //! - VALORAR SI SE HA RECIBIDO UNA IMAGEN O NO
        if (req.file) {
            newCharacter.image = catchImg;
        } else {
            newCharacter.image = "https://res.cloudinary.com/dzfbxtdwe/image/upload/v1708977343/placeholder-image_nfwg01.jpg"
        }
        //! - GUARDAR LA INSTANCIA DEL NUEVO CHARACTER
        const saveCharacter = await newCharacter.save();
        //! - DEVOLVER LA RESPUESTA EN FUNCION DE SI SE HA GUARDADO O NO
        if (saveCharacter) {
            return res.status(200).json(saveCharacter)
        } else {
            return res.status(404).json("No se ha podido guardar el elemento en la DB ❌")
        }
    } catch (error) {
        //! - SI HA HABIDO UN ERROR ENTRAMOS EN EL CATCH
        req.file?.path && deleteImgCloudinary(catchImg);
        next(error);
        return (
            res.status(404).json({
                message: "Error en la creación del elemento ❌",
                error: error,
            }) && next(error)
        )
    }
}   

//! --- EXPORTACION CONTROLADOR

module.exports = { create }