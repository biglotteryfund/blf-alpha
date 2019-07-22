'use strict';
const { RateLimiterMySQL } = require('rate-limiter-flexible');

const { sequelize } = require('../db/models/index');
const appData = require('../common/appData');
const logger = require('../common/logger').child({
    service: 'rate-limiter'
});

const rateLimiterConfigs = {
    failByUsername: {
        maxFailedLoginAttempts: 5,
        keyPrefix: 'login_fail_consecutive_username',
        duration: 60 * 60 * 3, // Points will expire after 3 hours
        blockDuration: 60 * 15 // Exceeding points locks user out for 15 minutes
    }
};

// We have to create all the ratelimiter db instances here
// so the tables exist and are ready when the middleware is used.
// We also need to be able to access the maxFailedLoginAttempts
// within the class below (which this API doesn't expose)
// so we set it here as a property against the ratelimiter object
let availableRateLimiters = {};
for (let confName in rateLimiterConfigs) {
    const conf = rateLimiterConfigs[confName];
    availableRateLimiters[confName] = {
        id: confName,
        config: conf,
        instance: new RateLimiterMySQL({
            storeClient: sequelize,
            dbName: `rate_limiter_${appData.environment}`,
            tableName: 'rate_limiter',
            keyPrefix: conf.keyPrefix,
            points: conf.maxFailedLoginAttempts,
            duration: conf.duration,
            blockDuration: conf.blockDuration
        })
    };
}

class RateLimiter {
    constructor(limiterConf, keyValue) {
        this.maxFailedLoginAttempts = limiterConf.maxFailedLoginAttempts;
        this.limiterConf = limiterConf;
        this.limiter = limiterConf.instance;
        this.keyValue = keyValue;
        this.limiterInstance = null;
    }

    async init() {
        try {
            this.limiterInstance = await this.limiter.get(this.keyValue);
        } catch (e) {} // eslint-disable-line no-empty
        return this;
    }

    isRateLimited() {
        const isRateLimited =
            this.limiterInstance !== null &&
            this.limiterInstance.consumedPoints >
                this.limiterConf.config.maxFailedLoginAttempts;
        if (isRateLimited) {
            logger.warn('User rate limited', {
                rateLimiter: this.limiterConf.id,
                uniqueKey: this.keyValue,
                consumedPoints: this.limiterInstance.consumedPoints,
                maximumPoints: this.limiterConf.config.maxFailedLoginAttempts
            });
        }
        return isRateLimited;
    }

    hasConsumedPoints() {
        return (
            this.limiterInstance !== null &&
            this.limiterInstance.consumedPoints > 0
        );
    }

    async clearRateLimit() {
        return this.limiter.delete(this.keyValue);
    }

    async consumeRateLimit() {
        return this.limiter.consume(this.keyValue);
    }
}

module.exports = {
    RateLimiter,
    availableRateLimiters
};
