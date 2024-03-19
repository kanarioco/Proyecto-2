const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const House = require("../models/House.models");
const enumOkHouse = require("../../utils/enumOkHouse");
const User = require("../models/User.model");



/** CRUD
 ** CREATE ---> post ✔
 ** READ ---> get ✔
 ** UPDATE ---> put (actualizacion completa), patch (actualizacion parcial) ✔
 ** DELETE ---> delete ✔
 */

//! --- CREATE - POST ---

const createHouse = async (req, res, next) => {
    
    let catchImg = req.file?.path;

    try {
        
        await House.syncIndexes();

        const newHouse = new House(req.body);

        if (req.file) {
            newHouse.Image = catchImg;

        } else {
            newHouse.Image = "https://res.cloudinary.com/dzfbxtdwe/image/upload/v1710181044/housePlaceholder_b69mak.jpg"
        }

        const saveHouse = await newHouse.save();

        if (saveHouse) {
            return res.status(200).json(saveHouse);

        } else {
            return res.status(404).json("No se ha podido guardar el elemento en la DB 💥")
        }

    } catch (error) {
        req.file?.path && deleteImgCloudinary(catchImg);
        next(error);
        return (
            res.status(404).json({
                message: "Error en la creación del elemento 💥",
                error: error,
            }) && next(error)
        )
    }

}

//! --- READ - GET all ---

const getAll = async (req, res, next) => {
    try {
        const allHouse = await House.find();

        if (allHouse.length > 0) {
            return res.status(200).json(allHouse);
            
        } else {
            return res.status(404).json("No se han encontrado Houses, 🤷‍♀️")
        }
    } catch (error) {
        return res.status(404).json({
            error:"Error en la busqueda de las Houses, ❌",
            message: error.message,
        })
    }
}

//! --- UPDATE - PATCH ---

const update = async (req, res, next) => {
    let catchImg = req.file?.path;
    
    try {
        await House.syncIndexes();

        const { id }  = req.params;
        const houseById = await House.findById(id);
        
        if (houseById) {
            const oldImg = houseById.Image;

            const customBody = {
                _id: houseById._id,
                Adress: req.body?.Adress ? req.body?.Adress : houseById.Adress,
                Size: req.body?.Size ? req.body?.Size : houseById.Size,
                Rooms: req.body?.Rooms ? req.body?.Rooms : houseById.Rooms,
                Area: req.body?.Area ? req.body?.Area : houseById.Area,
                Image: req.file?.path ? catchImg : oldImg,
            }
        
            if (req.body?.Extras) {
                const resultEnum = enumOkHouse(req.body?.Extras)
                customBody.Extras = resultEnum.check
                ? req.body?.Extras
                : houseById.Extras
            } 
            
            try {
                await House.findByIdAndUpdate(id, customBody)
                if (req.file?.path) {
                    deleteImgCloudinary(oldImg)
                }

// --- TESTEO EN TIEMPO REAL ---

                const houseByIdUpdate = await House.findById(id);
                const elementUpdate = Object.keys(req.body);
                let test = {};

                elementUpdate.forEach((item) => {
                    if(req.body[item] === houseByIdUpdate[item]){
                        test[item] = true;
                    } else {
                        test[item] = false;
                    }
                })

                if(catchImg){
                    houseByIdUpdate.Image === catchImg 
                    ? (test = { ...test, file: true}) 
                    : (test = { ...test, file: false})
                }

                let acc = 0;

                for ( clave in test) {
                    test[clave] == false && acc++;
                }

                if (acc > 0) {
                    return res.status(404).json({
                        dataTest : test,
                        update: false
                    })
                } else {
                    return res.status(200).json({
                        dataTest : test,
                        update: true
                    })
                }

// --- FIN TESTEO ---

            } catch (error) {
                next(error)
                return (
                    res.status(404).json({
                        message: "no se ha actualizado la House ❌",
                        error: error,
                    }) && next(error)
                )
            }
        } else {
            next(error);
            return (
                res.status(404).json({
                    message: "la House no existe 💥",
                    error: error,
                }) && next(error)
            )
        }
    } catch (error) {
        next(error);
        return (
            res.status(404).json({
                message: "ninguna House con ese id 💥",
                error: error,
            }) && next(error)
        )
    }
}

//! --- DELETE ---

const deleteHouse = async (req, res, next) => {
    try {
        const { id } = req.params;
        await House.findByIdAndDelete(id);

// --- TESTEO ---
        const findByIdHouse = await House.findById(id);
        if(findByIdHouse){
            return res.status(404).json("No se ha borrado ❌", error);
        } else {
            return res.status(200).json("Se ha borrado 😉")
        }
// --- FIN TESTEO ---

    } catch (error) {
        return res.status(404).json("Ha habido un error 💥")
    }
}

//! --- TOGGLE ---


const toggleUser = async (req, res, next) => {
    try {
      
        const { id } = req.params; // id del House
        const { User } = req.body;
    
        const houseById = await House.findById(id);

        if (houseById) {
          
            const arrayIdUsers = User.split(",");

            Promise.all(
                    arrayIdUsers.map(async (user, index) => {
                        if (houseById.User.includes(user)) {
                          
            // --- BORRAR EL USER DENTRO DE LA HOUSE --- 
                        
                            try {
                                await House.findByIdAndUpdate(id, {
                                    
                                    $pull: { User: User },
                                });

                                try {
                                    await User.findByIdAndUpdate(User, {
                                        $pull: { house: id },
                                    });
                                } catch (error) {
                                    res.status(404).json({
                                        error: "error update User",
                                        message: error.message,
                                    }) && next(error);
                                }
                            } catch (error) {
                                res.status(404).json({
                                    error: "error update House",
                                    message: error.message,
                                }) && next(error);
                            }
                        } else {
                           
            // --- METER USER EN LA HOUSE ---
                            
                            try {
                                await House.findByIdAndUpdate(id, {
                                    $push: { User: User },
                                });
                                try {
                                    await User.findByIdAndUpdate(User, {
                                        $push: { house: id },
                                    });
                                } catch (error) {
                                    res.status(404).json({
                                        error: "error update User",
                                        message: error.message,
                                    }) && next(error);
                                }
                            } catch (error) {
                                res.status(404).json({
                                    error: "error update House",
                                    message: error.message,
                                }) && next(error);
                            }
                        }
                    })
                )
                .catch((error) => res.status(404).json(error.message))
                .then(async () => {
                    return res.status(200).json({
                        dataUpdate: await House.findById(id).populate("User"),
                    });
                });
        } else {
            return res.status(404).json("este House no existe");
        }
    } catch (error) {
        return (
            res.status(404).json({
                error: "error catch",
                message: error.message,
            }) && next(error)
        );
    }
};



module.exports = {
    createHouse,
    getAll,
    update,
    deleteHouse,
    toggleUser,
}    