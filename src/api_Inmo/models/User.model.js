
const bcrypt = require("bcrypt");
const validator = require("validator"); // validar informacion del usuario ---> email, password
const mongoose = require("mongoose");

//! --- MODELO DE ESQUEMA

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            validate: [validator.isEmail, "Email not valid"], 
            // en caso de no ser un email valido
            // error ----> 'Email not valid'
        },
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
            validate: [validator.isStrongPassword], 
            //minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
        },
        gender: {
            type: String,
            enum: ["hombre", "mujer", "otros"],
        },
        rol: {
            type: String,
            enum: ["admin", "user", "superadmin"],
            default: "user",
        },
        confirmationCode: {
            type: Number,
            required: true,
        },
        check: {
            type: Boolean,
            default: false,
        },
        image: {
            type: String,
        },
        house: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "House"
        }]
    }, 
    {
        timestamps: true,
    }
);

//! --- ENCRIPTAR LA CONTRASEÑA Y GUARDAR EL MODELO

UserSchema.pre("save", async function (next) {
    try {
        this.password = await bcrypt.hash(this.password, 10); 
        next();
    } catch (error) {
        next("Error hashing password", error);
    }
});

//! --- MODELO DE DATOS USER

const User = mongoose.model("User", UserSchema);

//! --- EXPORTACION

module.exports = User;