'use strict';
const { RateLimiterMySQL } = require('rate-limiter-flexible');

const { sequelize } = require('../db/models/index');

const appData = require('../common/appData');
const logger = require('../common/logger').child({
    service: 'rate-limiter'
});

const maxFailedLoginAttemptsPerUser = 5;

const rateLimiterConfigs = {
    failByUsername: new RateLimiterMySQL({
        storeClient: sequelize,
        dbName: `rate_limiter_${appData.environment}`,
        tableName: 'rate_limiter',
        keyPrefix: 'login_fail_consecutive_username',
        points: maxFailedLoginAttemptsPerUser,
        duration: 60 * 60 * 3, // Store number for three hours since first fail
        blockDuration: 60 * 15 // Block for 15 minutes
    })
};

class RateLimiter {
    constructor(confName, keyValue) {
        this.keyValue = keyValue;
        this.confName = confName;
        this.limiter = rateLimiterConfigs[this.confName];
    }

    async getLimiter() {
        const limiter = this.limiter.get(this.keyValue);
        return {
            isRateLimited:
                limiter !== null &&
                limiter.consumedPoints > maxFailedLoginAttemptsPerUser,
            hasConsumedPoints: limiter !== null && limiter.consumedPoints > 0,
            limiter: limiter
        };
    }

    async clearRateLimit() {
        return this.limiter.delete(this.keyValue);
    }

    async consumeRateLimit() {
        return this.limiter.consume(this.keyValue);
    }
}

module.exports = {
    RateLimiter
};
