const Twitter = require('twitter');
const twitterText = require('twitter-text');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

let latestTweets = [];

// 1 hour refresh rate
const refreshInterval = 1 * 60 * 60 * 1000; // ms

// try to get config from dev env first
let twitterConfig = {
    key: process.env.TWITTER_KEY,
    secret: process.env.TWITTER_SECRET,
    token_key: process.env.TWITTER_TOKEN_KEY,
    token_secret: process.env.TWITTER_TOKEN_SECRET
};

try {
    // load non-dev credentials from AWS store (if found)
    twitterConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/twitter.json'), 'utf8'));
} catch (e) {
    console.info('twitter.json not found -- are you in DEV mode?');
}

const twitterClient = new Twitter({
    consumer_key: twitterConfig.key,
    consumer_secret: twitterConfig.secret,
    access_token_key: twitterConfig.token_key,
    access_token_secret: twitterConfig.token_secret
});

const cleanupTweet = (tweet) => {
    const TWITTER_DATE_FORMAT = 'ddd MMM DD HH:mm:ss ZZ YYYY';
    tweet.datePosted = moment(tweet.created_at, TWITTER_DATE_FORMAT);
    tweet.html = twitterText.autoLink(tweet.text, {
        urlEntities: tweet.entities.urls
    });
    return tweet;
};

const fetchTweets = () => {
    console.log('Fetching tweets...');
    let getLatestTweets = twitterClient.get('statuses/user_timeline', {
        screen_name: 'biglotteryfund',
        count: 20, // include retweets even if they're excluded
        trim_user: true,
        exclude_replies: true,
        include_rts: false
    });
    getLatestTweets.then((data) => {
        console.log('Got some tweets');
        data = data.map(cleanupTweet);
        latestTweets = data;
    }).catch((err) => {
        console.error('Error fetching tweets', {
            error: err
        });
    });
};

const initInterval = () => {
    console.log('Starting interval timer');
    fetchTweets(); // start off first one
    setInterval(fetchTweets, refreshInterval);
};

const getLatestTweets = () => {
    return latestTweets;
};

module.exports = {
    fetchTweets,
    initInterval,
    getLatestTweets
};
