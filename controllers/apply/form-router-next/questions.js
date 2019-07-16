'use strict';
const config = require('config');
const express = require('express');
const fs = require('fs');
const nunjucks = require('nunjucks');
const path = require('path');
const pdf = require('html-pdf');

module.exports = function(formId, formBuilder, eligibilityBuilder) {
    const router = express.Router();

    router.get('/:pdf?', (req, res, next) => {
        const form = formBuilder({
            locale: req.i18n.getLocale(),
            showAllFields: true
        });

        const eligibility = eligibilityBuilder({
            locale: req.i18n.getLocale()
        });

        const output = {
            templates: {
                html: path.resolve(__dirname, './views/questions-html.njk'),
                pdf: path.resolve(__dirname, './views/questions-pdf.njk')
            },
            context: {
                title: form.title,
                form: form,
                eligibility: eligibility
            }
        };

        if (req.params.pdf) {
            const fileName = `${formId}.pdf`;
            const fileLocation = `documents/application-questions/${fileName}`;

            const filePath = path.resolve(
                __dirname,
                '../../../public/',
                fileLocation
            );

            // First check to see if this file has already been rendered and saved in the app directory
            fs.access(filePath, fs.constants.F_OK, accessError => {
                if (!accessError) {
                    // The file exists so just redirect the user there
                    return res.redirect(`/assets/${fileLocation}`);
                }

                // Otherwise it hasn't been rendered before, so we create it from scratch and save the file

                // Repopulate existing global context so templates render properly
                const context = {
                    ...res.locals,
                    ...req.app.locals,
                    ...output.context
                };

                // Render the HTML template to a string
                nunjucks.render(
                    output.templates.pdf,
                    context,
                    (renderErr, html) => {
                        if (renderErr) {
                            next(renderErr);
                        } else {
                            // Turn HTML into a PDF
                            pdf.create(html, {
                                format: 'A4',
                                base: config.get('domains.base'),
                                border: '40px',
                                zoomFactor: '0.7'
                            }).toBuffer((pdfError, buffer) => {
                                if (pdfError) {
                                    next(pdfError);
                                }

                                // Write the file locally so we can look it up next time instead of rendering
                                fs.writeFile(filePath, buffer, writeError => {
                                    if (writeError) {
                                        next(writeError);
                                    }
                                    // Give the user the file directly
                                    return res.download(filePath, fileName);
                                });
                            });
                        }
                    }
                );
            });
        } else {
            // Render a standard HTML page otherwise
            return res.render(output.templates.html, output.context);
        }
    });

    return router;
};
