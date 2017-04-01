var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var csurf = require('csurf');
var express = require('express');
var extend = require('xtend');
var forms = require('forms');
var jwt_decode = require('jwt-decode');

var request = require("request");

var profileForm = forms.create({
    givenName: forms.fields.string({required: true}),
    surname: forms.fields.string({required: true}),
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

function patchUserMetadata(data, userToken, userId) {
    return new Promise(function (res, rej) {
        
        if (!userToken || !userId) {
            const err = new Error("Token or user ID not setted");
            rej(err);
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
                return rej(error);
            } else if (response.statusCode !== 200) {
                console.log("wynik respons status = ", response.statusCode);
                const err = new Error("Error: " + response.statusCode + " " + response.statusMessage);
                rej(err);
            } else 
                return res();
        }

        request(options, callback);
    })
}

module.exports = function profile() {
    var router = express.Router();

    router.use(cookieParser());
    router.use(bodyParser.urlencoded({extended: true}));
    router.use(csurf({cookie: true}));

    router.all('/', function (req, res) {

        const userToken = req.app.get('userToken');
        const userId = req.app.get('userId');

        profileForm.handle(req, {
            success: function (form) {
                var data = {
                    givenName: form.data.givenName,
                    surname: form.data.surname,
                    streetAddress: form.data.streetAddress,
                    city: form.data.city,
                    state: form.data.state,
                    zip: form.data.zip
                };

                req.user._json.user_metadata = data;

                patchUserMetadata(data, userToken, userId).then(() => {
                    renderForm(req, res, {saved: true});
                }).catch((err) => {
                    if (err.developerMessage) {
                        console.error(err);
                    }
                    renderForm(req, res, {
                        errors: [
                            {
                                error: err.userMessage || err.message || String(err)
                            }
                        ]
                    });
                })
            },
            empty: function () {
                renderForm(req, res);
            }
        });
    });
    return router;
}