'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

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
            en: oneLine`Does your organisation have at least two unconnected people on the board or committee?`,
            cy: oneLine`Oes gan eich sefydliad o leiaf dau berson heb gysylltiad i’w gilydd ar y bwrdd neu bwyllgor?`
        }),
        explanation: localise({
            en: oneLine`By unconnected, we mean not a relation by blood, marriage,
                in a long-term relationship or people living together at the same address.`,
            cy: oneLine`Drwy gysylltiad i’w gilydd, rydym yn golygu ddim yn
                berthynas drwy waed, mewn perthynas hir dymor neu bobl
                sy’n byw â’u gilydd yn yr un cyfeiriad.`
        }),
        yesLabel: localise({ en: 'Yes', cy: 'Oes' }),
        noLabel: localise({ en: 'No', cy: 'Nac oes' }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your organisation does not have at least two unconnected people on the board or committee`,
                cy: `Mae hyn gan eich bod wedi dweud wrthym nad oes gan eich sefydliad o leiaf dau berson heb gysylltiad i’w gilydd ar y bwrdd neu bwyllgor`
            }),
            detail: localise({
                en: `<p>We want to fund great ideas that help communities to thrive, but we are also responsible for making sure our funding is in safe hands.</p>

                <p>Before applying, make sure there are two people on your organisation's board or committee who aren't married or in a long-term relationship with each other, living together at the same address, or related by blood.</p>`,
                cy: `<p>Rydym eisiau ariannu syniadau gwych a fydd yn helpu cymunedau i ffynnu, ond rydym hefyd yn gyfrifol am sicrhau bod ein harian mewn dwylo diogel.</p>
                
                <p>Cyn ymgeisio, sicrhewch bod dau berson ar fwrdd neu bwyllgor eich sefydliad sydd ddim yn gysylltiedig drwy briodas, perthynas hir dymor â’u gilydd, yn byw yn yr un cyfeiriad nag yn perthyn drwy waed.</p>`
            })
        }
    };

    const question2 = {
        question: localise({
            en: `Are you applying for an amount between £${MIN_BUDGET_TOTAL_GBP.toLocaleString()} and £${MAX_BUDGET_TOTAL_GBP.toLocaleString()} for a project that will be finished within about ${maxProjectDurationLabel}?`,
            cy: `A ydych yn ymgeisio am swm rhwng £${MIN_BUDGET_TOTAL_GBP.toLocaleString()} a £${MAX_BUDGET_TOTAL_GBP.toLocaleString()} am brosiect a fydd wedi gorffen o fewn oddeutu ${maxProjectDurationLabel}?`
        }),
        explanation: localise({
            en: `We know it's not always possible to complete a project in ${maxProjectDurationLabel} for lots of reasons. So we can consider projects which are slightly longer than this. We will also consider applications for one-off events such as a festival, gala day or conference.`,
            cy: `Rydym yn gwybod nad yw bob tro’n bosib i gwblhau prosiect mewn ${maxProjectDurationLabel} am nifer o resymau. Felly mi allwn ystyried prosiectau sydd ychydig yn hirach na hyn. Byddwn hefyd yn ystyried ceisiadau am ddigwyddiadau a fydd yn digwydd unwaith yn unig, megis gwyliau, diwrnod gala neu gynhadledd.`
        }),
        yesLabel: localise({ en: 'Yes', cy: 'Ydw' }),
        noLabel: localise({ en: 'No', cy: 'Nac ydw' }),
        ineligible: {
            reason: localise({
                en: `This is because you can only apply for funding between £${MIN_BUDGET_TOTAL_GBP.toLocaleString()} and £${MAX_BUDGET_TOTAL_GBP.toLocaleString()} for a project that will be finished in about ${maxProjectDurationLabel} through National Lottery Awards for All, and it sounds like you need a different amount of funding from us.`,
                cy: `Y rheswm dros hyn yw gallwch dim ond ymgeisio am arian rhwng £${MIN_BUDGET_TOTAL_GBP.toLocaleString()} a £${MAX_BUDGET_TOTAL_GBP.toLocaleString()} am brosiect a fydd wedi gorffen o fewn oddeutu ${maxProjectDurationLabel} drwy ein rhaglen Arian i Bawb y Loteri Genedlaethol, ac mae’n swnio fel eich bod angen math gwahanol o grant gennym.`
            }),
            detail: localise({
                en: `<p>This isn't the end. Here are a couple of ideas about what you can do:</p>
                <ul>
                    <li>Consider asking us to fund part of your project through National Lottery Awards for All, and find out if there are other sources of funding that can cover the rest of your project</li>
                    <li><a href="/funding/over10k">Look at our other funding programmes</a> to see if they cover the amount of funding you want to apply for and the length of time you want to run your project for, and consider applying to us for a grant worth over £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}.</li>
                </ul>`,
                cy: `<p>Nid dyma diwedd y daith. Dyma rhai syniadau am yr hyn gallwch ei wneud:</p>
                <ul>
                    <li>Ystyried gofyn i ni ariannu rhan o’ch prosiect drwy Arian i Bawb y Loteri Genedlaethol, a darganfod os oes ffynonellau eraill o arian gall ariannu gweddill eich prosiect</li>
                    <li><a href="/welsh/funding/over10k">Edrych ar ein rhaglenni ariannu eraill</a> i weld os ydynt yn talu’r swm o arian rydych eisiau ymgeisio amdano a hyd yr amser rydych eisiau rhedeg eich prosiect, ac ystyriwch ymgeisio inni am grant sydd werth mwy na £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}.</li>
                </ul>`
            })
        }
    };

    const question3 = {
        question: localise({
            en: `Does your project start at least ${minStartDateLabel} from when you plan to submit your application?`,
            cy: `A yw eich prosiect yn dechrau o leiaf ${minStartDateLabel} o bryd rydych yn bwriadu anfon eich cais?`
        }),
        explanation: localise({
            en: `We need ${minStartDateLabel} to be able to assess your application and pay your grant, if you're successful. So projects need to start at least ${minStartDateLabel} from the date you submit your application to us.`,
            cy: `Rydym angen ${minStartDateLabel} i allu asesu eich cais a thalu eich grant, os ydych yn llwyddiannus. Felly mae angen i brosiectau ddechrau o leiaf ${minStartDateLabel} o’r dyddiad rydych yn anfon eich cais.`
        }),
        yesLabel: localise({ en: 'Yes', cy: 'Ydi' }),
        noLabel: localise({ en: 'No', cy: 'Nac ydi' }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your project doesn't start at least ${minStartDateLabel} from when you plan to submit your application.`,
                cy: `Mae hyn oherwydd eich bod wedi dweud wrthym nad yw eich prosiect yn dechrau tan o leiaf ${minStartDateLabel} o bryd rydych yn bwriadu anfon eich cais.`
            }),
            detail: localise({
                en: `<p>We don't want communities to miss out on a great idea that will help them thrive.</p>
                <p>Have a think and see if it's possible to start your project at least ${minStartDateLabel} from now. We need this time to consider your application, carry out checks and, if successful, pay your grant. If it is possible, continue with your application.</p>`,
                cy: `<p>Nid ydym eisiau i gymunedau fethu allan ar syniad gwych a fydd yn eu helpu i ffynnu.</p>
                <p>Meddyliwch os yw’n bosib dechrau eich prosiect o leiaf ${minStartDateLabel} o rŵan. Rydym angen yr amser hyn i ystyried eich cais, cynnal gwiriadau ac os y byddwch yn llwyddiannus, talu eich grant.</p>`
            })
        }
    };

    const question4 = {
        question: localise({
            en: `Do you have a UK bank account or building society account? It needs to be in the legal name of your organisation, with at least two unrelated people who are able to manage the account.`,
            cy: `Oes gennych gyfrif banc neu gymdeithas adeiladu Prydeinig? Mae angen iddo fod yn enw cyfreithiol eich sefydliad, gydag o leiaf dau berson sydd ddim yn perthyn i reoli’r cyfrif.`
        }),
        explanation: localise({
            en: `This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation's name on your governing document.`,
            cy: `Dylai hwn fod yr enw cyfreithiol i’ch sefydliad fel mae’n ymddangos ar eich cyfriflen banc, nid enw eich banc. Bydd hwn fel arfer yr un peth ag enw eich sefydliad ar eich dogfen lywodraethol.`
        }),
        yesLabel: localise({ en: 'Yes', cy: 'Oes' }),
        noLabel: localise({ en: 'No', cy: 'Nac oes' }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your organisation doesn't have a UK bank account in the legal name of your organisation.`,
                cy: `Mae hyn oherwydd eich bod wedi dweud nad oes gan eich sefydliad gyfrif banc Prydeinig yn enw cyfreithiol eich sefydliad.`
            }),
            detail: localise({
                en: `<p>We don't want communities to miss out on a great idea that will help them to thrive.</p>
                <p>So you might want to double check whether you have a UK bank account in the legal name of your organisation. Or you might want to open an account like that before you apply.</p>`,
                cy: `<p>Nid ydym eisiau i gymunedau fethu allan ar syniad gwych a fydd yn helpu eu cymuned i ffynnu.</p>
                <p>Felly efallai bod werth ail wirio a oes gennych chi gyfrif banc Prydeinig yn enw cyfreithiol eich sefydliad. Neu efallai y hoffech agor cyfrif cyn ichi ymgeisio.</p>`
            })
        }
    };

    const question5 = {
        question: localise({
            en: oneLine`Do you produce annual accounts (or did you set up your organisation
                less than ${orgMinAgeLabel} ago and haven't produced annual accounts yet)?`,
            cy: oneLine`A ydych yn cynhyrchu cyfrifon blynyddol (neu a yw eich sefydliad
                yn iau na ${orgMinAgeLabel} oed a heb gynhyrchu cyfrifon blynyddol eto)?`
        }),
        explanation: localise({
            en: `By annual accounts, we mean a summary of your financial activity. If you are a small organisation, this may be produced by your board and doesn't have to be done by an accountant.`,
            cy: `Drwy gyfrifon blynyddol, rydym yn golygu crynodeb o’ch gweithgaredd ariannol. Os ydych yn sefydliad bach, gall hwn gael ei gynhyrchu gan eich bwrdd a nid oes rhaid iddo gael ei wneud gan gyfrifydd.`
        }),
        yesLabel: localise({ en: 'Yes', cy: 'Ydw' }),
        noLabel: localise({ en: 'No', cy: 'Nac ydw' }),
        ineligible: {
            reason: localise({
                en: `This is because you told us that your organisation was set up more than ${orgMinAgeLabel} ago and hasn't produced annual accounts yet.`,
                cy: `Mae hyn oherwydd eich bod wedi dweud wrthym bod eich sefydliad wedi ei sefydlu mwy na ${orgMinAgeLabel} yn ôl, a heb gynhyrchu cyfrifon blynyddol eto.`
            }),
            detail: localise({
                en: `<p>This isn't the end. Before applying, make sure your organisation has produced annual accounts.</p>
                <p>By 'annual accounts' we mean a summary of your financial activity. If you're a small organisation, this can be produced by your board or committee, and doesn't have to be done by an accountant.</p>`,
                cy: `<p>Nid dyma ddiwedd y daith. Cyn ymgeisio, sicrhewch bod eich sefydliad wedi cynhyrchu cyfrifon blynyddol.</p>
                <p>Drwy ‘gyfrifon  blynyddol’, rydym yn golygu crynodeb o’ch gweithgaredd ariannol. Os ydych yn sefydliad bach, gall hwn gael ei gynhyrchu gan eich bwrdd neu bwyllgor, ac nid oes rhaid iddo gael ei wneud gan gyfrifydd.</p>`
            })
        }
    };

    return {
        questions: [question1, question2, question3, question4, question5],
        successMessage: localise({
            en: `<p>
                We're excited to hear more about your project and
                invite you to fill in our application form.
            </p>
            <p>
                Your account will also allow you to part complete your
                application so that you can complete it within a
                time frame that is suitable to you.
            </p>`,

            cy: `<p>
                Rydym yn edrych ymlaen i glywed mwy am eich prosiect
                a’n eich gwahodd i lenwi ein ffurflen gais.
            </p>
            <p>
                Bydd eich cyfrif hefyd yn eich galluogi i
                gwblhau rhan o’ch cais er mwyn i chi ei gwblhau fesul dipyn.
            </p>`
        })
    };
};
