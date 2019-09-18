'use strict';
const { get } = require('lodash/fp');

const { MIN_START_DATE } = require('./constants');
const { getEmailFor, getPhoneFor } = require('./lib/contacts');

module.exports = function({ locale, data = {}, fileUploadError = null }) {
    const localise = get(locale);
    const country = get('projectCountry')(data);

    function getFileUploadErrorMessage() {
        let msg = '';
        if (fileUploadError) {
            msg = `<h2>Your bank statement hasn't been sent to us</h2>
            <p>The bank statement you uploaded might have a virus or security risk. But we've received the rest of your application, so don't worry. 
            You can call <strong>${getPhoneFor(
                country
            )}</strong> or email <a href="mailto:${getEmailFor(
                country
            )}">${getEmailFor(country)}</a> to send 
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
    In the meantime, if you have any questions, please call <strong>${getPhoneFor(
        country
    )}</strong> or email <a href="mailto:${getEmailFor(country)}">${getEmailFor(
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

    function cyConfirmationBody() {
        const fileErrorMessage = getFileUploadErrorMessage();

        return `<p>Diolch am anfon eich cais i Arian i Bawb y Loteri Genedlaethol.</p>
${fileErrorMessage}
<h2>Beth nesaf?</h2>
<p>
    Byddwn nawr yn adolygu eich cais ac efallai byddwn mewn cysylltiad i 
    ddarganfod mwy am eich prosiect. Bydd yn cymryd oddeutu
    <strong>${localise(MIN_START_DATE.label)}</strong>
    i ni wneud penderfyniad a byddwn yn gadael i chi wybod 
    p’un a ydych wedi bod yn llwyddiannus ai beidio drwy e-bost.
</p>
<p>
    Yn y cyfamser, os oes gennych unrhyw gwestiynau, ffoniwch <strong>${getPhoneFor(
        country
    )}</strong> neu gyrrwch e-bost i <a href="mailto:${getEmailFor(country)}">${getEmailFor(
            country
        )}</a> a byddwn yn hapus i’ch helpu.
</p>
<p>
    Rydym wedi e-bostio copi o’ch ffurflen gais ichi. 
    Cadwch hwn ar gyfer eich cofnodion rhag ofn bydd angen ichi gyfeirio ato.
</p>
<p>
    Pob lwc gyda’ch cais,<br />
    <strong>Tîm Arian i Bawb y Loteri Genedlaethol</strong>
</p>`;
    }

    return {
        title: localise({
            en: `Your application has been submitted. Good luck!`,
            cy: `Mae eich cais wedi’i gyflwyno. Pob lwc!`
        }),
        body: localise({
            en: enConfirmationBody(),
            cy: cyConfirmationBody()
        })
    };
};
