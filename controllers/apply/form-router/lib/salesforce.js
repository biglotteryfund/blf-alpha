'use strict';
const got = require('got');
const FormData = require('form-data');
const { SALESFORCE_AUTH } = require('../../../../common/secrets');

class Salesforce {
    constructor(apiUrl, accessToken) {
        this.apiVersion = 'v45.0';

        this.query = got.extend({
            prefixUrl: apiUrl,
            headers: {
                'authorization': `Bearer ${accessToken}`,
                'user-agent': 'tnlcf-salesforce',
            },
        });
    }

    submitFormData({ application, meta }) {
        return this.query
            .post('services/apexrest/FormData/', {
                body: { meta, application },
            })
            .json();
    }

    contentVersion({ recordId, attachmentName, versionData }) {
        const form = new FormData();
        form.append(
            'entity_content',
            JSON.stringify({
                FirstPublishLocationId: recordId,
                ReasonForChange: `Application attachment ${attachmentName}`,
                PathOnClient: attachmentName,
            }),
            { contentType: 'application/json' }
        );
        form.append('VersionData', versionData.value, versionData.options);

        return this.query.post(
            `services/data/${this.apiVersion}/sobjects/ContentVersion`,
            { body: form }
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
    const statusUrl = `https://api.status.salesforce.com/v1/instances/${SALESFORCE_AUTH.instanceId}/status`;
    return got.get(statusUrl, { timeout: 3000 }).json();
}

module.exports = {
    authorise,
    checkStatus,
};
