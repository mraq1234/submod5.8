var mongoose = require('mongoose');

var shipmentSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true
    },
    givenName: {
        type: String
    },
    surname: {
        type: String
    },

    streetAddress: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    zip: {
        type: String
    }
});

module.exports = mongoose.model('shipmentSchema', shipmentSchema);