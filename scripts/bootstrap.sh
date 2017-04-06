#!/bin/bash

# store deployment ID in a JSON file
destdir=/var/www/biglotteryfund/config/deploy.json
touch $destdir
if [ -f "$destdir" ]
then
    echo "{ \"deploymentId\": \"$DEPLOYMENT_ID\" }" > "$destdir"
fi

# configure nginx (would be nice to conditionally restart here)
# do we need to do this every deploy?
rm /etc/nginx/sites-enabled/default
cp /var/www/biglotteryfund/config/server.conf /etc/nginx/sites-enabled
service nginx restart