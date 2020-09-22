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
const newsletterService = require('./lib/newsletter-service');

const { injectHeroImage } = require('../../common/inject-content');
const { noStore, csrfProtection } = require('../../common/cached');
const { sanitiseRequestBody } = require('../../common/sanitise');
const validateSchema = require('../../common/validate-schema');
const logger = require('../../common/logger').child({ service: 'newsletter' });

const router = express.Router();

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/newsletter'), {
        title: req.i18n.__('toplevel.newsletter.title'),
        contactType: req.params.contactType,
        csrfToken: req.csrfToken(),
        validLocations: buildValidLocations(req.i18n),
        validSectors: buildValidSectors(req.i18n),
        formValues: data,
        errors: errors,
    });
}

router
    // add a ? back if you want to turn on the grantholder newsletter
    .route('/:contactType(insights)')
    .all(
        noStore,
        csrfProtection,
        injectHeroImage('the-bike-project-2-new-letterbox')
    )
    .get(renderForm)
    .post(async function handleNewsletterSignup(req, res) {
        const sanitisedBody = sanitiseRequestBody(omit(req.body, ['_csrf']));

        let contactToUse = newContact(req.i18n);
        let addressBookId = 249381;

        if (req.params.contactType === 'insights') {
            contactToUse = newStakeholder(req.i18n);
            addressBookId = 249380;
        }

        const validationResult = validateSchema(contactToUse, sanitisedBody);

        if (validationResult.isValid) {
            try {
                await newsletterService.subscribe({
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
        title: req.i18n.__('toplevel.newsletter.title'),
    });
});

module.exports = router;
