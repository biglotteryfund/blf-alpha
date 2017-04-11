#!/bin/bash
set -ev

destdir=./app/config/deploy.json
touch $destdir
if [ -f "$destdir" ]
then
    echo "{ \"buildNumber\": \"$TRAVIS_BUILD_NUMBER\", \"deployId\": \"DEPLOY_ID\" }" > "$destdir"
fi