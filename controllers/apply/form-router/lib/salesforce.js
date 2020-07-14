'use strict';
const got = require('got');
const FormData = require('form-data');

const { SALESFORCE_AUTH } = require('../../../../common/secrets');
const logger = require('../../../../common/logger');

class Salesforce {
    constructor(apiUrl, accessToken) {
        this.apiUrl = apiUrl;
        this.apiVersion = 'v45.0';
        this.headers = {
            'Authorization': `Bearer ${accessToken}`,
            'user-agent': 'tnlcf-www',
        };

        this.querySalesforce = got.extend({
            prefixUrl: this.apiUrl,
            headers: this.headers,
            hooks: {
                beforeRequest: [
                    function (options) {
                        logger.debug(
                            `Calling Salesforce API: ${options.url.href}`
                        );
                    },
                ],
            },
        });
    }
    get(urlPath) {
        return this.querySalesforce(urlPath).json();
    }
    postJson(urlPath, body) {
        return this.querySalesforce
            .post(urlPath, {
                json: body,
            })
            .json();
    }
    submitFormData({ application, meta }) {
        return this.postJson('services/apexrest/FormData/', {
            meta: meta,
            application: application,
        });
    }
    async contentVersion({ recordId, attachmentName, versionData }) {
        const fileData = {
            value: JSON.stringify({
                FirstPublishLocationId: recordId,
                ReasonForChange: `Application attachment ${attachmentName}`,
                PathOnClient: attachmentName,
            }),
            options: {
                contentType: 'application/json',
            },
        };
        const form = new FormData();
        form.append('entity_content', fileData.value, fileData.options);
        form.append('VersionData', versionData.value, versionData.options);

        return this.querySalesforce.post(
            `services/data/${this.apiVersion}/sobjects/ContentVersion`,
            {
                body: form,
            }
        );
    }
}

async function authorise() {
    const AUTH_URL = `https://${SALESFORCE_AUTH.apiUrl}/services/oauth2/token`;
    const resultJson = await got
        .post(AUTH_URL, {
            form: {
                grant_type: 'password',
                client_id: SALESFORCE_AUTH.consumerKey,
                client_secret: SALESFORCE_AUTH.consumerSecret,
                username: SALESFORCE_AUTH.username,
                password: `${SALESFORCE_AUTH.password}${SALESFORCE_AUTH.token}`,
            },
        })
        .json();

    return new Salesforce(resultJson.instance_url, resultJson.access_token);
}

function checkStatus() {
    return got
        .get(
            `https://api.status.salesforce.com/v1/instances/${SALESFORCE_AUTH.instanceId}/status`,
            {
                timeout: 3000,
            }
        )
        .json();
}

module.exports = {
    authorise,
    checkStatus,
};
