#!/bin/bash
set -e

# get secrets from parameter store
SES_PASSWORD=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.password --with-decryption --query 'Parameters[0].Value')
export SES_PASSWORD=`echo $SES_PASSWORD | sed -e 's/^"//' -e 's/"$//'`
SES_USER=$(aws ssm get-parameters --region eu-west-1 --names ses.auth.user --with-decryption --query 'Parameters[0].Value')
export SES_USER=`echo $SES_USER | sed -e 's/^"//' -e 's/"$//'`

rm -f ~/.bash_profile
echo 'export SES_USER='$SES_USER >> ~/.bash_profile
echo 'export SES_PASSWORD='$SES_PASSWORD >> ~/.bash_profile