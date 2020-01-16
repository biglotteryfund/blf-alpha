#!/bin/bash
set -e
#################################################
# AfterInstall / Provision script
#################################################
# Ran during the "AfterInstall" CodeDeploy phase

#################################################
# NGINX and Passenger
#################################################
# See nginx.conf and server.conf respectively

apt-get install -y dirmngr gnupg
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 561F9B9CAC40B2F7
apt-get install -y apt-transport-https ca-certificates
sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger bionic main > /etc/apt/sources.list.d/passenger.list'
apt-get update
apt-get install -y nginx-extras libnginx-mod-http-passenger

#################################################
# ClamAV
#################################################
# Used for virus scanning user uploads

apt-get install -y clamav clamav-daemon

# Initial update of antivirus databases
# We do this so that we can start clamav-daemon without an arbitrary `sleep`
wget -O /var/lib/clamav/main.cvd https://database.clamav.net/main.cvd && \
wget -O /var/lib/clamav/daily.cvd https://database.clamav.net/daily.cvd && \
wget -O /var/lib/clamav/bytecode.cvd https://database.clamav.net/bytecode.cvd

service clamav-daemon start
service clamav-daemon status

#################################################
# Node.js
#################################################

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt-get install -y nodejs

#################################################
# AWS CLI
#################################################
# Used to fetch secrets from parameter store

rm -rf awscli-bundle.zip awscli-bundle
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

#################################################
# CloudWatch agent
#################################################
# Used for log aggregation and server metrics
# See cloudwatch-agent.json for the config we use

wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb

#################################################
# Permissions
#################################################

# Override default owner set in deploy artefact to web user
chown -R www-data:www-data /var/www/biglotteryfund/

#################################################
# App environment
#################################################
# Set app environment based on CodeDeploy group

TEST_FLEET="Test_Fleet";
TEST_IN_PLACE="Test_In_Place";
LIVE_FLEET="Live_Fleet";
LIVE_IN_PLACE="Live_In_Place";

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

nginx_config=/var/www/biglotteryfund/deploy/nginx.conf
server_config=/var/www/biglotteryfund/deploy/server.conf

# Update NODE_ENV based on deploy group ID
APP_ENV_PLACEHOLDER="APP_ENV"
sed -i "s|$APP_ENV_PLACEHOLDER|$APP_ENV|g" $server_config

# Configure nginx / passenger
if [ ! -f /etc/nginx/modules-enabled/50-mod-http-passenger.conf ]; then ln -s /usr/share/nginx/modules-available/mod-http-passenger.load /etc/nginx/modules-enabled/50-mod-http-passenger.conf ; fi
rm -f /etc/nginx/sites-enabled/default
cp $nginx_config /etc/nginx/conf.d
cp $server_config /etc/nginx/sites-enabled

service nginx restart
