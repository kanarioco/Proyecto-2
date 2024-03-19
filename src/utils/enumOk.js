
const enumOk = (gender) => {
    const enumGender = ["hombre", "mujer", "otros"];
    if (enumGender.includes(gender)) {
        return { 
            check: true, 
            gender
        }
    } else {
        return { 
            check: false
        }
    }
}

module.exports = enumOk;