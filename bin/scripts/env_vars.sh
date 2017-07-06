#!/bin/bash
set -e

# get secrets from parameter store
# @TODO make this programmatic

# SES email params
SES_PASSWORD=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.password --with-decryption --query 'Parameters[0].Value')
SES_PASSWORD=`echo $SES_PASSWORD | sed -e 's/^"//' -e 's/"$//'`
SES_USER=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.user --with-decryption --query 'Parameters[0].Value')
SES_USER=`echo $SES_USER | sed -e 's/^"//' -e 's/"$//'`

# twitter API params
TWITTER_KEY=$(aws ssm get-parameters --region eu-west-1 --names twitter.auth.key --with-decryption --query 'Parameters[0].Value')
TWITTER_KEY=`echo $TWITTER_KEY | sed -e 's/^"//' -e 's/"$//'`
TWITTER_SECRET=$(aws ssm get-parameters --region eu-west-1 --names twitter.auth.secret --with-decryption --query 'Parameters[0].Value')
TWITTER_SECRET=`echo $TWITTER_SECRET | sed -e 's/^"//' -e 's/"$//'`
TWITTER_TOKEN_KEY=$(aws ssm get-parameters --region eu-west-1 --names twitter.auth.token.key --with-decryption --query 'Parameters[0].Value')
TWITTER_TOKEN_KEY=`echo $TWITTER_TOKEN_KEY | sed -e 's/^"//' -e 's/"$//'`
TWITTER_TOKEN_SECRET=$(aws ssm get-parameters --region eu-west-1 --names twitter.auth.token.secret --with-decryption --query 'Parameters[0].Value')
TWITTER_TOKEN_SECRET=`echo $TWITTER_TOKEN_SECRET | sed -e 's/^"//' -e 's/"$//'`

# write secrets to file

# store email/SES
mailconfigfile=/var/www/biglotteryfund/config/mail.json
touch $mailconfigfile
if [ -f "$mailconfigfile" ]
then
    echo "{ \"user\": \"$SES_USER\", \"password\": \"$SES_PASSWORD\" }" > "$mailconfigfile"
fi

# store twitter auth
twitterconfigfile=/var/www/biglotteryfund/config/twitter.json
touch $twitterconfigfile
if [ -f "$twitterconfigfile" ]
then
    echo "{ \"key\": \"$TWITTER_KEY\", \"secret\": \"$TWITTER_SECRET\", \"token_key\": \"$TWITTER_TOKEN_KEY\", \"token_secret\": \"$TWITTER_TOKEN_SECRET\",  }" > "$twitterconfigfile"
fi