#!/bin/bash
set -e
#################################################
# AfterInstall / Bootstrap script
#################################################
# Run during the "AfterInstall" CodeDeploy phase

#################################################
# Permissions
#################################################

# Override default owner set in deploy artefact to web user
chown -R www-data:www-data /var/www/biglotteryfund/

#################################################
# App environment
#################################################
# Set app environment based on CodeDeploy group

DEV_FLEET="Dev_Fleet";
TEST_FLEET="Test_Fleet";
TEST_IN_PLACE="Test_In_Place";
LIVE_FLEET="Live_Fleet";
LIVE_IN_PLACE="Live_In_Place";

# Check if the deployment group name contains one of the above strings
APP_ENV="development"
if [[ $DEPLOYMENT_GROUP_NAME =~ $TEST_FLEET ]] ||
   [[ $DEPLOYMENT_GROUP_NAME =~ $TEST_IN_PLACE ]] ||
   [[ $DEPLOYMENT_GROUP_NAME =~ $DEV_FLEET ]];
then
    APP_ENV="test"
elif [[ $DEPLOYMENT_GROUP_NAME =~ $LIVE_FLEET ]] ||
     [[ $DEPLOYMENT_GROUP_NAME =~ $LIVE_IN_PLACE ]];
then
    APP_ENV="production"
fi

# Define placeholder string to be replaced
# with dynamic $APP_ENV value.
APP_ENV_PLACEHOLDER="APP_ENV"

#################################################
# Deploy manifest
#################################################
# deploy.json is created by Travis and contains
# the build number and commit ID for the app
# along with a DEPLOY_ID placeholder

deploy_file=/var/www/biglotteryfund/config/deploy.json
touch $deploy_file
if [ -f "$deploy_file" ]
then
    DEPLOY_PLACEHOLDER="DEPLOY_ID"
    sed -i "s|$DEPLOY_PLACEHOLDER|$DEPLOYMENT_ID|g" $deploy_file
fi

#################################################
# App secrets
#################################################
# Written to /etc/blf/parameters.json to
# be later loaded by the app.

/var/www/biglotteryfund/bin/get-secrets --environment=$APP_ENV

#################################################
# Configure CloudWatch agent
#################################################

# Configure/start Cloudwatch agent with config file
cloudwatch_config_src=/var/www/biglotteryfund/deploy/cloudwatch-agent.json
sed -i "s|$APP_ENV_PLACEHOLDER|$APP_ENV|g" $cloudwatch_config_src

cloudwatch_config_dest=/opt/aws/amazon-cloudwatch-agent/bin/tnlcf.json
cp $cloudwatch_config_src $cloudwatch_config_dest
amazon-cloudwatch-agent-ctl -a fetch-config -c file:$cloudwatch_config_dest -s
amazon-cloudwatch-agent-ctl -a start

#################################################
# Configure NGINX
#################################################

# Copy nginx config files to correct place
nginx_config=/var/www/biglotteryfund/deploy/nginx.conf
server_config=/var/www/biglotteryfund/deploy/server.conf

# Update NODE_ENV based on deploy group ID
sed -i "s|$APP_ENV_PLACEHOLDER|$APP_ENV|g" $server_config

# Configure nginx / passenger
if [ ! -f /etc/nginx/modules-enabled/50-mod-http-passenger.conf ]; then ln -s /usr/share/nginx/modules-available/mod-http-passenger.load /etc/nginx/modules-enabled/50-mod-http-passenger.conf ; fi
rm -f /etc/nginx/sites-enabled/default
cp $nginx_config /etc/nginx/conf.d
cp $server_config /etc/nginx/sites-enabled

service nginx restart
