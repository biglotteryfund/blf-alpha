'use strict';

const https = require('https');
const util = require('util');

const formatFields = function(string) {
    let message = JSON.parse(string),
        fields = [],
        deploymentOverview;

    // Make sure we have a valid response
    if (message) {
        fields = [
            {
                title: 'Task',
                value: message.eventTriggerName,
                short: true
            },
            {
                title: 'Status',
                value: message.status,
                short: true
            },
            {
                title: 'Application',
                value: message.applicationName,
                short: true
            },
            {
                title: 'Deployment Group',
                value: message.deploymentGroupName,
                short: true
            },
            {
                title: 'Region',
                value: message.region,
                short: true
            },
            {
                title: 'Deployment Id',
                value: message.deploymentId,
                short: true
            },
            {
                title: 'Create Time',
                value: message.createTime,
                short: true
            },
            {
                title: 'Complete Time',
                value: message.completeTime ? message.completeTime : '',
                short: true
            }
        ];

        if (message.deploymentOverview) {
            deploymentOverview = JSON.parse(message.deploymentOverview);

            fields.push(
                {
                    title: 'Succeeded',
                    value: deploymentOverview.Succeeded,
                    short: true
                },
                {
                    title: 'Failed',
                    value: deploymentOverview.Failed,
                    short: true
                },
                {
                    title: 'Skipped',
                    value: deploymentOverview.Skipped,
                    short: true
                },
                {
                    title: 'In Progress',
                    value: deploymentOverview.InProgress,
                    short: true
                },
                {
                    title: 'Pending',
                    value: deploymentOverview.Pending,
                    short: true
                }
            );
        }
    }

    return fields;
};

const postToSlack = (title, fields, severity) => {
    const services = '/services/' + process.env.SLACK_SERVICE_KEY;
    const channel = '#builds';

    let postData = {
        channel: channel,
        username: 'AWS SNS via Lambda :: CodeDeploy Status',
        text: `*${title}*`,
        icon_emoji: ':aws:'
    };

    postData.attachments = [
        {
            color: severity,
            fields: fields
        }
    ];

    const options = {
        method: 'POST',
        hostname: 'hooks.slack.com',
        port: 443,
        path: services // Defined above
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function() {
                resolve('ok');
            });
        });

        req.on('error', function(e) {
            reject('Problem with request: ' + e.message);
        });

        req.write(util.format('%j', postData));
        req.end();
    });
};

const postToMicrosoftTeams = (title, fields, severity) => {
    const path = `/webhook/${process.env.MS_TEAMS_WEBHOOK}`;

    // severity string : hex colour
    const messageColours = {
        good: '37b787',
        danger: 'c82736',
        warning: 'd99f43'
    };

    const cardData = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        summary: 'Deployment update',
        themeColor: messageColours[severity] || messageColours.good,
        title: title,
        sections: [
            {
                facts: fields.map(f => {
                    return {
                        name: f.title,
                        value: f.value
                    };
                })
            }
        ]
    };

    const json = JSON.stringify(cardData);

    const options = {
        method: 'POST',
        hostname: 'outlook.office.com',
        port: 443,
        path: path,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Content-Length': json.length
        }
    };

    return new Promise((resolve, reject) => {
        let req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('end', function() {
                resolve('ok');
            });
        });

        req.on('error', function(e) {
            console.log('error', e.message);
            reject('Problem with request: ' + e.message);
        });

        req.write(json);
        req.end();
    });
};

exports.handler = function(event, context) {
    let fields = formatFields(event.Records[0].Sns.Message);
    let message = event.Records[0].Sns.Message;
    let title = event.Records[0].Sns.Subject;
    let severity = 'good';

    let dangerMessages = [
        ' but with errors',
        ' to RED',
        'During an aborted deployment',
        'FAILED',
        'Failed to deploy application',
        'Failed to deploy configuration',
        'has a dependent object',
        'is not authorized to perform',
        'Pending to Degraded',
        'Stack deletion failed',
        'Unsuccessful command execution',
        'You do not have permission',
        'Your quota allows for 0 more running instance'
    ];

    let warningMessages = [
        ' aborted operation.',
        ' to YELLOW',
        'Adding instance ',
        'Degraded to Info',
        'Deleting SNS topic',
        'is currently running under desired capacity',
        'Ok to Info',
        'Ok to Warning',
        'Pending Initialization',
        'Removed instance ',
        'Rollback of environment'
    ];

    for (let dangerMessagesItem in dangerMessages) {
        if (message.indexOf(dangerMessages[dangerMessagesItem]) !== -1) {
            severity = 'danger';
            break;
        }
    }

    // Only check for warning messages if necessary
    if (severity === 'good') {
        for (let warningMessagesItem in warningMessages) {
            if (message.indexOf(warningMessages[warningMessagesItem]) !== -1) {
                severity = 'warning';
                break;
            }
        }
    }

    // post to Slack and Teams
    const notifications = [postToSlack(title, fields, severity), postToMicrosoftTeams(title, fields, severity)];

    Promise.all(notifications).then(() => {
        context.done(null);
    });
};
