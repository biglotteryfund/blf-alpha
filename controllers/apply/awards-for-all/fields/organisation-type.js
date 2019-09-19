'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const { ORGANISATION_TYPES } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    const options = [
        {
            value: ORGANISATION_TYPES.UNREGISTERED_VCO,
            label: localise({
                en: `Unregistered voluntary or community organisation`,
                cy: `Sefydliad gwirfoddol neu gymunedol anghofrestredig`
            }),
            explanation: localise({
                en: oneLine`An organisation set up with a governing document - like a constitution. 
                    But isn't a registered charity or company.`,
                cy: oneLine`Mae ein sefydliad wedi ei osod gyda dogfen lywodraethol,
                    fel cyfansoddiad, ond nid yw’n elusen nac yn gwmni.
                    Rhai enghreifftiau o’r mathau yma o grwpiau fyddai clwb chwaraeon,
                    clwb cymunedol neu gymdeithas preswylwyr`
            })
        },
        {
            value: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
            label: localise({
                en: 'Not-for-profit company',
                cy: 'Cwmni di-elw'
            }),
            explanation: localise({
                en: oneLine`A company limited by guarantee - registered with Companies House. 
                    And might also be registered as a charity.`,
                cy: oneLine`Mae fy sefydliad yn gwmni di-elw sydd yn gofrestredig
                    â Thŷ’r Cwmnïau, a <strong>gall hefyd</strong> fod wedi’i
                    gofrestru fel elusen.`
            })
        },
        {
            value: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
            label: localise({
                en: `Registered charity (unincorporated)`,
                cy: `Elusen gofrestredig (anghorfforedig)`
            }),
            explanation: localise({
                en: oneLine`A voluntary or community organisation that's a registered charity. 
                    But isn't a company registered with Companies House.`,
                cy: oneLine`Mae fy sefydliad yn un wirfoddol neu gymunedol
                    ac yn elusen gofrestredig, ond <strong>nid</strong> yw’n
                    gwmni sydd wedi cofrestru â Thŷ’r Cwmnïau`
            })
        },
        {
            value: ORGANISATION_TYPES.CIO,
            label: localise({
                en: `Charitable Incorporated Organisation (CIO or SCIO)`,
                cy: `Sefydliad corfforedig elusennol (CIO / SCIO)`
            }),
            explanation: localise({
                en: oneLine`A registered charity with limited liability. 
                    But isn't a company registered with Companies House.`,
                cy: oneLine`Mae fy sefydliad yn elusen gofrestredig gydag
                    atebolrwydd cyfyngedig, ond <strong>ddim</strong> yn
                    gwmni sydd wedi cofrestru â Thŷ’r Cwmnïau.`
            })
        },
        {
            value: ORGANISATION_TYPES.CIC,
            label: localise({
                en: 'Community Interest Company (CIC)',
                cy: '@TODO'
            }),
            explanation: localise({
                en: oneLine`A company registered with Companies House. 
                    And the Community Interest Company (CIC) Regulator.`,
                cy: oneLine`TBD`
            })
        },
        {
            value: ORGANISATION_TYPES.SCHOOL,
            label: localise({
                en: 'School',
                cy: 'Ysgol'
            })
            // explanation: localise({
            //     en: `My organisation is a school`,
            //     cy: `Mae fy sefydliad yn ysgol`
            // })
        },
        {
            value: ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
            label: localise({
                en: 'College or University',
                cy: 'Coleg neu brifysgol'
            })
            // explanation: localise({
            //     en: oneLine`My organisation is a college, university, or other
            //         registered educational establishment`,
            //     cy: oneLine`Mae fy sefydliad yn goleg, prifysgol neu sefydliad
            //         addysgol cofrestredig arall`
            // })
        },
        {
            value: ORGANISATION_TYPES.STATUTORY_BODY,
            label: localise({
                en: 'Statutory body',
                cy: 'Corff statudol'
            }),
            explanation: localise({
                en: oneLine`A public body - like a local authority or parish council. 
                    Or a police or health authority.`,
                cy: oneLine`Mae fy sefydliad yn gorff cyhoeddus, megis awdurdod
                    lleol, cyngor plwyf neu awdurdod heddlu neu iechyd`
            })
        },
        {
            value: ORGANISATION_TYPES.FAITH_GROUP,
            label: localise({
                en: 'Faith-based group',
                cy: 'Grŵp yn seiliedig ar ffydd'
            }),
            explanation: localise({
                en: `Like a church, mosque, temple or synagogue.`,
                cy: `Mae fy sefydliad yn eglwys, mosg, teml, synagog a.y.y.b.`
            })
        }
    ];

    return {
        name: 'organisationType',
        label: localise({
            en: 'What type of organisation are you?',
            cy: 'Pa fath o sefydliad ydych chi?'
        }),
        explanation: localise({
            en: `If you're both a charity and a company—just pick ‘Not-for-profit company’ below.`,
            cy: `Os ydych yn elusen ac yn gwmni—dewiswch ‘Cwmni di-elw’ isod.`
        }),
        type: 'radio',
        options: options,
        isRequired: true,
        schema: Joi.string()
            .valid(options.map(option => option.value))
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a type of organisation',
                    cy: 'Dewiswch fath o sefydliad'
                })
            }
        ]
    };
};
