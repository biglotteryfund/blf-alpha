'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const generateSchema = require('generate-schema');

const globals = require('../../modules/boilerplate/globals');
const routes = require('../routes');
const models = require('../../models/index');
const isAuthenticated = require('../../modules/authed');

const LAUNCH_DATE = moment();

const localeFiles = {
    en: '../../config/locales/en.json',
    cy: '../../config/locales/cy.json'
};

router.get('/', (req, res, next) => {
    // don't cache this page!
    res.cacheControl = { maxAge: 0 };
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Content-Type', 'application/json');
    const appData = globals.get('appData');
    res.send({
        'APP_ENV': process.env.NODE_ENV,
        'DEPLOY_ID': appData.deployId,
        'BUILD_NUMBER': appData.buildNumber,
        'START_DATE': LAUNCH_DATE.format("dddd, MMMM Do YYYY, h:mm:ss a"),
        'UPTIME': LAUNCH_DATE.toNow(true)
    });
});

router.get('/pages', (req, res, next) => {

    const totals = {
        canonical: [],
        aliases: [],
        vanityRedirects: routes.vanityRedirects.filter(r => r.aliasOnly).map(r => r.path),
        redirectedPages: routes.vanityRedirects.filter(r => !r.aliasOnly).map(r => r.path)
    };

    for (let s in routes.sections) {
        let section = routes.sections[s];
        for (let p in section.pages) {
            let page = section.pages[p];
            if (page.live) {
                totals.canonical.push(page.name);
                if (page.aliases) {
                    page.aliases.forEach(p => totals.aliases.push(p));
                }
            }
        }
    }



    res.render('pagelist', {
        routes: routes.sections,
        vanityRedirects: routes.vanityRedirects,
        totals: totals
    });
});

// only allow these routes in dev
if (globals.get('appData').IS_DEV) {

    router.route('/locales/')
        .get((req, res, next) => {
            res.render('langEditor', {});
        }).post((req, res, next) => {
            // fetch these each time
            const locales = {
                en: require(localeFiles.en),
                cy: require(localeFiles.cy)
            };
            res.send({
                editors: [
                    {
                        name: "English",
                        code: 'en',
                        json: locales.en,
                        schema: generateSchema.json(locales.en)
                    },
                    {
                        name: "Welsh",
                        code: 'cy',
                        json: locales.cy,
                        schema: generateSchema.json(locales.cy)
                    }
                ]
            });
    });

    router.post('/locales/update/', (req, res, next) => {

        const json = req.body;
        let validKeys = ['en', 'cy'];
        let failedUpdates = [];

        validKeys.forEach(locale => {
            if (json[locale]) {
                let jsonToWrite = JSON.stringify(json[locale], null, 4);
                try {
                    let filePath = path.join(__dirname, `../../config/locales/${locale}.json`);
                    fs.writeFileSync(filePath, jsonToWrite);
                } catch (err) {
                    failedUpdates.push(locale);
                    return console.error(`Error saving ${locale} language`, err);
                }
            }
        });

        res.send({
            error: (failedUpdates.length > 0) ? failedUpdates : false
        });

    });

}

const editNewsPath = '/edit-news';

router.route(editNewsPath + '/:id?')
    .get(isAuthenticated, (req, res, next) => {

        let queries = [];
        queries.push(models.News.findAll({ order: [['updatedAt', 'DESC']] }));

        if (req.params.id) {
            queries.push(models.News.findById(req.params.id));
        }

        Promise.all(queries).then((responses) => {
            if (req.params.id) {
                req.flash('formValues', responses[1]);
            }
            res.render('pages/tools/newsEditor', {
                news: responses[0],
                id: req.params.id,
                status: req.flash('newsStatus'),
                user: req.user
            });
        });
    }).post(isAuthenticated, (req, res, next) => {
        req.checkBody('title', 'Please provide a title').notEmpty();
        req.checkBody('text', 'Please provide a summary').notEmpty();
        req.checkBody('link', 'Please provide a link').notEmpty();

        req.getValidationResult().then((result) => {
            // sanitise input
            req.body['title'] = req.sanitize('title').escape();
            req.body['text'] = req.sanitize('text').escape();

            if (!result.isEmpty()) {
                req.flash('formErrors', result.array());
                req.flash('formValues', req.body);
                res.redirect(req.baseUrl + editNewsPath);
            } else {

                let rowData = {
                    title: req.body['title'],
                    text: req.body['text'],
                    link: req.body['link']
                };

                if (req.params.id) {
                    rowData.id = req.params.id;
                }

                if (req.body.action === 'delete' && req.params.id) {
                    models.News.destroy({
                        where: {
                            id: req.params.id
                        }
                    });
                } else {
                    models.News.upsert(rowData);
                }
                req.flash('newsStatus', 'success');
                res.redirect(req.baseUrl + editNewsPath);
            }
        });
    });

module.exports = router;
