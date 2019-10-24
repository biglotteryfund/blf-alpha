'use strict';
const path = require('path');
const express = require('express');
const { concat, get, set, startsWith } = require('lodash');

const {
    injectBreadcrumbs,
    injectListingContent,
    injectStrategicProgramme,
    setCommonLocals
} = require('../../common/inject-content');
const contentApi = require('../../common/content-api');

const router = express.Router();

router.use(injectBreadcrumbs, (req, res, next) => {
    const routerCrumb = {
        label: req.i18n.__('funding.strategics.title'),
        url: req.baseUrl
    };
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, [routerCrumb]);
    next();
});

router.get('/', injectListingContent, async function(req, res, next) {
    try {
        res.render(path.resolve(__dirname, './views/strategic-investments'), {
            strategicProgrammes: await contentApi.getStrategicProgrammes({
                locale: req.i18n.getLocale(),
                requestParams: req.query
            })
        });
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

router.get('/:slug/:childPageSlug?', injectStrategicProgramme, function(
    req,
    res,
    next
) {
    const { currentPath, strategicProgramme } = res.locals;
    /* Only render if not using an external path */
    if (
        strategicProgramme &&
        startsWith(currentPath, strategicProgramme.linkUrl)
    ) {
        // Render a plain content page if specified
        if (get(strategicProgramme, 'entryType') === 'contentPage') {
            setCommonLocals({ res, entry: strategicProgramme });
            set(
                res.locals,
                'content.flexibleContent',
                strategicProgramme.content
            );
            let breadcrumbs;

            if (strategicProgramme.parent) {
                const parentProgrammeCrumb = {
                    label: strategicProgramme.parent.title,
                    url: strategicProgramme.parent.linkUrl
                };
                breadcrumbs = concat(res.locals.breadcrumbs, [
                    parentProgrammeCrumb,
                    { label: res.locals.title }
                ]);
            } else {
                breadcrumbs = concat(res.locals.breadcrumbs, [
                    { label: res.locals.title }
                ]);
            }

            res.render(
                path.resolve(__dirname, '../common/views/flexible-content'),
                {
                    breadcrumbs: breadcrumbs,
                    flexibleContent: strategicProgramme.content
                }
            );
        } else {
            // Render a standard Strategic page
            res.render(path.resolve(__dirname, './views/strategic-programme'), {
                breadcrumbs: concat(res.locals.breadcrumbs, {
                    label: res.locals.title
                })
            });
        }
    } else {
        next();
    }
});

module.exports = router;
