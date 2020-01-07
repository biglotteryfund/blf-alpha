#!/bin/bash
set -e

# Change ownership of app directory to web user
chown -R www-data:www-data /var/www/biglotteryfund/

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

# Copy nginx config files to correct place
nginx_config=/var/www/biglotteryfund/deploy/nginx.conf
server_config=/var/www/biglotteryfund/deploy/server.conf

# Update NODE_ENV based on deploy group ID
APP_ENV_PLACEHOLDER="APP_ENV"
sed -i "s|$APP_ENV_PLACEHOLDER|$APP_ENV|g" $server_config

# Configure/start Cloudwatch agent with config file
cloudwatch_config_src=/var/www/biglotteryfund/deploy/cloudwatch-agent.json
sed -i "s|$APP_ENV_PLACEHOLDER|$APP_ENV|g" $cloudwatch_config_src

cloudwatch_config_dest=/opt/aws/amazon-cloudwatch-agent/bin/tnlcf.json
cp $cloudwatch_config_src $cloudwatch_config_dest
amazon-cloudwatch-agent-ctl -a fetch-config -c file:$cloudwatch_config_dest -s
amazon-cloudwatch-agent-ctl -a start

# Configure nginx / passenger
if [ ! -f /etc/nginx/modules-enabled/50-mod-http-passenger.conf ]; then ln -s /usr/share/nginx/modules-available/mod-http-passenger.load /etc/nginx/modules-enabled/50-mod-http-passenger.conf ; fi
ls /etc/nginx/conf.d/mod-http-passenger.conf
rm -f /etc/nginx/sites-enabled/default
cp $nginx_config /etc/nginx/conf.d
cp $server_config /etc/nginx/sites-enabled

service nginx restart
