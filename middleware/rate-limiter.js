'use strict';
const {
    RateLimiterMySQL,
    RateLimiterMemory
} = require('rate-limiter-flexible');

const { sequelize } = require('../db/models/index');
const appData = require('../common/appData');
const logger = require('../common/logger').child({
    service: 'rate-limiter'
});

const sqlDialect = sequelize.getDialect();

function rateLimiterFor(conf) {
    if (sqlDialect === 'mysql') {
        return new RateLimiterMySQL({
            storeClient: sequelize,
            dbName: `rate_limiter_${appData.environment}`,
            tableName: 'rate_limiter',
            keyPrefix: conf.keyPrefix,
            points: conf.maxPoints,
            duration: conf.duration,
            blockDuration: conf.blockDuration
        });
    } else {
        return new RateLimiterMemory({
            keyPrefix: conf.keyPrefix,
            points: conf.maxPoints,
            duration: conf.duration,
            blockDuration: conf.blockDuration
        });
    }
}

function makeRateLimiter(id, conf) {
    return {
        id: id,
        config: conf,
        instance: rateLimiterFor(conf)
    };
}

const rateLimiterConfigs = {
    failByUsername: makeRateLimiter('failByUsername', {
        maxPoints: 10,
        keyPrefix: 'login_fail_consecutive_username',
        duration: 60 * 60 * 3, // Points will expire after 3 hours
        blockDuration: 60 * 15 // Exceeding points locks user out for 15 minutes
    })
};

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
            this.limiterInstance.consumedPoints > this.maxPoints;
        if (isRateLimited) {
            logger.warn('User rate limited', {
                rateLimiter: this.limiterConf.id,
                uniqueKey: this.keyValue,
                consumedPoints: this.limiterInstance.consumedPoints,
                maximumPoints: this.maxPoints
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
    rateLimiterConfigs
};
