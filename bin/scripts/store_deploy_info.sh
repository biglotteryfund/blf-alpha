#!/bin/bash
set -ev

destdir=$TRAVIS_BUILD_DIR/config/deploy.json
touch $destdir
if [ -f "$destdir" ]
then
    echo "{ \"buildNumber\": \"$TRAVIS_BUILD_NUMBER\", \"deployId\": \"DEPLOY_ID\" }" > "$destdir"
fi

# create log file (@TODO improve this)
touch $TRAVIS_BUILD_DIR/logs/blf.log