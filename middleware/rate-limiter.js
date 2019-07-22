'use strict';
const {
    RateLimiterMySQL,
    RateLimiterMemory
} = require('rate-limiter-flexible');
const { startsWith } = require('lodash');

const { sequelize } = require('../db/models/index');
const appData = require('../common/appData');
const logger = require('../common/logger').child({
    service: 'rate-limiter'
});

const sqlDialect = startsWith(process.env.DB_CONNECTION_URI, 'sqlite://')
    ? 'sqlite'
    : 'mysql';

const rateLimiterConfigs = {
    failByUsername: {
        maxPoints: 5,
        keyPrefix: 'login_fail_consecutive_username',
        duration: 60 * 60 * 3, // Points will expire after 3 hours
        blockDuration: 60 * 15 // Exceeding points locks user out for 15 minutes
    }
};

// We have to create all the ratelimiter db instances here
// so the tables exist and are ready when the middleware is used.
// We also need to be able to access the maxPoints
// within the class below (which this API doesn't expose)
// so we set it here as a property against the ratelimiter object
let availableRateLimiters = {};
for (let confName in rateLimiterConfigs) {
    const conf = rateLimiterConfigs[confName];
    availableRateLimiters[confName] = {
        id: confName,
        config: conf,
        instance:
            sqlDialect === 'mysql'
                ? new RateLimiterMySQL({
                      storeClient: sequelize,
                      dbName: `rate_limiter_${appData.environment}`,
                      tableName: 'rate_limiter',
                      keyPrefix: conf.keyPrefix,
                      points: conf.maxPoints,
                      duration: conf.duration,
                      blockDuration: conf.blockDuration
                  })
                : new RateLimiterMemory({
                      keyPrefix: conf.keyPrefix,
                      points: conf.maxPoints,
                      duration: conf.duration,
                      blockDuration: conf.blockDuration
                  })
    };
}

class RateLimiter {
    constructor(limiterConf, keyValue) {
        this.maxPoints = limiterConf.maxPoints;
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
                this.limiterConf.config.maxPoints;
        if (isRateLimited) {
            logger.warn('User rate limited', {
                rateLimiter: this.limiterConf.id,
                uniqueKey: this.keyValue,
                consumedPoints: this.limiterInstance.consumedPoints,
                maximumPoints: this.limiterConf.config.maxPoints
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
