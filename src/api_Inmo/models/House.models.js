//! - necesito mongoose
const mongoose = require("mongoose");

//! - esquema de modelo de datos
const HouseSchema = new mongoose.Schema(
    {
        Adress: { type: String, required: true, inique: true},
        Size: { type: Number, required: false,},
        Rooms: { type: Number, required: false,},
        Area: { type: String, required: false, },
        Extras: [{
            type: String,
            enum: ["Garaje", "Terraza", "Piscina"],
            required: false,
        }],
        Image: { type: String, required: false, },
        User: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    {
        timestamps: true,
    }
)

//! - modelo de datos
const House = mongoose.model("House", HouseSchema);

//! - exportacion
module.exports = House;