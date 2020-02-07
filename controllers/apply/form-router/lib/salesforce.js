'use strict';
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
    describeObject(name) {
        return this.get(
            `/services/data/${this.apiVersion}/sobjects/${name}/describe`
        );
    }
    postJson(urlPath, body) {
        return request.post({
            url: `${this.apiUrl}${urlPath}`,
            headers: this.headers,
            json: true,
            body: body
        });
    }
    getFundingRequestStatus(formDataSalesforceId) {
        return this.get(
            `/services/data/${this.apiVersion}/query?q=${encodeURIComponent(
                `SELECT Funding_Request__r.Status__c FROM Form_Data__c WHERE ID='${formDataSalesforceId}'`
            )}`
        ).then(function(result) {
            if (result.records.length > 0) {
                const rawStatus =
                    result.records[0]['Funding_Request__r']['Status__c'];

                let friendlyStatus = 'Unknown';
                switch (rawStatus) {
                    case 'Idea':
                    case 'Invited to apply':
                    case 'Application Received':
                        friendlyStatus = 'In progress';
                        break;
                    case 'Initial Checks':
                    case 'Assessment in Progress':
                    case 'Recommendation Made':
                    case 'Authenticity Checks':
                        friendlyStatus = 'In assessment';
                        break;
                    case 'Offer':
                    case 'Set up':
                    case 'Award':
                        friendlyStatus = 'Grant set-up';
                        break;
                    case 'Grant Active':
                    case 'Completed':
                        friendlyStatus = 'Grant active';
                        break;
                    case 'Withdrawn':
                    case 'Deferred':
                    case 'Unsuccessful':
                    case 'Transfer':
                        friendlyStatus = 'Grant unsuccessful';
                        break;
                }

                return friendlyStatus;
            } else {
                return null;
            }
        });
    }
    submitFormData({ application, meta }) {
        return this.postJson('/services/apexrest/FormData/', {
            meta: meta,
            application: application
        });
    }
    async contentVersion({ recordId, attachmentName, versionData }) {
        return request.post({
            url: `${this.apiUrl}/services/data/${this.apiVersion}/sobjects/ContentVersion`,
            headers: this.headers,
            formData: {
                entity_content: {
                    value: JSON.stringify({
                        FirstPublishLocationId: recordId,
                        ReasonForChange: `Application attachment ${attachmentName}`,
                        PathOnClient: attachmentName
                    }),
                    options: {
                        contentType: 'application/json'
                    }
                },
                VersionData: versionData
            }
        });
    }
}

async function authorise() {
    const AUTH_URL = `https://${SALESFORCE_AUTH.apiUrl}/services/oauth2/token`;
    const resultJson = await request.post({
        url: AUTH_URL,
        json: true,
        form: {
            grant_type: 'password',
            client_id: SALESFORCE_AUTH.consumerKey,
            client_secret: SALESFORCE_AUTH.consumerSecret,
            username: SALESFORCE_AUTH.username,
            password: `${SALESFORCE_AUTH.password}${SALESFORCE_AUTH.token}`
        }
    });

    return new Salesforce(resultJson.instance_url, resultJson.access_token);
}

function checkStatus() {
    return request({
        url: `https://api.status.salesforce.com/v1/instances/${SALESFORCE_AUTH.instanceId}/status`,
        json: true,
        timeout: 3000
    });
}

module.exports = {
    authorise,
    checkStatus
};
