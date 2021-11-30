'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

function newTerms(locale, projectCountry) {
    const localise = get(locale);

    if (projectCountry === 'northern-ireland')
    {
        return localise({
            en: [
                {
                    title: oneLine`By submitting an application to The National Lottery Community Fund, 
                the organisation named in the application (referred to as “you” in these Terms and Conditions) 
                agrees, if awarded a grant, to:`,
                    clauses: [
                        oneLine`hold the grant on trust for The National Lottery Community Fund (referred to as 
                    ‘we’ or ‘us’) and use it only for your project as described in your application or 
                    otherwise agreed with us, and only for expenditure incurred after the date of your 
                    grant award;`,

                        oneLine`provide us promptly with any information and reports we require about the 
                    project and its impact, both during and after the end of the project;`,

                        oneLine`act lawfully in carrying out your project in accordance with best practice 
                    and guidance from your regulators, and follow any guidelines issued by us about the 
                    project or use of the grant and let us know promptly about any fraud, other 
                    impropriety, mismanagement or misuse in relation to the grant;`,

                        oneLine`acknowledge National Lottery funding using our logo in accordance with the 
                        relevant guidelines for recognising your grant, which can be found on our website 
                        <a href="https://www.tnlcommunityfund.org.uk/">https://www.tnlcommunityfund.org.uk/</a>;`,

                        oneLine`hold the grant in a UK based account or building society account, which is in the legal 
                        name of the organisation that is applying for funding from The National Lottery Community Fund;`,

                        oneLine`adhere to our guidance at <a href="https://www.tnlcommunityfund.org.uk/funding/financial-governance">https://www.tnlcommunityfund.org.uk/funding/financial-governance</a>  
                        on financial controls and banking arrangements, ensuring that no single individual has sole 
                        responsibility for any single transaction from authorisation to review and completion, and that 
                        the account is managed by at least two unrelated and authorised individuals in your organisation;`,

                        oneLine`immediately return any part of the grant that is not used for your project or 
                    which constitutes unlawful state aid or subsidy;`,

                        oneLine`comply with our safeguarding policy for grant holders, which is available on our website at 
                        <a href="https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders">https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders</a>;`,

                        oneLine`We may commission research into and/or evaluation of your funding. You confirm that 
                    you will co-operate with any research or evaluation-related activities which we carry out 
                    and further confirm that we may use any part of your application and/or project information 
                    for research or evaluation purposes;`,

                        oneLine`comply with data protection laws and obtain the consent of your beneficiaries for 
                    us and you to receive and process their personal information and contact them;`,

                        oneLine`keep accurate and comprehensive records about your project both during the project 
                        and for seven years afterwards and provide us on request with copies of those records and 
                        evidence of expenditure of the grant, such as original paper or electronic receipts, invoices, 
                        and bank statements;`,

                        oneLine`allow us and/or the Comptroller and Auditor General reasonable access to your 
                    premises and systems to inspect project and grant records;`,

                        oneLine`The National Lottery Community Fund publicising and sharing information about 
                    you and your project including your name and images of project activities. You hereby 
                    grant us a royalty free licence to reproduce and publish any project information you 
                    give us. You will let us know when you provide the information if you don’t have 
                    permission for us to use it in this way; and`,

                        oneLine`if your project is being delivered in Wales, enable people to engage in both 
                    Welsh and English, treating both languages equally.  Welsh speakers must be able to 
                    access information and services in Welsh and all materials must be produced bilingually.`,
                    ],
                },
                {
                    title: oneLine`You acknowledge that we are entitled to suspend or terminate the grant and/or 
                require you to repay all or any of the grant in any of the following situations. You must let 
                us know if any of these situations have occurred or are likely to occur.`,
                    clauses: [
                        oneLine`You use the grant in any way other than as approved by us or fail to comply with 
                    any of these Terms and Conditions.`,

                        oneLine`You fail to make good progress with your project or are unlikely in our view 
                    to complete the project or achieve the objectives agreed with us.`,

                        oneLine`You have match funding for the project withdrawn or receive or fail to declare 
                    any duplicate funding for the same project costs as funded by the grant.`,

                        oneLine`You provide us with false or misleading information either on application or 
                    after award of the grant, act dishonestly or are under investigation by us, a regulatory 
                    body or the police, or if we consider for any other reason that public funds are at risk 
                    or you do anything to bring us or the National Lottery into disrepute.`,

                        oneLine`You enter into, or in our view are likely to enter into, administration, 
                    liquidation, receivership, dissolution or, in Scotland, have your organisation’s 
                    estate sequestrated.`,

                        oneLine`You receive any grant money incorrectly either as a result of an administrative 
                    error or otherwise. This includes where You are paid in error before You have complied 
                    with your obligations under these terms and conditions and Offer Letter. Any sum, which 
                    falls due under this paragraph 2.6, shall fall due immediately. If the You fail to repay 
                    the due sum immediately, or as otherwise agreed with us, the sum will be recoverable 
                    summarily as a civil debt.`,
                    ],
                },
                {
                    title: `You acknowledge that:`,
                    clauses: [
                        oneLine`the grant is for your use only and we may require you to pay us a share of any 
                    proceeds from disposal of assets purchased or enhanced with the grant;`,

                        oneLine`we will not increase the grant if you spend more than the agreed budget and 
                    we can only guarantee the grant as long as The National Lottery continues to operate 
                    and we receive sufficient funds from it;`,

                        oneLine`the grant is not consideration for any taxable supply for VAT purposes;`,

                        oneLine`we have no liability for any costs or consequences incurred by you or third 
                    parties that arise directly or indirectly from the project, nor from non-payment or 
                    withdrawal of the grant, save to the extent required by law;`,

                        oneLine`these Terms and Conditions will continue to apply for one year after the grant is 
                        paid or until the project has been completed, whichever is later. Clauses 1.2, 1.4, 1.5, 1.6, 
                        1.7, 1.9, 1.10, 1.11, 1.12, 1.13, 3.4 and 3.5 shall survive expiry of these Terms and 
                        Conditions; and`,

                        oneLine`if the application and grant award are made electronically, the agreement 
                    between us shall be deemed to be in writing and your online acceptance of these 
                    Terms and Conditions shall be deemed to be the equivalent of your signature on 
                    that agreement.`,
                    ],
                },
            ],
            cy: [
                {
                    title: oneLine`Drwy gyflwyno cais i Gronfa Gymunedol y Loteri Genedlaethol, mae'r sefydliad 
                a enwir yn y cais (y cyfeirir ato fel "chi" yn y Telerau ac Amodau hyn) yn cytuno, os rhoddir 
                grant iddo, i:`,
                    clauses: [
                        oneLine`ddal y grant ar ymddiriedaeth ar gyfer Cronfa Gymunedol y Loteri Genedlaethol 
                    (y cyfeirir ati fel 'ni') a'i ddefnyddio ar gyfer eich prosiect yn unig fel y disgrifir yn 
                    eich cais neu y cytunwyd arno fel arall gyda ni, a dim ond ar gyfer gwariant a dynnwyd ar ôl 
                    dyddiad eich dyfarniad grant;`,

                        oneLine`rhoi unrhyw wybodaeth ac adroddiadau sydd eu hangen arnom am y prosiect a'i 
                    effaith, yn ystod ac ar ôl diwedd y prosiect;`,

                        oneLine`gweithredu'n gyfreithlon wrth gyflawni eich prosiect yn unol ag arfer gorau ac arweiniad 
                    gan eich rheoleiddwyr, a dilyn unrhyw ganllawiau a gyhoeddwyd gennym am y prosiect neu'r defnydd 
                    o'r grant a rhoi gwybod i ni'n brydlon am unrhyw dwyll, amhriodoldeb arall, camreoli neu gamddefnydd 
                    mewn perthynas â'r grant;`,

                        oneLine`cydnabod arian y Loteri Genedlaethol gan ddefnyddio ein logo yn unol â'r canllawiau 
                        perthnasol ar gyfer cydnabod eich grant, sydd i'w weld ar ein gwefan 
                        <a href="https://www.tnlcommunityfund.org.uk/">https://www.tnlcommunityfund.org.uk/</a>`,

                        oneLine`dal y grant mewn cyfrif yn y DU neu gyfrif cymdeithas adeiladu, sydd yn enw cyfreithiol 
                        y sefydliad, sydd yn ymgeisio am arian gan Gronfa Cymunedol y Loteri Genedlaethol.`,

                        oneLine`cadw at ein canllawiau sydd ar gael ar ein gwefan; 
                        <a href="https://www.tnlcommunityfund.org.uk/funding/financial-governance">https://www.tnlcommunityfund.org.uk/funding/financial-governance</a> 
                        ar reolaethau ariannol a threfniadau bancio, gan sicrhau nad oes gan unrhyw unigolyn unigol gyfrifoldeb llwyr am unrhyw 
                        drafodiad unigol o awdurdodiad i adolygu a chwblhau, a bod y cyfrif yn cael ei reoli gan o leiaf 
                        ddau unigolyn anghysylltiedig ac awdurdodedig yn eich sefydliad.`,

                        oneLine`dychwelyd ar unwaith unrhyw ran o'r grant nad yw'n cael ei ddefnyddio ar gyfer eich 
                    prosiect neu sy'n gymhorthdal anghyfreithlon;`,

                        oneLine`cydymffurfio â'n polisi diogelu ar gyfer deiliaid grantiau, sydd ar gael ar ein gwefan; 
                        <a href="https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders">https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders</a>;`,

                        oneLine`gallwn gomisiynu ymchwil i'ch grantiau a/neu ei werthuso. Rydych yn cadarnhau y byddwch yn 
                    cydweithredu ag unrhyw weithgareddau ymchwil neu werthuso a gyflawnir gennym ac yn cadarnhau ymhellach 
                    y gallwn ddefnyddio unrhyw ran o'ch cais a/neu wybodaeth am brosiect at ddibenion ymchwil neu werthuso.`,

                        oneLine`cydymffurfio â chyfreithiau diogelu data a chael caniatâd eich buddiolwyr i ni a chi 
                    dderbyn a phrosesu eu gwybodaeth bersonol a chysylltu â nhw;`,

                        oneLine`cadw cofnodion cywir a chynhwysfawr am eich prosiect yn ystod y prosiect ac am saith 
                        mlynedd wedyn a rhoi copïau o'r cofnodion hynny a thystiolaeth o wariant y grant i ni ar gais, 
                        megis derbynebau gwreiddiol papur neu electronig, anfonebau a datganiadau banc`,

                        oneLine`caniatáu i ni a/neu'r Rheolwr a'r Archwilydd Cyffredinol gael mynediad rhesymol i'ch 
                    safleoedd a'ch systemau i archwilio cofnodion prosiectau a grant;`,

                        oneLine`mae Cronfa Gymunedol y Loteri Genedlaethol yn rhoi cyhoeddusrwydd i wybodaeth amdanoch 
                    chi a'ch prosiect ac yn ei rhannu, gan gynnwys eich enw a'ch delweddau o weithgareddau'r prosiect. 
                    Rydych drwy hyn yn rhoi trwydded i ni atgynhyrchu a chyhoeddi unrhyw wybodaeth am brosiectau a 
                    roddwch inni. Byddwch yn rhoi gwybod i ni pryd y byddwch yn darparu'r wybodaeth os nad oes 
                    gennych ganiatâd i ni ei defnyddio fel hyn; A`,

                        oneLine`Os yw eich prosiect yn cael ei gyflawni yng Nghymru, rhaid galluogi pobl i gymryd rhan 
                    yn y Gymraeg a'r Saesneg, gan drin y ddwy iaith yn gyfartal.  Rhaid i siaradwyr Cymraeg allu cael 
                    gafael ar wybodaeth a gwasanaethau yn Gymraeg a rhaid cynhyrchu'r holl ddeunyddiau'n ddwyieithog.`,
                    ],
                },
                {
                    title: oneLine`Rydych yn cydnabod bod gennym hawl i atal neu derfynu'r grant a/neu ei gwneud yn ofynnol 
                i chi ad-dalu'r grant cyfan neu unrhyw ran ohono yn unrhyw un o'r sefyllfaoedd canlynol. Rhaid i chi roi 
                gwybod i ni os oes unrhyw un o'r sefyllfaoedd hyn wedi digwydd neu'n debygol o ddigwydd.`,
                    clauses: [
                        oneLine`Rydych yn defnyddio'r grant mewn unrhyw ffordd heblaw fel y'i cymeradwywyd gennym neu'n 
                    methu â chydymffurfio ag unrhyw un o'r Telerau ac Amodau hyn.`,

                        oneLine`os byddwch yn methu â gwneud cynnydd da gyda'ch prosiect neu'n annhebygol yn ein barn ni o 
                    gwblhau'r prosiect neu gyflawni'r amcanion y cytunwyd arnynt gyda ni.`,

                        oneLine`cewch arian dyblyg ar gyfer yr un costau prosiect ag a ariennir gan y grant.`,

                        oneLine`rydych yn rhoi gwybodaeth anwir neu gamarweiniol i ni naill ai ar gais neu ar ôl dyfarnu'r grant, 
                    yn gweithredu'n anonest neu'n destun ymchwiliad gennym ni, corff rheoleiddio neu'r heddlu, neu os ystyriwn 
                    am unrhyw reswm arall fod arian cyhoeddus mewn perygl neu os ydych yn gwneud unrhyw beth i ddwyn anfri 
                    arnom ni neu'r Loteri Genedlaethol.`,

                        oneLine`rydych yn mynd i neu’n debygol o weinyddu, diddymu, neu dod i ben am reswm penodol.`,

                        oneLine`rydych yn derbyn unrhyw arian grant yn anghywir naill ai o ganlyniad i gamgymeriad 
                    gweinyddol neu fel arall. Mae hyn yn cynnwys lle cewch eich talu mewn camgymeriad cyn i chi 
                    gydymffurfio â'ch rhwymedigaethau o dan y telerau a'r amodau hyn a'r Llythyr Cynnig. Bydd unrhyw 
                    swm, sy'n ddyledus o dan y paragraff 2.6 hwn, yn ddyledus ar unwaith. Os byddwch yn methu 
                    ag ad-dalu'r swm dyledus ar unwaith, neu fel y cytunwyd fel arall gyda ni, bydd y swm yn 
                    adenilladwy yn ddiannod fel dyled sifil.`,
                    ],
                },
                {
                    title: `Rydych yn cydnabod:`,
                    clauses: [
                        oneLine`mae'r grant at eich defnydd chi yn unig ac efallai y byddwn yn ei gwneud yn ofynnol 
                    i chi dalu cyfran o unrhyw elw o waredu asedau a brynwyd neu a wellwyd gyda'r grant;`,

                        oneLine`ni fyddwn yn cynyddu'r grant os ydych yn gwario mwy na'r gyllideb y cytunwyd arni 
                    ac ni allwn ond gwarantu'r grant cyn belled â bod y Loteri Genedlaethol yn parhau i weithredu 
                    a'n bod yn cael digon o arian arnoch;`,

                        oneLine`nid yw'r grant yn ystyriaeth i unrhyw gyflenwad trethadwy at ddibenion TAW;`,

                        oneLine`nid oes gennym unrhyw atebolrwydd am unrhyw gostau neu ganlyniadau a ysgwyddwyd gennych 
                    chi neu drydydd partïon sy'n codi'n uniongyrchol nac yn anuniongyrchol o'r prosiect, nac o beidio 
                    â thalu neu dynnu'r grant yn ôl, ac eithrio i'r graddau sy'n ofynnol yn ôl y gyfraith;`,

                        oneLine`bydd y Telerau ac Amodau hyn yn parhau i fod yn gymwys am flwyddyn ar ôl i'r grant gael 
                        ei dalu neu hyd nes y bydd y prosiect wedi'i gwblhau, pa un bynnag sydd hwyraf. Cymalau 1.2, 1.4, 
                        1.5, 1.6, 1.7, 1.9, 1.10, 1.11, 1.12, 1.13, 3.4 a 3.5 yn goroesi i'r Telerau ac Amodau hyn ddod i ben; a`,

                        oneLine`os caiff y cais a'r dyfarniad grant eu gwneud yn electronig, ystyrir bod y cytundeb rhyngom 
                    yn ysgrifenedig a bernir bod eich derbyniad ar-lein o'r Telerau ac Amodau hyn yn cyfateb i'ch llofnod 
                    ar y cytundeb hwnnw.`,
                    ],
                },
            ],
        });
    } else {
        return localise({
            en: [
                {
                    title: oneLine`By submitting an application to The National Lottery Community Fund, 
                the organisation named in the application (referred to as “you” in these Terms and Conditions) 
                agrees, if awarded a grant, to:`,
                    clauses: [
                        oneLine`hold the grant on trust for The National Lottery Community Fund (referred to as 
                    ‘we’ or ‘us’) and use it only for your project as described in your application or 
                    otherwise agreed with us, and only for expenditure incurred after the date of your 
                    grant award;`,

                        oneLine`provide us promptly with any information and reports we require about the 
                    project and its impact, both during and after the end of the project;`,

                        oneLine`act lawfully in carrying out your project in accordance with best practice 
                    and guidance from your regulators, and follow any guidelines issued by us about the 
                    project or use of the grant and let us know promptly about any fraud, other 
                    impropriety, mismanagement or misuse in relation to the grant;`,

                        oneLine`acknowledge National Lottery funding using our logo in accordance with the 
                        relevant guidelines for recognising your grant, which can be found on our website 
                        <a href="https://www.tnlcommunityfund.org.uk/">https://www.tnlcommunityfund.org.uk/</a>;`,

                        oneLine`hold the grant in a UK based account or building society account, which is 
                        in the legal name of the organisation that is applying for funding from The National 
                        Lottery Community Fund;`,

                        oneLine`adhere to our guidance at <a href="https://www.tnlcommunityfund.org.uk/funding/financial-governance">https://www.tnlcommunityfund.org.uk/funding/financial-governance</a>  
                        on financial controls and banking arrangements, ensuring that no single individual has sole 
                        responsibility for any single transaction from authorisation to review and completion, and that 
                        the account is managed by at least two unrelated and authorised individuals in your organisation;`,

                        oneLine`immediately return any part of the grant that is not used for your project or 
                    which constitutes an unlawful subsidy;`,

                        oneLine`comply with our safeguarding policy for grant holders, which is available on our website at 
                        <a href="https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders">https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders</a>;`,

                        oneLine`We may commission research into and/or evaluation of your funding. You confirm that 
                    you will co-operate with any research or evaluation-related activities which we carry out 
                    and further confirm that we may use any part of your application and/or project information 
                    for research or evaluation purposes;`,

                        oneLine`comply with data protection laws and obtain the consent of your beneficiaries for 
                    us and you to receive and process their personal information and contact them;`,

                        oneLine`keep accurate and comprehensive records about your project both during the project and 
                        for seven years afterwards and provide us on request with copies of those records and evidence 
                        of expenditure of the grant, such as original paper or electronic receipts, invoices, and bank statement;`,

                        oneLine`allow us and/or the Comptroller and Auditor General reasonable access to your 
                    premises and systems to inspect project and grant records;`,

                        oneLine`The National Lottery Community Fund publicising and sharing information about 
                    you and your project including your name and images of project activities. You hereby 
                    grant us a royalty free licence to reproduce and publish any project information you 
                    give us. You will let us know when you provide the information if you don’t have 
                    permission for us to use it in this way; and`,

                        oneLine`if your project is being delivered in Wales, enable people to engage in both 
                    Welsh and English, treating both languages equally.  Welsh speakers must be able to 
                    access information and services in Welsh and all materials must be produced bilingually.`,
                    ],
                },
                {
                    title: oneLine`You acknowledge that we are entitled to suspend or terminate the grant and/or 
                require you to repay all or any of the grant in any of the following situations. You must let 
                us know if any of these situations have occurred or are likely to occur.`,
                    clauses: [
                        oneLine`You use the grant in any way other than as approved by us or fail to comply with 
                    any of these Terms and Conditions.`,

                        oneLine`You fail to make good progress with your project or are unlikely in our view 
                    to complete the project or achieve the objectives agreed with us.`,

                        oneLine`You have match funding for the project withdrawn or receive or fail to declare 
                    any duplicate funding for the same project costs as funded by the grant.`,

                        oneLine`You provide us with false or misleading information either on application or 
                    after award of the grant, act dishonestly or are under investigation by us, a regulatory 
                    body or the police, or if we consider for any other reason that public funds are at risk 
                    or you do anything to bring us or the National Lottery into disrepute.`,

                        oneLine`You enter into, or in our view are likely to enter into, administration, 
                    liquidation, receivership, dissolution or, in Scotland, have your organisation’s 
                    estate sequestrated.`,

                        oneLine`You receive any grant money incorrectly either as a result of an administrative 
                    error or otherwise. This includes where You are paid in error before You have complied 
                    with your obligations under these terms and conditions and Offer Letter. Any sum, which 
                    falls due under this paragraph 2.6, shall fall due immediately. If the You fail to repay 
                    the due sum immediately, or as otherwise agreed with us, the sum will be recoverable 
                    summarily as a civil debt.`,
                    ],
                },
                {
                    title: `You acknowledge that:`,
                    clauses: [
                        oneLine`the grant is for your use only and we may require you to pay us a share of any 
                    proceeds from disposal of assets purchased or enhanced with the grant;`,

                        oneLine`we will not increase the grant if you spend more than the agreed budget and 
                    we can only guarantee the grant as long as The National Lottery continues to operate 
                    and we receive sufficient funds from it;`,

                        oneLine`the grant is not consideration for any taxable supply for VAT purposes;`,

                        oneLine`we have no liability for any costs or consequences incurred by you or third 
                    parties that arise directly or indirectly from the project, nor from non-payment or 
                    withdrawal of the grant, save to the extent required by law;`,

                        oneLine`these Terms and Conditions will continue to apply for one year after the grant 
                        is paid or until the project has been completed, whichever is later. Clauses 1.2, 1.4, 1.5, 1.6, 
                        1.7, 1.9, 1.10, 1.11, 1.12, 1.13, 3.4 and 3.5 shall survive expiry of these Terms and Conditions; and`,

                        oneLine`if the application and grant award are made electronically, the agreement 
                    between us shall be deemed to be in writing and your online acceptance of these 
                    Terms and Conditions shall be deemed to be the equivalent of your signature on 
                    that agreement.`,
                    ],
                },
            ],
            cy: [
                {
                    title: oneLine`Drwy gyflwyno cais i Gronfa Gymunedol y Loteri Genedlaethol, mae'r sefydliad 
                a enwir yn y cais (y cyfeirir ato fel "chi" yn y Telerau ac Amodau hyn) yn cytuno, os rhoddir 
                grant iddo, i:`,
                    clauses: [
                        oneLine`ddal y grant ar ymddiriedaeth ar gyfer Cronfa Gymunedol y Loteri Genedlaethol 
                    (y cyfeirir ati fel 'ni') a'i ddefnyddio ar gyfer eich prosiect yn unig fel y disgrifir yn 
                    eich cais neu y cytunwyd arno fel arall gyda ni, a dim ond ar gyfer gwariant a dynnwyd ar ôl 
                    dyddiad eich dyfarniad grant;`,

                        oneLine`rhoi unrhyw wybodaeth ac adroddiadau sydd eu hangen arnom am y prosiect a'i 
                    effaith, yn ystod ac ar ôl diwedd y prosiect;`,

                        oneLine`gweithredu'n gyfreithlon wrth gyflawni eich prosiect yn unol ag arfer gorau ac arweiniad 
                    gan eich rheoleiddwyr, a dilyn unrhyw ganllawiau a gyhoeddwyd gennym am y prosiect neu'r defnydd 
                    o'r grant a rhoi gwybod i ni'n brydlon am unrhyw dwyll, amhriodoldeb arall, camreoli neu gamddefnydd 
                    mewn perthynas â'r grant;`,

                        oneLine`cydnabod arian y Loteri Genedlaethol gan ddefnyddio ein logo yn unol â'r canllawiau 
                        perthnasol ar gyfer cydnabod eich grant, sydd i'w weld ar ein gwefan 
                        <a href="https://www.tnlcommunityfund.org.uk/">https://www.tnlcommunityfund.org.uk/</a>;`,

                        oneLine`dal y grant mewn cyfrif yn y DU neu gyfrif cymdeithas adeiladu, sydd yn enw cyfreithiol 
                        y sefydliad, sydd yn ymgeisio am arian gan Gronfa Cymunedol y Loteri Genedlaethol.`,

                        oneLine`cadw at ein canllawiau sydd ar gael ar ein gwefan; 
                        <a href="https://www.tnlcommunityfund.org.uk/funding/financial-governance">https://www.tnlcommunityfund.org.uk/funding/financial-governance</a>
                        ar reolaethau ariannol a threfniadau bancio, gan sicrhau nad oes gan unrhyw unigolyn unigol 
                        gyfrifoldeb llwyr am unrhyw drafodiad unigol o awdurdodiad i adolygu a chwblhau, a bod y cyfrif 
                        yn cael ei reoli gan o leiaf ddau unigolyn anghysylltiedig ac awdurdodedig yn eich sefydliad.`,

                        oneLine`dychwelyd ar unwaith unrhyw ran o'r grant nad yw'n cael ei ddefnyddio ar gyfer eich 
                    prosiect neu sy'n gymhorthdal anghyfreithlon;`,

                        oneLine`cydymffurfio â'n polisi diogelu ar gyfer deiliaid grantiau, sydd ar gael ar ein gwefan; 
                        <a href="https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders">https://www.tnlcommunityfund.org.uk/about/customer-service/national-lottery-community-fund-policy-for-grantholders</a>;`,

                        oneLine`gallwn gomisiynu ymchwil i'ch grantiau a/neu ei werthuso. Rydych yn cadarnhau y byddwch yn 
                    cydweithredu ag unrhyw weithgareddau ymchwil neu werthuso a gyflawnir gennym ac yn cadarnhau ymhellach 
                    y gallwn ddefnyddio unrhyw ran o'ch cais a/neu wybodaeth am brosiect at ddibenion ymchwil neu werthuso.`,

                        oneLine`cydymffurfio â chyfreithiau diogelu data a chael caniatâd eich buddiolwyr i ni a chi 
                    dderbyn a phrosesu eu gwybodaeth bersonol a chysylltu â nhw;`,

                        oneLine`cadw cofnodion cywir a chynhwysfawr am eich prosiect yn ystod y prosiect ac am saith 
                        mlynedd wedyn a rhoi copïau o'r cofnodion hynny a thystiolaeth o wariant y grant i ni ar gais, 
                        megis derbynebau gwreiddiol papur neu electronig, anfonebau a datganiadau banc;`,

                        oneLine`caniatáu i ni a/neu'r Rheolwr a'r Archwilydd Cyffredinol gael mynediad rhesymol i'ch 
                    safleoedd a'ch systemau i archwilio cofnodion prosiectau a grant;`,

                        oneLine`mae Cronfa Gymunedol y Loteri Genedlaethol yn rhoi cyhoeddusrwydd i wybodaeth amdanoch 
                    chi a'ch prosiect ac yn ei rhannu, gan gynnwys eich enw a'ch delweddau o weithgareddau'r prosiect. 
                    Rydych drwy hyn yn rhoi trwydded i ni atgynhyrchu a chyhoeddi unrhyw wybodaeth am brosiectau a 
                    roddwch inni. Byddwch yn rhoi gwybod i ni pryd y byddwch yn darparu'r wybodaeth os nad oes 
                    gennych ganiatâd i ni ei defnyddio fel hyn; A`,

                        oneLine`Os yw eich prosiect yn cael ei gyflawni yng Nghymru, rhaid galluogi pobl i gymryd rhan 
                    yn y Gymraeg a'r Saesneg, gan drin y ddwy iaith yn gyfartal.  Rhaid i siaradwyr Cymraeg allu cael 
                    gafael ar wybodaeth a gwasanaethau yn Gymraeg a rhaid cynhyrchu'r holl ddeunyddiau'n ddwyieithog.`,
                    ],
                },
                {
                    title: oneLine`Rydych yn cydnabod bod gennym hawl i atal neu derfynu'r grant a/neu ei gwneud yn ofynnol 
                i chi ad-dalu'r grant cyfan neu unrhyw ran ohono yn unrhyw un o'r sefyllfaoedd canlynol. Rhaid i chi roi 
                gwybod i ni os oes unrhyw un o'r sefyllfaoedd hyn wedi digwydd neu'n debygol o ddigwydd.`,
                    clauses: [
                        oneLine`Rydych yn defnyddio'r grant mewn unrhyw ffordd heblaw fel y'i cymeradwywyd gennym neu'n 
                    methu â chydymffurfio ag unrhyw un o'r Telerau ac Amodau hyn.`,

                        oneLine`os byddwch yn methu â gwneud cynnydd da gyda'ch prosiect neu'n annhebygol yn ein barn ni o 
                    gwblhau'r prosiect neu gyflawni'r amcanion y cytunwyd arnynt gyda ni.`,

                        oneLine`cewch arian dyblyg ar gyfer yr un costau prosiect ag a ariennir gan y grant.`,

                        oneLine`rydych yn rhoi gwybodaeth anwir neu gamarweiniol i ni naill ai ar gais neu ar ôl dyfarnu'r grant, 
                    yn gweithredu'n anonest neu'n destun ymchwiliad gennym ni, corff rheoleiddio neu'r heddlu, neu os ystyriwn 
                    am unrhyw reswm arall fod arian cyhoeddus mewn perygl neu os ydych yn gwneud unrhyw beth i ddwyn anfri 
                    arnom ni neu'r Loteri Genedlaethol.`,

                        oneLine`rydych yn mynd i neu’n debygol o weinyddu, diddymu, neu dod i ben am reswm penodol.`,

                        oneLine`rydych yn derbyn unrhyw arian grant yn anghywir naill ai o ganlyniad i gamgymeriad 
                    gweinyddol neu fel arall. Mae hyn yn cynnwys lle cewch eich talu mewn camgymeriad cyn i chi 
                    gydymffurfio â'ch rhwymedigaethau o dan y telerau a'r amodau hyn a'r Llythyr Cynnig. Bydd unrhyw 
                    swm, sy'n ddyledus o dan y paragraff 2.6 hwn, yn ddyledus ar unwaith. Os byddwch yn methu 
                    ag ad-dalu'r swm dyledus ar unwaith, neu fel y cytunwyd fel arall gyda ni, bydd y swm yn 
                    adenilladwy yn ddiannod fel dyled sifil.`,
                    ],
                },
                {
                    title: `Rydych yn cydnabod:`,
                    clauses: [
                        oneLine`mae'r grant at eich defnydd chi yn unig ac efallai y byddwn yn ei gwneud yn ofynnol 
                    i chi dalu cyfran o unrhyw elw o waredu asedau a brynwyd neu a wellwyd gyda'r grant;`,

                        oneLine`ni fyddwn yn cynyddu'r grant os ydych yn gwario mwy na'r gyllideb y cytunwyd arni 
                    ac ni allwn ond gwarantu'r grant cyn belled â bod y Loteri Genedlaethol yn parhau i weithredu 
                    a'n bod yn cael digon o arian arnoch;`,

                        oneLine`nid yw'r grant yn ystyriaeth i unrhyw gyflenwad trethadwy at ddibenion TAW;`,

                        oneLine`nid oes gennym unrhyw atebolrwydd am unrhyw gostau neu ganlyniadau a ysgwyddwyd gennych 
                    chi neu drydydd partïon sy'n codi'n uniongyrchol nac yn anuniongyrchol o'r prosiect, nac o beidio 
                    â thalu neu dynnu'r grant yn ôl, ac eithrio i'r graddau sy'n ofynnol yn ôl y gyfraith;`,

                        oneLine`bydd y Telerau ac Amodau hyn yn parhau i fod yn gymwys am flwyddyn ar ôl i'r grant gael 
                        ei dalu neu hyd nes y bydd y prosiect wedi'i gwblhau, pa un bynnag sydd hwyraf. Cymalau 1.2, 1.4, 
                        1.5, 1.6, 1.7, 1.9, 1.10, 1.11, 1.12, 1.13, 3.4 a 3.5 yn goroesi i'r Telerau ac Amodau hyn ddod i ben; a`,

                        oneLine`os caiff y cais a'r dyfarniad grant eu gwneud yn electronig, ystyrir bod y cytundeb rhyngom 
                    yn ysgrifenedig a bernir bod eich derbyniad ar-lein o'r Telerau ac Amodau hyn yn cyfateb i'ch llofnod 
                    ar y cytundeb hwnnw.`,
                    ],
                },
            ],
        });
    }
}

module.exports = function (locale, data) {
    const projectCountry = get('projectCountry')(data);
    const termsParts = newTerms(locale, projectCountry);

    return `<ol class="o-nested-numbers">
        ${termsParts
            .map(function (section) {
                return `<li>
                    <p><strong>${section.title}</strong></p>
                    <ol class="o-nested-numbers">
                        ${section.clauses
                            .map(function (clause) {
                                return `<li>${clause}</li>`;
                            })
                            .join('')}
                    </ol>
                </li>`;
            })
            .join('')}
    </ol>`;
};
