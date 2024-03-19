//! - IMPORTACIONES DE funciones upload DE CLOUDINARY Y create del CONTROLADOR Character

const { upload } = require("../../middleware/files.middleware");
const { create } = require("../controllers/Character.controllers");

//!! - IMPORTACION ROUTER

const CharacterRoutes = require("express").Router();

//! - RUTA CON EL METODO, EL ENDPOINT Y LA FUNCION QUE QUEREMOS EJECUTAR EN LA RUTA >>> extra upload de cloudinary

CharacterRoutes.post("/", upload.single("image"), create)

//! - EXPORTACION RUTA

module.exports = CharacterRoutes;
