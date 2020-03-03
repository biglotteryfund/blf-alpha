#!/bin/bash
set -e
#################################################
# Prepare Deploy
#################################################
# This step creates a .zip file which is uploaded to S3
# and used by CodeDeploy as its deploy artefact

# Prune devDependencies from artefact
npm prune --production > /dev/null 2>&1;

# Store deploy metadata, later loaded via the app.
# DEPLOY_ID is a placeholder which is replaced with the
# CodeDeploy deployment ID as part of the bootstrap step.
destdir=$TRAVIS_BUILD_DIR/config/deploy.json
touch "$destdir"
if [ -f "$destdir" ]
then
    echo "{ \"buildNumber\": \"$TRAVIS_BUILD_NUMBER\", \"deployId\": \"DEPLOY_ID\", \"commitId\": \"$TRAVIS_COMMIT\" }" > "$destdir"
fi

# Bundle deploy artefact, excluding any unneeded files
zip -qr latest ./* -x .\* -x assets/\* -x cypress/\*;

# Store artefact locally for later use in Travis deploy step
mkdir -p dpl_cd_upload
mv latest.zip dpl_cd_upload/build-"$TRAVIS_BUILD_NUMBER".zip
