var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var csurf = require('csurf');
var express = require('express');
var extend = require('xtend');
var forms = require('forms');
var jwt_decode = require('jwt-decode');
var User = require('../models');

var request = require("request");

var profileForm = forms.create({
    givenName: forms.fields.string({
        required: true
    }),
    surname: forms.fields.string({
        required: true
    }),
    streetAddress: forms.fields.string(),
    city: forms.fields.string(),
    state: forms.fields.string(),
    zip: forms.fields.string()
});

function renderForm(req, res, locals) {
    let userMetadata = req.user._json.user_metadata
    if (!userMetadata)
        userMetadata = {};

    res.render('profile', extend({
        title: 'My Profile',
        csrfToken: req.csrfToken(),
        givenName: userMetadata.givenName,
        surname: userMetadata.surname,
        streetAddress: userMetadata.streetAddress,
        city: userMetadata.city,
        state: userMetadata.state,
        zip: userMetadata.zip
    }, locals || {}));
}

function callRenderFormWithError(req, res, error) {
    renderForm(req, res, {
        errors: [{
            error: error.userMessage || error.message || String(error)
        }]
    });
}

function patchUserData(data, userToken, userId) {
    return new Promise(function (resolve, reject) {
        if (!userToken || !userId) {
            const err = new Error("Token or user ID not setted");
            reject(err);
        }

        const options = {
            url: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/users/" + userId,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + userToken
            },
            method: 'PATCH',
            body: {
                user_metadata: data
            },
            json: true
        }

        const callback = function (error, response, body) {
            if (error) {
                return reject(error);
            } else if (response.statusCode !== 200) {
                const err = new Error("Error: " + response.statusCode + " " + response.statusMessage);
                reject(err);
            } else
                return resolve();
        }

        saveUserMetadataDB(data, userId)
        .then(() => {request(options, callback);})
        .catch((err) => reject(err));   
    })
}

function saveUserMetadataDB(data, userId) {
    return new Promise(function (resolve, reject) {
        var user = new User();
        
        user.userID = userId;
        user.givenName = data.givenName;
        user.surname = data.surname;
        user.streetAddress = data.streetAddress;
        user.city = data.city;
        user.state = data.state;
        user.zip = data.zip;

        User.findOne({
            userID: userId
        }, (err, usr) => {
            if (err) {
                reject(err);
            };
            if (usr) {
                usr.update(data, (err) => {
                    if (err) reject(err)
                    else resolve();
                })
            } else {
                user.save((err) => {
                    if (err) reject(err)
                    else resolve();
                })
            }
        });
    });
}

module.exports = function profile() {
    var router = express.Router();

    router.use(cookieParser());
    router.use(bodyParser.urlencoded({
        extended: true
    }));
    router.use(csurf({
        cookie: true
    }));

    router.all('/', function (req, res) {

        const userToken = req.app.get('userToken');
        const userId = req.app.get('userId');

        profileForm.handle(req, {
            success: function (form) {
                var data = form.data;

                req.user._json.user_metadata = data;

                patchUserData(data, userToken, userId)
                    .then(() => {
                        renderForm(req, res, { saved: true });
                    })
                    .catch((err) => {
                        callRenderFormWithError(req, res, err);
                    })
            },
            empty: function () {
                renderForm(req, res);
            }
        });
    });
    return router;
}