const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    subject: String,
    level: String,
    name: String,
    image: String
});

module.exports = mongoose.model('Badge', badgeSchema);