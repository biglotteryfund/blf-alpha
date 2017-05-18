#!/bin/bash
set -e

# get secrets from parameter store
SES_PASSWORD=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.password --with-decryption --query 'Parameters[0].Value')
SES_PASSWORD=`echo $SES_PASSWORD | sed -e 's/^"//' -e 's/"$//'`
SES_USER=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.user --with-decryption --query 'Parameters[0].Value')
SES_USER=`echo $SES_USER | sed -e 's/^"//' -e 's/"$//'`

# write secrets to file
destdir=/var/www/biglotteryfund/config/mail.json
touch $destdir
if [ -f "$destdir" ]
then
    echo "{ \"user\": \"$SES_USER\", \"password\": \"$SES_PASSWORD\" }" > "$destdir"
fi