'use strict';
const app = require('../../server');
const nunjucks = require('nunjucks');
const moment = require('moment');
const assets = require('../assets');

const IS_DEV = (process.env.NODE_ENV || 'dev') === 'dev';

const templateEnv = nunjucks.configure('views', {
    autoescape: true,
    express: app,
    noCache: IS_DEV,
    watch: IS_DEV
});

// register template filters first
templateEnv.addFilter('getCachebustedPath', function (str) {
    return assets.getCachebustedPath(str);
});

templateEnv.addFilter('localeify', function (field, locale) {
    return field + '_' + locale;
});

templateEnv.addFilter('makePhoneLink', function (str) {
    let callable = str.replace(/ /g, '');
    return `<a href="tel:${callable}" class="is-phone-link">${str}</a>`;
});

templateEnv.addFilter('dateFormat', function (str, format) {
    return moment(str).format(format);
});

// via http://stackoverflow.com/a/25770787
templateEnv.addFilter('splitByCharLength', function (str, length) {
    let rows = [];
    let maxlen = length || 50;
    let arr = str.split(" ");
    let currow = arr[0];
    let rowlen = currow.length;
    for (let i = 1; i < arr.length; i++) {
        let word = arr[i];
        rowlen += word.length + 1;
        if (rowlen <= maxlen) {
            currow += " " + word;
        } else {
            rows.push(currow);
            currow = word;
            rowlen = word.length;
        }
    }
    rows.push(currow);
    return rows;
});

templateEnv.addFilter('lowercaseFirst', function (str) {
    return str[0].toLowerCase() + str.substring(1);
});

app.use((req, res, next) => {
    templateEnv.addGlobal('request', req);
    next();
});

app.set('view engine', 'njk');
app.set('engineEnv', templateEnv);