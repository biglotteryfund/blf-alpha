'use strict';
const { get } = require('lodash/fp');

const getLeadTimeWeeks = require('./lib/lead-time');
const { getContactFullName } = require('./lib/contacts');

function getEmailFor(country) {
    const countryEmail = {
        'default': 'general.enquiries@tnlcommunityfund.org.uk',
        'england': 'afe@tnlcommunityfund.org.uk',
        'scotland': 'advicescotland@tnlcommunityfund.org.uk',
        'northern-ireland': 'enquiries.ni@tnlcommunityfund.org.uk',
        'wales': 'wales@tnlcommunityfund.org.uk'
    }[country];

    return countryEmail || 'general.enquiries@tnlcommunityfund.org.uk';
}

function getPhoneFor(country) {
    const countryPhone = {
        'scotland': '0300 123 7110',
        'northern-ireland': '028 9055 1455',
        'wales': '0300 123 0735'
    }[country];

    return countryPhone || '0345 4 10 20 30';
}

module.exports = function({ locale, data = {} }) {
    const localise = get(locale);
    const country = get('projectCountry')(data);

    const [mainContact, seniorContact] = ['main', 'senior'].map(contactType => {
        return {
            fullName: getContactFullName(
                get(`${contactType}ContactName`)(data),
                false
            ),
            email: get(`${contactType}ContactEmail`)(data)
        };
    });

    function enConfirmationBody() {
        return `<h2>We’ve just sent an email to your main and senior contact</h2>
<p>This is just a confirmation email, with a summary of your answers (in case you want to look back at them at any point).</p>

<h2>Now we’ve got your application – we'll start assessing it as soon as we can</h2>
<p>We’ll look at your idea and do some checks. <strong>It’ll take us around ${getLeadTimeWeeks(
            country
        )} weeks to decide to fund your project or not</strong>.</p>

<h2>While we’re assessing your application – we might get in touch</h2>
<p>We don’t always do this. It’s only if we need a bit more information. So don’t worry if you don’t hear from us.</p>

<h2>We’ll let ${mainContact.fullName} and ${
            seniorContact.fullName
        } know our decision by email</h2>
<p>We’ll email <strong>${mainContact.email}</strong> and <strong>${
            seniorContact.email
        }</strong>. Make sure to check the junk mail too (just in case).</p>

<h2>If you have any questions, you can contact us in the meantime</h2>
<p>Please call ${getPhoneFor(country)} or email <a href="mailto:${getEmailFor(
            country
        )}">${getEmailFor(country)}</a> and we will be happy to help you.</p>

<p>
    Good luck with your application!<br />
    <strong>The National Lottery Awards for All team</strong>
</p>
        `;
    }

    function cyConfirmationBody() {
        return `<h2>Rydym newydd anfon e-bost i’ch prif ac uwch gyswllt </h2>
<p>Dim ond e-bost cadarnhad yw hwn, gyda chrynodeb o’ch atebion (rhag ofn eich bod eisiau edrych yn ôl arnyn nhw ar unrhyw bwynt).</p>

<h2>Nawr ein bod gyda’ch cais – byddwn yn dechrau ei asesu mor fuan ag y gallwn</h2>
<p>Byddwn yn edrych ar eich syniad a gwneud rhai gwiriadau. <strong>Bydd yn cymryd oddeutu ${getLeadTimeWeeks(
            country
        )} wythnos i ni benderfynu ariannu eich prosiect ai beidio</strong>.</p>

<h2>Tra rydym yn asesu eich cais – efallai byddwn mewn cysylltiad</h2>
<p>Nid ydym yn gwneud hyn o hyd. Dim ond os ydym angen ychydig mwy o wybodaeth. Felly peidiwch â phoeni os nad ydych yn clywed gennym.</p>

<h2>Byddwn yn rhoi gwybod o’n penderfyniad i ${mainContact.fullName} a ${
            seniorContact.fullName
        } dros e-bost</h2>
<p>Byddwn yn e-bostio <strong>${mainContact.email}</strong> a <strong>${
            seniorContact.email
        }</strong>. Sicrhewch eich bod yn gwirio eich post sothach hefyd (rhag ofn).</p>

<h2>Os oes gennych unrhyw gwestiynau, gallwch gysylltu â ni yn y cyfamser</h2>
<p>Ffoniwch ${getPhoneFor(country)} neu e-bostio <a href="mailto:${getEmailFor(
            country
        )}">${getEmailFor(country)}</a> a byddwn yn hapus i’ch helpu.</p>

<p>
    Pob lwc gyda’ch cais!<br />
    <strong>Tîm Arian i Bawb y Loteri Genedlaethol</strong>
</p>`;
    }

    return {
        title: localise({
            en: `Thanks - we’ve got your application now`,
            cy: `Diolch – mae gennym eich cais nawr`
        }),
        body: localise({
            en: enConfirmationBody(),
            cy: cyConfirmationBody()
        })
    };
};
