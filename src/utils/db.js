//! - IMPORTACION DOTENV Y MONGOOSE

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");

//! - TRAER LA MONGO URI

const MONGO_URI = process.env.MONGO_URI;

//! - FUNCION ASÍNCRONA PARA CONECTAR LA DB DE MONGODB

const connect = async() => {
    try {
        const db = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const { name, host } = db.connection;

        console.log(`Conectada la DB ⚡ con el HOST: ${host} y el name: ${name}`);

    } catch (error) {
        console.log("Hay un error en la conexión con la DB ❌", error);
    }
}

//! - EXPORTACIONES

module.exports = { connect };