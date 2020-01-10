#!/bin/bash
set -ev
#################################################
# Deploy information
#################################################
# Ran during Travis deploy step and later loaded
# via node so we have access to the build number
# and commit id for use in the app.

destdir=$TRAVIS_BUILD_DIR/config/deploy.json
touch "$destdir"
if [ -f "$destdir" ]
then
    echo "{ \"buildNumber\": \"$TRAVIS_BUILD_NUMBER\", \"deployId\": \"DEPLOY_ID\", \"commitId\": \"$TRAVIS_COMMIT\" }" > "$destdir"
fi
