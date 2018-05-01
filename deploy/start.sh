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

passenger start --daemonize --engine builtin --app-type node --environment $APP_ENV --startup-file /var/www/biglotteryfund/bin/www --address 127.0.0.1 --port 3000

service nginx restart
