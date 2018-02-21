'use strict';

const Raven = require('raven');
const { body, validationResult } = require('express-validator/check');
const rp = require('request-promise-native');
const config = require('config');
const xss = require('xss');

const { errorTranslator } = require('../../modules/validators');
const { customEvent } = require('../../modules/analytics');
const { getSecret } = require('../../modules/secrets');
const cached = require('../../middleware/cached');

function init({ router, routeConfig, sectionPath }) {
    const ebulletinPath = sectionPath + routeConfig.path;

    const translateError = errorTranslator('toplevel.ebulletin.errors');

    router
        .route(routeConfig.path)
        .get(cached.noCache, (req, res) => {
            res.render(routeConfig.template, {
                redirectTo: ebulletinPath
            });
        })
        .post(
            cached.noCache,
            [
                body('firstName')
                    .exists()
                    .not()
                    .isEmpty()
                    .withMessage(translateError('firstName')),
                body('lastName')
                    .exists()
                    .not()
                    .isEmpty()
                    .withMessage(translateError('lastName')),
                body('email')
                    .exists()
                    .not()
                    .isEmpty()
                    .withMessage(translateError('emailMissing'))
                    .isEmail()
                    .withMessage(translateError('emailInvalid')),
                body('location')
                    .exists()
                    .not()
                    .isEmpty()
                    .withMessage(translateError('location'))
            ],
            (req, res) => {
                const errors = validationResult(req);

                // sanitise input
                for (let key in req.body) {
                    req.body[key] = xss(req.body[key]);
                }

                if (!errors.isEmpty()) {
                    req.flash('formErrors', errors.array());
                    req.flash('formValues', req.body);
                    req.session.save(() => {
                        return res.redirect(ebulletinPath);
                    });
                } else {
                    let newsletterLocation = req.body.location;

                    // redirect errors back to the homepage
                    let handleSignupError = errMsg => {
                        Raven.captureMessage(errMsg || 'Error with ebulletin');
                        req.flash('ebulletinStatus', 'error');
                        req.session.save(() => {
                            return res.redirect(ebulletinPath);
                        });
                    };

                    let handleSignupSuccess = () => {
                        customEvent('emailNewsletter', 'signup', newsletterLocation);
                        req.flash('ebulletinStatus', 'success');
                        req.session.save(() => {
                            return res.redirect(ebulletinPath);
                        });
                    };

                    let dataToSend = {
                        email: req.body.email,
                        emailType: 'Html',
                        dataFields: [
                            {
                                key: 'FIRSTNAME',
                                value: req.body.firstName
                            },
                            {
                                key: 'LASTNAME',
                                value: req.body.lastName
                            },
                            {
                                key: newsletterLocation,
                                value: 'yes'
                            }
                        ]
                    };

                    // optional fields
                    if (req.body['organisation']) {
                        dataToSend.dataFields.push({
                            key: 'ORGANISATION',
                            value: req.body.organisation
                        });
                    }

                    let addressBookId = 589755;
                    let apiAddContactPath = `/address-books/${addressBookId}/contacts`;

                    // send the valid form to the signup endpoint (external)
                    rp({
                        uri: config.get('ebulletinApiEndpoint') + apiAddContactPath,
                        method: 'POST',
                        auth: {
                            user: getSecret('dotmailer.api.user'),
                            pass: getSecret('dotmailer.api.password'),
                            sendImmediately: true
                        },
                        json: true,
                        body: dataToSend,
                        resolveWithFullResponse: true
                    })
                        .then(response => {
                            // signup succeeded
                            if (response.statusCode === 200) {
                                return handleSignupSuccess();
                            } else {
                                return handleSignupError(response.message);
                            }
                        })
                        .catch(error => {
                            return handleSignupError(error.message || error);
                        });
                }
            }
        );
}

module.exports = {
    init
};
