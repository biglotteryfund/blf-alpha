#!/bin/bash
set -e

# store deployment ID in a JSON file
deploy_file=/var/www/biglotteryfund/config/deploy.json
touch $deploy_file
if [ -f "$deploy_file" ]
then
    DEPLOY_PLACEHOLDER="DEPLOY_ID"
    sed -i "s|$DEPLOY_PLACEHOLDER|$DEPLOYMENT_ID|g" $deploy_file
fi

# get secrets from parameter store
SES_PASSWORD=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.password --with-decryption --query 'Parameters[0].Value')
export SES_PASSWORD=`echo $SES_PASSWORD | sed -e 's/^"//' -e 's/"$//'`
SES_USER=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.user --with-decryption --query 'Parameters[0].Value')
export SES_USER=`echo $SES_USER | sed -e 's/^"//' -e 's/"$//'`

# specify NODE_ENV based on deploy group ID
nginx_config=/var/www/biglotteryfund/config/server.conf
APP_ENV_PLACEHOLDER="APP_ENV"
APP_ENV="dev"

if [ "$APPLICATION_NAME" == "BLF_Test" ]
then
    APP_ENV="test"
elif [ "$APPLICATION_NAME" == "BLF_Live" ]
then
    APP_ENV="production"
fi

sed -i "s|$APP_ENV_PLACEHOLDER|$APP_ENV|g" $nginx_config

# configure nginx
rm -f /etc/nginx/sites-enabled/default
cp $nginx_config /etc/nginx/sites-enabled
service nginx restart