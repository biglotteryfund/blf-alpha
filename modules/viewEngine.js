'use strict';

const nunjucks = require('nunjucks');
const moment = require('moment');
const slugify = require('slugify');
const assets = require('./assets');
const appData = require('./appData');

function init(app) {
    const templateEnv = nunjucks.configure('views', {
        autoescape: true,
        express: app,
        noCache: appData.isDev,
        watch: appData.isDev
    });

    // register template filters first
    templateEnv.addFilter('getCachebustedPath', str => {
        return assets.getCachebustedPath(str);
    });

    templateEnv.addFilter('getImagePath', str => {
        return assets.getImagePath(str);
    });

    templateEnv.addFilter('localeify', (field, locale) => {
        return field + '_' + locale;
    });

    templateEnv.addFilter('slugify', str => {
        return slugify(str, {
            lower: true
        });
    });

    // @TODO: This feels awkward, is there an alternative?
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

    templateEnv.addFilter('dateFormat', (str, format) => {
        return moment(str).format(format);
    });

    templateEnv.addFilter('mailto', str => {
        return `<a href="mailto:${str}">${str}</a>`;
    });

    templateEnv.addFilter('numberWithCommas', str => {
        return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });

    // via http://stackoverflow.com/a/25770787
    templateEnv.addFilter('splitByCharLength', (str, length) => {
        let rows = [];
        let maxlen = length || 50;
        let arr = str.split(' ');
        let currow = arr[0];
        let rowlen = currow.length;
        for (let i = 1; i < arr.length; i++) {
            let word = arr[i];
            rowlen += word.length + 1;
            if (rowlen <= maxlen) {
                currow += ' ' + word;
            } else {
                rows.push(currow);
                currow = word;
                rowlen = word.length;
            }
        }
        rows.push(currow);
        return rows;
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

    app.set('view engine', 'njk');
    app.set('engineEnv', templateEnv);
}

module.exports = {
    init
};
