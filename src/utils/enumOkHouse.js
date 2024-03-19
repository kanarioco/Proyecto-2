
const enumOkHouse = (Extras) => {
    const enumExtras = ["Garaje", "Terraza", "Piscina"];
    if (enumExtras.includes(Extras)) {
        return { 
            check: true, 
            Extras
        }
    } else {
        return { 
            check: false
        }
    }
}

module.exports = enumOkHouse;