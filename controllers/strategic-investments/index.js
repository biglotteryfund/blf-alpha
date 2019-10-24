'use strict';
const path = require('path');
const express = require('express');
const get = require('lodash/get');
const set = require('lodash/set');

const {
    injectBreadcrumbs,
    injectListingContent,
    setCommonLocals
} = require('../../common/inject-content');
const contentApi = require('../../common/content-api');

const router = express.Router();

router.use(injectBreadcrumbs, (req, res, next) => {
    res.locals.breadcrumbs = res.locals.breadcrumbs.concat([
        {
            label: req.i18n.__('funding.strategics.title'),
            url: req.baseUrl
        }
    ]);
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

async function injectStrategicProgramme(req, res, next) {
    try {
        // Assumes a parameter of :slug and :childPageSlug? in the request
        const { slug, childPageSlug } = req.params;
        if (slug) {
            const querySlug = childPageSlug ? `${slug}/${childPageSlug}` : slug;

            const entry = await contentApi.getStrategicProgrammes({
                slug: querySlug,
                locale: req.i18n.getLocale(),
                requestParams: req.query
            });

            res.locals.strategicProgramme = entry;
            setCommonLocals({ res, entry });
        }
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

router.get('/:slug/:childPageSlug?', injectStrategicProgramme, function(
    req,
    res,
    next
) {
    const { strategicProgramme } = res.locals;
    // Render a plain content page if specified
    if (get(strategicProgramme, 'entryType') === 'contentPage') {
        setCommonLocals({ res, entry: strategicProgramme });
        set(res.locals, 'content.flexibleContent', strategicProgramme.content);

        const breadcrumbs = strategicProgramme.parent
            ? res.locals.breadcrumbs.concat([
                  {
                      label: strategicProgramme.parent.title,
                      url: strategicProgramme.parent.linkUrl
                  },
                  { label: res.locals.title }
              ])
            : res.locals.breadcrumbs.concat([{ label: res.locals.title }]);

        res.render(
            path.resolve(__dirname, '../common/views/flexible-content'),
            {
                breadcrumbs: breadcrumbs,
                flexibleContent: strategicProgramme.content
            }
        );
    } else if (strategicProgramme) {
        // Render a standard Strategic page
        res.render(path.resolve(__dirname, './views/strategic-programme'), {
            breadcrumbs: res.locals.breadcrumbs.concat({
                label: res.locals.title
            })
        });
    } else {
        next();
    }
});

module.exports = router;
