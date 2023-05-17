const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    first_name: {
        type: String,
        default: null
    },
    last_name: {
        type: String,
        default: null
    },
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    token: {
        type: String
    }
});


module.exports = mongoose.model("user", userSchema)
