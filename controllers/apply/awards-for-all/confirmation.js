'use strict';
const { get } = require('lodash/fp');

const { MIN_START_DATE } = require('./constants');

module.exports = function({ locale, data = {}, fileUploadError = null }) {
    const localise = get(locale);
    const country = get('projectCountry')(data);

    function emailFor(country) {
        const options = {
            'default': 'general.enquiries@tnlcommunityfund.org.uk',
            'england': 'afe@tnlcommunityfund.org.uk',
            'scotland': 'advicescotland@tnlcommunityfund.org.uk',
            'northern-ireland': 'enquiries.ni@tnlcommunityfund.org.uk',
            'wales': 'wales@tnlcommunityfund.org.uk'
        };

        return options[country] || options.default;
    }

    function phoneFor(country) {
        const options = {
            'default': '0345 4 10 20 30',
            'england': '0345 4 10 20 30',
            'scotland': '0300 123 7110',
            'northern-ireland': '028 9055 1455',
            'wales': '0300 123 0735'
        };

        return options[country] || options.default;
    }

    function getFileUploadErrorMessage() {
        let msg = '';
        if (fileUploadError) {
            msg = `<h2>Your bank statement hasn't been sent to us</h2>
            <p>The bank statement you uploaded might have a virus or security risk. But we've received the rest of your application, so don't worry. 
            You can call <strong>${phoneFor(
                country
            )}</strong> or email <a href="mailto:${emailFor(
                country
            )}">${emailFor(country)}</a> to send 
            the bank statement to us - if not, we can contact you for it later.</p>`;
        }
        return msg;
    }

    function enConfirmationBody() {
        const fileErrorMessage = getFileUploadErrorMessage();

        return `<p>Thank you for submitting your application to National Lottery Awards for All.</p>
${fileErrorMessage}
<h2>What happens next?</h2>
<p>
    We will now review your application and may contact you
    to find out more about your project. It will take around
    <strong>${localise(MIN_START_DATE.label)}</strong>
    for us to make a decision and we will
    let you know whether you have been successful by email.
</p>
<p>
    In the meantime, if you have any questions, please call <strong>${phoneFor(
        country
    )}</strong> or email <a href="mailto:${emailFor(country)}">${emailFor(
            country
        )}</a> and we will be happy to help you.
</p>
<p>
    We have emailed you a copy of your application form.
    Please keep this for your records as you may need to refer to it.
</p>
<p>
    Good luck with your application,<br />
    <strong>The National Lottery Awards for All Team</strong>
</p>`;
    }

    return {
        title: localise({
            en: `Your application has been submitted. Good luck!`,
            cy: `Mae eich cais wedi’i gyflwyno. Pob lwc!`
        }),
        body: localise({
            en: enConfirmationBody(),
            cy: ``
        })
    };
};
