#!/bin/bash
set -e

APP_ENV="development"
if [ "$APPLICATION_NAME" == "BLF_Test" ]
then
    APP_ENV="test"
elif [ "$APPLICATION_NAME" == "BLF_Live" ]
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

# Fetch secrets
/var/www/biglotteryfund/bin/get-secrets --environment=$APP_ENV

# Configure nginx
GzipDisabled="# gzip_types"
GzipEnabled="gzip_types"
sed -i "s|$GzipDisabled|$GzipEnabled|g" /etc/nginx/nginx.conf
nginx_config=/var/www/biglotteryfund/config/app/server.conf
rm -f /etc/nginx/sites-enabled/default
cp $nginx_config /etc/nginx/sites-enabled
