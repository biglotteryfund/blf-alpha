#!/bin/bash

# store deployment ID in a JSON file
deploy_file=/var/www/biglotteryfund/config/deploy.json
touch $deploy_file
if [ -f "$deploy_file" ]
then
    DEPLOY_PLACEHOLDER="DEPLOY_ID"
    sed -i "s|$DEPLOY_PLACEHOLDER|$DEPLOYMENT_ID|g" $deploy_file
fi

# configure nginx (would be nice to conditionally restart here)
# do we need to do this every deploy?
rm /etc/nginx/sites-enabled/default
cp /var/www/biglotteryfund/config/server.conf /etc/nginx/sites-enabled
service nginx restart