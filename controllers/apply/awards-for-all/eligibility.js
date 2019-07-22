'use strict';
const { get } = require('lodash/fp');
const {
    MIN_BUDGET_TOTAL_GBP,
    MIN_START_DATE,
    MAX_BUDGET_TOTAL_GBP,
    MAX_PROJECT_DURATION,
    ORG_MIN_AGE
} = require('./constants');

module.exports = function({ locale }) {
    const localise = get(locale);

    const minStartDateLabel = localise(MIN_START_DATE.label);
    const maxProjectDurationLabel = localise(MAX_PROJECT_DURATION.label);
    const orgMinAgeLabel = localise(ORG_MIN_AGE.label);

    const question1 = {
        question: localise({
            en: `Does your organisation have at least two unconnected people on the board or committee?`,
            cy: ``
        }),
        explanation: localise({
            en: `By unconnected, we mean not a relation by blood, marriage, in a long-term relationship or people living together at the same address.`,
            cy: ``
        }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your organisation does not have at least two unconnected people on the board or committee`,
                cy: ``
            }),
            detail: localise({
                en: `<p>We want to fund great ideas that help communities to thrive, but we are also responsible for making sure our funding is in safe hands.</p>

                <p>Before applying, make sure there are two people on your organisation's board or committee who aren't married or in a long-term relationship with each other, living together at the same address, or related by blood.</p>`,
                cy: ``
            })
        }
    };

    const question2 = {
        question: localise({
            en: `Are you applying for an amount between £${MIN_BUDGET_TOTAL_GBP.toLocaleString()} and £${MAX_BUDGET_TOTAL_GBP.toLocaleString()} for a project that will be finished within about ${maxProjectDurationLabel}?`,
            cy: ``
        }),
        explanation: localise({
            en: `We know it's not always possible to complete a project in ${maxProjectDurationLabel} for lots of reasons. So we can consider projects which are slightly longer than this. We will also consider applications for one-off events such as a festival, gala day or conference.`,
            cy: ``
        }),
        ineligible: {
            reason: localise({
                en: `This is because you can only apply for funding between £${MIN_BUDGET_TOTAL_GBP.toLocaleString()} and £${MAX_BUDGET_TOTAL_GBP.toLocaleString()} for a project that will be finished in about ${maxProjectDurationLabel} through National Lottery Awards for All, and it sounds like you need a different amount of funding from us.`,
                cy: ``
            }),
            detail: localise({
                en: `<p>This isn't the end. Here are a couple of ideas about what you can do:</p>
                <ul>
                    <li>Consider asking us to fund part of your project through National Lottery Awards for All, and find out if there are other sources of funding that can cover the rest of your project</li>
                    <li><a href="/funding/over10k">Look at our other funding programmes</a> to see if they cover the amount of funding you want to apply for and the length of time you want to run your project for, and consider applying to us for a grant worth over £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}.</li>
                </ul>`,
                cy: ``
            })
        }
    };

    const question3 = {
        question: localise({
            en: `Does your project start at least ${minStartDateLabel} from when you plan to submit your application?`,
            cy: ``
        }),
        explanation: localise({
            en: `We need ${minStartDateLabel} to be able to assess your application and pay your grant, if you're successful. So projects need to start at least ${minStartDateLabel} from the date you submit your application to us.`,
            cy: ``
        }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your project doesn't start at least ${minStartDateLabel} from when you plan to submit your application.`,
                cy: ``
            }),
            detail: localise({
                en: `<p>We don't want communities to miss out on a great idea that will help them thrive.</p>
                <p>Have a think and see if it's possible to start your project at least ${minStartDateLabel} from now. We need this time to consider your application, carry out checks and, if successful, pay your grant. If it is possible, continue with your application.</p>`,
                cy: ``
            })
        }
    };

    const question4 = {
        question: localise({
            en: `Do you have a UK bank account or building society account? It needs to be in the legal name of your organisation, with at least two unrelated people who are able to manage the account.`,
            cy: ``
        }),
        explanation: localise({
            en: `This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation's name on your governing document.`,
            cy: ``
        }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your organisation doesn't have a UK bank account in the legal name of your organisation.`,
                cy: ``
            }),
            detail: localise({
                en: `<p>We don't want communities to miss out on a great idea that will help them to thrive.</p>
                <p>So you might want to double check whether you have a UK bank account in the legal name of your organisation. Or you might want to open an account like that before you apply.</p>`,
                cy: ``
            })
        }
    };

    const question5 = {
        question: localise({
            en: `Do you produce annual accounts (or did you set up your organisation less than ${orgMinAgeLabel} ago and haven't produced annual accounts yet)?`,
            cy: ``
        }),
        explanation: localise({
            en: `By annual accounts, we mean a summary of your financial activity. If you are a small organisation, this may be produced by your board and doesn't have to be done by an accountant.`,
            cy: ``
        }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your organisation was set up more than ${orgMinAgeLabel} ago and hasn't produced annual accounts yet.`,
                cy: ``
            }),
            detail: localise({
                en: `<p>This isn't the end. Before applying, make sure your organisation has produced annual accounts.</p>
                <p>By 'annual accounts' we mean a summary of your financial activity. If you're a small organisation, this can be produced by your board or committee, and doesn't have to be done by an accountant.</p>`,
                cy: ``
            })
        }
    };

    return {
        questions: [question1, question2, question3, question4, question5],
        successMessage: localise({
            en: `<p>We're excited to hear more about your project and invite you to fill in our application form.</p>

            <p>Your account will also allow you to part complete your application so that you can complete it within a time frame that is suitable to you.</p>`,
            cy: ``
        })
    };
};
