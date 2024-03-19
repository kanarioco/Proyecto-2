const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CharacterSchema = new Schema(
    {
        name: { type: String, required: false, unique: false, },
        gender: {
            type: String,
            enum: ["hombre", "mujer", "otros"],
            required: false,
          },
        image: { type: String, required: false, },
        movies: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie"
        }]  
    },
    {
        timestamps: true,
    }
)

const Character = mongoose.model("Character", CharacterSchema);

module.exports = Character;