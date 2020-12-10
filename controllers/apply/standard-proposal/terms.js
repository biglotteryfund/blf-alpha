'use strict';
const get = require('lodash/fp/get');

function defaultTerms(locale) {
    const localise = get(locale);

    return localise({
        en: [
            `<p>Make sure you read and understand this whole section before ticking the boxes at the bottom.</p>
             <h2>Data protection</h2>
             <p>The National Lottery Community Fund is a public body with a duty to distribute National Lottery 
             and other money in grants for good causes. We use the personal data you provide, such as contact 
             details for individuals at your organisation, to help you apply for a grant and to assess your 
             funding proposal. We may also carry out checks on the individuals as described below. If a grant 
             is awarded, we will use the personal data to manage and monitor the grant, carry out evaluations 
             and research, and to check the money is being used appropriately.</p>
             <p>We may share your personal data with organisations which help us with our grant making 
             activities or others which have a legitimate interest in our work or have funded your grant. 
             We will only share personal data which they need to carry out their work and subject to 
             appropriate safety measures.</p>
             <p>We may keep in contact with you throughout the life of your grant and send your advice about 
             your grant by email. This will contain useful information on a range of things including how to 
             publicise your grant, information on other funding available and project ideas and tips from 
             other grant holders.</p>
             <p>Our data protection and privacy notice gives more information about how we store and use 
             personal data and the lawful basis for this. Please read the full notice which is published 
             on our website at tnlcommunityfund.org.uk/data-protection or contact us to request a hard copy. 
             The notice may be updated from time to time.</p>
             <h2>Freedom of information</h2>
             <p>The Freedom of Information Act 2000 gives members of the public the right to request any 
             information that we hold. This includes information received from third parties, such as, 
             although not limited to grant applicants, grant holders and contractors. Please read our full 
             policy published on our website 
             <a href="https://www.tnlcommunityfund.org.uk/about/customer-service/freedom-of-information">
                tnlcommunityfund.org.uk/freedom-of-information</a>. This policy may be updated from time 
             to time.</p>
             <p>If you think that there is information in your funding proposal that may be exempt from 
             release if requested, then you should let us know when you apply. We will not usually release 
             information about your project whilst it is being assessed. Otherwise we will use our judgement 
             as to whether any exemptions may apply, which we may seek your opinion on.</p>
             <p>Personal information would be withheld subject to the requirements of data protection laws.</p>
             <h2>Our approach to fraud</h2>
             <p>We know the vast majority of the many thousands who seek and use our funding are genuine. 
             However, we sometimes receive fraudulent funding proposals and so we have a duty to carry out 
             checks on individuals at organisations which apply for grants.</p>
             <p>The personal information we have collected from you will therefore be shared with fraud prevention 
             agencies who will use it to prevent fraud and money-laundering and to verify your identity. If fraud 
             is detected, you could be refused certain services, finance or employment.</p>
             <p>Further details of how your information will be used by us and these fraud prevention agencies, 
             your data protection rights and how to contact us, can be found in our full data protection and 
             privacy notice which is published on our website 
             <a href="https://www.tnlcommunityfund.org.uk/about/customer-service/data-protection">
                tnlcommunityfund.org.uk/data-protection</a>. Contact us to request a hard copy.
             </p>
             <h2>Working with children, young people and vulnerable adults</h2>
             <p>If you’ll be working with children, young people or vulnerable adults, 
             you need to be sure they’ll be safe.</p>
             <ul>We would expect you to:
                <li>prioritise the safety and wellbeing of all children and adults at Risk who 
                come into contact with your organisation (including contact with your centres, 
                projects, staff and/ or volunteers).</li>
                <li>ensure Children and Adults at Risk are given a voice by creating an environment 
                and providing opportunities for Children and Adults at Risk to tell you what you 
                are doing well, what risks there are to them and how you can help keep them 
                and others safe.</li>
                <li>clearly outline to all the people in your organisation (permanent and fixed-term 
                employees, non-executive committee members, agency staff, interns, volunteers, 
                contractors and consultants) your mandatory policies and processes and a code 
                of conduct that keep Children and Adults at Risk safe.</li>
                <li>have a tailored, up-to-date procedure for reporting concerns and disclosures 
                that everyone knows about and feels confident in applying (including not just the 
                people in your organisation but also the carers or guardians of the Children and 
                Adults at Risk.</li>
                <li>who come into contact with your organisation and, where appropriate, the 
                Children and Adults at Risk themselves).</li>
            </ul>
             <p><strong>If your funded project involves working in regulated activity with Children and 
             Adults at Risk, you will also consider:</strong></p>
             <ul>
                <li>having one or more nominated member of staff (a Designated Safeguarding Lead) 
                who has the knowledge and skills to promote safe environments for Children and Adults 
                at Risk and is able to respond to concerns and disclosures.</li>
                <li>ensuring everyone understands their safeguarding roles and responsibilities and 
                is provided with appropriate learning opportunities to recognise, identify and respond 
                to concerns and disclosures relating to the protection of Children and Adults at Risk.</li>
                <li>using safe and transparent recruitment processes including (1) an appropriately detailed 
                DBS/PVG check for staff who come into contact with Children and Adults at Risk (2) obtaining 
                references that confirm that the referees are not aware of any reason why the applicant 
                should not work with Children and Adults at Risk (3) up-to-date, proportionate safeguarding 
                training for people in your organisation.</li>
                <li>conducting safeguarding risk assessments and provide guidance for your organisation, 
                locations, projects and processes to enable a safe, inclusive environment for all 
                Children and Adults at Risk we support. This could include guidance on taking Children 
                and Adults at Risk away on trips, consents required, the ratio of adults to Children and 
                Adults at Risk, transport safety and emergency procedures and guidance on Children and 
                Adults at Risk who require medication and consideration of the Prevent Duty.</li>
            </ul>
             <p>We recommend that you visit the NCVO website 
             <a href="https://knowhow.ncvo.org.uk/safeguarding">
                 knowhow.ncvo.org.uk/safeguarding</a> which provides a range of child safeguarding advice 
                 and information services for the whole of the UK.</p>
             <p>Should you be successful in your application, we would expect you to adhere to our expectations 
             as set out in the Grantholder policy around 
             <a href="https://www.tnlcommunityfund.org.uk/media/Safeguarding-and-protecting-the-children-and-adults-at-risk-we-support.pdf">
                 Safeguarding Children and Adults at risk</a>.`,
        ],
        cy: [],
    });
}

module.exports = function (locale) {
    return defaultTerms(locale);
};
