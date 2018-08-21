#!/bin/bash
set -e

# Configure the patterns for the CodeDeploy deployment group names
TEST_FLEET="Test_Fleet";
TEST_IN_PLACE="Test_In_Place";
LIVE_FLEET="Live_Fleet";
LIVE_IN_PLACE="Live_In_Place";

# Check if the deployment group name contains one of the above strings
APP_ENV="development"
if [[ $DEPLOYMENT_GROUP_NAME =~ $TEST_FLEET ]] ||
   [[ $DEPLOYMENT_GROUP_NAME =~ $TEST_IN_PLACE ]];
then
    APP_ENV="test"
elif [[ $DEPLOYMENT_GROUP_NAME =~ $LIVE_FLEET ]] ||
     [[ $DEPLOYMENT_GROUP_NAME =~ $LIVE_IN_PLACE ]];
then
    APP_ENV="production"
fi

# Store deployment ID in a JSON file
deploy_file=/var/www/biglotteryfund/config/deploy.json
touch $deploy_file
if [ -f "$deploy_file" ]
then
    DEPLOY_PLACEHOLDER="DEPLOY_ID"
    sed -i "s|$DEPLOY_PLACEHOLDER|$DEPLOYMENT_ID|g" $deploy_file
fi

# Run environment var script to add them to the current shell
/var/www/biglotteryfund/bin/get-secrets --environment=$APP_ENV

# Update NODE_ENV based on deploy group ID
APP_ENV_PLACEHOLDER="APP_ENV"
nginx_config=/var/www/biglotteryfund/deploy/server.conf
sed -i "s|$APP_ENV_PLACEHOLDER|$APP_ENV|g" $nginx_config

# Configure nginx
rm -f /etc/nginx/sites-enabled/default
cp $nginx_config /etc/nginx/sites-enabled
service nginx restart
