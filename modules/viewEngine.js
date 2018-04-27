'use strict';

const nunjucks = require('nunjucks');
const moment = require('moment');
const slugify = require('slugify');
const assets = require('./assets');
const appData = require('./appData');

/**
 * Add custom Nunjucks filters
 * @see https://mozilla.github.io/nunjucks/api.html#addfilter
 */
function initFilters(templateEnv) {
    templateEnv.addFilter('getCachebustedPath', str => {
        return assets.getCachebustedPath(str);
    });

    templateEnv.addFilter('getCachebustedRealPath', str => {
        return assets.getCachebustedRealPath(str);
    });

    templateEnv.addFilter('getImagePath', str => {
        return assets.getImagePath(str);
    });

    templateEnv.addFilter('slugify', str => {
        return slugify(str, {
            lower: true
        });
    });

    templateEnv.addFilter('joinIfArray', (xs, delimiter) => {
        if (Array.isArray(xs)) {
            return xs.join(delimiter);
        } else {
            return xs;
        }
    });

    templateEnv.addFilter('makePhoneLink', str => {
        let callable = str.replace(/ /g, '');
        return `<a href="tel:${callable}" class="is-phone-link">${str}</a>`;
    });

    templateEnv.addFilter('dateFormat', (str, format, locale = 'en') => {
        moment.locale(locale);
        return moment(str).format(format);
    });

    templateEnv.addFilter('timeFromNow', str => {
        return moment(str).fromNow();
    });

    templateEnv.addFilter('mailto', str => {
        return `<a href="mailto:${str}">${str}</a>`;
    });

    templateEnv.addFilter('numberWithCommas', str => {
        return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });

    templateEnv.addFilter('lowercaseFirst', str => {
        return str[0].toLowerCase() + str.substring(1);
    });

    templateEnv.addFilter('pluralise', (number, singular, plural) => {
        if (number === 1) {
            return singular;
        } else {
            return plural;
        }
    });
}

function init(app) {
    const templateEnv = nunjucks.configure('views', {
        autoescape: true,
        express: app,
        noCache: appData.isDev,
        watch: appData.isDev
    });

    initFilters(templateEnv);

    app.set('view engine', 'njk');
    app.set('engineEnv', templateEnv);
}

module.exports = {
    init
};
