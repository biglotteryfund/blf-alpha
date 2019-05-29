'use strict';
const request = require('request-promise-native');
const { SALESFORCE_AUTH } = require('../../../common/secrets');

class Salesforce {
    constructor(url, token) {
        this.url = url;
        this.headers = { Authorization: `Bearer ${token}` };
    }
    get(urlPath) {
        return request.get({
            uri: `${this.url}${urlPath}`,
            headers: this.headers,
            json: true
        });
    }
    post(urlPath, body) {
        return request.post({
            uri: `${this.url}${urlPath}`,
            headers: this.headers,
            json: true,
            body: body
        });
    }
    submitFormData(data) {
        return this.post('/services/apexrest/FormData/', data);
    }
}

async function authorise() {
    const AUTH_URL = `https://${SALESFORCE_AUTH.API_URL}/services/oauth2/token`;
    const resultJson = await request.post(AUTH_URL, {
        json: true,
        form: {
            grant_type: 'password',
            client_id: SALESFORCE_AUTH.CONSUMER_KEY,
            client_secret: SALESFORCE_AUTH.CONSUMER_SECRET,
            username: SALESFORCE_AUTH.USERNAME,
            password: `${SALESFORCE_AUTH.PASSWORD}${SALESFORCE_AUTH.TOKEN}`
        }
    });

    return new Salesforce(resultJson.instance_url, resultJson.access_token);
}

module.exports = {
    authorise
};
