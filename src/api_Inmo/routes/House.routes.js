//! - importaciones
const { upload } = require("../../middleware/files.middleware");
const { 
    createHouse,
    getAll,
    update,
    deleteHouse,
    toggleUser,
} = require("../controllers/House.controllers");

//!! - importacion del router
const HouseRoutes = require("express").Router();

//! - rutas
HouseRoutes.post("/", upload.single("Image"), createHouse);
HouseRoutes.get("/", getAll);
HouseRoutes.patch("/:id", upload.single("Image"), update);
HouseRoutes.delete("/:id", deleteHouse);
HouseRoutes.patch("/addUser/:id", toggleUser);

//! - exportacion
module.exports = HouseRoutes;