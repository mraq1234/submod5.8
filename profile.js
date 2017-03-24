var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var csurf = require('csurf');
var express = require('express');
var extend = require('xtend');
var forms = require('forms');

var request = require("request");



var profileForm = forms.create({
    givenName: forms.fields.string({ required: true }),
    surname: forms.fields.string({ required: true }),
    streetAddress: forms.fields.string(),
    city: forms.fields.string(),
    state: forms.fields.string(),
    zip: forms.fields.string()
});

function renderForm(req, res, locals) {
    if (!req.user.user_metadata) req.user.user_metadata = {};
    res.render('profile', extend({
        title: 'My Profile',
        csrfToken: req.csrfToken(),
        givenName: req.user.givenName,
        surname: req.user.surname,
        streetAddress: req.user.user_metadata.streetAddress,
        city: req.user.user_metadata.city,
        state: req.user.user_metadata.state,
        zip: req.user.user_metadata.zip
    }, locals || {}));
}

module.exports = function profile() {
    var router = express.Router();

    router.use(cookieParser());
    router.use(bodyParser.urlencoded({ extended: true }));
    router.use(csurf({ cookie: true }));


    var options = {
        method: 'POST',
        url: 'https://mraq.eu.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: {
            grant_type: 'client_credentials',
            client_id: 'jsoPVhmild3DYcOFV7VqjBUTTJpZVEAd',
            client_secret: 'Pyy2OSVyUaCPVWRXOkLKqHnGLHZDuexUkmsWOl1Wd-spuRBom9t-TVwvb-trSdtV',
            audience: 'https://mraq.eu.auth0.com/api/v2/'
        },
        json: true
    };

    request(options, function(error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
    });

    router.all('/', function(req, res) {
        profileForm.handle(req, {
            success: function(form) {
                console.log('user = ', req.user);
                req.user.givenName = form.data.givenName;
                req.user.surname = form.data.surname;
                req.user.user_metadata.streetAddress = form.data.streetAddress;
                req.user.user_metadata.city = form.data.city;
                req.user.user_metadata.state = form.data.state;
                req.user.user_metadata.zip = form.data.zip;
                console.log('req.user', req.user);
                saved: true;
                // req.user.save();
                // auth0.users.updateUserMetadata(req.user.id, req.user.user_metadata)
                //     .then(() => {
                //         renderForm(req, res, {
                //             saved: true
                //         })
                //     })
                //     .catch(err => {

                //         if (err.developerMessage) {
                //             console.error(err);
                //         }
                //         renderForm(req, res, {
                //             errors: [{
                //                 error: err.userMessage ||
                //                     err.message || String(err)
                //             }]
                //         });

                //         //     function(err) {
                //         //     if (err) {
                //         //         if (err.developerMessage) {
                //         //             console.error(err);
                //         //         }
                //         //         renderForm(req, res, {
                //         //             errors: [{
                //         //                 error: err.userMessage ||
                //         //                     err.message || String(err)
                //         //             }]
                //         //         });
                //         //     } else {
                //         //         renderForm(req, res, {
                //         //             saved: true
                //         //         });
                //         //     }
                //         // });
                //     });
            },
            empty: function() {
                renderForm(req, res);
            }
        });
    });
    return router;
};