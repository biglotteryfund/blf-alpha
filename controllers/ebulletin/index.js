'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');
const omit = require('lodash/omit');

const {
    newContact,
    newStakeholder,
    buildValidLocations,
    buildValidSectors,
} = require('./lib/contact-schema');
const ebulletinService = require('./lib/ebulletin-service');

const { noStore, csrfProtection } = require('../../common/cached');
const { sanitiseRequestBody } = require('../../common/sanitise');
const validateSchema = require('../../common/validate-schema');
const logger = require('../../common/logger').child({ service: 'ebulletin' });

const router = express.Router();

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/ebulletin'), {
        title: req.i18n.__('toplevel.ebulletin.title'),
        contactType: req.params.contactType,
        csrfToken: req.csrfToken(),
        validLocations: buildValidLocations(req.i18n),
        validSectors: buildValidSectors(req.i18n),
        formValues: data,
        errors: errors,
    });
}

router
    .route('/:contactType(policy)?')
    .all(noStore, csrfProtection, (req, res, next) => {
        // Temporarily disable non-policy signup form which will launch later
        if (!req.params.contactType || req.params.contactType !== 'policy') {
            res.redirect('/');
        } else {
            next();
        }
    })
    .get(renderForm)
    .post(async function handleEbulletinSignup(req, res) {
        const sanitisedBody = sanitiseRequestBody(omit(req.body, ['_csrf']));

        let contactToUse = newContact(req.i18n);
        let addressBookId = 148374;

        if (req.params.contactType === 'policy') {
            contactToUse = newStakeholder(req.i18n);
            addressBookId = 249380;
        }

        const validationResult = validateSchema(contactToUse, sanitisedBody);

        if (validationResult.isValid) {
            try {
                await ebulletinService.subscribe({
                    addressBookId: addressBookId,
                    subscriptionData: validationResult.value,
                    contactType: req.params.contactType,
                });
                return res.redirect(`${req.baseUrl}/success`);
            } catch (error) {
                res.locals.status = 'ERROR';
                logger.warn('Subscription failed: ', error);
                Sentry.captureException(error);
                renderForm(req, res);
            }
        } else {
            renderForm(
                req,
                res,
                validationResult.value,
                validationResult.messages
            );
        }
    });

router.get('/success', function (req, res) {
    res.render(path.resolve(__dirname, './views/success'), {
        title: req.i18n.__('toplevel.ebulletin.title'),
    });
});

module.exports = router;
