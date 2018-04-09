const moment = require('moment');
const appData = require('../../modules/appData');
const cached = require('../../middleware/cached');

const LAUNCH_DATE = moment();

module.exports = [
    cached.noCache,
    (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        res.json({
            APP_ENV: appData.environment,
            DEPLOY_ID: appData.deployId,
            COMMIT_ID: appData.commitId,
            BUILD_NUMBER: appData.buildNumber,
            START_DATE: LAUNCH_DATE.format('dddd, MMMM Do YYYY, h:mm:ss a'),
            UPTIME: LAUNCH_DATE.toNow(true)
        });
    }
];
