'use strict';
const { get } = require('lodash/fp');

const { MIN_START_DATE } = require('./constants');

module.exports = function({ locale, data = {} }) {
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

    function enConfirmationBody() {
        return `<p>Thank you for submitting your application to National Lottery Awards for All.</p>
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

    function cyConfirmationBody() {
        return `<p>Diolch am anfon eich cais i Arian i Bawb y Loteri Genedlaethol.</p>
<h2>Beth nesaf?</h2>
<p>
    Byddwn nawr yn adolygu eich cais ac efallai byddwn mewn cysylltiad i 
    ddarganfod mwy am eich prosiect. Bydd yn cymryd oddeutu
    <strong>${localise(MIN_START_DATE.label)}</strong>
    i ni wneud penderfyniad a byddwn yn gadael i chi wybod 
    p’un a ydych wedi bod yn llwyddiannus ai beidio drwy e-bost.
</p>
<p>
    Yn y cyfamser, os oes gennych unrhyw gwestiynau, ffoniwch <strong>${phoneFor(
        country
    )}</strong> neu gyrrwch e-bost i <a href="mailto:${emailFor(
            country
        )}">${emailFor(country)}</a> a byddwn yn hapus i’ch helpu.
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
