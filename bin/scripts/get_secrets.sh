#!/bin/bash
set -e

# get secrets from parameter store

mkdir -p /etc/blf/;

secrets=/etc/blf/parameters.json
touch $secrets
if [ -f "$secrets" ]
then
    aws ssm get-parameters --region eu-west-1 --with-decryption --query 'Parameters' --names "ses.auth.password" "ses.auth.user" "twitter.auth.key" "twitter.auth.secret" "twitter.auth.token.key" "twitter.auth.token.secret" "mysql.host" "mysql.user" "mysql.password" "session.secret" > "$secrets"
fi