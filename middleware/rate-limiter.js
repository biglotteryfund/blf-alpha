'use strict';
const {
    RateLimiterMySQL,
    RateLimiterMemory
} = require('rate-limiter-flexible');
const moment = require('moment');
const { get } = require('lodash');

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
            dbName: `rate_limiter`,
            tableName: `rate_limiter_${appData.environment}`,
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
        this.maxPoints = limiterConf.config.maxPoints;
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
        // This is sometimes null when the first request comes in
        const consumedPoints = get(this.limiterInstance, 'consumedPoints', 0);

        const isRateLimited =
            this.limiterInstance !== null && consumedPoints > this.maxPoints;
        if (isRateLimited) {
            logger.warn('User rate limited', {
                rateLimiter: this.limiterConf.id,
                uniqueKey: this.keyValue,
                consumedPoints: consumedPoints,
                maximumPoints: this.maxPoints
            });
        }
        return isRateLimited;
    }

    minutesTillNextAllowedAttempt() {
        if (!this.limiterInstance) {
            return null;
        }
        const retrySecs =
            Math.round(this.limiterInstance.msBeforeNext / 1000) || 1;
        const expiry = moment().add(retrySecs, 'seconds');
        const now = moment();
        return expiry.diff(now, 'minutes');
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
