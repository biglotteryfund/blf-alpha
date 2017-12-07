#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const _ = require('lodash');
const googleAuth = require('google-auth-library');
const Gmail = require('node-gmail-api');
const moment = require('moment');

const models = require('../../models/index');

// https://console.developers.google.com/apis/credentials?project=just-rhythm-186214

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile(path.join('./bin/scripts', 'gmail_secrets.json'), function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the Gmail API.
    authorize(JSON.parse(content), getMail);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const auth = new googleAuth();
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

function base64toUTF8(str) {
    return new Buffer(str, 'base64').toString('utf8');
}

function camelize(str) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
        })
        .replace(/\s+/g, '');
}

let allOrders = [];
let numMessagesToFetch = 1000;

function getMail(auth) {
    const gmail = new Gmail(auth.credentials.access_token);
    const getMessages = gmail.messages('subject:Order from Big Lottery Fund website', { max: numMessagesToFetch });
    getMessages.on('data', function(d) {
        if (d.payload.body.data) {
            let re = /The order details are below:([\s\S]*)The customer's personal details are below:([\s\S]*)This email has been automatically generated from the Big Lottery Fund Website/;
            let body = base64toUTF8(d.payload.body.data);
            let subject = d.payload.headers.find(_ => _.name === 'Subject').value;
            let bits = body.match(re);
            let order = bits[1].trim();
            let address = bits[2].trim();
            order = order
                .replace(/\t/g, '')
                .replace(/- /g, '')
                .replace(/\(.*\)/g, '')
                .split('\n')
                .map(_ => _.trim());

            let orders = order
                .map(o => {
                    let q = o.match(/x(\d+)/);
                    let i = o.match(/(\w+-\w+)/);
                    if (q && i) {
                        return {
                            quantity: q[1],
                            item: i[1]
                        };
                    } else {
                        return {
                            error: true
                        };
                    }
                })
                .filter(_ => !_.error);

            let a = {};
            address = address
                .replace(/\t/g, '')
                .replace(/\r/g, '')
                .split('\n');
            address.forEach(line => {
                let bits = line.split(':');
                if (bits[1]) {
                    let fieldName = bits[0];
                    fieldName = fieldName.replace('Your ', '');
                    fieldName = camelize(fieldName);
                    a[fieldName] = bits[1].trim();
                }
            });

            let timestamp = subject.match(/Order from Big Lottery Fund website - (.*)/);

            let data = {
                items: orders,
                address: a,
                time: timestamp[1]
            };

            if (orders.length > 0) {
                allOrders.push(data);
                console.log(`Added order for ${a['name']} on ${timestamp[1]}`);
            } else {
                console.log(`** Empty order for ${a['name']} on ${timestamp[1]}`);
            }
            console.log('====');
        } else {
            console.log('Missing payload data');
        }
    });

    getMessages.on('finish', () => {
        let dataPath = path.join('./', 'messages.json');
        fs.writeFile(dataPath, JSON.stringify(allOrders, null, 4));

        let convertMessageToOrder = (msg) => {
            let grantAmount = msg.address.grantAmount.toLowerCase()
                .replace(/£/g, '')
                .replace('$', '')
                .replace(/ /g, '')
                .replace(/,/g, '')
                .replace(/"/g, '')
                .replace(/'/g, '')
                .replace('million', 'm')
                .replace('k', '000');

            // remove trailing decimal (eg. .23 from 32243.23)
            // some people entered multiple decimal points (432.342.23)
            // so we need to remove any other decimals after this
            let decimalRegex = /(\.(\d{1,2})$)/;
            let hasDecimal = grantAmount.match(decimalRegex);
            if (hasDecimal) {
                grantAmount = grantAmount.replace(hasDecimal[1], '');
            }

            let millionRegex = /(\d+\.?\d?)m/;
            let hasMillions = grantAmount.match(millionRegex);

            if (hasMillions) {
                grantAmount = parseFloat(hasMillions[1]) * 1000000;
            } else {
                // remove any additional dots
                grantAmount = grantAmount.replace(/\./g, '');
                grantAmount = parseFloat(grantAmount);
            }

            // drop the decimals
            grantAmount = Math.round(Number(grantAmount));

            let postcodeArea = msg.address.postcode.replace(/ /g, '').toUpperCase();
            if (postcodeArea.length > 3) {
                postcodeArea = postcodeArea.slice(0, -3); // trim final 3 chars
            }

            let dateFormat = 'dddd, MMMM Do YYYY, h:mm:ss a';
            let orderDate = moment(msg.time, dateFormat);
            let mysqlFormat = 'YYYY-MM-DD HH:mm:ss';
            orderDate = orderDate.format(mysqlFormat);

            let orderItems = msg.items.map(item => {
                return {
                    code: item.item,
                    quantity: item.quantity,
                    createdAt: orderDate,
                    updatedAt: orderDate
                };
            });

            return {
                grantAmount: grantAmount,
                postcodeArea: postcodeArea,
                items: orderItems,
                createdAt: orderDate,
                updatedAt: orderDate
            };
        };

        let ordersForDb = allOrders.map(convertMessageToOrder)
            .filter(o => _.isInteger(o.grantAmount) && o.grantAmount > 1);

        let delay = 300;
        ordersForDb.forEach((order, i) => {
            setTimeout(() => {
                models.Order
                    .create(order, {
                        include: [
                            {
                                model: models.OrderItem,
                                as: 'items'
                            }
                        ]
                    })
                    .then(data => {
                        console.log(data.postcodeArea, 'added!');
                    })
                    .catch(err => {
                        console.log(err, 'error!');
                    });
            }, delay * i);
        });

    });
}
