//! - IMPORTACIONES Y CONFIG DOTENV

const express = require("express");
const dotenv = require("dotenv");
dotenv.config()

//! - CONEXION DE LA BASE DE DATOS

const { connect } = require("./src/utils/db");
connect();

//! - CONFIGURACION DE CLOUDINARY

const { configCloudinary } = require("./src/middleware/files.middleware");
configCloudinary();

//! - CREAR EL SERVDIDOR WEB Y CORS AL SERVIDOR

const app = express();
const cors = require("cors");
app.use(cors());

//! - LIMITACIONES DE CANTIDAD SERVIDOR EN EL BACKEND

app.use(express.json({limit: "5mb"}));
app.use(express.urlencoded({limit: "5mb", extended:false}));

//! - RUTAS

const CharacterRoutes = require("./src/api/routes/Character.routes");
app.use("/api/v1/characters/", CharacterRoutes);

const HouseRoutes = require("./src/api_Inmo/routes/House.routes");
app.use("/api_Inmo/v1/houses/", HouseRoutes);

const UserRoutes = require("./src/api_Inmo/routes/User.routes");
app.use("/api_Inmo/v1/users", UserRoutes);

//! - ERROR 404 -> no se encuentra una ruta -> error de USER o CLIENTE

app.use("*", (req, res, next) => {
    const error = new Error("Route not found");
    error.status = 404;
    return next(error)
})

//! - ERROR 500 -> no funciona el servidor (crashed server) -> error de SERVIDOR

app.use((error, req, res) => {
    return res
    .status(error.status || 500)
    .json(error.message || "Unexpected error")
})

//! - VARIABLES DE ENTORNO

const PORT = process.env.PORT;

//! - ESCUCHAR EN EL PUERTO EL SERVIDOR WEB

app.listen(PORT, () => {
    console.log(`Server listening on port 🚀 http://localhost:${PORT}`);
})

