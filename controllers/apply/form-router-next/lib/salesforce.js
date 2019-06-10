'use strict';
const path = require('path');
const request = require('request-promise-native');
const { SALESFORCE_AUTH } = require('../../../../common/secrets');

class Salesforce {
    constructor(apiUrl, accessToken) {
        this.apiUrl = apiUrl;
        this.apiVersion = 'v45.0';
        this.headers = { Authorization: `Bearer ${accessToken}` };
    }
    get(urlPath) {
        return request.get({
            uri: `${this.apiUrl}${urlPath}`,
            headers: this.headers,
            json: true
        });
    }
    postJson(urlPath, body) {
        return request.post({
            url: `${this.apiUrl}${urlPath}`,
            headers: this.headers,
            json: true,
            body: body
        });
    }
    submitFormData({ application, meta }) {
        return this.postJson('/services/apexrest/FormData/', {
            meta: meta,
            application: application
        });
    }
    contentVersion({ recordId, file, attachmentName }) {
        const originalFilename = path.basename(file.path);
        return request.post({
            url: `${this.apiUrl}/services/data/${
                this.apiVersion
            }/sobjects/ContentVersion`,
            headers: this.headers,
            formData: {
                entity_content: {
                    value: JSON.stringify({
                        FirstPublishLocationId: recordId,
                        ReasonForChange: `Application attachment ${originalFilename}`,
                        PathOnClient: attachmentName
                    }),
                    options: {
                        contentType: 'application/json'
                    }
                },
                VersionData: file
            }
        });
    }
}

async function authorise() {
    const AUTH_URL = `https://${SALESFORCE_AUTH.API_URL}/services/oauth2/token`;
    const resultJson = await request.post({
        url: AUTH_URL,
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
