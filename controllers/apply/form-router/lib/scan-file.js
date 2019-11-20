'use strict';
const NodeClam = require('clamscan');

const { isDev } = require('../../../../common/appData');
const logger = require('../../../../common/logger').child({
    service: 'scan-file'
});

module.exports = async function scanFile(filePath) {
    logger.info(`Attempting virus scan for ${filePath}`);

    const clamscan = await new NodeClam().init({
        remove_infected: true,
        debug_mode: isDev,
        scan_recursively: false,
        clamdscan: {
            socket: process.env.CLAMDSCAN_SOCKET || '/var/run/clamav/clamd.ctl',
            timeout: 120000,
            local_fallback: true,
            path: process.env.CLAMDSCAN_PATH || '/var/lib/clamav',
            config_file:
                process.env.CLAMDSCAN_CONFIG_FILE || '/etc/clamav/clamd.conf'
        }
    });

    const { is_infected, viruses } = await clamscan.scan_file(filePath);

    if (is_infected) {
        logger.error(`Virus scan failed, file INFECTED`, { filePath, viruses });
    } else {
        logger.info(`Virus scan OK`, { filePath });
    }

    return { is_infected, viruses };
};
