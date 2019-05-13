'use strict';
const { get } = require('lodash/fp');

module.exports = function({ locale, data = {} }) {
    const localise = get(locale);

    function contactDetailsFor(country) {
        let email;
        let phone;
        switch (country) {
            case 'england':
                phone = '0345 4 10 20 30';
                email = 'afe@tnlcommunityfund.org.uk';
                break;
            case 'scotland':
                phone = '0300 123 7110';
                email = 'advicescotland@tnlcommunityfund.org.uk';
                break;
            case 'northern-ireland':
                phone = '028 9055 1455';
                email = 'enquiries.ni@tnlcommunityfund.org.uk';
                break;
            case 'wales':
                phone = '0300 123 0735';
                email = 'wales@tnlcommunityfund.org.uk';
                break;
            default:
                email = 'general.enquiries@tnlcommunityfund.org.uk';
                phone = '0345 4 10 20 30';
                break;
        }

        return { email, phone };
    }

    function enConfirmationBody() {
        const country = get('project-country')(data);
        const { email, phone } = contactDetailsFor(country);

        return `<p>Thank you for submitting your application to National Lottery Awards for All.</p>
<h2>What happens next?</h2>
<p>We will now review your application and may contact you to find out more about your project. It will take around <strong>12 weeks</strong> for us to make a decision and we will let you know whether you have been successful by email.</p>
<p>In the meantime, if you have any questions, please call <strong>${phone}</strong> or email <a href="mailto:${email}">${email}</a> and we will be happy to help you.</p>
<p>We have emailed you a copy of your application form. Please keep this for your records as you may need to refer to it.</p>
<p>Good luck with your application,<br /><strong>The National Lottery Awards for All Team</strong></p>`;
    }

    return {
        title: localise({
            en: `Your application has been submitted. Good luck!`,
            cy: ``
        }),
        body: localise({
            en: enConfirmationBody(),
            cy: ``
        })
    };
};
